import logging

from models.models import CallConfig
from lib.agent.language import normalize_language_code

from ..base import STTProvider

logger = logging.getLogger(__name__)

# OpenAI Whisper models available via LiveKit inference
OPENAI_STT_MODELS = {"whisper-1", "gpt-4o-transcribe", "gpt-4o-mini-transcribe"}
DEFAULT_MODEL = "whisper-1"


class OpenAISTTProvider(STTProvider):
    """OpenAI Whisper speech-to-text provider."""

    allowed_models = OPENAI_STT_MODELS

    def __init__(self, config: CallConfig) -> None:
        self.config = config

    def build(self):
        from livekit.plugins import openai

        stt_cfg = self.config.stt
        model = stt_cfg.model if stt_cfg.model else DEFAULT_MODEL
        self._validate_model(model)

        language = normalize_language_code(self.config.language)

        logger.info("Building OpenAI STT | model=%s language=%s", model, language)

        return openai.STT(
            model=model,
            language=language,
        )
