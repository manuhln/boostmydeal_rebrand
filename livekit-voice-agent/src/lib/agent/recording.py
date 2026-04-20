from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

from livekit import api
from livekit.protocol import egress

from models.models import CallConfig

logger = logging.getLogger(__name__)

EGRESS_COMPLETE = egress.EgressStatus.Value("EGRESS_COMPLETE")
EGRESS_FAILED = egress.EgressStatus.Value("EGRESS_FAILED")
EGRESS_ABORTED = egress.EgressStatus.Value("EGRESS_ABORTED")

FILE_TYPE_BY_FORMAT = {
    "mp3": egress.EncodedFileType.Value("MP3"),
    "ogg": egress.EncodedFileType.Value("OGG"),
    "mp4": egress.EncodedFileType.Value("MP4"),
}


class RoomRecordingManager:
    def __init__(self, config: CallConfig, room_name: str) -> None:
        self.config = config
        self.room_name = room_name
        self.egress_id: str | None = None
        self.object_key = f"calls/{config.tenant_id}/{config.call_id}/recording.{self._format()}"

    def enabled(self) -> bool:
        return bool(self.config.recording)

    async def start(self, lk_api: api.LiveKitAPI) -> None:
        if not self.enabled():
            return

        try:
            request = egress.RoomCompositeEgressRequest(
                room_name=self.room_name,
                audio_only=True,
                file_outputs=[self._file_output()],
            )
            info = await lk_api.egress.start_room_composite_egress(request)
            self.egress_id = info.egress_id
            logger.info("Started room recording | room=%s egress_id=%s",
                        self.room_name, self.egress_id)
        except Exception:
            logger.exception(
                "Failed to start room recording | room=%s", self.room_name)

    async def stop(self, lk_api: api.LiveKitAPI) -> dict[str, Any] | None:
        if not self.enabled() or not self.egress_id:
            return None

        try:
            info = await lk_api.egress.stop_egress(
                egress.StopEgressRequest(egress_id=self.egress_id)
            )
        except Exception:
            logger.exception(
                "Failed to stop room recording | room=%s egress_id=%s", self.room_name, self.egress_id)
            return None

        info = await self._wait_for_terminal_state(lk_api, info)
        if info.status not in {EGRESS_COMPLETE, EGRESS_FAILED, EGRESS_ABORTED}:
            return None

        if info.status != EGRESS_COMPLETE:
            logger.warning(
                "Room recording did not complete successfully | room=%s egress_id=%s status=%s error=%s",
                self.room_name,
                self.egress_id,
                egress.EgressStatus.Name(info.status),
                info.error,
            )
            return None

        file_result = info.file_results[0] if info.file_results else None
        file_info = info.file
        duration_seconds = 0
        file_size = 0
        location = self.object_key

        if file_result is not None:
            duration_seconds = int(round(file_result.duration / 1000))
            file_size = int(file_result.size)
            if file_result.location:
                location = file_result.location
        elif file_info is not None:
            duration_seconds = int(round(file_info.duration / 1000))
            file_size = int(file_info.size)
            file_location = getattr(file_info, "location", None) or getattr(
                file_info, "filepath", None)
            if file_location:
                location = file_location

        return {
            "egress_id": self.egress_id,
            "disk": "minio",
            "object_key": self.object_key,
            "storage_location": location,
            "format": self._format(),
            "mime_type": self._mime_type(),
            "duration_seconds": duration_seconds,
            "file_size": file_size,
        }

    async def _wait_for_terminal_state(
        self,
        lk_api: api.LiveKitAPI,
        info: egress.EgressInfo,
    ) -> egress.EgressInfo:
        for _ in range(20):
            if info.status in {EGRESS_COMPLETE, EGRESS_FAILED, EGRESS_ABORTED}:
                return info

            await asyncio.sleep(1)
            response = await lk_api.egress.list_egress(
                egress.ListEgressRequest(egress_id=self.egress_id or "")
            )
            if response.items:
                info = response.items[0]

        return info

    def _file_output(self) -> egress.EncodedFileOutput:
        return egress.EncodedFileOutput(
            file_type=FILE_TYPE_BY_FORMAT.get(
                self._format(), egress.EncodedFileType.Value("MP3")),
            filepath=self.object_key,
            s3=egress.S3Upload(
                access_key=os.getenv("STORAGE_ACCESS_KEY"),
                secret=os.getenv("STORAGE_SECRET_KEY"),
                region=os.getenv("STORAGE_REGION", "auto"),
                endpoint=os.getenv("STORAGE_ENDPOINT"),
                bucket=os.getenv("STORAGE_BUCKET"),
                force_path_style=True,
            ),
        )

    def _format(self) -> str:
        configured_format = (self.config.recording_format or "mp3").lower()
        if configured_format in FILE_TYPE_BY_FORMAT:
            return configured_format

        logger.warning(
            "Unsupported recording format '%s'; falling back to mp3", configured_format)
        return "mp3"

    def _mime_type(self) -> str:
        return {
            "mp3": "audio/mpeg",
            "ogg": "audio/ogg",
            "mp4": "audio/mp4",
        }.get(self._format(), "audio/mpeg")
