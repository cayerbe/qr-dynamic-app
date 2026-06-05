import React, { useState, useEffect } from "react";
import {
  QRCode,
  Campaign,
  ContentType,
  QRType,
  DailyScan, // Add this
} from "../../types/qr-types";
import { useQRManagement } from "./userQRManagementLogic";
import {
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  ExternalLink,
  Filter,
  X,
  Search,
  Shield,
} from "lucide-react";
import * as Styles from "./QRManagementStyles";
import { toast } from "react-toastify";
import { safeConvertToDate } from "../../utils/timestampUtils";

const QRManagement: React.FC = () => {
  const {
    state,
    getFilteredQRCodes,
    handleCreateQR,
    handleEditQR,
    handleViewQR,
    handleDeleteQR,
    handleCreateCampaign,
    updateFilters,
    updateViewPreferences,
    calculateStaticQRPercentage,
    loadQRCodes,
  } = useQRManagement();

  // Local state for modals and filters
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "" });

  // Initialize local filters with current state values
  const [localFilters, setLocalFilters] = useState({
    contentType: state.filters.contentType,
    type: state.filters.type,
    campaign: state.filters.campaign,
  });

  // Load data on component mount
  useEffect(() => {
    loadQRCodes();
  }, []);

  // Update local filters when state changes
  useEffect(() => {
    setLocalFilters({
      contentType: state.filters.contentType,
      type: state.filters.type,
      campaign: state.filters.campaign,
    });
  }, [state.filters]);

  // Render QR Code Grid/List
  const renderQRCodeList = (filteredQRCodes: QRCode[]) => {
    if (state.isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        </div>
      );
    }

    if (filteredQRCodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-lg font-medium mb-2">No QR codes found</div>
          <p className="text-sm mb-4">
            {state.filters.search
              ? "Try adjusting your search criteria"
              : "Create your first QR code to get started"}
          </p>
          <button
            onClick={handleCreateQR}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create QR Code
          </button>
        </div>
      );
    }

    return (
      <div
        className={
          state.viewPreferences.view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {filteredQRCodes.map((qr) => renderQRCodeItem(qr))}
      </div>
    );
  };

  // Render individual QR Code Item
  const renderQRCodeItem = (qr: QRCode) => {
    const createdDate = safeConvertToDate(qr.createdAt);
    const lastScanDate = qr.lastScan ? safeConvertToDate(qr.lastScan) : null;
    const hasCDPConfig = qr.metadata?.cdp_config;

    return state.viewPreferences.view === "grid" ? (
      // Grid View
      <div
        key={qr.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="p-4 flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-lg truncate">
              {qr.title || qr.name || qr.data?.original_url || qr.data || qr.id}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span
                className={`inline-block rounded-full h-2 w-2 mr-2 ${
                  qr.type === "dynamic" ? "bg-blue-500" : "bg-green-500"
                }`}
              />
              <span className="mr-2">
                {qr.type === "dynamic" ? "Dynamic" : "Static"}
              </span>
              <span className="capitalize">{qr.contentType}</span>

              {/* Model Type Badge */}
              {qr.metadata?.model_type && (
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    qr.metadata.model_type === "fintech"
                      ? "bg-green-100 text-green-800"
                      : qr.metadata.model_type === "luxury"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {qr.metadata.model_type.toUpperCase()}
                </span>
              )}
            </div>
            {qr.data && (
              <div className="text-sm text-gray-600 mt-1 truncate">
                {typeof qr.data === "string"
                  ? qr.data
                  : qr.data.original_url || qr.data.url}
              </div>
            )}
            {hasCDPConfig && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                CDP
              </span>
            )}
          </div>
          <div className="dropdown relative">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between mb-3">
            <div>
              <span className="text-gray-500 text-sm">Total Scans</span>
              <div className="text-xl font-semibold">
                {(qr.scans || 0).toLocaleString()}
              </div>
            </div>
            {qr.campaign && (
              <div className="text-right">
                <span className="text-gray-500 text-sm">Campaign</span>
                <div className="text-sm font-medium text-blue-600">
                  {state.campaigns.find((c: Campaign) => c.id === qr.campaign)
                    ?.name || "Unknown"}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Created {createdDate?.toLocaleDateString() || "Unknown"}
            </span>
          </div>

          {lastScanDate && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Eye className="h-4 w-4 mr-1" />
              <span>Last scan {lastScanDate.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-3 flex justify-between bg-gray-50">
          <div className="flex space-x-1">
            {qr.tags?.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewQR(qr)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEditQR(qr)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit QR Code"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                handleDeleteQR(qr);
                setIsDeleteModalOpen(true);
              }}
              className="p-1 text-red-600 hover:text-red-800 transition-colors"
              title="Delete QR Code"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ) : (
      // List View
      <div
        key={qr.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center flex-1">
            <div className="mr-4">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                  qr.type === "dynamic" ? "bg-blue-100" : "bg-green-100"
                }`}
              >
                {qr.contentType === "url" ? (
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">
                {qr.title ||
                  qr.name ||
                  qr.data?.original_url ||
                  qr.data ||
                  qr.id}
                {hasCDPConfig && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full inline-flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    CDP
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-500">
                {qr.type === "dynamic" ? "Dynamic" : "Static"} •{" "}
                {qr.contentType} • Created{" "}
                {createdDate?.toLocaleDateString() || "Unknown"}
              </div>
              {qr.data && (
                <div className="text-sm text-gray-600 mt-1 truncate">
                  {typeof qr.data === "string"
                    ? qr.data
                    : qr.data.original_url || qr.data.url}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <div className="mr-6 text-right">
              <div className="text-gray-500 text-sm">Scans</div>
              <div className="font-semibold">
                {(qr.scans || 0).toLocaleString()}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewQR(qr)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Eye className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleEditQR(qr)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  handleDeleteQR(qr);
                  setIsDeleteModalOpen(true);
                }}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Filters Modal
  const renderFiltersModal = () => {
    if (!isFilterModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filter QR Codes</h3>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content Type Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={localFilters.contentType || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  contentType: (e.target.value as ContentType) || null,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="url">URL</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="vcard">VCard</option>
              <option value="wifi">WiFi</option>
            </select>
          </div>

          {/* QR Type Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Type
            </label>
            <select
              value={localFilters.type || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  type: (e.target.value as QRType) || null,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="static">Static</option>
              <option value="dynamic">Dynamic</option>
            </select>
          </div>

          {/* Campaign Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign
            </label>
            <select
              value={localFilters.campaign || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  campaign: e.target.value || null,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Campaigns</option>
              {state.campaigns.map((campaign: Campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                // Reset filters
                setLocalFilters({
                  contentType: null,
                  type: null,
                  campaign: null,
                });
                updateFilters({
                  contentType: null,
                  type: null,
                  campaign: null,
                });
                setIsFilterModalOpen(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                updateFilters({
                  contentType: localFilters.contentType,
                  type: localFilters.type,
                  campaign: localFilters.campaign,
                });
                setIsFilterModalOpen(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render full component
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Code Management</h1>
        <button
          onClick={handleCreateQR}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create QR Code
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-grow mr-4">
          <input
            type="text"
            placeholder="Search QR codes..."
            value={state.filters.search || ""}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Filters Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 relative transition-colors"
          >
            <Filter className="h-5 w-5 text-gray-600" />
            {(state.filters.contentType ||
              state.filters.type ||
              state.filters.campaign) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                •
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md">
            <button
              onClick={() => updateViewPreferences({ view: "grid" })}
              className={`px-3 py-1 rounded-md transition-colors ${
                state.viewPreferences.view === "grid"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => updateViewPreferences({ view: "list" })}
              className={`px-3 py-1 rounded-md transition-colors ${
                state.viewPreferences.view === "list"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              List
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={`${state.viewPreferences.sortField}-${state.viewPreferences.sortDirection}`}
            onChange={(e) => {
              const [sortField, sortDirection] = e.target.value.split("-");
              updateViewPreferences({
                sortField: sortField as any,
                sortDirection: sortDirection as "asc" | "desc",
              });
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="scans-desc">Most Scanned</option>
            <option value="scans-asc">Least Scanned</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-1/4 space-y-6">
          {/* Campaigns Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Campaigns</h3>
              <button
                onClick={() => setIsCreateCampaignModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {state.campaigns.length === 0 ? (
              <p className="text-gray-500 text-sm">No campaigns yet</p>
            ) : (
              state.campaigns.map((campaign: Campaign) => (
                <div
                  key={campaign.id}
                  className="flex justify-between items-center py-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => updateFilters({ campaign: campaign.id })}
                >
                  <span className="text-sm truncate">{campaign.name}</span>
                  <span className="text-xs text-gray-500">
                    {campaign.qrCount || 0} QRs
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-500 text-sm">Total QR Codes</span>
                <div className="text-xl font-semibold">
                  {state.qrCodes.length}
                </div>
              </div>
              {state.qrCodes.length > 0 && (
                <>
                  <div>
                    <div className="text-gray-500 text-sm mb-1">
                      QR Code Types
                    </div>
                    <div className="flex items-center">
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: calculateStaticQRPercentage(state.qrCodes),
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>
                        Static:{" "}
                        {
                          state.qrCodes.filter(
                            (qr: QRCode) => qr.type === "static",
                          ).length
                        }
                      </span>
                      <span>
                        Dynamic:{" "}
                        {
                          state.qrCodes.filter((qr) => qr.type === "dynamic")
                            .length
                        }
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 text-sm mb-1">
                      CDP Protection
                    </div>
                    <div className="flex items-center">
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{
                            width: `${(state.qrCodes.filter((qr) => qr.metadata?.cdp_config).length / state.qrCodes.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>
                        Protected:{" "}
                        {
                          state.qrCodes.filter((qr) => qr.metadata?.cdp_config)
                            .length
                        }
                      </span>
                      <span>
                        Standard:{" "}
                        {
                          state.qrCodes.filter((qr) => !qr.metadata?.cdp_config)
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4 space-y-6">
          {/* Analytics Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium mb-4">Scan Analytics</h3>
            <div className="h-48">
              <div className="flex h-40 items-end space-x-1">
                {state.chartData.map((data: DailyScan, index: number) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    title={`${data.date}: ${data.scans} scans`}
                  >
                    <div
                      className="w-full bg-blue-500 rounded-sm transition-all duration-300"
                      style={{
                        height: `${(data.scans / Math.max(...state.chartData.map((d: DailyScan) => d.scans), 1)) * 100}%`,
                        minHeight: data.scans > 0 ? "1px" : "0",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Codes List */}
          <div>
            <h3 className="font-medium text-lg mb-4">Your QR Codes</h3>
            {renderQRCodeList(getFilteredQRCodes())}
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderFiltersModal()}

      {/* Create Campaign Modal */}
      {isCreateCampaignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Create Campaign</h3>
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Campaign Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newCampaign.description}
              onChange={(e) =>
                setNewCampaign((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Campaign Description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateCampaignModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newCampaign.name.trim()) {
                    await handleCreateCampaign(
                      newCampaign.name,
                      newCampaign.description,
                    );
                    setIsCreateCampaignModalOpen(false);
                    setNewCampaign({ name: "", description: "" });
                  } else {
                    toast.error("Please enter a campaign name");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && state.selectedQR && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-4">
              Are you sure you want to delete the QR code "
              {state.selectedQR.title ||
                state.selectedQR.name ||
                state.selectedQR.id}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeleteQR(state.selectedQR!);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRManagement;
