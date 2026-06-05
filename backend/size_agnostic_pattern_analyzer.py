import cv2
import numpy as np
from scipy import ndimage, signal
from skimage import feature, filters, measure, metrics
import logging
from typing import Dict, Tuple, Any, Optional
import math

logger = logging.getLogger(__name__)

class SizeAgnosticPatternAnalyzer:
    """
    🔐 SIZE-AGNOSTIC Pattern Degradation Analyzer
    Focus: Detect pattern degradation and photocopy artifacts regardless of QR size
    Approach: Compare patterns, not absolute measurements
    """
    
    def __init__(self):
        # Pattern-based thresholds (not size-dependent)
        self.PATTERN_THRESHOLDS = {
            'microprint_degradation': 0.4,     # Microprint loss threshold
            'frequency_loss': 0.3,             # High-frequency loss threshold  
            'void_pantograph': 0.3,            # Void pattern emergence threshold
            'edge_degradation': 0.35,          # Edge sharpness loss threshold
            'moire_detection': 0.25,           # Moiré pattern threshold
            'noise_pattern_change': 0.3        # Noise pattern change threshold
        }
        
        # Pattern analysis weights (focus on most reliable indicators)
        self.PATTERN_WEIGHTS = {
            'microprint_degradation': 0.25,    # High - real security feature
            'frequency_loss': 0.20,            # High - pattern integrity
            'void_pantograph': 0.20,           # High - security feature
            'edge_degradation': 0.15,          # Medium - general quality
            'moire_detection': 0.10,           # Medium - photocopy artifact
            'noise_pattern_change': 0.10       # Low - can vary naturally
        }
    
    def analyze_pattern_degradation(self, original_path: str, scanned_path: str, 
                                  qr_id: str) -> Dict[str, Any]:
        """
        🎯 CORE FUNCTION: Analyze pattern degradation regardless of size
        Compares original vs scanned patterns to detect photocopy artifacts
        """
        try:
            logger.info(f"🔐 Starting size-agnostic pattern analysis for QR: {qr_id}")
            
            # Load images
            original = cv2.imread(original_path, cv2.IMREAD_GRAYSCALE)
            scanned = cv2.imread(scanned_path, cv2.IMREAD_GRAYSCALE)
            
            if original is None or scanned is None:
                raise ValueError("Could not load images")
            
            logger.info(f"🔐 Original: {original.shape}, Scanned: {scanned.shape}")
            
            # SIZE-AGNOSTIC PREPROCESSING: Normalize for pattern comparison
            original_norm, scanned_norm = self._normalize_for_pattern_comparison(
                original, scanned)
            
            # 1. MICROPRINT DEGRADATION ANALYSIS
            microprint_analysis = self._analyze_microprint_degradation(
                original_norm, scanned_norm)
            
            # 2. FREQUENCY DOMAIN PATTERN LOSS
            frequency_analysis = self._analyze_frequency_pattern_loss(
                original_norm, scanned_norm)
            
            # 3. VOID PANTOGRAPH DETECTION  
            void_analysis = self._analyze_void_pantograph_emergence(
                original_norm, scanned_norm)
            
            # 4. EDGE PATTERN DEGRADATION
            edge_analysis = self._analyze_edge_pattern_degradation(
                original_norm, scanned_norm)
            
            # 5. MOIRÉ PATTERN DETECTION
            moire_analysis = self._detect_moire_patterns(scanned_norm)
            
            # 6. NOISE PATTERN CHANGES
            noise_analysis = self._analyze_noise_pattern_changes(
                original_norm, scanned_norm)
            
            # Calculate pattern degradation score
            pattern_degradation_score = self._calculate_pattern_degradation_score(
                microprint_analysis, frequency_analysis, void_analysis,
                edge_analysis, moire_analysis, noise_analysis
            )
            
            # Determine if patterns indicate photocopy
            photocopy_determination = self._determine_photocopy_from_patterns(
                pattern_degradation_score, microprint_analysis, frequency_analysis,
                void_analysis, edge_analysis, moire_analysis, noise_analysis
            )
            
            result = {
                "qr_id": qr_id,
                "pattern_degradation_score": pattern_degradation_score,
                "is_photocopy": photocopy_determination["is_photocopy"],
                "confidence": photocopy_determination["confidence"],
                "authenticity_status": photocopy_determination["status"],
                "size_agnostic_analysis": True,
                "pattern_analysis": {
                    "microprint_degradation": microprint_analysis,
                    "frequency_loss": frequency_analysis,
                    "void_pantograph": void_analysis,
                    "edge_degradation": edge_analysis,
                    "moire_detection": moire_analysis,
                    "noise_changes": noise_analysis
                },
                "degradation_indicators": photocopy_determination["indicators"],
                "recommendation": photocopy_determination["recommendation"]
            }
            
            logger.info(f"🔐 Pattern analysis complete: Score={pattern_degradation_score:.3f}, "
                       f"Photocopy={photocopy_determination['is_photocopy']}, "
                       f"Confidence={photocopy_determination['confidence']:.1f}%")
            
            return result
            
        except Exception as e:
            logger.error(f"🔐 Pattern analysis failed: {e}")
            return {
                "qr_id": qr_id,
                "pattern_degradation_score": 0.0,
                "is_photocopy": False,
                "authenticity_status": "ERROR",
                "error": str(e)
            }
    
    def _normalize_for_pattern_comparison(self, original: np.ndarray, 
                                        scanned: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        🎯 SIZE-AGNOSTIC NORMALIZATION: Prepare images for pattern comparison
        Key: Resize to common dimensions while preserving pattern characteristics
        """
        try:
            logger.info("🔐 Normalizing images for pattern comparison (size-agnostic)")
            
            # Find the optimal common size for pattern analysis
            orig_size = min(original.shape)
            scan_size = min(scanned.shape)
            
            # Use the smaller size to avoid upscaling artifacts
            # But ensure minimum size for pattern analysis
            common_size = max(300, min(orig_size, scan_size))
            
            logger.info(f"🔐 Common analysis size: {common_size}x{common_size}")
            
            # Resize both images to common size
            # Use INTER_AREA for downscaling (preserves patterns better)
            # Use INTER_CUBIC for upscaling (higher quality)
            
            if orig_size > common_size:
                original_norm = cv2.resize(original, (common_size, common_size), 
                                         interpolation=cv2.INTER_AREA)
            else:
                original_norm = cv2.resize(original, (common_size, common_size), 
                                         interpolation=cv2.INTER_CUBIC)
            
            if scan_size > common_size:
                scanned_norm = cv2.resize(scanned, (common_size, common_size), 
                                        interpolation=cv2.INTER_AREA)
            else:
                scanned_norm = cv2.resize(scanned, (common_size, common_size), 
                                        interpolation=cv2.INTER_CUBIC)
            
            # Normalize intensity distributions for fair comparison
            original_norm = self._normalize_intensity(original_norm)
            scanned_norm = self._normalize_intensity(scanned_norm)
            
            return original_norm, scanned_norm
            
        except Exception as e:
            logger.error(f"Normalization failed: {e}")
            return original, scanned
    
    def _normalize_intensity(self, image: np.ndarray) -> np.ndarray:
        """Normalize intensity distribution for consistent comparison"""
        try:
            # Histogram equalization for consistent intensity distribution
            equalized = cv2.equalizeHist(image)
            
            # Blend with original to preserve patterns
            normalized = cv2.addWeighted(image, 0.7, equalized, 0.3, 0)
            
            return normalized
        except Exception as e:
            logger.error(f"Intensity normalization failed: {e}")
            return image
    
    def _analyze_microprint_degradation(self, original: np.ndarray, 
                                      scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 MICROPRINT DEGRADATION: Detect loss of fine detail patterns
        Key insight: Photocopies lose fine detail regardless of size
        """
        try:
            # Use Laplacian to detect fine details
            laplacian_orig = cv2.Laplacian(original, cv2.CV_64F, ksize=3)
            laplacian_scan = cv2.Laplacian(scanned, cv2.CV_64F, ksize=3)
            
            # Focus on high-detail areas (microprint regions)
            detail_threshold = np.percentile(np.abs(laplacian_orig), 85)
            detail_mask = np.abs(laplacian_orig) > detail_threshold
            
            if np.sum(detail_mask) == 0:
                return {"degradation_score": 0.0, "detail_loss": 0.0}
            
            # Compare detail preservation in microprint areas
            orig_detail_strength = np.mean(np.abs(laplacian_orig[detail_mask]))
            scan_detail_strength = np.mean(np.abs(laplacian_scan[detail_mask]))
            
            if orig_detail_strength == 0:
                return {"degradation_score": 0.0, "detail_loss": 0.0}
            
            # Calculate detail loss
            detail_loss = 1.0 - (scan_detail_strength / orig_detail_strength)
            detail_loss = np.clip(detail_loss, 0, 1)
            
            # Additional analysis: Local variance comparison
            kernel = np.ones((5, 5), np.float32) / 25
            orig_local_var = cv2.filter2D(original.astype(np.float32)**2, -1, kernel) - \
                           cv2.filter2D(original.astype(np.float32), -1, kernel)**2
            scan_local_var = cv2.filter2D(scanned.astype(np.float32)**2, -1, kernel) - \
                           cv2.filter2D(scanned.astype(np.float32), -1, kernel)**2
            
            # Focus on high-variance areas (microprint)
            high_var_mask = orig_local_var > np.percentile(orig_local_var, 80)
            
            if np.sum(high_var_mask) > 0:
                orig_var_mean = np.mean(orig_local_var[high_var_mask])
                scan_var_mean = np.mean(scan_local_var[high_var_mask])
                
                if orig_var_mean > 0:
                    variance_loss = 1.0 - (scan_var_mean / orig_var_mean)
                    variance_loss = np.clip(variance_loss, 0, 1)
                else:
                    variance_loss = 0.0
            else:
                variance_loss = 0.0
            
            # Combined degradation score
            degradation_score = (detail_loss * 0.7 + variance_loss * 0.3)
            
            return {
                "degradation_score": degradation_score,
                "detail_loss": detail_loss,
                "variance_loss": variance_loss,
                "microprint_areas_detected": np.sum(detail_mask)
            }
            
        except Exception as e:
            logger.error(f"Microprint analysis failed: {e}")
            return {"degradation_score": 0.0, "detail_loss": 0.0}
    
    def _analyze_frequency_pattern_loss(self, original: np.ndarray, 
                                      scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 FREQUENCY PATTERN LOSS: Detect loss of high-frequency patterns
        Key insight: Photocopies lose high-frequency components regardless of size
        """
        try:
            # FFT analysis
            fft_orig = np.fft.fft2(original)
            fft_scan = np.fft.fft2(scanned)
            
            # Get magnitude spectrums
            mag_orig = np.abs(np.fft.fftshift(fft_orig))
            mag_scan = np.abs(np.fft.fftshift(fft_scan))
            
            # Define frequency bands for analysis
            h, w = mag_orig.shape
            center = (h // 2, w // 2)
            
            # Create frequency band masks
            frequency_bands = {
                'low': (0, min(center) * 0.3),
                'mid': (min(center) * 0.3, min(center) * 0.6),
                'high': (min(center) * 0.6, min(center) * 0.9),
                'ultra_high': (min(center) * 0.9, min(center))
            }
            
            band_losses = {}
            
            for band_name, (inner_r, outer_r) in frequency_bands.items():
                # Create annular mask for this frequency band
                y, x = np.ogrid[:h, :w]
                distances = np.sqrt((x - center[1])**2 + (y - center[0])**2)
                band_mask = (distances >= inner_r) & (distances < outer_r)
                
                if np.sum(band_mask) > 0:
                    # Calculate energy in this band
                    orig_energy = np.sum(mag_orig[band_mask])
                    scan_energy = np.sum(mag_scan[band_mask])
                    
                    if orig_energy > 0:
                        energy_loss = 1.0 - (scan_energy / orig_energy)
                        band_losses[band_name] = np.clip(energy_loss, 0, 1)
                    else:
                        band_losses[band_name] = 0.0
                else:
                    band_losses[band_name] = 0.0
            
            # Calculate weighted frequency loss (higher frequencies more important)
            frequency_loss = (
                band_losses.get('low', 0) * 0.1 +
                band_losses.get('mid', 0) * 0.2 +
                band_losses.get('high', 0) * 0.4 +
                band_losses.get('ultra_high', 0) * 0.3
            )
            
            return {
                "frequency_loss": frequency_loss,
                "band_losses": band_losses,
                "high_freq_loss": band_losses.get('high', 0),
                "ultra_high_freq_loss": band_losses.get('ultra_high', 0)
            }
            
        except Exception as e:
            logger.error(f"Frequency analysis failed: {e}")
            return {"frequency_loss": 0.0}
    
    def _analyze_void_pantograph_emergence(self, original: np.ndarray, 
                                         scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 VOID PANTOGRAPH: Detect emergence of hidden patterns when photocopied
        Key insight: Void patterns emerge in photocopies regardless of size
        """
        try:
            # Calculate local contrast using different window sizes
            window_sizes = [11, 21, 31]
            contrast_changes = []
            
            for window_size in window_sizes:
                # Local standard deviation (measure of local contrast)
                kernel = np.ones((window_size, window_size), np.float32) / (window_size * window_size)
                
                # Original local contrast
                orig_mean = cv2.filter2D(original.astype(np.float32), -1, kernel)
                orig_sqr_mean = cv2.filter2D(original.astype(np.float32)**2, -1, kernel)
                orig_local_std = np.sqrt(np.maximum(orig_sqr_mean - orig_mean**2, 0))
                
                # Scanned local contrast
                scan_mean = cv2.filter2D(scanned.astype(np.float32), -1, kernel)
                scan_sqr_mean = cv2.filter2D(scanned.astype(np.float32)**2, -1, kernel)
                scan_local_std = np.sqrt(np.maximum(scan_sqr_mean - scan_mean**2, 0))
                
                # Contrast increase (void pantograph emerging)
                contrast_increase = scan_local_std - orig_local_std
                
                # Look for systematic contrast increase in specific patterns
                significant_increase = contrast_increase > np.percentile(contrast_increase, 80)
                
                # Calculate void emergence score
                void_score = np.sum(significant_increase) / significant_increase.size
                contrast_changes.append(void_score)
            
            # Average across different window sizes
            avg_void_score = np.mean(contrast_changes)
            
            # Additional check: Look for "COPY" or "VOID" patterns
            text_pattern_score = self._detect_text_pattern_emergence(
                original, scanned, contrast_changes)
            
            # Combined void pantograph score
            void_emergence = (avg_void_score * 0.7 + text_pattern_score * 0.3)
            
            return {
                "void_emergence": void_emergence,
                "avg_contrast_change": avg_void_score,
                "text_pattern_score": text_pattern_score,
                "window_analyses": contrast_changes
            }
            
        except Exception as e:
            logger.error(f"Void pantograph analysis failed: {e}")
            return {"void_emergence": 0.0}
    
    def _detect_text_pattern_emergence(self, original: np.ndarray, 
                                     scanned: np.ndarray, 
                                     contrast_changes: list) -> float:
        """Detect emergence of specific text patterns (COPY, VOID)"""
        try:
            # Simple pattern detection for text emergence
            # Look for systematic changes that might indicate text
            
            # Calculate difference image
            diff = scanned.astype(np.float32) - original.astype(np.float32)
            
            # Look for structured patterns in the difference
            # Text patterns tend to be more structured than random noise
            
            # Use morphological operations to detect text-like structures
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            structured_diff = cv2.morphologyEx(np.abs(diff), cv2.MORPH_CLOSE, kernel)
            
            # Calculate how much structure is present
            total_diff = np.sum(np.abs(diff))
            structured_diff_sum = np.sum(structured_diff)
            
            if total_diff > 0:
                structure_ratio = structured_diff_sum / total_diff
                # Higher ratio suggests more structured changes (text-like)
                return min(structure_ratio * 2, 1.0)
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Text pattern detection failed: {e}")
            return 0.0
    
    def _analyze_edge_pattern_degradation(self, original: np.ndarray, 
                                        scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 EDGE PATTERN DEGRADATION: Detect loss of edge sharpness and definition
        Key insight: Photocopies blur edges regardless of size
        """
        try:
            # Multi-scale edge analysis
            edge_degradations = []
            
            for scale in [1, 2, 3]:  # Different scales for robustness
                # Edge detection at different scales
                orig_edges = cv2.Canny(original, 50 * scale, 150 * scale)
                scan_edges = cv2.Canny(scanned, 50 * scale, 150 * scale)
                
                # Sobel edge strength
                sobel_x_orig = cv2.Sobel(original, cv2.CV_64F, 1, 0, ksize=3)
                sobel_y_orig = cv2.Sobel(original, cv2.CV_64F, 0, 1, ksize=3)
                edge_strength_orig = np.sqrt(sobel_x_orig**2 + sobel_y_orig**2)
                
                sobel_x_scan = cv2.Sobel(scanned, cv2.CV_64F, 1, 0, ksize=3)
                sobel_y_scan = cv2.Sobel(scanned, cv2.CV_64F, 0, 1, ksize=3)
                edge_strength_scan = np.sqrt(sobel_x_scan**2 + sobel_y_scan**2)
                
                # Compare edge strength at edge locations
                edge_mask = orig_edges > 0
                if np.sum(edge_mask) > 0:
                    orig_strength = np.mean(edge_strength_orig[edge_mask])
                    scan_strength = np.mean(edge_strength_scan[edge_mask])
                    
                    if orig_strength > 0:
                        degradation = 1.0 - (scan_strength / orig_strength)
                        edge_degradations.append(np.clip(degradation, 0, 1))
                    else:
                        edge_degradations.append(0.0)
                else:
                    edge_degradations.append(0.0)
            
            # Average degradation across scales
            avg_edge_degradation = np.mean(edge_degradations) if edge_degradations else 0.0
            
            # Edge continuity analysis
            edge_continuity_loss = self._analyze_edge_continuity_loss(original, scanned)
            
            # Combined edge degradation
            edge_degradation = (avg_edge_degradation * 0.7 + edge_continuity_loss * 0.3)
            
            return {
                "edge_degradation": edge_degradation,
                "avg_strength_loss": avg_edge_degradation,
                "continuity_loss": edge_continuity_loss,
                "scale_analyses": edge_degradations
            }
            
        except Exception as e:
            logger.error(f"Edge analysis failed: {e}")
            return {"edge_degradation": 0.0}
    
    def _analyze_edge_continuity_loss(self, original: np.ndarray, 
                                    scanned: np.ndarray) -> float:
        """Analyze loss of edge continuity"""
        try:
            # Detect edges
            orig_edges = cv2.Canny(original, 50, 150)
            scan_edges = cv2.Canny(scanned, 50, 150)
            
            # Analyze connected components
            orig_components = cv2.connectedComponents(orig_edges)[0]
            scan_components = cv2.connectedComponents(scan_edges)[0]
            
            # Calculate edge fragmentation
            orig_edge_pixels = np.sum(orig_edges > 0)
            scan_edge_pixels = np.sum(scan_edges > 0)
            
            if orig_edge_pixels > 0 and scan_edge_pixels > 0:
                # More components with fewer pixels suggests fragmentation
                orig_fragmentation = orig_components / orig_edge_pixels
                scan_fragmentation = scan_components / scan_edge_pixels
                
                fragmentation_increase = scan_fragmentation - orig_fragmentation
                return np.clip(fragmentation_increase * 1000, 0, 1)  # Scale up small differences
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Edge continuity analysis failed: {e}")
            return 0.0
    
    def _detect_moire_patterns(self, scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 MOIRÉ PATTERN DETECTION: Detect moiré patterns from photocopying
        Key insight: Moiré patterns appear in photocopies regardless of size
        """
        try:
            # FFT analysis for periodic patterns
            fft = np.fft.fft2(scanned)
            fft_shift = np.fft.fftshift(fft)
            magnitude = np.abs(fft_shift)
            
            # Log magnitude for better peak detection
            log_magnitude = np.log(magnitude + 1)
            
            h, w = magnitude.shape
            center = (h // 2, w // 2)
            
            # Look for regular patterns (moiré) in different frequency bands
            moire_scores = []
            
            for radius_ratio in [0.2, 0.3, 0.4, 0.5, 0.6]:  # Different frequency bands
                radius = min(center) * radius_ratio
                
                # Create annular mask
                y, x = np.ogrid[:h, :w]
                distances = np.sqrt((x - center[1])**2 + (y - center[0])**2)
                inner_mask = distances < radius - 5
                outer_mask = distances < radius + 5
                annular_mask = outer_mask & ~inner_mask
                
                if np.sum(annular_mask) > 0:
                    # Look for peaks in this annular region
                    annular_values = magnitude[annular_mask]
                    annular_mean = np.mean(annular_values)
                    annular_max = np.max(annular_values)
                    
                    if annular_mean > 0:
                        peak_ratio = annular_max / annular_mean
                        # Strong peaks indicate regular patterns (moiré)
                        if peak_ratio > 3:  # Threshold for significant peaks
                            moire_score = min((peak_ratio - 3) / 7, 1.0)  # Normalize
                            moire_scores.append(moire_score)
            
            # Average moiré score across frequency bands
            avg_moire_score = np.mean(moire_scores) if moire_scores else 0.0
            
            # Additional check: Look for regular grid patterns
            grid_score = self._detect_regular_grid_patterns(scanned)
            
            # Combined moiré detection
            moire_detection = (avg_moire_score * 0.7 + grid_score * 0.3)
            
            return {
                "moire_detection": moire_detection,
                "frequency_peaks": avg_moire_score,
                "grid_patterns": grid_score,
                "peak_analyses": moire_scores
            }
            
        except Exception as e:
            logger.error(f"Moiré detection failed: {e}")
            return {"moire_detection": 0.0}
    
    def _detect_regular_grid_patterns(self, image: np.ndarray) -> float:
        """Detect regular grid patterns that indicate moiré"""
        try:
            # Use autocorrelation to detect regular patterns
            # Photocopier artifacts often create regular grid patterns
            
            # Take a central region for analysis
            h, w = image.shape
            center_h, center_w = h // 2, w // 2
            region_size = min(h, w) // 4
            
            region = image[center_h - region_size:center_h + region_size,
                          center_w - region_size:center_w + region_size]
            
            if region.size == 0:
                return 0.0
            
            # Calculate autocorrelation
            autocorr = cv2.matchTemplate(region, region, cv2.TM_CCORR_NORMED)
            
            # Look for regular peaks in autocorrelation (indicating regular patterns)
            # Exclude the center peak
            center_autocorr = autocorr.shape[0] // 2
            autocorr[center_autocorr - 5:center_autocorr + 5, 
                    center_autocorr - 5:center_autocorr + 5] = 0
            
            # Find peaks
            threshold = np.percentile(autocorr, 95)
            peaks = autocorr > threshold
            
            # Regular patterns have more peaks
            regularity_score = np.sum(peaks) / peaks.size
            
            return min(regularity_score * 10, 1.0)  # Scale up
            
        except Exception as e:
            logger.error(f"Grid pattern detection failed: {e}")
            return 0.0
    
    def _analyze_noise_pattern_changes(self, original: np.ndarray, 
                                     scanned: np.ndarray) -> Dict[str, float]:
        """
        🔍 NOISE PATTERN CHANGES: Detect changes in noise characteristics
        Key insight: Photocopies change noise patterns regardless of size
        """
        try:
            # Extract noise by subtracting smoothed versions
            blur_kernel = 5
            
            orig_smooth = cv2.GaussianBlur(original, (blur_kernel, blur_kernel), 1.0)
            scan_smooth = cv2.GaussianBlur(scanned, (blur_kernel, blur_kernel), 1.0)
            
            orig_noise = original.astype(np.float32) - orig_smooth.astype(np.float32)
            scan_noise = scanned.astype(np.float32) - scan_smooth.astype(np.float32)
            
            # Noise characteristics analysis
            orig_noise_std = np.std(orig_noise)
            scan_noise_std = np.std(scan_noise)
            
            # Noise distribution change
            if orig_noise_std > 0:
                noise_change = abs(scan_noise_std - orig_noise_std) / orig_noise_std
            else:
                noise_change = 0.0
            
            # Noise pattern correlation
            if orig_noise.size == scan_noise.size:
                # Calculate correlation between noise patterns
                correlation = np.corrcoef(orig_noise.flatten(), scan_noise.flatten())[0, 1]
                if np.isnan(correlation):
                    correlation = 0.0
                noise_correlation_loss = 1.0 - abs(correlation)
            else:
                noise_correlation_loss = 0.5
            
            # Noise frequency analysis
            noise_freq_change = self._analyze_noise_frequency_changes(orig_noise, scan_noise)
            
            # Combined noise pattern change
            noise_pattern_change = (
                noise_change * 0.4 +
                noise_correlation_loss * 0.3 +
                noise_freq_change * 0.3
            )
            
            return {
                "noise_pattern_change": noise_pattern_change,
                "noise_std_change": noise_change,
                "correlation_loss": noise_correlation_loss,
                "frequency_change": noise_freq_change
            }
            
        except Exception as e:
            logger.error(f"Noise analysis failed: {e}")
            return {"noise_pattern_change": 0.0}
    
    def _analyze_noise_frequency_changes(self, orig_noise: np.ndarray, 
                                       scan_noise: np.ndarray) -> float:
        """Analyze changes in noise frequency characteristics"""
        try:
            # FFT of noise patterns
            fft_orig = np.fft.fft2(orig_noise)
            fft_scan = np.fft.fft2(scan_noise)
            
            # Power spectral density
            psd_orig = np.abs(fft_orig)**2
            psd_scan = np.abs(fft_scan)**2
            
            # Compare power distribution
            total_power_orig = np.sum(psd_orig)
            total_power_scan = np.sum(psd_scan)
            
            if total_power_orig > 0 and total_power_scan > 0:
                # Normalize
                psd_orig_norm = psd_orig / total_power_orig
                psd_scan_norm = psd_scan / total_power_scan
                
                # Calculate difference in power distribution
                power_diff = np.sum(np.abs(psd_orig_norm - psd_scan_norm))
                return min(power_diff, 1.0)
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Noise frequency analysis failed: {e}")
            return 0.0
    
    def _calculate_pattern_degradation_score(self, microprint: Dict, frequency: Dict,
                                           void: Dict, edge: Dict, moire: Dict,
                                           noise: Dict) -> float:
        """Calculate overall pattern degradation score"""
        try:
            # Extract individual scores
            microprint_score = microprint.get("degradation_score", 0.0)
            frequency_score = frequency.get("frequency_loss", 0.0)
            void_score = void.get("void_emergence", 0.0)
            edge_score = edge.get("edge_degradation", 0.0)
            moire_score = moire.get("moire_detection", 0.0)
            noise_score = noise.get("noise_pattern_change", 0.0)
            
            # Apply weights
            weighted_score = (
                microprint_score * self.PATTERN_WEIGHTS['microprint_degradation'] +
                frequency_score * self.PATTERN_WEIGHTS['frequency_loss'] +
                void_score * self.PATTERN_WEIGHTS['void_pantograph'] +
                edge_score * self.PATTERN_WEIGHTS['edge_degradation'] +
                moire_score * self.PATTERN_WEIGHTS['moire_detection'] +
                noise_score * self.PATTERN_WEIGHTS['noise_pattern_change']
            )
            
            return np.clip(weighted_score, 0, 1)
            
        except Exception as e:
            logger.error(f"Pattern degradation score calculation failed: {e}")
            return 0.0
    
    def _determine_photocopy_from_patterns(self, degradation_score: float,
                                         microprint: Dict, frequency: Dict,
                                         void: Dict, edge: Dict, moire: Dict,
                                         noise: Dict) -> Dict[str, Any]:
        """Determine if patterns indicate photocopy"""
        try:
            # Check individual pattern thresholds
            indicators = []
            
            if microprint.get("degradation_score", 0) > self.PATTERN_THRESHOLDS['microprint_degradation']:
                indicators.append("Microprint degradation detected")
            
            if frequency.get("frequency_loss", 0) > self.PATTERN_THRESHOLDS['frequency_loss']:
                indicators.append("High-frequency pattern loss")
            
            if void.get("void_emergence", 0) > self.PATTERN_THRESHOLDS['void_pantograph']:
                indicators.append("Void pantograph emergence")
            
            if edge.get("edge_degradation", 0) > self.PATTERN_THRESHOLDS['edge_degradation']:
                indicators.append("Edge pattern degradation")
            
            if moire.get("moire_detection", 0) > self.PATTERN_THRESHOLDS['moire_detection']:
                indicators.append("Moiré patterns detected")
            
            if noise.get("noise_pattern_change", 0) > self.PATTERN_THRESHOLDS['noise_pattern_change']:
                indicators.append("Noise pattern changes")
            
            # Determine photocopy based on degradation score and indicators
            if degradation_score > 0.6:
                is_photocopy = True
                confidence = min(degradation_score * 120, 95)
                status = "PHOTOCOPY_DETECTED"
                recommendation = "REJECT - Clear photocopy patterns detected"
            elif degradation_score > 0.4 or len(indicators) >= 3:
                is_photocopy = True
                confidence = min(degradation_score * 100 + 20, 85)
                status = "LIKELY_PHOTOCOPY"
                recommendation = "REJECT - Multiple degradation indicators"
            elif degradation_score > 0.25 or len(indicators) >= 2:
                is_photocopy = False  # Suspicious but not conclusive
                confidence = degradation_score * 80
                status = "SUSPICIOUS"
                recommendation = "REVIEW - Some degradation detected"
            else:
                is_photocopy = False
                confidence = max(10, (1 - degradation_score) * 90)
                status = "AUTHENTIC"
                recommendation = "ACCEPT - Patterns consistent with original"
            
            return {
                "is_photocopy": is_photocopy,
                "confidence": round(confidence, 1),
                "status": status,
                "indicators": indicators,
                "recommendation": recommendation,
                "pattern_analysis_complete": True
            }
            
        except Exception as e:
            logger.error(f"Photocopy determination failed: {e}")
            return {
                "is_photocopy": False,
                "confidence": 0.0,
                "status": "ERROR",
                "indicators": ["Analysis error"],
                "recommendation": "REVIEW - Analysis failed"
            }


# 🔐 MAIN INTEGRATION FUNCTION
def size_agnostic_pattern_analysis(original_path: str, scanned_path: str, 
                                 qr_id: str) -> Dict[str, Any]:
    """
    🎯 MAIN FUNCTION: Size-agnostic pattern analysis for photocopy detection
    Focus: Pattern degradation detection regardless of QR code size
    """
    try:
        analyzer = SizeAgnosticPatternAnalyzer()
        
        result = analyzer.analyze_pattern_degradation(
            original_path, scanned_path, qr_id)
        
        logger.info(f"🔐 Size-Agnostic Pattern Analysis Complete:")
        logger.info(f"   QR ID: {qr_id}")
        logger.info(f"   Degradation Score: {result.get('pattern_degradation_score', 0):.3f}")
        logger.info(f"   Photocopy Detected: {result.get('is_photocopy', False)}")
        logger.info(f"   Status: {result.get('authenticity_status', 'UNKNOWN')}") 
        logger.info(f"   Confidence: {result.get('confidence', 0):.1f}%")
        
        return result
        
    except Exception as e:
        logger.error(f"🔐 Size-agnostic pattern analysis failed: {e}")
        return {
            "qr_id": qr_id,
            "pattern_degradation_score": 0.0,
            "is_photocopy": False,
            "authenticity_status": "ERROR",
            "error": str(e)
        }