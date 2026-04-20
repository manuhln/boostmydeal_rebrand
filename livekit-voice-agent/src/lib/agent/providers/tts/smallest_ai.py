import logging

from models.models import CallConfig
from lib.agent.language import normalize_language_code

from ..base import TTSProvider

logger = logging.getLogger(__name__)

DEFAULT_VOICE_ID = "emily"
DEFAULT_MODEL_ID = "lightning"

# SmallestAI models available via LiveKit inference
SMALLESTAI_MODELS = {"lightning", "lightning-flash", "medium", "slow"}
SMALLESTAI_VOICES = {"emily", "ethan", "ella", "jorge", "rachel", "adam", "thomas"}


class SmallestAITTSProvider(TTSProvider):
    allowed_models = SMALLESTAI_MODELS
    allowed_voices = SMALLESTAI_VOICES
    """SmallestAI text-to-speech provider."""

    def __init__(self, config: CallConfig) -> None:
        self.config = config

    def build(self):
        from livekit.plugins import smallestai

        tts_cfg = self.config.tts
        voice_id = tts_cfg.voice_id or DEFAULT_VOICE_ID
        model_id = tts_cfg.model_id or DEFAULT_MODEL_ID
        self._validate_model(model_id)
        self._validate_voice(voice_id)

        speed = self.config.agent_speed
        language = normalize_language_code(self.config.language)

        logger.info(
            "Building SmallestAI TTS | model=%s voice=%s speed=%s language=%s",
            model_id,
            voice_id,
            speed,
            language,
        )

        return smallestai.TTS(
            model=model_id,
            voice_id=voice_id,
        )
