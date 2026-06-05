import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// Define and export the prop types
export interface AlertProps {
  type: "error" | "warning" | "success" | "info";
  message: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Alert Component with enhanced visualization and interaction
 */
const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  className = "",
}) => {
  const typeConfigs = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-400",
      textColor: "text-green-800",
      iconColor: "text-green-600",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-400",
      textColor: "text-red-800",
      iconColor: "text-red-600",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-400",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-400",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
    },
  };

  const { icon: AlertIcon, ...config } = typeConfigs[type];

  return (
    <div
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        ${config.textColor}
        border rounded-lg p-4 
        flex items-center 
        shadow-sm
        ${className}
      `}
      role="alert"
    >
      <AlertIcon
        className={`mr-3 ${config.iconColor} flex-shrink-0`}
        size={24}
      />

      <div className="flex-grow">
        <p className="font-medium">{message}</p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`
            ml-4 
            hover:bg-gray-100 
            rounded-full 
            p-1 
            transition 
            ${config.textColor}
          `}
          aria-label="Close alert"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default Alert;
