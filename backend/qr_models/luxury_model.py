"""Luxury Model - Multi-scan with genealogy (Generic, not Ferrari-specific)"""
from .base_model import BaseQRModel
from google.cloud import firestore
import uuid

class LuxuryQRModel(BaseQRModel):
    """Multi-scan QR codes for luxury goods authentication"""
    
    def __init__(self, db, scan_limit=10):
        super().__init__(db)
        self.model_type = 'luxury'
        self.scan_limit = scan_limit
        self.enable_genealogy = True
        
    def validate_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Validate multi-scan with limit"""
        scan_count = self.get_scan_count(qr_id)
        
        if self.scan_limit > 0 and scan_count >= self.scan_limit:
            return {
                'valid': False,
                'reason': 'SCAN_LIMIT_REACHED',
                'message': f'Maximum scans ({self.scan_limit}) reached for this item.',
                'scan_count': scan_count
            }
        
        return {
            'valid': True,
            'remaining_scans': self.scan_limit - scan_count if self.scan_limit > 0 else 'unlimited'
        }
    
    def process_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Process luxury scan with genealogy"""
        try:
            scan_count = self.get_scan_count(qr_id)
            
            # First scan creates child QR (genealogy)
            if scan_count == 0 and self.enable_genealogy:
                child_qr = self._create_child_qr(qr_id, scan_data)
                
            # Update scan statistics
            qr_ref = self.db.collection('qr_codes').document(qr_id)
            qr_ref.update({
                'scan_statistics.total_scans': firestore.Increment(1),
                'scan_statistics.last_scanned_at': firestore.SERVER_TIMESTAMP,
                'scan_statistics.unique_scanners': firestore.ArrayUnion([
                    scan_data.get('device_id', 'unknown')
                ])
            })
            
            return {
                'success': True,
                'model': 'luxury',
                'action': 'AUTHENTICATION_VERIFIED',
                'scan_number': scan_count + 1,
                'remaining_scans': self.scan_limit - (scan_count + 1) if self.scan_limit > 0 else 'unlimited',
                'message': 'Luxury item authenticated successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_child_qr(self, parent_id: str, scan_data: dict) -> str:
        """Create child QR for genealogy tracking"""
        child_id = f"CHILD_{uuid.uuid4().hex[:8]}_{parent_id}"
        
        child_data = {
            'qr_id': child_id,
            'parent_id': parent_id,
            'generation': 1,
            'created_at': firestore.SERVER_TIMESTAMP,
            'created_by': scan_data.get('user_id', 'anonymous'),
            'model_type': 'luxury_child',
            'metadata': {
                'parent_scan_data': scan_data,
                'genealogy_enabled': True
            }
        }
        
        self.db.collection('qr_genealogy').document(child_id).set(child_data)
        return child_id