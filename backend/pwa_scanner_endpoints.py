"""
PWA Scanner Integration Endpoints
Bridges PWA frontend with CDP-focused security system
"""

import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from flask import jsonify, request
from utils.token_utils import (
    generate_signed_token, verify_signed_token,
    hash_token, is_token_used, mark_token_as_used  
)
from functools import wraps

logger = logging.getLogger(__name__)

# Import your existing modules
# REMOVED: from anti_photocopy_cdp import AntiPhotocopyGenerator
from forgery_detection import initialize_scan_logger
from ip_geolocation import ip_geo_service

# Security configuration
PWA_SECRET_KEY = os.environ.get('PWA_SECRET_KEY', 'your-secret-key-here')
ALLOWED_SCANNER_ORIGINS = [
    'http://localhost:3000',             
    'https://qr-dynamic-cdp.web.app'       
]

def verify_pwa_origin(f):
    """Decorator to verify PWA scanner requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        origin = request.headers.get('Origin')
        if origin not in ALLOWED_SCANNER_ORIGINS:
            logger.warning(f"Unauthorized PWA access from: {origin}")
            return jsonify({"error": "Unauthorized origin"}), 403
        return f(*args, **kwargs)
    return decorated_function

# MODIFIED: Removed ap_generator parameter
def register_pwa_scanner_routes(app, db, scan_logger):
    """Register all PWA scanner routes"""
    
    @app.route('/api/pwa/verify-scan', methods=['POST'])
    @verify_pwa_origin
    def pwa_verify_scan():
        """
        Main PWA verification endpoint
        CDP-focused security verification
        """
        try:
            # Validate request
            if 'image' not in request.files:
                return jsonify({"error": "No image provided"}), 400
            
            file = request.files['image']
            qr_id = request.form.get('qr_id')
            scan_token = request.form.get('scan_token')
            
            if not qr_id:
                return jsonify({"error": "QR ID required"}), 400
            
            # Verify scan token (optional but recommended)
            if scan_token:
                success, payload = verify_signed_token(scan_token)
                if not success:
                    return jsonify({"success": False, **payload}), 401
            
            logger.info(f"PWA scan verification for QR: {qr_id}")
            
            # Save scanned image temporarily
            scan_id = str(uuid.uuid4())
            scanned_path = os.path.join('/tmp', f'pwa_scan_{scan_id}.png')
            file.save(scanned_path)
            
            # Get original QR from storage
            original_path = os.path.join('/tmp', f'original_{qr_id}.png')
            from supabase_client import download_from_supabase_storage
            file_data = download_from_supabase_storage(f"{qr_id}.png")
            if not file_data:
                raise Exception("Image not found in storage")
            with open(original_path, "wb") as f:
                f.write(file_data)
            
            # Run CDP-focused verification
            verification_result = run_cdp_focused_verification(
                qr_id=qr_id,
                original_path=original_path,
                scanned_path=scanned_path,
                scan_logger=scan_logger,
                db=db
            )
            
            # Log scan event
            log_pwa_scan_event(db, qr_id, verification_result, request)
            
            # Clean up temp files
            for path in [scanned_path, original_path]:
                if os.path.exists(path):
                    os.remove(path)
            
            return jsonify(verification_result), 200
            
        except Exception as e:
            logger.error(f"PWA verification error: {str(e)}")
            return jsonify({"error": "Verification failed", "message": str(e)}), 500
    
    @app.route('/api/pwa/generate-scan-token', methods=['POST'])
    @verify_pwa_origin
    def generate_scan_token():
        """Generate time-limited scan token"""
        try:
            data = request.json
            qr_url = data.get('qr_url')
            
            # Extract QR ID from URL
            qr_id = extract_qr_id_from_url(qr_url)
            
            # Generate token with UNIX timestamps
            now = datetime.utcnow()
            exp = now + timedelta(minutes=5)

            token_data = {
                'qr_id': qr_id,
                'exp': int(exp.timestamp()),
                'iat': int(now.timestamp()),
                'single_use': True
            }
            
            token = generate_signed_token(token_data)

            return jsonify({
                "success": True,
                "scan_token": token,
                "expires_in": 300  # 5 minutes
            }), 200
            
        except Exception as e:
            logger.error(f"Token generation error: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/pwa/scanner-config', methods=['GET'])
    @verify_pwa_origin
    def get_scanner_config():
        """Get PWA scanner configuration"""
        return jsonify({
            "scanner_version": "2.0",  # Updated version
            "features": {
                "anti_photocopy": False,  # DISABLED
                "cdp_verification": True,  # PRIMARY SECURITY
                "real_time_analysis": True,
                "multi_frequency_detection": True
            },
            "security_levels": {
                "low": {"threshold": 30},
                "medium": {"threshold": 50},
                "high": {"threshold": 70}
            },
            "cdp_config": {
                "threshold": 0.90,  # 90% CDP match required
                "enhanced_mode": True
            }
        }), 200

    @app.route('/api/pwa/validate-token', methods=['POST'])
    @verify_pwa_origin
    def validate_pwa_token():
        """
        Validate a scan token before proceeding with scan upload
        """
        try:
            logger.info("=== /validate-token endpoint HIT ===")
            data = request.json
            token = data.get('token') or data.get('scan_token') 

            if not token:
                return jsonify({'success': False, 'error': 'Missing token'}), 400

            success, payload = verify_signed_token(token)
            if not success:
                return jsonify({'success': False, **payload}), 401

            # Check if the token has already been used
            if is_token_used(db, token):
                return jsonify({
                    'success': False,
                    'error': 'Token already used',
                    'code': 'ALREADY_USED'
                }), 401

            # Mark the token as used to prevent replay attacks
            mark_token_as_used(db, token)

            # Get QR document from Firestore
            qr_doc = db.collection('qr_codes').document(payload['qr_id']).get()
            
            if not qr_doc.exists:
                return jsonify({'success': False, 'error': 'QR code not found'}), 404
                
            qr_data = qr_doc.to_dict()

            # 🔐 FIX: Get ENCRYPTED URL and decrypt it!
            encrypted_url = qr_data.get('data', {}).get('encrypted_url')
            
            if not encrypted_url:
                logger.error(f"No encrypted URL found for QR: {payload['qr_id']}")
                return jsonify({
                    'success': False,
                    'error': 'No destination URL found'
                }), 404
            
            # 🔐 DECRYPT THE URL
            try:
                from enhanced_qr_generator import url_manager  # Import the URL manager
                destination_url = url_manager.decrypt_url(encrypted_url)
                logger.info(f"Successfully decrypted URL for QR: {payload['qr_id']}")
            except Exception as decrypt_error:
                logger.error(f"Failed to decrypt URL: {decrypt_error}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to decrypt destination URL'
                }), 500

            logger.info(f"Token {token[:8]}... validated successfully. Redirect: {destination_url}")

            return jsonify({
                'success': True,
                'destination_url': destination_url,
                'message': 'Token validated successfully'
            }), 200

        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/pwa/scan', methods=['POST'])
    @verify_pwa_origin
    def scan_qr_endpoint():
        """
        Endpoint to scan QR codes and perform security checks
        """
        try:
            # Validate request
            data = request.json
            qr_id = data.get('qr_id')
            scanned_image = data.get('scanned_image')
            
            if not qr_id or not scanned_image:
                return jsonify({"error": "QR ID and scanned image are required"}), 400
            
            logger.info(f"🔐 Scanning QR ID: {qr_id}")
            
            # Perform security checks
            result = run_cdp_focused_verification(
                qr_id=qr_id,
                original_path=None,  # Original path not needed for this endpoint
                scanned_path=None,   # Scanned path not needed for this endpoint
                scan_logger=scan_logger,
                db=db
            )
            
            try:
                # 🔐 CRITICAL: Add destination URL to scan response
                if not result.get('is_potential_forgery', False) and result.get('success', False):
                    # Get verification ID from request
                    verification_id = data.get('verification_id')
                    if verification_id:
                        # Get destination URL using existing verify_qr_access function
                        from enhanced_qr_generator import verify_qr_access, delete_verification_after_scan
                        verification_result = verify_qr_access(verification_id)
                        
                        if verification_result.get('success'):
                            result['destination_url'] = verification_result.get('destination_url')
                            # NOW delete the verification after successful scan
                            delete_verification_after_scan(verification_id)
                            logger.info(f"🔐 Destination URL added to scan response")
                        else:
                            logger.warning(f"🔐 Verification failed during scan: {verification_result.get('error')}")
            except Exception as e:
                logger.error(f"🔐 Failed to get destination URL during scan: {e}")
        
            return jsonify(result), 200
    
        except Exception as e:
            logger.error(f"🔐 Scan endpoint error: {str(e)}")
            return jsonify({"error": "Scan failed", "message": str(e)}), 500

# MODIFIED: New CDP-focused verification function
def run_cdp_focused_verification(qr_id, original_path, scanned_path, scan_logger, db):
    """
    CDP-focused verification without anti-photocopy detection
    """
    try:
        # 1. CDP Pattern Verification (PRIMARY)
        from size_adaptive_cdp import verify_cdp_match
        cdp_result = verify_cdp_match(qr_id, scanned_path)
        
        cdp_score = cdp_result.get('cdp_score', 0)
        cdp_verified = cdp_result.get('cdp_verified', False)
        
        # CDP threshold for authenticity
        CDP_THRESHOLD = 0.90  # 90% match required
        
        # 2. Forgery Pattern Detection
        forgery_result = scan_logger.verify_forgery_pattern(
            qr_id, 
            scanned_path
        )
        
        # 3. Get QR metadata
        qr_doc = db.collection('qr_codes').document(qr_id).get()
        qr_data = qr_doc.to_dict()
        
        # 4. Apply model rules
        qr_metadata = qr_data.get('model_config', {})
        model_type = qr_metadata.get('model_type', 'fintech')
        
        if model_type == 'fintech' and qr_data.get('scan_statistics', {}).get('total_scans', 0) >= 1:
            return {
                'success': False,
                'error': 'One-time QR already used',
                'is_verified': False
            }
        
        # 5. Calculate CDP-focused risk score
        risk_scores = {
            'cdp_failure': 0 if (cdp_verified and cdp_score >= CDP_THRESHOLD) else 90,
            'forgery': forgery_result.get('forgery_risk_score', 0),
            'pattern_anomaly': max(0, (1 - cdp_score) * 100)
        }
        
        # Weighted average with CDP having highest weight
        weights = {
            'cdp_failure': 3.0,
            'forgery': 1.0,
            'pattern_anomaly': 2.0
        }
        
        weighted_sum = sum(risk_scores[key] * weights.get(key, 1.0) for key in risk_scores)
        total_weights = sum(weights.values())
        total_risk = weighted_sum / total_weights
        
        # 6. Determine authenticity based on CDP
        is_authentic = (
            cdp_verified and
            cdp_score >= CDP_THRESHOLD and
            forgery_result.get('is_authentic', True) and
            total_risk < 30
        )
        
        # 7. Get destination URL
        destination_url = None
        if is_authentic:
            # 🔐 FIX: Get encrypted URL and decrypt it
            encrypted_url = qr_data.get('data', {}).get('encrypted_url')
            
            if encrypted_url:
                try:
                    from enhanced_qr_generator import url_manager
                    destination_url = url_manager.decrypt_url(encrypted_url)
                    logger.info(f"Successfully decrypted URL for authenticated QR: {qr_id}")
                except Exception as decrypt_error:
                    logger.error(f"Failed to decrypt URL during verification: {decrypt_error}")
                    destination_url = None
            else:
                logger.error(f"No encrypted URL found for QR: {qr_id}")
                destination_url = None
        
        return {
            'success': True,
            'is_authentic': is_authentic,
            'confidence': 100 - total_risk,
            'risk_score': total_risk,
            'destination_url': destination_url,
            'analysis': {
                'cdp_verification': {
                    'verified': cdp_verified,
                    'score': cdp_score,
                    'threshold': CDP_THRESHOLD,
                    'pattern_integrity': cdp_result.get('pattern_integrity', 'unknown')
                },
                'forgery': forgery_result,
                'risk_breakdown': risk_scores
            },
            'security_method': 'CDP_ENHANCED',
            'recommendation': get_cdp_recommendation(is_authentic, cdp_score, total_risk)
        }
        
    except Exception as e:
        logger.error(f"CDP-focused verification failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'is_authentic': False,
            'risk_score': 100
        }

def log_pwa_scan_event(db, qr_id, verification_result, request):
    """Log PWA scan event with full details"""
    try:
        scan_log = {
            'scan_id': str(uuid.uuid4()),
            'qr_id': qr_id,
            'timestamp': datetime.utcnow(),
            'scan_type': 'pwa_scanner',
            'security_method': 'CDP_ENHANCED',  # Updated
            'verification_result': verification_result,
            'device_info': {
                'user_agent': request.headers.get('User-Agent'),
                'pwa_version': request.headers.get('X-PWA-Version')
            },
            'network_info': {
                'ip_address': ip_geo_service.get_client_ip(request),
                'origin': request.headers.get('Origin')
            }
        }
        
        db.collection('qr_scan_logs').add(scan_log)
        
    except Exception as e:
        logger.error(f"Failed to log PWA scan: {str(e)}")

def extract_qr_id_from_url(url):
    """Extract QR ID from various URL formats"""
    # Handle different URL patterns
    # Example: https://yourdomain.com/redirect/QR_123456
    if '/redirect/' in url:
        return url.split('/redirect/')[-1]
    # Add more patterns as needed
    return None

def get_cdp_recommendation(is_authentic, cdp_score, risk_score):
    """Generate CDP-based security recommendation"""
    if is_authentic:
        if cdp_score >= 0.98:
            return "VERIFIED - Perfect CDP match"
        elif cdp_score >= 0.95:
            return "VERIFIED - High confidence CDP match"
        elif cdp_score >= 0.90:
            return "VERIFIED - Acceptable CDP match"
        else:
            return "VERIFIED - Minimum CDP threshold met"
    else:
        if cdp_score < 0.70:
            return "BLOCKED - CDP pattern severely degraded (likely photocopy)"
        elif cdp_score < 0.85:
            return "WARNING - CDP pattern degradation detected"
        elif risk_score > 50:
            return "CAUTION - Multiple security concerns"
        else:
            return "FAILED - CDP verification threshold not met"