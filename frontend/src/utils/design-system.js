// Design System for Dynamic QR Code Platform

export const DesignSystem = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: {
      50: "#E6F2FF",
      100: "#B3DAFF",
      200: "#80C2FF",
      300: "#4DAAFF",
      400: "#1A92FF",
      500: "#0077E6", // Main brand blue
      600: "#005CB3",
      700: "#004080",
      800: "#00264D",
      900: "#000D1A",
    },

    // Neutral Colors
    neutral: {
      50: "#FFFFFF",
      100: "#F5F5F5",
      200: "#E5E5E5",
      300: "#D4D4D4",
      400: "#A3A3A3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },

    // Accent Colors
    accent: {
      success: "#2ECC71",
      warning: "#F39C12",
      error: "#E74C3C",
      info: "#3498DB",
    },
  },

  // Typography
  typography: {
    fontFamily: {
      serif: "'Merriweather', 'Georgia', serif",
      sansSerif: "'Inter', 'Helvetica', 'Arial', sans-serif",
    },
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    weights: {
      thin: 100,
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      extraBold: 800,
      black: 900,
    },
  },

  // Spacing
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },

  // Border Radius
  borderRadius: {
    sm: "0.125rem",
    md: "0.25rem",
    lg: "0.5rem",
    xl: "1rem",
    full: "9999px",
  },

  // Shadow
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  // Transitions
  transitions: {
    fast: "0.2s ease-in-out",
    medium: "0.3s ease-in-out",
    slow: "0.5s ease-in-out",
  },
};

// Utility function to generate Tailwind config
export const generateTailwindConfig = () => {
  return {
    theme: {
      extend: {
        colors: DesignSystem.colors,
        fontFamily: {
          serif: DesignSystem.typography.fontFamily.serif,
          sans: DesignSystem.typography.fontFamily.sansSerif,
        },
        fontSize: DesignSystem.typography.sizes,
        fontWeight: DesignSystem.typography.weights,
        spacing: DesignSystem.spacing,
        borderRadius: DesignSystem.borderRadius,
        boxShadow: DesignSystem.shadows,
      },
      transitionDuration: DesignSystem.transitions,
    },
  };
};

// Accessibility and Usability Guidelines
export const AccessibilityGuidelines = {
  colorContrast: {
    minimumRatio: 4.5, // WCAG AA standard
    largeTextRatio: 3, // For larger text
  },
  typography: {
    minFontSize: "16px",
    lineHeight: {
      body: 1.5,
      heading: 1.2,
    },
  },
  focusStates: {
    outlineColor: DesignSystem.colors.primary[500],
    outlineWidth: "2px",
    outlineStyle: "solid",
  },
};

// Responsive Breakpoints
export const Breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Component Design Tokens
export const ComponentTokens = {
  button: {
    default: {
      backgroundColor: DesignSystem.colors.primary[500],
      textColor: DesignSystem.colors.neutral[50],
      borderRadius: DesignSystem.borderRadius.md,
      padding: `${DesignSystem.spacing.sm} ${DesignSystem.spacing.md}`,
      hover: {
        backgroundColor: DesignSystem.colors.primary[600],
      },
      disabled: {
        opacity: 0.5,
      },
    },
    variants: {
      outline: {
        borderColor: DesignSystem.colors.primary[500],
        backgroundColor: "transparent",
        textColor: DesignSystem.colors.primary[500],
      },
      ghost: {
        backgroundColor: "transparent",
        textColor: DesignSystem.colors.primary[500],
      },
    },
  },
  input: {
    default: {
      borderColor: DesignSystem.colors.neutral[300],
      borderRadius: DesignSystem.borderRadius.md,
      padding: DesignSystem.spacing.sm,
      focusBorderColor: DesignSystem.colors.primary[500],
    },
  },
};

// Export for potential use in styled-components or other CSS-in-JS solutions
export default {
  DesignSystem,
  AccessibilityGuidelines,
  Breakpoints,
  ComponentTokens,
};
