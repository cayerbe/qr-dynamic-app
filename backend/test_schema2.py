import os
import sys

from dotenv import load_dotenv
load_dotenv('/Users/camiloayerbeposada/qr-dynamic-app/backend/.env')

from supabase import create_client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table('qr_scan_logs').select("*").limit(1).execute()
print("SCAN LOGS SCHEMA:", res.data[0].keys() if res.data else "No rows to infer from")

