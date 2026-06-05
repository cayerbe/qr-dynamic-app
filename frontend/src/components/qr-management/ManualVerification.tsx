import React, { useState, useEffect } from "react";
import CDPVisualization from "./CDPVisualization";
import qrApiService from "../../services/qrApiService";

interface QRCodeMeta {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

const ManualVerification: React.FC = () => {
  const [qrList, setQrList] = useState<QRCodeMeta[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCodeMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRs = async () => {
      try {
        setLoading(true);
        const qrCodes = await qrApiService.listQRCodes(); // Updated line
        setQrList(qrCodes || []); // Updated line
      } catch (err) {
        console.error("Error loading QR list:", err);
        setError("Failed to fetch QR codes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQRs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const qrId = e.target.value;
    const qr = qrList.find((q) => q.id === qrId);
    setSelectedQR(qr || null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">
        🔎 QR Code Forgery Verification
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading QR codes...</p>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Select a QR Code:</label>
            <select
              value={selectedQR?.id || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Select a QR Code --</option>
              {qrList.map((qr) => (
                <option key={qr.id} value={qr.id}>
                  {qr.title || qr.id}
                </option>
              ))}
            </select>
          </div>

          {selectedQR && (
            <div className="mb-6 border border-gray-200 p-4 rounded bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">QR Code Info</h2>
              <p>
                <strong>ID:</strong> {selectedQR.id}
              </p>
              <p>
                <strong>Title:</strong> {selectedQR.title}
              </p>
              <p>
                <strong>Type:</strong> {selectedQR.type}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedQR.createdAt).toLocaleString()}
              </p>
            </div>
          )}

          {selectedQR && <CDPVisualization qrId={selectedQR.id} />}
        </>
      )}
    </div>
  );
};

export default ManualVerification;
