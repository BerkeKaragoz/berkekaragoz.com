import type { Config } from "jest"

const config: Config = {
   setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

   collectCoverageFrom: [
      "**/*.{js,jsx,ts,tsx,mts,cts}",
      "!**/*.d.ts",
      "!**/node_modules/**",
   ],

   moduleNameMapper: {
      // Module Path Aliases
      "^@/(.*)$": "<rootDir>/src/$1",

      // Handle CSS imports (without CSS modules)
      "^.+\\.(css|sass|scss)$": "<rootDir>/src/__mocks__/style.mock.js",

      // Handle image imports
      "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
         "<rootDir>/src/__mocks__/file.mock.js",

      // i18n
      i18next: "<rootDir>/src/__mocks__/i18next.mock.js",
      createRouter: "<rootDir>/src/__mocks__/createRouter.mock.ts",
   },

   testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],

   testEnvironment: "jsdom",

   transform: {
      "^.+\\.(js|jsx|ts|tsx|mts|cts)$": ["babel-jest", { presets: ["next/babel"] }],
   },

   transformIgnorePatterns: ["/node_modules/", "^.+\\.module\\.(css|sass|scss)$"],

   // Optional: Enable globals cleanup for better performance and memory usage
   testEnvironmentOptions: {
      globalsCleanup: "soft", // Change to 'on' if no warnings appear
   },
}

export default config
