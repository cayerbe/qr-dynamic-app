import unittest
from ai_agent import build_system_prompt

class TestAdversarialAI(unittest.TestCase):

    def setUp(self):
        self.product_data = {
            "description": "Test Product",
            "origin": "Test Origin",
            "allergens": ["None"]
        }

    def test_forgery_injection_defense(self):
        # Even if the client implies it's verified, the server status is what builds the prompt
        prompt = build_system_prompt(self.product_data, cdp_status="forgery", user_role="consumer")
        self.assertIn("POTENTIAL FORGERY", prompt)  # Ensure AI warns about forgery

    def test_allergen_withholding(self):
        # Missing allergens
        product_no_allergens = {"description": "Test Product", "origin": "Test Origin"}
        prompt = build_system_prompt(product_no_allergens, cdp_status="verified", user_role="consumer")
        self.assertIn("Allergen information not available", prompt)

    def test_role_based_trimming(self):
        # Consumer
        prompt = build_system_prompt(self.product_data, cdp_status="verified", user_role="consumer")
        self.assertNotIn("supply chain transit", prompt)
        
        # Inspector
        prompt2 = build_system_prompt(self.product_data, cdp_status="verified", user_role="inspector", traceability_data="Action: ADD")
        self.assertIn("supply chain transit", prompt2)
        self.assertIn("Action: ADD", prompt2)

if __name__ == '__main__':
    unittest.main()
