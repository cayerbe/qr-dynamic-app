import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ScanResult {
  is_authentic: boolean;
  confidence: number;
  risk_score: number;
  destination_url?: string;
  analysis?: any;
}

const PWAScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Initialize scanner on mount
    initializeScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError,
      );

      setIsScanning(true);
    } catch (err) {
      setError("Failed to access camera. Please allow camera permissions.");
      console.error("Scanner initialization error:", err);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processing) return;

    setProcessing(true);

    try {
      // Stop scanner
      if (scannerRef.current) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }

      // Capture frame and verify
      const result = await verifyQRCode(decodedText);
      setScanResult(result);

      // Handle result
      if (result.is_authentic && result.destination_url) {
        setTimeout(() => {
          window.location.href = result.destination_url!;
        }, 2000);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("Scan processing error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignore - continuous when no QR visible
  };

  const verifyQRCode = async (decodedText: string): Promise<ScanResult> => {
    // Extract QR ID
    const qrId = extractQRId(decodedText);
    if (!qrId) throw new Error("Invalid QR format");

    // Capture video frame
    const video = document.querySelector("video");
    if (!video) throw new Error("Video not found");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png", 0.95);
    });

    // Send to backend
    const formData = new FormData();
    formData.append("image", blob, "scan.png");
    formData.append("qr_id", qrId);

    const response = await fetch("/api/pwa/verify-scan", {
      method: "POST",
      headers: {
        "X-PWA-Version": "1.0",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.status}`);
    }

    return await response.json();
  };

  const extractQRId = (url: string): string | null => {
    const patterns = [
      /\/redirect\/([^\/\?]+)/,
      /\/s\/([^\/\?]+)/,
      /qr_id=([^&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url.startsWith("QR_") ? url : null;
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    initializeScanner();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-lg">
        <div className="bg-blue-600 text-white p-6 text-center">
          <h1 className="text-2xl font-semibold">🔒 Secure QR Scanner</h1>
          <p className="text-blue-100 mt-1">Enterprise Security Verification</p>
        </div>

        <div id="qr-reader" className="w-full"></div>

        <div className="p-6">
          {processing && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">
                Verifying security features...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
              <button
                onClick={resetScanner}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {scanResult && (
            <div
              className={`rounded p-4 ${scanResult.is_authentic ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}
            >
              {scanResult.is_authentic ? (
                <>
                  <h3 className="text-green-800 font-semibold flex items-center">
                    ✅ Verified Authentic
                  </h3>
                  <p className="text-green-700 mt-2">
                    Confidence: {scanResult.confidence.toFixed(1)}%
                  </p>
                  <p className="text-green-600 text-sm mt-2">
                    Redirecting to secure destination...
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-red-800 font-semibold flex items-center">
                    ⚠️ Security Alert
                  </h3>
                  <p className="text-red-700 mt-2">
                    This QR code failed verification
                  </p>
                  <p className="text-red-600 font-semibold mt-2">
                    Risk Score: {scanResult.risk_score.toFixed(0)}/100
                  </p>
                  <button
                    onClick={resetScanner}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Scan Another
                  </button>
                </>
              )}
            </div>
          )}

          {isScanning && !processing && !error && !scanResult && (
            <div className="text-center text-gray-600">
              <div className="flex items-center justify-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
                <span>Ready to scan</span>
              </div>
              <p className="text-sm mt-2 text-gray-500">
                Position QR code within the frame
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAScanner;
