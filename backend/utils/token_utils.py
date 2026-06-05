import os
import json
import hmac
import hashlib
import base64
import time
from typing import Tuple
import logging
from datetime import datetime 

# Secret used for signing
SECRET_KEY = os.environ.get("QR_TOKEN_SECRET", "dev-secret")

logger = logging.getLogger(__name__)

def generate_signed_token(payload: dict) -> str:
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip("=")
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def verify_signed_token(token: str) -> Tuple[bool, dict]:
    try:
        logger.info(f"🔍 Received token: {token[:40]}...")  # Truncate for safety
        payload_b64, signature = token.rsplit('.', 1)
        expected_signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()

        logger.info(f"🔐 Expected signature: {expected_signature}")
        logger.info(f"📦 Extracted signature: {signature}")

        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("❌ Invalid signature")
            return False, {"message": "Invalid signature"}

        payload_json = base64.urlsafe_b64decode(payload_b64 + '==').decode()
        payload = json.loads(payload_json)
        logger.info(f"✅ Decoded payload: {payload}")

        if "exp" not in payload:
            logger.warning("❌ Missing expiration")
            return False, {"message": "Missing expiration in token"}

        now = time.time()
        logger.info(f"⏱️ Token time check → now: {now}, iat: {payload.get('iat')}, exp: {payload.get('exp')}")

        if now > payload["exp"]:
            logger.warning(f"⏰ Token expired. Now: {now}, Exp: {payload['exp']}")
            return False, {"message": "Token expired"}

        return True, payload

    except Exception as e:
        logger.error(f"🚨 Token verification error: {str(e)}")
        return False, {"message": f"Token verification error: {str(e)}"}

# Token hashing for replay prevention
def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256 for secure storage and comparison.
    """
    return hashlib.sha256(token.encode()).hexdigest()

# Prevent replay by checking Firestore
def is_token_used(db, token: str) -> bool:
    """
    Check if a token has already been used by querying Firestore.
    """
    token_hash = hash_token(token)
    doc = db.collection('used_tokens').document(token_hash).get()
    return doc.exists

# Mark a token as used in Firestore
def mark_token_as_used(db, token: str):
    """
    Record a token as used in Firestore to prevent replay attacks.
    """
    token_hash = hash_token(token)
    db.collection('used_tokens').document(token_hash).set({
        'used': True,
        'timestamp': datetime.utcnow()
    })
