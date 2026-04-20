import logging

from models.models import CallConfig

from ..base import RealtimeLLMProvider

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gpt-4o-realtime-preview"

# Maps our voice_id string to OpenAI realtime voice names
# OpenAI realtime voices: alloy, echo, fable, onyx, nova, shimmer, verse, ballad, ash, coral, sage, marin
ALLOWED_VOICES = {
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
    "verse",
    "ballad",
    "ash",
    "coral",
    "sage",
    "marin",
}
ALLOWED_MODELS = {"gpt-4o-realtime-preview", "gpt-4o-mini-realtime-preview"}
DEFAULT_VOICE = "marin"


class OpenAIRealtimeLLMProvider(RealtimeLLMProvider):
    allowed_models = ALLOWED_MODELS
    allowed_voices = ALLOWED_VOICES
    """
    OpenAI Realtime LLM provider.

    In realtime mode there is no separate STT/TTS — the model handles
    audio input and output natively. voice_id in the TTS config is
    repurposed as the realtime voice name.
    """

    def __init__(self, config: CallConfig, system_prompt: str) -> None:
        self.config = config
        self.system_prompt = system_prompt

    def build(self):
        from livekit.plugins import openai

        model = self.config.llm_model or self.config.model.name or DEFAULT_MODEL
        self._validate_model(model)

        # Reuse tts.voice_id as the realtime voice; fall back to default
        voice = self.config.tts.voice_id or DEFAULT_VOICE
        self._validate_voice(voice)

        try:
            temperature = float(self.config.temperature)
            if float(temperature) < 0.6 or float(temperature) > 1.2:
                temperature = 0.8
        except (TypeError, ValueError):
            temperature = 0.8

        logger.info(
            "Building OpenAI Realtime LLM | model=%s voice=%s temperature=%s",
            model,
            voice,
            temperature,
        )

        return openai.realtime.RealtimeModel(
            model=model,
            voice=voice,
            temperature=temperature,
            instructions=self.system_prompt,
        )
