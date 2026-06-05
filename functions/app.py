import functions_framework
import os
import logging
import json
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
database_url = os.getenv("DATABASE_URL")
secret_key = os.getenv("SECRET_KEY")

# Import QR code services
from services.qr_generator import (
    generate_qr_with_cdp, 
    process_qr_scan,
    list_generated_qr_codes,
    read_qr_metadata,
    verify_qr_cdp,
    QRGenerationError
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("api.log"), logging.StreamHandler()]
)
logger = logging.getLogger("qr_cdp_api")

# Mock database for URLs (temporary storage in-memory)
url_database = {}

# ✅ Firebase HTTP Entry Point
@functions_framework.http
def firebase_entrypoint(request):
    """Firebase Cloud Function to handle incoming HTTP requests."""
    try:
        path = request.path
        method = request.method
        json_data = request.get_json(silent=True)

        # ✅ Health Check
        if path == "/api/health" and method == "GET":
            return json.dumps({"status": "healthy"}), 200, {"Content-Type": "application/json"}

        # ✅ QR Code Generation with CDP
        elif path == "/api/qr/generate" and method == "POST":
            if not json_data or "data" not in json_data:
                return json.dumps({"error": "Missing 'data' field"}), 400, {"Content-Type": "application/json"}

            data = json_data.get("data")
            intensity = json_data.get("intensity", 0.2)
            metadata = json_data.get("metadata", {})

            try:
                result = generate_qr_with_cdp(data, intensity, metadata)
                return json.dumps({
                    "success": True,
                    "qr_id": result["qr_id"],
                    "image_url": f"https://storage.googleapis.com/qr-cdp-bucket/{result['qr_id']}.png",
                    "message": "QR code generated successfully"
                }), 201, {"Content-Type": "application/json"}
            except QRGenerationError as e:
                return json.dumps({"error": str(e)}), 400, {"Content-Type": "application/json"}

        # ✅ QR Code Scan Processing
        elif path == "/api/qr/scan" and method == "POST":
            if not json_data or "qr_id" not in json_data:
                return json.dumps({"error": "Missing 'qr_id' field"}), 400, {"Content-Type": "application/json"}

            qr_id = json_data["qr_id"]

            try:
                scan_result = process_qr_scan(qr_id)
                return json.dumps({"success": True, "scan_result": scan_result}), 200, {"Content-Type": "application/json"}
            except Exception as e:
                logger.error(f"Error processing QR scan: {str(e)}", exc_info=True)
                return json.dumps({"error": "Failed to process QR scan"}), 500, {"Content-Type": "application/json"}

        # ✅ QR Code Verification with CDP
        elif path == "/api/qr/verify" and method == "POST":
            if not json_data or "qr_id" not in json_data:
                return json.dumps({"error": "Missing 'qr_id' field"}), 400, {"Content-Type": "application/json"}

            qr_id = json_data["qr_id"]

            try:
                is_valid = verify_qr_cdp(qr_id)
                return json.dumps({"success": True, "valid": is_valid}), 200, {"Content-Type": "application/json"}
            except Exception as e:
                return json.dumps({"error": "Failed to verify QR code"}), 500, {"Content-Type": "application/json"}

        # ✅ List Generated QR Codes
        elif path == "/api/qr/list" and method == "GET":
            limit = min(int(request.args.get("limit", 50)), 100)
            offset = max(int(request.args.get("offset", 0)), 0)

            qr_codes = list_generated_qr_codes(limit, offset)
            response = [
                {
                    "qr_id": qr["qr_id"],
                    "created_at": qr["created_at"],
                    "image_url": f"https://storage.googleapis.com/qr-cdp-bucket/{qr['qr_id']}.png",
                    "data": qr["data"],
                    "intensity": qr["intensity"],
                    "name": qr.get("name", ""),
                    "description": qr.get("description", "")
                }
                for qr in qr_codes
            ]

            return json.dumps({"success": True, "count": len(response), "qr_codes": response}), 200, {"Content-Type": "application/json"}

        # ✅ Retrieve QR Code Details
        elif path.startswith("/api/qr/details/") and method == "GET":
            qr_id = secure_filename(path.split("/")[-1])
            metadata = read_qr_metadata(qr_id)

            if not metadata:
                return json.dumps({"error": "QR code not found"}), 404, {"Content-Type": "application/json"}

            return json.dumps({"success": True, "qr_code": metadata}), 200, {"Content-Type": "application/json"}

        # ✅ If No Matching Route, Return 404
        else:
            return json.dumps({"error": "Route not found"}), 404, {"Content-Type": "application/json"}

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return json.dumps({"error": "An unexpected error occurred"}), 500, {"Content-Type": "application/json"}
