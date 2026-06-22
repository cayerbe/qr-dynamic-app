import logging
from firestore_supabase_shim import db, firestore
from epcis_manager import CBV

logger = logging.getLogger(__name__)

def check_recall_status(epc_uri):
    """
    Traverses the genealogy tree to determine if the given EPC,
    or any of its ancestors, is currently in a RECALLED state.
    
    Returns:
        dict: {
            "recalled": bool,
            "recalled_by_epc": str or None,
            "event_time": str or None
        }
    """
    current_epc = epc_uri
    visited = set()

    while current_epc and current_epc not in visited:
        visited.add(current_epc)
        
        # 1. Check direct EPCIS events for this EPC
        # An EPC could be in epcList (ObjectEvent) or parentID (AggregationEvent)
        # We query both and find the latest one.
        
        # Query where EPC is in epcList
        object_events = db.collection("epcis_events") \
            .where("epcList", "array_contains", current_epc) \
            .get()
            
        # Query where EPC is parentID
        agg_events = db.collection("epcis_events") \
            .where("parentID", "==", current_epc) \
            .get()
            
        all_events = []
        for doc in object_events:
            all_events.append(doc.to_dict())
        for doc in agg_events:
            all_events.append(doc.to_dict())
            
        # Sort by eventTime descending to get the latest
        all_events.sort(key=lambda x: x.get("eventTime", ""), reverse=True)
        
        if all_events:
            latest_event = all_events[0]
            if latest_event.get("disposition") == CBV.Disposition.RECALLED:
                logger.info(f"Recall detected: EPC {current_epc} is RECALLED.")
                return {
                    "recalled": True,
                    "recalled_by_epc": current_epc,
                    "event_time": latest_event.get("eventTime")
                }
                
        # 2. If not recalled, move to parent
        # Find the most recent AggregationEvent where this EPC was in childEPCs
        child_agg_events = db.collection("epcis_events") \
            .where("childEPCs", "array_contains", current_epc) \
            .get()
            
        agg_list = [doc.to_dict() for doc in child_agg_events]
        agg_list.sort(key=lambda x: x.get("eventTime", ""), reverse=True)
        
        if agg_list:
            latest_agg = agg_list[0]
            # If the latest aggregation action was ADD, the item is currently in that parent
            if latest_agg.get("action") == "ADD":
                parent_epc = latest_agg.get("parentID")
                if parent_epc:
                    logger.info(f"Traversing up physical hierarchy: {current_epc} -> {parent_epc}")
                    current_epc = parent_epc
                    continue
                
        # No parent found or latest action was DELETE, traversal ends
        break

    return {
        "recalled": False,
        "recalled_by_epc": None,
        "event_time": None
    }
