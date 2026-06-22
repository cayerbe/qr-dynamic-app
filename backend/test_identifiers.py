import unittest
import subprocess
import json
import os
os.environ["MOCK_DB"] = "1"
from identifier_service import calculate_gs1_check_digit, IdentifierService

class TestIdentifiers(unittest.TestCase):

    def test_gs1_check_digit(self):
        # Known GTIN-13: 4006381333931 (Payload: 400638133393) -> Check digit should be 1
        self.assertEqual(calculate_gs1_check_digit("400638133393"), "1")
        
        # Known GTIN-14: 10614141000415 (Payload: 1061414100041) -> Check digit should be 5
        self.assertEqual(calculate_gs1_check_digit("1061414100041"), "5")
        
        # Known SSCC: 106141412345678908 (Payload: 10614141234567890) -> Check digit should be 8
        self.assertEqual(calculate_gs1_check_digit("10614141234567890"), "8")

    def test_node_parity(self):
        # Generate a GTIN using Python logic directly to bypass DB lookup
        gtin = IdentifierService._generate_gs1_key("9999999", 14)
        
        # Construct a Digital Link URI
        uri = f"https://id.gs1.org/01/{gtin}"
        
        # Invoke the Node.js gs1_parser.js to validate it using the official digital-link.js library
        script_path = os.path.join(os.path.dirname(__file__), "gs1_parser.js")
        result = subprocess.run(["node", script_path, uri], capture_output=True, text=True, check=True)
        
        parsed = json.loads(result.stdout)
        
        # If the check digit was calculated wrong in Python, digital-link.js will mark valid = false
        self.assertTrue(parsed.get("valid"), f"Node.js digital-link.js rejected the Python-generated GTIN: {gtin}")
        self.assertEqual(parsed.get("gtin"), gtin)

if __name__ == '__main__':
    unittest.main()
