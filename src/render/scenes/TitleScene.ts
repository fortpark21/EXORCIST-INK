import Phaser from 'phaser';
import type { SimRenderBridge } from '../../bridge/SimRenderBridge';
import { FONT_BODY, FONT_DISPLAY, GAME_HEIGHT, GAME_WIDTH } from '../../data/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  update(_time: number, delta: number): void {
    const bridge = this.registry.get('simBridge') as SimRenderBridge | undefined;
    bridge?.driveFrame(delta);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a0a');

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'EXORCIST INK', {
      fontFamily: FONT_DISPLAY,
      fontSize: '96px',
      color: '#d4af37',
      align: 'center',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.48,
      'ปรับปรุงสำนักวิญญาณ · ผู้ฝึกตน',
      {
        fontFamily: FONT_BODY,
        fontSize: '36px',
        color: '#e8e0d0',
        align: 'center',
      },
    );
    subtitle.setOrigin(0.5);

    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, 'Enter — เข้าเมือง placeholder (Phase 1)', {
      fontFamily: FONT_BODY,
      fontSize: '28px',
      color: '#888880',
      align: 'center',
    });
    hint.setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('WorldScene');
    });
  }
}
