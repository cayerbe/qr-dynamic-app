import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface SelfScanningQRProps {
  qrId?: string;
  imageUrl?: string;
  size?: number;
  onScanComplete?: (result: any) => void;
  apiBaseUrl?: string;
}

interface ScanResult {
  success: boolean;
  is_authentic?: boolean;
  match_percentage?: number;
  message?: string;
  destination?: string;
  requires_biometric?: boolean;
  error?: string;
}

const SelfScanningQR: React.FC<SelfScanningQRProps> = ({
  qrId,
  imageUrl,
  size = 250,
  onScanComplete,
  apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "",
}) => {
  const [searchParams] = useSearchParams();
  const urlQrId = searchParams.get("qrId");
  const urlImageUrl = searchParams.get("imageUrl");

  // Prioritize URL parameters over component props
  const effectiveQrId = urlQrId || qrId;
  const effectiveImageUrl = urlImageUrl || imageUrl;

  const [mode, setMode] = useState<
    "display" | "camera" | "processing" | "success" | "error"
  >("display");
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect if we're on desktop or mobile
  useEffect(() => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );
    setIsDesktop(!isMobile);
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize scanner when in camera mode
  useEffect(() => {
    if (mode === "camera") {
      initializeCamera();
    }
  }, [mode]);

  // Add validation logic
  useEffect(() => {
    if (!effectiveQrId || !effectiveImageUrl) {
      setMode("error");
      setErrorMessage("Missing QR scan details");
    }
  }, [effectiveQrId, effectiveImageUrl]);

  const handleQRInteraction = async (): Promise<void> => {
    if (mode !== "display") return;

    try {
      // Log camera activation
      await fetch(`${apiBaseUrl}/qr/scan-camera-activation/${effectiveQrId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: localStorage.getItem("userId") || "anonymous",
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`,
          },
        }),
      });

      // Switch to camera mode
      setMode("camera");
    } catch (error) {
      console.error("Failed to log camera activation:", error);
      // Continue anyway
      setMode("camera");
    }
  };

  const initializeCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            // Start QR scanning
            startQRScanning();
          }
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setErrorMessage(
        "Camera access denied. Please enable camera permissions.",
      );
      setMode("error");
    }
  };

  const startQRScanning = (): void => {
    // If no qrId is available, handle the error case
    if (!effectiveQrId) {
      setMode("error");
      setErrorMessage("No QR ID available for scanning");
      return;
    }

    // In a real implementation, use a QR code scanning library
    // For demo purposes, simulate successful scan after 2 seconds
    setTimeout(() => {
      handleQRCodeDetected(effectiveQrId);
    }, 2000);
  };

  const handleQRCodeDetected = async (detectedQrId: string): Promise<void> => {
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setMode("processing");

    try {
      // Verify QR code
      const response = await fetch(
        `${apiBaseUrl}/qr/verify-self-scan/${detectedQrId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cdp_signature: "simulated-signature", // In reality, this would be extracted from the scanned QR
            user_id: localStorage.getItem("userId") || "anonymous",
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              screenSize: `${window.screen.width}x${window.screen.height}`,
            },
          }),
        },
      );

      const result: ScanResult = await response.json();

      setScanResult(result);

      if (result.success && result.is_authentic) {
        setMode("success");

        // Call the callback if provided
        if (onScanComplete && typeof onScanComplete === "function") {
          onScanComplete(result);
        }
      } else {
        setErrorMessage(result.message || "QR code verification failed");
        setMode("error");
      }
    } catch (error) {
      console.error("QR verification error:", error);
      setErrorMessage("Failed to verify QR code");
      setMode("error");
    }
  };

  const resetToDisplay = (): void => {
    setMode("display");
    setErrorMessage("");
    setScanResult(null);
  };

  // Get appropriate action text based on device
  const getActionText = (): string => {
    return isDesktop
      ? "Click to scan with camera"
      : "Touch to scan with camera";
  };

  // Early return for error mode
  if (mode === "error") {
    return (
      <div
        style={{
          width: "100%",
          height: size,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ffebee",
          borderRadius: "8px",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            backgroundColor: "#F44336",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "30px" }}>✕</span>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          {errorMessage || "Verification failed"}
        </div>
        <button
          onClick={resetToDisplay}
          style={{
            marginTop: "20px",
            backgroundColor: "#2196F3",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="self-scanning-qr" style={{ width: size, margin: "0 auto" }}>
      <h2 className="text-xl font-bold">QR Self Verification</h2>
      <p className="text-gray-700">QR ID: {effectiveQrId}</p>

      {/* Display Mode */}
      {mode === "display" && (
        <div
          onClick={handleQRInteraction}
          style={{
            position: "relative",
            cursor: "pointer",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={effectiveImageUrl}
            alt="Scan this QR code"
            style={{ width: "100%", height: "auto", display: "block" }}
            className="my-4"
          />
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              padding: "10px",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            {getActionText()}
          </div>
        </div>
      )}

      {/* Camera Mode */}
      {mode === "camera" && (
        <div
          style={{
            position: "relative",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <video
            ref={videoRef}
            style={{ width: "100%", height: "auto", display: "block" }}
            playsInline
            muted
          ></video>

          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "80%",
                height: "80%",
                border: "2px solid #4CAF50",
                borderRadius: "10px",
                position: "relative",
              }}
            ></div>

            <div
              style={{
                marginTop: "20px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "20px",
                fontSize: "14px",
              }}
            >
              Scanning QR code automatically...
            </div>

            <button
              onClick={resetToDisplay}
              style={{
                marginTop: "20px",
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "8px 15px",
                borderRadius: "20px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Processing Mode */}
      {mode === "processing" && (
        <div
          style={{
            width: "100%",
            height: size,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <div style={{ marginTop: "20px" }}>Processing...</div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Success Mode */}
      {mode === "success" && (
        <div
          style={{
            width: "100%",
            height: size,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "#4CAF50",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span style={{ color: "white", fontSize: "30px" }}>✓</span>
          </div>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            QR code verified successfully!
          </div>
          <button
            onClick={resetToDisplay}
            style={{
              marginTop: "20px",
              backgroundColor: "#4CAF50",
              border: "none",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default SelfScanningQR;
