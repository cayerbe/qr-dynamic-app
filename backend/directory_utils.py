import os
import logging

# Debug print statements
print("Directory utils module loading...")

# Constants for directories - always use /tmp in App Engine
OUTPUT_DIR = '/tmp/qr_codes'
CDP_DIR = '/tmp/cdp_images'
TEMP_DIR = '/tmp/temp'
LOG_DIR = '/tmp/logs'

# Create directories immediately 
try:
    for dir_path in [OUTPUT_DIR, CDP_DIR, TEMP_DIR, LOG_DIR]:
        os.makedirs(dir_path, exist_ok=True)
    print(f"Created directories: {OUTPUT_DIR}, {CDP_DIR}, {TEMP_DIR}, {LOG_DIR}")
except Exception as e:
    print(f"Error creating directories: {e}")
    logging.error(f"Directory creation error: {e}")