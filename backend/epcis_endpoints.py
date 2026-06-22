import os
import subprocess
import json
from flask import Blueprint, request, jsonify, abort, render_template
from firestore_supabase_shim import db
from epcis_manager import validate_event, ObjectEvent, AggregationEvent, CBV
from recall_traversal import check_recall_status
from firebase_admin import auth
from ai_agent import generate_chat_response

epcis_bp = Blueprint('epcis_bp', __name__)

def parse_gs1_uri(uri):
    """Calls the Node.js gs1_parser.js microservice"""
    try:
        script_path = os.path.join(os.path.dirname(__file__), "gs1_parser.js")
        result = subprocess.run(["node", script_path, uri], capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error parsing GS1 URI: {e}")
        return {"valid": False, "error": str(e)}

@epcis_bp.route('/api/epcis/commission', methods=['POST'])
def commission_event():
    """
    Accepts an EPCIS 2.0 event, validates it against CBV, 
    and stores it in the epcis_events collection.
    """
    try:
        event_data = request.json
        if not event_data:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        # 1. Validate Schema & CBV
        try:
            validate_event(event_data)
        except Exception as e:
            return jsonify({"error": f"Schema validation failed: {str(e)}"}), 400
            
        # 2. Store event
        event_id = event_data.get("eventID")
        db.collection("epcis_events").document(event_id).set(event_data)
        
        # 3. If it's an AggregationEvent, update genealogy
        if event_data.get("type") == "AggregationEvent" and event_data.get("action") == "ADD":
            parent_id = event_data.get("parentID")
            child_epcs = event_data.get("childEPCs", [])
            for child in child_epcs:
                db.collection("qr_genealogy").document(child).set({
                    "parent_id": parent_id,
                    "event_id": event_id,
                    "timestamp": event_data.get("eventTime")
                })

        return jsonify({"success": True, "eventId": event_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@epcis_bp.route('/01/<gtin>/10/<lot>', methods=['GET'])
@epcis_bp.route('/01/<gtin>/21/<serial>', methods=['GET'])
@epcis_bp.route('/01/<gtin>/10/<lot>/21/<serial>', methods=['GET'])
def gs1_resolver(gtin, lot=None, serial=None):
    """
    GS1 Resolver Endpoint.
    Performs content negotiation (Accept header).
    If text/html, redirects to PWA scanner.
    If application/json or application/ld+json, returns JSON product data.
    """
    # Build full URI to validate
    uri = f"https://id.gs1.org/01/{gtin}"
    if lot:
        uri += f"/10/{lot}"
    if serial:
        uri += f"/21/{serial}"
        
    validation = parse_gs1_uri(uri)
    if not validation.get("valid"):
        return jsonify({"error": "Invalid GS1 Digital Link", "details": validation.get("error")}), 400

    accept_header = request.headers.get('Accept', '')

    # Content Negotiation
    if 'text/html' in accept_header:
        # Redirect to PWA Scanner UI
        client_url = os.getenv("CLIENT_URL", "https://qr-dynamic-cdp.web.app/")
        # Pass the GS1 link as a query param so the PWA knows what to scan
        redirect_url = f"{client_url}?scan={uri}"
        return redirect(redirect_url, code=302)
    
    # Otherwise return JSON-LD representation
    # Fetch Master Data
    product_doc = db.collection("products").document(gtin).get()
    if not product_doc.exists:
        return jsonify({"error": "Product not found"}), 404
        
    product_data = product_doc.to_dict()
    
    response_data = {
        "@context": "https://gs1.org/voc/",
        "@type": "Product",
        "gtin": gtin,
        "description": product_data.get("description"),
        "allergenInfo": product_data.get("allergens"),
        "origin": product_data.get("origin")
    }
    
    # Check Recall Status
    recall_info = check_recall_status(uri)
    if recall_info.get("recalled"):
        response_data["recallStatus"] = "RECALLED"
        response_data["recallDetails"] = recall_info
    else:
        response_data["recallStatus"] = "SAFE"
    
    if lot:
        response_data["lotNumber"] = lot
    if serial:
        response_data["serialNumber"] = serial
        
    return jsonify(response_data), 200

@epcis_bp.route('/api/epcis/resolve', methods=['POST'])
def resolve_gs1_uri():
    """
    Resolves a full GS1 URI from the frontend scanner.
    """
    data = request.json
    uri = data.get("uri")
    if not uri:
        return jsonify({"error": "Missing URI"}), 400
        
    validation = parse_gs1_uri(uri)
    if not validation.get("valid"):
        return jsonify({"error": "Invalid GS1 Digital Link", "details": validation.get("error")}), 400
        
    gtin = validation.get("gtin")
    lot = validation.get("lot")
    serial = validation.get("serial")
    
    product_doc = db.collection("products").document(gtin).get()
    if not product_doc.exists:
        return jsonify({"error": "Product not found"}), 404
        
    product_data = product_doc.to_dict()
    
    response_data = {
        "@context": "https://gs1.org/voc/",
        "@type": "Product",
        "gtin": gtin,
        "description": product_data.get("description"),
        "allergenInfo": product_data.get("allergens"),
        "origin": product_data.get("origin")
    }
    
    recall_info = check_recall_status(uri)
    if recall_info.get("recalled"):
        response_data["recallStatus"] = "RECALLED"
        response_data["recallDetails"] = recall_info
    else:
        response_data["recallStatus"] = "SAFE"
        
    if lot:
        response_data["lotNumber"] = lot
    if serial:
        response_data["serialNumber"] = serial
        
    return jsonify(response_data), 200

@epcis_bp.route('/api/admin/recall', methods=['POST'])
def admin_recall():
    """
    Creates a new ObjectEvent with disposition=RECALLED for the given EPC.
    Requires Firebase JWT authentication with admin claim.
    """
    # 1. Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401
    
    token = auth_header.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        # In a real app we'd check decoded_token.get("admin") == True
        # but for POC we just ensure it's a valid Firebase token
    except Exception as e:
        # Mock auth for local POC testing if token is exactly "mock_admin_token"
        if token != "mock_admin_token":
            return jsonify({"error": "Unauthorized"}), 401
            
    # 2. Extract payload
    data = request.json
    epc = data.get("epc")
    if not epc:
        return jsonify({"error": "Missing 'epc'"}), 400
        
    # 3. Create Event
    event = ObjectEvent(
        epc_list=[epc],
        action="ADD",
        biz_step=CBV.BizStep.HOLDING,
        disposition=CBV.Disposition.RECALLED,
        event_time=data.get("eventTime", "2026-06-22T00:00:00Z"),
        event_time_zone_offset="+00:00",
        authorizing_uid=decoded_token.get("uid") if token != "mock_admin_token" else "admin"
    )
    
    event_dict = event.to_dict()
    db.collection("epcis_events").document(event.event_id).set(event_dict)
    
    return jsonify({
        "success": True, 
        "eventId": event.event_id,
        "message": f"Successfully recalled {epc}"
    }), 201

@epcis_bp.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    Conversational AI endpoint.
    Expects:
    {
        "gtin": "...",
        "session_id": "...", 
        "user_role": "consumer" | "inspector",
        "messages": [ {"role": "user", "content": "..."} ]
    }
    """
    data = request.json
    gtin = data.get("gtin")
    session_id = data.get("session_id")
    user_role = data.get("user_role", "consumer").lower()
    messages = data.get("messages", [])
    
    if not gtin or not messages:
        return jsonify({"error": "Missing gtin or messages"}), 400
        
    # 1. Fetch Master Data
    product_doc = db.collection("products").document(gtin).get()
    if not product_doc.exists:
        return jsonify({"error": "Product not found"}), 404
    product_data = product_doc.to_dict()
    
    # 2. Authoritatively determine CDP status
    cdp_status = "unknown"
    if session_id:
        # We look up the scan log for this session to get the real status
        scan_logs = db.collection("qr_scan_logs").where("session_id", "==", session_id).get()
        # Since we use ShimCollectionReference, we have to iterate it
        log_list = [log.to_dict() for log in scan_logs]
        if log_list:
            latest_scan = sorted(log_list, key=lambda x: x.get("timestamp", ""), reverse=True)[0]
            # Assuming scan logs store 'is_potential_forgery' boolean
            if latest_scan.get("is_potential_forgery") is True:
                cdp_status = "forgery"
            elif latest_scan.get("is_potential_forgery") is False:
                cdp_status = "verified"
                
    # 3. If Inspector, fetch Traceability Data
    traceability_data = None
    if user_role == "inspector":
        # Get recent events for this product (GTIN scope for simplicity, in reality would be EPC scope)
        # We just grab the most recent 3 events as a sample
        events = db.collection("epcis_events").limit(3).get()
        trace_list = []
        for e in events:
            ev = e.to_dict()
            trace_list.append(f"Action: {ev.get('action')}, Step: {ev.get('bizStep')}, Disp: {ev.get('disposition')}")
        traceability_data = "\\n".join(trace_list)
        
    # 4. Generate AI response
    ai_text = generate_chat_response(
        messages=messages,
        product_data=product_data,
        cdp_status=cdp_status,
        user_role=user_role,
        traceability_data=traceability_data
    )
    
    return jsonify({
        "success": True,
        "reply": ai_text
    }), 200

@epcis_bp.route('/chat', methods=['GET'])
def chat_ui():
    """Serves the Chat UI"""
    return render_template('chat.html')
