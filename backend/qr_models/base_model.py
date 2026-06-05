"""Base QR Model - Common functionality"""
from abc import ABC, abstractmethod
from datetime import datetime
import uuid

class BaseQRModel(ABC):
    """Abstract base class for all QR models"""
    
    def __init__(self, db):
        self.db = db
        self.model_type = None
        self.scan_limit = None
        self.enable_genealogy = False
        
    @abstractmethod
    def validate_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Validate if scan is allowed based on model rules"""
        pass
    
    @abstractmethod
    def process_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Process scan according to model logic"""
        pass
    
    def get_scan_count(self, qr_id: str) -> int:
        """Get current scan count for QR"""
        qr_ref = self.db.collection('qr_codes').document(qr_id)
        qr_doc = qr_ref.get()
        if qr_doc.exists:
            return qr_doc.to_dict().get('scan_statistics', {}).get('total_scans', 0)
        return 0