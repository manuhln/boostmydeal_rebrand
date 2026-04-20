from __future__ import annotations


DEFAULT_LANGUAGE = "en-US"

LANGUAGE_NORMALIZATION_MAP = {
    "en": "en-US",
    "en_us": "en-US",
    "en_gb": "en-GB",
    "fr": "fr-FR",
    "fr_fr": "fr-FR",
    "es": "es-ES",
    "es_es": "es-ES",
}


def normalize_language_code(language: str | None) -> str:
    if not language:
        return DEFAULT_LANGUAGE

    normalized = language.replace("_", "-").strip()
    key = normalized.lower().replace("-", "_")

    if key in LANGUAGE_NORMALIZATION_MAP:
        return LANGUAGE_NORMALIZATION_MAP[key]

    return normalized
