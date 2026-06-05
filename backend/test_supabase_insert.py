import os
import sys
import uuid

from dotenv import load_dotenv
load_dotenv('/Users/camiloayerbeposada/qr-dynamic-app/backend/.env')

sys.path.append("/Users/camiloayerbeposada/qr-dynamic-app/backend")

from firestore_supabase_shim import ShimFirestoreClient
db = ShimFirestoreClient()

try:
    log_data = {
        'qr_id': 'QR_1780649883_be86602e',
        'timestamp': '2026-06-05T09:00:00Z',
        'overall_authenticity': 'AUTHENTIC'
    }
    db.collection('qr_scan_logs').document(str(uuid.uuid4())).set(log_data)
    print("Insert SUCCESS")
except Exception as e:
    print(f"Insert ERROR: {e}")

