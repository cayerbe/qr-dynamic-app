import os
import cv2
import numpy as np
from PIL import Image, ImageDraw
import hashlib
import logging
import math
from typing import Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class SecurityLevel(Enum):
    """Security levels based on QR code size"""
    MICRO = "micro"          # 5-10mm - Basic CDP
    STANDARD = "standard"    # 10-30mm - Enhanced CDP (IPZS focus)
    LARGE = "large"         # 30-50mm - Advanced CDP
    INDUSTRIAL = "industrial" # 50-100mm - Maximum security

@dataclass
class CDPConfig:
    """Configuration for size-adaptive CDP generation"""
    size_mm: float
    security_level: SecurityLevel
    dpi: int
    pixel_size: int
    pattern_density: float
    noise_layers: int
    frequency_bands: int
    correlation_threshold: float
    anti_ml_features: bool
    intensity: float 

class SizeAdaptiveCDPGenerator:
    """
    Advanced CDP generator with size-adaptive algorithms
    Optimized for IPZS "Made in Italy" authentication (10-30mm focus)
    """
    
    # Standard DPI values for different applications
    DPI_CONFIGS = {
        SecurityLevel.MICRO: 300,      # Basic printing
        SecurityLevel.STANDARD: 600,   # High-quality printing (IPZS standard)
        SecurityLevel.LARGE: 1200,     # Premium printing
        SecurityLevel.INDUSTRIAL: 2400 # Industrial grade
    }
    
    # Pattern density optimization for each security level
    DENSITY_CONFIGS = {
        SecurityLevel.MICRO: 0.3,      # Lower density for small sizes
        SecurityLevel.STANDARD: 0.5,   # Optimal for IPZS applications
        SecurityLevel.LARGE: 0.7,      # Higher complexity
        SecurityLevel.INDUSTRIAL: 0.9  # Maximum complexity
    }
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        
    def calculate_security_level(self, size_mm: float) -> SecurityLevel:
        """Determine security level based on QR code size"""
        if size_mm < 10:
            return SecurityLevel.MICRO
        elif size_mm <= 30:  # IPZS focus range
            return SecurityLevel.STANDARD
        elif size_mm <= 50:
            return SecurityLevel.LARGE
        else:
            return SecurityLevel.INDUSTRIAL
    
    def generate_cdp_config(self, size_mm: float, intensity: float = 0.5) -> CDPConfig:
        """Generate optimized CDP configuration based on size"""
        security_level = self.calculate_security_level(size_mm)
        dpi = self.DPI_CONFIGS[security_level]
        
        # Calculate pixel dimensions
        pixel_size = int((size_mm / 25.4) * dpi)  # Convert mm to inches, then to pixels
        pixel_size = max(pixel_size, 76)  # Ensure minimum pixel size for scannability
        
        # Adaptive pattern density
        base_density = self.DENSITY_CONFIGS[security_level]
        pattern_density = base_density * intensity
        
        # Security level specific configurations
        config_map = {
            SecurityLevel.MICRO: {
                'noise_layers': 2,
                'frequency_bands': 3,
                'correlation_threshold': 0.85,
                'anti_ml_features': False
            },
            SecurityLevel.STANDARD: {
                'noise_layers': 4,
                'frequency_bands': 5,
                'correlation_threshold': 0.90,
                'anti_ml_features': True
            },
            SecurityLevel.LARGE: {
                'noise_layers': 6,
                'frequency_bands': 7,
                'correlation_threshold': 0.92,
                'anti_ml_features': True
            },
            SecurityLevel.INDUSTRIAL: {
                'noise_layers': 8,
                'frequency_bands': 10,
                'correlation_threshold': 0.95,
                'anti_ml_features': True
            }
        }
        
        level_config = config_map[security_level]
        
        return CDPConfig(
            size_mm=size_mm,
            security_level=security_level,
            dpi=dpi,
            pixel_size=pixel_size,
            pattern_density=pattern_density,
            intensity=intensity,  # ADD THIS LINE to store the original intensity
            **level_config
        )
    
    def generate_multi_frequency_cdp(self, config: CDPConfig, qr_id: str) -> Tuple[np.ndarray, str]:
        """
        Generate multi-frequency CDP pattern optimized for IPZS applications
        """
        # Create deterministic seed from QR ID
        seed = int(hashlib.sha256(qr_id.encode()).hexdigest(), 16) % (2**32)
        np.random.seed(seed)
        
        # Initialize base pattern
        cdp_pattern = np.zeros((config.pixel_size, config.pixel_size), dtype=np.float32)
        
        # Generate multi-layer noise patterns
        for layer in range(config.noise_layers):
            layer_pattern = self._generate_layer_pattern(config, layer)
            cdp_pattern += layer_pattern
        
        # Add frequency-specific patterns for STANDARD/INDUSTRIAL levels
        if config.security_level in [SecurityLevel.STANDARD, SecurityLevel.INDUSTRIAL]:
            frequency_pattern = self._generate_frequency_bands(config)
            cdp_pattern += frequency_pattern
        
        # Add anti-ML features for enhanced security
        if config.anti_ml_features:
            ml_resistant_pattern = self._generate_ml_resistant_features(config, qr_id)
            cdp_pattern += ml_resistant_pattern
        
        # Normalize and apply intensity
        cdp_pattern = self._normalize_pattern(cdp_pattern, config.pattern_density)
        
        # Generate unique signature
        cdp_signature = self._generate_cdp_signature(cdp_pattern, qr_id, config)
        
        self.logger.info(f"Generated {config.security_level.value} CDP: {config.size_mm}mm, "
                        f"{config.pixel_size}x{config.pixel_size}px, DPI:{config.dpi}")
        
        return cdp_pattern, cdp_signature
    
    def _generate_layer_pattern(self, config: CDPConfig, layer_index: int) -> np.ndarray:
        """Generate individual noise layer with size-adaptive characteristics"""
        # Scale-dependent noise generation
        if config.security_level == SecurityLevel.STANDARD:
            # IPZS optimized: High-frequency patterns for 10-30mm range
            kernel_size = 3 + (layer_index * 2)
            noise_scale = 0.1 + (layer_index * 0.05)
        elif config.security_level == SecurityLevel.INDUSTRIAL:
            # Industrial grade: Complex multi-scale patterns
            kernel_size = 5 + (layer_index * 3)
            noise_scale = 0.15 + (layer_index * 0.08)
        else:
            # Standard patterns for other levels
            kernel_size = 3 + layer_index
            noise_scale = 0.08 + (layer_index * 0.03)
        
        # Generate base noise
        noise = np.random.randn(config.pixel_size, config.pixel_size) * noise_scale
        
        # Apply Gaussian blur with adaptive kernel
        if kernel_size > 1:
            kernel_size = int(kernel_size) if kernel_size % 2 == 1 else int(kernel_size) + 1
            noise = cv2.GaussianBlur(noise, (kernel_size, kernel_size), 0)
        
        return noise
    
    def _generate_frequency_bands(self, config: CDPConfig) -> np.ndarray:
        """Generate frequency-specific patterns for enhanced security"""
        pattern = np.zeros((config.pixel_size, config.pixel_size), dtype=np.float32)
        
        for band in range(config.frequency_bands):
            # Create frequency-specific patterns
            freq = (band + 1) * 0.1
            x = np.linspace(0, 2 * np.pi * freq, config.pixel_size)
            y = np.linspace(0, 2 * np.pi * freq, config.pixel_size)
            X, Y = np.meshgrid(x, y)
            
            # Combine sine waves at different frequencies
            wave_pattern = np.sin(X) * np.cos(Y) * (0.1 / (band + 1))
            pattern += wave_pattern
        
        return pattern
    
    def _generate_ml_resistant_features(self, config: CDPConfig, qr_id: str) -> np.ndarray:
        """
        Generate machine learning resistant features
        Based on pattern reliability and print-scan channel modeling
        """
        # Create seed-based deterministic patterns that are hard to replicate
        feature_seed = int(hashlib.md5(f"{qr_id}_ml_resist".encode()).hexdigest(), 16) % (2**32)
        np.random.seed(feature_seed)
        
        # Generate micro-structure patterns
        micro_pattern = np.random.choice([-1, 1], size=(config.pixel_size, config.pixel_size))
        micro_pattern = micro_pattern.astype(np.float32) * 0.05
        
        # Add print-scan artifacts simulation
        artifacts = self._simulate_print_scan_artifacts(config)
        
        return micro_pattern + artifacts
    
    def _simulate_print_scan_artifacts(self, config: CDPConfig) -> np.ndarray:
        """Simulate print-scan channel artifacts for enhanced security"""
        artifacts = np.zeros((config.pixel_size, config.pixel_size), dtype=np.float32)
        
        # Simulate printer dot patterns (especially important for IPZS applications)
        if config.security_level in [SecurityLevel.STANDARD, SecurityLevel.INDUSTRIAL]:
            dot_pattern = self._generate_printer_dot_pattern(config)
            artifacts += dot_pattern
        
        # Add scanning artifacts
        scan_artifacts = np.random.normal(0, 0.02, (config.pixel_size, config.pixel_size))
        artifacts += scan_artifacts
        
        return artifacts
    
    def _generate_printer_dot_pattern(self, config: CDPConfig) -> np.ndarray:
        """Generate printer-specific dot patterns for IPZS authentication"""
        pattern = np.zeros((config.pixel_size, config.pixel_size), dtype=np.float32)
        
        # Simulate halftone dot patterns
        dot_spacing = max(2, config.pixel_size // 50)  # Adaptive dot spacing
        
        for x in range(0, config.pixel_size, dot_spacing):
            for y in range(0, config.pixel_size, dot_spacing):
                if x < config.pixel_size and y < config.pixel_size:
                    # Add small dot variation
                    dot_intensity = np.random.uniform(0.01, 0.03)
                    pattern[x:min(x+2, config.pixel_size), 
                           y:min(y+2, config.pixel_size)] += dot_intensity
        
        return pattern
    
    def _normalize_pattern(self, pattern: np.ndarray, density: float) -> np.ndarray:
        """Normalize CDP pattern to optimal range"""
        # Normalize to [-1, 1] range
        pattern_norm = (pattern - pattern.min()) / (pattern.max() - pattern.min())
        pattern_norm = pattern_norm * 2 - 1
        
        # Apply density scaling
        pattern_norm *= density
        
        # Convert to uint8 for image processing
        pattern_uint8 = ((pattern_norm + 1) * 127.5).astype(np.uint8)
        
        return pattern_uint8
    
    def _generate_cdp_signature(self, pattern: np.ndarray, qr_id: str, config: CDPConfig) -> str:
        """Generate unique CDP signature for verification"""
        # Combine pattern characteristics with QR ID
        pattern_hash = hashlib.sha256(pattern.tobytes()).hexdigest()
        config_hash = hashlib.md5(f"{config.size_mm}_{config.security_level.value}_{config.dpi}".encode()).hexdigest()
        
        # Create composite signature
        signature_data = f"{qr_id}_{pattern_hash[:16]}_{config_hash[:8]}_{config.correlation_threshold}"
        signature = hashlib.sha256(signature_data.encode()).hexdigest()
        
        return signature
    
    def apply_cdp_to_qr(self, qr_image: np.ndarray, cdp_pattern: np.ndarray, 
                       config: CDPConfig) -> np.ndarray:
        """Apply size-adaptive CDP to QR code with optimized blending"""
        # Ensure CDP pattern matches QR code dimensions
        if cdp_pattern.shape != qr_image.shape:
            cdp_pattern = cv2.resize(cdp_pattern, (qr_image.shape[1], qr_image.shape[0]))
        
        # Adaptive blending based on security level
        blend_factors = {
            SecurityLevel.MICRO: 0.15,
            SecurityLevel.STANDARD: 0.25,      # IPZS optimized
            SecurityLevel.LARGE: 0.35,
            SecurityLevel.INDUSTRIAL: 0.45
        }
        
        blend_factor = blend_factors[config.security_level]
        
        # Apply CDP with preservation of QR code readability
        qr_with_cdp = qr_image.copy().astype(np.float32)
        cdp_normalized = cdp_pattern.astype(np.float32) / 255.0
        
        # Apply CDP primarily to white areas (background)
        white_mask = qr_image > 127
        qr_with_cdp[white_mask] = np.clip(
            qr_with_cdp[white_mask] * (1 - blend_factor * cdp_normalized[white_mask]),
            180, 255  # Maintain readability
        )
        
        return qr_with_cdp.astype(np.uint8)
    
    def get_scanning_recommendations(self, config: CDPConfig) -> Dict[str, Any]:
        """Generate scanning recommendations based on size and security level"""
        # Calculate optimal scanning distance (10:1 ratio)
        optimal_distance_cm = config.size_mm * 10 / 10  # Convert to cm
        
        recommendations = {
            'optimal_scanning_distance_cm': optimal_distance_cm,
            'min_scanning_distance_cm': optimal_distance_cm * 0.5,
            'max_scanning_distance_cm': optimal_distance_cm * 2,
            'recommended_dpi': config.dpi,
            'security_level': config.security_level.value,
            'print_quality_requirements': self._get_print_quality_requirements(config),
            'mobile_compatibility': config.security_level in [SecurityLevel.STANDARD, SecurityLevel.LARGE]
        }
        
        return recommendations
    
    def _get_print_quality_requirements(self, config: CDPConfig) -> Dict[str, str]:
        """Get print quality requirements for each security level"""
        requirements = {
            SecurityLevel.MICRO: {
                'printer_type': 'Standard inkjet/laser',
                'paper_quality': 'Standard',
                'color_accuracy': 'Basic'
            },
            SecurityLevel.STANDARD: {  # IPZS requirements
                'printer_type': 'High-quality offset/digital',
                'paper_quality': 'Premium security paper',
                'color_accuracy': 'High precision'
            },
            SecurityLevel.LARGE: {
                'printer_type': 'Professional grade',
                'paper_quality': 'Security substrate',
                'color_accuracy': 'Color-managed workflow'
            },
            SecurityLevel.INDUSTRIAL: {
                'printer_type': 'Industrial security printing',
                'paper_quality': 'Specialized security substrates',
                'color_accuracy': 'Calibrated color management'
            }
        }
        
        return requirements[config.security_level]

# Utility functions for integration with existing system
def calculate_size_from_mm(size_mm: float, target_dpi: int = 600) -> int:
    """Calculate pixel size from millimeters"""
    inches = size_mm / 25.4
    pixels = int(inches * target_dpi)
    return max(pixels, 76)  # Ensure minimum scannable size

def get_ipzs_recommended_config(size_mm: float) -> CDPConfig:
    """Get IPZS-optimized configuration for Made in Italy applications"""
    generator = SizeAdaptiveCDPGenerator()
    
    # Ensure size is in IPZS preferred range
    if size_mm < 10:
        size_mm = 10
        logger.warning("Size adjusted to minimum IPZS standard: 10mm")
    elif size_mm > 30:
        logger.info(f"Size {size_mm}mm exceeds standard IPZS range (10-30mm)")
    
    return generator.generate_cdp_config(size_mm, intensity=0.6)  # Higher intensity for IPZS

def verify_cdp_match(qr_id: str, scanned_path: str) -> dict:
    """
    Dummy placeholder for CDP pattern verification.
    Replace with your real image comparison logic.
    """
    return {
        'cdp_verified': True,
        'cdp_score': 0.97,
        'cdp_reason': 'Pattern matched with high confidence'
    }