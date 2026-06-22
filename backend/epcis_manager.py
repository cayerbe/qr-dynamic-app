import uuid
from datetime import datetime
import jsonschema
import xml.etree.ElementTree as ET
from xml.dom import minidom

# ---------------------------------------------------------
# CBV (Core Business Vocabulary) Constants
# ---------------------------------------------------------

class CBV:
    class BizStep:
        COMMISSIONING = "urn:epcglobal:cbv:bizstep:commissioning"
        PACKING = "urn:epcglobal:cbv:bizstep:packing"
        SHIPPING = "urn:epcglobal:cbv:bizstep:shipping"
        RECEIVING = "urn:epcglobal:cbv:bizstep:receiving"
        TRANSFORMING = "urn:epcglobal:cbv:bizstep:transforming"
        HOLDING = "urn:epcglobal:cbv:bizstep:holding"
        DECOMMISSIONING = "urn:epcglobal:cbv:bizstep:decommissioning"

        @classmethod
        def all(cls):
            return [cls.COMMISSIONING, cls.PACKING, cls.SHIPPING, cls.RECEIVING, cls.TRANSFORMING, cls.HOLDING, cls.DECOMMISSIONING]

    class Disposition:
        ACTIVE = "urn:epcglobal:cbv:disp:active"
        IN_PROGRESS = "urn:epcglobal:cbv:disp:in_progress"
        IN_TRANSIT = "urn:epcglobal:cbv:disp:in_transit"
        SELLABLE_ACCESSIBLE = "urn:epcglobal:cbv:disp:sellable_accessible"
        RECALLED = "urn:epcglobal:cbv:disp:recalled"
        DESTROYED = "urn:epcglobal:cbv:disp:destroyed"

        @classmethod
        def all(cls):
            return [cls.ACTIVE, cls.IN_PROGRESS, cls.IN_TRANSIT, cls.SELLABLE_ACCESSIBLE, cls.RECALLED, cls.DESTROYED]

# ---------------------------------------------------------
# Schema Validation
# ---------------------------------------------------------

EPCIS_2_0_SCHEMA = {
    "type": "object",
    "required": ["eventID", "type", "action", "bizStep", "disposition", "eventTime", "eventTimeZoneOffset", "recordTime"],
    "properties": {
        "eventID": {"type": "string"},
        "type": {"type": "string", "enum": ["ObjectEvent", "AggregationEvent", "TransformationEvent"]},
        "action": {"type": "string", "enum": ["ADD", "OBSERVE", "DELETE"]},
        "bizStep": {"type": "string", "enum": CBV.BizStep.all()},
        "disposition": {"type": "string", "enum": CBV.Disposition.all()},
        "eventTime": {"type": "string", "format": "date-time"},
        "eventTimeZoneOffset": {"type": "string"},
        "recordTime": {"type": "string", "format": "date-time"},
        "epcList": {"type": "array", "items": {"type": "string"}},
        "parentID": {"type": "string"},
        "childEPCs": {"type": "array", "items": {"type": "string"}},
        "bizLocation": {"type": "string"},
        "readPoint": {"type": "string"},
        "authorizingUID": {"type": "string"}
    }
}

def validate_event(event_dict):
    jsonschema.validate(instance=event_dict, schema=EPCIS_2_0_SCHEMA)
    return True

# ---------------------------------------------------------
# Domain Models
# ---------------------------------------------------------

class EPCISEvent:
    def __init__(self, event_type, action, biz_step, disposition, event_time, event_time_zone_offset, biz_location=None, read_point=None, authorizing_uid=None):
        self.event_id = f"urn:uuid:{uuid.uuid4()}"
        self.type = event_type
        self.action = action
        self.biz_step = biz_step
        self.disposition = disposition
        self.event_time = event_time
        self.event_time_zone_offset = event_time_zone_offset
        self.record_time = datetime.utcnow().isoformat() + "Z"
        self.biz_location = biz_location
        self.read_point = read_point
        self.authorizing_uid = authorizing_uid

    def to_dict(self):
        d = {
            "eventID": self.event_id,
            "type": self.type,
            "action": self.action,
            "bizStep": self.biz_step,
            "disposition": self.disposition,
            "eventTime": self.event_time,
            "eventTimeZoneOffset": self.event_time_zone_offset,
            "recordTime": self.record_time,
        }
        if self.biz_location:
            d["bizLocation"] = self.biz_location
        if self.read_point:
            d["readPoint"] = self.read_point
        if self.authorizing_uid:
            d["authorizingUID"] = self.authorizing_uid
        return d

class ObjectEvent(EPCISEvent):
    def __init__(self, epc_list, action, biz_step, disposition, event_time, event_time_zone_offset, **kwargs):
        super().__init__("ObjectEvent", action, biz_step, disposition, event_time, event_time_zone_offset, **kwargs)
        self.epc_list = epc_list

    def to_dict(self):
        d = super().to_dict()
        d["epcList"] = self.epc_list
        return d

class AggregationEvent(EPCISEvent):
    def __init__(self, parent_id, child_epcs, action, biz_step, disposition, event_time, event_time_zone_offset, **kwargs):
        super().__init__("AggregationEvent", action, biz_step, disposition, event_time, event_time_zone_offset, **kwargs)
        self.parent_id = parent_id
        self.child_epcs = child_epcs

    def to_dict(self):
        d = super().to_dict()
        d["parentID"] = self.parent_id
        d["childEPCs"] = self.child_epcs
        return d

# ---------------------------------------------------------
# Dual Serialization
# ---------------------------------------------------------

def serialize_jsonld(events):
    if not isinstance(events, list):
        events = [events]
    return {
        "@context": ["https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld"],
        "type": "EPCISDocument",
        "schemaVersion": "2.0",
        "creationDate": datetime.utcnow().isoformat() + "Z",
        "epcisBody": {
            "eventList": [e.to_dict() if hasattr(e, 'to_dict') else e for e in events]
        }
    }

def serialize_xml_1_2(events):
    if not isinstance(events, list):
        events = [events]
        
    epcis_doc = ET.Element("epcis:EPCISDocument", {
        "xmlns:epcis": "urn:epcglobal:epcis:xsd:1",
        "schemaVersion": "1.2",
        "creationDate": datetime.utcnow().isoformat() + "Z"
    })
    epcis_body = ET.SubElement(epcis_doc, "EPCISBody")
    event_list = ET.SubElement(epcis_body, "EventList")
    
    for event in events:
        e_dict = event.to_dict() if hasattr(event, 'to_dict') else event
        e_type = e_dict.get("type", "ObjectEvent")
        
        evt_el = ET.SubElement(event_list, e_type)
        
        # Required Common Fields
        ET.SubElement(evt_el, "eventTime").text = e_dict.get("eventTime", "")
        ET.SubElement(evt_el, "recordTime").text = e_dict.get("recordTime", "")
        ET.SubElement(evt_el, "eventTimeZoneOffset").text = e_dict.get("eventTimeZoneOffset", "+00:00")
        
        # Type specific
        if e_type == "ObjectEvent":
            epc_list_el = ET.SubElement(evt_el, "epcList")
            for epc in e_dict.get("epcList", []):
                ET.SubElement(epc_list_el, "epc").text = epc
        elif e_type == "AggregationEvent":
            ET.SubElement(evt_el, "parentID").text = e_dict.get("parentID", "")
            child_epcs_el = ET.SubElement(evt_el, "childEPCs")
            for epc in e_dict.get("childEPCs", []):
                ET.SubElement(child_epcs_el, "epc").text = epc
                
        ET.SubElement(evt_el, "action").text = e_dict.get("action", "")
        ET.SubElement(evt_el, "bizStep").text = e_dict.get("bizStep", "")
        ET.SubElement(evt_el, "disposition").text = e_dict.get("disposition", "")
        
        if e_dict.get("readPoint"):
            rp_el = ET.SubElement(evt_el, "readPoint")
            ET.SubElement(rp_el, "id").text = e_dict.get("readPoint")
        if e_dict.get("bizLocation"):
            bl_el = ET.SubElement(evt_el, "bizLocation")
            ET.SubElement(bl_el, "id").text = e_dict.get("bizLocation")
            
    xml_str = ET.tostring(epcis_doc, encoding="utf-8")
    parsed = minidom.parseString(xml_str)
    return parsed.toprettyxml(indent="  ")

def serialize(events, fmt="jsonld-2.0"):
    """
    Dispatcher to serialize one or more events into the requested format.
    fmt: 'jsonld-2.0' (default) or 'xml-1.2'
    """
    if fmt == "xml-1.2":
        return serialize_xml_1_2(events)
    return serialize_jsonld(events)
