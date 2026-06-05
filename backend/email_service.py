import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from datetime import datetime

logger = logging.getLogger(__name__)

def get_sendgrid_key():
    """Get SendGrid API key from environment (app.yaml)"""
    api_key = os.environ.get('SENDGRID_API_KEY')
    if api_key:
        logger.info("✅ Retrieved SendGrid key from environment")
        return api_key
    else:
        logger.error("❌ No SendGrid API key found in environment!")
        return None

def send_scan_report(to_email, scan_data):
    """Send scan report email using SendGrid"""
    try:
        # Get API key
        api_key = get_sendgrid_key()
        if not api_key:
            logger.error("No SendGrid API key available")
            return False
            
        sg = SendGridAPIClient(api_key)
        
        # Determine alert level based on authenticity
        if scan_data['authenticity'] == 'AUTHENTIC':
            emoji = "✅"
            color = "#4caf50"
            alert = "Authentic Scan"
        elif scan_data['authenticity'] == 'SUSPICIOUS':
            emoji = "⚠️"
            color = "#ff9800"
            alert = "Suspicious Activity"
        else:
            emoji = "🚨"
            color = "#f44336"
            alert = "FORGERY DETECTED"
        
        # Create email content
        subject = f"{emoji} QR Scan Alert - {scan_data['qr_id'][:8]}..."
        
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: {color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">{emoji} {alert}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">QR Code Scan Notification</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px; background: #fafafa;">
                <!-- Scan Details -->
                <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">📍 Scan Details</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>QR ID:</strong></td>
                            <td style="padding: 8px 0; color: #333; font-family: monospace;">{scan_data['qr_id']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
                            <td style="padding: 8px 0; color: #333;">{scan_data['scan_time']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                            <td style="padding: 8px 0; color: #333;">📍 {scan_data['location']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Device:</strong></td>
                            <td style="padding: 8px 0; color: #333;">📱 {scan_data['device']}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>IP Address:</strong></td>
                            <td style="padding: 8px 0; color: #333; font-family: monospace;">{scan_data['ip_address']}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Security Analysis -->
                <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">🛡️ Security Analysis</h2>
                    
                    <!-- Status Badge -->
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="background: {color}; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; display: inline-block;">
                            {scan_data['authenticity']}
                        </span>
                    </div>
                    
                    <!-- Scores -->
                    <div style="margin: 20px 0;">
                        <div style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #666;">Risk Score</span>
                                <span style="color: #333; font-weight: bold;">{scan_data['risk_score']:.1f}%</span>
                            </div>
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: {'#f44336' if scan_data['risk_score'] > 50 else '#ff9800' if scan_data['risk_score'] > 25 else '#4caf50'}; 
                                           width: {scan_data['risk_score']}%; height: 100%;"></div>
                            </div>
                        </div>
                        
                        <div style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #666;">CDP Verification Score</span>
                                <span style="color: #333; font-weight: bold;">{scan_data['cdp_score']:.3f}</span>
                            </div>
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: {'#4caf50' if scan_data['cdp_score'] > 0.9 else '#ff9800' if scan_data['cdp_score'] > 0.7 else '#f44336'}; 
                                           width: {scan_data['cdp_score'] * 100}%; height: 100%;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Risk Indicators if any -->
                    {f'''
                    <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800;">
                        <strong style="color: #e65100;">⚠️ Risk Indicators:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
                            {''.join(f'<li>{indicator}</li>' for indicator in scan_data.get('risk_indicators', []))}
                        </ul>
                    </div>
                    ''' if scan_data.get('risk_indicators') else ''}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                    This is an automated notification from QR Dynamic CDP Security System<br>
                    Generated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
                </p>
            </div>
        </div>
        """
        
        message = Mail(
            from_email='camilo.ayerbe@wisemedium.com', 
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        response = sg.send(message)
        logger.info(f"📧 Email sent successfully to {to_email}: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Email send error: {e}")
        return False

def send_test_email(to_email):
    """Send a test email to verify configuration"""
    test_data = {
        'qr_id': 'TEST_QR_123456',
        'scan_time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        'location': 'Rome, Italy',
        'device': 'iPhone',
        'risk_score': 15.5,
        'authenticity': 'AUTHENTIC',
        'cdp_score': 0.965,
        'ip_address': '192.168.1.1',
        'risk_indicators': []
    }
    
    return send_scan_report(to_email, test_data)