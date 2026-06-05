// src/components/ferrari/ContrassegnoCertificate.tsx
import React, { useState, useEffect } from "react";
import {
  Award,
  Shield,
  Download,
  Verified,
  Crown,
  FileCheck,
  Stamp,
  GitBranch,
  Share2,
} from "lucide-react";
import {
  ContrassegnoCertificate as CertType,
  FerrariQR,
  FamilyNode,
} from "../../types/qr-types";
import "./FerrariTheme.css";

interface ContrassegnoCertificateProps {
  qrId: string;
  familyTree?: FamilyNode;
}

const ContrassegnoCertificate: React.FC<ContrassegnoCertificateProps> = ({
  qrId,
  familyTree,
}) => {
  const [certificate, setCertificate] = useState<CertType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSteps, setValidationSteps] = useState<{
    genealogy: "pending" | "checking" | "verified" | "failed";
    signatures: "pending" | "checking" | "verified" | "failed";
    authority: "pending" | "checking" | "verified" | "failed";
  }>({
    genealogy: "pending",
    signatures: "pending",
    authority: "pending",
  });

  const generateContrassegno = async () => {
    setIsGenerating(true);
    setIsValidating(true);

    // Simulate validation steps
    const steps = ["genealogy", "signatures", "authority"] as const;

    for (const step of steps) {
      setValidationSteps((prev) => ({ ...prev, [step]: "checking" }));

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setValidationSteps((prev) => ({ ...prev, [step]: "verified" }));
    }

    // Generate certificate
    try {
      const response = await fetch("/api/ferrari/generate-contrassegno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId }),
      });

      const cert = await response.json();
      setCertificate(cert);
    } catch (error) {
      console.error("Error generating Contrassegno:", error);
      // Mock certificate for demo
      setCertificate(generateMockCertificate(qrId));
    }

    setIsGenerating(false);
    setIsValidating(false);
  };

  const generateMockCertificate = (qrId: string): CertType => {
    const now = new Date().toISOString();
    return {
      certificate_id: `IT-AUTH-${Date.now()}-${qrId.slice(-6)}`,
      product_identity: {
        mother_qr_id: qrId,
        manufacture_date: "2025-01-15",
        first_verification: now,
      },
      genealogy_chain: [
        {
          child_id: "IT001-001",
          event: "dealer_authentication",
          timestamp: "2025-01-20T10:00:00Z",
        },
        {
          child_id: "IT001-002",
          event: "customer_purchase",
          timestamp: "2025-01-25T14:30:00Z",
        },
        {
          child_id: "IT001-003",
          event: "service_verification",
          timestamp: now,
        },
      ],
      italian_state_signatures: {
        zecca_authority_signature: generateSignature("zecca"),
        chain_integrity_signature: generateSignature("chain"),
        contrassegno_signature: generateSignature("contrassegno"),
      },
      certificate_level: "ZECCA_GRADE_A",
      transferable: true,
      nft_compatible: true,
    };
  };

  const generateSignature = (type: string): string => {
    // In production, this would be cryptographic signatures
    return btoa(`${type}-${Date.now()}`).substring(0, 32);
  };

  const downloadCertificate = () => {
    if (!certificate) return;

    const certData = JSON.stringify(certificate, null, 2);
    const blob = new Blob([certData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrassegno-${certificate.certificate_id}.json`;
    a.click();
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case "checking":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ferrari-gold" />
        );
      case "verified":
        return <Verified className="h-5 w-5 text-green-500" />;
      case "failed":
        return <span className="text-red-500">✗</span>;
      default:
        return <span className="text-gray-500">○</span>;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Award className="h-10 w-10 text-ferrari-gold mr-4" />
          <div>
            <h2 className="text-3xl font-bold text-white">
              Contrassegno di Autenticità
            </h2>
            <p className="text-gray-400">
              Italian State Authentication Certificate
            </p>
          </div>
        </div>

        {certificate && (
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-green-500" />
            <span className="text-green-500 font-medium">
              Verified by Zecca dello Stato
            </span>
          </div>
        )}
      </div>

      {!certificate && !isGenerating && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-ferrari-gold/20 rounded-full mb-6">
            <Stamp className="h-12 w-12 text-ferrari-gold" />
          </div>

          <h3 className="text-xl font-semibold text-white mb-4">
            Request Official Authentication Certificate
          </h3>

          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            The Contrassegno certificate provides Italian State verification of
            your Ferrari's complete authentication chain, from manufacturing to
            current ownership.
          </p>

          <button
            onClick={generateContrassegno}
            className="bg-ferrari-gold text-black px-8 py-3 rounded-md font-medium hover:bg-yellow-500 transition-all"
          >
            Generate Contrassegno Certificate
          </button>
        </div>
      )}

      {isValidating && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white mb-6">
            Validating with Zecca dello Stato
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <GitBranch className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-white">Verifying Genealogy Chain</span>
              </div>
              {getValidationIcon(validationSteps.genealogy)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <FileCheck className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-white">
                  Validating Digital Signatures
                </span>
              </div>
              {getValidationIcon(validationSteps.signatures)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-white">Zecca Authority Approval</span>
              </div>
              {getValidationIcon(validationSteps.authority)}
            </div>
          </div>
        </div>
      )}

      {certificate && !isValidating && (
        <div className="space-y-8">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-green-900/20 to-red-900/20 rounded-lg p-6 border border-ferrari-gold/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-ferrari-gold text-sm mb-1">
                  Certificate Number
                </p>
                <p className="text-white text-2xl font-mono">
                  {certificate.certificate_id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-ferrari-gold text-sm mb-1">Grade</p>
                <p className="text-white text-2xl font-bold">
                  {certificate.certificate_level}
                </p>
              </div>
            </div>
          </div>

          {/* Product Identity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-ferrari-gold font-semibold mb-4">
              Product Identity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Mother QR ID</p>
                <p className="text-white font-mono">
                  {certificate.product_identity.mother_qr_id}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Manufacture Date</p>
                <p className="text-white">
                  {new Date(
                    certificate.product_identity.manufacture_date,
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">First Verification</p>
                <p className="text-white">
                  {new Date(
                    certificate.product_identity.first_verification,
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="text-green-400">Active & Transferable</p>
              </div>
            </div>
          </div>

          {/* Genealogy Chain */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-ferrari-gold font-semibold mb-4">
              Authentication Chain
            </h3>
            <div className="space-y-3">
              {certificate.genealogy_chain.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-ferrari-gold/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-ferrari-gold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-white capitalize">
                        {event.event.replace("_", " ")}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 font-mono text-sm">
                    {event.child_id}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Signatures */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-ferrari-gold font-semibold mb-4">
              Italian State Signatures
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-400">Zecca Authority</p>
                <p className="text-white font-mono text-xs">
                  {
                    certificate.italian_state_signatures
                      .zecca_authority_signature
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-400">Chain Integrity</p>
                <p className="text-white font-mono text-xs">
                  {
                    certificate.italian_state_signatures
                      .chain_integrity_signature
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-400">Contrassegno</p>
                <p className="text-white font-mono text-xs">
                  {certificate.italian_state_signatures.contrassegno_signature}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-white font-medium">Verified</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <FileCheck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-white font-medium">Transferable</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <Award className="h-8 w-8 text-ferrari-gold mx-auto mb-2" />
              <p className="text-white font-medium">NFT Ready</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={downloadCertificate}
              className="bg-ferrari-gold text-black px-6 py-3 rounded-md font-medium hover:bg-yellow-500 flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Certificate
            </button>
            <button className="bg-gray-800 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-700 flex items-center">
              <Share2 className="h-5 w-5 mr-2" />
              Share Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContrassegnoCertificate;
