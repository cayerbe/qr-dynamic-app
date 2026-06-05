// src/components/public/AutoVerification.tsx
import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Shield, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import Spinner from "../common/Spinner";

const AutoVerification: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  // Initialize QR scanner
  useEffect(() => {
    if (scannerDivRef.current && !scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
      startScanner();
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Failed to stop scanner:", err));
      }
    };
  }, []);

  // Handle countdown for redirection
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [countdown, redirectUrl]);

  // Start QR scanner
  const startScanner = () => {
    if (!scannerRef.current) return;

    setIsScanning(true);

    const qrBoxSize = Math.min(window.innerWidth, window.innerHeight) * 0.7;

    scannerRef.current
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize },
        },
        (decodedText) => {
          handleQrCodeScan(decodedText);
        },
        (errorMessage) => {
          console.log(errorMessage);
        },
      )
      .catch((err) => {
        setError("Could not access camera: " + err);
        setIsScanning(false);
      });
  };

  // Handle QR code scan
  const handleQrCodeScan = (decodedText: string) => {
    try {
      // Stop scanning once we've got a result
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Stop scanner error:", err));
        setIsScanning(false);
      }

      // Parse the QR content
      let extractedQrId: string | null = null;
      let destinationUrl: string | null = null;

      try {
        // Try to parse as JSON first
        const parsedData = JSON.parse(decodedText);
        extractedQrId = parsedData.id || null;
        destinationUrl = parsedData.url || null;
      } catch (parseError) {
        // If not JSON, try to handle pipe-separated format
        if (decodedText.includes("|")) {
          const parts = decodedText.split("|");
          extractedQrId = parts[0];
          destinationUrl = parts[1];
        } else {
          // Just treat as a URL with no ID
          destinationUrl = decodedText;

          // Try to extract QR ID if the format matches your pattern (QR_{timestamp}_{uuid})
          const qrIdMatch = decodedText.match(/QR_\d+_[a-zA-Z0-9]+/);
          if (qrIdMatch) {
            extractedQrId = qrIdMatch[0];
          } else {
            extractedQrId = "unknown";
          }
        }
      }

      setRedirectUrl(destinationUrl);

      // Verify QR authenticity
      if (extractedQrId) {
        verifyQRCode(extractedQrId);
      } else {
        setError("Could not determine QR code ID");
      }
    } catch (error) {
      console.error("Error handling QR code scan:", error);
      setError("Invalid QR code format");
    }
  };

  // Verify QR code authenticity
  const verifyQRCode = async (id: string) => {
    setIsVerifying(true);
    setError("");

    try {
      // Log the scan event
      const deviceInfo = {
        device_id: navigator.userAgent,
        browser: navigator.userAgent,
        platform: navigator.platform,
      };

      let locationInfo = {};
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 0,
              });
            },
          );

          locationInfo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
        } catch (locErr) {
          console.log("Location access not available or denied");
        }
      }

      // Log the scan with anonymous user ID
      await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/qr/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_id: id,
          user_id: "anonymous-user",
          device_info: deviceInfo,
          location_info: locationInfo,
        }),
      });

      // Verify authenticity
      const verifyResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || ""}/qr/alert_forgery/${id}`,
      );

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify QR code");
      }

      const verificationData = await verifyResponse.json();
      setResult(verificationData);

      // Start redirect countdown if authentic
      if (verificationData.is_authentic && redirectUrl) {
        setCountdown(5); // 5 second countdown before redirect
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify QR code authenticity.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white">
          <h1 className="text-xl font-bold flex items-center">
            <Shield className="mr-2" /> QR Verification Portal
          </h1>
          <p className="text-sm text-blue-100">
            Automatically verifying QR code authenticity
          </p>
        </div>

        <div className="p-6">
          {/* Scanner */}
          {isScanning && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Position the QR code in front of your camera
                </p>
              </div>
              <div
                id="qr-reader"
                ref={scannerDivRef}
                className="w-full aspect-square mx-auto"
              ></div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-start mb-4">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading indicator */}
          {isVerifying && (
            <div className="flex flex-col items-center justify-center py-10">
              <Spinner />
              <p className="mt-4 text-gray-600">Verifying QR code...</p>
            </div>
          )}

          {/* Results */}
          {result && !isVerifying && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-md ${
                  result.is_authentic
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center">
                  {result.is_authentic ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium text-lg">
                        Authentic QR Code
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium text-lg">
                        Potential Forgery Detected
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      Match Percentage:
                    </span>
                    <span className="text-sm font-medium">
                      {result.match_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${result.is_authentic ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${result.match_percentage}%` }}
                    ></div>
                  </div>
                </div>

                <p className="mt-3 text-sm">{result.message}</p>

                {/* Redirect countdown */}
                {countdown !== null && result.is_authentic && (
                  <div className="mt-4 text-center py-2 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      Redirecting in{" "}
                      <span className="font-bold">{countdown}</span> seconds...
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Verified on {new Date().toLocaleString()}
                </div>
              </div>

              {/* Destination display */}
              {redirectUrl && result.is_authentic && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Destination:</p>
                  <p className="truncate text-blue-600">{redirectUrl}</p>
                </div>
              )}

              {!result.is_authentic && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-800 font-medium">
                    Potential Security Risk
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    This QR code failed authenticity verification and has been
                    blocked from redirecting.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoVerification;
