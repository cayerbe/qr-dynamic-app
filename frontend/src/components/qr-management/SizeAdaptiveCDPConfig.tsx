import React from "react";
import { Ruler, Maximize, Printer, FileType } from "lucide-react";

interface SizeAdaptiveCDPConfigProps {
  config: {
    size_mm: number;
    cdp_density: "low" | "medium" | "high" | "ultra";
    print_profile: string;
    substrate_type: string;
  };
  onChange: (newConfig: any) => void;
}

const SizeAdaptiveCDPConfig: React.FC<SizeAdaptiveCDPConfigProps> = ({
  config,
  onChange,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">
        Size-Adaptive CDP Configuration
      </h3>

      <div className="space-y-4">
        {/* QR Size in mm */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Ruler className="h-5 w-5 mr-2" />
            QR Code Size (mm)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={config.size_mm}
              onChange={(e) =>
                handleChange("size_mm", parseFloat(e.target.value))
              }
              className="w-full mr-3"
            />
            <span className="text-gray-700 font-medium">
              {config.size_mm} mm
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Recommended size: 10mm (micro), 12-25mm (standard), 30-50mm (large)
          </p>
        </div>

        {/* CDP Density */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Maximize className="h-5 w-5 mr-2" />
            CDP Density
          </label>
          <select
            value={config.cdp_density}
            onChange={(e) => handleChange("cdp_density", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low (Basic Protection)</option>
            <option value="medium">Medium (Standard Protection)</option>
            <option value="high">High (Enhanced Protection)</option>
            <option value="ultra">Ultra (Maximum Protection)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Higher density provides better security but may reduce compatibility
          </p>
        </div>

        {/* Print Profile */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Printer className="h-5 w-5 mr-2" />
            Print Profile
          </label>
          <select
            value={config.print_profile}
            onChange={(e) => handleChange("print_profile", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="offset_industrial">Offset Industrial</option>
            <option value="digital_press">Digital Press</option>
            <option value="large_format">Large Format</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select the printing technology that will be used
          </p>
        </div>

        {/* Substrate Type */}
        <div className="mb-4">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileType className="h-5 w-5 mr-2" />
            Substrate Type
          </label>
          <select
            value={config.substrate_type}
            onChange={(e) => handleChange("substrate_type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="security_paper">Security Paper</option>
            <option value="standard_paper">Standard Paper</option>
            <option value="synthetic_paper">Synthetic Paper</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The type of material the QR code will be printed on
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeAdaptiveCDPConfig;
