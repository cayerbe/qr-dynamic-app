from google.cloud import firestore

# Ensure you have set GOOGLE_APPLICATION_CREDENTIALS environment variable
db = firestore.Client(project="qr-code-database-455110")

print("Fetching QR codes from Firestore...")

docs = db.collection("qr_codes").stream()
found_any = False
for doc in docs:
    print(f"{doc.id} => {doc.to_dict()}")
    found_any = True

if not found_any:
    print("⚠️ No QR codes found in Firestore.")
