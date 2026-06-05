import React, { useState, useEffect, useMemo } from "react";
import {
  QrCode,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// TypeScript Interfaces for Type Safety
interface QRCodeItem {
  id: string;
  qr_id: string;
  created_at: string;
  type: "static" | "dynamic";
  scans: number;
  last_scanned?: string;
  campaign?: string;
}

const QRCodeList: React.FC = () => {
  // State Management
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and Pagination
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "static" | "dynamic">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch QR Codes
  useEffect(() => {
    const fetchQrCodes = async () => {
      try {
        // Simulated rich mock data
        const mockQRCodes: QRCodeItem[] = [
          {
            id: "1",
            qr_id: "MARKETING2023",
            created_at: "2023-11-15",
            type: "dynamic",
            scans: 1245,
            last_scanned: "2023-12-01",
            campaign: "Winter Campaign",
          },
          {
            id: "2",
            qr_id: "PRODUCT_LINK",
            created_at: "2023-10-20",
            type: "static",
            scans: 578,
            last_scanned: "2023-11-25",
          },
          {
            id: "3",
            qr_id: "EVENT_REGISTRATION",
            created_at: "2023-12-05",
            type: "dynamic",
            scans: 892,
            last_scanned: "2023-12-10",
            campaign: "Annual Conference",
          },
        ];

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setQrCodes(mockQRCodes);
        setLoading(false);
      } catch (err) {
        setError("Failed to load QR codes");
        setLoading(false);
      }
    };

    fetchQrCodes();
  }, []);

  // Filtered and Paginated QR Codes
  const filteredQRCodes = useMemo(() => {
    return qrCodes.filter(
      (qrCode) =>
        (searchTerm === "" ||
          qrCode.qr_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterType === "all" || qrCode.type === filterType),
    );
  }, [qrCodes, searchTerm, filterType]);

  // Pagination
  const paginatedQRCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQRCodes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQRCodes, currentPage]);

  // Handlers
  const handleViewQRCode = (id: string) => {
    // Navigate to QR code detail page
    console.log(`Viewing QR Code: ${id}`);
  };

  const handleDownloadQRCode = (id: string) => {
    // Download QR code
    console.log(`Downloading QR Code: ${id}`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">Loading QR Codes...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <QrCode className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-red-700">
            Error Loading QR Codes
          </h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <RefreshCw className="inline-block mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My QR Codes</h1>
            <p className="text-sm text-blue-100">
              Manage and track your generated QR codes
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard/generator")}
            className="flex items-center bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50"
          >
            <QrCode className="mr-2" /> Create New
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "static" | "dynamic")
                }
                className="w-full md:w-auto py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="static">Static</option>
                <option value="dynamic">Dynamic</option>
              </select>
            </div>
          </div>
        </div>

        {/* QR Codes List */}
        <div>
          {filteredQRCodes.length === 0 ? (
            <div className="text-center py-12">
              <QrCode size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No QR codes found
              </h3>
              <p className="text-gray-500 mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Generate some QR codes to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-left">QR Code ID</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Created</th>
                  <th className="p-4 text-left">Scans</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQRCodes.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50 border-b">
                    <td className="p-4 flex items-center">
                      <QrCode className="h-8 w-8 mr-4 text-blue-500" />
                      <span>{qrCode.qr_id}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          qrCode.type === "dynamic"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {qrCode.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {qrCode.created_at}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">
                        {qrCode.scans} scans
                      </div>
                      {qrCode.last_scanned && (
                        <div className="text-xs text-gray-500">
                          Last scan: {qrCode.last_scanned}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewQRCode(qrCode.id)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Eye />
                        </button>
                        <button
                          onClick={() => handleDownloadQRCode(qrCode.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          <Download />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredQRCodes.length > 0 && (
          <div className="p-4 flex justify-between items-center border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {paginatedQRCodes.length} of {filteredQRCodes.length} QR
              codes
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm text-gray-600">Page {currentPage}</span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < Math.ceil(filteredQRCodes.length / itemsPerPage)
                      ? prev + 1
                      : prev,
                  )
                }
                disabled={
                  currentPage >=
                  Math.ceil(filteredQRCodes.length / itemsPerPage)
                }
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeList;
