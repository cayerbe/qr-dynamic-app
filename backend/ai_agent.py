import os
import anthropic
import logging
from firestore_supabase_shim import db

logger = logging.getLogger(__name__)

# Initialize Anthropic Client
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
if not anthropic_api_key:
    logger.warning("ANTHROPIC_API_KEY not found in environment variables. Conversational AI will fail.")

def build_system_prompt(product_data, cdp_status, user_role, traceability_data=None):
    """
    Builds a strict, role-based system prompt for Anthropic Claude.
    """
    # Base instructions
    prompt = f"""You are the authoritative Brand Guardian AI for TESISQUARE.
Your task is to answer user questions about the specific product they scanned based ONLY on the provided context.
Do NOT invent information. If the answer is not in the context, say "I don't have that information."

=== PRODUCT CONTEXT ===
Name: {product_data.get('description', 'Unknown Product')}
Origin: {product_data.get('origin', 'Unknown Origin')}
"""

    # Allergen handling (STRICT rule)
    allergens = product_data.get('allergens')
    if allergens == ["None"]:
        prompt += "Allergens: This product contains no known allergens.\n"
    elif allergens:
        prompt += f"Allergens: Contains {', '.join(allergens)}.\n"
    else:
        prompt += "Allergens: Allergen information not available.\n"

    # CDP Status Injection (Server-Authoritative)
    if cdp_status == "verified":
        prompt += "Authenticity Status: VERIFIED AUTHENTIC. You can confidently assure the user this item is genuine.\n"
    elif cdp_status == "forgery":
        prompt += "Authenticity Status: POTENTIAL FORGERY. Warn the user that the item's authenticity could not be verified.\n"
    else:
        prompt += "Authenticity Status: UNKNOWN. Do not make claims about authenticity.\n"

    # Role-based context
    prompt += f"\n=== USER CONTEXT ===\nThe current user role is: {user_role.upper()}\n"
    
    if user_role == "consumer":
        prompt += "Keep answers friendly, concise, and non-technical. Focus on origin, allergens, and authenticity."
    elif user_role == "inspector":
        prompt += "Provide technical details. Be formal. Emphasize supply chain transit, holding status, and batch information."
        if traceability_data:
            prompt += f"\n=== TRACEABILITY DATA ===\n{traceability_data}\n"
    else:
        prompt += "Provide standard information."

    return prompt

def generate_chat_response(messages, product_data, cdp_status, user_role, traceability_data=None):
    if not anthropic_api_key:
        return "Chat service is currently unavailable (API key missing)."
        
    client = anthropic.Anthropic(api_key=anthropic_api_key)
    system_prompt = build_system_prompt(product_data, cdp_status, user_role, traceability_data)
    
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            temperature=0.2, # Low temperature for factual grounding
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        return "I'm having trouble connecting to my knowledge base right now. Please try again later."
