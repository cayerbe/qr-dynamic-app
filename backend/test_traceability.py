import unittest
from datetime import datetime
from epcis_manager import CBV, validate_event, ObjectEvent
from ai_agent import build_system_prompt

class TestTraceability(unittest.TestCase):

    def test_cbv_validation_valid(self):
        # Valid event
        event = ObjectEvent(
            epc_list=["https://id.gs1.org/01/08001234567897/10/LOT99/21/SER123"],
            action="ADD",
            biz_step=CBV.BizStep.COMMISSIONING,
            disposition=CBV.Disposition.ACTIVE,
            event_time="2026-06-22T00:00:00Z",
            event_time_zone_offset="+00:00"
        )
        self.assertTrue(validate_event(event.to_dict()))

    def test_cbv_validation_invalid_bizstep(self):
        # Invalid bizStep (not in CBV)
        event = ObjectEvent(
            epc_list=["urn:epc:id:sgtin:12345.12345.1"],
            action="ADD",
            biz_step="urn:epcglobal:cbv:bizstep:magic",
            disposition=CBV.Disposition.ACTIVE,
            event_time="2026-06-22T00:00:00Z",
            event_time_zone_offset="+00:00"
        )
        with self.assertRaises(Exception):
            validate_event(event.to_dict())

    def test_cbv_validation_invalid_disposition(self):
        # Invalid disposition (not in CBV)
        event = ObjectEvent(
            epc_list=["urn:epc:id:sgtin:12345.12345.1"],
            action="ADD",
            biz_step=CBV.BizStep.COMMISSIONING,
            disposition="urn:epcglobal:cbv:disp:magical",
            event_time="2026-06-22T00:00:00Z",
            event_time_zone_offset="+00:00"
        )
        with self.assertRaises(Exception):
            validate_event(event.to_dict())

    def test_allergen_safety(self):
        # Testing the strict allergen prompt rule
        
        # 1. Missing allergens
        prompt1 = build_system_prompt({"description": "Test"}, "verified", "consumer")
        self.assertIn("Allergen information not available", prompt1)
        
        # 2. Contains allergens
        prompt2 = build_system_prompt({"description": "Test", "allergens": ["Peanuts"]}, "verified", "consumer")
        self.assertIn("Contains Peanuts", prompt2)
        
        # 3. None explicit
        prompt3 = build_system_prompt({"description": "Test", "allergens": ["None"]}, "verified", "consumer")
        self.assertIn("This product contains no known allergens", prompt3)

if __name__ == '__main__':
    unittest.main()
