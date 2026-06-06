import { getSDK } from "../index";

describe("SDK Bakery module", () => {
  const sdk = getSDK({ baseURL: "http://localhost:3000/api/v2" });

  it("should have all expected bakery methods", () => {
    expect(sdk.bakery).toBeDefined();
    expect(typeof sdk.bakery.getOverview).toBe("function");
    expect(typeof sdk.bakery.getBatches).toBe("function");
    expect(typeof sdk.bakery.createBatch).toBe("function");
    expect(typeof sdk.bakery.getRecipes).toBe("function");
    expect(typeof sdk.bakery.createRecipe).toBe("function");
    expect(typeof sdk.bakery.getIngredients).toBe("function");
    expect(typeof sdk.bakery.getBakers).toBe("function");
    expect(typeof sdk.bakery.getSettings).toBe("function");
  });

  it("should have auth methods", () => {
    expect(sdk.bakery.getAuthStatus).toBeDefined();
    expect(sdk.bakery.sso).toBeDefined();
    expect(sdk.bakery.logout).toBeDefined();
  });

  it("should allow setting API Key", () => {
    sdk.setApiKey("test-api-key");
    // Internal client state is hard to check without mocking axios,
    // but we can verify the method exists and runs.
  });

  it("should allow setting Member Token", () => {
    sdk.setMemberToken("test-member-token");
  });
});
