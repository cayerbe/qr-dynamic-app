import logging
import os
from firestore_supabase_shim import db, firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_master_data():
    logger.info("Seeding Master Data...")

    # Seed Locations
    locations = [
        {
            "gln": "8001234567891",
            "name": "Tuscany Bottling Facility A",
            "address": "Via Roma 1, Florence",
            "role": "Manufacturer",
            "coordinates": { "lat": 43.7695, "lng": 11.2558 }
        },
        {
            "gln": "8001234567892",
            "name": "Milan Central Distribution",
            "address": "Via Dante 10, Milan",
            "role": "Distributor",
            "coordinates": { "lat": 45.4642, "lng": 9.1900 }
        }
    ]

    for loc in locations:
        db.collection("locations").document(loc["gln"]).set({
            "gln": loc["gln"],
            "name": loc["name"],
            "address": loc["address"],
            "role": loc["role"],
            "coordinates": loc["coordinates"]
        })
    logger.info("Seeded locations.")

    # Seed Products
    products = [
        {
            "gtin": "08001234567890",
            "description": "Premium Extra Virgin Olive Oil 500ml",
            "allergens": ["None"],
            "credentials": ["DOP", "Organic"],
            "origin": "Tuscany, Italy",
            "shelf_life_days": 730
        },
        {
            "gtin": "08001234567891",
            "description": "Artisan Balsamic Vinegar 250ml",
            "allergens": ["Sulfites"],
            "credentials": ["IGP"],
            "origin": "Modena, Italy",
            "shelf_life_days": 1095
        }
    ]

    for prod in products:
        db.collection("products").document(prod["gtin"]).set({
            "gtin": prod["gtin"],
            "description": prod["description"],
            "allergens": prod["allergens"],
            "credentials": prod["credentials"],
            "origin": prod["origin"],
            "shelf_life_days": prod["shelf_life_days"]
        })
    logger.info("Seeded products.")

if __name__ == "__main__":
    seed_master_data()
