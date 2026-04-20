import logging

from models.models import CallConfig

from ..base import LLMProvider

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-3-5-sonnet-20241022"
ALLOWED_MODELS = {
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
}


class AnthropicLLMProvider(LLMProvider):
    allowed_models = ALLOWED_MODELS
    """Anthropic LLM provider for pipeline mode."""

    def __init__(self, config: CallConfig, system_prompt: str) -> None:
        self.config = config
        self.system_prompt = system_prompt

    def build(self):
        from livekit.plugins import anthropic

        model = self.config.llm_model or self.config.model.name or DEFAULT_MODEL
        self._validate_model(model)

        try:
            temperature = float(self.config.temperature)
            if float(temperature) < 0 or float(temperature) > 1:
                temperature = 0.5
        except (TypeError, ValueError):
            temperature = 0.5

        logger.info(
            "Building Anthropic LLM | model=%s temperature=%s",
            model,
            temperature,
        )

        return anthropic.LLM(
            model=model,
            temperature=temperature,
        )
