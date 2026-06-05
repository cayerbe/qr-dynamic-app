"""Commodity Model - Mass production tracking"""
from .base_model import BaseQRModel
from firestore_supabase_shim import firestore
import uuid

class CommodityQRModel(BaseQRModel):
    """Unlimited scan QR codes for mass-produced items"""
    
    def __init__(self, db, batch_size=10000):
        super().__init__(db)
        self.model_type = 'commodity'
        self.scan_limit = -1  # Unlimited
        self.enable_genealogy = True
        self.batch_size = batch_size
        
    def validate_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Always valid for commodity items"""
        return {
            'valid': True,
            'remaining_scans': 'unlimited'
        }
    
    def process_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Process commodity scan with batch tracking"""
        try:
            scan_count = self.get_scan_count(qr_id)
            
            # Create new mother QR every batch_size scans
            if scan_count > 0 and scan_count % self.batch_size == 0:
                self._create_new_mother(qr_id, scan_count)
            
            # Update scan statistics
            qr_ref = self.db.collection('qr_codes').document(qr_id)
            qr_ref.update({
                'scan_statistics.total_scans': firestore.Increment(1),
                'scan_statistics.last_scanned_at': firestore.SERVER_TIMESTAMP,
                'scan_statistics.batch_number': scan_count // self.batch_size
            })
            
            # Log geographic distribution
            if 'location' in scan_data:
                qr_ref.update({
                    'distribution.locations': firestore.ArrayUnion([
                        scan_data['location'].get('country', 'Unknown')
                    ])
                })
            
            return {
                'success': True,
                'model': 'commodity',
                'action': 'ITEM_TRACKED',
                'scan_number': scan_count + 1,
                'batch_number': scan_count // self.batch_size,
                'message': 'Product scan recorded successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_new_mother(self, current_id: str, scan_count: int) -> str:
        """Create new mother QR for next batch"""
        batch_number = scan_count // self.batch_size
        mother_id = f"MOTHER_BATCH_{batch_number}_{uuid.uuid4().hex[:8]}"
        
        mother_data = {
            'qr_id': mother_id,
            'previous_mother': current_id,
            'batch_number': batch_number,
            'created_at': firestore.SERVER_TIMESTAMP,
            'model_type': 'commodity_mother',
            'metadata': {
                'batch_size': self.batch_size,
                'scan_milestone': scan_count
            }
        }
        
        self.db.collection('qr_genealogy').document(mother_id).set(mother_data)
        return mother_id