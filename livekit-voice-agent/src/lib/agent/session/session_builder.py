"""
SessionBuilder

The single place that reads CallConfig.mode and wires together the correct
combination of STT + LLM + TTS + features into a LiveKit AgentSession.

Nothing outside this module should branch on `mode` or instantiate providers.
"""

import logging
from typing import Any

from models.models import CallConfig
from .prompt_builder import PromptBuilder
from ..providers.stt import STT_REGISTRY
from ..providers.tts import TTS_REGISTRY
from ..providers.llm import LLM_REGISTRY, REALTIME_LLM_REGISTRY
from ..features.configurator import FeatureConfigurator

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Fallback provider defaults when CallConfig fields are missing
# ------------------------------------------------------------------
DEFAULT_STT_PROVIDER = "deepgram"
DEFAULT_TTS_PROVIDER = "cartesia"
DEFAULT_LLM_PROVIDER = "openai"
DEFAULT_REALTIME_PROVIDER = "openai"


class SessionBuilder:
    """
    Build a fully configured AgentSession from a CallConfig.
    """

    def __init__(self, config: CallConfig) -> None:
        self.config = config
        self.features = FeatureConfigurator(config)

    def build(self):
        prompt = PromptBuilder(self.config).build()
        mode = self.config.mode

        logger.info("Building session | mode=%s", mode)

        if mode == "realtime":
            return self._build_realtime(prompt)

        return self._build_pipeline(prompt)

    def _build_pipeline(self, prompt: str):
        from livekit.agents import AgentSession, TurnHandlingOptions, PreemptiveGenerationOptions, EndpointingOptions, InterruptionOptions

        stt = self._resolve_stt()
        llm = self._resolve_llm(prompt)
        tts = self._resolve_tts()
        vad = self.features.vad()

        logger.info(
            "Pipeline session | stt=%s llm=%s tts=%s vad=%s",
            self.config.stt.provider_name,
            self.config.llm_provider or DEFAULT_LLM_PROVIDER,
            self.config.tts.provider_name,
            "enabled" if vad else "disabled",
        )

        session_kwargs: dict[str, Any] = dict(
            stt=stt,
            llm=llm,
            tts=tts,
            turn_handling=TurnHandlingOptions(
                turn_detection="vad",
                preemptive_generation=PreemptiveGenerationOptions(
                    enabled=True,
                    preemptive_tts=True,
                    max_speech_duration=10,
                    max_retries=3
                ),
                endpointing=EndpointingOptions(
                    mode="dynamic",
                    min_delay=0.5,
                    max_delay=2.0,
                ),
                interruption=InterruptionOptions(
                    enabled=True,
                    mode="adaptive",
                    min_duration=0.3,
                    false_interruption_timeout=1.0,
                    resume_false_interruption=True,
                    min_words=0
                )
            ),
            ivr_detection=True
        )

        if vad is not None:
            session_kwargs["vad"] = vad

        return AgentSession(**session_kwargs)

    # ------------------------------------------------------------------
    # Realtime session  (audio-in/audio-out LLM, no STT/TTS)
    # ------------------------------------------------------------------

    def _build_realtime(self, prompt: str):
        from livekit.agents import AgentSession

        llm = self._resolve_realtime_llm(prompt)

        logger.info(
            "Realtime session | provider=%s",
            self.config.llm_provider or DEFAULT_REALTIME_PROVIDER,
        )

        return AgentSession(llm=llm)

    # ------------------------------------------------------------------
    # Provider resolution helpers
    # ------------------------------------------------------------------

    def _resolve_stt(self):
        provider_name = self.config.stt.provider_name or DEFAULT_STT_PROVIDER
        cls = STT_REGISTRY.get(provider_name)
        if cls is None:
            raise ValueError(
                f"Unknown STT provider '{provider_name}'. "
                f"Available: {list(STT_REGISTRY.keys())}"
            )
        return cls(self.config).build()

    def _resolve_tts(self):
        provider_name = self.config.tts.provider_name or DEFAULT_TTS_PROVIDER
        cls = TTS_REGISTRY.get(provider_name)
        if cls is None:
            raise ValueError(
                f"Unknown TTS provider '{provider_name}'. "
                f"Available: {list(TTS_REGISTRY.keys())}"
            )
        return cls(self.config).build()

    def _resolve_llm(self, prompt: str):
        # llm_provider is the canonical field; fall back to sniffing llm_model prefix
        provider_name = self.config.llm_provider or self._infer_llm_provider()
        cls = LLM_REGISTRY.get(provider_name)
        if cls is None:
            raise ValueError(
                f"Unknown LLM provider '{provider_name}'. "
                f"Available: {list(LLM_REGISTRY.keys())}"
            )
        return cls(self.config, prompt).build()

    def _resolve_realtime_llm(self, prompt: str):
        provider_name = self.config.llm_provider or DEFAULT_REALTIME_PROVIDER
        cls = REALTIME_LLM_REGISTRY.get(provider_name)
        if cls is None:
            raise ValueError(
                f"Unknown realtime LLM provider '{provider_name}'. "
                f"Available: {list(REALTIME_LLM_REGISTRY.keys())}"
            )
        return cls(self.config, prompt).build()
    # ------------------------------------------------------------------
    # Inference helpers
    # ------------------------------------------------------------------

    def _infer_llm_provider(self) -> str:
        """
        Best-effort: sniff the provider from the model name string.
        e.g. "gpt-4o-mini" → "openai", "claude-*" → "anthropic"
        Falls back to DEFAULT_LLM_PROVIDER.
        """
        model = (self.config.llm_model or self.config.model.name or "").lower()
        if model.startswith("gpt") or model.startswith("o1") or model.startswith("o3"):
            return "openai"
        if model.startswith("claude"):
            return "anthropic"
        logger.warning(
            "Could not infer LLM provider from model name '%s', defaulting to '%s'",
            model,
            DEFAULT_LLM_PROVIDER,
        )
        return DEFAULT_LLM_PROVIDER