module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "^firebase/auth$": "<rootDir>/__mocks__/firebase/auth.js",
    "^firebase/firestore$": "<rootDir>/__mocks__/firebase/firestore.js",
    "^axios$": "<rootDir>/__mocks__/axios.js",
    "^../common/Alert$": "<rootDir>/src/__mocks__/common/Alert.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(firebase|@firebase|@testing-library)/)",
  ],
};
