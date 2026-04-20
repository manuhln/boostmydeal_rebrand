import logging

from models.models import CallConfig
from lib.agent.language import normalize_language_code

from ..base import STTProvider

logger = logging.getLogger(__name__)

# Deepgram models available via LiveKit inference
DEEPGRAM_STT_MODELS = {"nova-2", "nova-2-phonecall", "nova-3", "nova-3-phonecall"}
DEFAULT_MODEL = "nova-3"


class DeepgramSTTProvider(STTProvider):
    allowed_models = DEEPGRAM_STT_MODELS
    """Deepgram speech-to-text provider."""

    def __init__(self, config: CallConfig) -> None:
        self.config = config

    def build(self):
        from livekit.plugins import deepgram

        stt_cfg = self.config.stt
        model = stt_cfg.model if stt_cfg.model else DEFAULT_MODEL
        self._validate_model(model)

        language = normalize_language_code(self.config.language)

        # Deepgram supports "multi" for multilingual detection
        lang_param = "multi" if language == "multi" else language

        logger.info(
            "Building Deepgram STT | model=%s language=%s",
            stt_cfg.model,
            lang_param,
        )

        return deepgram.STT(
            model=model,
            language=lang_param,
        )
