import os
import qrcode
import cv2
import numpy as np
from PIL import Image
import json
import time
import uuid
import hashlib
import logging
from datetime import datetime

# Google Cloud Imports
from firestore_supabase_shim import db, firestore
from supabase_client import upload_to_supabase_storage

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TEMP_DIR = '/tmp/qr_codes'
os.makedirs(TEMP_DIR, exist_ok=True)
QR_VERSION = 3
QR_ERROR_CORRECTION = qrcode.constants.ERROR_CORRECT_H
QR_COLLECTION = 'qr_codes'
FORGERY_LOGS_COLLECTION = 'qr_forgery_logs'

# Shared Utilities
def upload_to_firebase_storage(file_data, file_name, content_type="image/png"):
    """Uploads a file to Supabase Storage and returns the public URL."""
    try:
        url = upload_to_supabase_storage(file_data, file_name, content_type)
        if url:
            return url
        else:
            return None
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        return None

def generate_unique_cdp(shape, intensity, qr_id):
    """Generates a unique CDP pattern based on the QR ID."""
    try:
        seed = int(hashlib.sha256(qr_id.encode()).hexdigest(), 16) % 10**8
        np.random.seed(seed)
        noise = np.random.randn(shape[0], shape[1])
        noise = (noise - noise.min()) / (noise.max() - noise.min())
        noise = cv2.GaussianBlur(noise, (7, 7), 0)
        pattern_hash = hashlib.sha256(noise.tobytes()).hexdigest()
        noise = noise * intensity
        return noise, pattern_hash
    except Exception as e:
        logger.error(f"CDP generation failed: {e}")
        raise

def apply_cdp_to_qr(qr_array: np.ndarray, cdp_pattern: np.ndarray, intensity: float) -> np.ndarray:
    """
    Apply the CDP pattern to the QR code with transparency blending.
    
    Args:
        qr_array (np.ndarray): The QR code array.
        cdp_pattern (np.ndarray): The CDP pattern array.
        intensity (float): The intensity of the CDP overlay.

    Returns:
        np.ndarray: The final QR code with the CDP pattern applied.
    """
    # Convert QR to RGBA
    qr_img = Image.fromarray(qr_array).convert("RGBA")
    
    # Normalize CDP pattern to 0–255 grayscale alpha channel
    cdp_norm = (cdp_pattern - cdp_pattern.min()) / (cdp_pattern.max() - cdp_pattern.min())
    alpha_channel = (cdp_norm * 255 * intensity).astype(np.uint8)
    
    # Create transparent CDP overlay image
    overlay = Image.new("RGBA", qr_img.size, (0, 0, 0, 0))
    overlay.putalpha(Image.fromarray(alpha_channel))

    # Blend the images
    final_img = Image.alpha_composite(qr_img, overlay)
    return np.array(final_img.convert("RGB"))  # Convert back for saving as PNG

def _calculate_security_level(intensity):
    """
    Minimal security level calculation based on intensity.
    """
    if intensity < 0.2:
        return 'low'
    elif intensity < 0.5:
        return 'medium'
    elif intensity < 0.8:
        return 'high'
    else:
        return 'ultra'

# QR Code Generation Functions
def generate_qr_with_cdp(data, intensity=0.2, metadata=None):
    """
    Enhanced QR code generation with forensic metadata and redirect URL tracking.
    """
    try:
        # Parse data for dynamic QRs
        if isinstance(data, dict) and 'url' in data:
            qr_data = data
        else:
            if not data or not isinstance(data, str):
                raise ValueError("Invalid QR data. Must provide a non-empty string.")
            qr_data = {'url': data}

        # Generate QR ID
        qr_id = f"QR_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        qr_data['id'] = qr_id
        
        # Create redirect URL for tracking
        redirect_url = f"https://crack-celerity-419510.uc.r.appspot.com/redirect/{qr_id}"
        
        # Store the original URL but generate QR with redirect URL
        original_url = qr_data['url']
        qr_data['original_url'] = original_url
        qr_data['url'] = redirect_url  # This is what gets encoded in the QR

        # Log the URLs
        logger.info(f"Generated QR {qr_id} with original URL: {original_url}")
        logger.info(f"Redirect URL for tracking: {redirect_url}")

        # Generate QR code with redirect URL directly
        qr = qrcode.QRCode(version=QR_VERSION, error_correction=QR_ERROR_CORRECTION, box_size=10, border=4)
        qr.add_data(redirect_url)  # Use redirect URL directly rather than the JSON string
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_array = np.array(qr_img)

        # Generate and apply CDP
        cdp, cdp_signature = generate_unique_cdp(qr_array.shape, intensity, qr_id)
        qr_with_cdp = apply_cdp_to_qr(qr_array, cdp, intensity)

        # Save QR code with CDP
        qr_filename = f"{qr_id}.png"
        output_path = os.path.join(TEMP_DIR, qr_filename)
        qr_final = Image.fromarray(qr_with_cdp)
        qr_final.save(output_path)

        # Upload to Firebase Storage
        with open(output_path, "rb") as qr_file:
            blob = bucket.blob(f"qr_codes/{qr_filename}")
            blob.upload_from_file(qr_file, content_type="image/png")
            blob.make_public()
            qr_url = blob.public_url

        # Enhanced Metadata Structure
        qr_metadata = {
            'qr_id': qr_id,
            'data': {
                'url': original_url,  # Store the original URL
                'redirect_url': redirect_url,  # Store the tracking URL
                'id': qr_id
            },
            'intensity': intensity,
            'cdp_signature': cdp_signature,
            'created_at': datetime.now().isoformat(),
            'qr_image_url': qr_url,
            
            # Minimal Forensic Metadata
            'forensic_profile': {
                'initial_risk_score': 0,
                'generation_method': 'dynamic_cdp',
                'security_level': _calculate_security_level(intensity)
            },
            
            # Scan Statistics Placeholder
            'scan_statistics': {
                'total_scans': 0,
                'unique_devices': [],
                'unique_locations': [],
                'first_scanned_at': None,
                'last_scanned_at': None
            }
        }

        # Merge additional metadata if provided
        if metadata:
            qr_metadata.update(metadata)

        # Store metadata in Firestore
        db.collection(QR_COLLECTION).document(qr_id).set(qr_metadata)
        logger.info(f"QR code metadata saved to Firestore with ID: {qr_id}")

        return {
            'qr_id': qr_id,
            'cdp_signature': cdp_signature,
            'qr_image_url': qr_url,
            'local_file_path': output_path
        }
    except Exception as e:
        logger.error(f"QR generation failed: {e}")
        raise ValueError(f"QR generation failed: {str(e)}")

def generate_self_scanning_qr(data, intensity=0.2, metadata=None, requires_biometric=False):
    """Generates a self-scanning QR code with additional metadata."""
    if metadata is None:
        metadata = {}
    metadata.update({
        'is_self_scanning': True,
        'requires_biometric': requires_biometric
    })
    return generate_qr_with_cdp(data, intensity, metadata)

# Firestore Metadata Functions
def list_generated_qr_codes(limit=50, offset=0):
    """Lists generated QR codes from Firestore."""
    try:
        qr_codes = []
        query = db.collection(QR_COLLECTION).order_by('created_at', direction=firestore.Query.DESCENDING)
        docs = list(query.limit(limit + offset).stream())
        if offset > 0:
            docs = docs[offset:offset + limit]
        else:
            docs = docs[:limit]
        for doc in docs:
            qr_codes.append(doc.to_dict())
        return qr_codes
    except Exception as e:
        logger.error(f"Error listing QR codes: {str(e)}")
        return []

def read_qr_metadata(qr_id):
    """Reads metadata for a specific QR code from Firestore."""
    try:
        doc_ref = db.collection(QR_COLLECTION).document(qr_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        logger.error(f"Error reading QR metadata: {str(e)}")
        return None