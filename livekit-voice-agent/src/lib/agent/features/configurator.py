"""
FeatureConfigurator

Reads the feature flags in CallConfig and returns ready-to-use objects or
None for disabled features. The session builder calls the methods it needs;
the worker calls the ones that need room-level setup.

Feature ownership map:
  vad()                → session builder (pipeline only)
  noise_cancellation() → worker (RoomOptions.audio_input)
  call_transfer_tool() → session builder (inject as function_tool on Agent)
  knowledge_base()     → session builder / Agent (RAG retrieval)
  voicemail_handler()  → worker (post session.start hook)
  webhook_emitter()    → worker (event callbacks)
  recording_options()  → worker (LiveKit room recording config)
  background_sound()   → worker (room media track)
"""

import logging
from typing import Any, Optional

from models.models import CallConfig

logger = logging.getLogger(__name__)


class FeatureConfigurator:
    def __init__(self, config: CallConfig, ) -> None:
        self.c = config

    def vad(self) -> Optional[Any]:
        """
        Return a pre-warmed Silero VAD instance if enable_vad is True.

        In the worker's prewarm function, call:
            proc.userdata["vad"] = silero.VAD.load()

        Then pass proc.userdata["vad"] into FeatureConfigurator via
        set_prewarmed_vad() before calling build().
        """
        if not self.c.enable_vad:
            logger.info("VAD disabled")
            return None

        if hasattr(self, "_prewarmed_vad") and self._prewarmed_vad is not None:
            logger.info("VAD enabled (prewarmed)")
            return self._prewarmed_vad

        logger.warning("VAD enabled but no prewarmed instance — loading inline (slow)")
        from livekit.plugins import silero
        return silero.VAD.load()

    def set_prewarmed_vad(self, vad: Any) -> None:
        self._prewarmed_vad = vad

    # ------------------------------------------------------------------
    # Call transfer
    # ------------------------------------------------------------------

    def call_transfer_tool(self) -> Optional[Any]:
        """
        Return a function_tool callable that transfers the call to a human,
        or None if the feature is disabled.

        Attach to your Agent subclass::
            transfer = feature_cfg.call_transfer_tool()
            if transfer:
                agent.register_tool(transfer)

        The tool signals the LLM it can hand off the call. The actual SIP
        transfer is triggered via a LiveKit SIP API call.
        """
        if not self.c.enable_call_transfer:
            return None

        transfer_number = self.c.transfer_phone_number
        if not transfer_number:
            logger.warning("enable_call_transfer=True but transfer_phone_number is empty")
            return None

        from livekit.agents import function_tool, RunContext

        @function_tool
        async def transfer_to_human(context: RunContext) -> str:
            """
            Transfer the current call to a human agent.
            Use this when the user requests to speak with a human,
            or when the issue cannot be resolved by the AI assistant.
            """
            logger.info("Initiating call transfer to %s", transfer_number)
            try:
                # LiveKit SIP transfer — room name is available on context
                room = context.session.room
                await room.local_participant.perform_rpc(
                    destination_identity="sip-trunk",
                    method="transfer",
                    payload=transfer_number,
                )
                return f"I'm transferring you now. Please hold while I connect you."
            except Exception as exc:
                logger.error("Call transfer failed: %s", exc)
                return "I'm sorry, I was unable to transfer your call. Please try calling back directly."

        logger.info("Call transfer tool enabled | destination=%s", transfer_number)
        return transfer_to_human

    # ------------------------------------------------------------------
    # Knowledge base / RAG
    # ------------------------------------------------------------------

    def knowledge_base(self) -> Optional["KnowledgeBaseRetriever"]:
        """
        Return a KnowledgeBaseRetriever if use_knowledge_base is True,
        or None if disabled.

        The retriever is injected into the Agent and called before each
        LLM turn to augment the context with relevant documents.
        """
        if not self.c.use_knowledge_base:
            logger.info("Knowledge base disabled")
            return None

        logger.info(
            "Knowledge base enabled | top_k=%d",
            self.c.knowledge_base_top_k,
        )
        return KnowledgeBaseRetriever(
            top_k=self.c.knowledge_base_top_k,
        )

    def voicemail_config(self) -> Optional[dict]:
        if not self.c.voicemail:
            return None

        message = self.c.voicemail_message or ""
        logger.info("Voicemail detection enabled | message_len=%d", len(message))
        return {"enabled": True, "message": message}

    # ------------------------------------------------------------------
    # Recording
    # ------------------------------------------------------------------

    def recording_options(self) -> Optional[dict]:
        """
        Return a dict of recording params to pass to the LiveKit room
        recording API, or None if recording is disabled.
        """
        if not self.c.recording:
            return None

        opts = {
            "format": self.c.recording_format,
            "expiration_days": self.c.recording_expiration_days,
        }
        logger.info("Recording enabled | %s", opts)
        return opts

    # ------------------------------------------------------------------
    # Webhook
    # ------------------------------------------------------------------

    def webhook_emitter(self) -> Optional["WebhookEmitter"]:
        """
        Return a WebhookEmitter if webhook_url is configured, else None.
        """
        url = self.c.webhook_url
        if not url:
            return None

        logger.info("Webhook emitter enabled | url=%s", url)
        return WebhookEmitter(
            url=url,
            secret=self.c.webhook_secret,
            tags={
                "user_tags": self.c.user_tags,
                "system_tags": self.c.system_tags,
            },
        )

    # ------------------------------------------------------------------
    # Background sound
    # ------------------------------------------------------------------

    def background_sound(self) -> Optional[str]:
        """Return the background sound identifier if enabled, else None."""
        if not self.c.enable_background_sound:
            return None
        sound = self.c.background_sound
        if not sound:
            return None
        logger.info("Background sound enabled | sound=%s", sound)
        return sound


# ---------------------------------------------------------------------------
# Supporting classes
# ---------------------------------------------------------------------------


class KnowledgeBaseRetriever:
    """
    Thin wrapper around your RAG backend.

    Replace the body of `retrieve()` with your actual vector DB call
    (Pinecone, Weaviate, pgvector, etc.).
    """

    def __init__(self, top_k: int = 3) -> None:
        self.top_k = top_k

    async def retrieve(self, query: str) -> list[dict]:
        """
        Return a list of document dicts: [{"content": "...", "source": "..."}, ...]

        This is called from your Agent before each LLM turn::

            class Assistant(Agent):
                def __init__(self, retriever):
                    self.retriever = retriever

                async def on_user_turn_completed(self, turn_ctx, new_message):
                    if self.retriever:
                        docs = await self.retriever.retrieve(new_message.text_content)
                        if docs:
                            context_block = "\\n\\n".join(
                                f"[Source: {d['source']}]\\n{d['content']}" for d in docs
                            )
                            turn_ctx.add_message(
                                role="system",
                                content=f"Relevant context:\\n{context_block}",
                            )
                    await super().on_user_turn_completed(turn_ctx, new_message)
        """
        logger.debug("KB retrieve | query='%s' top_k=%d", query[:80], self.top_k)
        # TODO: replace with real vector DB call
        return []


class WebhookEmitter:
    """
    Fire-and-forget HTTP POST to webhook_url on key session events.

    Events to emit from the worker:
      call.started  — after session.start() and ctx.connect()
      call.ended    — in a finally block after the session ends
      call.transfer — when transfer_to_human tool is invoked
    """

    def __init__(self, url: str, secret: str | None, tags: dict) -> None:
        self.url = url
        self.secret = secret
        self.tags = tags

    async def emit(self, event: str, payload: dict) -> None:
        import httpx
        import json
        import hmac
        import hashlib

        body = {"event": event, "tags": self.tags, **payload}
        logger.info("Webhook emit | event=%s url=%s", event, self.url)
        try:
            raw_body = json.dumps(body, separators=(",", ":"), sort_keys=True)
            headers = {"Content-Type": "application/json"}
            if self.secret:
                headers["X-Webhook-Signature"] = hmac.new(
                    self.secret.encode(),
                    raw_body.encode(),
                    hashlib.sha256,
                ).hexdigest()

            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.post(self.url, content=raw_body, headers=headers)
                resp.raise_for_status()
        except Exception as exc:
            # Webhooks must never crash the agent
            logger.warning("Webhook failed | event=%s error=%s", event, exc)
