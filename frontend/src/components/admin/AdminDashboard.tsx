// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Remove unused import
// import { User } from "lucide-react";
import Spinner from "../common/Spinner";
import Alert from "../common/Alert";
import { QrCode, AlertTriangle, BarChart2, Users } from "lucide-react";
import qrApiService from "../../services/qrApiService";

// Define interface for dashboard data
interface DashboardData {
  totalUsers: number;
  totalQRCodes: number;
  qrCodesGeneratedToday: number;
  totalScans: number;
  scansToday: number;
  recentActivity: Array<{
    qr_id: string;
    status: "SUSPICIOUS" | "NORMAL";
    match_percentage: number;
    timestamp: string;
  }>;
  userGrowth: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  scanTrend: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalQRCodes: 0,
    qrCodesGeneratedToday: 0,
    totalScans: 0,
    scansToday: 0,
    recentActivity: [],
    userGrowth: { thisMonth: 0, lastMonth: 0, percentChange: 0 },
    scanTrend: { thisMonth: 0, lastMonth: 0, percentChange: 0 }, // ✅ Default value to prevent `undefined`
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const [forgeryLogs, setForgeryLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [
          logsResponse,
          usersCountResponse,
          qrCodesCountResponse,
          scansResponse,
          userGrowthResponse,
          scanTrendResponse,
          todayStatsResponse,
        ] = await Promise.all([
          qrApiService.getForgeryLogs(),
          qrApiService.getUserCount(),
          qrApiService.getQRCodeCount(),
          qrApiService.getTotalScans(),
          qrApiService.getUserGrowth(timeRange),
          qrApiService.getScanTrend(timeRange),
          qrApiService.getTodayStats(),
        ]);

        setDashboardData((prevData) => ({
          ...prevData,
          totalUsers: usersCountResponse, // Directly use the number
          totalQRCodes: qrCodesCountResponse, // Directly use the number
          qrCodesGeneratedToday: todayStatsResponse?.qrCodesGenerated ?? 0,
          totalScans: scansResponse,
          scansToday: todayStatsResponse?.scans ?? 0,
          recentActivity: Array.isArray(logsResponse)
            ? logsResponse
            : (((logsResponse as any)?.logs as any as any) ?? []), // Handle logsResponse as an array or fallback to logs property
          userGrowth: {
            thisMonth: userGrowthResponse?.thisMonth ?? 0,
            lastMonth: userGrowthResponse?.lastMonth ?? 0,
            percentChange: userGrowthResponse?.percentChange ?? 0,
          },
          scanTrend: {
            thisMonth: scanTrendResponse?.thisMonth ?? 0,
            lastMonth: scanTrendResponse?.lastMonth ?? 0,
            percentChange: scanTrendResponse?.percentChange ?? 0,
          },
        }));
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const forgeryLogs = await qrApiService.getForgeryLogs();
        setForgeryLogs(forgeryLogs);
      } catch (error) {
        console.error("Failed to fetch forgery logs:", error);
      }
    };

    fetchDashboardData();
    fetchStats();
  }, [currentUser, navigate, timeRange]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <div className="bg-white rounded-md shadow-sm flex p-1">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1 rounded-md ${
                timeRange === "week"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1 rounded-md ${
                timeRange === "month"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1 rounded-md ${
                timeRange === "year"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">
                  {dashboardData?.totalUsers.toLocaleString()}
                </h3>
                <div
                  className={`flex items-center mt-2 text-sm ${
                    (dashboardData?.userGrowth?.percentChange ?? 0) >= 0 // ✅ Safe default value
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <span>
                    {(dashboardData?.userGrowth?.percentChange ?? 0) >= 0
                      ? "↑"
                      : "↓"}
                  </span>
                  <span className="ml-1">
                    {Math.abs(
                      dashboardData?.userGrowth?.percentChange ?? 0,
                    ).toFixed(1)}
                    % from last {timeRange}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* QR Codes Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total QR Codes</p>
                <h3 className="text-3xl font-bold mt-1">
                  {dashboardData?.totalQRCodes.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  +{dashboardData?.qrCodesGeneratedToday} today
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Scans Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Scans</p>
                <h3 className="text-3xl font-bold mt-1">
                  {dashboardData?.totalScans.toLocaleString()}
                </h3>
                <div
                  className={`flex items-center mt-2 text-sm ${
                    (dashboardData?.scanTrend?.percentChange ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <span>
                    {(dashboardData?.scanTrend?.percentChange ?? 0) >= 0
                      ? "↑"
                      : "↓"}
                  </span>
                  <span className="ml-1">
                    {Math.abs(
                      dashboardData?.scanTrend?.percentChange ?? 0,
                    ).toFixed(1)}
                    % from last {timeRange}
                  </span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Forgery Attempts</p>
                <h3 className="text-3xl font-bold mt-1">
                  {dashboardData?.recentActivity.filter(
                    (log) => log.status === "SUSPICIOUS",
                  ).length || 0}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  In the last 30 days
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Overview</h2>
            <div className="h-80 flex items-center justify-center text-gray-400">
              {/* Use a charting library like recharts or chart.js to display data */}
              <p>Activity chart visualization would go here</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {dashboardData?.recentActivity?.length ? (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md ${
                      log.status === "SUSPICIOUS"
                        ? "bg-red-50 border-l-4 border-red-500"
                        : "bg-green-50 border-l-4 border-green-500"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {log.qr_id.substring(0, 10)}...
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          log.status === "SUSPICIOUS"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="text-gray-500">
                        Match: {log.match_percentage}%
                      </span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
