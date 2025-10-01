module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/jest.setup.js",
    "/jest.config.js"
  ],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  forceExit: true,
  detectOpenHandles: true
};
