import os
import uuid
from datetime import datetime, timedelta
import logging
import ipaddress
import requests
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from google.cloud import storage as gcloud_storage

from firestore_supabase_shim import db, firestore

# Simplified logging setup (removed file logging)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Only use stream handler for console logging
    ]
)

class AdvancedScanLogger:
    def __init__(self, db, scan_logs_collection='qr_scan_logs'):
        """
        Initialize Advanced Scan Logger with Firestore database
        
        :param db: Firestore database client
        :param scan_logs_collection: Name of the collection to store scan logs
        """
        self.db = db
        self.scan_logs_collection = scan_logs_collection
        self.logger = logging.getLogger('advanced_scan_logger')
        
        # Simplified GeoIP database initialization
        self.geoip_reader = None
        try:
            import geoip2.database
            geoip_path = os.path.join(os.path.dirname(__file__), 'GeoLite2-City.mmdb')
            if os.path.exists(geoip_path):
                self.geoip_reader = geoip2.database.Reader(geoip_path)
        except ImportError:
            self.logger.warning("GeoIP2 database not available. Some geolocation features will be limited.")
        except Exception as e:
            self.logger.warning(f"GeoIP initialization failed: {e}")

    def validate_ip_address(self, ip_address: str) -> bool:
        """
        Validate IP address format
        
        :param ip_address: IP address to validate
        :return: Boolean indicating if IP is valid
        """
        try:
            ipaddress.ip_address(ip_address)
            return True
        except ValueError:
            return False

    def get_ip_geolocation(self, ip_address: str) -> dict:
        """
        Retrieve geolocation data for an IP address
        
        :param ip_address: IP address to geolocate
        :return: Dictionary with location information
        """
        # Try local GeoIP database first
        if self.geoip_reader and self.validate_ip_address(ip_address):
            try:
                response = self.geoip_reader.city(ip_address)
                return {
                    'city': response.city.name,
                    'country': response.country.name,
                    'latitude': response.location.latitude,
                    'longitude': response.location.longitude,
                    'timezone': response.location.time_zone
                }
            except Exception as e:
                self.logger.error(f"Local geolocation lookup failed for {ip_address}: {e}")

        # Fallback to online IP geolocation service
        try:
            response = requests.get(f'https://ipapi.co/{ip_address}/json/').json()
            return {
                'city': response.get('city'),
                'country': response.get('country_name'),
                'latitude': response.get('latitude'),
                'longitude': response.get('longitude'),
                'timezone': response.get('timezone')
            }
        except Exception as e:
            self.logger.error(f"Online geolocation lookup failed for {ip_address}: {e}")
            return {}

    def log_scan_event(self, scan_data: dict) -> dict:
        """
        Log a comprehensive scan event with validation and enrichment
        
        :param scan_data: Raw scan event data
        :return: Processed scan log result
        """
        try:
            # Generate unique scan ID
            scan_id = str(uuid.uuid4())

            # Sanitize and validate input data
            clean_scan_data = {
                'scan_id': scan_id,
                'qr_id': scan_data.get('qr_id'),
                'user_id': scan_data.get('user_id', 'anonymous'),
                'timestamp': datetime.utcnow(),
            }

            # IP Address and Geolocation
            ip_address = scan_data.get('ip_address')
            if ip_address and self.validate_ip_address(ip_address):
                clean_scan_data['ip_address'] = ip_address
                clean_scan_data['location'] = self.get_ip_geolocation(ip_address)

            # Device Information
            device_info = scan_data.get('device_info', {})
            clean_scan_data['device_info'] = {
                'device_id': device_info.get('device_id'),
                'user_agent': device_info.get('user_agent'),
                'device_type': device_info.get('device_type'),
                'os': device_info.get('os'),
                'browser': device_info.get('browser')
            }

            # QR Code Metadata
            qr_metadata = scan_data.get('qr_metadata', {})
            clean_scan_data['qr_metadata'] = {
                'cdp_signature': qr_metadata.get('cdp_signature'),
                'original_url': qr_metadata.get('original_url')
            }

            # Save to Firestore
            self.db.collection(self.scan_logs_collection).document(scan_id).set(clean_scan_data)
            return {
                'success': True, 
                'scan_id': scan_id,
                'message': 'Scan logged successfully'
            }
        except Exception as e:
            self.logger.error(f"Scan logging error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def detect_potential_forgery(self, qr_id: str, time_window_hours: int = 24) -> dict:
        """
        Advanced forgery detection algorithm with CDP signature verification.
        
        :param qr_id: QR code identifier
        :param time_window_hours: Time window for analyzing scan logs
        :return: Forgery detection results
        """
        try:
            # Calculate time cutoff
            cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)

            # Retrieve recent scans for this QR code
            recent_scans_query = (
                self.db.collection(self.scan_logs_collection)
                .where('qr_id', '==', qr_id)
                .where('timestamp', '>=', cutoff_time)
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
            )
            recent_scans = list(recent_scans_query.stream())

            # Forgery Indicators
            forgery_indicators = {
                'rapid_scans': 0,
                'geo_anomalies': 0,
                'device_diversity': 0,
                'cdp_anomalies': 0  # New indicator for CDP signature anomalies
            }

            # Add these lines at the beginning of the analysis section
            unique_devices = set()
            unique_locations = set()

            # Analyze scan patterns
            if len(recent_scans) > 1:
                # Time-based anomaly detection
                time_deltas = [
                    (recent_scans[i+1].to_dict()['timestamp'] - recent_scans[i].to_dict()['timestamp']).total_seconds()
                    for i in range(len(recent_scans) - 1)
                ]
                if any(delta < 10 for delta in time_deltas):
                    forgery_indicators['rapid_scans'] += 1

                # Geographical diversity check
                unique_locations = set(
                    (scan.to_dict().get('location', {}).get('city'), scan.to_dict().get('location', {}).get('country'))
                    for scan in recent_scans if scan.to_dict().get('location')
                )
                if len(unique_locations) > 5:
                    forgery_indicators['geo_anomalies'] += 1

                # Device diversity check
                unique_devices = set(
                    (scan.to_dict().get('device_info', {}).get('device_id'), scan.to_dict().get('device_info', {}).get('user_agent'))
                    for scan in recent_scans
                )
                if len(unique_devices) > 10:
                    forgery_indicators['device_diversity'] += 1

                # CDP Signature Verification
                cdp_signatures = [
                    scan.to_dict().get('qr_metadata', {}).get('cdp_signature') 
                    for scan in recent_scans
                ]
                unique_signatures = list(set(cdp_signatures))
                
                # If multiple unique signatures detected
                if len(unique_signatures) > 1:
                    forgery_indicators['cdp_anomalies'] = len(unique_signatures)
                    total_risk = sum(forgery_indicators.values()) * 10
                    total_risk += len(unique_signatures) * 15  # Increase risk score for CDP anomalies

            # Calculate risk score
            total_risk = sum(forgery_indicators.values()) * 10

            # Prepare a more detailed forgery log
            forgery_log = {
                'qr_id': qr_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'is_potential_forgery': total_risk > 20,
                'forgery_risk_score': total_risk,
                'indicators': forgery_indicators,
                'scan_count': len(recent_scans),
                'unique_devices_count': len(unique_devices),
                'unique_locations_count': len(unique_locations)
            }

            # Log potential forgery to Firestore
            try:
                if total_risk > 20:
                    # Add to forgery detection logs
                    forgery_ref = self.db.collection('forgery_detection_logs').document()
                    forgery_ref.set(forgery_log)
                    self.logger.info(f"Logged potential forgery for QR ID {qr_id} with risk score {total_risk}")
            except Exception as e:
                self.logger.error(f"Error logging forgery to Firestore: {str(e)}")

            # Optional: Log high-risk events
            if total_risk > 50:
                self.logger.warning(f"High forgery risk detected for QR ID {qr_id}: {total_risk}")

            return {
                'is_potential_forgery': total_risk > 20,
                'forgery_risk_score': total_risk,
                'indicators': forgery_indicators,
                'scan_count': len(recent_scans)
            }
        except Exception as e:
            self.logger.error(f"Forgery detection error: {e}")
            return {
                'is_potential_forgery': False,
                'forgery_risk_score': 0,
                'error': str(e)
            }

    def verify_forgery_pattern(self, qr_id: str, scanned_path: str) -> dict:
        """
        Verify forgery pattern by comparing the scanned QR code with the original.

        :param qr_id: QR code identifier
        :param scanned_path: Path to the scanned QR code image
        :return: Dictionary with forgery detection results
        """
        try:
            # 1. Construct original filename (assumes naming format used in generation)
            original_filename = f"cdp_QR_{qr_id}.png"

            # 2. Download original from Cloud Storage to temp
            bucket = gcloud_storage.Client().bucket('crack-celerity-419510.appspot.com')
            blob = bucket.blob(original_filename)
            original_temp_path = os.path.join(tempfile.gettempdir(), f"original_{qr_id}.png")
            blob.download_to_filename(original_temp_path)

            # 3. Load both images as grayscale
            original = cv2.imread(original_temp_path, cv2.IMREAD_GRAYSCALE)
            scanned = cv2.imread(scanned_path, cv2.IMREAD_GRAYSCALE)

            # Resize scanned to match original size if needed
            if scanned.shape != original.shape:
                scanned = cv2.resize(scanned, (original.shape[1], original.shape[0]))

            # 4. Structural Similarity Index (SSIM)
            match_score, _ = ssim(original, scanned, full=True)

            # 5. XOR Difference
            xor_diff = cv2.bitwise_xor(original, scanned)
            xor_score = np.sum(xor_diff == 255) / xor_diff.size  # normalized diff

            # 6. Black pixel analysis
            original_black = np.sum(original == 0)
            scanned_black = np.sum(scanned == 0)
            black_diff_ratio = abs(original_black - scanned_black) / max(original_black, 1)

            # 7. Risk score (0-100)
            risk_score = int((1 - match_score) * 70 + xor_score * 20 + black_diff_ratio * 10)
            risk_score = min(risk_score, 100)

            # 8. Authenticity threshold
            is_authentic = match_score > 0.85 and xor_score < 0.15

            # 9. Return results
            return {
                "match_percentage": round(match_score * 100, 2),
                "is_authentic": is_authentic,
                "forgery_risk_score": risk_score,
                "indicators": {
                    "rapid_scans": 0,           # future enhancement
                    "geo_anomalies": 0,         # future enhancement
                    "device_diversity": 0       # future enhancement
                },
                "original_pattern_url": blob.generate_signed_url(version="v4", expiration=3600)
            }

        except Exception as e:
            logging.error(f"Error in verify_forgery_pattern: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Optional: Utility function for external use
def initialize_scan_logger(db, scan_logs_collection='qr_scan_logs'):
    """
    Helper function to create AdvancedScanLogger instance
    
    :param db: Firestore database client
    :param scan_logs_collection: Name of scan logs collection
    :return: AdvancedScanLogger instance
    """
    return AdvancedScanLogger(db, scan_logs_collection)

# ✅ Patch for compatibility with PWA verification
def calculate_forgery_risk_score(analysis: dict) -> float:
    """
    Calculate a unified forgery risk score based on anti-forgery analysis data.
    This function is expected by the PWA scanner verification logic.
    """
    try:
        return analysis.get('total_risk_score') or (
            100 - analysis.get('confidence_score', 50)
        )
    except Exception as e:
        logging.error(f"Error in calculate_forgery_risk_score: {e}")
        return 50.0  # Default fallback

# ✅ Constitutional Verification Hook for PWA scanner
def verify_photocopy_conformity(original_path: str, scanned_path: str) -> dict:
    """
    DEPRECATED: Photocopy detection removed in favor of CDP-only verification.
    This function now returns a safe default response for backward compatibility.
    """
    logging.info("verify_photocopy_conformity called but photocopy detection is disabled")
    return {
        "is_photocopy": False,
        "confidence": 0,
        "recommendation": "CDP verification should be used instead",
        "degradation_scores": {}
    }