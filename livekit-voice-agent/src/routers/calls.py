import json
import os
import uuid
from typing import Dict, Any
import secrets

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from livekit import api
from livekit.protocol.sip import CreateSIPParticipantRequest, SIPParticipantInfo

from src.dependencies import verify_api_key, get_livekit_api
from src.models.models import CallConfig, StartSIPCallRequest

load_dotenv(".env.local")

router = APIRouter(
    prefix="/calls", tags=["calls"], dependencies=[Depends(verify_api_key)]
)


@router.post("/outbound", response_model=Dict[str, Any])
async def start_outbound_call(
    call_config: CallConfig, lk_api: api.LiveKitAPI = Depends(get_livekit_api)
):
    """
    Start an outbound SIP call with AI agent.

    This endpoint:
    1. Creates a dispatch request for the agent (which also creates the room)
    2. Creates a SIP participant to make the actual call
    3. Returns the call ID and room name for tracking
    """
    try:
        room_name = f"call-{secrets.token_hex(16)}"

        # Step 1: Create dispatch request with agent configuration metadata
        metadata_dict = call_config.model_dump(mode="json")
        metadata_json = json.dumps(metadata_dict)

        await lk_api.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name="livekit-voice-agent", room=room_name, metadata=metadata_json
            )
        )

        # Step 2: Create SIP participant to make the actual call
        participant_identity = f"sip-{secrets.token_hex(16)}"
        sip_request = CreateSIPParticipantRequest(
            sip_trunk_id=call_config.livekit_sip_trunk_id,
            sip_call_to=call_config.to_phone,
            room_name=room_name,
            participant_identity=participant_identity,
            participant_name=call_config.contact_name,
            wait_until_answered=False,
            play_ringtone=True,
            hide_phone_number=False,
            participant_attributes={
                "contact_name": call_config.contact_name,
                "from_phone": call_config.from_phone,
                "to_phone": call_config.to_phone,
            },
        )

        participant_info: SIPParticipantInfo = await lk_api.sip.create_sip_participant(
            sip_request
        )

        call_id = participant_info.sip_call_id

        return {
            "call_id": call_id,
            "room_name": room_name,
            "to_phone": call_config.to_phone,
            "from_number": call_config.from_phone,
            "participant_id": participant_info.participant_id,
            "participant_identity": participant_info.participant_identity,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to initiate outbound call: {str(e)}"
        )
