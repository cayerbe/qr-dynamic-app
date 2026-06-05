declare module "qrcode.react" {
  import * as React from "react";

  export interface QRCodeProps {
    value: string;
    size?: number;
    level?: "L" | "M" | "Q" | "H";
    bgColor?: string;
    fgColor?: string;
    includeMargin?: boolean;
    renderAs?: "svg" | "canvas";
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate: boolean;
      x?: number;
      y?: number;
    };
  }

  const QRCode: React.ComponentType<QRCodeProps>;
  export default QRCode;
}
