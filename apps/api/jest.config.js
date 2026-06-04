/**
 * Jest config for the API. The package is ESM ("type": "module") and source
 * uses NodeNext resolution (`.js` extensions on relative TS imports), so we run
 * ts-jest's ESM preset under `--experimental-vm-modules` (see the test script).
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src"],
  // Strip the `.js` suffix NodeNext requires on relative imports so ts-jest can
  // resolve the `.ts` source.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // ESM transform; uses the package tsconfig.json (which includes jest types).
    "^.+\\.ts$": ["ts-jest", { useESM: true }],
  },
  // Don't fail the suite (and the pre-push hook) before any tests exist yet.
  passWithNoTests: true,
};
