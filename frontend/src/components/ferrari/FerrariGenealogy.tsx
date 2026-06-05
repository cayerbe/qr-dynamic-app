// src/components/ferrari/FerrariGenealogy.tsx
import React, { useState, useEffect } from "react";
import { GitBranch, Crown, Shield, Award, Download } from "lucide-react";
import { FamilyNode, FerrariQR } from "../../types/qr-types";
import ContrassegnoCertificate from "./ContrassegnoCertificate";

interface FerrariGenealogyProps {
  qrId?: string;
}

const FerrariGenealogy: React.FC<FerrariGenealogyProps> = ({ qrId }) => {
  const [familyTree, setFamilyTree] = useState<FamilyNode | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (qrId) {
      fetchFamilyTree(qrId);
    }
  }, [qrId]);

  const fetchFamilyTree = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ferrari/family-tree/${id}`);
      const tree = await response.json();
      setFamilyTree(tree);
      setSelectedQR(id);
    } catch (error) {
      console.error("Error fetching family tree:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchId) {
      fetchFamilyTree(searchId);
    }
  };

  const getGenerationColor = (generation: number) => {
    const colors = [
      "bg-ferrari-gold",
      "bg-yellow-600",
      "bg-yellow-700",
      "bg-yellow-800",
    ];
    return colors[generation] || "bg-gray-600";
  };

  const renderQRNode = (
    nodeId: string,
    generation: number,
    type: "mother" | "child",
  ) => {
    const isSelected = selectedQR === nodeId;

    return (
      <div
        key={nodeId}
        onClick={() => fetchFamilyTree(nodeId)}
        className={`cursor-pointer transition-all ${
          isSelected ? "scale-110" : "hover:scale-105"
        }`}
      >
        <div
          className={`relative p-4 rounded-lg border-2 ${
            isSelected ? "border-ferrari-gold" : "border-gray-600"
          } ${getGenerationColor(generation)}`}
        >
          {type === "mother" ? (
            <Crown className="h-8 w-8 text-black mx-auto" />
          ) : (
            <Shield className="h-8 w-8 text-black mx-auto" />
          )}
          <p className="text-black text-xs mt-2 font-medium">
            Gen {generation}
          </p>
          <p className="text-black text-xs font-mono">...{nodeId.slice(-6)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <GitBranch className="h-8 w-8 text-ferrari-gold mr-3" />
          <h2 className="text-2xl font-bold text-white">QR Genealogy Tree</h2>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter QR ID"
            className="bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white text-sm focus:border-ferrari-gold focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-ferrari-gold text-black px-4 py-2 rounded-md hover:bg-yellow-500"
          >
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ferrari-gold mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading genealogy...</p>
        </div>
      ) : familyTree ? (
        <div>
          {/* Current QR Info */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <h3 className="text-ferrari-gold font-medium mb-4">
              Selected QR Details
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">QR ID</p>
                <p className="text-white font-mono">{familyTree.qr_id}</p>
              </div>
              <div>
                <p className="text-gray-400">Type</p>
                <p className="text-white capitalize">{familyTree.type}</p>
              </div>
              <div>
                <p className="text-gray-400">Generation</p>
                <p className="text-white">{familyTree.generation}</p>
              </div>
            </div>
          </div>

          {/* Visual Tree */}
          <div className="space-y-8">
            {/* Parent */}
            {familyTree.parent && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Parent</p>
                <div className="flex justify-center">
                  {renderQRNode(
                    familyTree.parent.qr_id,
                    familyTree.parent.generation,
                    familyTree.parent.generation === 0 ? "mother" : "child",
                  )}
                </div>
                <div className="flex justify-center mt-2">
                  <div className="w-0.5 h-8 bg-gray-600"></div>
                </div>
              </div>
            )}

            {/* Current Node & Siblings */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Current Generation</p>
              <div className="flex justify-center space-x-4">
                {/* Siblings */}
                {familyTree.siblings.map((siblingId) => (
                  <div key={siblingId} className="opacity-50">
                    {renderQRNode(siblingId, familyTree.generation, "child")}
                  </div>
                ))}

                {/* Current */}
                {renderQRNode(
                  familyTree.qr_id,
                  familyTree.generation,
                  familyTree.type,
                )}
              </div>
            </div>

            {/* Children */}
            {familyTree.children.length > 0 && (
              <div>
                <div className="flex justify-center mb-2">
                  <div className="w-0.5 h-8 bg-gray-600"></div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Children</p>
                <div className="flex justify-center space-x-4 flex-wrap">
                  {familyTree.children.map((childId) =>
                    renderQRNode(childId, familyTree.generation + 1, "child"),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center space-x-4">
            <button className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Genealogy
            </button>
            <button
              onClick={() => setShowCertificate(true)}
              className="bg-ferrari-gold text-black px-6 py-2 rounded-md hover:bg-yellow-500 flex items-center"
            >
              <Award className="h-4 w-4 mr-2" />
              Request Contrassegno
            </button>
          </div>

          {/* Certificate Modal */}
          {showCertificate && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <button
                    onClick={() => setShowCertificate(false)}
                    className="float-right text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                  <ContrassegnoCertificate
                    qrId={selectedQR!}
                    familyTree={familyTree}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <GitBranch className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {qrId
              ? "No genealogy data found"
              : "Select a QR to view its genealogy"}
          </p>
        </div>
      )}
    </div>
  );
};

export default FerrariGenealogy;
