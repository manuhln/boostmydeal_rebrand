import logging

from models.models import CallConfig
from lib.agent.language import normalize_language_code

from ..base import TTSProvider

logger = logging.getLogger(__name__)

DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs "Rachel"
DEFAULT_MODEL_ID = "eleven_turbo_v2_5"

# ElevenLabs models available via LiveKit inference
ELEVENLABS_MODELS = {
    "eleven_multilingual_v2",
    "eleven_turbo_v2_5",
    "eleven_turbo_v2",
    "eleven_monolingual_v1",
}


class ElevenLabsTTSProvider(TTSProvider):
    allowed_models = ELEVENLABS_MODELS
    """ElevenLabs text-to-speech provider."""

    def __init__(self, config: CallConfig) -> None:
        self.config = config

    def build(self):
        from livekit.plugins import elevenlabs

        tts_cfg = self.config.tts
        voice_id = tts_cfg.voice_id or DEFAULT_VOICE_ID
        model_id = tts_cfg.model_id or DEFAULT_MODEL_ID
        self._validate_model(model_id)

        speed = self.config.agent_speed
        language = normalize_language_code(self.config.language)

        logger.info(
            "Building ElevenLabs TTS | model=%s voice=%s speed=%s language=%s",
            model_id,
            voice_id,
            speed,
            language,
        )

        return elevenlabs.TTS(
            model=model_id,
            voice_id=voice_id,
            streaming_latency=2,
        )
