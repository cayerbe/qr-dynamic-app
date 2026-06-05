"""
ADVANCED PRINTING PROCESS MANAGEMENT SYSTEM
For Zecca dello Stato and Industrial Security Printing

This system manages the entire printing workflow from QR generation 
to final quality control, optimized for HP Indigo and offset printing
"""

import os
import json
import logging
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import cv2
from PIL import Image, ImageEnhance, ImageFilter

# Configure logging
logger = logging.getLogger(__name__)

class PrinterType(Enum):
    """Supported industrial printer types"""
    HP_INDIGO_6K = "hp_indigo_6k"
    HP_INDIGO_7K = "hp_indigo_7k" 
    HP_INDIGO_8K = "hp_indigo_8k"
    HP_INDIGO_12K = "hp_indigo_12k"
    HP_INDIGO_15K = "hp_indigo_15k"
    OFFSET_HEIDELBERG = "offset_heidelberg"
    OFFSET_KOMORI = "offset_komori"
    OFFSET_MANROLAND = "offset_manroland"
    DIGITAL_XEROX_IRIDESSE = "digital_xerox_iridesse"

class SubstrateType(Enum):
    """Security substrate types"""
    SECURITY_PAPER_120GSM = "security_paper_120gsm"
    SECURITY_PAPER_150GSM = "security_paper_150gsm"
    SYNTHETIC_TESLIN = "synthetic_teslin"
    SYNTHETIC_POLYART = "synthetic_polyart"
    TYVEK_SECURITY = "tyvek_security"
    SPECIALIZED_BANKNOTE = "specialized_banknote"

class InkType(Enum):
    """Security ink types"""
    STANDARD_PROCESS_BLACK = "standard_process_black"
    SECURITY_INK_UV = "security_ink_uv"
    SECURITY_INK_IR = "security_ink_ir"
    MAGNETIC_INK_MICR = "magnetic_ink_micr"
    OVI_INK = "ovi_ink"  # Optically Variable Ink
    FLUORESCENT_INK = "fluorescent_ink"

@dataclass
class PrinterCapabilities:
    """Capabilities and specifications of different printers"""
    printer_type: PrinterType
    max_dpi: int
    min_dpi: int
    color_gamut_pantone_coverage: float  # Percentage
    substrate_compatibility: List[SubstrateType]
    ink_compatibility: List[InkType]
    security_features: List[str]
    registration_accuracy: float  # in microns
    repeatability_tolerance: float  # in microns
    inline_quality_control: bool
    variable_data_capable: bool

@dataclass
class PrintJob:
    """Print job specifications"""
    job_id: str
    qr_id: str
    printer_type: PrinterType
    substrate_type: SubstrateType
    ink_type: InkType
    size_mm: float
    quantity: int
    dpi: int
    security_requirements: List[str]
    quality_control_level: str
    created_at: datetime
    status: str

class ZeccaPrintingManager:
    """
    Advanced printing management system for Zecca dello Stato
    Handles industrial-grade security printing workflows
    """
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.printer_profiles = self._initialize_printer_profiles()
        self.substrate_profiles = self._initialize_substrate_profiles()
        self.ink_profiles = self._initialize_ink_profiles()
        
    def _initialize_printer_profiles(self) -> Dict[PrinterType, PrinterCapabilities]:
        """Initialize printer capability profiles based on real specifications"""
        return {
            # HP Indigo Series - Digital Security Printing
            PrinterType.HP_INDIGO_6K: PrinterCapabilities(
                printer_type=PrinterType.HP_INDIGO_6K,
                max_dpi=2400,
                min_dpi=600,
                color_gamut_pantone_coverage=97.0,
                substrate_compatibility=[
                    SubstrateType.SECURITY_PAPER_120GSM,
                    SubstrateType.SECURITY_PAPER_150GSM,
                    SubstrateType.SYNTHETIC_TESLIN
                ],
                ink_compatibility=[
                    InkType.STANDARD_PROCESS_BLACK,
                    InkType.SECURITY_INK_UV,
                    InkType.FLUORESCENT_INK
                ],
                security_features=[
                    "Variable Data Printing",
                    "Serialization",
                    "HP Indigo Secure",
                    "ElectroInk Security"
                ],
                registration_accuracy=25.0,  # 25 microns
                repeatability_tolerance=10.0,
                inline_quality_control=True,
                variable_data_capable=True
            ),
            
            PrinterType.HP_INDIGO_12K: PrinterCapabilities(
                printer_type=PrinterType.HP_INDIGO_12K,
                max_dpi=2400,
                min_dpi=600,
                color_gamut_pantone_coverage=97.0,
                substrate_compatibility=[
                    SubstrateType.SECURITY_PAPER_120GSM,
                    SubstrateType.SECURITY_PAPER_150GSM,
                    SubstrateType.SYNTHETIC_TESLIN,
                    SubstrateType.SYNTHETIC_POLYART,
                    SubstrateType.TYVEK_SECURITY
                ],
                ink_compatibility=[
                    InkType.STANDARD_PROCESS_BLACK,
                    InkType.SECURITY_INK_UV,
                    InkType.SECURITY_INK_IR,
                    InkType.FLUORESCENT_INK,
                    InkType.OVI_INK
                ],
                security_features=[
                    "Advanced Variable Data",
                    "Multi-layer Security",
                    "Invisible Inks",
                    "Track & Trace",
                    "Copy Detection Features"
                ],
                registration_accuracy=15.0,  # 15 microns
                repeatability_tolerance=5.0,
                inline_quality_control=True,
                variable_data_capable=True
            ),
            
            # Offset Printing - Traditional Security
            PrinterType.OFFSET_HEIDELBERG: PrinterCapabilities(
                printer_type=PrinterType.OFFSET_HEIDELBERG,
                max_dpi=3600,
                min_dpi=1200,
                color_gamut_pantone_coverage=95.0,
                substrate_compatibility=[
                    SubstrateType.SECURITY_PAPER_120GSM,
                    SubstrateType.SECURITY_PAPER_150GSM,
                    SubstrateType.SPECIALIZED_BANKNOTE
                ],
                ink_compatibility=[
                    InkType.STANDARD_PROCESS_BLACK,
                    InkType.SECURITY_INK_UV,
                    InkType.SECURITY_INK_IR,
                    InkType.MAGNETIC_INK_MICR,
                    InkType.OVI_INK
                ],
                security_features=[
                    "Micro-printing",
                    "Rainbow Printing",
                    "Security Thread Integration",
                    "Intaglio Printing Capable"
                ],
                registration_accuracy=10.0,  # 10 microns
                repeatability_tolerance=3.0,
                inline_quality_control=False,
                variable_data_capable=False
            )
        }
    
    def _initialize_substrate_profiles(self) -> Dict[SubstrateType, Dict]:
        """Initialize substrate specifications"""
        return {
            SubstrateType.SECURITY_PAPER_120GSM: {
                "weight": 120,
                "thickness_microns": 120,
                "opacity": 95.0,
                "whiteness": 92.0,
                "security_features": ["Watermark", "Security Fibers", "Chemical Protection"],
                "cdp_compatibility": "excellent",
                "dimensional_stability": "high"
            },
            SubstrateType.SECURITY_PAPER_150GSM: {
                "weight": 150,
                "thickness_microns": 150,
                "opacity": 97.0,
                "whiteness": 94.0,
                "security_features": ["Watermark", "Security Fibers", "Chemical Protection", "Security Thread"],
                "cdp_compatibility": "excellent",
                "dimensional_stability": "very_high"
            },
            SubstrateType.SYNTHETIC_TESLIN: {
                "weight": 100,
                "thickness_microns": 254,
                "opacity": 98.0,
                "whiteness": 96.0,
                "security_features": ["Tear Resistance", "Chemical Resistance", "Waterproof"],
                "cdp_compatibility": "good",
                "dimensional_stability": "excellent"
            }
        }
    
    def _initialize_ink_profiles(self) -> Dict[InkType, Dict]:
        """Initialize ink specifications"""
        return {
            InkType.STANDARD_PROCESS_BLACK: {
                "density_range": "1.8-2.0",
                "viscosity": "standard",
                "drying_time": "immediate",
                "security_level": "basic",
                "cdp_visibility": "high"
            },
            InkType.SECURITY_INK_UV: {
                "density_range": "1.9-2.1",
                "viscosity": "enhanced",
                "drying_time": "UV_cure",
                "security_level": "high",
                "cdp_visibility": "very_high",
                "special_properties": ["UV_fluorescent", "tamper_evident"]
            },
            InkType.OVI_INK: {
                "density_range": "2.0-2.2",
                "viscosity": "specialized",
                "drying_time": "controlled",
                "security_level": "maximum",
                "cdp_visibility": "extreme",
                "special_properties": ["color_changing", "viewing_angle_dependent"]
            }
        }
    
    def optimize_print_parameters(
        self, 
        qr_size_mm: float, 
        security_level: str,
        target_printer: PrinterType,
        substrate: SubstrateType,
        quantity: int = 1
    ) -> Dict[str, Any]:
        """
        Optimize printing parameters for specific requirements
        """
        printer_caps = self.printer_profiles[target_printer]
        substrate_specs = self.substrate_profiles[substrate]
        
        # Calculate optimal DPI based on QR size and printer capabilities
        if qr_size_mm <= 12:  # Zecca standard
            optimal_dpi = min(2400, printer_caps.max_dpi)  # High resolution for small QRs
        elif qr_size_mm <= 20:
            optimal_dpi = min(1200, printer_caps.max_dpi)
        else:
            optimal_dpi = min(600, printer_caps.max_dpi)
        
        # Ensure minimum capability
        optimal_dpi = max(optimal_dpi, printer_caps.min_dpi)
        
        # Select optimal ink based on security requirements
        if security_level == "maximum" and InkType.OVI_INK in printer_caps.ink_compatibility:
            recommended_ink = InkType.OVI_INK
        elif security_level in ["high", "standard"] and InkType.SECURITY_INK_UV in printer_caps.ink_compatibility:
            recommended_ink = InkType.SECURITY_INK_UV
        else:
            recommended_ink = InkType.STANDARD_PROCESS_BLACK
        
        # Calculate print area and substrate usage
        qr_area_cm2 = (qr_size_mm / 10) ** 2
        total_area_cm2 = qr_area_cm2 * quantity
        
        # Estimate production parameters
        setup_time_minutes = self._calculate_setup_time(target_printer, quantity)
        production_rate = self._calculate_production_rate(target_printer, qr_size_mm)
        total_production_time = setup_time_minutes + (quantity / production_rate)
        
        return {
            "optimized_parameters": {
                "dpi": optimal_dpi,
                "ink_type": recommended_ink.value,
                "substrate_type": substrate.value,
                "printer_type": target_printer.value
            },
            "quality_specifications": {
                "registration_accuracy_microns": printer_caps.registration_accuracy,
                "repeatability_tolerance_microns": printer_caps.repeatability_tolerance,
                "color_accuracy": "Delta E < 2.0",
                "density_target": self.ink_profiles[recommended_ink]["density_range"]
            },
            "production_estimates": {
                "setup_time_minutes": setup_time_minutes,
                "production_rate_per_hour": production_rate * 60,
                "total_production_time_minutes": total_production_time,
                "substrate_area_cm2": total_area_cm2
            },
            "quality_control": {
                "inline_inspection": printer_caps.inline_quality_control,
                "recommended_sampling": "100% for security applications",
                "verification_methods": self._get_verification_methods(security_level)
            }
        }
    
    def _calculate_setup_time(self, printer_type: PrinterType, quantity: int) -> float:
        """Calculate setup time based on printer type and job size"""
        base_setup_times = {
            PrinterType.HP_INDIGO_6K: 15,  # Digital = faster setup
            PrinterType.HP_INDIGO_12K: 12,
            PrinterType.OFFSET_HEIDELBERG: 45,  # Offset = longer setup
            PrinterType.OFFSET_KOMORI: 40
        }
        
        base_time = base_setup_times.get(printer_type, 30)
        
        # Adjust for quantity (larger runs = proportionally less setup per piece)
        if quantity > 1000:
            return base_time * 0.8
        elif quantity > 100:
            return base_time * 0.9
        else:
            return base_time
    
    def _calculate_production_rate(self, printer_type: PrinterType, qr_size_mm: float) -> float:
        """Calculate production rate (pieces per minute)"""
        base_rates = {
            PrinterType.HP_INDIGO_6K: 120,  # sheets per minute
            PrinterType.HP_INDIGO_12K: 160,
            PrinterType.OFFSET_HEIDELBERG: 200,  # Higher speed but setup-dependent
            PrinterType.OFFSET_KOMORI: 180
        }
        
        base_rate = base_rates.get(printer_type, 100)
        
        # Adjust for QR size (smaller = more per sheet = higher effective rate)
        if qr_size_mm <= 12:
            size_multiplier = 2.0  # Can fit more per sheet
        elif qr_size_mm <= 20:
            size_multiplier = 1.5
        else:
            size_multiplier = 1.0
        
        return base_rate * size_multiplier
    
    def _get_verification_methods(self, security_level: str) -> List[str]:
        """Get recommended verification methods based on security level"""
        base_methods = ["Visual Inspection", "Dimensional Check", "Color Verification"]
        
        if security_level in ["high", "maximum"]:
            base_methods.extend([
                "CDP Pattern Verification",
                "UV Light Inspection",
                "Microscopic Analysis",
                "Spectral Analysis"
            ])
        
        if security_level == "maximum":
            base_methods.extend([
                "OVI Angle Verification",
                "IR Inspection",
                "Digital Authentication"
            ])
        
        return base_methods
    
    def create_print_job(
        self,
        qr_id: str,
        size_mm: float,
        quantity: int,
        security_level: str = "high",
        target_printer: PrinterType = PrinterType.HP_INDIGO_12K,
        substrate: SubstrateType = SubstrateType.SECURITY_PAPER_150GSM
    ) -> PrintJob:
        """Create a comprehensive print job"""
        
        job_id = f"ZECCA_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{qr_id}"
        
        # Get optimized parameters
        optimization = self.optimize_print_parameters(
            qr_size_mm=size_mm,
            security_level=security_level,
            target_printer=target_printer,
            substrate=substrate,
            quantity=quantity
        )
        
        # Determine ink type from optimization
        ink_type = InkType(optimization["optimized_parameters"]["ink_type"])
        
        print_job = PrintJob(
            job_id=job_id,
            qr_id=qr_id,
            printer_type=target_printer,
            substrate_type=substrate,
            ink_type=ink_type,
            size_mm=size_mm,
            quantity=quantity,
            dpi=optimization["optimized_parameters"]["dpi"],
            security_requirements=optimization["quality_control"]["verification_methods"],
            quality_control_level=security_level,
            created_at=datetime.now(),
            status="ready_for_production"
        )
        
        self.logger.info(f"Created print job {job_id} for QR {qr_id}")
        self.logger.info(f"Specifications: {size_mm}mm, {quantity} units, {target_printer.value}")
        
        return print_job
    
    def generate_production_instructions(self, print_job: PrintJob) -> Dict[str, Any]:
        """Generate detailed production instructions for Zecca operators"""
        
        printer_caps = self.printer_profiles[print_job.printer_type]
        substrate_specs = self.substrate_profiles[print_job.substrate_type]
        ink_specs = self.ink_profiles[print_job.ink_type]
        
        instructions = {
            "job_header": {
                "job_id": print_job.job_id,
                "qr_id": print_job.qr_id,
                "facility": "Zecca dello Stato",
                "security_classification": "RESTRICTED",
                "operator_clearance_required": "Level 3 Security Printing",
                "created": print_job.created_at.isoformat()
            },
            
            "machine_setup": {
                "printer": {
                    "model": print_job.printer_type.value,
                    "resolution_dpi": print_job.dpi,
                    "color_profile": "Security_Profile_ZECCA_v2.icc",
                    "calibration_required": True,
                    "registration_target": f"±{printer_caps.registration_accuracy}μm"
                },
                "substrate": {
                    "type": print_job.substrate_type.value,
                    "specifications": substrate_specs,
                    "handling_instructions": "White gloves required, climate controlled storage",
                    "pre_conditioning": "24h at 50% RH, 23°C"
                },
                "ink": {
                    "type": print_job.ink_type.value,
                    "specifications": ink_specs,
                    "mixing_instructions": "Use certified scales, ±0.1g accuracy",
                    "storage_temperature": "18-25°C"
                }
            },
            
            "production_parameters": {
                "quantity": print_job.quantity,
                "qr_size_mm": print_job.size_mm,
                "sheets_per_unit": self._calculate_sheets_per_qr(print_job.size_mm),
                "waste_allowance": "5% minimum for security printing",
                "production_speed": "Quality over speed - max 80% of rated capacity"
            },
            
            "quality_control": {
                "pre_production_checks": [
                    "Calibration verification",
                    "Color standard verification", 
                    "Registration accuracy test",
                    "Substrate inspection",
                    "Security feature verification"
                ],
                "in_process_monitoring": [
                    "Every 50th sheet visual inspection",
                    "Continuous density monitoring",
                    "CDP pattern integrity check",
                    "Dimensional verification"
                ],
                "final_inspection": [
                    "100% visual inspection",
                    "Random CDP authentication tests",
                    "Security feature verification",
                    "Packaging inspection"
                ]
            },
            
            "security_protocols": {
                "material_handling": "Secure chain of custody required",
                "waste_management": "All waste to be shredded and incinerated",
                "documentation": "Complete audit trail mandatory",
                "personnel_requirements": "Minimum 2 operators, both Level 3 cleared"
            }
        }
        
        return instructions
    
    def _calculate_sheets_per_qr(self, qr_size_mm: float) -> int:
        """Calculate how many QR codes fit per sheet"""
        # Assuming standard sheet size with margins
        sheet_width_mm = 320  # SRA3 width minus margins
        sheet_height_mm = 450  # SRA3 height minus margins
        
        qrs_per_width = int(sheet_width_mm // (qr_size_mm + 5))  # 5mm spacing
        qrs_per_height = int(sheet_height_mm // (qr_size_mm + 5))
        
        return max(1, qrs_per_width * qrs_per_height)

# Integration functions for Flask application
def create_zecca_print_manager():
    """Factory function to create printing manager"""
    return ZeccaPrintingManager()

def optimize_for_zecca_printing(
    qr_size_mm: float = 12.0,
    quantity: int = 1000,
    security_level: str = "high"
) -> Dict[str, Any]:
    """
    Optimize printing parameters specifically for Zecca dello Stato
    """
    manager = create_zecca_print_manager()
    
    # Zecca typically uses HP Indigo for security applications
    return manager.optimize_print_parameters(
        qr_size_mm=qr_size_mm,
        security_level=security_level,
        target_printer=PrinterType.HP_INDIGO_12K,  # Zecca standard
        substrate=SubstrateType.SECURITY_PAPER_150GSM,
        quantity=quantity
    )

def generate_zecca_production_workflow(
    qr_id: str,
    size_mm: float = 12.0,
    quantity: int = 1000
) -> Dict[str, Any]:
    """
    Generate complete production workflow for Zecca
    """
    manager = create_zecca_print_manager()
    
    # Create print job
    print_job = manager.create_print_job(
        qr_id=qr_id,
        size_mm=size_mm,
        quantity=quantity,
        security_level="high",
        target_printer=PrinterType.HP_INDIGO_12K,
        substrate=SubstrateType.SECURITY_PAPER_150GSM
    )
    
    # Generate production instructions
    production_instructions = manager.generate_production_instructions(print_job)
    
    return {
        "print_job": {
            "job_id": print_job.job_id,
            "qr_id": print_job.qr_id,
            "specifications": {
                "size_mm": print_job.size_mm,
                "quantity": print_job.quantity,
                "dpi": print_job.dpi,
                "printer": print_job.printer_type.value,
                "substrate": print_job.substrate_type.value,
                "ink": print_job.ink_type.value
            }
        },
        "production_instructions": production_instructions,
        "estimated_timeline": {
            "setup_time": "45-60 minutes",
            "production_time": f"{quantity // 100} hours",
            "quality_control": "30 minutes",
            "total_time": f"{2 + (quantity // 100)} hours"
        }
    }