"""Fintech Model - One-time scan for payments/tickets"""
from .base_model import BaseQRModel
from google.cloud import firestore

class FintechQRModel(BaseQRModel):
    """One-time use QR codes for financial transactions"""
    
    def __init__(self, db):
        super().__init__(db)
        self.model_type = 'fintech'
        self.scan_limit = 1
        self.enable_genealogy = False
    
    def validate_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Validate one-time use"""
        scan_count = self.get_scan_count(qr_id)
        
        if scan_count >= self.scan_limit:
            return {
                'valid': False,
                'reason': 'QR_ALREADY_USED',
                'message': 'This QR code has already been scanned and cannot be reused.',
                'scan_count': scan_count
            }
        
        return {
            'valid': True,
            'remaining_scans': self.scan_limit - scan_count
        }
    
    def process_scan(self, qr_id: str, scan_data: dict) -> dict:
        """Process fintech scan - mark as used"""
        try:
            # Update QR as used
            qr_ref = self.db.collection('qr_codes').document(qr_id)
            qr_ref.update({
                'scan_statistics.total_scans': firestore.Increment(1),
                'scan_statistics.last_scanned_at': firestore.SERVER_TIMESTAMP,
                'status': 'USED',
                'used_at': firestore.SERVER_TIMESTAMP,
                'used_by': scan_data.get('user_id', 'anonymous')
            })
            
            return {
                'success': True,
                'model': 'fintech',
                'action': 'PAYMENT_COMPLETED',
                'message': 'Transaction processed successfully'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }