"""
Security monitoring for PWA scanner
Detects and logs suspicious activities
"""

import logging
from datetime import datetime, timedelta
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

class PWASecurityMonitor:
    def __init__(self, db):
        self.db = db
        self.suspicious_patterns = defaultdict(int)
        self.security_events = []
        
    def log_security_event(self, event_type, details, severity='medium'):
        """Log security event"""
        event = {
            'timestamp': datetime.utcnow(),
            'event_type': event_type,
            'severity': severity,
            'details': details,
            'ip_address': details.get('ip_address'),
            'user_agent': details.get('user_agent')
        }
        
        # Store in memory
        self.security_events.append(event)
        
        # Store in Firestore
        try:
            self.db.collection('pwa_security_events').add(event)
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
        
        # Check for attack patterns
        self.analyze_attack_patterns(event)
    
    def analyze_attack_patterns(self, event):
        """Analyze for potential attacks"""
        ip = event.get('ip_address')
        
        if not ip:
            return
        
        # Count suspicious events per IP
        self.suspicious_patterns[ip] += 1
        
        # Alert if threshold exceeded
        if self.suspicious_patterns[ip] > 10:
            self.trigger_security_alert(ip, event)
    
    def trigger_security_alert(self, ip, event):
        """Trigger security alert"""
        alert = {
            'timestamp': datetime.utcnow(),
            'alert_type': 'POTENTIAL_ATTACK',
            'ip_address': ip,
            'event_count': self.suspicious_patterns[ip],
            'latest_event': event
        }
        
        logger.warning(f"Security Alert: {json.dumps(alert, default=str)}")
        
        # Store alert
        try:
            self.db.collection('pwa_security_alerts').add(alert)
        except Exception as e:
            logger.error(f"Failed to store security alert: {e}")
    
    def check_bot_signatures(self, user_agent):
        """Check for bot signatures"""
        bot_signatures = [
            'bot', 'crawler', 'spider', 'scraper',
            'curl', 'wget', 'python-requests', 'postman'
        ]
        
        ua_lower = user_agent.lower()
        for sig in bot_signatures:
            if sig in ua_lower:
                return True, sig
        
        return False, None
    
    def check_suspicious_behavior(self, request_data):
        """Check for suspicious behavior patterns"""
        issues = []
        
        # Check user agent
        ua = request_data.get('user_agent', '')
        is_bot, bot_type = self.check_bot_signatures(ua)
        if is_bot:
            issues.append(f"Bot detected: {bot_type}")
        
        # Check rapid requests
        if request_data.get('rapid_requests'):
            issues.append("Rapid request pattern")
        
        # Check origin mismatch
        if request_data.get('origin_mismatch'):
            issues.append("Origin mismatch")
        
        return issues

def basic_device_fingerprint_check(headers: dict) -> dict:
    """
    Dummy device fingerprint checker.
    Replace with real logic for analyzing user-agent headers, device IDs, etc.
    """
    user_agent = headers.get("User-Agent", "")
    
    # Simple pattern detection placeholder
    is_suspicious = "Headless" in user_agent or "bot" in user_agent.lower()
    
    return {
        "device_fingerprint_score": 0.1 if not is_suspicious else 0.9,
        "is_suspicious_device": is_suspicious,
        "reason": "Headless browser detected" if is_suspicious else "Device appears normal"
    }

# Initialize monitor
def create_security_monitor(db):
    return PWASecurityMonitor(db)