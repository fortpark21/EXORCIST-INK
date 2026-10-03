import type { AabbColliderDef } from './movement';

export type WorldPropDef = {
  id: string;
  displayName: string;
  visualWidthPx: number;
  visualHeightPx: number;
  colliders: AabbColliderDef[];
  fadeable: boolean;
  occlusionRect: AabbColliderDef | null;
};

export type WorldPropsData = {
  version: number;
  props: WorldPropDef[];
};

export type MapEntryPoint = {
  id: string;
  worldX: number;
  worldY: number;
  facing: number;
};

export type GameMapDef = {
  id: string;
  displayName: string;
  widthTiles: number;
  heightTiles: number;
  widthPx: number;
  heightPx: number;
  borderBlockedTiles: number;
  entryPoints: MapEntryPoint[];
};

export type MapsData = {
  version: number;
  tileSizePx: number;
  maps: GameMapDef[];
};

export type PlacedProp = {
  instanceId: string;
  propId: string;
  pivotX: number;
  pivotY: number;
};
