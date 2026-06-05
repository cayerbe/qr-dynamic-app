import { QRCode, QRType, Campaign } from "../../services/types";

export const selectQRTypeColor = (type: QRType, property: string) => {
  switch (type) {
    case "dynamic":
      return property === "background" ? "bg-blue-500" : "text-blue-500";
    case "static":
      return property === "background" ? "bg-green-500" : "text-green-500";
    default:
      return "";
  }
};
