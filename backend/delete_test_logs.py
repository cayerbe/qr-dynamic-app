import os
from dotenv import load_dotenv
load_dotenv('/Users/camiloayerbeposada/qr-dynamic-app/backend/.env')

from supabase import create_client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

supabase.table('qr_scan_logs').delete().eq('qr_id', 'QR_1780649883_be86602e').execute()
print("Deleted test logs")

