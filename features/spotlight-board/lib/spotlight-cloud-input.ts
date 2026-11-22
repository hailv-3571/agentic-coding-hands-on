import type { SpotlightName } from "../schemas/spotlight-views";
import { NAME_CLOUD_MAX } from "../spotlight-config";
import type { CloudLayoutInput, CloudRect } from "./spotlight-cloud-layout";
import {
  FIGMA_BOARD_WIDTH,
  NAME_CLOUD_MAX_NARROW,
  NARROW_BOARD_WIDTH,
  NARROW_MIN_FONT_SCALE,
  TIER_FONT_SIZES,
} from "./spotlight-ui-config";

/**
 * Board size → ALG-001 input: name cap (60, or 30 on a phone-width board), tier font sizes scaled
 * with the board (Figma sizes at 1157 px, never smaller, a little larger on phones) and the areas
 * the board's own controls occupy (positions mirror the component classes).
 */
function obstaclesFor(width: number, height: number): CloudRect[] {
  if (width < NARROW_BOARD_WIDTH) {
    return [
      { x: 0, y: 0, width, height: 64 }, // search + counter row
      { x: 0, y: height - 100, width, height: 100 }, // ticker + fullscreen button
    ];
  }
  const counterWidth = Math.min(380, width * 0.4);
  return [
    { x: 16, y: 16, width: 243, height: 56 }, // search pill (left 24, top 25, 219×39)
    { x: (width - counterWidth) / 2, y: 0, width: counterWidth, height: 68 }, // "{n} KUDOS"
    { x: width - 260, y: 16, width: 244, height: 48 }, // connection banner
    { x: 32, y: height - 160, width: Math.min(620, width * 0.6), height: 124 }, // ticker (left 48, bottom 44)
    { x: width - 88, y: height - 96, width: 88, height: 96 }, // fullscreen button
  ];
}

export function cloudInputFor(names: SpotlightName[], width: number, height: number): CloudLayoutInput {
  const narrow = width < NARROW_BOARD_WIDTH;
  const scale = Math.max(width / FIGMA_BOARD_WIDTH, narrow ? NARROW_MIN_FONT_SCALE : 1);
  return {
    names,
    max: narrow ? NAME_CLOUD_MAX_NARROW : NAME_CLOUD_MAX,
    width,
    height,
    fontSizes: TIER_FONT_SIZES.map((size) => Math.round(size * scale * 10) / 10),
    obstacles: obstaclesFor(width, height),
  };
}
