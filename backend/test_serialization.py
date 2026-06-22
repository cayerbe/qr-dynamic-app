import unittest
import xml.etree.ElementTree as ET
from epcis_manager import ObjectEvent, CBV, serialize

class TestSerialization(unittest.TestCase):

    def setUp(self):
        self.event = ObjectEvent(
            epc_list=["urn:epc:id:sgtin:12345.12345.1"],
            action="ADD",
            biz_step=CBV.BizStep.COMMISSIONING,
            disposition=CBV.Disposition.ACTIVE,
            event_time="2026-06-22T00:00:00Z",
            event_time_zone_offset="+00:00"
        )

    def test_serialize_jsonld(self):
        output = serialize(self.event, fmt="jsonld-2.0")
        self.assertEqual(output["@context"][0], "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld")
        self.assertEqual(output["type"], "EPCISDocument")
        self.assertEqual(output["schemaVersion"], "2.0")
        self.assertEqual(len(output["epcisBody"]["eventList"]), 1)
        self.assertEqual(output["epcisBody"]["eventList"][0]["action"], "ADD")

    def test_serialize_xml(self):
        output = serialize(self.event, fmt="xml-1.2")
        # Ensure it is well-formed XML
        root = ET.fromstring(output)
        
        # Verify root tags
        self.assertTrue(root.tag.endswith("EPCISDocument"))
        self.assertEqual(root.attrib["schemaVersion"], "1.2")
        
        # Verify body and event list
        body = root.find("EPCISBody")
        self.assertIsNotNone(body)
        
        event_list = body.find("EventList")
        self.assertIsNotNone(event_list)
        
        obj_evt = event_list.find("ObjectEvent")
        self.assertIsNotNone(obj_evt)
        
        # Verify required elements are present
        self.assertEqual(obj_evt.find("action").text, "ADD")
        self.assertEqual(obj_evt.find("bizStep").text, CBV.BizStep.COMMISSIONING)
        self.assertEqual(obj_evt.find("disposition").text, CBV.Disposition.ACTIVE)
        
        # Check epcList
        epc_list = obj_evt.find("epcList")
        self.assertIsNotNone(epc_list)
        self.assertEqual(epc_list.find("epc").text, "urn:epc:id:sgtin:12345.12345.1")

if __name__ == '__main__':
    unittest.main()
