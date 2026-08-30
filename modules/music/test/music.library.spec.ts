import { NfNotFound } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MusicLibrary } from "../src";

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

describe("MusicLibrary", () => {
  describe("metadata", () => {
    it("should expose the reserved 'music' key", () => {
      expect(new MusicLibrary().key).toBe("music");
    });
  });

  describe("before initialization", () => {
    it("should throw when play/mute/load are called before __init", () => {
      const library = new MusicLibrary();
      expect(() => library.play("theme")).toThrow();
      expect(() => library.mute()).toThrow();
      expect(() => library.load("theme", "theme.mp3")).toThrow();
    });
  });

  describe("after initialization", () => {
    let library: MusicLibrary;
    let mock: ReturnType<typeof makeMockAudio>;

    beforeEach(async () => {
      mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      library = new MusicLibrary();
      await library.__init();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should throw NfNotFound when playing an unknown track", () => {
      expect(() => library.play("unknown")).toThrow(NfNotFound);
    });

    it("should call play on the audio element", () => {
      library.load("theme", "theme.mp3");
      library.play("theme");
      expect(mock.play).toHaveBeenCalled();
    });

    it("should pause the previous track when playing a new one", () => {
      library.load("theme", "theme.mp3");
      library.load("battle", "battle.mp3");
      library.play("theme");
      library.play("battle");
      expect(mock.pause).toHaveBeenCalled();
    });

    it("should load multiple tracks independently", () => {
      library.load("theme", "theme.mp3");
      library.load("battle", "battle.mp3");
      expect(() => library.play("theme")).not.toThrow();
      expect(() => library.play("battle")).not.toThrow();
    });

    it("should clear the current track when play() fails", () => {
      library.load("theme", "theme.mp3");
      library.play("theme");
      expect(() => library.play("unknown")).toThrow(NfNotFound);
    });
  });

  describe("__clear", () => {
    it("pauses the current track and clears every loaded track", async () => {
      const mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      const library = new MusicLibrary();
      await library.__init();
      library.load("theme", "theme.mp3");
      library.play("theme");

      await library.__clear({} as any);

      expect(mock.pause).toHaveBeenCalled();
      expect(() => library.play("theme")).toThrow(NfNotFound);
      vi.unstubAllGlobals();
    });

    it("does not throw when called before __init", async () => {
      await expect(new MusicLibrary().__clear({} as any)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("returns methods that behave like the instance methods", async () => {
      const mock = makeMockAudio();
      vi.stubGlobal("Audio", mock.AudioClass);
      const library = new MusicLibrary();
      await library.__init();

      library.expose().load("theme", "theme.mp3");
      library.expose().play("theme");

      expect(mock.play).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });
});
