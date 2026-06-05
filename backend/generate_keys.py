#!/usr/bin/env python3
"""
Generate secure keys for your QR platform
Run this script to create production-ready encryption keys
"""

from cryptography.fernet import Fernet
import secrets
import base64

print("=" * 60)
print("SECURE KEY GENERATOR FOR QR PLATFORM")
print("=" * 60)

# 1. Generate Fernet Encryption Key for URL encryption
print("\n1. Generating QR_ENCRYPTION_KEY...")
fernet_key = Fernet.generate_key()
print(f"QR_ENCRYPTION_KEY={fernet_key.decode()}")
print("   ↑ This key encrypts destination URLs in your database")

# 2. Generate Scanner Secret for token signing
print("\n2. Generating SCANNER_SECRET...")
# Generate 32 bytes (256 bits) of randomness for HMAC signing
scanner_secret = secrets.token_urlsafe(32)
print(f"SCANNER_SECRET={scanner_secret}")
print("   ↑ This secret signs verification tokens")

# 3. Optional: Generate additional secrets you might need
print("\n3. Additional recommended secrets:")

# JWT secret for future API authentication
jwt_secret = secrets.token_urlsafe(32)
print(f"JWT_SECRET={jwt_secret}")
print("   ↑ For future API authentication")

# Webhook secret for secure webhooks
webhook_secret = secrets.token_hex(32)
print(f"WEBHOOK_SECRET={webhook_secret}")
print("   ↑ For secure webhook verification")

print("\n" + "=" * 60)
print("IMPORTANT SECURITY NOTES:")
print("=" * 60)
print("1. Generate NEW keys for production - don't use these examples!")
print("2. NEVER commit these keys to Git")
print("3. Store them securely in environment variables")
print("4. Rotate keys periodically (every 6-12 months)")
print("5. Keep a secure backup of production keys")
print("\n")

# Save to .env.example (safe template without real keys)
print("Creating .env.example file...")
with open('.env.example', 'w') as f:
    f.write("""# QR Platform Environment Variables
# Copy this to .env and replace with your actual keys

# Encryption key for URL storage (generate with: python3 generate_keys.py)
QR_ENCRYPTION_KEY=your-fernet-key-here

# Secret for signing scanner tokens
SCANNER_SECRET=your-scanner-secret-here

# Optional: JWT secret for API authentication
JWT_SECRET=your-jwt-secret-here

# Optional: Webhook verification secret
WEBHOOK_SECRET=your-webhook-secret-here

# Google Cloud credentials (if not using default)
# GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
""")

print("✅ Created .env.example template")

# Create .env with actual keys (for local development)
create_real_env = input("\nCreate .env with these actual keys? (y/n): ")
if create_real_env.lower() == 'y':
    with open('.env', 'w') as f:
        f.write(f"""# QR Platform Environment Variables - LOCAL DEVELOPMENT
# WARNING: Never commit this file to Git!

QR_ENCRYPTION_KEY={fernet_key.decode()}
SCANNER_SECRET={scanner_secret}
JWT_SECRET={jwt_secret}
WEBHOOK_SECRET={webhook_secret}
""")
    print("✅ Created .env file with real keys")
    print("⚠️  Added .env to .gitignore!")
    
    # Ensure .env is in .gitignore
    with open('.gitignore', 'a+') as f:
        f.seek(0)
        content = f.read()
        if '.env' not in content:
            f.write('\n# Environment variables\n.env\n')

print("\n✅ Key generation complete!")