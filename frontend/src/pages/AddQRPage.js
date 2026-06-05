import React, { useState } from "react";

const AddQRPage = () => {
  const [qrId, setQrId] = useState("");
  const [urls, setUrls] = useState([""]);

  const handleAddUrl = () => {
    setUrls([...urls, ""]);
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = () => {
    // Later, we’ll send these values to the backend
    console.log("QR ID:", qrId);
    console.log("URLs:", urls);
  };

  return (
    <div>
      <h1>Add QR Code</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <label>
          QR ID:
          <input value={qrId} onChange={(e) => setQrId(e.target.value)} />
        </label>
        <h3>URLs</h3>
        {urls.map((url, index) => (
          <div key={index}>
            <input
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={handleAddUrl}>
          Add another URL
        </button>
        <button type="submit" onClick={handleSubmit}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default AddQRPage;
