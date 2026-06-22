import unittest
import uuid
from recall_traversal import check_recall_status
from firestore_supabase_shim import db
from epcis_manager import CBV

class TestRecallTraversal(unittest.TestCase):
    
    def setUp(self):
        # Create mock data in Firestore for testing
        self.parent_epc = f"urn:epc:id:sgtin:mock.parent.{uuid.uuid4().hex[:6]}"
        self.child_epc = f"urn:epc:id:sgtin:mock.child.{uuid.uuid4().hex[:6]}"
        
        # 1. Commission parent
        db.collection("epcis_events").document("event1").set({
            "eventID": "event1",
            "epcList": [self.parent_epc],
            "action": "ADD",
            "bizStep": CBV.BizStep.COMMISSIONING,
            "disposition": CBV.Disposition.ACTIVE,
            "eventTime": "2026-06-22T00:00:00Z"
        })
        
        # 2. Commission child
        db.collection("epcis_events").document("event2").set({
            "eventID": "event2",
            "epcList": [self.child_epc],
            "action": "ADD",
            "bizStep": CBV.BizStep.COMMISSIONING,
            "disposition": CBV.Disposition.ACTIVE,
            "eventTime": "2026-06-22T00:00:01Z"
        })
        
        # 3. Aggregate child into parent
        db.collection("qr_genealogy").document(self.child_epc).set({
            "parent_id": self.parent_epc,
            "event_id": "agg_event1",
            "timestamp": "2026-06-22T00:00:02Z"
        })
        
        # 4. Recall parent
        db.collection("epcis_events").document("event3").set({
            "eventID": "event3",
            "epcList": [self.parent_epc],
            "action": "ADD",
            "bizStep": CBV.BizStep.HOLDING,
            "disposition": CBV.Disposition.RECALLED,
            "eventTime": "2026-06-22T00:00:03Z"
        })

    def test_child_inherits_parent_recall(self):
        # The child is active, but parent is recalled
        # The traversal should climb from child -> parent and find the recall
        result = check_recall_status(self.child_epc)
        self.assertTrue(result["recalled"])
        self.assertEqual(result["recalled_by_epc"], self.parent_epc)

    def test_safe_product(self):
        safe_epc = f"urn:epc:id:sgtin:mock.safe.{uuid.uuid4().hex[:6]}"
        db.collection("epcis_events").document("event_safe").set({
            "eventID": "event_safe",
            "epcList": [safe_epc],
            "action": "ADD",
            "bizStep": CBV.BizStep.COMMISSIONING,
            "disposition": CBV.Disposition.ACTIVE,
            "eventTime": "2026-06-22T00:00:00Z"
        })
        
        result = check_recall_status(safe_epc)
        self.assertFalse(result["recalled"])

if __name__ == '__main__':
    unittest.main()
