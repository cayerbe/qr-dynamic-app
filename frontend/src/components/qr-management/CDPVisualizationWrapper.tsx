import React from "react";
import { useParams } from "react-router-dom";
import CDPVisualization from "./CDPVisualization";

const CDPVisualizationWrapper: React.FC = () => {
  const { qrId } = useParams<{ qrId?: string }>();

  if (!qrId) {
    return (
      <div className="text-center text-red-600 mt-10">
        <p className="text-xl font-semibold">⚠️ QR ID is missing</p>
        <p className="text-sm text-gray-500 mt-2">
          Please use a valid link with a QR ID, such as{" "}
          <code>/cdp-visualization/QR_XXXXXX</code>
        </p>
      </div>
    );
  }

  return <CDPVisualization qrId={qrId} />;
};

export default CDPVisualizationWrapper;
