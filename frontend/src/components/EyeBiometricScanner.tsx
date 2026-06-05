// EyeBiometricScanner.tsx
import React, { useState, useRef, useEffect } from "react";
import "./EyeBiometricScanner.css"; // Assuming styles are moved to a CSS file

interface EyeBiometricScannerProps {
  qrId?: string;
  userId?: string;
  onSuccess?: (result: VerificationResult) => void;
  onFailure?: (result: VerificationResult) => void;
  apiBaseUrl?: string;
}

interface VerificationResult {
  success: boolean;
  is_verified?: boolean;
  message?: string;
  destination?: string;
  verification_type?: string;
  match_score?: number;
  error?: string;
}

const EyeBiometricScanner: React.FC<EyeBiometricScannerProps> = ({
  qrId,
  userId,
  onSuccess,
  onFailure,
  apiBaseUrl = "https://crack-celerity-419510.uc.r.appspot.com/api",
}) => {
  const [status, setStatus] = useState<
    "initializing" | "scanning" | "processing" | "success" | "error"
  >("initializing");
  const [message, setMessage] = useState<string>("Preparing camera...");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Validate required props
  useEffect(() => {
    if (!userId && status === "scanning") {
      setStatus("error");
      setErrorMessage("User ID is required for biometric verification");
    }
  }, [userId, status]);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();

    return () => {
      stopCamera(); // Clean up camera on unmount
    };
  }, []);

  const initializeCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Use front camera for eye scanning
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
          }
          setStatus("scanning");
          setMessage("Position your eyes in the frame...");

          // Simulate successful detection after 3 seconds
          setTimeout(() => {
            captureEyeBiometric();
          }, 3000);
        };
      }
    } catch (error) {
      console.error("Camera initialization error:", error);
      setErrorMessage(
        "Camera access denied. Please enable camera permissions.",
      );
      setStatus("error");
    }
  };

  const captureEyeBiometric = async (): Promise<void> => {
    if (!userId) {
      setStatus("error");
      setErrorMessage("User ID is required for biometric verification");
      return;
    }

    setStatus("processing");
    setMessage("Processing biometric data...");

    setTimeout(async () => {
      try {
        const demoHash = generateDemoHash(userId);

        const response = await fetch(`${apiBaseUrl}/biometric/verify/${qrId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            biometric_hash: demoHash,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              screenSize: `${window.screen.width}x${window.screen.height}`,
            },
          }),
        });

        const result: VerificationResult = await response.json();

        if (result.success && result.is_verified) {
          setStatus("success");
          setMessage(result.message || "Biometric verification successful");

          if (onSuccess) {
            setTimeout(() => onSuccess(result), 1000);
          }
        } else {
          setStatus("error");
          setErrorMessage(result.message || "Biometric verification failed");

          if (onFailure) {
            onFailure(result);
          }
        }
      } catch (error) {
        console.error("Biometric verification error:", error);
        setStatus("error");
        setErrorMessage("Failed to verify biometric data");

        if (onFailure) {
          onFailure({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }, 2000);
  };

  const generateDemoHash = (userId: string): string => {
    return `demo_biometric_hash_${userId}_${Date.now()}`;
  };

  const retryVerification = (): void => {
    setStatus("initializing");
    setMessage("Preparing camera...");
    setErrorMessage("");
    stopCamera(); // Restart the camera process
    initializeCamera();
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="eye-biometric-scanner">
      {/* Status message */}
      <div className={`status-message ${status === "error" ? "error" : ""}`}>
        {status === "error" ? errorMessage : message}
      </div>

      {/* Video feed container */}
      <div className="video-container">
        {/* Video element - hidden when in success or error state */}
        {status !== "success" && status !== "error" && (
          <video
            ref={videoRef}
            className="video-feed"
            playsInline
            muted
          ></video>
        )}

        {/* Scanning overlay */}
        {status === "scanning" && (
          <div className="scanning-overlay">
            <div className="eye-guide"></div>
            <div className="scanning-message">
              Align your eyes with the outline
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {status === "processing" && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <div className="processing-message">Processing...</div>
          </div>
        )}

        {/* Success overlay */}
        {status === "success" && (
          <div className="success-overlay">
            <div className="success-icon">✓</div>
            <div className="success-message">{message}</div>
          </div>
        )}

        {/* Error overlay */}
        {status === "error" && (
          <div className="error-overlay">
            <div className="error-icon">✕</div>
            <div className="error-message">{errorMessage}</div>
            <button className="retry-button" onClick={retryVerification}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeBiometricScanner;
