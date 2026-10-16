import { describe, expect, it } from "vitest";

import { clientOnlyError, nextButtonState } from "../../src/shared";

describe("nextButtonState", () => {
  it("should flag the frame a button goes down", () => {
    expect(nextButtonState(true, false)).toEqual({
      pressed: true,
      justPressed: true,
      justReleased: false,
    });
  });

  it("should flag the frame a button goes up", () => {
    expect(nextButtonState(false, true)).toEqual({
      pressed: false,
      justPressed: false,
      justReleased: true,
    });
  });

  it("should not flag a held or idle button", () => {
    expect(nextButtonState(true, true)).toEqual({
      pressed: true,
      justPressed: false,
      justReleased: false,
    });
    expect(nextButtonState(false)).toEqual({
      pressed: false,
      justPressed: false,
      justReleased: false,
    });
  });
});

describe("clientOnlyError", () => {
  it("should name the library and the reason", () => {
    expect(clientOnlyError("MyLibrary", "no window").message).toBe(
      "MyLibrary must be registered on the client (no window).",
    );
  });
});
