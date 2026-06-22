import firebase_admin
from firebase_admin import credentials, firestore
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/camiloayerbeposada/qr-dynamic-app/backend/credentials.json"
if not firebase_admin._apps:
    cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    firebase_admin.initialize_app(cred, {"projectId": "crack-celerity-419510"})

db = firestore.client()
db.collection("test").document("test").set({"hello": "world"})
print("Success")
