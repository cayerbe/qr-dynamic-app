import React, { useState } from "react";
import { Loader2, Settings } from "lucide-react";

// Define types for props
type SpinnerSize = "small" | "medium" | "large" | "sm" | "md" | "lg";
type SpinnerColor = "blue" | "gray" | "green" | "red" | "purple";

// Extended props interface
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "medium",
  color = "blue",
  className = "",
  ...divProps
}) => {
  // Normalize size
  const normalizedSize =
    size === "sm"
      ? "small"
      : size === "md"
        ? "medium"
        : size === "lg"
          ? "large"
          : size;

  // Size configurations
  const sizeConfigs = {
    small: {
      dimension: "w-4 h-4",
      iconSize: 16,
    },
    medium: {
      dimension: "w-8 h-8",
      iconSize: 24,
    },
    large: {
      dimension: "w-12 h-12",
      iconSize: 32,
    },
  };

  // Color configurations
  const colorConfigs = {
    blue: "text-blue-500",
    gray: "text-gray-500",
    green: "text-green-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  return (
    <div
      className={`flex justify-center items-center ${className}`}
      {...divProps}
    >
      <Loader2
        className={`
          ${sizeConfigs[normalizedSize].dimension} 
          ${colorConfigs[color]} 
          animate-spin
        `}
        size={sizeConfigs[normalizedSize].iconSize}
      />
    </div>
  );
};

export default Spinner;

// Optionally keep the preview component as a named export if needed
export const SpinnerPreview: React.FC = () => {
  const [activeStyle, setActiveStyle] = useState<{
    size: SpinnerSize;
    color: SpinnerColor;
  }>({
    size: "medium",
    color: "blue",
  });

  // Spinner configurations to showcase
  const spinnerConfigs = [
    { size: "small", color: "blue" },
    { size: "medium", color: "green" },
    { size: "large", color: "red" },
    { size: "small", color: "purple" },
    { size: "medium", color: "gray" },
  ] as const;

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
          Spinner Component Showcase
        </h1>

        {/* Active Spinner Display */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-6 text-center">
          <h2 className="text-xl font-semibold mb-4">
            Current Spinner Configuration
          </h2>
          <div className="flex justify-center items-center space-x-4">
            <Spinner
              size={activeStyle.size}
              color={activeStyle.color}
              className="mr-4"
            />
            <div>
              <p>
                Size: <span className="font-bold">{activeStyle.size}</span>
              </p>
              <p>
                Color: <span className="font-bold">{activeStyle.color}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Spinner Configurations */}
        <div className="grid md:grid-cols-3 gap-4">
          {spinnerConfigs.map((config, index) => (
            <div
              key={index}
              className={`
                bg-white rounded-lg shadow-md p-4 
                flex flex-col items-center justify-center 
                cursor-pointer 
                hover:shadow-lg 
                transition-all
                ${
                  activeStyle.size === config.size &&
                  activeStyle.color === config.color
                    ? "border-2 border-blue-500"
                    : "border border-transparent"
                }
              `}
              onClick={() => setActiveStyle(config)}
            >
              <Spinner size={config.size} color={config.color} />
              <div className="mt-2 text-center">
                <p className="font-medium">
                  {config.size} | {config.color}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Settings className="mr-2 text-blue-600" />
            Component Usage
          </h3>
          <div className="bg-white p-4 rounded-md">
            <pre className="text-sm text-gray-700">
              {`// Basic Usage
<Spinner />

// Custom Size and Color
<Spinner 
  size="large" 
  color="green" 
  className="custom-class" 
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
