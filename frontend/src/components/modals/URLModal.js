import React, { useState } from "react";
import Alert from "../common/Alert";

/**
 * URL Management Modal Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.qr - QR code object with URLs
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onAddUrl - Function to add a new URL
 * @param {Function} props.onUpdateUrl - Function to update an existing URL
 * @param {Function} props.onDeleteUrl - Function to delete a URL
 */
const URLModal = ({ qr, onClose, onAddUrl, onUpdateUrl, onDeleteUrl }) => {
  const [urlData, setUrlData] = useState({
    newUrl: "",
    editingId: null,
    editingUrl: "",
  });
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Handle showing alerts
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });

    // Hide alert after 3 seconds
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  };

  // Start editing a URL
  const startEditing = (urlId, currentUrl) => {
    setUrlData({
      newUrl: "",
      editingId: urlId,
      editingUrl: currentUrl,
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setUrlData({
      newUrl: "",
      editingId: null,
      editingUrl: "",
    });
  };

  // Handle adding a new URL
  const handleAddUrl = async () => {
    if (!urlData.newUrl.trim()) {
      showAlert("error", "Please enter a URL");
      return;
    }

    const success = await onAddUrl(urlData.newUrl);

    if (success) {
      showAlert("success", "URL added successfully");
      setUrlData({ ...urlData, newUrl: "" });
    } else {
      showAlert("error", "Failed to add URL");
    }
  };

  // Handle updating a URL
  const handleUpdateUrl = async (urlId) => {
    if (!urlData.editingUrl.trim()) {
      showAlert("error", "URL cannot be empty");
      return;
    }

    const success = await onUpdateUrl(urlId, urlData.editingUrl);

    if (success) {
      showAlert("success", "URL updated successfully");
      cancelEditing();
    } else {
      showAlert("error", "Failed to update URL");
    }
  };

  // Handle deleting a URL
  const handleDeleteUrl = async (urlId) => {
    if (!window.confirm("Are you sure you want to delete this URL?")) {
      return;
    }

    const success = await onDeleteUrl(urlId);

    if (success) {
      showAlert("success", "URL deleted successfully");
    } else {
      showAlert("error", "Failed to delete URL");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>URL Management: {qr.name}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
          />
        )}

        <div className="modal-content">
          <div className="qr-summary">
            <img src={qr.imageUrl} alt={qr.name} className="qr-modal-image" />
            <div className="qr-info">
              <p>
                <strong>QR ID:</strong> {qr.qrId}
              </p>
              <p>
                <strong>Data:</strong> {qr.data}
              </p>
              <p>
                <strong>Scans:</strong> {qr.scanCount}
              </p>
            </div>
          </div>

          <div className="url-form">
            <h3>Add New URL</h3>
            <div className="form-group-inline">
              <input
                type="text"
                className="form-input"
                value={urlData.newUrl}
                onChange={(e) =>
                  setUrlData({ ...urlData, newUrl: e.target.value })
                }
                placeholder="Enter new URL"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddUrl}
              >
                <i className="fas fa-plus btn-icon"></i> Add
              </button>
            </div>
          </div>

          <div className="url-list">
            <h3>Associated URLs ({qr.urls.length})</h3>
            {qr.urls.length === 0 ? (
              <p className="empty-text">
                No URLs associated with this QR code.
              </p>
            ) : (
              <div className="url-list-container">
                {qr.urls.map((url) => (
                  <div key={url.id} className="url-item">
                    {urlData.editingId === url.id ? (
                      // Edit mode
                      <div className="url-edit-form">
                        <input
                          type="text"
                          className="form-input"
                          value={urlData.editingUrl}
                          onChange={(e) =>
                            setUrlData({
                              ...urlData,
                              editingUrl: e.target.value,
                            })
                          }
                        />
                        <div className="url-actions">
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handleUpdateUrl(url.id)}
                          >
                            <i className="fas fa-save"></i>
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={cancelEditing}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="url-text">
                          <span>{url.url}</span>
                          <small>
                            Created:{" "}
                            {url.createdAt.toDate().toLocaleDateString()}
                          </small>
                        </div>
                        <div className="url-actions">
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => startEditing(url.id, url.url)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => handleDeleteUrl(url.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default URLModal;
