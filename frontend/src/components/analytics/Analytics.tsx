// src/components/analytics/AnalyticsDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Calendar,
  Globe,
  Users,
  Smartphone,
  Clock,
} from "lucide-react";
import Spinner from "../common/Spinner";
import Alert from "../common/Alert";
import qrApiService from "../../services/qrApiService";

// Define interfaces for analytics data
interface ScanData {
  date: string;
  scans: number;
}

interface GeoData {
  country: string;
  scans: number;
  percentage: number;
}

interface DeviceData {
  device: string;
  scans: number;
  percentage: number;
}

interface TimeData {
  hour: number;
  scans: number;
  percentage: number;
}

interface AnalyticsData {
  totalScans: number;
  scansByDate: ScanData[];
  scansByCountry: GeoData[];
  scansByDevice: DeviceData[];
  scansByHour: TimeData[];
  scanTrend: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const data = await qrApiService.getScanTrend(timeRange);
        setAnalyticsData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
        setError("Could not load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        <Alert type="error" message={error} />
      </div>
    );
  }

  // Safely access analytics data or provide defaults
  const data = analyticsData || {
    totalScans: 0,
    scansByDate: [],
    scansByCountry: [],
    scansByDevice: [],
    scansByHour: [],
    scanTrend: {
      today: 0,
      yesterday: 0,
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      percentChange: 0,
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Comprehensive analytics for your QR code usage and scan activities
      </p>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <div className="bg-white rounded-md shadow-sm flex p-1">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 py-1 rounded-md ${timeRange === "week" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 py-1 rounded-md ${timeRange === "month" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-3 py-1 rounded-md ${timeRange === "year" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Scans */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Scans</p>
              <h3 className="text-3xl font-bold mt-1">
                {data.totalScans.toLocaleString()}
              </h3>
              <div
                className={`flex items-center mt-2 text-sm ${
                  data.scanTrend.percentChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <span>{data.scanTrend.percentChange >= 0 ? "↑" : "↓"}</span>
                <span className="ml-1">
                  {Math.abs(data.scanTrend.percentChange).toFixed(1)}% from last{" "}
                  {timeRange}
                </span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Today's Scans */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Scans</p>
              <h3 className="text-3xl font-bold mt-1">
                {data.scanTrend.today.toLocaleString()}
              </h3>
              <div
                className={`flex items-center mt-2 text-sm ${
                  data.scanTrend.today >= data.scanTrend.yesterday
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <span>
                  {data.scanTrend.today >= data.scanTrend.yesterday ? "↑" : "↓"}
                </span>
                <span className="ml-1">
                  {Math.abs(
                    ((data.scanTrend.today - data.scanTrend.yesterday) /
                      (data.scanTrend.yesterday || 1)) *
                      100,
                  ).toFixed(1)}
                  % vs yesterday
                </span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* This Week's Scans */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">This Week</p>
              <h3 className="text-3xl font-bold mt-1">
                {data.scanTrend.thisWeek.toLocaleString()}
              </h3>
              <div
                className={`flex items-center mt-2 text-sm ${
                  data.scanTrend.thisWeek >= data.scanTrend.lastWeek
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <span>
                  {data.scanTrend.thisWeek >= data.scanTrend.lastWeek
                    ? "↑"
                    : "↓"}
                </span>
                <span className="ml-1">
                  {Math.abs(
                    ((data.scanTrend.thisWeek - data.scanTrend.lastWeek) /
                      (data.scanTrend.lastWeek || 1)) *
                      100,
                  ).toFixed(1)}
                  % vs last week
                </span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* This Month's Scans */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">This Month</p>
              <h3 className="text-3xl font-bold mt-1">
                {data.scanTrend.thisMonth.toLocaleString()}
              </h3>
              <div
                className={`flex items-center mt-2 text-sm ${
                  data.scanTrend.thisMonth >= data.scanTrend.lastMonth
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                <span>
                  {data.scanTrend.thisMonth >= data.scanTrend.lastMonth
                    ? "↑"
                    : "↓"}
                </span>
                <span className="ml-1">
                  {Math.abs(
                    ((data.scanTrend.thisMonth - data.scanTrend.lastMonth) /
                      (data.scanTrend.lastMonth || 1)) *
                      100,
                  ).toFixed(1)}
                  % vs last month
                </span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans Over Time Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Scans Over Time</h2>
          <div className="h-80 flex items-center justify-center text-gray-400">
            {/* In a real implementation, you'd use a charting library like Recharts */}
            <p>Scan trend chart would go here</p>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Geographic Distribution
          </h2>

          {data.scansByCountry.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <p>No geographic data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* In a real implementation, you might include a map visualization here */}
              <div className="space-y-2">
                {data.scansByCountry.slice(0, 5).map((country) => (
                  <div key={country.country} className="flex items-center">
                    <div className="w-24 flex-shrink-0 font-medium">
                      {country.country}
                    </div>
                    <div className="flex-grow px-2">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm">
                      {country.percentage}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Globe className="h-40 w-40 text-gray-200" />
              </div>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Device Types</h2>

          {data.scansByDevice.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>No device data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* Pie chart would go here in a real implementation */}
                <div className="h-60 flex items-center justify-center">
                  <Smartphone className="h-20 w-20 text-gray-200" />
                </div>
              </div>
              <div className="space-y-3">
                {data.scansByDevice.map((device) => (
                  <div key={device.device}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">
                        {device.device}
                      </span>
                      <span className="text-sm">{device.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time of Day Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Scan Time Distribution</h2>

          {data.scansByHour.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>No time distribution data available</p>
            </div>
          ) : (
            <div className="flex flex-col h-60">
              {/* Time distribution heatmap would go here */}
              <div className="flex justify-center items-center flex-grow">
                <Clock className="h-20 w-20 text-gray-200" />
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Peak scanning hours: 12 PM - 2 PM</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
