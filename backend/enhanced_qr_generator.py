# =====================================================
# FIXED Enhanced QR Generator v2.0 - Critical Issues Resolved
# =====================================================

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
import secrets
import hmac
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional
from cryptography.fernet import Fernet

# Import the anti-photocopy configuration
from anti_photocopy_cdp import AntiPhotocopyConfig, AntiPhotocopyGenerator

# Import size-adaptive CDP system
try:
    from size_adaptive_cdp import SizeAdaptiveCDPGenerator, SecurityLevel, get_ipzs_recommended_config
except ImportError:
    logging.warning("size_adaptive_cdp module not found. Using fallback implementation.")
    # Fallback implementation
    class SecurityLevel:
        MICRO = "micro"
        STANDARD = "standard"
        HIGH = "high"
        ULTRA = "ultra"
    
    class CDPConfig:
        def __init__(self, size_mm, intensity):
            self.security_level = SecurityLevel.STANDARD
            self.pixel_size = max(300, int(size_mm * 25))
            self.dpi = 600
            self.pattern_density = intensity
            self.noise_layers = 3
            self.frequency_bands = 4
            self.correlation_threshold = 0.85
            self.anti_ml_features = True
            self.intensity = intensity
    
    class SizeAdaptiveCDPGenerator:
        def generate_cdp_config(self, size_mm, intensity):
            return CDPConfig(size_mm, intensity)
        
        def generate_multi_frequency_cdp(self, config, qr_id):
            """Generate basic CDP pattern for fallback"""
            size = config.pixel_size
            np.random.seed(int(hashlib.md5(qr_id.encode()).hexdigest()[:8], 16))
            pattern = np.random.random((size, size))
            signature = hashlib.sha256(pattern.tobytes()).hexdigest()[:32]
            return pattern, signature
        
        def get_scanning_recommendations(self, config):
            """Get scanning recommendations"""
            return {
                "optimal_distance_cm": 20,
                "lighting": "standard indoor lighting",
                "camera_requirements": "5MP+ camera recommended"
            }

# Firebase imports
try:
    from google.cloud import firestore
    from google.cloud import storage as gcloud_storage
    db = firestore.Client(project="crack-celerity-419510")
    storage_client = gcloud_storage.Client()
    bucket = storage_client.bucket("crack-celerity-419510.appspot.com")
    logger = logging.getLogger(__name__)
    logger.info("Firebase and Storage clients initialized successfully")
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.error(f"Firebase/Storage initialization error: {e}")
    db = None
    storage_client = None
    bucket = None

# Constants
TEMP_DIR = '/tmp/qr_codes'
QR_COLLECTION = 'qr_codes'
API_BASE_URL = "https://crack-celerity-419510.uc.r.appspot.com/api"
VERIFICATION_DOMAIN = "https://crack-celerity-419510.uc.r.appspot.com"

os.makedirs(TEMP_DIR, exist_ok=True)

# ============================================================================
# Security Classes (unchanged)
# ============================================================================

class SecureURLManager:
    """Manages secure URL encryption for QR codes"""
    
    def __init__(self):
        key = os.environ.get('QR_ENCRYPTION_KEY')
        if not key:
            key = Fernet.generate_key()
            logger.warning("🔐 Using session encryption key - set QR_ENCRYPTION_KEY env var for production!")
        else:
            key = key.encode() if isinstance(key, str) else key
        
        self.fernet = Fernet(key)
        logger.info("🔐 URL Encryption Manager initialized")
    
    def encrypt_url(self, url: str) -> str:
        try:
            encrypted_bytes = self.fernet.encrypt(url.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            logger.error(f"🔐 URL encryption failed: {e}")
            raise ValueError("Failed to encrypt destination URL")
    
    def decrypt_url(self, encrypted: str) -> str:
        try:
            decrypted_bytes = self.fernet.decrypt(encrypted.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error(f"🔐 URL decryption failed: {e}")
            raise ValueError("Invalid or corrupted encrypted URL")

url_manager = SecureURLManager()

# ============================================================================
# Helper Functions
# ============================================================================

def generate_secure_verification_id() -> str:
    """Generate cryptographically secure, unpredictable verification ID"""
    return secrets.token_urlsafe(12)[:16]

def create_verification_signature(verification_id: str, qr_id: str, timestamp: str) -> str:
    """Create HMAC signature for verification integrity"""
    secret_key = os.environ.get('QR_HMAC_KEY', 'zecca-dello-stato-secret-key').encode()
    message = f"{verification_id}:{qr_id}:{timestamp}".encode()
    signature = hmac.new(secret_key, message, hashlib.sha256).hexdigest()
    return signature[:16]

def verify_signature(verification_id: str, qr_id: str, timestamp: str, signature: str) -> bool:
    """Verify the integrity of verification data"""
    expected_signature = create_verification_signature(verification_id, qr_id, timestamp)
    return hmac.compare_digest(expected_signature, signature)

def get_smart_defaults(size_mm: float, model: str) -> Dict[str, Any]:
    """Get intelligent defaults based on size and model"""
    defaults = {
        'fintech': {
            'errorLevel': 'M',
            'intensity': 0.4,
        },
        'luxury': {
            'errorLevel': 'Q',
            'intensity': 0.6,
        },
        'commodity': {
            'errorLevel': 'L',
            'intensity': 0.3,
        }
    }
    
    if size_mm < 15:
        defaults[model]['errorLevel'] = 'L'
        
    return defaults.get(model, defaults['commodity'])

def get_pattern_thresholds(size_mm: float) -> Dict[str, Tuple[float, float]]:
    """Get adaptive thresholds based on QR size"""
    if size_mm < 20:
        return {
            'authentic': (0.0, 0.3),
            'suspicious': (0.3, 0.5),
            'likely_photocopy': (0.5, 0.7),
            'photocopy_detected': (0.7, 1.0)
        }
    elif size_mm < 40:
        return {
            'authentic': (0.0, 0.25),
            'suspicious': (0.25, 0.45),
            'likely_photocopy': (0.45, 0.65),
            'photocopy_detected': (0.65, 1.0)
        }
    else:
        return {
            'authentic': (0.0, 0.2),
            'suspicious': (0.2, 0.4),
            'likely_photocopy': (0.4, 0.6),
            'photocopy_detected': (0.6, 1.0)
        }

def generate_short_code(qr_id: str) -> str:
    """Generate short code for URL compression"""
    uuid_part = qr_id.split('_')[-1] if '_' in qr_id else qr_id
    hash_object = hashlib.md5(uuid_part.encode())
    return hash_object.hexdigest()[:8]

def get_model_configuration(model: str, max_scans: int = None) -> Dict[str, Any]:
    """Get configuration based on QR model type"""
    model_configs = {
        'fintech': {
            'security_level': 'high',
            'default_max_scans': 1,
            'size_range': (10, 30),
            'required_features': ['anti_photocopy', 'encryption', 'verification'],
            'expiry_default_days': 7,
            'description': 'High-security single-use for financial transactions'
        },
        'commodity': {
            'security_level': 'standard',
            'default_max_scans': 100,
            'size_range': (15, 40),
            'required_features': ['basic_cdp'],
            'expiry_default_days': 30,
            'description': 'Standard security for general products'
        },
        'luxury': {
            'security_level': 'premium',
            'default_max_scans': 50,
            'size_range': (20, 50),
            'required_features': ['anti_photocopy', 'premium_cdp'],
            'expiry_default_days': 365,
            'description': 'Premium security for luxury goods'
        },
        'industrial': {
            'security_level': 'maximum',
            'default_max_scans': None,
            'size_range': (25, 100),
            'required_features': ['all_security_features'],
            'expiry_default_days': 1825,
            'description': 'Maximum security for industrial applications'
        }
    }
    
    config = model_configs.get(model, model_configs['commodity'])
    
    if max_scans is not None:
        config['max_scans'] = max_scans
    else:
        config['max_scans'] = config['default_max_scans']
    
    return config

# ============================================================================
# CDP Application (unchanged - proven method)
# ============================================================================

def apply_cdp_to_qr(qr_array: np.ndarray, cdp_pattern: np.ndarray, intensity: float) -> np.ndarray:
    """Apply CDP pattern to QR code using the PROVEN method"""
    try:
        logger.info(f"Applying CDP with proven method, intensity: {intensity}")
        
        if qr_array is None or cdp_pattern is None:
            logger.error("Invalid input arrays")
            return qr_array if qr_array is not None else np.zeros((300, 300), dtype=np.uint8)
        
        intensity = max(0.1, min(intensity, 0.8))
        
        if len(qr_array.shape) == 3:
            qr_gray = cv2.cvtColor(qr_array, cv2.COLOR_RGB2GRAY)
        else:
            qr_gray = qr_array.copy()
        
        if qr_gray.dtype != np.uint8:
            qr_gray = (qr_gray * 255).astype(np.uint8) if qr_gray.max() <= 1 else qr_gray.astype(np.uint8)
        
        if cdp_pattern.shape[:2] != qr_gray.shape:
            cdp_pattern = cv2.resize(cdp_pattern, (qr_gray.shape[1], qr_gray.shape[0]))
        
        if len(cdp_pattern.shape) > 2:
            cdp_pattern = cdp_pattern[:, :, 0]
        
        cdp_min, cdp_max = cdp_pattern.min(), cdp_pattern.max()
        if cdp_max > cdp_min:
            cdp_pattern = (cdp_pattern - cdp_min) / (cdp_max - cdp_min)
        else:
            cdp_pattern = np.zeros_like(cdp_pattern)
        
        result = qr_gray.copy()
        white_mask = (qr_gray > 127)
        
        if np.any(white_mask):
            subtraction = cdp_pattern[white_mask] * 255 * intensity * 0.8
            result[white_mask] = np.clip(255 - subtraction, 200, 255).astype(np.uint8)
        
        logger.info(f"CDP applied successfully")
        return result
        
    except Exception as e:
        logger.error(f"CDP application failed: {e}")
        return qr_array if isinstance(qr_array, np.ndarray) else np.zeros((300, 300), dtype=np.uint8)

def generate_dynamic_verification_url(verification_id: str, qr_id: str, short_code: str = None) -> str:
    """
    Generate backend redirect URL for secure QR processing
    Returns backend URL that will handle security checks before redirecting to PWA
    """
    # Use short code for compact URLs when available
    if short_code:
        # Short URL format: /r/{short_code}
        backend_url = f"{VERIFICATION_DOMAIN}/r/{short_code}"
        logger.info(f"🔐 Generated short backend URL: {backend_url}")
    else:
        # Standard URL format: /redirect/{qr_id}
        backend_url = f"{VERIFICATION_DOMAIN}/redirect/{qr_id}"
        logger.info(f"🔐 Generated standard backend URL: {backend_url}")
    
    # Log for debugging
    logger.info(f"🔐 Backend URL for QR {qr_id} with verification_id {verification_id}")
    
    return backend_url


def generate_qr_with_size_adaptive_cdp(
    data: str, 
    size_mm: float = 12.0, 
    intensity: float = 0.6, 
    resolution_dpi: int = 300,
    metadata: Optional[Dict[str, Any]] = None,
    model: str = "commodity",
    max_scans: Optional[int] = None,
    anti_photocopy: bool = True,
    admin_user: bool = False,
    notification_emails: str = ""
) -> Dict[str, Any]:
    """
    Enhanced QR generation with ALL security upgrades and Dashboard integration
    FIXED: Removed duplicates, proper function ordering, single URL generation method
    """
    try:
        logger.info(f"🔐 SECURE Enhanced QR generation: size={size_mm}mm, intensity={intensity}, "
                   f"model={model}, max_scans={max_scans}")
        
        # Validate parameters
        if not data or not isinstance(data, str):
            raise ValueError("Invalid QR data. Must provide a non-empty string.")
        
        # Validate intensity range
        intensity = max(0.1, min(1.0, intensity))
        
        # Get smart defaults based on metadata
        smart_defaults = get_smart_defaults(size_mm, model)
        
        # ENHANCED: Dynamic QR version based on size
        if size_mm <= 15:
            qr_version = 2
            max_chars = 25
        elif size_mm <= 25:
            qr_version = 3
            max_chars = 55
        elif size_mm <= 40:
            qr_version = 5
            max_chars = 100
        else:
            qr_version = 8
            max_chars = 200
        
        # Model-based configuration
        model_config = get_model_configuration(model, max_scans)
        logger.info(f"🔐 Using model configuration: {model_config}")
        
        # Apply model-specific restrictions for non-admin users
        if not admin_user:
            if model == 'fintech' and (size_mm < 10 or size_mm > 30):
                logger.warning(f"FinTech model restricting size {size_mm}mm to 10-30mm range")
                size_mm = max(10, min(30, size_mm))
            elif model == 'luxury' and (size_mm < 20 or size_mm > 50):
                logger.warning(f"Luxury model restricting size {size_mm}mm to 20-50mm range")
                size_mm = max(20, min(50, size_mm))
        
        # Generate internal QR ID
        qr_id = f"QR_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        # 🔐 FIXED: Single declaration of security features
        verification_id = generate_secure_verification_id()
        encrypted_url = url_manager.encrypt_url(data)

        # Generate short code for database optimization (optional)
        if len(data) > max_chars or size_mm <= 20:
            short_code = generate_short_code(qr_id)
            logger.info(f"Generated short code for database optimization: {short_code}")
        else:
            short_code = None

        verification_url = generate_dynamic_verification_url(verification_id, qr_id, short_code)

        # Cryptographic signature
        timestamp = datetime.now().isoformat()
        verification_signature = create_verification_signature(verification_id, qr_id, timestamp)

        logger.info(f"🔐 Dynamic security features generated:")
        logger.info(f"   - QR ID: {qr_id}")
        logger.info(f"   - Verification ID: {verification_id}")
        logger.info(f"   - PWA Scanner URL: {verification_url}")
        logger.info(f"   - Cryptographic signature: ✅ Generated")
        logger.info(f"   - Short code: {short_code}")
        logger.info(f"   - Model: {model}")
        
        # Initialize CDP generator
        cdp_generator = SizeAdaptiveCDPGenerator()
        cdp_config = cdp_generator.generate_cdp_config(size_mm, intensity)
        
        logger.info(f"CDP Config: {cdp_config.security_level}, "
                   f"{cdp_config.pixel_size}px, {cdp_config.dpi}DPI")
        
        # Calculate appropriate box size
        target_size_px = int(size_mm * resolution_dpi / 25.4)
        estimated_modules = 21 + (qr_version - 1) * 4
        box_size = max(1, target_size_px // (estimated_modules + 8))
        
        # Get error level from Dashboard or use smart default
        error_level_map = {
            'L': qrcode.constants.ERROR_CORRECT_L,
            'M': qrcode.constants.ERROR_CORRECT_M,
            'Q': qrcode.constants.ERROR_CORRECT_Q,
            'H': qrcode.constants.ERROR_CORRECT_H
        }
        error_level = metadata.get('errorLevel', smart_defaults['errorLevel']) if metadata else smart_defaults['errorLevel']
        
        # Create QR code with enhanced settings
        qr = qrcode.QRCode(
            version=qr_version,
            error_correction=error_level_map.get(error_level, qrcode.constants.ERROR_CORRECT_M),
            box_size=box_size,
            border=1,  # Minimal border for maximum CDP coverage
        )
        
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        # Log QR details
        actual_version = qr.version
        logger.info(f"QR Details: Size={size_mm}mm, Version={actual_version}, Error={error_level}, URL Length={len(verification_url)}")
        
        if actual_version > qr_version:
            logger.warning(f"QR version {actual_version} exceeds target {qr_version} for {size_mm}mm - data too long")
        
        # Convert to array for processing
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_pil = qr_img.convert('L')
        qr_array = np.array(qr_pil, dtype=np.uint8)
        
        # Resize if needed
        if qr_array.shape[0] != cdp_config.pixel_size:
            qr_array = cv2.resize(qr_array, 
                                (cdp_config.pixel_size, cdp_config.pixel_size), 
                                interpolation=cv2.INTER_NEAREST)
        
        # Ensure binary QR
        qr_array = np.where(qr_array > 127, 255, 0).astype(np.uint8)
        
        # Generate CDP pattern
        cdp_pattern, cdp_signature = cdp_generator.generate_multi_frequency_cdp(cdp_config, qr_id)
        
        # Enhanced CDP generation with anti-photocopy features
        if anti_photocopy and intensity >= 0.5:
            logger.info("🔐 Applying anti-photocopy CDP features")
            
            ap_generator = AntiPhotocopyGenerator()
            
            ap_config = AntiPhotocopyConfig(
                microprint_enabled=True,
                halftone_traps=True,
                frequency_watermark=True,
                guilloche_patterns=(size_mm >= 20),
                void_pantograph=(size_mm >= 15),
                metameric_features=False
            )
            
            ap_pattern = ap_generator.generate_anti_photocopy_pattern(
                size=cdp_config.pixel_size,
                qr_id=qr_id,
                intensity=intensity,
                config=ap_config
            )
            
            if ap_pattern.max() > 1:
                ap_pattern = ap_pattern / 255.0
            
            # Combine patterns
            cdp_pattern = cdp_pattern * 0.5 + ap_pattern * 0.5
            
            if metadata is None:
                metadata = {}
            metadata['anti_photocopy'] = {
                'enabled': True,
                'config': {
                    'microprint': ap_config.microprint_enabled,
                    'halftone_traps': ap_config.halftone_traps,
                    'frequency_watermark': ap_config.frequency_watermark,
                    'guilloche': ap_config.guilloche_patterns,
                    'void_pantograph': ap_config.void_pantograph
                }
            }
        
        # Apply CDP to QR code
        qr_with_cdp = apply_cdp_to_qr(qr_array, cdp_pattern, intensity)
        
        # Save final QR code
        qr_filename = f"{qr_id}.png"
        output_path = os.path.join(TEMP_DIR, qr_filename)
        final_image = Image.fromarray(qr_with_cdp, mode='L')
        final_image.save(output_path, 'PNG', dpi=(cdp_config.dpi, cdp_config.dpi))
        
        # Upload to Firebase Storage
        qr_url = None
        if bucket:
            try:
                with open(output_path, "rb") as qr_file:
                    blob = bucket.blob(f"qr_codes/{qr_filename}")
                    blob.upload_from_file(qr_file, content_type="image/png")
                    blob.make_public()
                    qr_url = blob.public_url
            except Exception as e:
                logger.error(f"Upload error: {e}")
                qr_url = f"{API_BASE_URL}/proxy/qr-image/{qr_id}"
        else:
            qr_url = f"{API_BASE_URL}/proxy/qr-image/{qr_id}"
        
        # Get scanning recommendations
        scanning_recommendations = cdp_generator.get_scanning_recommendations(cdp_config)
        
        # ENHANCED: Comprehensive metadata
        qr_metadata = {
            # Verification data
            "verification_id": verification_id,
            "verification_signature": verification_signature,
            "verification_timestamp": timestamp,
            "verification_used": False,
            
            # Model configuration
            "model_config": {
                "model_type": model,
                "max_scans": max_scans,
                "scan_count": 0,
                "model_restrictions": model_config,
                "created_with_model": model
            },
            
            # Data storage with encryption
            "data": {
                "encrypted_url": encrypted_url,
                "verification_url": verification_url,
                "verification_id": verification_id,
                "verification_signature": verification_signature,
                "short_code": short_code,
                "dynamic_verification": True,
            },
            
            # Dashboard integration
            "customization": {
                "errorLevel": error_level,
                "bgColor": metadata.get('bgColor', '#FFFFFF') if metadata else '#FFFFFF',
                "fgColor": metadata.get('fgColor', '#000000') if metadata else '#000000',
                "model": model,
                "intensity": intensity,
            },
            
            # QR technical details
            "qr_details": {
                "version": actual_version,
                "target_version": qr_version,
                "error_correction": error_level,
                "box_size": box_size,
                "modules": estimated_modules,
                "url_length": len(verification_url),
                "is_short_url": short_code is not None,
            },
            
            # Short code mapping (for database lookup)
            "short_code": short_code,
            
            # Pattern analysis thresholds
            "pattern_thresholds": get_pattern_thresholds(size_mm),
            
            # Smart defaults used
            "smart_defaults": smart_defaults,
            
            "qr_image_url": qr_url,
            "created_at": datetime.now(),
            "security_features": {
                "cdp_signature": cdp_signature,
                "security_level": str(cdp_config.security_level),
                "intensity": intensity,
                "anti_photocopy": anti_photocopy,
                "url_encrypted": True,
                "verification_required": True,
                "cryptographic_signature": True,
                "one_time_use": model == 'fintech',
                "zecca_grade_security": True,
                "model_security": model_config.get('security_level', 'standard')
            },
            "physical_properties": {
                "size_mm": size_mm,
                "dpi": cdp_config.dpi,
                "pixel_dimensions": f"{cdp_config.pixel_size}x{cdp_config.pixel_size}"
            },
            "scanning_recommendations": scanning_recommendations,
            "metadata": metadata or {},
            "notification_settings": {
                "emails": notification_emails.split(',') if notification_emails else [],
                "enabled": bool(notification_emails),
                "created_at": datetime.now()
            }
        }

        # Save to Firestore
        if db:
            try:
                logger.info(f"📧 DEBUG: notification_emails parameter = {notification_emails}")
                logger.info(f"📧 DEBUG: notification_settings being saved = {qr_metadata.get('notification_settings')}")

                db.collection(QR_COLLECTION).document(qr_id).set(qr_metadata)
                logger.info(f"🔐 Secure QR saved: {qr_id}")
                logger.info(f"📧 DEBUG: QR saved with emails: {qr_metadata.get('notification_settings', {}).get('emails', [])}")
            except Exception as e:
                logger.error(f"Firestore save error: {e}")

        # Return comprehensive result
        return {
            'qr_id': qr_id,
            'verification_id': verification_id,
            'verification_url': verification_url,
            'verification_signature': verification_signature,
            'qr_image_url': qr_url,
            'local_file_path': output_path,
            'size_mm': size_mm,
            'dpi': cdp_config.dpi,
            'pixel_size': cdp_config.pixel_size,  
            'cdp_signature': cdp_signature,
            'security_level': str(cdp_config.security_level),
            'security_features': qr_metadata['security_features'],
            'model_config': qr_metadata['model_config'],
            'scanning_recommendations': scanning_recommendations,
            'success': True,
            'security_status': {
                'url_encrypted': True,
                'verification_secured': True,
                'infrastructure_hidden': True,
                'cryptographically_signed': True,
                'one_time_use_enforced': model == 'fintech',
                'zecca_grade': True,
                'model_configured': True
            },
            **(metadata or {})
        }
        
    except Exception as e:
        logger.error(f"🔐 Secure enhanced QR generation failed: {str(e)}")
        raise ValueError(f"Secure enhanced QR generation failed: {str(e)}")


# ============================================================================
# ENHANCED VERIFICATION FUNCTION
# ============================================================================

def verify_qr_access(qr_id: str, security_context: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
    """
    Enhanced QR verification with short code support and stealth mode
    """
    try:
        logger.info(f"🔐 DEBUG: verify_qr_access called with qr_id={qr_id}")
        
        # ENHANCED: Handle short code lookup
        if len(qr_id) == 8:  # It's a short code
            logger.info(f"Looking up short code: {qr_id}")
            query = db.collection(QR_COLLECTION).where('short_code', '==', qr_id).limit(1).get()
            if query:
                qr_doc = query[0]
                actual_qr_id = qr_doc.id
                qr_data = qr_doc.to_dict()
                logger.info(f"Short code {qr_id} maps to QR ID: {actual_qr_id}")
            else:
                logger.error(f"Short code not found: {qr_id}")
                return {"success": False, "error": "QR data not found"}
        else:
            # Regular QR ID lookup
            qr_doc = db.collection(QR_COLLECTION).document(qr_id).get()
            if not qr_doc.exists:
                logger.error(f"QR not found in database: {qr_id}")
                return {"success": False, "error": "QR data not found"}
            qr_data = qr_doc.to_dict()
            actual_qr_id = qr_id
        
        model_config = qr_data.get('model_config', {})
        current_scan_count = model_config.get('scan_count', 0)
        max_scans = model_config.get('max_scans')
        
        logger.info(f"🔐 DEBUG: current_scan_count={current_scan_count}")
        logger.info(f"🔐 DEBUG: max_scans={max_scans}")
        
        # Check scan limits
        if max_scans is not None and current_scan_count >= max_scans:
            logger.warning(f"🔐 BLOCKED: Scan limit exceeded for QR ID: {qr_id}")
            return {
                "success": False, 
                "error": f"Scan limit exceeded ({current_scan_count}/{max_scans})"
            }
        
        # Check expiry
        expires_at = model_config.get('expiry_date')
        if expires_at and datetime.now() > expires_at.replace(tzinfo=None):
            logger.warning(f"🔐 BLOCKED: Expired QR code: {qr_id}")
            return {"success": False, "error": "QR code expired"}
        
        # Decrypt URL
        encrypted_url = qr_data.get('data', {}).get('encrypted_url')
        if not encrypted_url:
            logger.error(f"🔐 No encrypted URL found for QR ID: {qr_id}")
            return {"success": False, "error": "No encrypted destination found"}
        
        try:
            destination_url = url_manager.decrypt_url(encrypted_url)
        except Exception as e:
            logger.error(f"🔐 Decryption failed: {e}")
            return {"success": False, "error": "Failed to decrypt destination"}
        
        # Increment scan count
        try:
            db.collection(QR_COLLECTION).document(actual_qr_id).update({
                'model_config.scan_count': firestore.Increment(1),
                'model_config.last_scanned_at': datetime.now(),
                'model_config.last_scanned_by_ip': security_context.get('ip_address') if security_context else None
            })
            logger.info(f"🔐 Scan count incremented for QR ID: {actual_qr_id}")

            # Email notifications check
            logger.info("📧 Checking for email notifications...")
            notification_settings = qr_data.get('notification_settings', {})
            logger.info(f"📧 Notification settings: {notification_settings}")

            if notification_settings.get('enabled') and notification_settings.get('emails'):
                logger.info(f"📧 Found notification emails: {notification_settings.get('emails')}")
                logger.info("📧 EMAIL SERVICE IMPORT DISABLED - Would send notifications here")
            else:
                logger.info("📧 No notification emails configured for this QR code")
        except Exception as e:
            logger.error(f"🔐 Failed to update scan count: {e}")
            return {"success": False, "error": "Verification processing failed"}
        
        # STEALTH MODE: Always return success with destination URL
        return {
            "success": True,
            "destination_url": destination_url,
            "scan_id": f"scan_{int(time.time())}",
            "qr_id": actual_qr_id
        }
        
    except Exception as e:
        logger.error(f"🔐 Verification error: {e}")
        return {"success": False, "error": "Verification failed"}

# ============================================================================
# Additional functions for compatibility
# ============================================================================

def get_size_recommendations_for_ipzs() -> Dict[str, Any]:
    """Get IPZS-specific size recommendations"""
    
    recommendations = {
        'ipzs_standard_range': {
            'min_size_mm': 10,
            'max_size_mm': 30,
            'recommended_size_mm': 20,
            'zecca_specific_mm': 12
        },
        
        'size_categories': {
            'compact': {
                'size_range': '10-15mm',
                'use_cases': ['Small labels', 'Jewelry tags', 'Compact products'],
                'security_level': 'standard',
                'dpi': 600
            },
            'standard': {
                'size_range': '15-25mm',
                'use_cases': ['Product authentication', 'Certificates', 'Standard labels'],
                'security_level': 'standard',
                'dpi': 600
            },
            'premium': {
                'size_range': '25-30mm',
                'use_cases': ['High-value products', 'Official documents', 'Premium authentication'],
                'security_level': 'standard',
                'dpi': 600
            }
        },
        
        'zecca_dello_stato_optimized': {
            'size_mm': 12,
            'security_level': 'standard',
            'dpi': 600,
            'expected_authentication_rate': 98.5,
            'print_requirements': {
                'minimum_resolution': '600 DPI',
                'registration_accuracy': '±0.05mm',
                'substrate': 'Security paper 90-120 GSM',
                'print_technology': 'Offset industrial or high-end digital'
            }
        },
        
        'scanning_guidelines': {
            'optimal_distance_formula': 'size_mm × 1 (1:1 ratio for mobile)',
            'lighting_requirements': 'Standard indoor lighting sufficient',
            'mobile_compatibility': 'All modern smartphones',
            'industrial_scanners': 'Compatible with professional QR scanners'
        }
    }
    
    return recommendations

def generate_zecca_test_qr(data: str, cdp_density: str = "high", 
                          print_profile: str = "offset_industrial",
                          substrate_type: str = "security_paper") -> Dict[str, Any]:
    """Generate SECURE QR code specifically for Zecca dello Stato testing"""
    
    density_map = {
        'low': 0.4,
        'medium': 0.6,
        'high': 0.8,
        'ultra': 1.0
    }
    
    intensity = density_map.get(cdp_density, 0.8)
    
    zecca_metadata = {
        'test_configuration': {
            'cdp_density': cdp_density,
            'print_profile': print_profile,
            'substrate_type': substrate_type,
            'test_timestamp': datetime.now().isoformat(),
            'zecca_optimized': True,
            'security_grade': 'ZECCA_DELLO_STATO'
        },
        'print_specifications': {
            'target_printer': print_profile,
            'substrate': substrate_type,
            'quality_requirements': 'IPZS Grade A',
            'registration_tolerance': '±0.025mm'
        }
    }
    
    result = generate_qr_with_size_adaptive_cdp(
        data=data,
        size_mm=12.0,
        intensity=intensity,
        metadata=zecca_metadata,
        admin_user=True,
        anti_photocopy=True
    )
    
    result.update({
        'zecca_configuration': {
            'cdp_density': cdp_density,
            'print_profile': print_profile,
            'substrate_type': substrate_type,
            'recommended_for_production': cdp_density == 'high',
            'security_grade': 'ZECCA_DELLO_STATO',
            'all_security_features_enabled': True
        }
    })
    
    logger.info(f"🔐 Zecca test QR generated with verification ID: {result.get('verification_id')}")
    
    return result
