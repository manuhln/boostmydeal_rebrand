"""
PromptBuilder

Assembles a clean system prompt from the scattered personality and context
fields in CallConfig. Single source of truth for everything that goes into
the LLM's instructions — no prompt construction anywhere else.

Field priority (highest → lowest):
  agent_*     — the canonical fields sent by current Laravel versions
  aliases     — style / goal / response_guideline / fallback (deprecated top-level)
  empty str   — silently skipped
"""

import logging
from typing import Optional

from models.models import CallConfig
from lib.agent.language import normalize_language_code

logger = logging.getLogger(__name__)


class PromptBuilder:
    def __init__(self, config: CallConfig) -> None:
        self.c = config

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build(self) -> str:
        """Return the fully assembled system prompt string."""
        sections: list[str] = []

        self._add(sections, self._preamble())
        self._add(sections, self._identity())
        self._add(sections, self._goal())
        self._add(sections, self._style())
        self._add(sections, self._response_guideline())
        self._add(sections, self._fallback())
        self._add(sections, self._language_instruction())
        self._add(sections, self._call_context())
        self._add(sections, self._previous_call_summary())
        self._add(sections, self._datetime())

        prompt = "\n\n".join(sections)
        logger.debug("Built system prompt (%d chars)", len(prompt))
        return prompt

    # ------------------------------------------------------------------
    # Section builders
    # ------------------------------------------------------------------

    def _preamble(self) -> Optional[str]:
        return self.c.agent_prompt_preamble or None

    def _identity(self) -> Optional[str]:
        value = self.c.agent_identity
        if not value:
            return None
        return f"## Identity\n{value}"

    def _goal(self) -> Optional[str]:
        # agent_goal takes priority; fall back to deprecated top-level alias
        value = self.c.agent_goal or self.c.goal or ""
        if not value:
            return None
        return f"## Goal\n{value}"

    def _style(self) -> Optional[str]:
        value = self.c.agent_style or self.c.style or ""
        if not value:
            return None
        return f"## Communication style\n{value}"

    def _response_guideline(self) -> Optional[str]:
        value = self.c.agent_response_guideline or self.c.response_guideline or ""
        if not value:
            return None
        return f"## Response guidelines\n{value}"

    def _fallback(self) -> Optional[str]:
        value = self.c.agent_fallback or self.c.fallback or ""
        if not value:
            return None
        return f"## Fallback behaviour\n{value}"

    def _language_instruction(self) -> Optional[str]:
        lang = normalize_language_code(self.c.language)
        if lang == "en-US":
            return None
        return (
            f"## Language\n"
            f"Respond in the regional language '{lang}'. "
            f"If the user switches languages, follow them."
        )

    def _call_context(self) -> Optional[str]:
        parts: list[str] = []
        if self.c.contact_name:
            parts.append(f"- You are speaking with: {self.c.contact_name}")
        if self.c.to_phone:
            parts.append(f"- Their phone number: {self.c.to_phone}")
        if not parts:
            return None
        return "## Call context\n" + "\n".join(parts)

    def _previous_call_summary(self) -> Optional[str]:
        summary = self.c.previous_call_summary
        if not summary:
            return None
        return (
            "## Previous conversation summary\n"
            "The following is a summary of your previous interaction with this contact. "
            "Use it to maintain continuity — do not repeat information the contact already knows.\n\n"
            f"{summary}"
        )

    def _datetime(self) -> Optional[str]:
        parts: list[str] = []
        if self.c.current_date:
            parts.append(f"- Today's date: {self.c.current_date}")
        if self.c.current_time:
            parts.append(f"- Current time: {self.c.current_time}")
        if not parts:
            return None
        return "## Current date/time\n" + "\n".join(parts)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _add(sections: list[str], value: Optional[str]) -> None:
        if value and value.strip():
            sections.append(value.strip())
