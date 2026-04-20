from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class TTSConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider_name: str = Field(
        default="cartesia", description="TTS provider: 'eleven_labs', 'openai', 'cartesia', or 'smallest_ai'"
    )
    voice_id: str = Field(default="", description="Voice ID for the TTS provider")
    model_id: str = Field(
        default="sonic-3",
        description="Model ID for TTS",
    )


class STTConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    provider_name: str = Field(default="deepgram", description="STT provider: 'deepgram' or 'openai'")
    model: str = Field(
        default="nova-2",
        description="STT model to use",
    )


class ModelConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str = Field(default="gpt-4o-mini", description="LLM model name")


class CallConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    # Call routing
    to_phone: str = Field(..., description="Destination phone number in E.164 format")
    from_phone: str = Field(..., description="Twilio phone number in E.164 format")
    twilio_account_sid: str = Field(default="", description="Twilio account SID")
    twilio_auth_token: str = Field(default="", description="Twilio auth token")
    contact_name: str = Field(..., description="Name of the person being called")

    # Agent behavior
    agent_initial_message: str = Field(..., description="Initial message from agent")
    user_speak_first: bool = Field(default=False, description="If true, user speaks first")
    agent_prompt_preamble: str = Field(..., description="System prompt for the agent")
    agent_generate_responses: bool = Field(default=True, description="Enable agent responses")

    # Agent personality fields
    agent_identity: str = Field(default="", description="Agent identity/persona")
    agent_style: str = Field(default="", description="Communication style")
    agent_goal: str = Field(default="", description="Agent goal")
    agent_response_guideline: str = Field(default="", description="Response guidelines")
    agent_fallback: str = Field(default="", description="Fallback responses")

    # LLM configuration
    llm_provider: Optional[str] = Field(None, description="LLM provider (openai, anthropic, etc.)")
    llm_model: str = Field(default="gpt-4o-mini", description="LLM model name (top-level)")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="LLM temperature")
    language: str = Field(default="en-US", description="Regional language code")
    agent_speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Agent speaking speed")
    mode: str = Field(default="pipeline", description="Execution mode: 'pipeline' or 'realtime'")
    call_id: str = Field(..., description="Internal Laravel call id")
    tenant_id: str = Field(..., description="Tenant id for webhook fanout")

    # Nested config objects
    tts: TTSConfig = Field(default_factory=TTSConfig, description="Text-to-speech configuration")
    stt: STTConfig = Field(default_factory=STTConfig, description="Speech-to-text configuration")
    model: ModelConfig = Field(default_factory=ModelConfig, description="LLM model configuration")

    # Features
    enable_vad: bool = Field(default=True, description="Enable Voice Activity Detection")
    enable_interruptions: bool = Field(default=True, description="Enable interruptions")
    recording: bool = Field(default=True, description="Enable call recording")
    recording_format: str = Field(default="mp3", description="Recording format")
    recording_expiration_days: int = Field(default=30, ge=1, le=365, description="Recording URL expiration in days")
    voicemail: bool = Field(default=False, description="Enable voicemail detection")
    voicemail_message: Optional[str] = Field(default="", description="Message to leave on voicemail")
    enable_call_transfer: bool = Field(default=False, description="Enable call transfer to human agent")
    transfer_phone_number: Optional[str] = Field(default="", description="Phone number to transfer call to")
    enable_background_sound: bool = Field(default=False, description="Enable background sound")
    background_sound: str = Field(default="", description="Background sound identifier")
    remember_lead_preference: bool = Field(default=False, description="Remember lead preferences")
    use_knowledge_base: bool = Field(default=True, description="Enable knowledge base for RAG")
    knowledge_base_top_k: int = Field(default=3, ge=1, le=10, description="Number of knowledge base results")

    # Context
    current_date: Optional[str] = Field(None, description="Current date")
    current_time: Optional[str] = Field(None, description="Current time")
    previous_call_summary: Optional[str] = Field(None, description="Summary of previous call history")

    # Webhook & tags
    webhook_url: Optional[str] = Field(None, description="URL to send webhook events")
    webhook_secret: Optional[str] = Field(None, description="Shared secret to sign webhook events")
    user_tags: list[str] = Field(default_factory=list, description="User-defined tags")
    system_tags: list[str] = Field(default_factory=list, description="System-defined tags")

    # required
    livekit_sip_trunk_id: str = Field(description="LiveKit SIP trunk ID for outbound calls")

    # Deprecated/redundant top-level fields kept for backward compat
    style: Optional[str] = Field(None, description="Communication style (alias)")
    goal: Optional[str] = Field(None, description="Agent goal (alias)")
    response_guideline: Optional[str] = Field(None, description="Response guidelines (alias)")
    fallback: Optional[str] = Field(None, description="Fallback responses (alias)")

    keyboard_sound: bool = Field(default=False, description="Enable keyboard typing sound effects")


class CreateSIPTrunkRequest(BaseModel):
    name: str = Field(..., description="Name of the SIP trunk")
    phone_numbers: list[str] = Field(
        ...,
        description="List of phone numbers to associate with this SIP trunk (in E.164 format)",
    )
    auth_username: str = Field(..., description="Voxsun SIP username")
    auth_password: str = Field(..., description="Voxsun SIP password")
    address: str = Field(default="voxsun.net", description="Voxsun SIP domain")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Voxsun SIP Trunk",
                "phone_numbers": ["+14384760245"],
                "auth_username": "VoxSunai@voxsun.com",
                "auth_password": "password123",
                "address": "voxsun.net:5060",
            }
        }


class StartSIPCallRequest(BaseModel):
    """Request model for starting a SIP call to an existing room"""

    room: str = Field(..., description="LiveKit room name (conversation_id)")
    to_phone: str = Field(..., description="Destination phone number in E.164 format")
    from_phone: str = Field(..., description="Caller phone number in E.164 format")
    livekit_sip_trunk_id: str = Field(..., description="LiveKit SIP trunk ID")
    contact_name: str = Field(
        default="Customer", description="Name of the person being called"
    )
    user_speak_first: bool = Field(
        default=False, description="If true, user speaks first"
    )
    # Optional: Agent configuration (if provided, will be saved for agent worker)
    agent_initial_message: Optional[str] = Field(
        None, description="Initial greeting from agent"
    )
    agent_prompt_preamble: Optional[str] = Field(
        None, description="System prompt for agent"
    )
    tts_provider: Optional[str] = Field(
        None, description="TTS provider (eleven_labs, openai, etc.)"
    )
    tts_voice_id: Optional[str] = Field(None, description="TTS voice ID")
    stt_provider: Optional[str] = Field(
        None, description="STT provider (deepgram, openai, etc.)"
    )
    stt_model: Optional[str] = Field(None, description="STT model")
    llm_model: Optional[str] = Field(None, description="LLM model name")
    llm_api_key: Optional[str] = Field(None, description="LLM API key")
    llm_provider: Optional[str] = Field(
        None, description="LLM provider (openai, gemini_live, etc.)"
    )
    llm_voice: Optional[str] = Field(
        None, description="Voice for realtime providers (e.g., Puck for Gemini Live)"
    )
    voicemail_detection: Optional[bool] = Field(
        None, description="Enable voicemail detection"
    )
    voicemail_message: Optional[str] = Field(
        None, description="Message to leave on voicemail"
    )
    recording: Optional[bool] = Field(None, description="Enable call recording")
    webhook_url: Optional[str] = Field(
        None,
        description="Webhook URL for call status events (PHONE_CALL_CONNECTED, PHONE_CALL_ENDED, etc.)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "room": "voxsun-+15146676791-360a1b17",
                "to_phone": "+15146676791",
                "from_phone": "+14384760245",
                "livekit_sip_trunk_id": "ST_jcjARCs8wgzw",
                "contact_name": "John Doe",
                "user_speak_first": False,
                "agent_initial_message": "Hello, how can I help you today?",
                "agent_prompt_preamble": "You are a helpful customer service assistant.",
                "tts_provider": "eleven_labs",
                "tts_voice_id": "EXAVITQu4vr4xnSDxMaL",
                "stt_provider": "deepgram",
                "stt_model": "nova-2",
                "llm_model": "gpt-4o-mini",
                "voicemail_detection": False,
                "recording": True,
            }
        }
