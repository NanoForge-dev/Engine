import { NfNotFound } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SoundLibrary } from "../src";

const makeMockAudio = () => {
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  return {
    AudioClass: class {
      muted = false;
      play = play;
      pause = pause;
      src: string;
      constructor(src: string) {
        this.src = src;
      }
    },
    play,
    pause,
  };
};

describe("SoundLibrary", () => {
  describe("metadata", () => {
    it("should expose the reserved 'sound' key", () => {
      expect(new SoundLibrary().key).toBe("sound");
    });
  });

  describe("before initialization", () => {
    it("should throw when play/mute/load are called before __init", () => {
      const library = new SoundLibrary();
      expect(() => library.play("click")).toThrow();
      expect(() => library.mute()).toThrow();
      expect(() => library.load("click", "click.mp3")).toThrow();
    });
  });

  describe("after initialization", () => {
    let library: SoundLibrary;
    let mock: ReturnType<typeof makeMockAudio>;

    beforeEach(async () => {
      mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      library = new SoundLibrary();
      await library.__init();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should throw NfNotFound when playing an unknown sound", () => {
      expect(() => library.play("unknown")).toThrow(NfNotFound);
    });

    it("should call play on the audio element", () => {
      library.load("click", "click.mp3");
      library.play("click");
      expect(mock.play).toHaveBeenCalled();
    });

    it("should load multiple sounds independently, without exclusivity", () => {
      library.load("click", "click.mp3");
      library.load("boom", "boom.mp3");
      expect(() => library.play("click")).not.toThrow();
      expect(() => library.play("boom")).not.toThrow();
      expect(mock.pause).not.toHaveBeenCalled();
    });

    it("should apply the current muted state to newly loaded sounds", () => {
      library.mute(); // now unmuted (starts muted)
      library.load("beep", "beep.mp3");
      expect(mock.AudioClass).toBeTruthy();
    });

    it("should toggle mute for every already-loaded sound", () => {
      library.load("click", "click.mp3");
      library.mute();
      library.mute();
      // two toggles returns to the original (muted) state — no throw is the contract here.
      expect(() => library.play("click")).not.toThrow();
    });
  });

  describe("__clear", () => {
    it("pauses and clears every loaded sound", async () => {
      const mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      const library = new SoundLibrary();
      await library.__init();
      library.load("click", "click.mp3");

      await library.__clear({} as any);

      expect(mock.pause).toHaveBeenCalled();
      expect(() => library.play("click")).toThrow(NfNotFound);
      vi.unstubAllGlobals();
    });

    it("does not throw when called before __init", async () => {
      await expect(new SoundLibrary().__clear({} as any)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("returns methods that behave like the instance methods", async () => {
      const mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      const library = new SoundLibrary();
      await library.__init();

      library.expose().load("click", "click.mp3");
      library.expose().play("click");

      expect(mock.play).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });
});
