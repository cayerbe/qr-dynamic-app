import numpy as np
import cv2
import hashlib
import hmac
import os
import logging
from dataclasses import dataclass
from typing import Tuple, Dict

logger = logging.getLogger(__name__)

CDP_VERSION = "2.0"
KEY_VERSION = os.environ.get("CDP_KEY_VERSION", "v1")

@dataclass
class SOTACDPConfig:
    size_mm: float
    dpi: int
    pixel_size: int
    intensity: float
    security_level: str = "SOTA_MAX"

class SOTACDPGenerator:
    """
    SOTA Information Theoretic CDP Generator (2025/2026 standards)
    Uses cryptographically seeded maximum entropy stochastic matrices.
    """
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Secret Seeding configuration
        self.server_secret = os.environ.get("CDP_SECRET_KEY")
        if not self.server_secret:
            if os.environ.get("ENV") == "development" or os.environ.get("FLASK_ENV") == "development" or os.environ.get("FLASK_DEBUG") == "1":
                self.logger.warning("CDP_SECRET_KEY not set. Using dev fallback (NOT SECURE FOR PROD)")
                self.server_secret = "dev_fallback_secret_key_123"
            else:
                raise RuntimeError("CDP_SECRET_KEY is required in production. Cannot generate secure CDP without it.")

    def generate_config(self, size_mm: float, intensity: float = 0.5) -> SOTACDPConfig:
        dpi = 600  # Enforce 600 DPI for high-quality standard
        pixel_size = int((size_mm / 25.4) * dpi)
        pixel_size = max(pixel_size, 76)  # Minimum grid size
        return SOTACDPConfig(
            size_mm=size_mm,
            dpi=dpi,
            pixel_size=pixel_size,
            intensity=intensity
        )

    def generate_stochastic_pattern(self, config: SOTACDPConfig, qr_id: str) -> Tuple[np.ndarray, Dict[str, str]]:
        """
        Generates a purely mathematically robust stochastic matrix.
        Returns the (pattern_array, metadata_dict)
        """
        # Cryptographic derivation of seed (HMAC-SHA256)
        mac = hmac.new(self.server_secret.encode(), qr_id.encode(), hashlib.sha256).digest()
        
        # We need a stable, full-entropy random generator sequence for reproducibility
        sq = np.random.SeedSequence(int.from_bytes(mac, 'big'))
        rng = np.random.default_rng(sq)
        
        # 1. Maximum Entropy Base Noise (Uniform Distribution)
        base_noise = rng.integers(0, 2, size=(config.pixel_size, config.pixel_size)).astype(np.float32)
        
        # 2. Spectral Filtering (Dot Gain Control)
        kernel_size = 3
        sigma = 0.8
        filtered_noise = cv2.GaussianBlur(base_noise, (kernel_size, kernel_size), sigma)
        
        # 3. Binarization / Contrast Stretching
        median_val = np.median(filtered_noise)
        binary_pattern = np.where(filtered_noise > median_val, 1.0, 0.0).astype(np.float32)
        
        # 4. Intensity Scaling
        final_pattern = binary_pattern * config.intensity
        
        # Signature is the first 16 chars of the hex digest of the MAC
        signature = mac.hex()[:16]
        
        metadata = {
            "signature": signature,
            "cdp_version": CDP_VERSION,
            "key_version": KEY_VERSION
        }
        
        self.logger.info(f"🔐 SOTA Stochastic CDP generated: {config.pixel_size}x{config.pixel_size}px, sig={signature}")
        
        return final_pattern, metadata

    def get_scanning_recommendations(self, config: SOTACDPConfig) -> dict:
        return {
            "min_camera_resolution_mp": 12,
            "required_lighting": "high",
            "macro_mode_recommended": True,
            "focus_distance_cm": 5
        }
