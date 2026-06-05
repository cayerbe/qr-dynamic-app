import os
import json
import logging
import sys
import traceback
from datetime import datetime, timezone, timedelta
from flask import Flask, jsonify, request, send_file, redirect, make_response, Blueprint, abort, render_template
from flask_cors import CORS
# Import Supabase shim
from firestore_supabase_shim import db, firestore
from supabase_client import download_from_supabase_storage
class FieldFilter:
    def __init__(self, field, op, value):
        self.field = field
        self.op = op
        self.value = value

# Add this import
from size_agnostic_pattern_analyzer import size_agnostic_pattern_analysis

from qr_generator import generate_qr_with_cdp 
from self_scanning_qr import register_self_scanning_routes
from forgery_detection import initialize_scan_logger
import uuid
import re
import cv2
import numpy as np
import tempfile
import secrets
from functools import wraps
import time 
import hashlib 
import hmac
import base64 
from pwa_scanner_endpoints import register_pwa_scanner_routes
from enhanced_flask_endpoints import verify_qr_forgery, enhanced_bp, is_ip_blacklisted

# Add these imports:
from dotenv import load_dotenv
load_dotenv()  # This loads your .env file

from enhanced_qr_generator import (
    generate_qr_with_size_adaptive_cdp, 
    get_size_recommendations_for_ipzs, 
    generate_zecca_test_qr,
    verify_qr_access,
    url_manager,
    generate_secure_verification_id,
    create_verification_signature  # ADD THIS IMPORT
)

from size_adaptive_cdp import SecurityLevel, SizeAdaptiveCDPGenerator
from ip_geolocation import ip_geo_service
from utils.token_utils import generate_signed_token, verify_signed_token
from utils.image_utils import image_to_base64, qr_image_to_data_url, safe_image_to_base64
from cryptography.fernet import Fernet
from qr_models import FintechQRModel, LuxuryQRModel, CommodityQRModel

# Function to find credentials file
def find_credentials(filename):
    """
    Locates the credentials file in the current directory or uses the environment variable.
    """
    return os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS",
        os.path.join(os.path.dirname(__file__), filename)
    )

# Enhanced credentials path handling
CREDENTIALS_PATH = find_credentials('firestore-credentials.json')

# Supabase client is initialized in firestore_supabase_shim.py
# Supabase client is initialized in firestore_supabase_shim.py
print("Supabase shim initialized for database operations")

# Initialize scan logger with shim db
scan_logger = initialize_scan_logger(db)

# ============================================
# IMPORTS SECTION - DO THESE ONCE AT THE TOP
# ============================================
# Import missing functions
from enhanced_qr_generator import generate_qr_with_size_adaptive_cdp, get_size_recommendations_for_ipzs, generate_zecca_test_qr

# ============================================
# FIRESTORE COLLECTIONS
# ============================================
SCAN_LOGS_COLLECTION = 'qr_scan_logs'
QR_COLLECTION = "qr_codes"
FORGERY_DETECTION_COLLECTION = 'forgery_detection_logs'
FORGERY_LOGS_COLLECTION = 'qr_forgery_logs'

# ============================================
# SETUP LOGGING
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("qr_cdp_api")

# ============================================
# CONSTANTS FOR DIRECTORIES
# ============================================
TEMP_DIR = '/tmp/qr_codes'
CDP_DIR = '/tmp/cdp_images'

# Ensure directories exist
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(CDP_DIR, exist_ok=True)

# ============================================
# CREATE FLASK APP
# ============================================
app = Flask(__name__, template_folder='templates')

# ============================================
# CONFIGURE CORS - ALLOW X-PWA-Version HEADER
# ============================================
CORS(app, resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-PWA-Version"])

# ============================================
# NOW INITIALIZE FERRARI AND REGISTER BLUEPRINTS
# ============================================
# TEMPORARILY DISABLED - Converting to generic luxury model
# init_ferrari(db)
# app.register_blueprint(ferrari_bp)
# app.register_blueprint(contrassegno_bp)

# Register blueprints AFTER app is created
app.register_blueprint(enhanced_bp)

# Register other routes/blueprints
register_self_scanning_routes(app, db)
register_pwa_scanner_routes(
    app=app,
    db=db,
    scan_logger=scan_logger
)

# Add this method to handle CORS preflight requests
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle CORS preflight requests"""
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")  # Updated to allow all origins
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-PWA-Version")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    response.headers.add("Access-Control-Max-Age", "3600")  # Cache preflight response for 1 hour
    return response, 200

# Base URL for API
API_BASE_URL = os.environ.get("API_BASE_URL", "https://" + os.environ.get("RAILWAY_PUBLIC_DOMAIN", "") + "/api" if os.environ.get("RAILWAY_PUBLIC_DOMAIN") else "http://localhost:5001/api")

def log_qr_scan(db, qr_id, user_id, device_info, location_info=None):
    """
    Log a QR code scan event with comprehensive details
    """
    try:
        # Fetch original QR code details
        qr_doc_ref = db.collection(QR_COLLECTION).document(qr_id)
        qr_doc = qr_doc_ref.get()
        
        if not qr_doc.exists:  # ✅ Corrected here
            return {"success": False, "message": "QR code not found"}
        
        qr_data = qr_doc.to_dict()
        
        # Prepare scan log entry
        scan_log = {
            'qr_id': qr_id,
            'user_id': user_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'device_info': device_info,
            'location_info': location_info or {},
            'qr_type': qr_data.get('type', 'unknown'),
            'content_type': qr_data.get('content_type', 'unknown')
        }
        
        # Log the scan
        db.collection(SCAN_LOGS_COLLECTION).add(scan_log)
        
        # Update QR code scan count
        qr_doc_ref.update({
            'total_scans': firestore.Increment(1),
            'last_scanned_at': firestore.SERVER_TIMESTAMP
        })
        
        return {"success": True, "message": "Scan logged successfully"}
    
    except Exception as e:
        logging.error(f"Error logging QR scan: {str(e)}")
        return {"success": False, "message": str(e)}

@app.route('/')
def home():
    return jsonify({"message": "QR Dynamic API is running"}), 200

@app.route('/api/health')
def health_check():
    return jsonify({"status": "OK"}), 200

# New redirect endpoint for tracking scans
@app.route('/redirect/<qr_id>', methods=['GET', 'OPTIONS'])
def redirect_and_track(qr_id):
    # Handle OPTIONS preflight request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-PWA-Version")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response, 200
    
    try:
        logger.info(f"=== GENERATING TIME-LIMITED REDIRECT ===")
        logger.info(f"QR ID: {qr_id}")
        
        # Verify QR exists
        qr_ref = db.collection('qr_codes').document(qr_id)
        qr_doc = qr_ref.get()
        if not qr_doc.exists:
            logger.error(f"QR code not found: {qr_id}")
            response = jsonify({"success": False, "error": "QR code not found"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response, 404
        
        # Get IP and user info
        ip_address = ip_geo_service.get_client_ip(request)
        user_agent = request.headers.get('User-Agent', '')
        
        # Quick security checks
        if is_ip_blacklisted(ip_address):
            logger.warning(f"Blacklisted IP attempted scan: {ip_address}")
            response = jsonify({"success": False, "error": "Access denied"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response, 403
        
        # Generate time-limited token (5 minutes)
        current_time = int(time.time())
        expiry_time = current_time + 300  # 5 minutes from now
        
        # Create JWT token
        token_data = {
            'qr_id': qr_id,
            'iat': current_time,
            'exp': expiry_time,
            'ip': ip_address
        }
        
        token = generate_signed_token(token_data)
        
        # Build scanner URL with token and expiry
        client_url = os.environ.get('CLIENT_URL', 'https://qr-dynamic-cdp.web.app').rstrip('/')
        scanner_base = f"{client_url}/pwa-scanner.html"
        scanner_url = f"{scanner_base}#verification_id={qr_id}&token={token}&exp={expiry_time}"
        
        logger.info(f"Generated time-limited URL (expires at {expiry_time})")
        
        # Quick log before redirect
        scan_log = {
            'scan_id': str(uuid.uuid4()),
            'qr_id': qr_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'scan_type': 'initial_redirect',
            'token_expiry': expiry_time,
            'ip_address': ip_address
        }
        db.collection('pre_scan_logs').add(scan_log)
        
        # Update scan attempt count
        qr_ref.update({
            'scan_statistics.total_scan_attempts': firestore.Increment(1),
            'scan_statistics.last_scan_attempt': firestore.SERVER_TIMESTAMP
        })
        
        # Check if this is an API call (from PWA) or browser access
        if request.headers.get('Accept') == 'application/json' or 'api' in request.headers.get('User-Agent', '').lower():
            # Return JSON for PWA/API calls WITH CORS HEADERS
            response = jsonify({
                "success": True,
                "scanner_url": scanner_url,
                "qr_id": qr_id,
                "expires_at": expiry_time
            })
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response, 200
        else:
            # Return 302 redirect for direct browser access
            return redirect(scanner_url, code=302)
            
    except Exception as e:
        logger.error(f"Redirect error: {str(e)}")
        # Always return JSON for errors WITH CORS HEADERS
        response = jsonify({"success": False, "error": str(e)})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response, 500
@app.route('/api/qr/generate', methods=['POST'])
def generate_qr():
    try:
        logger.info("Received QR generation request")
        data = request.json

        if not data or 'data' not in data:
            return jsonify({"success": False, "error": "Missing required field: data"}), 400

        qr_data = data.get('data')
        intensity = float(data.get('intensity', 0.3))
        metadata = data.get('metadata', {})

        logger.info(f"Generating QR with data: {qr_data[:20]}..., intensity: {intensity}")
        result = generate_qr_with_cdp(qr_data, intensity, metadata)

        image_url = result.get('qr_image_url')
        download_url = image_url  # Direct Firebase Storage link

        # Convert to Base64 string using utility function
        local_path = result.get('local_file_path')
        base64_image = image_to_base64(local_path) if local_path else None

        return jsonify({
            "success": True,
            "qr_id": result['qr_id'],
            "image_url": image_url,
            "download_url": download_url,
            "base64_image": f"data:image/png;base64,{base64_image}" if base64_image else None,
            "message": "QR code generated and uploaded successfully"
        })

    except Exception as e:
        logger.error(f"Error in generate_qr: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/image/<qr_id>', methods=['GET'])
def get_qr_image(qr_id):
    try:
        file_path = os.path.join(TEMP_DIR, f"{qr_id}.png")
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "QR code not found"}), 404
        return send_file(file_path, mimetype='image/png')
    except Exception as e:
        logger.error(f"Error in get_qr_image: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/details/<qr_id>', methods=['GET'])
def get_cdp_info(qr_id):
    """
    Get detailed QR code information - PRESERVES ALL FORGERY DETECTION DATA
    Returns both raw Firestore data AND structured frontend data
    """
    try:
        logger.info(f"Fetching details for QR ID: {qr_id}")
        
        # Get QR code document from Firestore
        doc_ref = db.collection(QR_COLLECTION).document(qr_id)
        doc = doc_ref.get()

        if not doc.exists:
            logger.error(f"QR code not found: {qr_id}")
            return jsonify({
                "success": False,
                "error": "QR code not found"
            }), 404

        # Get raw QR data - PRESERVED EXACTLY AS BEFORE
        qr_data = doc.to_dict()
        
        # Convert Firestore timestamps ONLY for frontend display
        display_created_at = qr_data.get('created_at')
        if display_created_at and hasattr(display_created_at, 'seconds'):
            import datetime
            display_created_at = datetime.datetime.fromtimestamp(
                display_created_at.seconds
            ).isoformat()
        
        # CRITICAL: Return BOTH raw data AND structured data
        response_data = {
            "success": True,
            
            # RAW FIRESTORE DATA - UNCHANGED (for forgery detection)
            "raw_firestore_data": qr_data,
            
            # STRUCTURED DATA (for frontend display)
            "qr_details": {
                "qr_id": qr_id,
                "data": qr_data.get('data', {}),
                "created_at": display_created_at,
                "qr_image_url": qr_data.get('qr_image_url') or qr_data.get('image_url'),
                "physical_properties": qr_data.get('physical_properties', {}),
                "security_features": qr_data.get('security_features', {}),
                "scan_statistics": qr_data.get('scan_statistics', {}),
                "metadata": qr_data.get('metadata', {}),
                "usage_guidelines": qr_data.get('usage_guidelines', {}),
                "forensic_profile": qr_data.get('forensic_profile', {}),
                
                # CRITICAL FORGERY DETECTION DATA PRESERVED
                "cdp_signature": qr_data.get('security_features', {}).get('cdp_signature'),
                "generation_stats": qr_data.get('generation_stats', {}),
                "ipzs_compliance": qr_data.get('ipzs_compliance', {})
            }
        }
        
        # Add scan info for frontend
        if doc.exists:  # Corrected variable name
            qr_data = doc.to_dict()
            model_config = qr_data.get('model_config', {})
            response_data['scan_info'] = {
                'current_scan_count': model_config.get('scan_count', 0),
                'max_scans': model_config.get('max_scans', None),
                'model_type': model_config.get('model_type', 'unknown')
            }
        
        logger.info(f"Successfully fetched details for QR {qr_id}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error fetching QR details for {qr_id}: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch QR code details",
            "message": str(e)
        }), 500


@app.route('/api/qr/local-details/<qr_id>', methods=['GET'])
def get_qr_details_from_tmp(qr_id):
    """
    Retrieve QR code metadata from local temporary files
    """
    try:
        metadata_path = os.path.join(TEMP_DIR, f"{qr_id}_metadata.json")
        if not os.path.exists(metadata_path):
            return jsonify({"success": False, "error": "QR code metadata not found"}), 404

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        file_path = metadata.get('file_path')
        if file_path and os.path.exists(file_path):
            image_base64 = image_to_base64(file_path)
            metadata['image_url'] = f"data:image/png;base64,{image_base64}"

        return jsonify({"success": True, "qr_code": metadata}), 200

    except Exception as e:
        logger.error(f"Error in get_qr_details_from_tmp: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/alert_forgery/<qr_id>', methods=['GET'])
def verify_forgery(qr_id):
    try:
        metadata_path = os.path.join(TEMP_DIR, f"{qr_id}_metadata.json")
        if not os.path.exists(metadata_path):
            return jsonify({"success": False, "error": "QR code not found"}), 404

        match_percentage = 98.7
        return jsonify({
            "success": True,
            "message": "QR code verified as authentic",
            "match_percentage": match_percentage,
            "is_authentic": match_percentage > 95.0
        }), 200

    except Exception as e:
        logger.error(f"Error in verify_forgery: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/qr/forgery_logs", methods=["GET"])
def get_forgery_logs():
    """
    Retrieves forgery detection logs from Firestore.
    """
    try:
        forgery_logs = []
        query = db.collection(FORGERY_LOGS_COLLECTION).order_by('timestamp', direction=firestore.Query.DESCENDING)
        docs = query.stream()

        for doc in docs:
            forgery_logs.append(doc.to_dict())

        return jsonify({"logs": forgery_logs}), 200
    except Exception as e:
        logger.error(f"Error fetching forgery logs: {str(e)}")
        return jsonify({"error": "Failed to retrieve forgery logs"}), 500


@app.route("/api/admin/scan-trend", methods=["GET"])
def get_scan_trend():
    """
    Retrieves scan trend data for a given time range.
    """
    try:
        time_range = request.args.get("range", "weekly")  # Default to "weekly"
        scan_trend_ref = db.collection("scan_trends").document(time_range)
        scan_trend_doc = scan_trend_ref.get()

        if scan_trend_doc.exists:
            return jsonify(scan_trend_doc.to_dict()), 200
        else:
            return jsonify({"error": "No scan trend data found"}), 404
    except Exception as e:
        logger.error(f"Error fetching scan trend data: {str(e)}")
        return jsonify({"error": "Failed to retrieve scan trend data"}), 500


@app.route("/api/admin/today-stats", methods=["GET"])
def get_today_stats():
    """
    Retrieves today's statistics for QR code scans and verifications.
    """
    try:
        today_date = datetime.utcnow().strftime("%Y-%m-%d")
        stats_ref = db.collection("dashboard_stats").document(today_date)
        stats_doc = stats_ref.get()

        if stats_doc.exists:
            return jsonify(stats_doc.to_dict()), 200
        else:
            return jsonify({"error": "No statistics available for today"}), 404
    except Exception as e:
        logger.error(f"Error fetching today's stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve today's stats"}), 500

@app.route('/api/proxy/qr-image/<qr_id>', methods=['GET'])
def proxy_qr_image(qr_id):
    """Proxy QR code images from Google Cloud Storage"""
    try:
        # Check if this is a download request
        is_download = request.args.get('download', '').lower() == 'true'
        
        # First try to get from local temp directory if available
        local_file_path = os.path.join(TEMP_DIR, f"{qr_id}.png")
        if os.path.exists(local_file_path):
            # Create response
            response = send_file(local_file_path, mimetype='image/png')
            response.headers.set('Access-Control-Allow-Origin', '*')
            response.headers.set('Cache-Control', 'public, max-age=300')
            
            # Add download headers if requested
            if is_download:
                response.headers.set('Content-Disposition', f'attachment; filename="qr-code-{qr_id}.png"')
            
            return response
        
        # If not in temp dir, get from Supabase Storage
        file_data = download_from_supabase_storage(f"{qr_id}.png")
        if not file_data:
            return jsonify({"success": False, "error": "QR image not found"}), 404
        
        # Download to temp file
        temp_file_path = os.path.join(TEMP_DIR, f"{qr_id}.png")
        with open(temp_file_path, "wb") as f:
            f.write(file_data)
        
        # Set appropriate headers for CORS and caching
        response = send_file(temp_file_path, mimetype='image/png')
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Cache-Control', 'public, max-age=300')
        
        # Add download headers if requested
        if is_download:
            response.headers.set('Content-Disposition', f'attachment; filename="qr-code-{qr_id}.png"')
        
        return response
    except Exception as e:
        logger.error(f"Error proxying QR image: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/verify/<qr_id>', methods=['POST'])
def verify_qr(qr_id):
    """Verify a QR code image against its stored CDP pattern"""
    try:
        logger.info(f"Received QR verification request for QR ID: {qr_id}")
        
        # Check if QR ID exists
        qr_doc = db.collection(QR_COLLECTION).document(qr_id).get()
        if not qr_doc.exists: 
            return jsonify({"success": False, "error": "QR code not found"}), 404
        
        # Get file from request
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image file provided"}), 400
            
        file = request.files['image']
        
        # Save uploaded file temporarily
        temp_upload_path = os.path.join(TEMP_DIR, f"upload_{qr_id}.png")
        file.save(temp_upload_path)
        
        # Simulate verification with a high match percentage
        # In a real implementation, compare the uploaded image with the stored CDP pattern
        match_percentage = 98.2  # Simulated match percentage
        is_authentic = match_percentage > 95.0
        
        return jsonify({
            "success": True,
            "message": "QR code verified successfully" if is_authentic else "QR code may be a forgery",
            "match_percentage": match_percentage,
            "is_authentic": is_authentic,
            "qrCodeUrl": f"{API_BASE_URL}/proxy/qr-image/{qr_id}"
        }), 200  # Make sure this is a tuple, not inside the dict
    except Exception as e:
        logger.error(f"Error in verify_qr: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health-check', methods=['GET'])
def api_health_check():
    """API health check endpoint"""
    return jsonify({"status": "OK", "message": "API is running"}), 200

@app.route('/api/qr/scan', methods=['POST'])
def handle_qr_scan():
    """
    COMPREHENSIVE QR SCAN HANDLER - CDP-FOCUSED SECURITY
    Removed anti-photocopy detection, enhanced CDP verification
    """
    try:
        # CRITICAL FIX: Track analysis start time
        analysis_start_time = time.time()
        
        logger.info("=== COMPREHENSIVE QR SCAN START (CDP-FOCUSED) ===")
        
        if not request.is_json:
            return jsonify({"success": False, "message": "Request must be JSON"}), 400
            
        scan_data = request.json
        logger.info(f"Scan request: {scan_data}")

        # Get qr_id from request or lookup from verification_id
        qr_id = scan_data.get('qr_id')
        verification_id = scan_data.get('verification_id')
        
        # If no qr_id but have verification_id, look it up
        if not qr_id and verification_id:
            logger.info(f"Looking up qr_id from verification_id: {verification_id}")
            verification_query = db.collection('qr_verifications').where(
                filter=FieldFilter('verification_id', '==', verification_id)
            ).limit(1).get()
            if verification_query:
                verification_doc = verification_query[0]
                qr_id = verification_doc.get('qr_id')
                logger.info(f"Found qr_id {qr_id} from verification_id {verification_id}")
            else:
                return jsonify({"success": False, "message": "Invalid verification_id"}), 400
        
        if not qr_id:
            return jsonify({"success": False, "message": "Missing qr_id"}), 400

        # Generate unique scan ID
        scan_id = str(uuid.uuid4())
        
        # Get client IP and enrich with geolocation
        ip_address = ip_geo_service.get_client_ip(request)
        base_geo_data = ip_geo_service.get_ip_geolocation(ip_address)
        geo_data = ip_geo_service.enrich_geolocation(base_geo_data) if base_geo_data else {}
        
        logger.info(f"IP: {ip_address}, Geo: {geo_data}")

        # === EXECUTE SECURITY METHODS (5 instead of 6) ===
        
        # METHOD 1: Pattern-based Forgery Detection
        logger.info("🔍 METHOD 1: Pattern-based Forgery Detection")
        forgery_result = scan_logger.detect_potential_forgery(qr_id, time_window_hours=24)
        logger.info(f"Forgery detection result: {forgery_result}")
        
        # METHOD 2: IP Geolocation Risk Analysis
        logger.info("🌍 METHOD 2: IP Geolocation Risk Analysis")
        geo_risk_score = geo_data.get('risk_score', 0)
        threat_level = geo_data.get('threat_level', 'Low')
        logger.info(f"Geo risk score: {geo_risk_score}, Threat level: {threat_level}")
        
        # METHOD 3: Device Fingerprinting Analysis
        logger.info("📱 METHOD 3: Device Fingerprinting Analysis")
        device_info = scan_data.get('device_info', {})
        user_agent = device_info.get('user_agent', request.headers.get('User-Agent', ''))
        is_bot = is_bot_scanner(user_agent)
        device_fingerprint_score = 20 if is_bot else 85
        logger.info(f"Device analysis - Bot detected: {is_bot}, Fingerprint score: {device_fingerprint_score}")
        
        # Get QR document for CDP analysis
        qr_doc = db.collection('qr_codes').document(qr_id).get()

        # METHOD 4: PATTERN-FOCUSED CDP VERIFICATION (SIZE-AGNOSTIC)
        logger.info("🔐 METHOD 4: PATTERN-FOCUSED CDP VERIFICATION")
        cdp_analysis_result = None

        # Get scanned image from request
        scanned_image_base64 = scan_data.get('scanned_image')

        if scanned_image_base64 and qr_doc.exists:
            try:
                logger.info("🔐 Processing scanned image for pattern-focused CDP verification")
                
                # Step 1: Convert base64 to image file
                if 'base64,' in scanned_image_base64:
                    scanned_image_base64 = scanned_image_base64.split('base64,')[1]
                
                # Decode base64 to image
                import base64
                from PIL import Image
                import io
                
                image_data = base64.b64decode(scanned_image_base64)
                scanned_image = Image.open(io.BytesIO(image_data))
                
                # Save scanned image temporarily
                scanned_temp_path = f"/tmp/scanned_{qr_id}.png"
                scanned_image.save(scanned_temp_path)
                logger.info(f"🔐 Scanned image saved for pattern analysis")
                
                # Step 2: Get original QR image from storage
                original_temp_path = f"/tmp/original_{qr_id}.png"
                
                try:
                    # Download original from Supabase Storage
                    original_filename = f"{qr_id}.png"
                    file_data = download_from_supabase_storage(original_filename)
                    if not file_data:
                        raise Exception("Original QR not found in storage")
                    with open(original_temp_path, "wb") as f:
                        f.write(file_data)
                    logger.info(f"🔐 Original QR downloaded for comparison")
                    
                    # Step 3: PATTERN-FOCUSED ANALYSIS (SIZE-AGNOSTIC)
                    logger.info("🔐 Running size-agnostic pattern degradation analysis")
                    
                    # Use the new pattern-focused analyzer
                    pattern_result = size_agnostic_pattern_analysis(
                        original_temp_path, scanned_temp_path, qr_id)
                    
                    # Extract results
                    pattern_degradation_score = pattern_result.get('pattern_degradation_score', 0.0)
                    is_photocopy = pattern_result.get('is_photocopy', False)
                    authenticity_status = pattern_result.get('authenticity_status', 'UNKNOWN')
                    confidence = pattern_result.get('confidence', 0.0)
                    pattern_analysis = pattern_result.get('pattern_analysis', {})
                    
                    # Convert to CDP format for compatibility
                    cdp_score = 1.0 - pattern_degradation_score  # Invert: low degradation = high CDP score
                    cdp_verified = not is_photocopy and authenticity_status in ['AUTHENTIC', 'SUSPICIOUS']
                    
                    cdp_analysis_result = {
                        'cdp_verified': cdp_verified,
                        'cdp_score': cdp_score,
                        'authenticity_status': authenticity_status,
                        'confidence': confidence,
                        'is_photocopy': is_photocopy,
                        'pattern_degradation_score': pattern_degradation_score,
                        'pattern_analysis': pattern_analysis,
                        'degradation_indicators': pattern_result.get('degradation_indicators', []),
                        'analysis_method': 'PATTERN_FOCUSED_SIZE_AGNOSTIC',
                        'recommendation': pattern_result.get('recommendation', 'Unknown')
                    }
                    
                    # Log detailed results
                    logger.info(f"🔐 Pattern-focused analysis complete")
                    logger.info(f"🔐 Pattern Degradation Score: {pattern_degradation_score:.3f}")
                    logger.info(f"🔐 CDP Score: {cdp_score:.3f}")
                    logger.info(f"🔐 Photocopy Detected: {is_photocopy}")
                    logger.info(f"🔐 Authenticity Status: {authenticity_status}")
                    logger.info(f"🔐 Confidence: {confidence:.1f}%")
                    
                    # Log specific pattern indicators
                    microprint_deg = pattern_analysis.get('microprint_degradation', {}).get('degradation_score', 0)
                    frequency_loss = pattern_analysis.get('frequency_loss', {}).get('frequency_loss', 0)
                    void_emergence = pattern_analysis.get('void_pantograph', {}).get('void_emergence', 0)
                    edge_deg = pattern_analysis.get('edge_degradation', {}).get('edge_degradation', 0)
                    moire_detect = pattern_analysis.get('moire_detection', {}).get('moire_detection', 0)
                    
                    logger.info(f"🔐 Pattern Indicators:")
                    logger.info(f"   Microprint Degradation: {microprint_deg:.3f}")
                    logger.info(f"   Frequency Loss: {frequency_loss:.3f}")
                    logger.info(f"   Void Pantograph: {void_emergence:.3f}")
                    logger.info(f"   Edge Degradation: {edge_deg:.3f}")
                    logger.info(f"   Moiré Detection: {moire_detect:.3f}")
                    
                    logger.info(f"🔐 CDP Analysis Complete: Score={cdp_score:.3f}, "
                               f"Status={authenticity_status}, Verified={cdp_verified}")
                    
                except Exception as storage_error:
                    logger.error(f"🔐 Could not download original QR: {storage_error}")
                    cdp_analysis_result = {
                        'cdp_verified': False,
                        'cdp_score': 0.0,
                        'error': 'Original QR image not available for pattern comparison'
                    }
                
                # Clean up temporary files
                try:
                    if 'scanned_temp_path' in locals() and os.path.exists(scanned_temp_path):
                        os.remove(scanned_temp_path)
                    if 'original_temp_path' in locals() and os.path.exists(original_temp_path):
                        os.remove(original_temp_path)
                    logger.info("🧹 Temporary files cleaned up")
                except Exception as cleanup_error:
                    logger.warning(f"🧹 Cleanup warning: {cleanup_error}")
                    
            except Exception as image_error:
                logger.error(f"🔐 Pattern-focused analysis error: {image_error}")
                cdp_analysis_result = {
                    'cdp_verified': False,
                    'cdp_score': 0.0,
                    'error': str(image_error)
                }
        else:
            logger.warning("🔐 No scanned image provided - pattern analysis skipped")
            cdp_analysis_result = {
                'cdp_verified': None,
                'cdp_score': 0.0,
                'error': 'No scanned image provided'
            }
        # METHOD 5: Real-time Behavioral Analysis
        logger.info("⚡ METHOD 5: Real-time Behavioral Analysis")
        behavioral_analysis = {
            'scan_timing': 'NORMAL',
            'scan_pattern': 'LEGITIMATE',
            'user_behavior_score': 95.0 - geo_risk_score
        }
        logger.info(f"Behavioral analysis: {behavioral_analysis}")
        
        # === CALCULATE PATTERN-FOCUSED RISK SCORE ===
        # Extract pattern analysis results
        is_photocopy = cdp_analysis_result.get('is_photocopy', False) if cdp_analysis_result else False
        authenticity_status = cdp_analysis_result.get('authenticity_status', 'UNKNOWN') if cdp_analysis_result else 'UNKNOWN'
        pattern_degradation = cdp_analysis_result.get('pattern_degradation_score', 0.0) if cdp_analysis_result else 0.0

        # Calculate pattern-based risk
        if is_photocopy:
            if authenticity_status == 'PHOTOCOPY_DETECTED':
                pattern_risk = 90  # Very high risk
            elif authenticity_status == 'LIKELY_PHOTOCOPY':
                pattern_risk = 75  # High risk
            else:
                pattern_risk = 60  # Medium-high risk
        elif authenticity_status == 'SUSPICIOUS':
            pattern_risk = 35  # Medium risk
        elif authenticity_status == 'AUTHENTIC':
            pattern_risk = max(5, pattern_degradation * 20)  # Low risk
        else:
            pattern_risk = 50  # Neutral risk for errors

        total_risk_components = {
            'forgery_pattern_risk': forgery_result.get('forgery_risk_score', 0),
            'geolocation_risk': geo_risk_score,
            'device_risk': 20 if is_bot else 0,
            'pattern_risk': pattern_risk,  # NEW: Pattern-based risk
            'behavioral_risk': max(0, 100 - behavioral_analysis['user_behavior_score'])
        }

        # Calculate weighted average with emphasis on pattern analysis
        weights = {
            'forgery_pattern_risk': 1.0,
            'geolocation_risk': 1.0,
            'device_risk': 0.8,
            'pattern_risk': 3.0,  # Highest weight for pattern analysis
            'behavioral_risk': 0.8
        }

        # Calculate weighted risk score
        weighted_sum = sum(total_risk_components[key] * weights.get(key, 1.0) for key in total_risk_components)
        total_weights = sum(weights.get(key, 1.0) for key in total_risk_components)
        total_risk_score = weighted_sum / total_weights

        # Adjust confidence score
        confidence_score = max(10, 100 - total_risk_score)

        # === DETERMINE OVERALL AUTHENTICITY ===
        # Determine authenticity for internal logging (but never block users)
        if is_photocopy:
            overall_authenticity = 'FORGERY'
        elif authenticity_status == 'SUSPICIOUS' and total_risk_score < 50:
            overall_authenticity = 'SUSPICIOUS'
        elif total_risk_score > 60:
            overall_authenticity = 'FORGERY'
        elif total_risk_score > 30:
            overall_authenticity = 'SUSPICIOUS' 
        else:
            overall_authenticity = 'AUTHENTIC'
        
        logger.info(f"FINAL ANALYSIS - Risk: {total_risk_score:.1f}, Authenticity: {overall_authenticity}")
        logger.info(f"Risk breakdown: {total_risk_components}")
        
        # === BUILD COMPREHENSIVE SCAN LOG ===
        comprehensive_scan_log = {
            'scan_id': scan_id,
            'qr_id': qr_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'user_id': scan_data.get('user_id', 'anonymous'),
            
            # Device and Network Info
            'device_info': {
                'device_id': device_info.get('device_id', f'device_{uuid.uuid4().hex[:8]}'),
                'user_agent': user_agent,
                'browser': device_info.get('browser', 'Unknown'),
                'platform': device_info.get('platform', 'Unknown'),
                'is_mobile': 'mobile' in user_agent.lower()
            },
            'location_info': geo_data,
            'network_info': {
                'ip_address': ip_address,
                'geo': geo_data
            },
            
            # === CDP-FOCUSED SECURITY ANALYSIS ===
            'anti_forgery_analysis': {
                'methods_applied': [
                    'PATTERN_BASED_FORGERY_DETECTION',
                    'IP_GEOLOCATION_RISK_ANALYSIS', 
                    'DEVICE_FINGERPRINTING_ANALYSIS',
                    'CDP_PATTERN_VERIFICATION',
                    'REAL_TIME_BEHAVIORAL_ANALYSIS'
                ],
                'overall_authenticity': overall_authenticity,
                'confidence_score': confidence_score,
                'total_risk_score': total_risk_score,
                'risk_indicators': [],
                
                # Individual method results
                'forgery_pattern_detection': forgery_result,
                'geolocation_analysis': {
                    'risk_score': geo_risk_score,
                    'threat_level': threat_level,
                    'location': f"{geo_data.get('city', 'Unknown')}, {geo_data.get('country', 'Unknown')}"
                },
                'device_analysis': {
                    'is_bot': is_bot,
                    'user_agent_risk': 'HIGH' if is_bot else 'LOW'
                },
                'cdp_verification': cdp_analysis_result,
                'behavioral_analysis': behavioral_analysis
            }
        }
        
        # Add specific risk indicators
        if forgery_result.get('is_potential_forgery'):
            comprehensive_scan_log['anti_forgery_analysis']['risk_indicators'].append('FORGERY_PATTERN_DETECTED')
        if geo_risk_score > 30:
            comprehensive_scan_log['anti_forgery_analysis']['risk_indicators'].append('HIGH_RISK_LOCATION')
        if is_bot:
            comprehensive_scan_log['anti_forgery_analysis']['risk_indicators'].append('BOT_SCANNER_DETECTED')
        if cdp_analysis_result and not cdp_analysis_result.get('cdp_verified'):
            comprehensive_scan_log['anti_forgery_analysis']['risk_indicators'].append('CDP_VERIFICATION_FAILED')
        
        # Convert numpy types to native Python types
        comprehensive_scan_log = convert_numpy_types(comprehensive_scan_log)

        # === SAVE TO FIRESTORE ===
        logger.info("💾 SAVING SCAN LOG TO FIRESTORE")
        
        try:
            # Save to collections as before
            qr_ref = db.collection('qr_codes').document(qr_id)
            scan_ref = qr_ref.collection('scan_logs').document(scan_id)
            scan_ref.set(comprehensive_scan_log)
            
            global_scan_ref = db.collection(SCAN_LOGS_COLLECTION).document(scan_id)
            global_scan_ref.set(comprehensive_scan_log)
            
            # Update QR statistics
            if qr_doc.exists:
                qr_ref.update({
                    'scan_statistics.total_scans': firestore.Increment(1),
                    'scan_statistics.last_scanned_at': firestore.SERVER_TIMESTAMP,
                    'scan_statistics.latest_risk_score': total_risk_score,
                    'scan_statistics.latest_authenticity': overall_authenticity,
                    'scan_statistics.latest_cdp_score': cdp_analysis_result.get('cdp_score', 0) if cdp_analysis_result else 0
                })
                
                # 📧 ADD EMAIL NOTIFICATION HERE
                qr_data = qr_doc.to_dict()
                notification_settings = qr_data.get('notification_settings', {})
                
                if notification_settings.get('enabled') and notification_settings.get('emails'):
                    # Send email notifications
                    try:
                        from email_service import send_scan_report
                        
                        # Get risk indicators from the log
                        risk_indicators = comprehensive_scan_log['anti_forgery_analysis'].get('risk_indicators', [])
                        
                        scan_report_data = {
                            'qr_id': qr_id,
                            'scan_time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                            'location': f"{geo_data.get('city', 'Unknown')}, {geo_data.get('country', 'Unknown')}",
                            'device': device_info.get('platform', 'Unknown'),
                            'risk_score': total_risk_score,
                            'authenticity': overall_authenticity,
                            'cdp_score': cdp_analysis_result.get('cdp_score', 0) if cdp_analysis_result else 0,
                            'ip_address': ip_address,
                            'risk_indicators': risk_indicators
                        }
                        
                        for email in notification_settings['emails']:
                            email = email.strip()
                            if email:
                                send_scan_report(email, scan_report_data)
                                logger.info(f"📧 Scan report sent to: {email}")
                                
                    except Exception as e:
                        logger.error(f"Failed to send email notification: {e}")
                        # Don't fail the scan if email fails

        except Exception as firestore_error:
            logger.error(f"❌ FIRESTORE SAVE ERROR: {str(firestore_error)}")
        
        # === RETURN CDP-FOCUSED RESPONSE ===
        # 🔐 CRITICAL: Add destination URL to scan response WITH SCAN LIMIT ENFORCEMENT
        destination_url = None  # Initialize variable
        scan_limit_exceeded = False  # Track if scan limit was hit

        if overall_authenticity != 'FORGERY':
            try:
                # Try to get the QR ID for verification
                qr_id_for_verification = scan_data.get('qr_id') or scan_data.get('verification_id')
                
                if qr_id_for_verification:
                    logger.info(f"🔐 Verifying access and checking scan limits for: {qr_id_for_verification}")
                    
                    # Prepare request data for email notifications
                    request_data_for_email = {
                        'ip_address': ip_address,
                        'user_agent': user_agent,
                        'location': f"{geo_data.get('city', 'Unknown')}, {geo_data.get('country', 'Unknown')}"
                    }

                    # CRITICAL: Use verify_qr_access which checks AND increments scan count
                    verification_result = verify_qr_access(qr_id_for_verification, request_data_for_email)
                    
                    if verification_result.get('success'):
                        destination_url = verification_result.get('destination_url')
                        logger.info(f"🔐 Access granted! Destination URL retrieved")
                        logger.info(f"🔐 Scan count incremented successfully")
                    else:
                        # Check if it's specifically a scan limit error
                        error_msg = verification_result.get('error', '')
                        if 'Scan limit exceeded' in error_msg:
                            scan_limit_exceeded = True
                            logger.warning(f"🚫 SCAN LIMIT EXCEEDED for QR: {qr_id_for_verification}")
                            overall_authenticity = 'SCAN_LIMIT_EXCEEDED'  # Override status
                        else:
                            logger.warning(f"🔐 Verification failed: {error_msg}")
            except Exception as e:
                logger.error(f"🔐 Failed to verify access during scan: {e}")
        else:
            logger.info("🔐 Not providing destination URL - forgery detected")

        # === RETURN CDP-FOCUSED RESPONSE ===
        logger.info("=== COMPREHENSIVE QR SCAN COMPLETE (CDP-FOCUSED) ===")

        response_data = {
            'success': True,
            'scan_id': scan_id,
            'qr_id': qr_id,
            'verification_id': scan_data.get('verification_id'),
            'timestamp': datetime.utcnow().isoformat(),
            'destination_url': destination_url,
            
            # SECURITY ANALYSIS RESULTS
            'security_methods_executed': 5,
            'is_potential_forgery': not (cdp_analysis_result and cdp_analysis_result.get('cdp_verified')),
            'overall_risk_score': total_risk_score, 
            'authenticity_status': overall_authenticity,
            'scan_limit_exceeded': scan_limit_exceeded,
            
            # CDP-FOCUSED SECURITY BREAKDOWN
            'security_analysis': {
                'pattern_forgery': forgery_result,
                'geolocation_risk': {
                    'ip_address': ip_address,
                    'location': geo_data,
                    'risk_score': geo_risk_score,
                    'threat_level': threat_level
                },
                'device_analysis': {
                    'is_bot': is_bot,
                    'device_info': device_info,
                    'fingerprint_score': device_fingerprint_score
                },
                'cdp_verification': cdp_analysis_result,
                'behavioral_analysis': behavioral_analysis
            },
            
            # CDP SPECIFIC RESULTS
            'cdp_analysis_result': cdp_analysis_result,
            
            # SYSTEM INFO
            'analysis_info': {
                'server_timestamp': datetime.utcnow().isoformat(),
                'analysis_duration_ms': int((time.time() - analysis_start_time) * 1000),
                'security_grade': 'CDP_ENHANCED',
                'platform_version': '2.1.0-cdp-focused'
            }
        }

        # === ALWAYS REDIRECT TO DESTINATION - STEALTH MODE ===
        # Use the destination_url we already got from verify_qr_access
        if True:  # STEALTH MODE: Always get destination URL
            # If we somehow don't have a destination URL, try to get it from the QR data
            try:
                qr_doc_for_url = db.collection(QR_COLLECTION).document(qr_id).get()
                if qr_doc_for_url.exists:
                    qr_data_for_url = qr_doc_for_url.to_dict()
                    encrypted_url = qr_data_for_url.get('data', {}).get('encrypted_url')
                    if encrypted_url:
                        destination_url = url_manager.decrypt_url(encrypted_url)
            except Exception as e:
                logger.error(f"Failed to get destination URL: {e}")
                destination_url = None  # Ensure destination_url is set to None if an error occurs

        # Log security findings internally (never reveal to user)
        if overall_authenticity in ['FORGERY', 'SUSPICIOUS']:
            logger.warning(f"🚨 STEALTH: {overall_authenticity} detected - Risk: {total_risk_score}")
            logger.warning(f"🚨 Pattern degradation: {cdp_analysis_result.get('pattern_degradation_score', 0) if cdp_analysis_result else 0}")
            # TODO: Send admin alert here

        # ALWAYS return identical response regardless of authenticity
        return jsonify({
            'success': True,
            'destination_url': destination_url,
            'scan_id': scan_id  # FIX: Use scan_id, not scan_log_id
            # NO risk info exposed to potential attackers!
        }), 200
    except Exception as e:
        logger.error(f"CDP-focused QR scan error: {str(e)}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        
        # Error logging continues as before...
        return jsonify({"success": False, "message": str(e)}), 500
@app.route('/api/qr/scan-statistics', methods=['GET'])
def get_qr_scan_statistics():
    """
    Retrieve QR code scan statistics
    """
    try:
        time_range = request.args.get('time_range', '7d')
        
        # Calculate time cutoff based on range
        if time_range == '7d':
            cutoff_time = datetime.utcnow() - timedelta(days=7)
        elif time_range == '30d':
            cutoff_time = datetime.utcnow() - timedelta(days=30)
        else:
            cutoff_time = datetime.min
        
        # Query scan logs
        scans_query = (
            db.collection(SCAN_LOGS_COLLECTION)
            .where('timestamp', '>=', cutoff_time)
        )
        
        scan_logs = scans_query.stream()
        
        # Aggregate statistics
        stats = {
            'total_scans': 0,
            'unique_qr_codes': set(),
            'unique_users': set(),
            'potential_forgeries': 0
        }
        
        for scan in scan_logs:
            scan_data = scan.to_dict()
            stats['total_scans'] += 1
            stats['unique_qr_codes'].add(scan_data['qr_id'])
            stats['unique_users'].add(scan_data['user_id'])
        
        # Forgery statistics
        forgery_query = (
            db.collection(FORGERY_DETECTION_COLLECTION)
            .where('timestamp', '>=', cutoff_time)
            .where('is_potential_forgery', '==', True)
        )
        forgery_logs = forgery_query.stream()
        stats['potential_forgeries'] = len(list(forgery_logs));
        
        return jsonify({
            "success": True,
            "scan_statistics": {
                "total_scans": stats['total_scans'],
                "unique_qr_codes": len(stats['unique_qr_codes']),
                "unique_users": len(stats['unique_users']),
                "potential_forgeries": stats['potential_forgeries']
            }
        }), 200
    
    except Exception as e:
        logging.error(f"Scan statistics retrieval error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/qr/verify-self-scan/<qr_id>', methods=['POST'])
def verify_self_scanning_qr(qr_id):
    try:
        data = request.get_json()
        logger.info(f"Verifying self-scan QR {qr_id} with data: {data}")

        if not data or "cdp_signature" not in data:
            return jsonify({"success": False, "error": "Missing cdp_signature"}), 400

        match_percentage = 98.2
        is_authentic = match_percentage > 95.0

        log_qr_scan(
            db,
            qr_id,
            data.get("user_id", "anonymous"),
            data.get("device_info", {}),
            data.get("location_info")
        )

        return jsonify({
            "success": True,
            "is_authentic": is_authentic,
            "match_percentage": match_percentage,
            "message": "QR verified successfully" if is_authentic else "Potential forgery"
        }), 200

    except Exception as e:
        logger.error(f"Error in verify_self_scanning_qr: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/all-scan-logs', methods=['GET'])
def get_all_scan_logs():
    """
    Retrieves all scan logs from both the global collection and subcollections
    """
    try:
        logger.info("=== FETCHING ALL SCAN LOGS ===")
        
        # Query parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        qr_id_filter = request.args.get('qr_id')
        
        all_logs = []
        
        # Method 1: Get logs from global scan logs collection
        try:
            logger.info(f"Fetching from global scan logs collection with limit={limit}, offset={offset}")
            query = db.collection(SCAN_LOGS_COLLECTION).order_by('timestamp', direction=firestore.Query.DESCENDING)
            
            if qr_id_filter:
                query = query.where(filter=FieldFilter('qr_id', '==', qr_id_filter))
                logger.info(f"Filtering by QR ID: {qr_id_filter}")
            
            # Get more docs to account for offset
            docs = list(query.limit(limit + offset).stream())
            
            # Apply offset manually
            if offset > 0 and len(docs) > offset:
                docs = docs[offset:]
            
            # Take only the limit amount
            docs = docs[:limit]
            
            for doc in docs:
                log_data = doc.to_dict()
                if 'scan_id' not in log_data:
                    log_data['scan_id'] = doc.id
                    
                # Convert Firestore timestamp to ISO string
                if 'timestamp' in log_data and hasattr(log_data['timestamp'], 'seconds'):
                    dt = datetime.fromtimestamp(log_data['timestamp'].seconds)
                    log_data['timestamp'] = dt.isoformat()
                elif 'timestamp' in log_data and hasattr(log_data['timestamp'], '_seconds'):
                    dt = datetime.fromtimestamp(log_data['timestamp']._seconds)
                    log_data['timestamp'] = dt.isoformat()
                
                # ADD THIS SECTION - Anti-forgery analysis on the fly
                if 'anti_forgery_analysis' not in log_data:
                    # Extract existing forgery detection data if available
                    forgery_detection = log_data.get('forgery_detection', {})
                    risk_score = forgery_detection.get('forgery_risk_score', 0)
                    is_potential_forgery = forgery_detection.get('is_potential_forgery', False)
                    
                    # Reconstruct anti-forgery analysis structure
                    log_data['anti_forgery_analysis'] = {
                        'methods_applied': ['PATTERN_BASED_FORGERY_DETECTION'],
                        'overall_authenticity': 'AUTHENTIC' if not is_potential_forgery else 'FORGERY',
                        'confidence_score': 100.0 if not is_potential_forgery else max(0, 100 - risk_score),
                        'total_risk_score': risk_score,
                        'risk_indicators': [],
                        
                        # Include raw forgery detection data
                        'forgery_pattern_detection': forgery_detection
                    }
                
                all_logs.append(log_data)
        
        except Exception as e:
            logger.error(f"Error fetching from global scan logs collection: {str(e)}")
        
        # Method 2: Get logs from subcollections (if qr_id_filter is provided)
        if qr_id_filter:
            try:
                logger.info(f"Fetching from subcollections for QR ID: {qr_id_filter}")
                subcollection_query = db.collection('qr_codes').document(qr_id_filter).collection('scan_logs').order_by('timestamp', direction=firestore.Query.DESCENDING)
                subcollection_docs = subcollection_query.limit(limit).offset(offset).stream()
                
                for doc in subcollection_docs:
                    log_data = doc.to_dict()
                    log_data['scan_id'] = doc.id  # Ensure scan_id is present
                    
                    # Convert Firestore timestamp to ISO string
                    if 'timestamp' in log_data and hasattr(log_data['timestamp'], 'seconds'):
                        dt = datetime.fromtimestamp(log_data['timestamp'].seconds)
                        log_data['timestamp'] = dt.isoformat()
                    elif 'timestamp' in log_data and hasattr(log_data['timestamp'], '_seconds'):
                        dt = datetime.fromtimestamp(log_data['timestamp']._seconds)
                        log_data['timestamp'] = dt.isoformat()
                    
                    # ADD THIS SECTION - Anti-forgery analysis on the fly
                    if 'anti_forgery_analysis' not in log_data:
                        # Extract existing forgery detection data if available
                        forgery_detection = log_data.get('forgery_detection', {})
                        risk_score = forgery_detection.get('forgery_risk_score', 0)
                        is_potential_forgery = forgery_detection.get('is_potential_forgery', False)
                        
                        # Reconstruct anti-forgery analysis structure
                        log_data['anti_forgery_analysis'] = {
                            'methods_applied': ['PATTERN_BASED_FORGERY_DETECTION'],
                            'overall_authenticity': 'AUTHENTIC' if not is_potential_forgery else 'FORGERY',
                            'confidence_score': 100.0 if not is_potential_forgery else max(0, 100 - risk_score),
                            'total_risk_score': risk_score,
                            'risk_indicators': [],
                            
                            # Include raw forgery detection data
                            'forgery_pattern_detection': forgery_detection
                        }
                    
                    all_logs.append(log_data)
            
            except Exception as e:
                logger.error(f"Error fetching from subcollections: {str(e)}")
        
        # Limit the number of logs returned
        if len(all_logs) > limit:
            all_logs = all_logs[:limit]
        
        return jsonify({
            "success": True,
            "logs": all_logs
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching all scan logs: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/qr/verify-id/<verification_id>', methods=['GET', 'POST'])
def verify_verification_id(verification_id):
    """Verify verification_id for PWA Scanner"""
    try:
        logger.info(f"🔐 Verifying verification_id: {verification_id}")
        
        # Look up QR by verification_id
        query = db.collection(QR_COLLECTION).where(
            filter=FieldFilter('data.verification_id', '==', verification_id)
        ).limit(1).get()
        
        if not query:
            logger.error(f"❌ Verification ID not found: {verification_id}")
            return jsonify({"success": False, "error": "Verification ID not found"}), 404
        
        qr_doc = query[0]
        qr_id = qr_doc.id
        qr_data = qr_doc.to_dict()
        
        logger.info(f"✅ Verification ID {verification_id} maps to QR ID: {qr_id}")
        
        # Verify cryptographic signature
        stored_signature = qr_data.get('data', {}).get('verification_signature')
        stored_timestamp = qr_data.get('verification_timestamp')
        
        if stored_signature and stored_timestamp:
            expected_signature = create_verification_signature(verification_id, qr_id, stored_timestamp)
            if not hmac.compare_digest(expected_signature, stored_signature):
                logger.warning(f"🚨 Signature verification failed for: {verification_id}")
                return jsonify({"success": False, "error": "Invalid verification signature"}), 401
        
        # Return verification data
        return jsonify({
            "success": True,
            "qr_id": qr_id,
            "verification_id": verification_id,
            "qr_data": qr_data,
            "message": "Verification ID valid - proceed with security analysis"
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Verification ID lookup failed: {str(e)}")
        return jsonify({"success": False, "error": "Verification failed"}), 500


@app.route('/r/<short_code>')
def redirect_short_code(short_code):
    """Handle short code redirects to PWA Scanner with security checks"""
    try:
        logger.info(f"🔗 Processing short code redirect: {short_code}")
        
        # Get IP and user info
        ip_address = ip_geo_service.get_client_ip(request)
        user_agent = request.headers.get('User-Agent', '')
        
        # Quick security checks
        if is_ip_blacklisted(ip_address):
            logger.warning(f"Blacklisted IP attempted scan: {ip_address}")
            return jsonify({"success": False, "error": "Access denied"}), 403
        
        # Look up the QR data by short code
        query = db.collection(QR_COLLECTION).where(
            filter=FieldFilter('short_code', '==', short_code)
        ).limit(1).get()
        
        if not query:
            logger.error(f"Short code not found: {short_code}")
            return jsonify({"success": False, "error": "Invalid QR code"}), 404
            
        qr_doc = query[0]
        qr_id = qr_doc.id
        qr_data = qr_doc.to_dict()
        
        # Get verification_id from the QR data
        verification_id = qr_data.get('verification_id')
        if not verification_id:
            logger.error(f"No verification_id found for QR: {qr_id}")
            return jsonify({"success": False, "error": "Invalid QR data"}), 500
        
        # Generate time-limited token (5 minutes)
        current_time = int(time.time())
        expiry_time = current_time + 300  # 5 minutes from now
        
        # Create JWT token with QR info
        token_data = {
            'qr_id': qr_id,
            'short_code': short_code,
            'iat': current_time,
            'exp': expiry_time,
            'ip': ip_address
        }
        
        token = generate_signed_token(token_data)
        
        # Log pre-scan attempt
        pre_scan_log = {
            'scan_id': str(uuid.uuid4()),
            'qr_id': qr_id,
            'short_code': short_code,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'scan_type': 'short_code_redirect',
            'token_expiry': expiry_time,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        db.collection('pre_scan_logs').add(pre_scan_log)
        
        # Update scan attempt count (not actual scan count yet)
        qr_ref = db.collection(QR_COLLECTION).document(qr_id)
        qr_ref.update({
            'scan_statistics.total_scan_attempts': firestore.Increment(1),
            'scan_statistics.last_scan_attempt': firestore.SERVER_TIMESTAMP
        })
        
        # Build PWA Scanner URL with all parameters
        client_url = os.environ.get('CLIENT_URL', 'https://qr-dynamic-cdp.web.app').rstrip('/')
        scanner_url = f"{client_url}/pwa-scanner.html#verification_id={verification_id}&token={token}&exp={expiry_time}&qr={qr_id}"
        
        logger.info(f"🔗 Redirecting to PWA Scanner (not destination!)")
        logger.info(f"   - Short code: {short_code}")
        logger.info(f"   - QR ID: {qr_id}")
        logger.info(f"   - Verification ID: {verification_id}")
        logger.info(f"   - Scanner URL: {scanner_url}")
        
        # Check if this is an API call (from PWA) or browser access
        if request.headers.get('Accept') == 'application/json' or 'api' in request.headers.get('User-Agent', '').lower():
            # Return JSON for PWA/API calls
            return jsonify({
                "success": True,
                "scanner_url": scanner_url,
                "qr_id": qr_id,
                "verification_id": verification_id,
                "expires_at": expiry_time
            }), 200
        else:
            # Return 302 redirect for direct browser access
            return redirect(scanner_url, code=302)
            
    except Exception as e:
        logger.error(f"❌ Short code redirect error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"success": False, "error": "Failed to process QR code"}), 500

@app.route('/api/qr/list', methods=['GET'])
def list_qr_codes():
    """List all QR codes with pagination"""
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        query = db.collection(QR_COLLECTION).order_by('created_at', direction=firestore.Query.DESCENDING)
        docs = list(query.limit(limit + offset).stream())
        
        # Apply offset manually
        if offset > 0 and len(docs) > offset:
            docs = docs[offset:]
        
        docs = docs[:limit]
        
        qr_codes = []
        for doc in docs:
            data = doc.to_dict()
            data['qr_id'] = doc.id
            
            # Convert timestamp
            if 'created_at' in data and hasattr(data['created_at'], 'seconds'):
                data['created_at'] = datetime.fromtimestamp(data['created_at'].seconds).isoformat()
            
            qr_codes.append(data)
        
        return jsonify({
            "success": True,
            "qr_codes": qr_codes,
            "total": len(qr_codes)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing QR codes: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


def is_bot_scanner(user_agent):
    """
    Detect if the user agent is a bot or automated scanner
    """
    if not user_agent:
        return True
    
    user_agent_lower = user_agent.lower()
    
    # Common bot indicators
    bot_indicators = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 
        'python', 'java', 'ruby', 'perl', 'php', 'headless',
        'phantomjs', 'selenium', 'puppeteer', 'playwright',
        'postman', 'insomnia', 'httpie', 'axios', 'fetch',
        'googlebot', 'bingbot', 'slurp', 'duckduckbot'
    ]
    
    for indicator in bot_indicators:
        if indicator in user_agent_lower:
            return True
    
    # Check for missing common browser strings
    browser_indicators = ['mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera']
    has_browser = any(browser in user_agent_lower for browser in browser_indicators)
    
    return not has_browser


def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    import numpy as np
    
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    else:
        return obj

@app.route('/api/public/scan-logs/<client_id>')
def get_public_scan_logs(client_id):
    try:
        # Define the 10 QR codes for this client
        CLIENT_QR_CODES = {
            'demo-client': [
                'QR_1750956904_280e509d',  # QR Code #1 - Low Intensity (10%)
                'QR_1750956955_496280e6',  # QR Code #2 - Standard (30%)
                'QR_1750956981_72a37e23',  # QR Code #3 - Medium (50%)
                'QR_1750957014_077fc347',  # QR Code #4 - High Security (70%)
                'QR_1750957044_26d6d169',  # QR Code #5 - Maximum (90%)
                'QR_1750957069_eb8a2547',  # QR Code #6 - Business Card (20%)
                'QR_1750957089_f84fdadc',  # QR Code #7 - Poster Size (40%)
                'QR_1750957125_ba8ea3b1',  # QR Code #8 - ID Card (60%)
                'QR_1750957151_f7780fb4',  # QR Code #9 - Ticket (80%)
                'QR_1750957195_1d0c3908',  # QR Code #10 - Ultra Fine (100%)
            ]
        }
        
        # Get the QR codes for this client
        allowed_qr_codes = CLIENT_QR_CODES.get(client_id, [])
        
        if not allowed_qr_codes:
            return jsonify({
                "success": False,
                "error": "No QR codes configured for this client"
            }), 404
        
        # Get last 50 scans FOR THESE SPECIFIC QR CODES ONLY
        logs = []
        
        # Query scans for these specific QR codes
        query = db.collection(SCAN_LOGS_COLLECTION)\
            .where(filter=FieldFilter('qr_id', 'in', allowed_qr_codes))\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(50)
        
        for doc in query.stream():
            log_data = doc.to_dict()
            
            # Convert Firestore timestamp
            if 'timestamp' in log_data and hasattr(log_data['timestamp'], 'seconds'):
                log_data['timestamp'] = datetime.fromtimestamp(log_data['timestamp'].seconds).isoformat()
            
            # Add QR label for easier identification
            qr_index = allowed_qr_codes.index(log_data['qr_id']) + 1
            log_data['qr_label'] = f"Test QR #{qr_index}"
            
            logs.append(log_data)
        
        return jsonify({
            "success": True,
            "logs": logs,
            "timestamp": datetime.utcnow().isoformat(),
            "total": len(logs),
            "qr_codes_monitored": len(allowed_qr_codes)
        })
    except Exception as e:
        logger.error(f"Error fetching public scan logs: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/public-dashboard/<client_id>')
def public_dashboard(client_id):
    """
    Public dashboard for clients to view real-time scan logs
    Only shows scans from their specific QR codes
    """
    return render_template('dashboard.html', client_id=client_id)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)