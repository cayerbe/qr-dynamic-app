import os
import sys

from dotenv import load_dotenv
load_dotenv('/Users/camiloayerbeposada/qr-dynamic-app/backend/.env')

sys.path.append("/Users/camiloayerbeposada/qr-dynamic-app/backend")

from firestore_supabase_shim import ShimFirestoreClient
db = ShimFirestoreClient()

docs = db.collection('scan_logs').order_by('timestamp', direction='DESCENDING').limit(5).get()

print("LATEST SCAN LOGS IN SUPABASE:")
for doc in docs:
    print(f"ID: {doc.id}")

