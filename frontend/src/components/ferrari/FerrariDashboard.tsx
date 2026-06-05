// src/components/ferrari/FerrariDashboard.tsx
import React, { useState, useEffect } from "react";
import { Shield, GitBranch, Award, Crown, Plus, Eye } from "lucide-react";
import FerrariQRGenerator from "./FerrariQRGenerator";
import FerrariGenealogy from "./FerrariGenealogy";
import "./FerrariTheme.css";
import {
  FerrariQR,
  FamilyNode,
  ContrassegnoCertificate,
} from "../../types/qr-types";

const FerrariDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generate" | "mint" | "genealogy">(
    "generate",
  );
  const [selectedMotherQR, setSelectedMotherQR] = useState<FerrariQR | null>(
    null,
  );
  const [motherQRs, setMotherQRs] = useState<FerrariQR[]>([]);
  const [stats, setStats] = useState({
    total_mothers: 0,
    total_children: 0,
    total_generations: 0,
  });

  useEffect(() => {
    fetchFerrariStats();
    // In real app, fetch user's Ferrari QRs
  }, []);

  const fetchFerrariStats = async () => {
    try {
      const response = await fetch("/api/ferrari/dashboard-stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching Ferrari stats:", error);
    }
  };

  const handleMintChild = async (motherId: string, purpose: string) => {
    try {
      const response = await fetch(`/api/ferrari/mint-child/${motherId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });

      const childQR = await response.json();
      alert(
        `Child QR minted successfully! Generation: ${childQR.ferrari_metadata.generation}`,
      );

      // Refresh data
      fetchFerrariStats();
    } catch (error) {
      console.error("Error minting child:", error);
    }
  };

  return (
    <div className="ferrari-dashboard min-h-screen">
      {/* Header */}
      <div className="ferrari-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-10 w-10 text-ferrari-gold mr-3" />
              <h1 className="text-3xl font-bold text-white">
                Ferrari Authentication System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-ferrari-gold text-sm">Powered by</p>
                <p className="text-white font-semibold">Zecca QR Genealogy™</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-black/90 border-b border-ferrari-gold/30">
        <div className="container mx-auto px-6 py-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-ferrari-gold text-2xl font-bold">
                {stats.total_mothers}
              </p>
              <p className="text-gray-400 text-sm">Mother QRs</p>
            </div>
            <div className="text-center">
              <p className="text-ferrari-gold text-2xl font-bold">
                {stats.total_children}
              </p>
              <p className="text-gray-400 text-sm">Child QRs Minted</p>
            </div>
            <div className="text-center">
              <p className="text-ferrari-gold text-2xl font-bold">
                {stats.total_generations}
              </p>
              <p className="text-gray-400 text-sm">Max Generations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "generate"
                  ? "border-ferrari-gold text-ferrari-gold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Generate Mother QR
              </div>
            </button>

            <button
              onClick={() => setActiveTab("mint")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "mint"
                  ? "border-ferrari-gold text-ferrari-gold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <GitBranch className="h-5 w-5 mr-2" />
                Mint Child QR
              </div>
            </button>

            <button
              onClick={() => setActiveTab("genealogy")}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === "genealogy"
                  ? "border-ferrari-gold text-ferrari-gold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                View Genealogy
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === "generate" && (
          <div className="max-w-2xl mx-auto">
            <FerrariQRGenerator
              onGenerated={(qr) => {
                setMotherQRs([...motherQRs, qr]);
                setActiveTab("mint");
              }}
            />
          </div>
        )}

        {activeTab === "mint" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                Mint Child QR
              </h2>

              {motherQRs.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No Mother QRs available</p>
                  <button
                    onClick={() => setActiveTab("generate")}
                    className="mt-4 bg-ferrari-gold text-black px-6 py-2 rounded-md hover:bg-yellow-500"
                  >
                    Generate Mother QR First
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* Mother QR Selection */}
                  <div>
                    <h3 className="text-ferrari-gold mb-4">Select Mother QR</h3>
                    <div className="space-y-3">
                      {motherQRs.map((qr) => (
                        <div
                          key={qr.qr_id}
                          onClick={() => setSelectedMotherQR(qr)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedMotherQR?.qr_id === qr.qr_id
                              ? "border-ferrari-gold bg-ferrari-gold/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">
                                {qr.ferrari_metadata?.product_data?.model ||
                                  "Ferrari SF90"}
                              </p>
                              <p className="text-gray-400 text-sm">
                                VIN:{" "}
                                {qr.ferrari_metadata?.product_data?.vin ||
                                  "XXX-XXX"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-ferrari-gold">
                                {qr.children.length}/10
                              </p>
                              <p className="text-gray-400 text-xs">Children</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Minting Options */}
                  <div>
                    <h3 className="text-ferrari-gold mb-4">Minting Purpose</h3>
                    {selectedMotherQR ? (
                      <div className="space-y-3">
                        {[
                          "Dealer Authentication",
                          "Customer Purchase",
                          "Service Check",
                          "Ownership Transfer",
                        ].map((purpose) => (
                          <button
                            key={purpose}
                            onClick={() =>
                              handleMintChild(selectedMotherQR.qr_id, purpose)
                            }
                            className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-all"
                          >
                            <p className="text-white font-medium">{purpose}</p>
                            <p className="text-gray-400 text-sm">
                              Generate a child QR for {purpose.toLowerCase()}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">Select a Mother QR first</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "genealogy" && (
          <div className="max-w-6xl mx-auto">
            <FerrariGenealogy qrId={selectedMotherQR?.qr_id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FerrariDashboard;
