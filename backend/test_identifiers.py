import unittest
from identifier_service import calculate_gs1_check_digit

class TestIdentifiers(unittest.TestCase):

    def test_gs1_check_digit(self):
        # Known GTIN-13: 4006381333931 (Payload: 400638133393) -> Check digit should be 1
        self.assertEqual(calculate_gs1_check_digit("400638133393"), "1")
        
        # Known GTIN-14: 10614141000415 (Payload: 1061414100041) -> Check digit should be 5
        self.assertEqual(calculate_gs1_check_digit("1061414100041"), "5")
        
        # Known SSCC: 106141412345678908 (Payload: 10614141234567890) -> Check digit should be 8
        self.assertEqual(calculate_gs1_check_digit("10614141234567890"), "8")

if __name__ == '__main__':
    unittest.main()
