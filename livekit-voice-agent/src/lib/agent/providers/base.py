from abc import ABC, abstractmethod
from typing import Any, ClassVar

from livekit.agents import llm, stt, tts


class STTProvider(ABC):
    """Abstract base for all speech-to-text providers."""

    allowed_models: ClassVar[set[str]] = set()

    @abstractmethod
    async def build(self, audio_chunk: bytes) -> stt.STT:
        """Return a configured livekit STT instance."""
        ...

    def _validate_model(self, model: str) -> None:
        if self.allowed_models and model not in self.allowed_models:
            raise ValueError(
                f"Invalid model '{model}'. Allowed models: {sorted(self.allowed_models)}"
            )


class TTSProvider(ABC):
    """Abstract base for all text-to-speech providers."""

    allowed_models: ClassVar[set[str]] = set()
    allowed_voices: ClassVar[set[str]] = set()

    @abstractmethod
    async def build(self, text: str) -> tts.TTS:
        """Return a configured livekit TTS instance."""
        ...

    def _validate_model(self, model: str) -> None:
        if self.allowed_models and model not in self.allowed_models:
            raise ValueError(
                f"Invalid model '{model}'. Allowed models: {sorted(self.allowed_models)}"
            )

    def _validate_voice(self, voice: str) -> None:
        if self.allowed_voices and voice not in self.allowed_voices:
            raise ValueError(
                f"Invalid voice '{voice}'. Allowed voices: {sorted(self.allowed_voices)}"
            )


class LLMProvider(ABC):
    """Abstract base for all LLM providers (pipeline mode)."""

    allowed_models: ClassVar[set[str]] = set()

    @abstractmethod
    async def build(self, prompt: str) -> llm.LLM:
        """Return a configured livekit LLM instance."""
        ...

    def _validate_model(self, model: str) -> None:
        if self.allowed_models and model not in self.allowed_models:
            raise ValueError(
                f"Invalid model '{model}'. Allowed models: {sorted(self.allowed_models)}"
            )


class RealtimeLLMProvider(ABC):
    """Abstract base for realtime LLM providers (audio-in/audio-out, no STT/TTS needed)."""

    allowed_models: ClassVar[set[str]] = set()
    allowed_voices: ClassVar[set[str]] = set()

    @abstractmethod
    def build(self) -> Any:
        """Return a configured realtime LLM instance."""
        ...

    def _validate_model(self, model: str) -> None:
        if self.allowed_models and model not in self.allowed_models:
            raise ValueError(
                f"Invalid model '{model}'. Allowed models: {sorted(self.allowed_models)}"
            )

    def _validate_voice(self, voice: str) -> None:
        if self.allowed_voices and voice not in self.allowed_voices:
            raise ValueError(
                f"Invalid voice '{voice}'. Allowed voices: {sorted(self.allowed_voices)}"
            )
