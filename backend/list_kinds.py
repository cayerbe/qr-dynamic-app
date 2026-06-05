from google.cloud import datastore

client = datastore.Client(project="crack-celerity-419510")

# List of possible known kinds
possible_kinds = [
    "qr_codes",
    "qr_urls",
    "users",
    "qr_forgery_logs",
    "dashboard_stats",
    "scan_trends"
]

print("📦 Checking known Kinds...")
for kind in possible_kinds:
    try:
        query = client.query(kind=kind)
        query.keys_only()
        result = list(query.fetch(limit=1))  # Just fetch one item to verify existence
        if result:
            print(f"✅ Found kind: {kind}")
        else:
            print(f"⚠️ Kind '{kind}' exists but is empty")
    except Exception as e:
        print(f"❌ Error querying kind '{kind}': {e}")
