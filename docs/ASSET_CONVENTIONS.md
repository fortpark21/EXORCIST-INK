# Asset Naming & Pivot Conventions

กติกานี้ตรงกับ brief ที่ส่ง **พร (Art Director)** — ทุกคนอ้างอิงไฟล์นี้ + `ASSET_MANIFEST.md`

## พื้นฐาน

| รายการ | ค่า |
|--------|-----|
| ความละเอียดงาน | **1920×1080** (Scale FIT + auto center) |
| ขนาด tile | **64×64 px** |
| ขนาด hero sprite (frame) | **96×96 px** |
| Pivot hero ในเฟรม | **(48, 88)** |
| สไตล์ | Painterly (AI-assisted) — **ไม่ใช่ pixel art** (`pixelArt: false`, antialias เปิด) |
| บรีฟตัวละคร | **`docs/art/CHARACTER_SHEET.md`** |

## Pivot / Anchor

| ประเภท | Pivot |
|--------|--------|
| ตัวละคร (hero, NPC, monster) | **กลาง-ล่าง (ที่เท้า)** — ใช้ y-sort บนพื้น |
| Prop / สิ่งปลูกสร้าง | **ฐานวัตถุ** (จุดสัมผัสพื้น) |
| VFX ที่ลอย | ตาม brief ต่อชิ้น — บันทึกใน manifest |

## ทิศทาง 8 ทิศ

ใช้ตัวย่อเดียวกันทุก asset ที่มีทิศ:

`n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`

เรียงมุมตามเข็มนาฬิกาจากเหนือ (n) — **ห้ามสลับลำดับระหว่างตัวละคร**

## รูปแบบชื่อไฟล์

```
<หมวด>_<ชื่อ>_<action>_<dir>_<เฟรม 2 หลัก>.png
```

ตัวอย่าง:

- `hero_sword_walk_s_01.png`
- `hero_sword_idle_se_03.png`
- `prop_house_a.png` (ไม่มี action/dir/frame ถ้าเป็นภาพเดียว)
- `ui_frame_status.png`

หมวดที่ใช้บ่อย: `hero`, `npc`, `mob`, `prop`, `tile`, `ui`, `fx`, `bg`

## ไฟล์ภาพ

- ฟอร์แมต **PNG พร้อม alpha**
- **ห้ามฝังข้อความ/ตัวเลข dynamic** ใน texture UI (ใช้ Phaser text แทน)
- UI กรอบที่ยืดได้: ใช้ **9-slice** — ระบุขอบ slice (px) ใน `ASSET_MANIFEST.md`

## Path ใน repo

- Runtime: `public/assets/...`
- Concept (reference เท่านั้น): `public/assets/concept/` — **พรเป็นเจ้าของ ห้าม dev เขียนทับ**

## การอ้างอิงในโค้ด

- โหลดผ่าน Preload scene / asset manifest — ไม่ hardcode path กระจายหลายไฟล์
- ขนาด collision ไม่เท่ากับขนาด sprite เสมอ — ระบุใน manifest
