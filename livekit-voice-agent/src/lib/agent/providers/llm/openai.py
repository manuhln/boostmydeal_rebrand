import logging

from models.models import CallConfig
from lib.agent.language import normalize_language_code

from ..base import LLMProvider

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gpt-4o-mini"
ALLOWED_MODELS = {"gpt-4o-mini", "gpt-4o", "gpt-5.4", "gpt-5.4-mini"}


class OpenAILLMProvider(LLMProvider):
    """OpenAI LLM provider for pipeline mode."""

    allowed_models = ALLOWED_MODELS

    def __init__(self, config: CallConfig, system_prompt: str) -> None:
        self.config = config
        self.system_prompt = system_prompt

    def build(self):
        from livekit.plugins import openai

        model = self.config.llm_model or DEFAULT_MODEL
        self._validate_model(model)

        try:
            temperature = float(self.config.temperature)
            if float(temperature) < 0.6 or float(temperature) > 1.2:
                temperature = 0.8
        except (TypeError, ValueError):
            temperature = 0.8

        logger.info(
            "Building OpenAI LLM | model=%s temperature=%s language=%s",
            model,
            temperature,
            normalize_language_code(self.config.language),
        )

        return openai.llm.LLM(
            model=model,
            temperature=temperature,
        )
