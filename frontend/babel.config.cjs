// babel.config.js
module.exports = {
  presets: [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          "@components": "./src/components",
          "@contexts": "./src/components/contexts",
          "@utils": "./src/utils",
        },
      },
    ],
  ],
};
