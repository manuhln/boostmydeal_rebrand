from fastapi import APIRouter, Depends, HTTPException
from livekit import api
from src.models.models import CreateSIPTrunkRequest
from src.dependencies import get_livekit_api, verify_api_key
from livekit.protocol.sip import CreateSIPOutboundTrunkRequest, SIPOutboundTrunkInfo, DeleteSIPTrunkRequest

import asyncio

router = APIRouter(prefix="/sip-trunks", tags=["sip-trunks"])


@router.post("/add")
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
    finally:
        if lk_api:
            await lk_api.aclose()

@router.get("/delete/{trunk_id}")
async def delete_sip_trunk(trunk_id: str, api_key: str = Depends(verify_api_key), lk_api: api.LiveKitAPI = Depends(get_livekit_api)):
    """
    Delete a SIP outbound trunk in LiveKit
    """
    try:
        await lk_api.sip.delete_sip_outbound_trunk(DeleteSIPTrunkRequest(sip_trunk_id=trunk_id))
        return {"message": f"SIP trunk {trunk_id} deleted successfully", "trunk_id": trunk_id}
    except api.TwirpError as e:
        raise HTTPException(status_code=e.code, detail=f"LiveKit API error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if lk_api:
            await lk_api.aclose()