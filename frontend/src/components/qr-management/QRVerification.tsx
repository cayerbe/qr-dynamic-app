// src/components/qr-management/QRVerification.tsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  List,
  BarChart2,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";
import qrApiService from "../../services/qrApiService";
import Spinner from "../common/Spinner";
import { useAuth } from "../../contexts/AuthContext";
import { ForgeryLog } from "../../types/qr-types"; // Updated import
import ScanTracking from "./ScanTracking"; // Import the detailed ScanTracking component

interface ScanStatistics {
  total_scans: number;
  unique_qr_codes: number;
  unique_users: number;
  potential_forgeries: number;
}

// Add enhanced ForgeryLog interface to handle the properties being used
interface EnhancedForgeryLog extends ForgeryLog {
  qr_id: string;
  risk_score: number;
}

const QRVerification: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgeryLogs, setForgeryLogs] = useState<EnhancedForgeryLog[]>([]);
  const [scanStatistics, setScanStatistics] = useState<ScanStatistics | null>(
    null,
  );
  const [scanTimeRange, setScanTimeRange] = useState<string>("7d");
  const [activeTab, setActiveTab] = useState<"logs" | "stats" | "forgery">(
    "logs",
  );
  const { currentUser } = useAuth();

  // Load scan statistics and forgery logs
  useEffect(() => {
    fetchScanStatistics();
    getForgeryLogsSilent();
  }, [scanTimeRange]);

  const fetchScanStatistics = async () => {
    try {
      setIsStatsLoading(true);
      const scanStats = await qrApiService.getTotalScans().catch(() => 0);
      const qrCount = await qrApiService.getQRCodeCount().catch(() => 0);
      const userCount = await qrApiService.getUserCount().catch(() => 0);

      // Ensure forgeryLogs is an array before filtering
      const potentialForgeryCount = Array.isArray(forgeryLogs)
        ? forgeryLogs.filter(
            (log) =>
              log.is_potential_forgery ||
              (log.message && log.message.toLowerCase().includes("forgery")),
          ).length
        : 0;

      setScanStatistics({
        total_scans: scanStats || 0,
        unique_qr_codes: qrCount || 0,
        unique_users: userCount || 0,
        potential_forgeries: potentialForgeryCount,
      });
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const getForgeryLogsSilent = async () => {
    // Renamed from fetchForgeryLogsSilent
    try {
      const logs = await qrApiService.getForgeryLogs(); // Updated method name
      // Cast the logs as EnhancedForgeryLog to handle the additional properties
      setForgeryLogs(logs as EnhancedForgeryLog[]);
    } catch (err) {
      console.error("Error fetching forgery logs silently:", err);
    }
  };

  const renderStatsDetails = () => {
    if (!scanStatistics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="text-blue-600" />}
          title="Total Scans Trend"
          value={`+${(scanStatistics.total_scans / 100).toFixed(1)}%`}
          description="vs previous period"
        />
        <StatCard
          icon={<AlertOctagon className="text-red-600" />}
          title="Forgery Risk"
          value={`${(
            (scanStatistics.potential_forgeries / scanStatistics.total_scans) *
            100
          ).toFixed(2)}%`}
          description="of total scans"
        />
      </div>
    );
  };

  const renderForgeryLogs = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Forgery Logs</h3>
        {forgeryLogs.length === 0 ? (
          <p className="text-gray-500">No forgery logs found</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">QR ID</th>
                <th className="text-left p-2">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {forgeryLogs.map((log, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2">{log.qr_id}</td>
                  <td className="p-2">
                    <span
                      className={`
                      px-2 py-1 rounded-full text-xs 
                      ${
                        log.risk_score > 20
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }
                    `}
                    >
                      {log.risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[60px]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">QR Code Verification Portal</h1>
          <div className="flex space-x-2">
            <select
              value={scanTimeRange}
              onChange={(e) => setScanTimeRange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={fetchScanStatistics}
              className="bg-blue-600 text-white px-3 py-2 rounded flex items-center"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Refresh Stats
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 space-x-4">
          <button
            onClick={() => setActiveTab("logs")}
            className={`
              px-4 py-2 rounded transition-all
              ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
          >
            Scan Logs
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`
              px-4 py-2 rounded transition-all
              ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
          >
            Advanced Statistics
          </button>
          <button
            onClick={() => setActiveTab("forgery")}
            className={`
              px-4 py-2 rounded transition-all
              ${
                activeTab === "forgery"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
          >
            Forgery Logs
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "logs" && <ScanTracking />}
        {activeTab === "stats" && renderStatsDetails()}
        {activeTab === "forgery" && renderForgeryLogs()}
      </div>
    </div>
  );
};

// Advanced Statistics Card
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
}> = ({ icon, title, value, description }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex justify-between items-center mb-2">
      {icon}
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  </div>
);

export default QRVerification;
