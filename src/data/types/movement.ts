export type AabbColliderDef = {
  widthPx: number;
  heightPx: number;
  offsetXPx: number;
  offsetYPx: number;
};

export type MovementConfig = {
  id: string;
  version: number;
  simTickHz: number;
  inputMapping: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
    attack: string[];
    potion: string[];
    interact: string[];
  };
  player: {
    walkSpeedPxPerSec: number;
    accelPxPerSec2: number;
    decelPxPerSec2: number;
    stopEpsilonPxPerSec: number;
    snappyReverse: boolean;
    walkAnimThresholdPxPerSec: number;
    normalizeDiagonal: boolean;
    diagonalComponent: number;
  };
  playerColliders: {
    foot: AabbColliderDef;
    hurt: AabbColliderDef;
  };
  directions: {
    indexOrder: string[];
    assetDirByIndex: string[];
    lookupTable: { values: number[] };
    keepFacingWhenNoInput: boolean;
  };
  animation: {
    idle: { fps: number; frames: number };
    walk: { fps: number; frames: number; slowFps: number; slowFpsBelowSpeedFraction: number };
    keepFrameOnWalkDirectionChange: boolean;
  };
  collision: {
    broadphase: { cellSizePx: number };
    subStepMaxPx: number;
    subStepTriggerPx: number;
    tileSizePx: number;
  };
  occlusion: {
    fadeAlpha: number;
    fadeInMs: number;
    fadeOutMs: number;
    holdTicks: number;
  };
  camera: {
    viewportWidthPx: number;
    viewportHeightPx: number;
    deadzoneWidthPx: number;
    deadzoneHeightPx: number;
    smoothTimeConstantMs: number;
    lookaheadFactor: number;
    lookaheadMaxPx: number;
    pixelSnap: boolean;
    clampToMapBounds: boolean;
  };
};
