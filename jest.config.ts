import type { Config } from "jest";

const config: Config = {
  moduleNameMapper: {
    "^@arc/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
};

export default config;
