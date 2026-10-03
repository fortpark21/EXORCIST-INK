import { loadMovementConfig } from '../../data/movementConfig';
import type { HeroSnapshot } from '../../sim/GameSimulation';
import { clamp } from '../../sim/math/util';

const camCfg = loadMovementConfig().camera;

export class HeroCameraController {
  private centerX: number;
  private centerY: number;

  constructor(initialHero: HeroSnapshot, mapWidthPx: number, mapHeightPx: number) {
    this.centerX = clamp(initialHero.pivotX, camCfg.viewportWidthPx / 2, mapWidthPx - camCfg.viewportWidthPx / 2);
    this.centerY = clamp(initialHero.pivotY, camCfg.viewportHeightPx / 2, mapHeightPx - camCfg.viewportHeightPx / 2);
  }

  update(hero: HeroSnapshot, dtSec: number, mapWidthPx: number, mapHeightPx: number): { scrollX: number; scrollY: number } {
    const lookX = clamp(hero.velX * camCfg.lookaheadFactor, -camCfg.lookaheadMaxPx, camCfg.lookaheadMaxPx);
    const lookY = clamp(hero.velY * camCfg.lookaheadFactor, -camCfg.lookaheadMaxPx, camCfg.lookaheadMaxPx);
    const desiredX = hero.pivotX + lookX;
    const desiredY = hero.pivotY + lookY;

    let targetX = this.centerX;
    let targetY = this.centerY;
    const dzHalfW = camCfg.deadzoneWidthPx / 2;
    const dzHalfH = camCfg.deadzoneHeightPx / 2;

    const offX = desiredX - this.centerX;
    const offY = desiredY - this.centerY;
    if (Math.abs(offX) > dzHalfW) {
      targetX = desiredX - Math.sign(offX) * dzHalfW;
    }
    if (Math.abs(offY) > dzHalfH) {
      targetY = desiredY - Math.sign(offY) * dzHalfH;
    }

    const tauSec = camCfg.smoothTimeConstantMs / 1000;
    const alpha = 1 - Math.exp(-dtSec / tauSec);
    this.centerX += (targetX - this.centerX) * alpha;
    this.centerY += (targetY - this.centerY) * alpha;

    const halfW = camCfg.viewportWidthPx / 2;
    const halfH = camCfg.viewportHeightPx / 2;
    if (camCfg.clampToMapBounds) {
      this.centerX = clamp(this.centerX, halfW, mapWidthPx - halfW);
      this.centerY = clamp(this.centerY, halfH, mapHeightPx - halfH);
    }

    let scrollX = this.centerX - halfW;
    let scrollY = this.centerY - halfH;

    if (camCfg.pixelSnap) {
      scrollX = Math.round(scrollX);
      scrollY = Math.round(scrollY);
    }

    return { scrollX, scrollY };
  }
}
