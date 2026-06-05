# alert_notification_service.py
import os
from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)

class AlertNotificationService:
    """
    Service to send real-time alerts via SMS and Email when QR codes are scanned
    """
    
    def __init__(self):
        # Twilio configuration
        self.twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        self.twilio_from_number = os.environ.get('TWILIO_FROM_NUMBER')
        
        # Email configuration (using SendGrid or Gmail SMTP)
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_username = os.environ.get('SMTP_USERNAME')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.email_from = os.environ.get('EMAIL_FROM', 'alerts@qr-dynamic-cdp.com')
        
        # Initialize Twilio client
        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not found - SMS alerts disabled")
    
    def send_scan_alert(self, scan_data: Dict, qr_data: Dict) -> Dict:
        """
        Send alert notifications for a QR code scan
        """
        results = {
            'sms_sent': [],
            'sms_failed': [],
            'email_sent': [],
            'email_failed': []
        }
        
        # Extract alert recipients from QR data
        alert_config = qr_data.get('alert_config', {})
        phone_numbers = alert_config.get('phone_numbers', [])
        email_addresses = alert_config.get('email_addresses', [])
        
        if not phone_numbers and not email_addresses:
            logger.info(f"No alert recipients configured for QR {scan_data['qr_id']}")
            return results
        
        # Prepare alert message
        alert_message = self._prepare_alert_message(scan_data, qr_data)
        
        # Send SMS alerts
        for phone in phone_numbers:
            try:
                self._send_sms(phone['country_code'], phone['number'], alert_message['sms'])
                results['sms_sent'].append(phone)
            except Exception as e:
                logger.error(f"Failed to send SMS to {phone}: {str(e)}")
                results['sms_failed'].append({'phone': phone, 'error': str(e)})
        
        # Send email alerts
        for email in email_addresses:
            try:
                self._send_email(email, alert_message['email_subject'], 
                               alert_message['email_body'], alert_message['email_html'])
                results['email_sent'].append(email)
            except Exception as e:
                logger.error(f"Failed to send email to {email}: {str(e)}")
                results['email_failed'].append({'email': email, 'error': str(e)})
        
        return results
    
    def _prepare_alert_message(self, scan_data: Dict, qr_data: Dict) -> Dict:
        """
        Prepare alert messages for SMS and Email
        """
        # Extract key information
        qr_id = scan_data['qr_id']
        scan_id = scan_data['scan_id']
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        
        # Security analysis results
        security = scan_data.get('anti_forgery_analysis', {})
        authenticity = security.get('overall_authenticity', 'UNKNOWN')
        confidence = security.get('confidence_score', 0)
        risk_score = security.get('total_risk_score', 0)
        
        # Location and device info
        location = scan_data.get('location_info', {})
        device = scan_data.get('device_info', {})
        
        # Build location string
        location_str = f"{location.get('city', 'Unknown')}, {location.get('country', 'Unknown')}"
        
        # Determine alert priority
        is_forgery = authenticity in ['FORGERY', 'SUSPICIOUS']
        alert_emoji = "🚨" if is_forgery else "✅"
        
        # Dashboard URL
        dashboard_url = f"https://qr-dynamic-cdp.web.app/qr-history/{qr_id}"
        
        # SMS Message (160 char limit)
        if is_forgery:
            sms_message = (
                f"{alert_emoji} ALERT: Potential FORGERY detected!\n"
                f"QR: {qr_id[:8]}...\n"
                f"Risk: {risk_score:.0f}%\n"
                f"From: {location_str}\n"
                f"Details: {dashboard_url}"
            )
        else:
            sms_message = (
                f"{alert_emoji} QR Scanned\n"
                f"ID: {qr_id[:8]}...\n"
                f"Status: AUTHENTIC\n"
                f"From: {location_str}\n"
                f"View: {dashboard_url}"
            )
        
        # Email Subject
        email_subject = f"{alert_emoji} QR Scan Alert: {authenticity} - {qr_data.get('metadata', {}).get('name', qr_id)}"
        
        # Email Body (Plain Text)
        email_body = f"""
QR Code Scan Alert
==================

Scan Details:
- QR ID: {qr_id}
- Scan ID: {scan_id}
- Timestamp: {timestamp}
- Status: {authenticity}
- Confidence: {confidence:.1f}%
- Risk Score: {risk_score:.1f}%

Location Information:
- Location: {location_str}
- IP Address: {location.get('ip', 'Unknown')}
- ISP: {location.get('isp', 'Unknown')}

Device Information:
- Platform: {device.get('platform', 'Unknown')}
- Browser: {device.get('browser', 'Unknown')}
- User Agent: {device.get('user_agent', 'Unknown')}

Security Analysis:
"""
        
        # Add risk indicators if any
        risk_indicators = security.get('risk_indicators', [])
        if risk_indicators:
            email_body += "- Risk Indicators:\n"
            for indicator in risk_indicators:
                email_body += f"  • {indicator}\n"
        else:
            email_body += "- No risk indicators detected\n"
        
        email_body += f"\nView full scan history: {dashboard_url}\n"
        
        # Email HTML Body
        forgery_style = 'style="color: #e74c3c; font-weight: bold;"' if is_forgery else 'style="color: #27ae60; font-weight: bold;"'
        
        email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .alert-box {{ border: 2px solid {'#e74c3c' if is_forgery else '#27ae60'}; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
        .details {{ background-color: #f1f3f4; padding: 15px; border-radius: 5px; }}
        .button {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>{alert_emoji} QR Code Scan Alert</h2>
            <p>Scan detected at {timestamp}</p>
        </div>
        
        <div class="alert-box">
            <h3 {forgery_style}>Status: {authenticity}</h3>
            <p>Confidence: {confidence:.1f}% | Risk Score: {risk_score:.1f}%</p>
        </div>
        
        <div class="details">
            <h4>Scan Information</h4>
            <p><strong>QR ID:</strong> {qr_id}</p>
            <p><strong>Location:</strong> {location_str}</p>
            <p><strong>Device:</strong> {device.get('platform', 'Unknown')} - {device.get('browser', 'Unknown')}</p>
            
            {'<h4>⚠️ Risk Indicators Detected:</h4><ul>' + ''.join(f'<li>{ind}</li>' for ind in risk_indicators) + '</ul>' if risk_indicators else ''}
        </div>
        
        <a href="{dashboard_url}" class="button">View Full Scan History</a>
    </div>
</body>
</html>
"""
        
        return {
            'sms': sms_message[:160],  # Ensure SMS is within limit
            'email_subject': email_subject,
            'email_body': email_body,
            'email_html': email_html
        }
    
    def _send_sms(self, country_code: str, phone_number: str, message: str):
        """
        Send SMS using Twilio
        """
        if not self.twilio_client:
            raise Exception("Twilio client not initialized")
        
        # Format phone number
        full_number = f"{country_code}{phone_number}"
        if not full_number.startswith('+'):
            full_number = f"+{full_number}"
        
        # Send SMS
        message = self.twilio_client.messages.create(
            body=message,
            from_=self.twilio_from_number,
            to=full_number
        )
        
        logger.info(f"SMS sent successfully: {message.sid}")
        return message.sid
    
    def _send_email(self, to_email: str, subject: str, body: str, html_body: str):
        """
        Send email using SMTP
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.email_from
        msg['To'] = to_email
        
        # Add plain text and HTML parts
        text_part = MIMEText(body, 'plain')
        html_part = MIMEText(html_body, 'html')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")


# Integration with app.py - Add this to handle_qr_scan function after saving logs:

# Initialize alert service
alert_service = AlertNotificationService()

# Send alerts if configured
try:
    if qr_doc.exists:
        qr_data = qr_doc.to_dict()
        alert_results = alert_service.send_scan_alert(comprehensive_scan_log, qr_data)
        logger.info(f"Alert notifications sent: {alert_results}")
except Exception as alert_error:
    logger.error(f"Failed to send alerts: {str(alert_error)}")


# API Endpoint to update alert configuration
@app.route('/api/qr/update-alerts/<qr_id>', methods=['POST'])
def update_qr_alerts(qr_id):
    """
    Update alert configuration for a QR code
    """
    try:
        data = request.json
        
        # Validate phone numbers
        phone_numbers = []
        for phone in data.get('phone_numbers', []):
            if phone.get('country_code') and phone.get('number'):
                phone_numbers.append({
                    'country_code': phone['country_code'].replace('+', ''),
                    'number': phone['number'],
                    'label': phone.get('label', 'Primary')
                })
        
        # Validate email addresses
        email_addresses = []
        for email in data.get('email_addresses', []):
            if '@' in email:
                email_addresses.append(email.lower())
        
        # Update QR document
        alert_config = {
            'phone_numbers': phone_numbers,
            'email_addresses': email_addresses,
            'alert_enabled': data.get('alert_enabled', True),
            'alert_on_authentic': data.get('alert_on_authentic', True),
            'alert_on_suspicious': data.get('alert_on_suspicious', True),
            'alert_on_forgery': data.get('alert_on_forgery', True),
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        db.collection('qr_codes').document(qr_id).update({
            'alert_config': alert_config
        })
        
        return jsonify({
            'success': True,
            'message': 'Alert configuration updated',
            'alert_config': alert_config
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating alerts: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500