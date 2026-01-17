"""
Video Storage Service

Handles video file uploads, storage, streaming, and metadata management.
"""

import os
import aiofiles
from pathlib import Path
from typing import Optional, BinaryIO
from fastapi import UploadFile
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.logging import get_logger
from app.utils.validators import validate_file_extension, validate_file_size, sanitize_filename
from app.middleware.error_handler import ValidationError, NotFoundError

logger = get_logger(__name__)


class VideoService:
    """Service for managing video storage and streaming."""

    def __init__(self):
        self.storage_path = Path(settings.VIDEO_STORAGE_PATH)
        self._ensure_storage_directory()

    def _ensure_storage_directory(self):
        """Ensure video storage directory exists."""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Video storage directory: {self.storage_path}")

    def get_video_path(self, component: str, filename: str) -> Path:
        """
        Get full path for a video file.

        Args:
            component: Component name (e.g., 'transact', 'infinity')
            filename: Video filename

        Returns:
            Full path to video file
        """
        component_dir = self.storage_path / sanitize_filename(component)
        component_dir.mkdir(parents=True, exist_ok=True)
        return component_dir / sanitize_filename(filename)

    async def validate_upload(self, file: UploadFile) -> tuple[bool, Optional[str]]:
        """
        Validate video file upload.

        Args:
            file: Uploaded file

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Validate file extension
        if not validate_file_extension(file.filename, settings.VIDEO_ALLOWED_FORMATS):
            return False, f"File type not allowed. Allowed types: {', '.join(settings.VIDEO_ALLOWED_FORMATS)}"

        # Get file size
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        # Validate file size
        is_valid, error_msg = validate_file_size(file_size, settings.VIDEO_MAX_SIZE_MB)
        if not is_valid:
            return False, error_msg

        return True, None

    async def save_video(
        self,
        file: UploadFile,
        component: str,
        filename: Optional[str] = None
    ) -> dict:
        """
        Save uploaded video file.

        Args:
            file: Uploaded file
            component: Component name
            filename: Custom filename (optional, uses original if not provided)

        Returns:
            Dictionary with file information

        Raises:
            ValidationError: If file validation fails
        """
        # Validate upload
        is_valid, error_msg = await self.validate_upload(file)
        if not is_valid:
            raise ValidationError(error_msg)

        # Use custom filename or original
        if filename:
            final_filename = sanitize_filename(filename)
        else:
            final_filename = sanitize_filename(file.filename)

        # Get video path
        video_path = self.get_video_path(component, final_filename)

        # Save file
        try:
            async with aiofiles.open(video_path, 'wb') as out_file:
                # Read and write in chunks
                chunk_size = settings.VIDEO_CHUNK_SIZE
                while chunk := await file.read(chunk_size):
                    await out_file.write(chunk)

            logger.info(f"Saved video: {video_path}")

            # Get file stats
            file_size = video_path.stat().st_size

            return {
                "filename": final_filename,
                "component": component,
                "path": str(video_path),
                "size": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2)
            }

        except Exception as e:
            logger.error(f"Error saving video: {e}")
            # Clean up partial file if it exists
            if video_path.exists():
                video_path.unlink()
            raise

    async def delete_video(self, component: str, filename: str) -> bool:
        """
        Delete a video file.

        Args:
            component: Component name
            filename: Video filename

        Returns:
            True if deleted, False if not found
        """
        video_path = self.get_video_path(component, filename)

        if not video_path.exists():
            return False

        try:
            video_path.unlink()
            logger.info(f"Deleted video: {video_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting video: {e}")
            raise

    def video_exists(self, component: str, filename: str) -> bool:
        """
        Check if video file exists.

        Args:
            component: Component name
            filename: Video filename

        Returns:
            True if exists, False otherwise
        """
        video_path = self.get_video_path(component, filename)
        return video_path.exists()

    def get_video_info(self, component: str, filename: str) -> dict:
        """
        Get video file information.

        Args:
            component: Component name
            filename: Video filename

        Returns:
            Dictionary with video information

        Raises:
            NotFoundError: If video not found
        """
        video_path = self.get_video_path(component, filename)

        if not video_path.exists():
            raise NotFoundError(f"Video not found: {filename}")

        stats = video_path.stat()

        return {
            "filename": filename,
            "component": component,
            "path": str(video_path),
            "size": stats.st_size,
            "size_mb": round(stats.st_size / (1024 * 1024), 2),
            "modified": stats.st_mtime
        }

    async def stream_video(
        self,
        component: str,
        filename: str,
        range_header: Optional[str] = None
    ) -> StreamingResponse:
        """
        Stream video file with support for HTTP range requests.

        Args:
            component: Component name
            filename: Video filename
            range_header: HTTP Range header value

        Returns:
            Streaming response

        Raises:
            NotFoundError: If video not found
        """
        video_path = self.get_video_path(component, filename)

        if not video_path.exists():
            raise NotFoundError(f"Video not found: {filename}")

        file_size = video_path.stat().st_size
        start = 0
        end = file_size - 1

        # Parse range header
        if range_header:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else end

        # Calculate content length
        content_length = end - start + 1

        # Define async generator for streaming
        async def iterfile():
            async with aiofiles.open(video_path, mode='rb') as f:
                await f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk_size = min(settings.VIDEO_CHUNK_SIZE, remaining)
                    chunk = await f.read(chunk_size)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        # Determine content type
        content_type = self._get_content_type(filename)

        # Create response headers
        headers = {
            "Content-Length": str(content_length),
            "Content-Type": content_type,
            "Accept-Ranges": "bytes",
        }

        # Add range header if partial content
        status_code = 200
        if range_header:
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            status_code = 206

        logger.debug(f"Streaming video: {filename} (bytes {start}-{end}/{file_size})")

        return StreamingResponse(
            iterfile(),
            status_code=status_code,
            headers=headers,
            media_type=content_type
        )

    def _get_content_type(self, filename: str) -> str:
        """
        Get content type for video file.

        Args:
            filename: Video filename

        Returns:
            Content type string
        """
        extension = Path(filename).suffix.lower()
        content_types = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".mov": "video/quicktime",
            ".avi": "video/x-msvideo",
        }
        return content_types.get(extension, "application/octet-stream")

    def list_videos(self, component: Optional[str] = None) -> list:
        """
        List all videos or videos for a specific component.

        Args:
            component: Component name (optional)

        Returns:
            List of video information dictionaries
        """
        videos = []

        if component:
            # List videos for specific component
            component_dir = self.storage_path / sanitize_filename(component)
            if component_dir.exists():
                for video_path in component_dir.glob("*"):
                    if video_path.is_file():
                        stats = video_path.stat()
                        videos.append({
                            "filename": video_path.name,
                            "component": component,
                            "size": stats.st_size,
                            "size_mb": round(stats.st_size / (1024 * 1024), 2),
                            "modified": stats.st_mtime
                        })
        else:
            # List all videos from all components
            for component_dir in self.storage_path.iterdir():
                if component_dir.is_dir():
                    comp_name = component_dir.name
                    for video_path in component_dir.glob("*"):
                        if video_path.is_file():
                            stats = video_path.stat()
                            videos.append({
                                "filename": video_path.name,
                                "component": comp_name,
                                "size": stats.st_size,
                                "size_mb": round(stats.st_size / (1024 * 1024), 2),
                                "modified": stats.st_mtime
                            })

        return videos


# Global video service instance
video_service = VideoService()
