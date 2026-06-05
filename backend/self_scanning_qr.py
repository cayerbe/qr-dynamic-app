# self_scanning_qr.py
import os
import json
import logging
import time
from datetime import datetime
from flask import jsonify, request
from google.cloud import firestore

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("self_scanning_qr")

# Collection names (matching your existing collections)
QR_COLLECTION = 'qr_codes'
SCAN_LOGS_COLLECTION = 'qr_scan_logs'
FORGERY_DETECTION_COLLECTION = 'forgery_detection_logs'

def register_self_scanning_routes(app, db):
    """Register the self-scanning QR code routes with the Flask app"""
    
    @app.route('/api/qr/scan-camera-activation/<qr_id>', methods=['POST'])
    def api_scan_camera_activation(qr_id):
        """Endpoint to log a camera activation event from touching a QR code"""
        try:
            data = request.json
            
            # Validate QR ID
            qr_doc = db.collection(QR_COLLECTION).document(qr_id).get()
            if not qr_doc.exists:
                return jsonify({"success": False, "error": "QR code not found"}), 404
                
            # Get user and device info
            user_id = data.get('user_id', 'anonymous')
            device_info = data.get('device_info', {})
            location_info = data.get('location_info', {})
            
            # Log the camera activation event
            activation_log = {
                'qr_id': qr_id,
                'user_id': user_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'event_type': 'camera_activation',
                'device_info': device_info,
                'location_info': location_info
            }
            
            db.collection(SCAN_LOGS_COLLECTION).add(activation_log)
            
            # Get QR details
            qr_data = qr_doc.to_dict()
            
            return jsonify({
                "success": True,
                "message": "Camera activation logged",
                "qr_id": qr_id,
                "requires_biometric": qr_data.get('requires_biometric', False)
            }), 200
            
        except Exception as e:
            logger.error(f"Camera activation error: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route('/api/qr/verify-self-scan/<qr_id>', methods=['POST'])
    def api_verify_self_scan(qr_id):
        """Endpoint to verify a QR code after self-scanning"""
        try:
            data = request.json
            
            # Get CDP signature and device info
            cdp_signature = data.get('cdp_signature', '')
            device_info = data.get('device_info', {})
            user_id = data.get('user_id', 'anonymous')
            
            # Verify QR code in Firestore
            qr_doc = db.collection(QR_COLLECTION).document(qr_id).get()
            if not qr_doc.exists:
                return jsonify({"success": False, "error": "QR code not found"}), 404
                
            qr_data = qr_doc.to_dict()
            stored_signature = qr_data.get('cdp_signature', '')
            
            # Verify CDP signature (simplified for demo)
            # In a real implementation, use a sophisticated comparison algorithm
            if not stored_signature:
                match_percentage = 0.0
            elif stored_signature == cdp_signature:
                match_percentage = 100.0
            else:
                # Simulate partial match
                match_percentage = 97.5
            
            is_authentic = match_percentage >= 95.0
            
            # Log the verification attempt
            verification_log = {
                'qr_id': qr_id,
                'user_id': user_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'event_type': 'self_scan_verification',
                'match_percentage': match_percentage,
                'is_authentic': is_authentic,
                'device_info': device_info
            }
            
            db.collection(SCAN_LOGS_COLLECTION).add(verification_log)
            
            # If verified successfully, update scan count
            if is_authentic:
                db.collection(QR_COLLECTION).document(qr_id).update({
                    'total_scans': firestore.Increment(1),
                    'last_scanned_at': firestore.SERVER_TIMESTAMP
                })
            
            # Extract destination URL from QR data
            destination_url = ''
            destination_data = qr_data.get('data', {})
            if isinstance(destination_data, dict) and 'url' in destination_data:
                destination_url = destination_data['url']
            
            return jsonify({
                "success": True,
                "is_authentic": is_authentic,
                "match_percentage": match_percentage,
                "message": "QR code verified successfully" if is_authentic else "QR code verification failed",
                "destination": destination_url if is_authentic else '',
                "requires_biometric": qr_data.get('requires_biometric', False) and is_authentic
            }), 200
            
        except Exception as e:
            logger.error(f"QR self-scan verification error: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500

def extend_qr_generator(generate_qr_with_cdp_func):
    """
    Extend the existing QR generator to support self-scanning QR codes
    
    Args:
        generate_qr_with_cdp_func: The original QR generation function
        
    Returns:
        Enhanced function that supports self-scanning QRs
    """
    def generate_self_scanning_qr(data, intensity=0.2, metadata=None, requires_biometric=False):
        """Generate a QR code that requires camera scanning when touched"""
        
        # If metadata doesn't exist, create it
        if metadata is None:
            metadata = {}
        
        # Add self-scanning flags to metadata
        metadata.update({
            'is_self_scanning': True,
            'requires_biometric': requires_biometric,
            'camera_activations': 0,
            'successful_scans': 0
        })
        
        # Call the original QR generation function
        result = generate_qr_with_cdp_func(data, intensity, metadata)
        
        # Add self-scanning flags to result
        result.update({
            'is_self_scanning': True,
            'requires_biometric': requires_biometric
        })
        
        return result
    
    return generate_self_scanning_qr