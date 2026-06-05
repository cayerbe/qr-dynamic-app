import React, { useState, useEffect, ChangeEvent } from "react";
import { Shield, AlertTriangle, CheckCircle, UploadCloud } from "lucide-react";
import qrApiService from "../../services/qrApiService";

const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
);

interface CDPVisualizationProps {
  qrId?: string;
}

const CDPVisualization: React.FC<CDPVisualizationProps> = ({ qrId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cdpData, setCdpData] = useState<{
    original_pattern_url: string;
  } | null>(null);
  const [verificationData, setVerificationData] = useState<{
    match_percentage: number;
    is_authentic: boolean;
    scanned_image_url?: string;
    original_pattern_url?: string;
    forgery_risk_score?: number;
  } | null>(null);

  useEffect(() => {
    if (!qrId) {
      setError("No QR ID provided for CDP visualization");
      return;
    }

    const loadCdpInfo = async () => {
      try {
        setLoading(true);
        const data = await qrApiService.getCdpInfo(qrId);
        setCdpData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load CDP pattern info", err);
        setError("Failed to load CDP pattern info.");
      } finally {
        setLoading(false);
      }
    };

    loadCdpInfo();
  }, [qrId]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !qrId) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await qrApiService.verifyForgery(qrId, formData);
      setVerificationData(response);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify scanned QR.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setVerificationData(null);
    setError(null);
  };

  if (!qrId) {
    return (
      <div className="bg-white p-6 rounded shadow text-center">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
        <p className="text-red-600">QR ID is missing</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow text-center">
        <Spinner />
        <p className="mt-2 text-gray-500">Processing scan...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Shield className="mr-2 h-5 w-5 text-blue-600" />
        CDP Forgery Protection
      </h3>

      {verificationData ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-500">Security Status</span>
              <div className="flex items-center mt-1">
                {verificationData.is_authentic ? (
                  <>
                    <CheckCircle className="text-green-600 mr-2" />
                    <span className="text-green-700 font-medium">
                      Authentic
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-red-600 mr-2" />
                    <span className="text-red-700 font-medium">
                      Potential Forgery
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${verificationData.is_authentic ? "text-green-600" : "text-red-600"}`}
            >
              {verificationData.match_percentage}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-center mb-2">
                Original Pattern
              </p>
              <img
                src={
                  verificationData.original_pattern_url ||
                  cdpData?.original_pattern_url
                }
                alt="Original"
                className="w-full rounded shadow"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-center mb-2">
                Scanned Pattern
              </p>
              <img
                src={verificationData.scanned_image_url || ""}
                alt="Scanned"
                className="w-full rounded shadow"
              />
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Verify Another
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center border-2 border-dashed border-blue-300 p-6 rounded-md bg-blue-50">
            <UploadCloud className="mx-auto text-blue-500 mb-2" size={40} />
            <p className="text-gray-700 font-medium mb-2">
              Upload a scanned QR code image
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CDPVisualization;
