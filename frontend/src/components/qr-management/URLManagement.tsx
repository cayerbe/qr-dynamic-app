// src/components/qr-management/URLManagement.tsx
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Globe, Check, X } from "lucide-react";
import Spinner from "../common/Spinner";
import qrApiService from "../../services/qrApiService";

interface URL {
  url_id: string;
  url: string;
  active: boolean;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface URLManagementProps {
  qrId: string;
  onUpdate?: () => void;
}

const URLManagement: React.FC<URLManagementProps> = ({ qrId, onUpdate }) => {
  const [urls, setUrls] = useState<URL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [urlName, setUrlName] = useState("");
  const [urlDescription, setUrlDescription] = useState("");
  const [editingUrl, setEditingUrl] = useState<URL | null>(null);
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Load URLs on component mount
  useEffect(() => {
    const loadUrls = async () => {
      try {
        setLoading(true);
        const response = await qrApiService.getUrls(qrId);
        setUrls(response.urls || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load URLs:", err);
        setError("Could not load URLs for this QR code");
      } finally {
        setLoading(false);
      }
    };

    loadUrls();
  }, [qrId]);

  // Handle adding a new URL
  const handleAddUrl = async () => {
    if (!newUrl) return;

    try {
      const urlData = {
        qrId,
        url: newUrl,
        active: urls.length === 0, // Make active if it's the first URL
        name: urlName,
        description: urlDescription,
      };

      const response = await qrApiService.addUrl(urlData);
      setUrls([...urls, response.url]);

      // Reset form
      setNewUrl("");
      setUrlName("");
      setUrlDescription("");
      setIsAddingUrl(false);

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to add URL:", err);
      setError("Failed to add URL. Please try again.");
    }
  };

  // Handle editing a URL
  const handleUpdateUrl = async () => {
    if (!editingUrl) return;

    try {
      const updatedUrlData = {
        url: newUrl || editingUrl.url,
        name: urlName || editingUrl.name,
        description: urlDescription || editingUrl.description,
      };

      await qrApiService.updateUrl(editingUrl.url_id, updatedUrlData);

      // Update local state
      setUrls(
        urls.map((url) =>
          url.url_id === editingUrl.url_id
            ? { ...url, ...updatedUrlData }
            : url,
        ),
      );

      // Reset form
      setEditingUrl(null);
      setNewUrl("");
      setUrlName("");
      setUrlDescription("");

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to update URL:", err);
      setError("Failed to update URL. Please try again.");
    }
  };

  // Handle deleting a URL
  const handleDeleteUrl = async (urlId: string) => {
    if (!window.confirm("Are you sure you want to delete this URL?")) {
      return;
    }

    try {
      await qrApiService.deleteUrl(urlId);
      setUrls(urls.filter((url) => url.url_id !== urlId));

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to delete URL:", err);
      setError("Failed to delete URL. Please try again.");
    }
  };

  // Set a URL as active
  const setActiveUrl = async (urlId: string) => {
    try {
      await qrApiService.setActiveUrl(qrId, urlId);

      // Update local state
      setUrls(
        urls.map((url) => ({
          ...url,
          active: url.url_id === urlId,
        })),
      );

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to set active URL:", err);
      setError("Failed to set active URL. Please try again.");
    }
  };

  // Start editing a URL
  const startEditingUrl = (url: URL) => {
    setEditingUrl(url);
    setNewUrl(url.url);
    setUrlName(url.name);
    setUrlDescription(url.description);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUrl(null);
    setNewUrl("");
    setUrlName("");
    setUrlDescription("");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">URL Management</h3>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">URL Management</h3>
        {!isAddingUrl && !editingUrl && (
          <button
            onClick={() => setIsAddingUrl(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add URL
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* URL Form (for adding or editing) */}
      {(isAddingUrl || editingUrl) && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium mb-3">
            {editingUrl ? "Edit URL" : "Add New URL"}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                placeholder="URL Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={urlDescription}
                onChange={(e) => setUrlDescription(e.target.value)}
                placeholder="URL Description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  if (editingUrl) cancelEditing();
                  else setIsAddingUrl(false);
                }}
                className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={editingUrl ? handleUpdateUrl : handleAddUrl}
                disabled={!newUrl}
                className={`px-3 py-1 rounded-md ${
                  newUrl
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {editingUrl ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL List */}
      {urls.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Globe className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p>No URLs associated with this QR code yet.</p>
          {!isAddingUrl && (
            <button
              onClick={() => setIsAddingUrl(true)}
              className="mt-3 text-blue-600 hover:underline"
            >
              Add your first URL
            </button>
          )}
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {urls.map((url) => (
            <div key={url.url_id} className="p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        url.active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></span>
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {url.url}
                    </a>
                  </div>
                  {url.name && (
                    <div className="text-sm font-medium mt-1">{url.name}</div>
                  )}
                  {url.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {url.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Added {new Date(url.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!url.active && (
                    <button
                      onClick={() => setActiveUrl(url.url_id)}
                      title="Set as Active URL"
                      className="p-1 text-gray-400 hover:text-green-700 rounded-full hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => startEditingUrl(url)}
                    title="Edit URL"
                    className="p-1 text-gray-400 hover:text-blue-700 rounded-full hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUrl(url.url_id)}
                    title="Delete URL"
                    className="p-1 text-gray-400 hover:text-red-700 rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info text */}
      <div className="mt-4 text-xs text-gray-500">
        <p className="flex items-start">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5 flex-shrink-0"></span>
          Active URLs are used when scanning this QR code directly.
        </p>
      </div>
    </div>
  );
};

export default URLManagement;
