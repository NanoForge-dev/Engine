/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "test",
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../tests/coverage/unit",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  verbose: true,
  testTimeout: 5000
};