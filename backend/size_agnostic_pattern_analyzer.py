import cv2
import numpy as np
from scipy import stats
from skimage import metrics
import logging
from typing import Dict, Tuple, Any, Optional
import math

logger = logging.getLogger(__name__)

class SizeAgnosticPatternAnalyzer:
    """
    🔐 SOTA SIZE-AGNOSTIC Pattern Analyzer (2025/2026 Standards)
    Focus: Mathematically robust degradation detection using Information Theory.
    Approach: Coarse + Fine geometric alignment, followed by PCC & SSIM fusion analysis.
    """
    
    def __init__(self):
        # We will populate thresholds from calibrate_cdp.py
        # These are safety fallbacks if calibration hasn't been injected
        self.THRESHOLDS = {
            'pearson_correlation_min': 0.65,
            'pearson_correlation_max': 0.95,
            'ssim_min': 0.40,
            'entropy_loss_max': 0.15
        }
        
    def analyze_pattern_degradation(self, original_path: str, scanned_path: str, 
                                  qr_id: str, dynamic_thresholds: dict = None) -> Dict[str, Any]:
        """
        🎯 CORE FUNCTION: Mathematical analysis of purely stochastic patterns.
        """
        if dynamic_thresholds:
            self.THRESHOLDS.update(dynamic_thresholds)
            
        try:
            logger.info(f"🔐 Starting SOTA mathematical pattern analysis for QR: {qr_id}")
            
            # Load images
            original = cv2.imread(original_path, cv2.IMREAD_GRAYSCALE)
            scanned = cv2.imread(scanned_path, cv2.IMREAD_GRAYSCALE)
            
            if original is None or scanned is None:
                raise ValueError("Could not load images")
                
            # Coarse + Fine Alignment
            aligned_scanned = self._register_geometry(original, scanned)
            if aligned_scanned is None:
                raise ValueError("Geometric registration failed. Could not align scan to template.")
                
            # Normalize scale and blur template to simulate perfect dot-gain
            orig_simulated, scan_norm = self._normalize_for_math_comparison(original, aligned_scanned)
            
            # 1. Pearson Correlation Coefficient (PCC)
            pcc = self._calculate_pearson_correlation(orig_simulated, scan_norm)
            
            # 2. Structural Similarity Index (SSIM)
            ssim_val = self._calculate_ssim(orig_simulated, scan_norm)
            
            # 3. Entropy Analysis
            orig_entropy = self._calculate_shannon_entropy(orig_simulated)
            scan_entropy = self._calculate_shannon_entropy(scan_norm)
            entropy_loss = max(0, (orig_entropy - scan_entropy) / orig_entropy) if orig_entropy > 0 else 0
            
            # Fused Decision Logic
            is_forgery, status, confidence, indicators = self._determine_authenticity(
                pcc, ssim_val, entropy_loss
            )
            
            math_degradation_score = 1.0 - pcc
            
            result = {
                "qr_id": qr_id,
                "pattern_degradation_score": math_degradation_score,
                "is_photocopy": is_forgery,
                "confidence": confidence,
                "authenticity_status": status,
                "size_agnostic_analysis": True,
                "pattern_analysis": {
                    "pearson_correlation": float(pcc),
                    "structural_similarity": float(ssim_val),
                    "original_entropy": float(orig_entropy),
                    "scanned_entropy": float(scan_entropy),
                    "entropy_loss": float(entropy_loss)
                },
                "degradation_indicators": indicators,
                "recommendation": "Reject" if is_forgery else "Accept"
            }
            
            logger.info(f"🔐 SOTA Math Analysis complete: PCC={pcc:.3f}, SSIM={ssim_val:.3f}, Status={status}")
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

    def _register_geometry(self, original: np.ndarray, scanned: np.ndarray) -> Optional[np.ndarray]:
        """
        Two-stage geometric registration.
        1. Coarse: Finder patterns (ORB feature matching or QR detection fallback)
        2. Fine: ECC Maximization (Affine constrained)
        """
        # --- STAGE 1: COARSE ALIGNMENT ---
        # Instead of relying strictly on QR detectors which might fail on dense noise,
        # we use ORB feature matching to find the coarse homography based on the strong 
        # finder-pattern edges present in both the template and scan.
        orb = cv2.ORB_create(nfeatures=5000)
        kp1, des1 = orb.detectAndCompute(original, None)
        kp2, des2 = orb.detectAndCompute(scanned, None)
        
        if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
            logger.warning("ORB feature detection failed for coarse alignment.")
            return None
            
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)
        
        # Take top 15% matches for coarse homography
        good_matches = matches[:int(len(matches) * 0.15)]
        if len(good_matches) < 4:
            logger.warning("Not enough matches for coarse homography.")
            return None
            
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        
        # Calculate Homography for coarse perspective correction
        H_coarse, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
        if H_coarse is None:
            logger.warning("Homography calculation failed.")
            return None
            
        h, w = original.shape
        coarse_aligned = cv2.warpPerspective(scanned, H_coarse, (w, h))
        
        # --- STAGE 2: FINE ALIGNMENT (ECC) ---
        # Constrained to AFFINE (no perspective/homography distortion) so it cannot 
        # locally warp the noise to artificially inflate the correlation score.
        warp_mode = cv2.MOTION_AFFINE
        warp_matrix = np.eye(2, 3, dtype=np.float32)
        
        # Define termination criteria
        number_of_iterations = 50
        termination_eps = 1e-6
        criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, number_of_iterations, termination_eps)
        
        try:
            _, warp_matrix = cv2.findTransformECC(original, coarse_aligned, warp_matrix, warp_mode, criteria, None, 5)
            fine_aligned = cv2.warpAffine(coarse_aligned, warp_matrix, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
            return fine_aligned
        except cv2.error as e:
            logger.warning(f"ECC fine alignment failed (likely minimal residual). Falling back to coarse. Error: {e}")
            return coarse_aligned

    def _normalize_for_math_comparison(self, original: np.ndarray, 
                                     aligned_scanned: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        # Apply slight Gaussian blur to original to simulate ideal print dot-gain reference
        orig_simulated = cv2.GaussianBlur(original, (3, 3), 0.5)
        return orig_simulated, aligned_scanned

    def _calculate_pearson_correlation(self, img1: np.ndarray, img2: np.ndarray) -> float:
        flat1 = img1.flatten().astype(np.float64)
        flat2 = img2.flatten().astype(np.float64)
        if np.var(flat1) == 0 or np.var(flat2) == 0:
            return 0.0
        correlation, _ = stats.pearsonr(flat1, flat2)
        return correlation
        
    def _calculate_ssim(self, img1: np.ndarray, img2: np.ndarray) -> float:
        win_size = min(7, img1.shape[0], img1.shape[1])
        if win_size % 2 == 0:
            win_size -= 1
        win_size = max(3, win_size)
        score, _ = metrics.structural_similarity(img1, img2, full=True, win_size=win_size)
        return score
        
    def _calculate_shannon_entropy(self, img: np.ndarray) -> float:
        hist = cv2.calcHist([img], [0], None, [256], [0, 256])
        hist = hist.ravel() / hist.sum()
        logs = np.log2(hist + 0.00001)
        entropy = -1 * (hist * logs).sum()
        return entropy

    def _determine_authenticity(self, pcc: float, ssim_val: float, entropy_loss: float) -> Tuple[bool, str, float, list]:
        """
        FUSED DECISION RULE
        PCC is the primary separator. SSIM is a secondary veto threshold.
        """
        indicators = []
        is_forgery = False
        confidence = 0.0
        
        # Veto 1: Digital Forgery
        if pcc > self.THRESHOLDS['pearson_correlation_max']:
            indicators.append("Suspiciously high correlation (Digital Screen Scan detected)")
            is_forgery = True
            confidence = min(99.9, (pcc - self.THRESHOLDS['pearson_correlation_max']) * 1000 + 80)
            return is_forgery, "DIGITAL_FORGERY", confidence, indicators
            
        # Fused Authentication Check
        if pcc < self.THRESHOLDS['pearson_correlation_min']:
            indicators.append(f"Low Pearson Correlation ({pcc:.3f} < {self.THRESHOLDS['pearson_correlation_min']})")
            is_forgery = True
            confidence = max(confidence, 95.0 - (pcc * 100))
            
        if ssim_val < self.THRESHOLDS['ssim_min']:
            indicators.append(f"SSIM Veto Failure ({ssim_val:.3f} < {self.THRESHOLDS['ssim_min']})")
            is_forgery = True
            confidence = max(confidence, 90.0)
            
        if is_forgery:
            return True, "FORGERY_DETECTED", confidence, indicators
            
        return False, "AUTHENTIC", 95.0, ["Mathematical patterns match print-scan baseline"]

def size_agnostic_pattern_analysis(original_path: str, scanned_path: str, qr_id: str, dynamic_thresholds: dict = None) -> Dict[str, Any]:
    analyzer = SizeAgnosticPatternAnalyzer()
    return analyzer.analyze_pattern_degradation(original_path, scanned_path, qr_id, dynamic_thresholds)