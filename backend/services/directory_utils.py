import os

def get_safe_directory():
    """
    Get safe temporary directories for App Engine.
    """
    base_dirs = {
        'qr_codes': '/tmp/qr_codes',
        'temp': '/tmp/temp',
        'logs': '/tmp/logs'
    }
    
    # Ensure directories exist
    for path in base_dirs.values():
        os.makedirs(path, exist_ok=True)
    
    return base_dirs

# Get directories
DIRECTORIES = get_safe_directory()

# Expose individual directory paths
OUTPUT_DIR = DIRECTORIES['qr_codes']
TEMP_DIR = DIRECTORIES['temp']
LOG_DIR = DIRECTORIES['logs']
