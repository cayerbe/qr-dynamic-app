import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import hashlib
import logging
from typing import Tuple, Dict, Any
from dataclasses import dataclass
import math

logger = logging.getLogger(__name__)

@dataclass
class AntiPhotocopyConfig:
    """Configuration for anti-photocopy features"""
    microprint_enabled: bool = True
    halftone_traps: bool = True
    frequency_watermark: bool = True
    guilloche_patterns: bool = True
    void_pantograph: bool = True
    metameric_features: bool = False  # Requires color printing
    
class AntiPhotocopyGenerator:
    """
    Advanced CDP generator with anti-photocopy features
    Based on security printing industry standards
    """
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        
    def generate_anti_photocopy_pattern(self, size: int, qr_id: str, 
                                       intensity: float, config: AntiPhotocopyConfig) -> np.ndarray:
        """Generate comprehensive anti-photocopy pattern"""
        
        # Initialize base pattern
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Layer 1: Microprint patterns (degrade heavily in photocopies)
        if config.microprint_enabled:
            microprint = self._generate_microprint_pattern(size, qr_id)
            pattern += microprint * 0.2
            
        # Layer 2: Halftone traps (exploit photocopier limitations)
        if config.halftone_traps:
            halftone = self._generate_halftone_trap(size)
            pattern += halftone * 0.15
            
        # Layer 3: High-frequency watermark (lost in photocopying)
        if config.frequency_watermark:
            freq_watermark = self._generate_frequency_watermark(size, qr_id)
            pattern += freq_watermark * 0.25
            
        # Layer 4: Guilloche patterns (complex geometric patterns)
        if config.guilloche_patterns:
            guilloche = self._generate_guilloche_pattern(size)
            pattern += guilloche * 0.2
            
        # Layer 5: Void pantograph (reveals "COPY" when photocopied)
        if config.void_pantograph:
            void_pattern = self._generate_void_pantograph(size)
            pattern += void_pattern * 0.2
            
        # Normalize and apply intensity
        pattern = self._normalize_pattern(pattern) * intensity
        
        return pattern
    
    def _generate_microprint_pattern(self, size: int, qr_id: str) -> np.ndarray:
        """
        Generate microprint pattern that degrades in photocopies
        Uses text at the limit of photocopier resolution
        """
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Create microtext grid
        microtext = qr_id[:8]  # Use first 8 chars of QR ID
        grid_size = 20  # Number of microtext repetitions
        cell_size = size // grid_size
        
        # Generate microprint using very small dots
        for i in range(grid_size):
            for j in range(grid_size):
                x = i * cell_size
                y = j * cell_size
                
                # Create dot pattern spelling out microtext
                for k, char in enumerate(microtext):
                    if x + k * 2 < size and y < size:
                        # ASCII art representation using dots
                        seed = ord(char) + i + j
                        np.random.seed(seed)
                        if np.random.random() > 0.5:
                            pattern[y:y+2, x+k*2:x+k*2+1] = 1.0
        
        # Apply Gaussian blur to make it subtle
        pattern = cv2.GaussianBlur(pattern, (3, 3), 0.5)
        
        return pattern
    
    def _generate_halftone_trap(self, size: int) -> np.ndarray:
        """
        Generate halftone trap patterns that photocopiers struggle with
        Uses specific dot frequencies that cause moiré patterns when copied
        """
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Critical frequencies that cause moiré with common photocopier screens
        # Most photocopiers use 150-200 lpi screens
        trap_frequencies = [133, 150, 175]  # Lines per inch
        
        for freq in trap_frequencies:
            # Convert lpi to pixel frequency
            dot_spacing = size // (freq // 10)  # Approximate conversion
            
            # Create dot grid at trap frequency
            for x in range(0, size, dot_spacing):
                for y in range(0, size, dot_spacing):
                    if x < size and y < size:
                        # Variable dot size creates additional complexity
                        dot_size = 1 + (x + y) % 2
                        cv2.circle(pattern, (x, y), dot_size, 0.3, -1)
        
        return pattern
    
    def _generate_frequency_watermark(self, size: int, qr_id: str) -> np.ndarray:
        """
        Generate high-frequency watermark invisible to photocopiers
        Uses frequencies above typical photocopier reproduction capability
        """
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Generate frequency domain representation
        freq_pattern = np.zeros((size, size), dtype=np.complex128)
        
        # Embed high-frequency components (>300 lpi equivalent)
        center = size // 2
        high_freq_radius = size // 3
        
        # Create unique pattern based on QR ID
        np.random.seed(int(hashlib.md5(qr_id.encode()).hexdigest()[:8], 16))
        
        for i in range(100):  # Add 100 high-frequency components
            # Random angle and radius in high-frequency region
            angle = np.random.random() * 2 * np.pi
            radius = high_freq_radius + np.random.random() * (size//2 - high_freq_radius)
            
            x = int(center + radius * np.cos(angle))
            y = int(center + radius * np.sin(angle))
            
            if 0 <= x < size and 0 <= y < size:
                freq_pattern[y, x] = np.random.random() + 1j * np.random.random()
                # Add conjugate for real output
                freq_pattern[size-y, size-x] = np.conj(freq_pattern[y, x])
        
        # Convert back to spatial domain
        pattern = np.real(np.fft.ifft2(np.fft.ifftshift(freq_pattern)))
        
        return pattern
    
    def _generate_guilloche_pattern(self, size: int) -> np.ndarray:
        """
        Generate guilloche patterns (complex geometric patterns used in banknotes)
        These are mathematically precise and difficult to reproduce
        """
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Parameters for guilloche generation
        num_curves = 8
        amplitude = size // 20
        
        for curve_idx in range(num_curves):
            # Generate parametric curve
            t = np.linspace(0, 4 * np.pi, 1000)
            
            # Complex mathematical formula for guilloche
            freq1 = 3 + curve_idx * 0.5
            freq2 = 5 + curve_idx * 0.3
            phase = curve_idx * np.pi / num_curves
            
            x = amplitude * (np.sin(freq1 * t + phase) + 0.5 * np.sin(freq2 * t))
            y = amplitude * (np.cos(freq1 * t) + 0.5 * np.cos(freq2 * t + phase))
            
            # Center the pattern
            x = (x + size // 2).astype(int)
            y = (y + size // 2).astype(int)
            
            # Draw the curve
            for i in range(len(x) - 1):
                if 0 <= x[i] < size and 0 <= y[i] < size and 0 <= x[i+1] < size and 0 <= y[i+1] < size:
                    cv2.line(pattern, (x[i], y[i]), (x[i+1], y[i+1]), 0.5, 1)
        
        # Apply slight blur to anti-alias
        pattern = cv2.GaussianBlur(pattern, (3, 3), 0.5)
        
        return pattern
    
    def _generate_void_pantograph(self, size: int) -> np.ndarray:
        """
        Generate void pantograph that reveals "COPY" or "VOID" when photocopied
        Uses differential dot density that photocopiers interpret differently
        """
        pattern = np.zeros((size, size), dtype=np.float32)
        
        # Create base camouflage pattern
        base_density = 0.15
        copy_density = 0.25  # Slightly higher density for hidden message
        
        # Fill with base pattern
        np.random.seed(42)  # Fixed seed for consistency
        base_dots = np.random.random((size, size)) < base_density
        pattern[base_dots] = 0.3
        
        # Embed "COPY" text that appears when photocopied
        text_size = size // 4
        text_start_x = (size - text_size * 4) // 2  # "COPY" has 4 letters
        text_start_y = (size - text_size) // 2
        
        # Simple letter patterns for "COPY"
        letters = {
            'C': [(0,1), (0,2), (0,3), (1,0), (1,4), (2,0), (2,4), (3,1), (3,2), (3,3)],
            'O': [(0,1), (0,2), (0,3), (1,0), (1,4), (2,0), (2,4), (3,0), (3,4), (4,1), (4,2), (4,3)],
            'P': [(0,0), (0,1), (0,2), (0,3), (0,4), (1,0), (1,2), (2,0), (2,2), (3,1)],
            'Y': [(0,0), (1,1), (2,2), (2,3), (2,4), (3,1), (4,0)]
        }
        
        # Embed each letter
        for i, letter in enumerate('COPY'):
            letter_x = text_start_x + i * text_size
            
            for dot in letters.get(letter, []):
                x = letter_x + dot[0] * (text_size // 5)
                y = text_start_y + dot[1] * (text_size // 5)
                
                # Create denser dot pattern in letter areas
                for dx in range(text_size // 5):
                    for dy in range(text_size // 5):
                        if x + dx < size and y + dy < size:
                            if np.random.random() < copy_density:
                                pattern[y + dy, x + dx] = 0.4
        
        return pattern
    
    def _normalize_pattern(self, pattern: np.ndarray) -> np.ndarray:
        """Normalize pattern to [0, 1] range"""
        if pattern.max() > pattern.min():
            pattern = (pattern - pattern.min()) / (pattern.max() - pattern.min())
        return pattern
    
    def verify_photocopy(self, original_path: str, scanned_path: str) -> Dict[str, Any]:
        """
        Advanced photocopy detection for PWA scanner captures
        Optimized for device camera inputs (all captures are digital)
        """
        try:
            # Load images
            original = cv2.imread(original_path, cv2.IMREAD_GRAYSCALE)
            scanned = cv2.imread(scanned_path, cv2.IMREAD_GRAYSCALE)
            
            original_scanned_shape = scanned.shape
            size_ratio = (scanned.shape[0] * scanned.shape[1]) / (original.shape[0] * original.shape[1])
            
            logger.info(f"Original size: {original.shape}, Scanned size: {original_scanned_shape}")
            logger.info(f"Size ratio: {size_ratio:.2f}")
            
            # PWA Scanner assumption: ALL captures are digital camera inputs
            is_pwa_capture = True
            logger.info("PWA scanner capture - using digital-optimized detection")
            
            # Smart resize decision - ONLY for extreme differences
            resize_performed = False
            resize_confidence_penalty = 0.0
            
            if size_ratio > 4.0 or size_ratio < 0.25:
                logger.warning(f"Extreme size difference ({size_ratio:.2f}x), resizing for comparison")
                scanned = cv2.resize(scanned, (original.shape[1], original.shape[0]))
                resize_performed = True
                resize_confidence_penalty = 0.3
            elif scanned.shape != original.shape:
                logger.info(f"Moderate size difference, analyzing without resize")
            
            # Run all detection methods
            freq_score = self._analyze_frequency_loss(original, scanned)
            microprint_score = self._detect_microprint_degradation(original, scanned)
            moire_score = self._detect_moire_patterns(scanned)
            void_score = self._detect_void_pantograph(original, scanned)
            edge_score = self._analyze_edge_degradation(original, scanned)
            noise_score = self._analyze_noise_patterns(original, scanned)
            
            # Adjust for digital camera artifacts (JPEG compression, etc.)
            if freq_score > 0.7 and moire_score > 0.7:
                # High frequency loss + moire likely from digital compression, not photocopy
                freq_score *= 0.4  # Aggressive reduction
                moire_score *= 0.3  # Aggressive reduction
                logger.info("Adjusted scores for digital camera artifacts")
            
            # PWA-optimized scoring weights
            # Focus on security features that photocopies can't fake
            total_score = (
                freq_score * 0.10 +      # Minimal weight - cameras cause this
                microprint_score * 0.35 + # High weight - real security feature
                moire_score * 0.05 +      # Minimal weight - digital artifacts
                void_score * 0.30 +       # High weight - key security feature
                edge_score * 0.15 +       # Moderate weight - some degradation expected
                noise_score * 0.05        # Minimal weight - cameras change noise
            )
            
            # Apply resize penalty if extreme resize was performed
            if resize_performed:
                total_score = max(0, total_score - resize_confidence_penalty)
            
            # Higher threshold for PWA captures (more tolerant of digital artifacts)
            threshold = 0.65  # Need strong evidence of photocopying
            is_photocopy = total_score > threshold
            
            # Additional check: If microprint + void scores are both high, it's likely a real photocopy
            security_features_compromised = (microprint_score > 0.6 and void_score > 0.5)
            if security_features_compromised:
                logger.info("Security features compromised - likely photocopy regardless of digital artifacts")
                is_photocopy = True
            
            confidence = min(total_score * 100, 100)
            
            # Log detailed analysis for debugging
            logger.info(f"PWA Analysis - Microprint: {microprint_score:.3f}, Void: {void_score:.3f}, "
                       f"Freq: {freq_score:.3f}, Total: {total_score:.3f}, Threshold: {threshold}")
            
            return {
                'is_photocopy': is_photocopy,
                'confidence': confidence,
                'degradation_scores': {
                    'frequency_loss': round(freq_score, 3),
                    'microprint_degradation': round(microprint_score, 3),
                    'moire_patterns': round(moire_score, 3),
                    'void_pantograph': round(void_score, 3),
                    'edge_degradation': round(edge_score, 3),
                    'noise_pattern': round(noise_score, 3)
                },
                'analysis_metadata': {
                    'original_size': original.shape,
                    'scanned_size': original_scanned_shape,
                    'resize_performed': resize_performed,
                    'is_pwa_capture': is_pwa_capture,
                    'size_ratio': round(size_ratio, 2),
                    'security_features_compromised': security_features_compromised
                },
                'recommendation': 'REJECT - Photocopy detected' if is_photocopy else 'ACCEPT - Original document'
            }
            
        except Exception as e:
            logger.error(f"Photocopy verification error: {e}")
            return {
                'is_photocopy': True,
                'confidence': 0,
                'error': str(e),
                'recommendation': 'REJECT - Verification error'
            }
    
    def _analyze_frequency_loss(self, original: np.ndarray, scanned: np.ndarray) -> float:
        """Analyze high-frequency component loss"""
        # If sizes don't match, work with the overlapping region
        if original.shape != scanned.shape:
            # Find minimum dimensions
            min_h = min(original.shape[0], scanned.shape[0])
            min_w = min(original.shape[1], scanned.shape[1])
            
            # Center crop both images
            orig_h, orig_w = original.shape
            scan_h, scan_w = scanned.shape
            
            orig_crop = original[
                (orig_h - min_h)//2:(orig_h + min_h)//2,
                (orig_w - min_w)//2:(orig_w + min_w)//2
            ]
            scan_crop = scanned[
                (scan_h - min_h)//2:(scan_h + min_h)//2,
                (scan_w - min_w)//2:(scan_w + min_w)//2
            ]
            
            original = orig_crop
            scanned = scan_crop
        
        # Continue with existing FFT analysis...
        fft_orig = np.fft.fft2(original)
        fft_scan = np.fft.fft2(scanned)
        
        # Get magnitude spectrums
        mag_orig = np.abs(np.fft.fftshift(fft_orig))
        mag_scan = np.abs(np.fft.fftshift(fft_scan))
        
        # Define high-frequency region (outer 30% of spectrum)
        center = np.array(mag_orig.shape) // 2
        radius = min(center) * 0.7
        
        y, x = np.ogrid[:mag_orig.shape[0], :mag_orig.shape[1]]
        high_freq_mask = (x - center[1])**2 + (y - center[0])**2 > radius**2
        
        # Calculate high-frequency energy ratio
        hf_energy_orig = np.sum(mag_orig[high_freq_mask])
        hf_energy_scan = np.sum(mag_scan[high_freq_mask])
        
        # Avoid division by zero
        if hf_energy_orig == 0:
            return 1.0
            
        loss_ratio = 1.0 - (hf_energy_scan / hf_energy_orig)
        return np.clip(loss_ratio, 0, 1)
    
    def _detect_microprint_degradation(self, original: np.ndarray, scanned: np.ndarray) -> float:
        """Detect loss of fine detail in microprint areas"""
        # Ensure same size for comparison
        if original.shape != scanned.shape:
            # Find minimum dimensions and center crop both
            min_h = min(original.shape[0], scanned.shape[0])
            min_w = min(original.shape[1], scanned.shape[1])
            
            orig_h, orig_w = original.shape
            scan_h, scan_w = scanned.shape
            
            original = original[
                (orig_h - min_h)//2:(orig_h + min_h)//2,
                (orig_w - min_w)//2:(orig_w + min_w)//2
            ]
            scanned = scanned[
                (scan_h - min_h)//2:(scan_h + min_h)//2,
                (scan_w - min_w)//2:(scan_w + min_w)//2
            ]
    
        # Use Laplacian to detect fine details
        laplacian_orig = cv2.Laplacian(original, cv2.CV_64F)
        laplacian_scan = cv2.Laplacian(scanned, cv2.CV_64F)
        
        # Focus on high-detail areas
        detail_threshold = np.percentile(np.abs(laplacian_orig), 90)
        detail_mask = np.abs(laplacian_orig) > detail_threshold
        
        if np.sum(detail_mask) == 0:
            return 0.0
        
        # Compare detail preservation
        detail_orig = np.abs(laplacian_orig[detail_mask])
        detail_scan = np.abs(laplacian_scan[detail_mask])
        
        if len(detail_orig) == 0 or len(detail_scan) == 0:
            return 0.0
        
        detail_loss = 1.0 - (np.mean(detail_scan) / np.mean(detail_orig))
        return np.clip(detail_loss, 0, 1)
    
    def _detect_moire_patterns(self, scanned: np.ndarray) -> float:
        """Detect moiré patterns characteristic of photocopying"""
        # Apply FFT to detect periodic patterns
        fft = np.fft.fft2(scanned)
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.abs(fft_shift)
        
        # Look for peaks in specific frequency ranges (typical moiré frequencies)
        h, w = magnitude.shape
        center = (h // 2, w // 2)
        
        # Define annular regions where moiré typically appears
        moire_score = 0.0
        for radius in [30, 45, 60, 75]:  # Typical moiré distances
            if radius < min(center):
                # Create annular mask
                y, x = np.ogrid[:h, :w]
                inner_mask = (x - center[1])**2 + (y - center[0])**2 < (radius - 5)**2
                outer_mask = (x - center[1])**2 + (y - center[0])**2 < (radius + 5)**2
                annular_mask = outer_mask & ~inner_mask
                
                # Check for peaks in annular region
                annular_mean = np.mean(magnitude[annular_mask])
                annular_max = np.max(magnitude[annular_mask])
                
                if annular_mean > 0:
                    peak_ratio = annular_max / annular_mean
                    if peak_ratio > 5:  # Strong peak indicates moiré
                        moire_score += 0.25
        
        return np.clip(moire_score, 0, 1)
    
    def _detect_void_pantograph(self, original: np.ndarray, scanned: np.ndarray) -> float:
        """Detect if void pantograph has been triggered"""
        # Ensure same size for comparison
        if original.shape != scanned.shape:
            # Find minimum dimensions and center crop both
            min_h = min(original.shape[0], scanned.shape[0])
            min_w = min(original.shape[1], scanned.shape[1])
            
            orig_h, orig_w = original.shape
            scan_h, scan_w = scanned.shape
            
            original = original[
                (orig_h - min_h)//2:(orig_h + min_h)//2,
                (orig_w - min_w)//2:(orig_w + min_w)//2
            ]
            scanned = scanned[
                (scan_h - min_h)//2:(scan_h + min_h)//2,
                (scan_w - min_w)//2:(scan_w + min_w)//2
            ]
    
        # Calculate local contrast in both images
        kernel_size = 21
    
        # Local mean and std for original
        orig_mean = cv2.blur(original.astype(np.float32), (kernel_size, kernel_size))
        orig_sqr = cv2.blur(original.astype(np.float32)**2, (kernel_size, kernel_size))
        orig_std = np.sqrt(np.maximum(orig_sqr - orig_mean**2, 0))
        
        # Local mean and std for scanned
        scan_mean = cv2.blur(scanned.astype(np.float32), (kernel_size, kernel_size))
        scan_sqr = cv2.blur(scanned.astype(np.float32)**2, (kernel_size, kernel_size))
        scan_std = np.sqrt(np.maximum(scan_sqr - scan_mean**2, 0))
        
        # Void pantograph shows increased contrast in specific areas
        contrast_increase = scan_std - orig_std
        
        # Look for systematic contrast increase (void pattern emerging)
        significant_increase = contrast_increase > np.percentile(contrast_increase, 75)
        
        void_score = np.sum(significant_increase) / significant_increase.size
        return np.clip(void_score * 10, 0, 1)  # Amplify small changes
    
    def _analyze_edge_degradation(self, original: np.ndarray, scanned: np.ndarray) -> float:
        """Analyze edge sharpness degradation"""
        # Ensure same size for comparison
        if original.shape != scanned.shape:
            # Find minimum dimensions and center crop both
            min_h = min(original.shape[0], scanned.shape[0])
            min_w = min(original.shape[1], scanned.shape[1])
            
            orig_h, orig_w = original.shape
            scan_h, scan_w = scanned.shape
            
            original = original[
                (orig_h - min_h)//2:(orig_h + min_h)//2,
                (orig_w - min_w)//2:(orig_w + min_w)//2
            ]
            scanned = scanned[
                (scan_h - min_h)//2:(scan_h + min_h)//2,
                (scan_w - min_w)//2:(scan_w + min_w)//2
            ]
    
        # Detect edges using Canny
        edges_orig = cv2.Canny(original, 50, 150)
        edges_scan = cv2.Canny(scanned, 50, 150)
        
        # Calculate edge strength using Sobel
        sobel_x_orig = cv2.Sobel(original, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y_orig = cv2.Sobel(original, cv2.CV_64F, 0, 1, ksize=3)
        edge_strength_orig = np.sqrt(sobel_x_orig**2 + sobel_y_orig**2)
        
        sobel_x_scan = cv2.Sobel(scanned, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y_scan = cv2.Sobel(scanned, cv2.CV_64F, 0, 1, ksize=3)
        edge_strength_scan = np.sqrt(sobel_x_scan**2 + sobel_y_scan**2)
        
        # Compare edge strength at edge locations
        edge_mask = edges_orig > 0
        if np.sum(edge_mask) == 0:
            return 0.0
            
        orig_strength = np.mean(edge_strength_orig[edge_mask])
        scan_strength = np.mean(edge_strength_scan[edge_mask])
        
        if orig_strength == 0:
            return 0.0
    
        degradation = 1.0 - (scan_strength / orig_strength)
        return np.clip(degradation, 0, 1)
    
    def _analyze_noise_patterns(self, original: np.ndarray, scanned: np.ndarray) -> float:
        """Analyze changes in noise patterns"""
        # Ensure same size for comparison
        if original.shape != scanned.shape:
            # Find minimum dimensions and center crop both
            min_h = min(original.shape[0], scanned.shape[0])
            min_w = min(original.shape[1], scanned.shape[1])
            
            orig_h, orig_w = original.shape
            scan_h, scan_w = scanned.shape
            
            original = original[
                (orig_h - min_h)//2:(orig_h + min_h)//2,
                (orig_w - min_w)//2:(orig_w + min_w)//2
            ]
            scanned = scanned[
                (scan_h - min_h)//2:(scan_h + min_h)//2,
                (scan_w - min_w)//2:(scan_w + min_w)//2
            ]
    
        # Extract noise by subtracting smoothed version
        blur_size = 5
        orig_smooth = cv2.GaussianBlur(original, (blur_size, blur_size), 1.0)
        scan_smooth = cv2.GaussianBlur(scanned, (blur_size, blur_size), 1.0)
        
        orig_noise = original.astype(np.float32) - orig_smooth.astype(np.float32)
        scan_noise = scanned.astype(np.float32) - scan_smooth.astype(np.float32)
        
        # Compare noise characteristics
        orig_noise_std = np.std(orig_noise)
        scan_noise_std = np.std(scan_noise)
        
        # Photocopiers typically reduce noise
        if orig_noise_std == 0:
            return 0.0
            
        noise_reduction = 1.0 - (scan_noise_std / orig_noise_std)
        return np.clip(noise_reduction, 0, 1)
    
    def _detect_digital_capture(self, original: np.ndarray, scanned: np.ndarray, original_scanned_shape: tuple, size_ratio: float) -> bool:
        """
        Detect if this is a digital camera capture (any device) vs physical photocopy
        Based on multiple characteristics, not just size
        """
        digital_indicators = 0
        total_checks = 0
        
        # 1. Size ratio check - moderate differences suggest digital resize
        total_checks += 1
        if 0.3 <= size_ratio <= 3.0:  # Reasonable digital resize range
            digital_indicators += 1
            logger.info(f"Digital indicator: Reasonable size ratio ({size_ratio:.2f})")
        
        # 2. Square aspect ratio check - cameras often default to square
        total_checks += 1
        height, width = original_scanned_shape
        aspect_ratio = width / height
        if 0.95 <= aspect_ratio <= 1.05:  # Nearly square
            digital_indicators += 1
            logger.info("Digital indicator: Square aspect ratio")
        
        # 3. Clean edges check - digital captures have cleaner edges than photocopies
        total_checks += 1
        edge_cleanliness = self._analyze_edge_cleanliness(scanned)
        if edge_cleanliness > 0.7:  # Clean digital edges
            digital_indicators += 1
            logger.info(f"Digital indicator: Clean edges ({edge_cleanliness:.2f})")
        
        # 4. Noise pattern check - digital has different noise than photocopy
        total_checks += 1
        noise_type = self._analyze_noise_type(scanned)
        if noise_type == 'digital':
            digital_indicators += 1
            logger.info("Digital indicator: Digital noise pattern")
        
        # 5. Color depth check - photocopies often reduce bit depth
        total_checks += 1
        bit_depth_preserved = self._check_bit_depth_preservation(original, scanned)
        if bit_depth_preserved:
            digital_indicators += 1
            logger.info("Digital indicator: Bit depth preserved")
        
        # 6. Compression artifacts - digital captures have specific compression
        total_checks += 1
        has_digital_compression = self._detect_digital_compression_artifacts(scanned)
        if has_digital_compression:
            digital_indicators += 1
            logger.info("Digital indicator: Digital compression detected")
        
        confidence = digital_indicators / total_checks
        is_digital = confidence >= 0.6  # 60% of indicators suggest digital
        
        logger.info(f"Digital capture detection: {digital_indicators}/{total_checks} indicators = {confidence:.2f} confidence")
        return is_digital

    def _analyze_edge_cleanliness(self, image: np.ndarray) -> float:
        """Analyze how clean/sharp edges are (digital vs photocopy)"""
        edges = cv2.Canny(image, 50, 150)
        
        # Digital captures have cleaner, more defined edges
        kernel = np.ones((3,3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=1)
        eroded = cv2.erode(edges, kernel, iterations=1)
        
        edge_preservation = np.sum(edges) / (np.sum(dilated) + 1)
        return edge_preservation

    def _check_bit_depth_preservation(self, original: np.ndarray, scanned: np.ndarray) -> bool:
        """Check if bit depth is preserved (digital) or reduced (photocopy)"""
        orig_levels = len(np.unique(original))
        scan_levels = len(np.unique(scanned))
        preservation_ratio = scan_levels / orig_levels
        return preservation_ratio > 0.8

    def _detect_digital_compression_artifacts(self, image: np.ndarray) -> bool:
        """Detect JPEG-like compression artifacts typical of digital captures"""
        h, w = image.shape
        block_variance = []
        
        for y in range(0, h-8, 8):
            for x in range(0, w-8, 8):
                block = image[y:y+8, x:x+8]
                block_variance.append(np.var(block))
        
        if len(block_variance) == 0:
            return False
        
        variance_std = np.std(block_variance)
        variance_mean = np.mean(block_variance)
        compression_indicator = variance_std / (variance_mean + 1)
        return compression_indicator > 0.3
    
    def _analyze_noise_type(self, image: np.ndarray) -> str:
        """Determine if noise pattern is digital or photocopy-like"""
        # Extract noise
        blurred = cv2.GaussianBlur(image, (5, 5), 1.0)
        noise = image.astype(np.float32) - blurred.astype(np.float32)
        
        # Digital noise is more uniform and Gaussian
        # Photocopy noise is more structured and periodic
        
        noise_std = np.std(noise)
        noise_mean = np.mean(np.abs(noise))
        
        # Digital cameras have more uniform noise distribution
        if noise_mean > 0:
            uniformity = noise_std / noise_mean
            return 'digital' if uniformity > 1.2 else 'photocopy'
        else:
            return 'digital'  # Default to digital if no noise detected
def detect_photocopy(original_path: str, scanned_path: str) -> dict:
    """
    Wrapper function for backward compatibility.
    Uses AntiPhotocopyGenerator to verify photocopy detection.
    """
    detector = AntiPhotocopyGenerator()
    return detector.verify_photocopy(original_path, scanned_path)