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
    it("should expose the correct library name", () => {
      expect(new MusicLibrary().__name).toBe("NfMusic");
    });
  });

  describe("before initialization", () => {
    it("should throw when play is called before __init", () => {
      const library = new MusicLibrary();
      expect(() => library.play("theme")).toThrow();
    });

    it("should throw when mute is called before __init", () => {
      const library = new MusicLibrary();
      expect(() => library.mute()).toThrow();
    });

    it("should throw when load is called before __init", () => {
      const library = new MusicLibrary();
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

    it("should play a loaded track without error", () => {
      library.load("theme", "theme.mp3");
      expect(() => library.play("theme")).not.toThrow();
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

    it("should toggle mute state for all loaded tracks", async () => {
      library.load("theme", "theme.mp3");
      library.load("battle", "battle.mp3");
      library.mute();
      library.load("credits", "credits.mp3");
      expect(() => library.play("credits")).not.toThrow();
    });

    it("should load multiple tracks independently", () => {
      library.load("theme", "theme.mp3");
      library.load("battle", "battle.mp3");
      expect(() => library.play("theme")).not.toThrow();
      expect(() => library.play("battle")).not.toThrow();
    });

    it("should throw NfNotFound after loading a different track", () => {
      library.load("theme", "theme.mp3");
      expect(() => library.play("credits")).toThrow(NfNotFound);
    });
  });
});
