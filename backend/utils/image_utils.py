"""
Image utility functions for QR code processing
Handles base64 conversion, image validation, and error handling
"""

import os
import base64
import logging
from typing import Optional
from PIL import Image
import io

logger = logging.getLogger(__name__)

def image_to_base64(file_path: str) -> Optional[str]:
    """
    Convert image file to base64 string with comprehensive error handling
    
    Args:
        file_path (str): Path to the image file
        
    Returns:
        Optional[str]: Base64 encoded string or None if conversion fails
    """
    try:
        # Validate file path
        if not file_path:
            logger.error("Empty file path provided")
            return None
            
        if not os.path.exists(file_path):
            logger.error(f"Image file not found: {file_path}")
            return None
            
        # Check file size (prevent loading huge files)
        file_size = os.path.getsize(file_path)
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"Image file too large: {file_size} bytes")
            return None
            
        # Read and encode file
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        logger.info(f"Successfully converted image to base64: {file_path} ({file_size} bytes)")
        return encoded_string
        
    except PermissionError:
        logger.error(f"Permission denied accessing file: {file_path}")
        return None
    except IOError as e:
        logger.error(f"IO error reading file {file_path}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error converting image to base64: {file_path}, error: {e}")
        return None

def validate_image_file(file_path: str) -> bool:
    """
    Validate if file is a valid image
    
    Args:
        file_path (str): Path to the image file
        
    Returns:
        bool: True if valid image, False otherwise
    """
    try:
        if not os.path.exists(file_path):
            return False
            
        with Image.open(file_path) as img:
            img.verify()  # Verify it's a valid image
            return True
            
    except Exception as e:
        logger.warning(f"Invalid image file {file_path}: {e}")
        return False

def get_image_info(file_path: str) -> Optional[dict]:
    """
    Get image information (dimensions, format, size)
    
    Args:
        file_path (str): Path to the image file
        
    Returns:
        Optional[dict]: Image info or None if error
    """
    try:
        if not os.path.exists(file_path):
            return None
            
        with Image.open(file_path) as img:
            return {
                'width': img.width,
                'height': img.height,
                'format': img.format,
                'mode': img.mode,
                'file_size': os.path.getsize(file_path)
            }
            
    except Exception as e:
        logger.error(f"Error getting image info for {file_path}: {e}")
        return None

def create_data_url(file_path: str, mime_type: str = "image/png") -> Optional[str]:
    """
    Create a complete data URL from image file
    
    Args:
        file_path (str): Path to the image file
        mime_type (str): MIME type for the data URL
        
    Returns:
        Optional[str]: Complete data URL or None if conversion fails
    """
    base64_data = image_to_base64(file_path)
    if base64_data:
        return f"data:{mime_type};base64,{base64_data}"
    return None

def safe_image_to_base64(file_path: str, fallback_message: str = "Image conversion failed") -> str:
    """
    Safe base64 conversion that always returns a string
    
    Args:
        file_path (str): Path to the image file
        fallback_message (str): Message to return if conversion fails
        
    Returns:
        str: Base64 string or fallback message
    """
    result = image_to_base64(file_path)
    return result if result is not None else fallback_message

# Utility function for QR code specific use case
def qr_image_to_data_url(file_path: str) -> Optional[str]:
    """
    Convert QR code image to data URL (PNG format)
    
    Args:
        file_path (str): Path to the QR code image
        
    Returns:
        Optional[str]: Complete data URL for QR image or None
    """
    return create_data_url(file_path, "image/png")