module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  forceExit: true,
  detectOpenHandles: true
};
