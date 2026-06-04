// Smoke test confirming the Jest + ts-jest (ESM) toolchain is wired correctly.
// Safe to delete once real test suites exist.
describe("test harness", () => {
  it("runs the jest suite", () => {
    expect(1 + 1).toBe(2);
  });
});
