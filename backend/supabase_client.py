import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY", "")

# Initialize the Supabase client if credentials are provided
if url and key:
    supabase: Client = create_client(url, key)
else:
    # Print warning if credentials are missing
    print("Warning: Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    supabase = None

# Helper to emulate Firestore's db.collection behavior partially,
# or just export supabase client directly.
