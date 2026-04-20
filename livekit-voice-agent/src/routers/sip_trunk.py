from fastapi import APIRouter, Depends, HTTPException
from livekit import api
from models.models import CreateSIPTrunkRequest
from dependencies import get_livekit_api, verify_api_key
from livekit.protocol.sip import CreateSIPOutboundTrunkRequest, SIPOutboundTrunkInfo, DeleteSIPTrunkRequest
import logging

import asyncio

router = APIRouter(prefix="/sip-trunks", tags=["sip-trunks"])

logger = logging.getLogger(__name__)

@router.post("/add/outbound")
async def create_sip_trunk(request_data: CreateSIPTrunkRequest, api_key: str = Depends(verify_api_key), lk_api: api.LiveKitAPI = Depends(get_livekit_api)):
    """
    Create a SIP outbound trunk in LiveKit
    """
    try:
        trunk = SIPOutboundTrunkInfo(
            name=request_data.name,
            address=request_data.address,
            numbers=request_data.phone_numbers,
            auth_username=request_data.auth_username,
            auth_password=request_data.auth_password,
        )
        request = CreateSIPOutboundTrunkRequest(trunk=trunk)
        result = await lk_api.sip.create_sip_outbound_trunk(request)
        logger.info(f"LiveKit result: {result}")
        return {
            "trunk_id": result.sip_trunk_id,
            "name": result.name,
            # "numbers": result.numbers
        }
    except api.TwirpError as e:
        logger.error(f"LiveKit API error: {e.message}")
        raise HTTPException(status_code=e.code, detail={
            "error": f"LiveKit API error: {e.message}",
            "phone_numbers": request_data.phone_numbers,
        })
    except Exception as e:
        logger.error(f"Error creating SIP trunk: {str(e)}")
        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "phone_numbers": request_data.phone_numbers,
        })


@router.post("/update/outbound/{trunk_id}")
async def update_sip_trunk(trunk_id: str, request_data: CreateSIPTrunkRequest, api_key: str = Depends(verify_api_key), lk_api: api.LiveKitAPI = Depends(get_livekit_api)):
    """
    Update a SIP outbound trunk in LiveKit
    """
    try:
        trunk = SIPOutboundTrunkInfo(
            name=request_data.name,
            address=request_data.address,
            numbers=request_data.phone_numbers,
            auth_username=request_data.auth_username,
            auth_password=request_data.auth_password,
        )
        request = CreateSIPOutboundTrunkRequest(trunk=trunk)
        result = await lk_api.sip.update_sip_outbound_trunk(trunk_id=trunk_id, trunk=trunk)

        return {
            "trunk_id": result.trunk_id,
            "name": result.name,
            "numbers": result.numbers
        }
    except api.TwirpError as e:
        raise HTTPException(status_code=e.code, detail={
            "error": f"LiveKit API error: {e.message}",
            "phone_numbers": request_data.phone_numbers,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "phone_numbers": request_data.phone_numbers,
        })


@router.get("/delete/{trunk_id}")
async def delete_sip_trunk(trunk_id: str, api_key: str = Depends(verify_api_key), lk_api: api.LiveKitAPI = Depends(get_livekit_api)):
    """
    Delete a SIP outbound trunk in LiveKit
    """
    try:
        await lk_api.sip.delete_sip_outbound_trunk(DeleteSIPTrunkRequest(sip_trunk_id=trunk_id))
        return {"message": f"SIP trunk {trunk_id} deleted successfully", "trunk_id": trunk_id}
    except api.TwirpError as e:
        raise HTTPException(status_code=e.code,
                            detail=f"LiveKit API error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
