import type { ViewportFit, ViewportOptions, ViewportState } from "./viewport.type";

const DEFAULT_FIT: ViewportFit = "contain";
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

/**
 * Computes the viewport for a container size and a set of options.
 *
 * @remarks
 * Pure function — no DOM access. Used by core's viewport state and
 * reusable by any renderer that needs the same math.
 *
 * @param containerWidth - Container width, in CSS px.
 * @param containerHeight - Container height, in CSS px.
 * @param options - Design resolution and fit mode.
 * @param pixelRatio - Current `window.devicePixelRatio`.
 */
export const computeViewport = (
  containerWidth: number,
  containerHeight: number,
  options: ViewportOptions = {},
  pixelRatio = 1,
): ViewportState => {
  const fit = options.fit ?? DEFAULT_FIT;
  const designWidth = options.width ?? DEFAULT_WIDTH;
  const designHeight = options.height ?? DEFAULT_HEIGHT;

  const ratioX = designWidth > 0 ? containerWidth / designWidth : 1;
  const ratioY = designHeight > 0 ? containerHeight / designHeight : 1;

  let scaleX: number;
  let scaleY: number;
  if (fit === "fill") {
    scaleX = ratioX;
    scaleY = ratioY;
  } else {
    scaleX = scaleY = fit === "contain" ? Math.min(ratioX, ratioY) : Math.max(ratioX, ratioY);
  }

  const marginX = (containerWidth - designWidth * scaleX) / 2;
  const marginY = (containerHeight - designHeight * scaleY) / 2;

  return {
    containerWidth,
    containerHeight,
    pixelRatio,
    designWidth,
    designHeight,
    fit,
    scaleX,
    scaleY,
    visibleWidth: Math.min(containerWidth, designWidth * scaleX),
    visibleHeight: Math.min(containerHeight, designHeight * scaleY),
    contentLeft: Math.max(0, marginX),
    contentTop: Math.max(0, marginY),
    originX: Math.min(0, marginX),
    originY: Math.min(0, marginY),
  };
};
