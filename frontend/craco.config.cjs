// craco.config.cjs
const path = require("path");

// Debug log to confirm CRACO is being used and print the resolved path
console.log("🔄 CRACO CONFIG IS LOADING");
console.log(
  "🛠 Webpack alias for @contexts is:",
  path.resolve(__dirname, "src/components/contexts"),
);

module.exports = {
  webpack: {
    alias: {
      "@contexts": path.resolve(__dirname, "src/components/contexts"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
};
