// src/components/manufacturer/ManufacturerDashboard.tsx
import React from "react";

const ManufacturerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Manufacturer Dashboard</h1>

        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl">
          <p className="text-gray-600 mb-4">This page is under construction.</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700 text-center">
              Manufacturer dashboard functionality will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;
