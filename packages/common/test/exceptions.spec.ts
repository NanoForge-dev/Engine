import { describe, expect, it } from "vitest";

import { NfConfigException, NfFetchException, NfNotFound, NfNotInitializedException } from "../src";

describe("NfNotInitializedException", () => {
  it("should have code 404", () => {
    expect(new NfNotInitializedException("Foo").code).toBe(404);
  });

  it("should include item name in message", () => {
    expect(new NfNotInitializedException("Foo").message).toContain("Foo not initialized.");
  });

  it("should include type prefix when provided", () => {
    expect(new NfNotInitializedException("Foo", "Library").message).toContain(
      "Library - Foo not initialized.",
    );
  });

  it("should omit type prefix when not provided", () => {
    expect(new NfNotInitializedException("Foo").message).not.toContain(" - ");
  });

  it("should have [NANOFORGE] prefix", () => {
    expect(new NfNotInitializedException("Foo").message).toMatch(/^\[NANOFORGE]/);
  });

  it("should be an instance of Error", () => {
    expect(new NfNotInitializedException("Foo")).toBeInstanceOf(Error);
  });
});

describe("NfNotFound", () => {
  it("should have code 404", () => {
    expect(new NfNotFound("Foo").code).toBe(404);
  });

  it("should include item name in message", () => {
    expect(new NfNotFound("Foo").message).toContain("Foo not found.");
  });

  it("should include type prefix when provided", () => {
    expect(new NfNotFound("Foo", "Asset").message).toContain("Asset - Foo not found.");
  });

  it("should omit type prefix when not provided", () => {
    expect(new NfNotFound("Foo").message).not.toContain(" - ");
  });

  it("should have [NANOFORGE] prefix", () => {
    expect(new NfNotFound("Foo").message).toMatch(/^\[NANOFORGE]/);
  });

  it("should be an instance of Error", () => {
    expect(new NfNotFound("Foo")).toBeInstanceOf(Error);
  });
});

describe("NfFetchException", () => {
  it("should reflect the given status code", () => {
    expect(new NfFetchException(404, "Not Found").code).toBe(404);
  });

  it("should reflect a different status code", () => {
    expect(new NfFetchException(500, "Internal Server Error").code).toBe(500);
  });

  it("should include status code and text in message", () => {
    expect(new NfFetchException(404, "Not Found").message).toContain("404 - Not Found");
  });

  it("should have [NANOFORGE] prefix", () => {
    expect(new NfFetchException(404, "Not Found").message).toMatch(/^\[NANOFORGE]/);
  });

  it("should be an instance of Error", () => {
    expect(new NfFetchException(404, "Not Found")).toBeInstanceOf(Error);
  });
});

describe("NfConfigException", () => {
  it("should have code 400", () => {
    expect(new NfConfigException("bad value").code).toBe(400);
  });

  it("should include message in output", () => {
    expect(new NfConfigException("bad value").message).toContain("bad value");
  });

  it("should include library name when provided", () => {
    expect(new NfConfigException("bad value", "MyLib").message).toContain("(MyLib)");
  });

  it("should omit library name when not provided", () => {
    expect(new NfConfigException("bad value").message).not.toContain("(");
  });

  it("should have [NANOFORGE] prefix", () => {
    expect(new NfConfigException("bad value").message).toMatch(/^\[NANOFORGE]/);
  });

  it("should be an instance of Error", () => {
    expect(new NfConfigException("bad value")).toBeInstanceOf(Error);
  });
});
