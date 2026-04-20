from .deepgram import DeepgramSTTProvider
from .openai import OpenAISTTProvider

# Provider registry: maps provider name string to provider class
STT_REGISTRY = {
    "deepgram": DeepgramSTTProvider,
    "openai": OpenAISTTProvider,
}

__all__ = ["STT_REGISTRY", "DeepgramSTTProvider", "OpenAISTTProvider"]
