import random
import string
from firestore_supabase_shim import db

def calculate_gs1_check_digit(digits_str: str) -> str:
    """
    Standard Modulo 10 GS1 check digit algorithm.
    """
    if not digits_str.isdigit():
        raise ValueError("Must contain only digits")
        
    total = 0
    # Process from right to left (excluding the check digit position)
    reversed_digits = digits_str[::-1]
    
    for i, char in enumerate(reversed_digits):
        num = int(char)
        # Even positions (0-indexed right-to-left) multiply by 3, odd by 1
        if i % 2 == 0:
            total += num * 3
        else:
            total += num * 1
            
    nearest_ten = ((total + 9) // 10) * 10
    check_digit = nearest_ten - total
    return str(check_digit)

class IdentifierService:
    @staticmethod
    def get_tenant_config(tenant_id):
        doc = db.collection("tenants").document(tenant_id).get()
        if doc.exists:
            return doc.to_dict()
        # Default fallback
        return {
            "gs1_company_prefix": "9999999", 
            "identifier_mode": "minted",
            "epcis_format": "jsonld-2.0"
        }

    @staticmethod
    def _generate_gs1_key(prefix: str, length: int) -> str:
        """Generates a random key starting with prefix, padded to length, plus check digit"""
        payload_len = length - 1
        random_part_len = payload_len - len(prefix)
        if random_part_len < 0:
            raise ValueError("Prefix is too long for the requested GS1 key length")
            
        random_digits = ''.join(random.choices(string.digits, k=random_part_len))
        payload = prefix + random_digits
        return payload + calculate_gs1_check_digit(payload)

    @staticmethod
    def generate_gtin(tenant_id: str) -> str:
        """Returns a GTIN-14"""
        config = IdentifierService.get_tenant_config(tenant_id)
        prefix = config.get("gs1_company_prefix", "9999999")
        # GTIN-14 length is 14
        return IdentifierService._generate_gs1_key(prefix, 14)

    @staticmethod
    def generate_gln(tenant_id: str) -> str:
        """Returns a GLN (13 digits)"""
        config = IdentifierService.get_tenant_config(tenant_id)
        prefix = config.get("gs1_company_prefix", "9999999")
        return IdentifierService._generate_gs1_key(prefix, 13)

    @staticmethod
    def generate_sscc(tenant_id: str) -> str:
        """Returns an SSCC (18 digits)"""
        config = IdentifierService.get_tenant_config(tenant_id)
        prefix = config.get("gs1_company_prefix", "9999999")
        # SSCC usually starts with an extension digit (0-9). We'll use '0'.
        return IdentifierService._generate_gs1_key("0" + prefix, 18)

    @staticmethod
    def to_epc_uri(key_type: str, gs1_key: str, serial_or_lot: str = None) -> str:
        """
        Converts GS1 keys to EPC URIs.
        Very simplified POC implementation.
        """
        if key_type == "sgtin":
            # For EPC URI: sgtin:CompanyPrefix.ItemRef.Serial
            # Real conversion extracts prefix from GTIN. For POC:
            # We assume a 7-digit prefix
            prefix = gs1_key[1:8]
            item_ref = gs1_key[0] + gs1_key[8:13]
            return f"urn:epc:id:sgtin:{prefix}.{item_ref}.{serial_or_lot}"
        elif key_type == "sscc":
            prefix = gs1_key[1:8]
            serial_ref = gs1_key[0] + gs1_key[8:17]
            return f"urn:epc:id:sscc:{prefix}.{serial_ref}"
        elif key_type == "gln":
            prefix = gs1_key[0:7]
            loc_ref = gs1_key[7:12]
            return f"urn:epc:id:sgln:{prefix}.{loc_ref}.0"
            
        return f"urn:epc:id:{key_type}:{gs1_key}"
