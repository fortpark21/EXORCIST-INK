# EXORCIST INK — Cue List (Phase 1–2)

> รอบนี้ส่ง **cue list + สเปกเท่านั้น ยังไม่ผลิตไฟล์เสียงจริง**
> Engine: Phaser 3 (>=3.60) Web Audio / เสียงอยู่ฝั่ง presentation เท่านั้น — sim ยิง event แล้วชั้นเสียง subscribe
> ไฟล์เสียงจริงจะมาทีหลัง ชื่อไฟล์ใน `public/assets/audio/` ต้องตรงกับ **Cue ID** (ดู `AUDIO_INTEGRATION.md`)

## วิธีอ่านตาราง

- **ชนิด**: BGM / SFX / UI / Ambience
- **Trigger**: ชื่อ event ที่ sim หรือ UI ยิงออกมา (นัทเอาไปตั้งชื่อ event จริงได้เลย ดูรายละเอียด payload ใน `AUDIO_INTEGRATION.md`)
- **Loop**: loop = เล่นวน / one-shot = เล่นครั้งเดียวจบ
- **Vol**: ระดับเสียงสัมพัทธ์เทียบกับ bus ของตัวเอง (0.0–1.0 + ค่า dB โดยประมาณในวงเล็บ)
- **Priority**: `critical` > `high` > `normal` > `low` > `ambient` — เสียงล้นให้ตัดจากล่างขึ้นบน (ดู `AUDIO_DESIGN.md` หัวข้อ voice limiting)
- **Var**: จำนวน variation (ไฟล์เสียงย่อยที่สุ่มสลับกัน)

---

## 1. BGM (7 cues)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `bgm_title` | BGM | `scene:enter { scene: "title" }` / `scene:exit` หยุด | loop (มี intro ไม่ loop 1 ครั้ง) | intro ~8s + loop ~90s | 0.8 (−2 dB) | high | 1 | โทนลึกลับสุดของเกม ระฆังวัด + drone + dizi โซโล่ห่าง ๆ ห้ามมีกลองศึก |
| `bgm_class_select` | BGM | `scene:enter { scene: "class_select" }` | loop | ~60s loop | 0.7 (−3 dB) | high | 1 | เบากว่า title, guzheng คลอเบา ๆ รองรับ UI hover/select ไม่ให้เสียงตีกัน |
| `bgm_town_night` | BGM | `zone:enter { zone: "town" }` / `zone:exit` crossfade ออก | loop | ~120s loop | 0.7 (−3 dB) | high | 1 | อบอุ่นปนเหงา: erhu เมโลดี้ + ผีผา arpeggio + pad บาง ๆ tempo ~70 BPM |
| `bgm_field_wilds` | BGM | `zone:enter { zone: "field" }` | loop | ~110s loop | 0.7 (−3 dB) | high | 1 | ระวังภัย: dizi short phrase + กลองเล็ก + drone ลม tempo ~90 BPM |
| `bgm_combat_field` | BGM | `combat:state_changed { state: "in_combat" }` / กลับ `exploration` | loop (layering บน field) | ~60s loop ต่อได้ไม่รู้จบ | 0.85 (−1.5 dB) | high | 1 | **layer เพิ่ม** ทับ field ไม่ใช่เปลี่ยนเพลงทั้งเพลง: กลองศึก + sub bass + ostinato ผีผา เข้าไว <500ms ออกช้า (ดู Design) |
| `bgm_dungeon_cave` | BGM | `zone:enter { zone: "dungeon" }` | loop | ~100s loop | 0.75 (−2.5 dB) | high | 1 | กดดัน อึดอัด: drone ต่ำ + ระฆังบิดเพี้ยน + น้ำหยดเป็นจังหวะ tempo ~60 BPM |
| `bgm_shrine_mist` | BGM | `zone:enter { zone: "shrine" }` | loop | ~90s loop | 0.65 (−4 dB) | high | 1 | ศักดิ์สิทธิ์+ขนลุก: เสียงสวดต่ำ + ระฆัง + erhu harmonic สูงลอย ๆ ไม่มี percussion |

## 2. Ambience (6 cues — เปิดคู่กับ BGM เสมอ)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `amb_town_night` | Ambience | `zone:enter { zone: "town" }` พร้อม bgm | loop (seamless) | ~30s loop | 0.5 (−6 dB) | ambient | 1 | จิ้งหรีดกลางคืน + ลมเบา + เสียงไม้โคมแกว่งเอี๊ยดอ๊าดนาน ๆ ครั้ง (random one-shot ซ้อนใน loop) |
| `amb_field_wind` | Ambience | `zone:enter { zone: "field" }` | loop | ~25s loop | 0.55 (−5 dB) | ambient | 1 | ลมทุ่ง + หญ้าไหว ไม่มีแมลงกลางวันมาก หลบให้ combat layer |
| `amb_forest_rustle` | Ambience | `zone:enter { zone: "field", sub: "forest" }` (layer เสริม wind) | loop | ~20s loop | 0.4 (−8 dB) | ambient | 1 | ใบไม้เสียดสี + นกห่าง ๆ (กลางคืนตัดนกออกด้วย flag `isNight`) |
| `amb_cave_drip` | Ambience | `zone:enter { zone: "dungeon" }` | loop + random panning | ~18s loop | 0.5 (−6 dB) | ambient | 3 | น้ำหยด 3 แบบสุ่มตำแหน่ง stereo (ใช้ 2D panning ตาม x ของผู้เล่นในถ้ำ) |
| `amb_cave_depth` | Ambience | `zone:enter { zone: "dungeon" }` (เล่นคู่ drip) | loop | ~40s loop | 0.35 (−9 dB) | ambient | 1 | เสียงก้องต่ำในถ้ำ + หินลั่นนาน ๆ ครั้ง ห้ามเด่นกว่า BGM |
| `amb_shrine_mist` | Ambience | `zone:enter { zone: "shrine" }` | loop | ~35s loop | 0.45 (−7 dB) | ambient | 1 | หมอก/ลมเบา + กระดิ่งลมไกล ๆ + ความเงียบเยอะ (space สำคัญ) |

## 3. Hero SFX — Sword Exorcist (10 กลุ่ม)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `sfx_hero_step_stone` | SFX | `hero:step { surface: "stone", x, y }` | one-shot | 0.12–0.18s | 0.35 (−9 dB) | low | 3 | ฝีเท้าบนถนนหินเมือง สั้น แห้ง สุ่ม pitch ±8% + สุ่ม 1 ใน 3 |
| `sfx_hero_step_grass` | SFX | `hero:step { surface: "grass", x, y }` | one-shot | 0.15–0.22s | 0.35 (−9 dB) | low | 3 | ฝีเท้าบนหญ้าทุ่ง นุ่มกว่า stone มีเสียงใบไม้นิด ๆ สุ่ม pitch ±8% |
| `sfx_hero_sword_swing` | SFX | `combat:swing { attacker: "hero", x, y }` | one-shot | 0.18–0.28s | 0.7 (−3 dB) | normal | 3 | เสียงแหวกอากาศ (whoosh) ล้วน ยังไม่รวมเสียงโดน — ต้องมี 3 var สุ่ม + pitch ±10% |
| `sfx_hero_skill_cast` | SFX | `skill:cast { skillId, x, y }` | one-shot | 0.5–0.8s | 0.8 (−2 dB) | high | 1 ต่อสกิล | เสียงร่ายหมึก: พู่กันสะบัด + เสียงวิ้งขึ้น (riser) แยก cue ย่อยต่อสกิลได้ (`_ink_slash`, `_ward` ฯลฯ) |
| `sfx_hero_skill_impact` | SFX | `skill:impact { skillId, x, y, hitCount }` | one-shot | 0.4–0.6s | 0.85 (−1.5 dB) | high | 2 | เสียงปะทะสกิล หนักกว่าโจมตีปกติ มีเลเยอร์ sub thump |
| `sfx_hero_hurt` | SFX | `hero:damaged { amount, x, y }` | one-shot | 0.3–0.45s | 0.85 (−1.5 dB) | high | 2 | เสียงเจ็บ + เกราะกระแทก 2 var สลับ ห้ามใช้ร่วมกับ `sfx_combat_hit` จนซ้อนหนา (เลือกเลเยอร์ตาม Design) |
| `sfx_hero_death` | SFX | `hero:died { x, y }` | one-shot | 1.2–1.8s | 1.0 (0 dB) | critical | 1 | ดาบตก + ล้ม + ลมหายใจสุดท้าย ตามด้วย ducking BGM ลงทันที |
| `sfx_hero_potion` | SFX | `item:use { itemId: "potion_hp", x, y }` | one-shot | 0.5–0.7s | 0.6 (−4.5 dB) | normal | 1 | เปิดจุก + กลืน + ถอนหายใจโล่ง ต่อด้วย `sfx_combat_heal` เบา ๆ ได้ |
| `sfx_hero_dodge` | SFX | `hero:dodge { x, y }` (ถ้ามีในเฟส 1) | one-shot | 0.25–0.35s | 0.5 (−6 dB) | normal | 2 | whoosh สั้นพุ่งไปด้านข้าง เบากว่า swing ถ้ายังไม่มีระบบ dodge ให้พักเป็น backlog |
| `sfx_hero_levelup` | SFX | `progress:level_up { level, x, y }` | one-shot | 1.5–2.2s | 1.0 (0 dB) | critical | 1 | ดูแถว Loot/Progress — ระบุซ้ำที่นี่เพราะ trigger จาก hero โดยตรง + มี ducking BGM |

## 4. Demon Boar SFX (5 กลุ่ม — เฟสแรกมีแค่มอนตัวนี้, Ink Wisp ไว้ทีหลัง)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `sfx_boar_aggro` | SFX | `monster:aggro { monsterType: "demon_boar", id, x, y }` | one-shot | 0.6–0.9s | 0.8 (−2 dB) | high | 2 | คำรามเตือนตอนเจอผู้เล่น 2 var (ใกล้/ไกลใช้ volume + lowpass ตามระยะ) |
| `sfx_boar_charge` | SFX | `monster:charge { monsterType: "demon_boar", id, x, y }` | one-shot (หรือ loop สั้นขณะวิ่ง) | 0.5–0.8s | 0.7 (−3 dB) | normal | 1 | กระทืบเท้าถี่ + หายใจหอบ + whoosh พุ่ง ถ้าวิ่งนานให้ loop เสียงกระทืบที่ 140 BPM |
| `sfx_boar_attack` | SFX | `monster:attack { monsterType: "demon_boar", id, x, y }` | one-shot | 0.3–0.45s | 0.75 (−2.5 dB) | normal | 2 | ขวิด/กัด 2 var: เสียงงาหวด + ลม ตัดให้คมไม่ลากยาว |
| `sfx_boar_hurt` | SFX | `monster:damaged { monsterType: "demon_boar", id, x, y }` | one-shot | 0.3–0.5s | 0.7 (−3 dB) | normal | 2 | ร้องเจ็บแหลมขึ้น 2 var + **cooldown 80ms** กันเสียงซ้อนตอนรุมตี (ดู Design) |
| `sfx_boar_death` | SFX | `monster:died { monsterType: "demon_boar", id, x, y }` | one-shot | 0.9–1.4s | 0.8 (−2 dB) | high | 1 | ร้องยาวลงต่ำ + ล้มครืน + หมึกสลาย (ink dissolve) ต่อด้วย `sfx_loot_*` ได้ |

## 5. Combat Feedback (4 กลุ่ม)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `sfx_combat_hit` | SFX | `combat:hit { isCritical: false, x, y, targetType }` | one-shot | 0.15–0.25s | 0.75 (−2.5 dB) | normal | 3 | ฟันเข้าเนื้อมาตรฐาน 3 var สุ่ม + pitch ±12% — **จำกัด voice สูงสุด 4 + cooldown 50ms** |
| `sfx_combat_critical` | SFX | `combat:hit { isCritical: true, x, y, targetType }` | one-shot | 0.5–0.8s | 1.0 (0 dB) | critical | 2 | **ต้องเด่นกว่าชัดเจน**: โลหะแตก + หมึกระเบิด + sub hit + shimmer สูง 2 var ห้ามโดน steal ง่าย ๆ |
| `sfx_combat_heal` | SFX | `combat:heal { amount, x, y }` | one-shot | 0.6–0.9s | 0.6 (−4.5 dB) | normal | 1 | น้ำอุ่น + ระฆังเล็กวิ้งขึ้น นุ่ม ไม่แหลมแข่งกับ combat |
| `sfx_combat_kill` | SFX | `combat:kill { targetType, x, y }` | one-shot | 0.4–0.6s | 0.7 (−3 dB) | normal | 2 | ป๊อบยืนยันว่าตาย (ink pop) 2 var ต่อหลัง `sfx_boar_death` เบา ๆ ได้ |

> `hero:damaged` (ผู้เล่นโดนดาเมจ) ใช้ `sfx_hero_hurt` ไม่แยก cue ใหม่ — กันเสียงซ้อนหนาโดยไม่จำเป็น

## 6. Loot / Progress (6 กลุ่ม)

| Cue ID | ชนิด | Event ที่ trigger | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `sfx_loot_pickup` | SFX | `loot:pickup { itemId, x, y }` | one-shot | 0.3–0.45s | 0.6 (−4.5 dB) | normal | 2 | หยิบของ: กระดาษ/ผ้า + ติ๊งสั้น 2 var ตามประเภท (วัตถุดิบ vs อุปกรณ์) |
| `sfx_loot_gold` | SFX | `loot:gold { amount, x, y }` | one-shot | 0.35–0.5s | 0.6 (−4.5 dB) | normal | 1 | เหรียญกระทบกัน pitch สูงขึ้นตามจำนวนเงินได้ (optional: pitch = f(amount)) |
| `sfx_exp_tick` | SFX | `progress:exp_gain { amount }` | one-shot | 0.12–0.18s | 0.4 (−8 dB) | low | 1 | ติ๊กเบา ๆ ถี่ได้ **cooldown 60ms** กันรัวตอน EXP เด้งหลายก้อน |
| `sfx_levelup` | SFX | `progress:level_up { level, x, y }` | one-shot | 1.5–2.2s | 1.0 (0 dB) | critical | 1 | แฟนแฟร์หมึก: ระฆัง + erhu พุ่ง + shimmer — **ducking BGM −6 dB นาน 1.5s** (alias ของ `sfx_hero_levelup`) |
| `sfx_quest_accept` | SFX | `quest:accept { questId }` | one-shot | 0.5–0.7s | 0.65 (−3.5 dB) | normal | 1 | ประทับตราหมึก + กระดาษ (stamp thump) |
| `sfx_quest_complete` | SFX | `quest:complete { questId }` | one-shot | 1.0–1.5s | 0.9 (−1 dB) | critical | 1 | ระฆังวัด 3 ที + shimmer — อารมณ์รางวัลใหญ่รองจากเลเวลอัพ **ducking BGM −4 dB นาน 1.0s** |

## 7. UI (11 กลุ่ม)

| Cue ID | ชนิด | Event ที่ trigger (UI ยิงเอง ไม่ผ่าน sim) | Loop | ความยาวโดยประมาณ | Vol | Priority | Var | หมายเหตุ |
|---|---|---|---|---|---|---|---|---|
| `ui_window_open` | UI | `ui:window_open { windowId }` (Status/Skill/Inventory/Shop/ฯลฯ) | one-shot | 0.2–0.3s | 0.5 (−6 dB) | normal | 1 | กระดาษกาง + หมึกแต้ม กลาง ๆ ใช้ร่วมทุกหน้าต่าง |
| `ui_window_close` | UI | `ui:window_close { windowId }` | one-shot | 0.18–0.25s | 0.5 (−6 dB) | normal | 1 | ม้วนกระดาษกลับ เบากว่า open นิดหน่อย |
| `ui_menu_hover` | UI | `ui:hover { elementId }` | one-shot | 0.06–0.1s | 0.3 (−10 dB) | low | 1 | ติ๊กสั้นมาก **cooldown 40ms** กันเสียงรัวตอนลากเมาส์ผ่านเมนู |
| `ui_menu_select` | UI | `ui:select { elementId }` | one-shot | 0.12–0.18s | 0.45 (−7 dB) | normal | 1 | ติ๊กชัดกว่า hover มีปลายหมึกนิด ๆ |
| `ui_confirm` | UI | `ui:confirm { context }` | one-shot | 0.25–0.35s | 0.6 (−4.5 dB) | normal | 1 | ประทับตราเบา ๆ ยืนยัน (ใช้กับปุ่มตกลงทั่วไป) |
| `ui_cancel` | UI | `ui:cancel { context }` | one-shot | 0.2–0.3s | 0.55 (−5 dB) | normal | 1 | โทนลง (descending) ตรงข้าม confirm |
| `ui_error` | UI | `ui:error { reason }` | one-shot | 0.3–0.45s | 0.65 (−3.5 dB) | high | 1 | บล็อกไม้เคาะต่ำ (muted knock) + สั่นนิด ๆ ห้ามแหลมจนน่ารำคาญเพราะได้ยินบ่อย |
| `ui_shop_buy` | UI | `shop:buy { itemId, price }` | one-shot | 0.4–0.55s | 0.65 (−3.5 dB) | normal | 1 | เหรียญ + ประทับตรา (ซื้อสำเร็จ) |
| `ui_shop_sell` | UI | `shop:sell { itemId, price }` | one-shot | 0.4–0.55s | 0.65 (−3.5 dB) | normal | 1 | เหรียญ + กระดาษ (โทนต่างจาก buy นิดหน่อยให้แยกออก) |
| `ui_upgrade_success` | UI | `upgrade:success { level, itemId }` | one-shot | 1.2–1.8s | 1.0 (0 dB) | critical | 3 (ตามขั้น +3/+6/+9) | **โมเมนต์อารมณ์สำคัญ**: โลหะหลอม + ระฆังสว่าง + shimmer พุ่งขึ้น pitch สูงขึ้นตามขั้นตีบวก **ducking BGM −6 dB นาน 1.5s** |
| `ui_upgrade_fail` | UI | `upgrade:fail { level, itemId }` | one-shot | 1.0–1.5s | 0.9 (−1 dB) | critical | 1 | **ต้องต่างจาก success ชัดเจน**: โลหะแตกทึบ + โทนร่วงลง (descending) + เศษหมึกกระจาย ห้ามใช้ระฆังสว่างเด็ดขาด **ไม่ ducking BGM** (ให้ความเงียบหลังเสียงทำงาน) |

---

## สรุปจำนวน

- **BGM 7 / Ambience 6 / SFX 25 กลุ่ม (~40 ไฟล์รวม variation) / UI 11 กลุ่ม = รวม 49 กลุ่ม cue**
- Variation รวมโดยประมาณ: ~65 ไฟล์เสียงย่อย (นับ swing×3, step×3+3, hit×3, boar×2 ฯลฯ)
- Critical hit (`sfx_combat_critical`) และตีบวก (`ui_upgrade_success` vs `ui_upgrade_fail`) แยกดีไซน์ไว้ชัดตามบรีฟแล้ว

## Backlog (เสียงของระบบที่ยังไม่ถึงเฟส — อย่าผลิตตอนนี้)

- `sfx_ink_wisp_*` (aggro/attack/hurt/death) — รอ Ink Wisp เข้าเฟสถัดไป
- `bgm_boss_*` + `sfx_boss_*` — รอบอส
- `sfx_cultivation_*` ( breakthrough สำเร็จ/ล้มเหลว ) — รอระบบ Cultivation เชิงลึก
- `sfx_party_*`, `sfx_multiplayer_*` — รอระบบ Party/Multiplayer
- อาชีพอื่นนอกจาก Sword Exorcist — รอคลาสใหม่
- เสียงพากย์ (voice-over) เควสต์/NPC — ยังไม่สโคป
