// src/components/public/PublicQRVerification.tsx
// REPLACE ENTIRE CONTENT with alert page functionality

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Shield,
  XCircle,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

const PublicQRVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const qrId = searchParams.get("qr_id");
  const riskScore = searchParams.get("risk") || "0";
  const [countdown, setCountdown] = useState(10);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getRiskLevel = (score: string) => {
    const numScore = parseInt(score);
    if (numScore > 80)
      return { level: "CRITICAL", color: "red", bgColor: "bg-red-50" };
    if (numScore > 60)
      return { level: "HIGH", color: "orange", bgColor: "bg-orange-50" };
    return { level: "MEDIUM", color: "yellow", bgColor: "bg-yellow-50" };
  };

  const getModelSpecificMessage = (qrData: any) => {
    const modelType = qrData?.metadata?.model_type;

    if (modelType === "fintech") {
      return "This payment QR has already been used and cannot be scanned again.";
    } else if (modelType === "luxury") {
      return `This luxury item has reached its maximum verification limit of ${qrData?.metadata?.scan_limit} scans.`;
    }
    return "This QR code has been blocked for security reasons.";
  };

  const risk = getRiskLevel(riskScore);

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-2xl mx-auto p-6">
        {/* Main Alert Card */}
        <div
          className={`${risk.bgColor} border-2 border-${risk.color}-300 rounded-lg p-8 text-center shadow-lg`}
        >
          {/* Alert Icon */}
          <div className="flex justify-center mb-6">
            <div className={`bg-${risk.color}-100 p-4 rounded-full`}>
              <AlertTriangle className={`h-16 w-16 text-${risk.color}-600`} />
            </div>
          </div>

          {/* Alert Title */}
          <h1 className={`text-3xl font-bold text-${risk.color}-800 mb-4`}>
            ⚠️ SUSPICIOUS QR CODE DETECTED
          </h1>

          {/* Risk Level Badge */}
          <div className="mb-6">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-${risk.color}-200 text-${risk.color}-800`}
            >
              RISK LEVEL: {risk.level} ({riskScore}%)
            </span>
          </div>

          {/* Warning Message */}
          <div
            className={`bg-white border border-${risk.color}-200 rounded-lg p-6 mb-6 text-left`}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Security Alert
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                {getModelSpecificMessage({
                  metadata: { model_type: "fintech", scan_limit: 10 },
                })}
              </p>
            </div>
          </div>

          {/* QR ID Information */}
          {qrId && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">QR Code ID:</p>
              <p className="font-mono text-sm text-gray-800 break-all">
                {qrId}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => window.history.back()}
              className={`w-full bg-${risk.color}-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-${risk.color}-700 transition-colors`}
            >
              ← Go Back Safely
            </button>

            <button
              onClick={() => window.close()}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-blue-600" />
            Need Help?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              Report this incident:{" "}
              <a
                href="mailto:security@company.com"
                className="text-blue-600 hover:underline ml-1"
              >
                security@company.com
              </a>
            </p>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              Customer Support:{" "}
              <a
                href="tel:+1234567890"
                className="text-blue-600 hover:underline ml-1"
              >
                +1 (234) 567-890
              </a>
            </p>
            <p className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-gray-400" />
              Official Website:{" "}
              <a
                href="https://www.company.com"
                className="text-blue-600 hover:underline ml-1"
              >
                www.company.com
              </a>
            </p>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            🛡️ Security Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Always verify QR codes from trusted sources</li>
            <li>• Be cautious of QR codes on unofficial materials</li>
            <li>• Check the destination URL before proceeding</li>
            <li>• Report suspicious QR codes to authorities</li>
            <li>• When in doubt, visit the official website directly</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Protected by Anti-Forgery CDP Technology™</p>
          <p>Security Alert Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicQRVerification;
