from flask import Blueprint, request, jsonify
from .qr_generator import generate_qr_with_cdp, QRGenerationError

bp = Blueprint('qr', __name__, url_prefix='/api/qr')

@bp.route('/generate', methods=['POST'])
def generate_qr():
    try:
        json_data = request.get_json()
        if not json_data or "data" not in json_data:
            return jsonify({"error": "Missing 'data' field"}), 400

        data = json_data.get("data")
        intensity = json_data.get("intensity", 0.2)
        metadata = json_data.get("metadata", {})

        result = generate_qr_with_cdp(data, intensity, metadata)

        return jsonify(result), 201

    except QRGenerationError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred"}), 500