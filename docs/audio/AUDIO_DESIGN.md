# EXORCIST INK — Audio Design Spec (Phase 0–1)

> สโคป: ทิศทางดนตรี / loop / transition / mix bus / voice limiting / ducking / ไฟล์ / normalization
> ยังไม่ผลิตไฟล์เสียงจริง — เอกสารนี้คือสเปกให้คนทำเสียง + นัท (presentation/audio) อ้างอิงตรงกัน

## 1. ทิศทางดนตรี (Music Direction)

**คำสั้น ๆ:** *dark Eastern ink — หมึกดำบนกระดาษเก่า เสียงจีนโบราณลอยเหนือ drone สมัยใหม่*

### 1.1 เครื่องดนตรีหลัก (ฝั่งจีน)

| เครื่อง | บทบาท | ใช้ที่ไหนมาก |
|---|---|---|
| ขลุ่ยจีน **dizi** | เมโลดี้ลอย เหงา ระวังภัย | title, field, shrine |
| เอ้อหู **erhu** | เสียงร้องไห้ เศร้า อบอุ่น | town, levelup, quest_complete |
| กู่เจิง **guzheng** | arpeggio คลอ พื้นผิว | class_select, town, shrine |
| ผีผา **pipa** | ostinato เร่ง จังหวะต่อสู้ | combat layer |
| กลองศึก (tanggu / war drum) | แรงกดดัน combat/dungeon | combat, dungeon |
| ระฆังวัด (temple bell / chime) | โมเมนต์ศักดิ์สิทธิ์/รางวัล | title, levelup, quest_complete, upgrade_success |

### 1.2 เลเยอร์โมเดิร์น (ฝั่งตะวันตก/ambient)

- **drone** ยาว (sine/noise ผ่าน lowpass) — พื้นหลังทุกโซน ให้ความมืดคงที่
- **sub bass** (40–70 Hz) — เฉพาะ combat + dungeon + boar death ให้แรงปะทะ
- **texture**: เสียงกระดาษ หมึกน้ำ ลมผ่านไม้ไผ่ — ใช้เป็น foley ผสมใน SFX/UI ให้เป็นเอกลักษณ์ "หมึก"

### 1.3 คีย์ / สเกล / tempo แนะนำ

- สเกลหลัก: **pentatonic minor** (เช่น A – C – D – E – G, หลีกเลี่ยง semitone ให้ไม่ตะวันตกจ๋า)
- โซนศักดิ์สิทธิ์ (shrine/title): เติมโน้ต passing แบบ **yu mode** (ลาโหมดจีน) ให้ลอย ไม่ต้องมีจังหวะชัด
- ห้ามใช้ major สดใส / ห้ามใช้ harmonic minor แบบตะวันออกกลาง (จะหลุดธีมจีน)

| โซน | คีย์แนะนำ | Tempo | อารมณ์ |
|---|---|---|---|
| title | A minor pentatonic, drone ยาว | free (~50 BPM feel) | ลึกลับสุด ไม่มีกลอง |
| class_select | A minor pentatonic เบา | ~60 BPM | สงบ รองรับ UI |
| town night | E minor pentatonic + erhu | ~70 BPM | อบอุ่นปนเหงา |
| field/wilds | D minor pentatonic + dizi สั้น | ~90 BPM | ระวังภัย |
| combat layer | D minor + pipa ostinato + กลอง | ~120 BPM (layer บน field) | เร่ง ไม่เปลี่ยนคีย์จาก field (กันเพี้ยนตอน crossfade) |
| dungeon cave | drone ต่ำ + ระฆังบิด | ~60 BPM | อึดอัด กดดัน |
| shrine mist | A yu mode + bell | free | ศักดิ์สิทธิ์ ขนลุก ไม่มี percussion |

## 2. BGM Loop Spec

- ทุก BGM ส่ง **2 ส่วน**: `intro` (เล่นครั้งเดียว ไม่ loop) + `loop` (วน seamless)
- ไฟล์ loop ต้องตัด **zero-crossing** และ reverb tail วนกลับหัวต้นได้ (render reverb แบบวน ไม่ใช่ fade out)
- ตั้ง loop ใน Phaser ด้วย `loop: true` เฉพาะส่วน loop; เล่น intro ด้วย one-shot แล้ว `on('complete')` ค่อยต่อ loop — ห้ามทำ intro รวมในไฟล์ loop เดียวกัน
- ความยาว loop ขั้นต่ำ **60s** (town/field/dungeon ≥100s กันคนจำ pattern ได้)
- ตั้งชื่อไฟล์: `bgm_town_night_intro.ogg`, `bgm_town_night_loop.ogg` (ดู Integration)

### Crossfade เปลี่ยนโซน (town ⇄ field ⇄ dungeon ⇄ shrine)

| กรณี | เวลา fade | วิธี |
|---|---|---|
| เปลี่ยนโซนปกติ (เดินข้ามประตู) | **fade out 800ms / fade in 1200ms** (overlap กัน) | BGM เก่า linear fade out + BGM ใหม่ fade in ทับ ไม่ตัดห้วน |
| เข้า dungeon/shrine (เปลี่ยนบรรยากาศแรง) | fade out 500ms + เงียบ 300ms + fade in 1500ms | ให้มี "ช่องว่างหายใจ" ก่อนเพลงใหม่ |
| เปิด Title → เข้าเกมครั้งแรก | fade out 1000ms แล้วเริ่ม intro ของโซนใหม่เสมอ (ไม่ต่อ loop เก่า) | รีเซ็ตอารมณ์ |

- Ambience crossfade พร้อม BGM ด้วยเวลาเดียวกัน (±200ms) เพื่อไม่ให้ลม/แมลงกระโดด

## 3. Combat Music Transition

- ใช้ระบบ **layering** ไม่ใช่เปลี่ยนเพลง: `bgm_field_wilds` (หรือ dungeon) เล่นต่อ แล้ว **fade in `bgm_combat_field` ทับ** เป็นเลเยอร์เสริม
- เงื่อนไขเข้า combat: `combat:state_changed { state: "in_combat" }` — สั่งเมื่อ hero โจมตีโดน หรือโดนมอน aggro ตัวแรก (debounce 300ms กันเข้าออกถี่)
- เข้า: combat layer fade in **400ms** (ไว ให้รู้สึกทันที) + ดัน volume field ลง −2 dB ชั่วคราว
- ออก: เมื่อไม่มีดาเมจทั้งสองฝั่ง **5 วินาที** (`combat:idle_timeout`) → combat layer fade out **2000ms** (ช้า ค่อย ๆ คลาย) + คืน volume field
- ใน dungeon ใช้ combat layer ชุดเดียวกันแต่ lowpass ลง (อู้ในถ้ำ) — ไม่ต้องทำ BGM combat แยกอีกไฟล์

## 4. Mix Bus Structure

```text
Master (1.0)
├── BGM (0.8)
├── Ambience (0.6)
├── SFX (0.9)
└── UI (0.8)
```

- ค่าเริ่มต้นตามข้างบน (linear 0.0–1.0) — ผู้เล่นปรับได้ในเมนูตั้งค่า **0–100% ต่อ bus** (Master ด้วย รวม 5 ตัว)
- บันทึกค่าลง localStorage (`exorcist_ink.audio.*`) โหลดก่อนเล่นเสียงแรก
- SFX/UI ที่ระบุ Vol ใน cue list คือ **gain สัมพัทธ์ใน bus** (เช่น `sfx_combat_critical` 1.0 = เต็ม SFX bus) — AudioManager คูณ `busVolume × cueVolume` เสมอ
- เผื่อ headroom: Master ห้ามดันเกิน 1.0 — ถ้าทุกอย่างดังพร้อมกันให้ limiter ที่ Master (Phaser/ Web Audio DynamicsCompressor เบา ๆ) ไม่ใช่แก้ด้วยการลดไฟล์

## 5. Voice Limiting (สำคัญมาก — กันเสียงแตกตอนรุมตี)

### 5.1 กติกาต่อ cue

| Cue | Max voices พร้อมกัน | Cooldown ระหว่างครั้ง (ms) | หมายเหตุ |
|---|---|---|---|
| `sfx_combat_hit` | **4** | 50 | เกินให้ steal ตัวเก่าสุด (oldest) |
| `sfx_boar_hurt` | **3** | 80 | มอน 5 ตัวรุมต้องไม่ซ้อน 5 ชั้น |
| `sfx_hero_step_*` | **1** | 120 | กันฝีเท้าเบิ้ลตอน frame rate แกว่ง |
| `sfx_combat_critical` | **2** | 100 | critical ห้ามโดน steal โดย hit ธรรมดา |
| `sfx_exp_tick` | **2** | 60 | EXP เด้งหลายก้อนรวมเป็นติ๊กเดียวถี่ ๆ พอ |
| `ui_menu_hover` | **1** | 40 | ลากเมาส์ผ่านเมนูต้องไม่รัว |
| cue อื่นทั่วไป | **3** (default) | 30 (default) | — |

### 5.2 กติกา steal voice ตาม priority

1. เสียงใหม่ priority สูงกว่า → **ขโมย voice เสียงเก่า priority ต่ำสุด** ใน bus เดียวกันได้เสมอ
2. เสียงใหม่ priority เท่ากันหรือต่ำกว่า + voice เต็ม → **ทิ้งเสียงใหม่** (ไม่เล่น) ยกเว้น cue นั้นกำหนด steal-oldest ไว้ (เช่น `sfx_combat_hit`)
3. `critical` (crit/levelup/death/upgrade_success/fail) **ห้ามถูก steal** โดย `normal/low` เด็ดขาด
4. Ambience/BGM ไม่นับ voice pool ของ SFX (แยก channel) — loop ได้ตลอดไม่โดน steal

### 5.3 เป้าหมาย perf

- เสียงพร้อมกันสูงสุดไม่เกิน **~16 voices** (BGM 1 + combat layer 1 + ambience 2 + SFX ~10 + UI ~2)
- ใช้ไฟล์สั้น + decode ล่วงหน้าตอน preload (ดู Integration) ห้าม decode กลางเฟรมต่อสู้

## 6. Ducking (ลด BGM ชั่วคราวให้โมเมนต์เด่น)

| เหตุการณ์ | BGM ลด | Ambience ลด | เวลา |
|---|---|---|---|
| `progress:level_up` / `sfx_hero_levelup` | **−6 dB นาน 1.5s** แล้วค่อยคืน 800ms | −3 dB | แฟนแฟร์ต้องเด่นสุด |
| `upgrade:success` | **−6 dB นาน 1.5s** แล้วคืน 800ms | ไม่ลด | โมเมนต์อารมณ์สำคัญของตีบวก |
| `quest:complete` | **−4 dB นาน 1.0s** แล้วคืน 600ms | ไม่ลด | รองลงมา |
| `hero:died` | **−10 dB ค้าง** จนออกจาก death screen | −6 dB ค้าง | ให้ความเงียบทำงาน แล้วค่อย fade กลับ |
| `upgrade:fail` | **ไม่ ducking** | ไม่ลด | ตั้งใจให้ความเงียบหลังเสียงแตกทำงาน (เศร้ากว่า) |

- Ducking ทำที่ **BGM bus gain** (ไม่ใช่ลด Master) — SFX/UI ไม่โดนลดตาม

## 7. รูปแบบไฟล์ + เพดานขนาด

- **Format หลัก: `.ogg` (Vorbis)** + **fallback `.m4a` (AAC) สำหรับ Safari** — เก็บสองไฟล์ต่อ cue ยาว (BGM/ambience) ส่วน SFX/UI สั้น ๆ ใช้ `.ogg` อย่างเดียว + fallback `.mp3` ก็ได้ถ้า build pipeline ง่ายกว่า
- Sample rate: **44.1 kHz**, stereo สำหรับ BGM/ambience, **mono** สำหรับ SFX/UI สั้น (ประหยัดครึ่งหนึ่ง ได้ panning จาก engine อยู่แล้ว)
- Bitrate: BGM/ambience ogg ~96–128 kbps, SFX/UI ~64–96 kbps ก็พอ (เสียงสั้น + เล่นผ่านลำโพงเล็ก)
- **เพดานรวม: เสียงทั้งหมดไม่เกิน ~25 MB** (BGM 7 เพลง × ~2 MB + ambience + sfx รวม) — ถ้าเกินให้ตัด BGM loop ให้สั้นลงก่อน อย่าลด SFX
- โหลดแบบ **preload ตอน boot/title** เฉพาะ UI + town/field ก่อน ที่เหลือ lazy-load ตอนจะเข้าโซน (ดู Integration) เพื่อไม่ให้หน้า title โหลดนาน

## 8. Normalization

- **BGM**: เป้าหมาย **−16 LUFS integrated** (±1 LU) ต่อ loop — ทุกโซนดังเท่า ๆ กัน คนเล่นไม่ต้องปรับ volume ตอนเดินข้ามโซน
- **SFX**: peak ceiling **−3 dBTP** (true peak) ทุกไฟล์ — เผื่อที่ให้หลายเสียงซ้อนกันไม่ clip; เสียง critical/levelup ดังได้ถึง −1 dBTP แต่ต้องผ่าน limiter ที่ Master
- **UI**: peak **−6 dBTP** (ตั้งใจให้เบากว่า SFX ชัดเจน)
- วัดด้วย loudness meter ก่อนส่งไฟล์จริง ห้าม normalize ด้วยหูอย่างเดียว
