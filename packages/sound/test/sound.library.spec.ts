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
    it("should expose the correct library name", () => {
      expect(new SoundLibrary().__name).toBe("NfSound");
    });
  });

  describe("before initialization", () => {
    it("should throw when play is called before __init", () => {
      const library = new SoundLibrary();
      expect(() => library.play("click")).toThrow();
    });

    it("should throw when mute is called before __init", () => {
      const library = new SoundLibrary();
      expect(() => library.mute()).toThrow();
    });

    it("should throw when load is called before __init", () => {
      const library = new SoundLibrary();
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

    it("should play a loaded sound without error", () => {
      library.load("click", "click.mp3");
      expect(() => library.play("click")).not.toThrow();
    });

    it("should call play on the audio element", () => {
      library.load("click", "click.mp3");
      library.play("click");
      expect(mock.play).toHaveBeenCalled();
    });

    it("should start muted and toggle mute state", async () => {
      library.load("click", "click.mp3");
      library.mute();
      library.load("beep", "beep.mp3");
      expect(() => library.play("beep")).not.toThrow();
    });

    it("should load multiple sounds independently", () => {
      library.load("click", "click.mp3");
      library.load("boom", "boom.mp3");
      expect(() => library.play("click")).not.toThrow();
      expect(() => library.play("boom")).not.toThrow();
    });

    it("should throw NfNotFound after loading a different sound", () => {
      library.load("click", "click.mp3");
      expect(() => library.play("boom")).toThrow(NfNotFound);
    });
  });
});
