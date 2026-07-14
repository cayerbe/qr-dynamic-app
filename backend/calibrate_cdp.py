import os
import cv2
import numpy as np
import logging
from typing import List, Dict, Tuple
from scipy import stats
from cdp_sota_generator import SOTACDPGenerator, SOTACDPConfig
from size_agnostic_pattern_analyzer import size_agnostic_pattern_analysis
from enhanced_qr_generator import generate_zecca_test_qr
from PIL import Image

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class CDPCalibrator:
    def __init__(self, temp_dir="/tmp/cdp_calibration"):
        self.temp_dir = temp_dir
        os.makedirs(self.temp_dir, exist_ok=True)
        self.genuine_scores = []
        self.photocopy_scores = []

    def mock_degradation(self, img_path: str, passes: int) -> str:
        """Simulate print/scan degradation for mock mode."""
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        
        # Simulate physical print-scan channel (blur + noise + contrast loss + slight warp)
        for _ in range(passes):
            img = cv2.GaussianBlur(img, (3, 3), 0.8)
            noise = np.random.normal(0, 15, img.shape).astype(np.int16)
            img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            # Simulate slight perspective shift
            h, w = img.shape
            pts1 = np.float32([[0,0], [w,0], [0,h], [w,h]])
            shift = 3
            pts2 = np.float32([[shift,shift], [w-shift,0], [0,h-shift], [w,h]])
            M = cv2.getPerspectiveTransform(pts1, pts2)
            img = cv2.warpPerspective(img, M, (w,h), borderMode=cv2.BORDER_REPLICATE)

        out_path = img_path.replace(".png", f"_mock_{passes}.png")
        cv2.imwrite(out_path, img)
        return out_path

    def run_mock_calibration(self, num_samples: int = 10):
        """Validates the script harness using synthetic distributions."""
        logger.info(f"--- RUNNING MOCK CALIBRATION ({num_samples} samples) ---")
        
        decode_successes = 0
        
        for i in range(num_samples):
            qr_id = f"MOCK_QR_{i}"
            # 1. Generate base QR (the digital template)
            result = generate_zecca_test_qr(qr_id, cdp_density='high')
            digital_path = result['local_file_path']
            
            # Check decodability on the digital template
            qr_detector = cv2.QRCodeDetector()
            img_cv2 = cv2.imread(digital_path)
            data, bbox, _ = qr_detector.detectAndDecode(img_cv2)
            if data:
                decode_successes += 1
                
            # 2. Mock Genuine Print (1 pass of degradation)
            genuine_path = self.mock_degradation(digital_path, passes=1)
            
            # 3. Mock Photocopy (2 passes of degradation)
            photocopy_path = self.mock_degradation(digital_path, passes=2)
            
            # 4. Analyze
            gen_res = size_agnostic_pattern_analysis(digital_path, genuine_path, qr_id)
            phot_res = size_agnostic_pattern_analysis(digital_path, photocopy_path, qr_id)
            
            self.genuine_scores.append(gen_res['pattern_analysis'])
            self.photocopy_scores.append(phot_res['pattern_analysis'])
            
        logger.info(f"QR Decode Reliability: {decode_successes}/{num_samples} ({(decode_successes/num_samples)*100:.1f}%)")
        self._report_distributions()

    def _report_distributions(self):
        """Compute EER and margin separation, then output threshold recommendations."""
        def extract_stats(metric: str) -> Tuple[float, float, float, float]:
            gen_vals = [s[metric] for s in self.genuine_scores]
            phot_vals = [s[metric] for s in self.photocopy_scores]
            return (
                np.min(gen_vals), np.mean(gen_vals), np.max(gen_vals), np.std(gen_vals),
                np.min(phot_vals), np.mean(phot_vals), np.max(phot_vals), np.std(phot_vals)
            )

        pcc_g_min, pcc_g_mean, pcc_g_max, pcc_g_std, pcc_p_min, pcc_p_mean, pcc_p_max, pcc_p_std = extract_stats('pearson_correlation')
        ssim_g_min, ssim_g_mean, ssim_g_max, ssim_g_std, ssim_p_min, ssim_p_mean, ssim_p_max, ssim_p_std = extract_stats('structural_similarity')
        
        logger.info("\n=== DISTRIBUTIONS ===")
        logger.info("GENUINE PRINTS (PCC):  Min={:.3f}, Mean={:.3f}, Max={:.3f}, Std={:.3f}".format(pcc_g_min, pcc_g_mean, pcc_g_max, pcc_g_std))
        logger.info("PHOTOCOPIES (PCC):     Min={:.3f}, Mean={:.3f}, Max={:.3f}, Std={:.3f}".format(pcc_p_min, pcc_p_mean, pcc_p_max, pcc_p_std))
        
        margin = pcc_g_min - pcc_p_max
        if margin <= 0:
            logger.error(f"❌ OVERLAP DETECTED! Margin is negative ({margin:.3f}). The pattern or registration needs tuning.")
        else:
            logger.info(f"✅ CLEAN SEPARATION! Margin = {margin:.3f}")
            
        # Simplified Equal Error Rate calculation based on Means and StdDevs
        # Point where the Gaussian CDFs intersect
        eer_threshold = (pcc_g_mean * pcc_p_std + pcc_p_mean * pcc_g_std) / (pcc_g_std + pcc_p_std) if (pcc_g_std + pcc_p_std) > 0 else (pcc_g_mean + pcc_p_mean)/2
        
        logger.info("\n=== RECOMMENDED THRESHOLDS ===")
        logger.info(f"EER Intersection (Theoretical Optimal Boundary): {eer_threshold:.3f}")
        logger.info(f"Recommended pearson_correlation_min (Authentic Lower Bound): {pcc_g_min - 0.05:.3f}")
        logger.info(f"Recommended ssim_min (SSIM Veto): {ssim_g_min - 0.05:.3f}")
        logger.info(f"Recommended pearson_correlation_max (Digital Forgery Upper Bound): {pcc_g_max + 0.05:.3f}")

    def generate_physical_sheets(self, num_samples: int = 10):
        """Generates a folder of high-res QR codes for physical printing and scanning."""
        logger.info(f"--- GENERATING PHYSICAL CALIBRATION SET ({num_samples} samples) ---")
        output_dir = os.path.join(self.temp_dir, "physical_prints")
        os.makedirs(output_dir, exist_ok=True)
        
        for i in range(num_samples):
            qr_id = f"PHYSICAL_CALIB_{i}"
            result = generate_zecca_test_qr(qr_id, cdp_density='high')
            digital_path = result['local_file_path']
            
            # Copy to output dir
            out_path = os.path.join(output_dir, f"calibration_qr_{i}.png")
            import shutil
            shutil.copy2(digital_path, out_path)
            
        logger.info(f"✅ Generated {num_samples} calibration QRs in {output_dir}")
        logger.info("INSTRUCTIONS FOR USER:")
        logger.info("1. Print these PNGs on your target printer using the target paper.")
        logger.info("2. Photocopy the printed sheets on an office copier.")
        logger.info("3. Scan the GENUINE prints using the PWA and save them to a 'genuine_scans' folder.")
        logger.info("4. Scan the PHOTOCOPIES using the PWA and save them to a 'photocopy_scans' folder.")
        logger.info("5. Run: python calibrate_cdp.py physical <genuine_dir> <photocopy_dir>")
    def run_physical_calibration(self, digital_dir: str, genuine_dir: str, photocopy_dir: str):
        """Analyzes real physical prints and photocopies against their digital originals."""
        logger.info(f"--- RUNNING PHYSICAL CALIBRATION ---")
        
        def process_directory(scan_dir: str, target_list: list):
            valid_extensions = ('.png', '.jpg', '.jpeg')
            files = [f for f in os.listdir(scan_dir) if f.lower().endswith(valid_extensions)]
            logger.info(f"Processing {len(files)} images in {scan_dir}...")
            
            for file in files:
                scan_path = os.path.join(scan_dir, file)
                # We assume the user named the scan similar to the original, or we just pair them by index.
                # To be safe and simple, let's just use the very first digital template for all comparisons
                # if we can't find an exact name match, since the mathematical structure is statistically similar
                # but for exact alignment, we need the exact digital original.
                
                # Let's try to extract the index from the filename (e.g. calibration_qr_5.jpg -> 5)
                import re
                match = re.search(r'\d+', file)
                if match:
                    idx = match.group()
                    digital_file = f"calibration_qr_{idx}.png"
                else:
                    # Fallback to the first one
                    digital_file = "calibration_qr_0.png"
                    
                digital_path = os.path.join(digital_dir, digital_file)
                
                if not os.path.exists(digital_path):
                    logger.warning(f"Could not find digital original {digital_path} for {file}. Skipping.")
                    continue
                    
                logger.info(f"Analyzing {file} against {digital_file}...")
                try:
                    res = size_agnostic_pattern_analysis(digital_path, scan_path, f"PHYSICAL_CALIB_{idx if match else '0'}")
                    if 'pattern_analysis' in res:
                        target_list.append(res['pattern_analysis'])
                except Exception as e:
                    logger.error(f"Error analyzing {file}: {e}")

        process_directory(genuine_dir, self.genuine_scores)
        process_directory(photocopy_dir, self.photocopy_scores)
        
        if not self.genuine_scores or not self.photocopy_scores:
            logger.error("Failed to extract scores. Ensure directories contain valid images.")
            return
            
        self._report_distributions()

if __name__ == "__main__":
    import sys
    # For local dev testing, force secret
    os.environ['CDP_SECRET_KEY'] = 'calibration_dev_secret'
    # Force the local script to generate QRs that point to the production Railway backend!
    if 'VERIFICATION_DOMAIN' not in os.environ:
        os.environ['VERIFICATION_DOMAIN'] = 'https://qr-dynamic-app-production.up.railway.app'
        
    calibrator = CDPCalibrator()
    mode = sys.argv[1] if len(sys.argv) > 1 else 'mock'
    
    if mode == 'mock':
        calibrator.run_mock_calibration(num_samples=10)
    elif mode in ['generate', 'generate-sheets']:
        out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(calibrator.temp_dir, "physical_prints")
        calibrator.generate_physical_sheets(num_samples=20)
    elif mode == 'physical':
        if len(sys.argv) < 5:
            logger.error("Usage for physical: python calibrate_cdp.py physical <digital_dir> <genuine_dir> <photocopy_dir>")
            sys.exit(1)
        calibrator.run_physical_calibration(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        logger.info("Usage: python calibrate_cdp.py [mock | generate-sheets | physical]")
