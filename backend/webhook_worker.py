import threading
import time
import hmac
import hashlib
import requests
import logging
from firestore_supabase_shim import db
from epcis_manager import serialize

logger = logging.getLogger(__name__)

# Very simple POC webhook worker queue
_webhook_queue = []
_queue_lock = threading.Lock()

def enqueue_webhook(event):
    with _queue_lock:
        _webhook_queue.append(event)

def _sign_payload(secret, payload_bytes):
    return "sha256=" + hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()

def webhook_worker_loop():
    while True:
        event = None
        with _queue_lock:
            if _webhook_queue:
                event = _webhook_queue.pop(0)
        
        if not event:
            time.sleep(2)
            continue
            
        # Process event
        # Find matching subscriptions
        subs = db.collection("epcis_subscriptions").where("active", "==", True).get()
        for sub in subs:
            s_data = sub.to_dict()
            
            # Simple filter matching (e.g., EQ_disposition=recalled)
            filter_str = s_data.get("filter", "")
            if filter_str.startswith("EQ_disposition="):
                req_disp = filter_str.split("=")[1]
                if event.get("disposition") != req_disp:
                    continue
            
            # Match! Deliver payload
            fmt = s_data.get("format", "jsonld-2.0")
            payload = serialize(event, fmt=fmt)
            
            if fmt == "jsonld-2.0":
                import json
                payload_bytes = json.dumps(payload).encode('utf-8')
                headers = {'Content-Type': 'application/ld+json'}
            else:
                payload_bytes = payload.encode('utf-8')
                headers = {'Content-Type': 'application/xml'}
                
            # Sign payload
            secret = s_data.get("secret", "")
            if secret:
                headers['X-Hub-Signature-256'] = _sign_payload(secret, payload_bytes)
                
            # Attempt delivery with simple backoff
            max_retries = 3
            callback_url = s_data.get("callback_url")
            
            for attempt in range(max_retries):
                try:
                    resp = requests.post(callback_url, data=payload_bytes, headers=headers, timeout=5)
                    if resp.status_code in [200, 201, 202, 204]:
                        logger.info(f"Delivered webhook to {callback_url}")
                        break
                    else:
                        logger.warning(f"Webhook {callback_url} failed with {resp.status_code}")
                except Exception as e:
                    logger.warning(f"Webhook {callback_url} failed: {e}")
                
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt) # Exponential backoff: 1s, 2s...
            else:
                # Failed after retries
                logger.error(f"Webhook {callback_url} permanently failed. Marking inactive.")
                db.collection("epcis_subscriptions").document(sub.id).update({"active": False})

def start_webhook_worker():
    t = threading.Thread(target=webhook_worker_loop, daemon=True)
    t.start()
