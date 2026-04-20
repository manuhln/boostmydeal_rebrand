from .eleven_labs import ElevenLabsTTSProvider
from .smallest_ai import SmallestAITTSProvider

# Provider registry: maps provider name string to provider class
TTS_REGISTRY = {
    "elevenlabs": ElevenLabsTTSProvider,
    "smallestai": SmallestAITTSProvider,
}

__all__ = [
    "TTS_REGISTRY",
    "CartesiaTTSProvider",
    "ElevenLabsTTSProvider",
    "OpenAITTSProvider",
    "SmallestAITTSProvider",
]
