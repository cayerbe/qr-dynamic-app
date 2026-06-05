import React, { createContext, useContext, useState } from "react";

interface RecentQRContextValue {
  recentQRId: string | null;
  setRecentQRId: (qrId: string) => void;
}

const RecentQRContext = createContext<RecentQRContextValue | undefined>(
  undefined,
);

export const RecentQRProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [recentQRId, setRecentQRId] = useState<string | null>(null);

  return (
    <RecentQRContext.Provider value={{ recentQRId, setRecentQRId }}>
      {children}
    </RecentQRContext.Provider>
  );
};

export const useRecentQR = () => {
  const context = useContext(RecentQRContext);
  if (!context)
    throw new Error("useRecentQR must be used within RecentQRProvider");
  return context;
};
