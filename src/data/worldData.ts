import mapsJson from './json/maps.json';
import worldPropsJson from './json/world-props.json';
import type { GameMapDef, MapsData, WorldPropDef, WorldPropsData } from './types/world';

let propsCached: WorldPropsData | null = null;
let mapsCached: MapsData | null = null;

export function loadWorldProps(): WorldPropsData {
  if (!propsCached) {
    propsCached = worldPropsJson as WorldPropsData;
  }
  return propsCached;
}

export function loadMapsData(): MapsData {
  if (!mapsCached) {
    mapsCached = mapsJson as MapsData;
  }
  return mapsCached;
}

export function getMapById(mapId: string): GameMapDef {
  const maps = loadMapsData();
  const found = maps.maps.find((m) => m.id === mapId);
  if (!found) {
    throw new Error(`Unknown map id: ${mapId}`);
  }
  return found;
}

export function getPropDef(propId: string): WorldPropDef {
  const props = loadWorldProps();
  const found = props.props.find((p) => p.id === propId);
  if (!found) {
    throw new Error(`Unknown prop id: ${propId}`);
  }
  return found;
}

export function clearWorldDataCacheForTests(): void {
  propsCached = null;
  mapsCached = null;
}
