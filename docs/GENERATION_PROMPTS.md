# EXORCIST INK — AI Generation Prompts (Phase 0)

เอกสารนี้เป็น source of truth สำหรับ prompt ฝั่งอาร์ต ห้ามผลิต asset ชุดเต็มจน Andy อนุมัติ style test

## 1. Prompt base กลาง

นำข้อความนี้ต่อหน้าทุก variant และคงลำดับคำหลัก:

```text
EXORCIST INK game asset, Eastern dark-fantasy wuxia, Chinese ink-wash painterly rendering, restrained desaturated palette, soot-black shadows, aged dry-brush edges, subtle rice-paper grain, mysterious humid night atmosphere, elegant readable silhouette, 3/4 top-down 2.5D game-camera language, consistent south-facing world orientation, non-pixel-art, production concept for Phaser 3 at 1920x1080, compatible with a 64x64 tile grid, isolated on transparent background or pure solid black when transparency is unavailable, no text embedded in the image
```

Negative base:

```text
pixel art, voxel, glossy mobile fantasy, neon rainbow, bright cheerful daylight, Western medieval armor, sci-fi, modern objects, photoreal 3D render, anime cel shading, chibi, fisheye, dramatic low-angle camera, front elevation when top-down is required, cluttered background, scenery behind isolated asset, text, Thai letters, Latin letters, Chinese characters, numbers, logo, watermark, signature, UI labels
```

## 2. Prompt variants

### Character

```text
[PROMPT BASE], one complete character only, full body, anatomy and costume readable at 96x96 gameplay scale, clear feet and contact point, 3/4 top-down view, action [ACTION], facing [DIR], consistent body proportions and camera pitch, restrained rim light, centered with safe padding, transparent background preferred
```

เพิ่มข้อห้าม: `cropped feet, extra limbs, extra fingers as focal detail, duplicate weapon, floor plane, portrait composition`

Pivot: กลาง-ล่างที่เท้า (`0.5, 1.0`)  
ทิศ: `n, ne, e, se, s, sw, w, nw`

### Prop / อาคาร

```text
[PROMPT BASE], one isolated [PROP], front facade faces south/down, exact 3/4 top-down orthographic-like game view, compact footprint aligned to 64x64 tiles, base contact shape clearly visible, material wear and ink texture, no surrounding street, no people, transparent background preferred
```

เพิ่มข้อห้าม: `wide environment scene, floating object, cut-off base, incompatible isometric camera, multiple buildings unless requested`

Pivot: ฐานวัตถุ

### Tileset พื้น

```text
[PROMPT BASE], seamless tileable [GROUND MATERIAL] viewed from the fixed gameplay camera, low-frequency value structure, subdued detail so characters remain readable, edges match on all sides, no directional hero lighting, no objects crossing tile boundary, generated as a coherent tileset family
```

เพิ่มข้อห้าม: `visible seam, perspective horizon, focal object, baked character shadow, high-contrast noise`

หมายเหตุ: AI output ต้องผ่าน manual seam cleanup และทดสอบ repeat จริงก่อนใช้งาน

### Monster

```text
[PROMPT BASE], one [MONSTER], corrupted Eastern folklore anatomy, readable combat silhouette at gameplay scale, [ACTION], facing [DIR], clear feet or ground contact, demon-ink accents in muted plum and restrained blood-red, transparent background preferred
```

เพิ่มข้อห้าม: `cute mascot, gore close-up, Western demon cliché, duplicate heads unless specified, environment`

### UI frame

```text
[PROMPT BASE], front-facing flat orthographic game UI asset, empty near-black panel, thin aged antique-brass metal border, restrained abstract Chinese corner ornaments, subtle inner bevel and soot patina, generous uninterrupted empty content area, modular geometry suitable for 9-slice, transparent exterior preferred
```

Negative บังคับ:

```text
words, labels, Thai, Latin, Chinese writing, numerals, values, player name, level, HP, MP, EXP, stats, item count, price, icon, portrait, inventory item, button text, pseudo-writing, glyph-like ornament, watermark, logo
```

**กฎเหล็ก:** UI image ต้องเป็นกรอบเปล่า ข้อมูล dynamic ทุกชนิดให้นัทวาดด้วยโค้ด ถ้ามี pseudo-text แม้แต่น้อยให้ reject

### Background / ฉาก

```text
[PROMPT BASE], wide environmental concept of [LOCATION], playable 3/4 top-down composition, navigable paths and combat negative space, foreground-midground-background separation, cool charcoal ambient shadow, restrained red lantern or supernatural accent lights, atmospheric fog, no HUD or UI
```

เพิ่มข้อห้าม: `cinematic horizon-dominant landscape, unreadable path, excessive bloom, embedded interface`

## 3. กติกาความต่อเนื่องของชุด asset

Asset ที่อยู่ชุดเดียวกัน เช่น บ้าน 4 แบบหรือต้นไม้ 4 แบบ ต้อง:

1. ใช้ Prompt base, variant, negative prompt, model และ aspect ratio ชุดเดียวกัน
2. ล็อก camera phrase และทิศใต้เหมือนกัน ห้ามแก้คำบรรยายมุมกล้องรายชิ้น
3. ใช้ seed เดียวกันเมื่อระบบรองรับ แล้วเปลี่ยนเฉพาะ subject token
4. ถ้า seed ไม่รองรับ ให้ใช้ภาพ master ที่อนุมัติแล้วเป็น image reference ต่อทุกครั้ง พร้อมคง strength/weight เดิมถ้าเครื่องมือเปิดให้ตั้ง
5. ทำ contact sheet เทียบ scale, roof pitch, line weight, saturation และ shadow direction ก่อนรับงาน
6. ห้ามเริ่ม variant จำนวนมากจาก prompt ที่ยังไม่ผ่าน style approval

ชื่อไฟล์ยึด `<หมวด>_<ชื่อ>_<action>_<dir>_<เฟรม 2 หลัก>.png`; PNG alpha; tile 64×64; hero 96×96; character pivot กลาง-ล่าง; prop pivot ที่ฐาน

ข้อเสนอที่ยังไม่แก้ convention: ควรเพิ่มไฟล์ metadata สำหรับ pivot/trim และ extrusion 2 px ของ tileset เมื่อเข้า production

## 4. Phase 0 prompts ที่ใช้จริง

### Hero concept

```text
EXORCIST INK game concept test. A single male Taoist exorcist hero, long silver-white hair with one distinct black forelock, dark violet and near-black layered Taoist robes, subtle antique brass fasteners, holding one Chinese straight sword. 3/4 top-down game-camera view, idle pose facing south/down toward viewer, full body, feet clearly visible, centered with generous clean isolation space. Eastern dark-fantasy Chinese ink-wash painterly rendering matching the supplied mood board: crisp readable silhouette, textured dry-brush edges, restrained paper-grain texture, cool charcoal shadows, muted plum-violet accents, faint cyan-violet ink aura and narrow cool rim light. Non-pixel-art, production concept for a 96x96 Phaser character sprite, strong shape readability at small size. Pure solid black background, no scenery, no floor shadow beyond a subtle contact shadow. Absolutely no text, letters, numbers, logo, UI, frame, extra weapons, extra people, photorealism, chibi proportions, anime cel shading, pixel art.
```

### House concept

```text
EXORCIST INK game prop concept test. One isolated ancient Chinese town house, compact two-story timber-and-plaster structure, curved charcoal ceramic tile roof, carved dark wood beams, worn stone foundation, two small hanging red lanterns emitting restrained warm crimson-orange light. Exact 3/4 top-down orthographic-like game view compatible with a 64x64 tile grid, front facade faces south/down toward viewer, base footprint clearly readable and centered. Eastern dark-fantasy Chinese ink-wash painterly style matching the supplied mood board, dry-brush contour accents, desaturated soot-black and warm gray materials, aged surfaces, subtle paper grain, readable silhouette at gameplay scale. Pure solid black background and isolated prop only, no street, no trees, no people, no surrounding scene. Non-pixel-art. Absolutely no text, signs, letters, numbers, logo, UI, watermark, modern objects, exaggerated fantasy palace, photorealism, isometric pixel art.
```

### Empty UI frame concept

```text
EXORCIST INK empty game UI window frame concept test, front-facing flat orthographic asset. A wide rectangular near-black panel with a thin aged antique-brass metal border, 10-12 px visual border weight at 1024px preview scale, restrained Chinese corner ornaments, slight scratches and soot patina, subtle inner bevel, faint cool charcoal ink texture inside. Large uninterrupted empty center and an empty shallow header rail with generous vertical clearance for Thai combining marks. Symmetrical, modular, suitable to rebuild as 9-slice. Eastern dark-fantasy wuxia interface matching the bottom UI panels in supplied mood board, elegant and subdued rather than ornate. Isolated on pure solid black background. ABSOLUTELY EMPTY: no words, no Thai, no Latin letters, no Chinese characters, no numerals, no symbols resembling writing, no icons, no buttons, no inventory slots, no character portrait, no watermark, no logo. Non-pixel-art painterly material, crisp functional edges.
```

## 5. Generation log

เครื่องมือ Cursor GenerateImage รอบนี้ไม่เปิดเผยชื่อ model ภายในและไม่คืนค่า seed จึงบันทึกตรงไปตรงมาว่า “model identifier ไม่เปิดเผย” และ “seed ไม่รองรับ” การรักษาสไตล์รอบถัดไปต้องใช้ภาพที่อนุมัติเป็น reference พร้อม prompt base เดิม

| ชื่อไฟล์ผลลัพธ์ | วันที่ | Model ที่ใช้ | Prompt เต็ม | Negative prompt | Seed | ขนาดภาพ | หมายเหตุ / ผลลัพธ์ |
|---|---|---|---|---|---|---|---|
| `concept_hero_sword_idle_s.png` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | Hero concept ใน §4 | รวมท้าย prompt: no text, letters, numbers, logo, UI, extra weapons/people, photorealism, chibi, anime cel shading, pixel art | seed ไม่รองรับ | 864×1152 source; PNG delivery | **ต้องเจนใหม่ก่อน production.** Mood/ชุด/ผม/หมึกดีประมาณ 7/10 แต่กล้องยังเป็น character illustration เกือบ front view ไม่ใช่ ¾ top-down sprite; ดาบยาวเกิน gameplay scale; ปอยดำยังไม่เด่นพอ |
| `concept_prop_house_a.png` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | House concept ใน §4 | รวมท้าย prompt: no text/signs/numbers/logo/UI/watermark/modern objects/palace/photorealism/isometric pixel art | seed ไม่รองรับ | 1024×1024 source; PNG delivery | **ผ่าน mood test แบบมีเงื่อนไข ประมาณ 7.5/10.** วัสดุและโคมใกล้ reference แต่เอียงไปทาง isometric asset มากกว่า ¾ top-down world; ได้โคม 5 ดวงแทน 2; รายละเอียดแน่นและ footprint ใหญ่เกิน prop gameplay |
| `concept_ui_frame_empty.png` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | Empty UI frame concept ใน §4 | บังคับ no words/Thai/Latin/Chinese/numerals/dynamic data/icons/pseudo-writing/watermark/logo | seed ไม่รองรับ | 1152×864 source; PNG delivery | **ใกล้สุด ประมาณ 8.5/10.** ว่างจริง สีดำ-ทองเหลืองถูกทิศและทำ 9-slice ได้ แต่ยังไม่มี header rail ตาม prompt, กรอบบาง/สะอาดกว่า reference และมี margin ดำนอกกรอบมาก ต้อง crop/rebuild ก่อน production |
| `hero_sword_idle_s_master.jpg` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | §7 + idle south + ref concept hero + pixel sheet (น้ำหนักเท่านั้น) | §7 negative | seed ไม่รองรับ | 1:1 JPG พื้นดำ | **ล็อกมาสเตอร์ Phase 1.** กล้อง ¾ สูง ~40° ดีขึ้นจาก concept เดิม; ชุดม่วง-ผมเงิน-ปอยดำตรงโครง; ดาบสั้นลง |
| `hero_sword_idle_{n,ne,e,se,sw,w,nw}_master.jpg` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | §7 + facing token; ref = master S (+ N/E/W ตอนรีเจน NE/NW) | §7 negative | seed ไม่รองรับ | 1:1 JPG พื้นดำ | NE/NW รอบแรกหันหน้า — รีเจนเป็นหลังเฉียงแล้วผ่าน. ใช้เป็น idle `_01` |
| `hero_sword_idle_s_02_src.jpg` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | idle breath | §7 negative | seed ไม่รองรับ | 1:1 JPG | **ทิ้ง.** โมเดลเปลี่ยนท่าดาบ — idle `_02` ทั้ง 8 ทิศทำจากสคริปต์ breath แทน |
| `hero_sword_walk_{dir}_{01-04}_src.jpg` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | §7 + walk frame token; ref = idle ทิศนั้น + walk S เมื่อมี | §7 negative | seed ไม่รองรับ | 1:1 JPG พื้นดำ | 32 เฟรม. E `_02/_04` รีเจนเพราะหลุดเป็นหน้า. N/NE/NW ส่วนใหญ่เป็นหลังตามสเปก |
| `hero_sword_walk_*_sheet.jpg` | 2026-10-03 | Cursor GenerateImage — model identifier ไม่เปิดเผย | ชีท 2×2 สี่เฟรม | §7 negative | seed ไม่รองรับ | 1:1 JPG | **ทิ้ง.** โมเดลไม่หั่นช่อง — เป็นภาพเดียว/คอลลาจ |
| `hero_sword_idle_*_01.png` / `_02.png` | 2026-10-03 | โพสต์โปรเซส `tools/process_hero_frames.py` | — | — | — | 96×96 PNG alpha | Runtime 16 เฟรม. Pivot (48, 88). `_02` = breath จาก `_01` |
| `hero_sword_walk_*_{01-04}.png` | 2026-10-03 | โพสต์โปรเซส `tools/process_hero_frames.py` | — | — | — | 96×96 PNG alpha | Runtime 32 เฟรม. ยังไม่ทำ attack/sit/face |

หมายเหตุ: เครื่องมือคืน source เป็น JPG พื้นดำ แม้ขอ PNG/transparent — Phase 0 เป็น concept proof; Phase 1 คีย์พื้นด้วยสคริปต์แล้วส่ง PNG alpha จริงที่ `public/assets/hero/`

## 6. Prompt correction รอบถัดไป

- Hero: **ใช้แล้วใน Phase 1** — `camera elevated ~40 degrees, visible top planes of bun/shoulders, compact sword, sprite framing`; ล็อกต่อด้วยภาพ master S เป็น reference ทุกทิศ
- House: เพิ่ม `same camera pitch as hero ground plane, footprint no larger than 4x4 tiles, exactly two lanterns, simplified roof detail, no isometric 45-degree diamond`; ส่ง grid/camera guide เป็น reference
- UI: เพิ่ม `separate empty 56px header rail, cropped tightly to outer border, border visual weight 14–16px, stronger soot patina, corner ornaments confined to non-stretch zones`
- เมื่อเครื่องมือรองรับ image reference weight ให้ล็อก reference เดียวกันทั้ง family; ถ้าไม่รองรับ ให้คง prompt/token order และทำ generation ทีละ contact sheet เพื่อคัดความคลาดเคลื่อน

## 7. Phase 1 — Hero idle / walk (ล็อกแล้ว)

เกลี่ยจาก `concept_hero_sword_idle_s.png` + เรฟ `hero_sword_sheet_ref.png` (น้ำหนักแสง/ผ้า/ผมเท่านั้น) ห้ามรื้อตัวใหม่ ห้ามทำ pixel art

### Prompt ล็อกตัวละคร (ต่อท้ายทุกเฟรม)

```text
EXORCIST INK production sprite of the SAME male Taoist exorcist as the supplied painterly master: slender adult man, high silver-white hair bun, long flowing silver hair, one distinct black forelock, dark violet and near-black layered Taoist robes, subtle antique brass fasteners, one compact Chinese jian held close to the body in the right hand (blade shorter than the torso).

CAMERA LOCKED: 3/4 top-down Phaser sprite, camera elevated about 40 degrees, visible top planes of bun, shoulders, and robe collar. NOT a front fashion illustration. Full body in a square frame, feet near bottom center, head in the upper third.

LIGHTING locked from the UPPER-LEFT of the IMAGE (do not rotate light with facing). Robe reads as three values: fold shadow / mid plum-violet / small lit edge. Silver hair is volumetric clumps, crown highlight, darker underside, black forelock readable. Dry-brush ink outlines of varying weight. Narrow cool rim on the shadow side only. Soft oval contact shadow under the feet.

STYLE: Eastern dark-fantasy Chinese ink-wash painterly, soot-black shadows, aged dry-brush, subtle rice-paper grain, muted plum-violet. Isolated on pure solid black. NON-PIXEL-ART. No scenery, no text, no extra weapons, no chibi, no anime cel, no photoreal 3D.
```

Negative ที่ใช้จริง (รวมท้ายทุกครั้ง):

```text
pixel art, voxel, chibi, anime cel shading, photoreal 3D, front fashion illustration, extra limbs, extra weapons, extra people, text, letters, numbers, logo, UI, watermark, scenery, floor plane, labels, gutters, sprite-sheet numbers
```

### Token ท่า / ทิศ

| ช่อง | ค่าที่ล็อก |
|---|---|
| Idle `_01` | standing rest, weight even, sword down along the right hip |
| Idle `_02` | **ไม่เจน** — `tools/process_hero_frames.py` ทำ breath สเกล Y +1.6% รอบ pivot จาก `_01` เพราะโมเดลรีเจนแล้วเปลี่ยนท่า |
| Walk `_01` | contact, left foot forward |
| Walk `_02` | passing, feet close, mid-stride |
| Walk `_03` | opposite contact, right foot forward |
| Walk `_04` | second passing |
| `n` / `ne` / `nw` | หลังหรือหลังเฉียง หน้าซ่อน ผมเงินปิดหลัง |
| `s` / `se` / `sw` | หน้าหรือหน้าเฉียง เห็นหน้า+ปอยดำ |
| `e` / `w` | โปรไฟล์ขวา / ซ้าย |

### ไปป์ไลน์ย่อ 96×96

1. เจนซอร์ส 1:1 พื้นดำ (เครื่องมือคืน JPG)
2. คัดลอกซอร์สไป `public/assets/concept/hero_src/`
3. รัน `python tools/process_hero_frames.py` — คีย์พื้นดำแบบ flood จากขอบ **เฉพาะพิกเซลดำกลางที่ไม่ใช่ chroma ม่วง** แล้ววางเท้าที่ (48, 88) ความสูงตัวเป้า 76 px เผื่อช่องเงา 8 px
4. ส่ง runtime ที่ `public/assets/hero/hero_sword_<action>_<dir>_<เฟรม>.png`

ชีท 2×2 รวม 4 เฟรมเดิน **ใช้ไม่ได้** — โมเดลรวมเป็นภาพเดียว/คอลลาจ อย่าทำซ้ำ ต้องเจนทีละเฟรม

