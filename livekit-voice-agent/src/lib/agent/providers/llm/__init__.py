from .anthropic import AnthropicLLMProvider
from .openai import OpenAILLMProvider
from .openai_realtime import OpenAIRealtimeLLMProvider

# Provider registry: maps provider name string to provider class
LLM_REGISTRY = {
    "anthropic": AnthropicLLMProvider,
    "openai": OpenAILLMProvider,
}

REALTIME_LLM_REGISTRY = {
    "openai": OpenAIRealtimeLLMProvider,
}

__all__ = [
    "LLM_REGISTRY",
    "REALTIME_LLM_REGISTRY",
    "AnthropicLLMProvider",
    "OpenAILLMProvider",
    "OpenAIRealtimeLLMProvider",
]
