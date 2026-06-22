import os
import sys

# Ensure shim loads
os.environ["MOCK_DB"] = "1"

from recall_traversal import check_recall_status
from sandbox_control import generate_epc, get_tenant_prefix

def verify():
    # Leaf item (SGTIN with serial 100)
    prefix = get_tenant_prefix()
    item_ref = "00001"
    leaf_epc = generate_epc("sgtin", prefix, item_ref, "100")
    
    print(f"Checking recall status for leaf item: {leaf_epc}")
    
    status = check_recall_status(leaf_epc)
    
    if status.get("recalled"):
        print(f"✅ SUCCESS: Leaf item correctly inherited recall state.")
        print(f"Recall Inherited From: {status.get('recalled_by_epc')}")
        print(f"Event Time: {status.get('event_time')}")
    else:
        print(f"❌ FAILURE: Leaf item did NOT inherit recall state.")
        sys.exit(1)

if __name__ == "__main__":
    verify()
