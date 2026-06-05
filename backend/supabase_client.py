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

def upload_to_supabase_storage(file_data, file_name, content_type="image/png", bucket_name="qr_codes"):
    try:
        if not supabase:
            return None
        res = supabase.storage.from_(bucket_name).upload(
            file=file_data,
            path=file_name,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return supabase.storage.from_(bucket_name).get_public_url(file_name)
    except Exception as e:
        print(f"Supabase Storage upload failed: {e}")
        # Sometimes upload throws if it already exists even with upsert depending on RLS. We can just return the URL anyway if we expect it's there.
        return supabase.storage.from_(bucket_name).get_public_url(file_name)

def download_from_supabase_storage(file_name, bucket_name="qr_codes"):
    try:
        if not supabase:
            return None
        return supabase.storage.from_(bucket_name).download(file_name)
    except Exception as e:
        print(f"Supabase Storage download failed: {e}")
        return None
