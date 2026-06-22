#!/usr/bin/env python
import argparse
import yaml
import os
import qrcode
from datetime import datetime, timezone
import uuid

# Set environment before imports to ensure shim connects
os.environ["MOCK_DB"] = "1"
from firestore_supabase_shim import db
from epcis_manager import CBV
from webhook_worker import enqueue_webhook

def get_tenant_prefix():
    # Use standard 9999999 test prefix
    return "9999999"

def generate_epc(key_type, prefix, item_ref, serial=None):
    if key_type == "sgtin":
        return f"urn:epc:id:sgtin:{prefix}.{item_ref}.{serial}"
    elif key_type == "sscc":
        return f"urn:epc:id:sscc:{prefix}.{item_ref}"

def _add_event(ev_dict):
    ev_dict["source"] = "sandbox"
    db.collection("epcis_events").document(ev_dict["eventID"]).set(ev_dict)
    # Check for diversion logic implicitly (if readPoint is unauthorized, we'd trigger an alert)
    if ev_dict.get("bizLocation") == "LOC-UNAUTH-COUNTRY" or ev_dict.get("readPoint") == "LOC-UNAUTH-COUNTRY":
        print(f"🚨 DIVERSION DETECTED at {ev_dict.get('bizLocation')}!")
        # Enqueue webhook
        enqueue_webhook(ev_dict)

def seed_sandbox():
    with open("sandbox/olive_oil.yaml", "r") as f:
        config = yaml.safe_load(f)
        
    print("🌱 Seeding Master Data...")
    for p in config.get("products", []):
        p["source"] = "sandbox"
        db.collection("products").document(p["gtin"]).set(p)
        print(f"  Added Product: {p['gtin']}")
        
    for l in config.get("locations", []):
        l["source"] = "sandbox"
        db.collection("locations").document(l["gln"]).set(l)
        print(f"  Added Location: {l['gln']}")
        
    print("📦 Provisioning Timeline...")
    timeline = config.get("timeline")
    product = timeline["product"]
    lot = timeline["commission_lot"]
    n_items = timeline["num_items"]
    n_cases = timeline["num_cases"]
    n_pallets = timeline["num_pallets"]
    
    prefix = get_tenant_prefix()
    item_ref = "00001" # Mock item ref for P1
    
    # 1. Commission items
    item_epcs = [generate_epc("sgtin", prefix, item_ref, str(100+i)) for i in range(n_items)]
    
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "ADD",
        "bizStep": CBV.BizStep.COMMISSIONING,
        "disposition": CBV.Disposition.ACTIVE,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": item_epcs,
        "bizLocation": "LOC-BOTTLE-TUSC"
    })
    
    # 2. Aggregation: Items -> Cases
    items_per_case = n_items // n_cases
    case_epcs = []
    for c in range(n_cases):
        case_epc = generate_epc("sscc", prefix, str(1000+c))
        case_epcs.append(case_epc)
        child_epcs = item_epcs[c*items_per_case : (c+1)*items_per_case]
        _add_event({
            "eventID": f"urn:uuid:{uuid.uuid4()}",
            "type": "AggregationEvent",
            "action": "ADD",
            "bizStep": CBV.BizStep.PACKING,
            "disposition": CBV.Disposition.IN_PROGRESS,
            "eventTime": datetime.now(timezone.utc).isoformat(),
            "eventTimeZoneOffset": "+00:00",
            "recordTime": datetime.now(timezone.utc).isoformat(),
            "parentID": case_epc,
            "childEPCs": child_epcs,
            "bizLocation": "LOC-BOTTLE-TUSC"
        })
        
    # 3. Aggregation: Cases -> Pallet
    pallet_epc = generate_epc("sscc", prefix, str(9000))
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "AggregationEvent",
        "action": "ADD",
        "bizStep": CBV.BizStep.PACKING,
        "disposition": CBV.Disposition.IN_PROGRESS,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "parentID": pallet_epc,
        "childEPCs": case_epcs,
        "bizLocation": "LOC-BOTTLE-TUSC"
    })
    
    # 4. Shipping
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "OBSERVE",
        "bizStep": CBV.BizStep.SHIPPING,
        "disposition": CBV.Disposition.IN_TRANSIT,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": [pallet_epc],
        "bizLocation": "LOC-BOTTLE-TUSC"
    })
    
    # 5. Receiving
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "OBSERVE",
        "bizStep": CBV.BizStep.RECEIVING,
        "disposition": CBV.Disposition.ACTIVE,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": [pallet_epc],
        "bizLocation": "LOC-DC-AUTH"
    })
    
    print("✅ Scenario seeded successfully.")

def divert():
    # Inject a scan in an unauthorized location
    print("🕵️‍♂️ Injecting Gray Market Diversion Event...")
    prefix = get_tenant_prefix()
    item_ref = "00001"
    diverted_item = generate_epc("sgtin", prefix, item_ref, "100") # Grab the first item
    
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "OBSERVE",
        "bizStep": "urn:epcglobal:cbv:bizstep:retail_selling",
        "disposition": CBV.Disposition.ACTIVE,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": [diverted_item],
        "bizLocation": "LOC-UNAUTH-COUNTRY"
    })
    print(f"✅ Diversion event recorded for {diverted_item} at LOC-UNAUTH-COUNTRY")

def recall():
    print("🚨 Triggering Recall on Pallet...")
    pallet_epc = generate_epc("sscc", get_tenant_prefix(), "9000")
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "ADD",
        "bizStep": CBV.BizStep.HOLDING,
        "disposition": CBV.Disposition.RECALLED,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": [pallet_epc],
        "bizLocation": "LOC-DC-AUTH"
    })
    print(f"✅ Pallet {pallet_epc} recalled.")

def reverse():
    print("✅ Reversing Recall on Pallet...")
    pallet_epc = generate_epc("sscc", get_tenant_prefix(), "9000")
    _add_event({
        "eventID": f"urn:uuid:{uuid.uuid4()}",
        "type": "ObjectEvent",
        "action": "ADD",
        "bizStep": CBV.BizStep.HOLDING,
        "disposition": CBV.Disposition.ACTIVE,
        "eventTime": datetime.now(timezone.utc).isoformat(),
        "eventTimeZoneOffset": "+00:00",
        "recordTime": datetime.now(timezone.utc).isoformat(),
        "epcList": [pallet_epc],
        "bizLocation": "LOC-DC-AUTH"
    })
    print(f"✅ Pallet {pallet_epc} recall reversed.")

def generate_qrs():
    print("🖨️ Generating QR codes...")
    out_dir = "sandbox/out"
    os.makedirs(out_dir, exist_ok=True)
    
    prefix = get_tenant_prefix()
    item_ref = "00001"
    
    for i in range(3):
        serial = str(100+i)
        gtin = prefix + item_ref
        uri = f"https://id.gs1.org/01/{gtin}/10/LOT-OO-001/21/{serial}"
        img = qrcode.make(uri)
        path = os.path.join(out_dir, f"item_{serial}.png")
        img.save(path)
        print(f"Saved QR for serial {serial} to {path}")

def reset():
    print("🗑️ Purging sandbox data...")
    collections = ["products", "locations", "epcis_events"]
    for col in collections:
        docs = db.collection(col).where("source", "==", "sandbox").get()
        count = 0
        for doc in docs:
            db.collection(col).document(doc.id).delete()
            count += 1
        print(f"  Purged {count} records from {col}")
    print("✅ Reset complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sandbox Control")
    parser.add_argument("cmd", choices=["seed", "divert", "recall", "reverse", "qr", "reset"])
    args = parser.parse_args()
    
    if args.cmd == "seed":
        seed_sandbox()
    elif args.cmd == "divert":
        divert()
    elif args.cmd == "recall":
        recall()
    elif args.cmd == "reverse":
        reverse()
    elif args.cmd == "qr":
        generate_qrs()
    elif args.cmd == "reset":
        reset()
