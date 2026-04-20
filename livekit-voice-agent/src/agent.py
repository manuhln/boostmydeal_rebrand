import json
import logging
import asyncio
import time
import uuid

from dotenv import load_dotenv
from livekit.agents import (
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    room_io,
)
from livekit import rtc
from livekit.plugins import silero
from livekit.plugins import ai_coustics
from livekit.agents import AutoSubscribe
from livekit.agents.llm import ChatMessage

from models.models import CallConfig
from lib.agent.session.session_builder import SessionBuilder
from lib.agent.session.prompt_builder import PromptBuilder
from lib.agent.features.configurator import FeatureConfigurator
from lib.agent.assistant import Assistant
from lib.agent.language import normalize_language_code
from lib.agent.recording import RoomRecordingManager
from dependencies import create_livekit_api

logger = logging.getLogger("worker")

load_dotenv(".env.local")

server = AgentServer()


class TranscriptTracker:
    def __init__(self) -> None:
        self.sequence = 0
        self._open_customer_segment_id: str | None = None
        self._last_customer_timestamp_ms = 0

    def next_customer_segment(self) -> tuple[str, int]:
        if self._open_customer_segment_id is None:
            self.sequence += 1
            self._open_customer_segment_id = f"segment_{uuid.uuid4().hex}"
        return self._open_customer_segment_id, self.sequence

    def finalize_customer_segment(self) -> None:
        self._open_customer_segment_id = None

    def next_agent_segment(self) -> tuple[str, int]:
        self.sequence += 1
        return f"segment_{uuid.uuid4().hex}", self.sequence

    def next_customer_timestamp(self) -> int:
        self._last_customer_timestamp_ms += 1
        return self._last_customer_timestamp_ms


def prewarm(proc: JobProcess) -> None:
    """
    Load heavy models once into process memory so each job starts fast.
    Add any other expensive imports/loads here (e.g. turn detector).
    """
    logger.info("Prewarming VAD...")
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("Prewarm complete")


server.setup_fnc = prewarm


# ---------------------------------------------------------------------------
# Config loader
# ---------------------------------------------------------------------------

def load_config(ctx: JobContext) -> CallConfig:
    """
    Parse CallConfig from the job's metadata string.

    The dispatch request from your FastAPI should set:
        metadata = json.dumps(call_config.model_dump())

    Raises ValueError with a clear message if metadata is missing or invalid.
    """
    raw = getattr(ctx.job, "metadata", None)
    if not raw:
        raise ValueError(
            "Job metadata is empty. "
            "Ensure your dispatch sets metadata=json.dumps(call_config.model_dump())"
        )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Job metadata is not valid JSON: {exc}") from exc

    try:
        config = CallConfig(**data)
    except Exception as exc:
        raise ValueError(f"CallConfig validation failed: {exc}") from exc

    logger.info(
        "CallConfig loaded | mode=%s to=%s contact=%s",
        config.mode,
        config.to_phone,
        config.contact_name,
    )
    return config


# ---------------------------------------------------------------------------
# Session entrypoint
# ---------------------------------------------------------------------------

@server.rtc_session(agent_name="voice-ai-agent")
async def session_handler(ctx: JobContext) -> None:
    ctx.log_context_fields = {"room": ctx.room.name}

    try:
        config = load_config(ctx)
    except ValueError as exc:
        logger.error("Failed to load CallConfig: %s", exc)
        return

    features = FeatureConfigurator(config)
    features.set_prewarmed_vad(ctx.proc.userdata.get("vad"))

    prompt = PromptBuilder(config).build()

    # ── Build session (STT/LLM/TTS or realtime) ────────────────────────────
    session: AgentSession = SessionBuilder(config).build()

    assistant = Assistant(
        instructions=prompt
    )

    room_options = room_io.RoomOptions(
        audio_input=room_io.AudioInputOptions(
            noise_cancellation=ai_coustics.audio_enhancement(
                model=ai_coustics.EnhancerModel.QUAIL_VF_L
            ),
        )
    )

    emitter = features.webhook_emitter()
    language = normalize_language_code(config.language)
    tracker = TranscriptTracker()
    call_started_at = time.time()
    lk_api = await create_livekit_api()
    recording = RoomRecordingManager(config, ctx.room.name)
    call_ended_emitted = False

    def emit_event(event_name: str, payload: dict) -> None:
        if not emitter:
            return

        asyncio.create_task(
            emitter.emit(event_name, {
                "event_id": f"evt_{uuid.uuid4().hex}",
                "call_id": config.call_id,
                "tenant_id": config.tenant_id,
                "room_name": ctx.room.name,
                "language": language,
                "occurred_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                **payload,
            })
        )

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(
        f"connected to room {ctx.room.name} with participant {participant.identity}")

    # ── Step 2: Start the session (initialises pipeline, warms models) ────
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_options=room_options,
    )
    logger.info("Session started")

    await recording.start(lk_api)

    emit_event("call.started", {
        "to_phone": config.to_phone,
        "from_phone": config.from_phone,
        "contact_name": config.contact_name,
        "mode": config.mode,
    })

    @session.on("user_input_transcribed")
    def _on_user_input_transcribed(event):
        segment_id, sequence = tracker.next_customer_segment()
        timestamp_ms = tracker.next_customer_timestamp()
        emit_event("call.transcript.segment", {
            "segment_id": segment_id,
            "sequence": sequence,
            "speaker": "customer",
            "content": event.transcript,
            "timestamp_ms": timestamp_ms,
            "is_final": event.is_final,
        })
        if event.is_final:
            tracker.finalize_customer_segment()

    @session.on("conversation_item_added")
    def _on_conversation_item_added(event):
        item = event.item
        if not isinstance(item, ChatMessage):
            return
        if item.role != "assistant":
            return
        content = item.text_content or ""
        if not content.strip():
            return

        segment_id, sequence = tracker.next_agent_segment()
        emit_event("call.transcript.segment", {
            "segment_id": segment_id,
            "sequence": sequence,
            "speaker": "agent",
            "content": content,
            "timestamp_ms": int((item.created_at - call_started_at) * 1000),
            "is_final": True,
        })

    @session.on("error")
    def _on_error(event):
        emit_event("call.error", {
            "message": str(event.error),
        }
        )

    if config.user_speak_first:
        logger.info("user_speak_first=True — agent waiting for user to speak")
    else:
        initial_message = config.agent_initial_message
        # small delay to ensure TTS is ready before saying anything
        await asyncio.sleep(0.5)
        if initial_message and initial_message.strip():
            logger.info("Sending initial message: %.80s", initial_message)
            # Realtime models use generate_reply() instead of say()
            if config.mode == "realtime":
                await session.generate_reply(
                    instructions=initial_message,
                    allow_interruptions=True,
                )
            else:
                await session.say(
                    initial_message,
                    allow_interruptions=True,
                )

    # Wait for session to close or room to disconnect
    done_fut = asyncio.Future()

    @ctx.room.on("participant_disconnected")
    def participant_disconnected(participant: rtc.Participant):
        nonlocal call_ended_emitted
        reason = participant.disconnect_reason
        if reason == rtc.DisconnectReason.USER_REJECTED:
            logger.info("Callee rejected the call")
        elif reason == rtc.DisconnectReason.USER_UNAVAILABLE:
            logger.info("Callee was unavailable")
        elif reason == rtc.DisconnectReason.SIP_TRUNK_FAILURE:
            logger.info("SIP trunk or protocol failure")
        else:
            logger.info(
                f"Callee disconnected: {rtc.DisconnectReason.Name(reason)}")

        emit_event("call.ended", {
            "to_phone": config.to_phone,
            "contact_name": config.contact_name,
            "duration_ms": int((time.time() - call_started_at) * 1000),
        })
        call_ended_emitted = True
        if not done_fut.done():
            done_fut.set_result(None)

    @session.on("close")
    def on_session_close():
        logger.info("Session closed")
        if not done_fut.done():
            done_fut.set_result(None)

    try:
        await done_fut

        if not call_ended_emitted:
            emit_event("call.ended", {
                "to_phone": config.to_phone,
                "contact_name": config.contact_name,
                "duration_ms": int((time.time() - call_started_at) * 1000),
            })

        emit_event("call.transcript.completed", {
            "duration_ms": int((time.time() - call_started_at) * 1000),
        })

        recording_result = await recording.stop(lk_api)
        if recording_result:
            emit_event("call.recording.completed", recording_result)
    finally:
        await lk_api.aclose()


if __name__ == "__main__":
    cli.run_app(server)
