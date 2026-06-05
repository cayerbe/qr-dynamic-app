import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase (using local credentials for testing if needed, or environment)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/camiloayerbeposada/qr-dynamic-app/backend/credentials.json"
if not firebase_admin._apps:
    cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    firebase_admin.initialize_app(cred, {"projectId": "crack-celerity-419510"})

db = firestore.client()

# Fetch latest QR codes
docs = db.collection('qr_codes').order_by('created_at', direction=firestore.Query.DESCENDING).limit(5).get()

import sys
sys.path.append("/Users/camiloayerbeposada/qr-dynamic-app/backend")
from url_manager import SecureURLManager
url_manager = SecureURLManager()

print("LATEST QR CODES:")
for doc in docs:
    data = doc.to_dict()
    encrypted_url = data.get('data', {}).get('encrypted_url')
    if encrypted_url:
        try:
            dest = url_manager.decrypt_url(encrypted_url)
        except Exception as e:
            dest = f"ERROR: {e}"
    else:
        dest = "NONE"
    
    print(f"ID: {doc.id} | Short: {data.get('short_code')} | Dest: {dest}")

