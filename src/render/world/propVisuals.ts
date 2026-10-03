import { getPropDef } from '../../data/worldData';

const PROP_FILL: Record<string, number> = {
  house_small: 0x2a3032,
  house_large: 0x172027,
  tree_large: 0x3c5143,
  tree_small: 0x65745d,
  shrine: 0x58456f,
  gate_town: 0x4b3a24,
  crate: 0x80633a,
  wall_stone: 0x687277,
};

export function propFillColor(propId: string): number {
  return PROP_FILL[propId] ?? 0x2a3032;
}

export function propVisualSize(propId: string): { w: number; h: number } {
  const def = getPropDef(propId);
  return { w: def.visualWidthPx, h: def.visualHeightPx };
}
