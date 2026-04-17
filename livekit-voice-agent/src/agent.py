import json
import logging

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    room_io,
)
from livekit.plugins import ai_coustics, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

AGENT_MODEL = "openai/gpt-5.3-chat-latest"


class Assistant(Agent):
    def __init__(self, instructions: str | None = None) -> None:
        default_instructions = """You are a helpful voice AI assistant. The user is interacting with you via voice, even if you perceive the conversation as text.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor."""

        super().__init__(
            instructions=instructions or default_instructions,
        )

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="livekit-voice-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Parse metadata for agent configuration
    try:
        metadata = json.loads(ctx.job.metadata) if ctx.job.metadata else {}
        logger.info(f"Parsed job metadata: {list(metadata.keys())}")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse job metadata: {e}")
        metadata = {}

    # Build agent instructions from metadata
    instructions_parts = []
    if metadata.get("agent_prompt_preamble"):
        instructions_parts.append(metadata["agent_prompt_preamble"])
    if metadata.get("style"):
        instructions_parts.append(f"Communication Style: {metadata['style']}")
    if metadata.get("goal"):
        instructions_parts.append(f"Goal: {metadata['goal']}")
    if metadata.get("response_guideline"):
        instructions_parts.append(
            f"Response Guidelines: {metadata['response_guideline']}"
        )
    if metadata.get("fallback"):
        instructions_parts.append(f"Fallback Responses: {metadata['fallback']}")
    if metadata.get("previous_call_summary"):
        instructions_parts.append(
            f"Previous Call Context: {metadata['previous_call_summary']}"
        )
    if metadata.get("current_date"):
        instructions_parts.append(f"Date: {metadata['current_date']}")
    if metadata.get("current_time"):
        instructions_parts.append(f"Time: {metadata['current_time']}")

    instructions = "\n\n".join(instructions_parts) if instructions_parts else None
    logger.info(
        f"Agent instructions: {len(instructions) if instructions else 0} characters"
    )

    # Get model configurations from metadata
    llm_model = metadata.get("llm_model", "openai/gpt-4o-mini")
    stt_config = metadata.get("stt", {})
    stt_provider = stt_config.get("provider_name", "deepgram")
    stt_model = stt_config.get("model", "nova-2")
    stt_language = metadata.get("language", "multi")

    tts_config = metadata.get("tts", {})
    tts_provider = tts_config.get("provider_name", "cartesia")
    tts_model = tts_config.get("model_id", "sonic-3")
    tts_voice = tts_config.get("voice_id", "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc")

    # Build model identifiers
    stt_model_id = (
        f"{stt_provider}/{stt_model}"
        if stt_provider != "deepgram"
        else f"deepgram/{stt_model}"
    )
    tts_model_id = (
        f"{tts_provider}/{tts_model}"
        if tts_provider != "cartesia"
        else "cartesia/sonic-3"
    )

    logger.info(
        f"Model configuration - LLM: {llm_model}, STT: {stt_model_id}, TTS: {tts_model_id}"
    )

    # VAD configuration
    use_vad = metadata.get("enable_vad", True)
    vad = ctx.proc.userdata["vad"] if use_vad else None

    # Set up a voice AI pipeline using configurable models
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=inference.STT(model=stt_model_id, language=stt_language),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=inference.LLM(model=llm_model),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=inference.TTS(model=tts_model_id, voice=tts_voice),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=vad,
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(instructions=instructions),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
