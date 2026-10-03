import Phaser from 'phaser';
import type { SimRenderBridge } from '../../bridge/SimRenderBridge';
import type { SimulationSnapshot } from '../../sim/GameSimulation';
import { FONT_BODY, TILE_SIZE_PX } from '../../data/constants';
import { HeroCameraController } from '../camera/HeroCameraController';
import { buildInputFrame } from '../input/InputFrameBuilder';
import { computePropAlpha } from '../world/occlusionFade';
import { HeroSpriteView } from '../hero/HeroSpriteView';
import { propFillColor, propVisualSize } from '../world/propVisuals';

type PropVisual = {
  gfx: Phaser.GameObjects.Rectangle;
  holdTicks: number;
  alpha: number;
};

export class WorldScene extends Phaser.Scene {
  private bridge?: SimRenderBridge;
  private unsub: (() => void) | undefined = undefined;
  private heroView?: HeroSpriteView;
  private cameraCtrl?: HeroCameraController;
  private propVisuals = new Map<string, PropVisual>();
  private groundLayer?: Phaser.GameObjects.Container;
  private hudText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.bridge = this.registry.get('simBridge') as SimRenderBridge;
    this.bridge.start();

    const snap = this.bridge.getSnapshot();
    this.cameras.main.setBounds(0, 0, snap.mapWidthPx, snap.mapHeightPx);
    this.cameras.main.setBackgroundColor('#26352f');

    this.groundLayer = this.add.container(0, 0);
    this.drawGround(snap.mapWidthPx, snap.mapHeightPx);

    for (const prop of snap.placedProps) {
      const size = propVisualSize(prop.propId);
      const rect = this.add.rectangle(prop.pivotX, prop.pivotY, size.w, size.h, propFillColor(prop.propId));
      rect.setOrigin(0.5, 1);
      rect.setDepth(Math.round(prop.pivotY * 10));
      this.propVisuals.set(prop.instanceId, { gfx: rect, holdTicks: 0, alpha: 1 });
    }

    this.heroView = new HeroSpriteView(this, snap.hero);
    this.heroView.setDepth(Math.round(snap.hero.pivotY * 10) + 1);

    this.cameraCtrl = new HeroCameraController(snap.hero, snap.mapWidthPx, snap.mapHeightPx);
    const scroll = this.cameraCtrl.update(snap.hero, 0, snap.mapWidthPx, snap.mapHeightPx);
    this.cameras.main.setScroll(scroll.scrollX, scroll.scrollY);

    this.hudText = this.add
      .text(24, 24, 'WASD / ลูกศร — เดิน · Phase 1 placeholder', {
        fontFamily: FONT_BODY,
        fontSize: '24px',
        color: '#e8e0d0',
        backgroundColor: '#11161acc',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(1_000_000);

    this.unsub = this.bridge.subscribe((next) => this.applySnapshot(next, 0));
  }

  update(_time: number, delta: number): void {
    const bridge = this.bridge;
    if (!bridge || !this.input.keyboard) {
      return;
    }
    bridge.submitInputFrame(buildInputFrame(this.input.keyboard));
    bridge.driveFrame(delta);

    const snap = bridge.getSnapshot();
    this.applySnapshot(snap, delta);
    if (this.cameraCtrl) {
      const scroll = this.cameraCtrl.update(snap.hero, delta / 1000, snap.mapWidthPx, snap.mapHeightPx);
      this.cameras.main.setScroll(scroll.scrollX, scroll.scrollY);
    }

    this.hudText?.setText(
      `WASD / ลูกศร — เดิน · (${Math.round(snap.hero.pivotX)}, ${Math.round(snap.hero.pivotY)}) · ${snap.hero.animState}`,
    );
  }

  shutdown(): void {
    this.unsub?.();
    this.unsub = undefined;
  }

  private applySnapshot(snap: SimulationSnapshot, dtMs: number): void {
    if (this.heroView) {
      this.heroView.setPosition(snap.hero.pivotX, snap.hero.pivotY);
      this.heroView.setDepth(Math.round(snap.hero.pivotY * 10) + 1);
      this.heroView.syncFromSnapshot(snap.hero);
    }

    for (const prop of snap.placedProps) {
      const visual = this.propVisuals.get(prop.instanceId);
      if (!visual) continue;
      const fade = computePropAlpha(prop, snap.hero, visual.alpha, dtMs, visual.holdTicks);
      visual.alpha = fade.alpha;
      visual.holdTicks = fade.holdTicksRemaining;
      visual.gfx.setAlpha(fade.alpha);
      visual.gfx.setDepth(Math.round(prop.pivotY * 10));
    }
  }

  private drawGround(mapWidthPx: number, mapHeightPx: number): void {
    const layer = this.groundLayer;
    if (!layer) return;
    const cols = Math.ceil(mapWidthPx / TILE_SIZE_PX);
    const rows = Math.ceil(mapHeightPx / TILE_SIZE_PX);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const color = (row + col) % 2 === 0 ? 0x65745d : 0x3c5143;
        const tile = this.add.rectangle(
          col * TILE_SIZE_PX + TILE_SIZE_PX / 2,
          row * TILE_SIZE_PX + TILE_SIZE_PX / 2,
          TILE_SIZE_PX,
          TILE_SIZE_PX,
          color,
        );
        tile.setDepth(-100_000);
        layer.add(tile);
      }
    }
  }
}
