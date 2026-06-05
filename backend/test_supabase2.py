import os
import sys

from dotenv import load_dotenv
load_dotenv('/Users/camiloayerbeposada/qr-dynamic-app/backend/.env')

sys.path.append("/Users/camiloayerbeposada/qr-dynamic-app/backend")

from firestore_supabase_shim import ShimFirestoreClient
db = ShimFirestoreClient()

docs = db.collection('qr_codes').order_by('created_at', direction='DESCENDING').limit(5).get()

from url_manager import SecureURLManager
url_manager = SecureURLManager()

print("LATEST QR CODES IN SUPABASE:")
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

