# EXORCIST INK — Audio Integration Notes (สำหรับนัท)

> เป้าหมาย: นัทเอาไป implement ชั้นเสียงฝั่ง **presentation** ได้โดยไม่ต้องถามมิวซ้ำ
> กฎเหล็ก: **`src/sim/` ห้าม import / ห้ามเรียกเสียงเอง — sim ยิง event เท่านั้น**

## 1. Event ที่ sim ต้องยิงออกมา (checklist ให้นัท)

ทุก event ควรมี `x, y` (ตำแหน่งโลก) เสมอถ้าเกี่ยวกับการต่อสู้/มอน/ไอเท็ม เพื่อให้ชั้นเสียงทำ 2D panning + ระยะได้

### Scene / Zone

| Event | Payload | ชั้นเสียงทำอะไร |
|---|---|---|
| `scene:enter` | `{ scene: "title" \| "class_select" }` | เล่น BGM title/class_select |
| `zone:enter` | `{ zone: "town" \| "field" \| "dungeon" \| "shrine", sub?: "forest" }` | crossfade BGM + ambience (เวลา fade ดู Design §2) |
| `zone:exit` | `{ zone }` | fade out BGM/ambience เก่า |
| `combat:state_changed` | `{ state: "in_combat" \| "exploration" }` | fade in/out combat layer (ดู Design §3) |
| `combat:idle_timeout` | `{}` (หลังเงียบ 5s) | fade out combat layer 2000ms |

### Hero

| Event | Payload | ชั้นเสียงทำอะไร |
|---|---|---|
| `hero:step` | `{ surface: "stone" \| "grass", x, y }` | เล่น `sfx_hero_step_*` (สุ่ม var + pitch) |
| `hero:damaged` | `{ amount, x, y }` | เล่น `sfx_hero_hurt` |
| `hero:died` | `{ x, y }` | เล่น `sfx_hero_death` + ducking BGM −10 dB ค้าง |
| `hero:dodge` | `{ x, y }` | เล่น `sfx_hero_dodge` (ถ้ายังไม่มีระบบ = ไม่ต้องยิง) |
| `skill:cast` | `{ skillId, x, y }` | เล่น `sfx_hero_skill_cast` (map skillId → cue ย่อย) |
| `skill:impact` | `{ skillId, x, y, hitCount }` | เล่น `sfx_hero_skill_impact` |
| `item:use` | `{ itemId: "potion_hp" \| ..., x, y }` | เล่น `sfx_hero_potion` + `sfx_combat_heal` |

### Monster (Demon Boar — เฟสนี้มีตัวเดียว)

| Event | Payload | ชั้นเสียงทำอะไร |
|---|---|---|
| `monster:aggro` | `{ monsterType: "demon_boar", id, x, y }` | เล่น `sfx_boar_aggro` (volume/lowpass ตามระยะจาก hero) |
| `monster:charge` | `{ monsterType: "demon_boar", id, x, y }` | เล่น `sfx_boar_charge` |
| `monster:attack` | `{ monsterType: "demon_boar", id, x, y }` | เล่น `sfx_boar_attack` |
| `monster:damaged` | `{ monsterType: "demon_boar", id, x, y, amount }` | เล่น `sfx_boar_hurt` (cooldown 80ms) |
| `monster:died` | `{ monsterType: "demon_boar", id, x, y }` | เล่น `sfx_boar_death` + `sfx_combat_kill` |

### Combat / Loot / Progress (sim ยิง)

| Event | Payload | ชั้นเสียงทำอะไร |
|---|---|---|
| `combat:swing` | `{ attacker: "hero" \| monsterId, x, y }` | เล่น `sfx_hero_sword_swing` (เฉพาะ hero; มอนใช้ attack ของตัวเอง) |
| `combat:hit` | `{ isCritical: boolean, x, y, targetType: "boar" \| "hero" }` | ปกติ → `sfx_combat_hit` / crit → `sfx_combat_critical` |
| `combat:kill` | `{ targetType, x, y }` | เล่น `sfx_combat_kill` |
| `combat:heal` | `{ amount, x, y }` | เล่น `sfx_combat_heal` |
| `loot:pickup` | `{ itemId, x, y }` | เล่น `sfx_loot_pickup` |
| `loot:gold` | `{ amount, x, y }` | เล่น `sfx_loot_gold` (pitch ตาม amount ได้) |
| `progress:exp_gain` | `{ amount }` | เล่น `sfx_exp_tick` (cooldown 60ms) |
| `progress:level_up` | `{ level, x, y }` | เล่น `sfx_levelup` + ducking BGM −6 dB 1.5s |
| `quest:accept` | `{ questId }` | เล่น `sfx_quest_accept` |
| `quest:complete` | `{ questId }` | เล่น `sfx_quest_complete` + ducking BGM −4 dB 1.0s |

### UI / Shop / Upgrade (UI ยิงเอง ไม่ผ่าน sim)

| Event | Payload | หมายเหตุ |
|---|---|---|
| `ui:window_open` / `ui:window_close` | `{ windowId: "status" \| "skill" \| "cultivation" \| "inventory" \| "upgrade" \| "shop" }` | ผูกกับปุ่มเปิดปิดทุกหน้าต่าง |
| `ui:hover` | `{ elementId }` | cooldown 40ms |
| `ui:select` | `{ elementId }` | — |
| `ui:confirm` / `ui:cancel` / `ui:error` | `{ context?, reason? }` | error ใช้เสียง knock ทุ้ม ไม่แหลม |
| `shop:buy` / `shop:sell` | `{ itemId, price }` | โทน buy/sell ต่างกันนิดหน่อย |
| `upgrade:success` / `upgrade:fail` | `{ level, itemId }` | success มี 3 ขั้นเสียงตาม level (+3/+6/+9), ducking เฉพาะ success |

## 2. โครงสร้าง AudioManager ที่แนะนำ (presentation เท่านั้น)

```text
src/presentation/audio/
├── AudioManager.ts    # ตัวกลาง: subscribe event bus, สั่งเล่น/หยุด/fade, เก็บ bus volume
├── buses.ts           # สร้าง Master/BGM/SFX/UI/Ambience gain node + limiter
├── voicePool.ts       # จำกัด voice/cooldown/steal ตามสเปก Design §5
├── cueMap.ts          # map Cue ID → ไฟล์เสียง + default volume/priority (copy จาก CUE_LIST)
└── spatial.ts         # คำนวณ 2D panning + volume ตามระยะ (x/y เทียบกับกล้อง/hero)
```

**หน้าที่แต่ละส่วน:**

1. `AudioManager.init(eventBus)` — subscribe event ตามตาราง §1 ทั้งหมดทีเดียวตอน boot
2. `buses.ts` — สร้าง gain ต่อ bus ผ่าน Phaser Sound (`this.sound.add` + `setVolume`) หรือ Web Audio gain ตรง ๆ; โหลดค่าที่ผู้เล่นตั้งจาก localStorage
3. `voicePool.ts` — ก่อนเล่นทุกครั้งเช็ก `maxVoices + cooldown + priority steal` ถ้าไม่ผ่านให้ทิ้งเสียง (ไม่ queue)
4. `cueMap.ts` — ตารางเดียวที่ผูก Cue ID ↔ ไฟล์ ↔ volume/priority — เพิ่มเสียงใหม่แก้ไฟล์นี้ไฟล์เดียว
5. `spatial.ts` — สูตรง่าย ๆ: `pan = clamp((x - cameraX) / halfViewWidth)` + `vol -= distance * falloff`; เสียง UI ข้าม spatial (เล่นตรงกลางเสมอ)

**ตัวอย่างโฟลว์ (pseudo-code ให้นัท):**

```ts
// sim (ห้ามแตะเสียง):
bus.emit("combat:hit", { isCritical: true, x: 120, y: 80, targetType: "boar" });

// presentation/audio:
on("combat:hit", (e) => {
  const cue = e.isCritical ? "sfx_combat_critical" : "sfx_combat_hit";
  audio.play(cue, { x: e.x, y: e.y }); // voicePool + spatial จัดการข้างใน
});
```

## 3. กติกา sim ↔ เสียง (ห้ามแหก)

1. **ห้ามให้ `src/sim/` import อะไรจาก presentation/audio** — ตรวจได้ด้วย lint/grep ตอนรีวิว
2. sim ส่งแค่ **ข้อมูลดิบ** (ใคร ตีใคร คริไหม ตรงไหน) — การเลือก cue/var/pitch/volume เป็นงานของชั้นเสียง
3. ห้ามส่งชื่อ cue ตรง ๆ จาก sim (เช่น `playSound("crit")`) — ส่ง event เชิงความหมาย (`combat:hit { isCritical: true }`) แล้วให้ AudioManager map เอง เผื่อเปลี่ยนดีไซน์เสียงทีหลังไม่ต้องแก้ sim
4. Event ต้องยิงแม้ปิดเสียง — การ mute คือปิดที่ bus ไม่ใช่หยุดยิง event (กันบั๊ก state เพี้ยน)

## 4. ข้อควรระวัง Web Audio บนเบราว์เซอร์

- **Autoplay policy**: เบราว์เซอร์ล็อกเสียงจนกว่าผู้ใช้จะมี gesture (คลิก/แตะ/กดปุ่ม) ครั้งแรก — วิธีรับมือ:
  1. ผูก `this.sound.unlock` / resume AudioContext กับปุ่มแรกบนหน้า Title (เช่น "เริ่มเกม" / "แตะเพื่อเริ่ม")
  2. ก่อน unlock ห้าม `play()` BGM — ให้รอ event `pointerdown` ครั้งแรกแล้วค่อย `AudioManager.unlock()` แล้วเล่น `bgm_title`
  3. เทสบน Chrome + Safari จริง (Safari เข้มสุด)
- **Preload/decode**: ใช้ `this.load.audio()` ของ Phaser ตอน preload scene; ไฟล์ BGM ยาวให้ `decode` ล่วงหน้าก่อนเข้าโซน ห้าม decode กลางไฟต์ (จะกระตุก)
- **iOS/Safari**: ต้องมี fallback `.m4a` (ดู Design §7) + ระวัง `loop` แบบ seamless บน Safari อาจมีรอยต่อ — เผื่อ crossfade สั้น ๆ 100ms ช่วย
- **Performance**: เสียงไม่ควรกิน frame — หลีกเลี่ยง `setInterval` ต่อเสียง, ใช้ event-driven + fade ด้วย tween ของ Phaser; voice รวมไม่เกิน ~16 (ดู Design §5.3)

## 5. โครงสร้างโฟลเดอร์ + กติกาตั้งชื่อไฟล์

```text
public/assets/audio/
├── bgm/
│   ├── bgm_title_intro.ogg / .m4a
│   ├── bgm_title_loop.ogg / .m4a
│   ├── bgm_town_night_loop.ogg
│   └── ... (ชื่อเดียวกับ Cue ID + _intro/_loop ถ้ามี)
├── ambience/
│   ├── amb_town_night.ogg
│   └── ...
├── sfx/
│   ├── hero/
│   │   ├── sfx_hero_sword_swing_01.ogg
│   │   ├── sfx_hero_sword_swing_02.ogg
│   │   └── ...
│   ├── boar/
│   │   ├── sfx_boar_aggro_01.ogg
│   │   └── ...
│   ├── combat/
│   └── loot/
└── ui/
    ├── ui_window_open.ogg
    ├── ui_upgrade_success_01.ogg  # _01=+0..3, _02=+4..6, _03=+7 ขึ้นไป
    └── ...
```

**กติกา:**

1. ชื่อไฟล์ = **Cue ID ตรงตัว** + `_NN` ต่อท้ายถ้ามีหลาย variation (`sfx_hero_sword_swing_01`, `_02`, `_03`)
2. BGM แยก `*_intro` / `*_loop` ชัดเจน ห้ามรวมในไฟล์เดียว
3. ใช้ **snake_case ตัวเล็ก** เท่านั้น ห้ามเว้นวรรค ห้ามภาษาไทยในชื่อไฟล์
4. `cueMap.ts` อ้าง path จากโครงนี้ตรง ๆ — ย้ายไฟล์ = แก้ map ทีเดียว
5. ไฟล์เสียงจริงยังไม่ต้องมีในเฟสนี้ — นัทใช้ **placeholder silent/short beep** ชื่อเดียวกันไปก่อนได้ เกมต้องรันได้โดยไม่ crash ถ้าไฟล์ยังไม่มา (ใส่ `onLoadError` fallback เงียบ ๆ)

## 6. เช็กลิสต์ส่งงานกลับให้มิว (เมื่อนัท implement เสร็จ)

- [ ] Event ทั้งตาราง §1 ยิงครบ + มี x/y ครบ
- [ ] AudioManager subscribe ครบ ไม่มี sim import เสียง
- [ ] Crossfade town⇄field 800/1200ms + combat layer 400ms เข้า / 2000ms ออก
- [ ] Voice limiting ตาม Design §5 (รุม boar 5 ตัวไม่แตก)
- [ ] Ducking levelup/upgrade_success −6 dB ทำงาน
- [ ] ปรับ volume 5 bus ในเมนูตั้งค่า + จำค่าข้ามเซสชัน
- [ ] คลิกครั้งแรกบน Title แล้วเสียงติด (autoplay unlock)
