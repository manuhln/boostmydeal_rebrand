import asyncio
import logging
from typing import Optional

from livekit.agents import Agent, RunContext, function_tool

from .features.configurator import KnowledgeBaseRetriever

logger = logging.getLogger(__name__)


class Assistant(Agent):

    def __init__(
        self,
        instructions: str,
    ) -> None:
        super().__init__(
            instructions=instructions,
        )
        
    @function_tool
    async def detected_answering_machine(self):
        """Call this tool if you have detected a voicemail system, AFTER hearing the voicemail greeting"""
        await self.session.generate_reply(
            instructions="Leave a voicemail message letting the user know you'll call back later."
        )
        await asyncio.sleep(0.5)
        # await hangup_call()