// src/components/ferrari/FerrariQRGenerator.tsx
import React, { useState } from "react";
import { Crown, Shield, Upload, CheckCircle } from "lucide-react";
import { FerrariQR } from "../../types/qr-types";

interface FerrariQRGeneratorProps {
  onGenerated: (qr: FerrariQR) => void; // Now it knows what FerrariQR is!
}

const FerrariQRGenerator: React.FC<FerrariQRGeneratorProps> = ({
  onGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    model: "SF90 Stradale",
    vin: "",
    year: "2025",
    color: "Rosso Corsa",
    engine_number: "",
    authentication_url: "",
  });
  const [generatedQR, setGeneratedQR] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Generate authentication URL if not provided
      const authUrl =
        formData.authentication_url ||
        `https://ferrari.com/authenticate/${formData.vin || "DEMO123"}`;

      const response = await fetch("/api/ferrari/generate-mother", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: authUrl,
          model: formData.model,
          vin: formData.vin,
          year: formData.year,
          color: formData.color,
          engine_number: formData.engine_number,
        }),
      });

      const result = await response.json();
      setGeneratedQR(result);

      // Notify parent component
      onGenerated(result);
    } catch (error) {
      console.error("Error generating Ferrari QR:", error);
      alert("Failed to generate QR");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
      <div className="flex items-center mb-6">
        <Crown className="h-8 w-8 text-ferrari-gold mr-3" />
        <h2 className="text-2xl font-bold text-white">Generate Mother QR</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Create a Mother QR for a Ferrari vehicle. This QR will be physically
        attached to the car and can mint up to 10 child QRs for authentication
        purposes.
      </p>

      <div className="space-y-6">
        {/* Ferrari Model */}
        <div>
          <label className="block text-ferrari-gold text-sm font-medium mb-2">
            Ferrari Model
          </label>
          <select
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:border-ferrari-gold focus:outline-none"
          >
            <option>SF90 Stradale</option>
            <option>F8 Tributo</option>
            <option>Roma</option>
            <option>812 Superfast</option>
            <option>Portofino M</option>
            <option>296 GTB</option>
          </select>
        </div>

        {/* VIN */}
        <div>
          <label className="block text-ferrari-gold text-sm font-medium mb-2">
            Vehicle Identification Number (VIN)
          </label>
          <input
            type="text"
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
            placeholder="ZFF79ALA6K0123456"
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:border-ferrari-gold focus:outline-none"
          />
        </div>

        {/* Year & Color */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-ferrari-gold text-sm font-medium mb-2">
              Year
            </label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:border-ferrari-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-ferrari-gold text-sm font-medium mb-2">
              Color
            </label>
            <select
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:border-ferrari-gold focus:outline-none"
            >
              <option>Rosso Corsa</option>
              <option>Giallo Modena</option>
              <option>Blu Tour de France</option>
              <option>Nero</option>
              <option>Bianco Avus</option>
            </select>
          </div>
        </div>

        {/* Engine Number */}
        <div>
          <label className="block text-ferrari-gold text-sm font-medium mb-2">
            Engine Number (Optional)
          </label>
          <input
            type="text"
            value={formData.engine_number}
            onChange={(e) =>
              setFormData({ ...formData, engine_number: e.target.value })
            }
            placeholder="F154CD-12345"
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:border-ferrari-gold focus:outline-none"
          />
        </div>

        {/* Security Features Display */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-ferrari-gold font-medium mb-3">
            Security Features
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              CDP Anti-Photocopy Protection
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              Size-Adaptive Pattern (25mm Premium)
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              6-Layer Security Verification
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              Zecca Genealogy Enabled
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !formData.vin}
          className={`w-full py-3 rounded-md font-medium transition-all ${
            isGenerating || !formData.vin
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-ferrari-gold text-black hover:bg-yellow-500"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Generating Secure QR...
            </span>
          ) : (
            "Generate Mother QR"
          )}
        </button>
      </div>

      {/* Generated QR Display */}
      {generatedQR && (
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-ferrari-gold">
          <h3 className="text-ferrari-gold font-medium mb-4">
            Mother QR Generated!
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <img
                src={generatedQR.qr_image_url}
                alt="Ferrari QR Code"
                className="w-full rounded-lg bg-white p-4"
              />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">QR ID</p>
                <p className="text-white font-mono">{generatedQR.qr_id}</p>
              </div>
              <div>
                <p className="text-gray-400">Security Level</p>
                <p className="text-ferrari-gold">
                  {generatedQR.security_level || "Premium"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Can Mint</p>
                <p className="text-white">10 Child QRs</p>
              </div>
              <div>
                <p className="text-gray-400">Generation</p>
                <p className="text-white">0 (Mother)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FerrariQRGenerator;
