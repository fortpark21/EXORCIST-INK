# Asset Manifest — EXORCIST INK

ตารางรวม asset ที่ใช้ในเกมจริง (runtime) อัปเดตทุกครั้งที่เพิ่ม/เปลี่ยนไฟล์ใน `public/assets/` (ยกเว้น `concept/` ที่เป็นของพร)

## วิธีกรอก

| คอลัมน์ | คำอธิบาย |
|---------|-----------|
| **ID** | ชื่ออ้างอิงในโค้ด (snake_case) |
| **Path** | path จาก root repo เช่น `public/assets/ui/frame_status.png` |
| **Category** | hero / mob / prop / tile / ui / fx / audio … |
| **Size (px)** | ขนาดไฟล์ต่อเฟรม W×H |
| **Pivot / Anchor** | เช่น `(0.5, 1.0)` = กลาง-ล่างเท้า |
| **Frames** | จำนวนเฟรม (1 ถ้า static) |
| **FPS** | ความเร็วอนิเม (— ถ้าไม่ใช่อนิเม) |
| **In-game scale** | ตัวคูณใน Phaser (1 = 1:1 pixel ที่ design res) |
| **Collision box** | offset + ขนาด (px) หรือ — |
| **9-slice (L,T,R,B)** | ขอบ slice สำหรับ UI ยืดได้ หรือ — |
| **Notes** | ทิศทาง, variant, ผู้รับผิดชอบ |

---

## Runtime assets

| ID | Path | Category | Size (px) | Pivot / Anchor | Frames | FPS | In-game scale | Collision box | 9-slice (L,T,R,B) | Notes |
|----|------|----------|-----------|----------------|--------|-----|---------------|---------------|-------------------|-------|
| `hero_sword_idle` | `public/assets/hero/hero_sword_idle_{dir}_{01-02}.png` | hero | 96×96 | **(48, 88)** = Phaser origin `(0.5, 88/96)` | 2 ต่อทิศ × 8 ทิศ | 3 | 1 | foot `36×24` offset `(0, -10)`; hurt `44×72` offset `(0, -44)` จาก `movement.json` | — | ทิศ `n ne e se s sw w nw`. `_02` คือ breath จาก `_01` (สเกล Y +1.6% รอบ pivot) ไม่ใช่ท่าใหม่. PNG alpha. Painterly หมึกจีน — ห้ามเปิด `pixelArt`. |
| `hero_sword_walk` | `public/assets/hero/hero_sword_walk_{dir}_{01-04}.png` | hero | 96×96 | **(48, 88)** = Phaser origin `(0.5, 88/96)` | 4 ต่อทิศ × 8 ทิศ | 10 (ช้า 6) | 1 | เหมือน idle | — | ลำดับเฟรม `01` contact L → `02` passing → `03` contact R → `04` passing. หัวล็อกความสูงต่อทิศ. อย่าใช้ origin `(0.5, 1.0)` เพราะจะลอย 8 px เหนือเท้า. |

ไฟล์ runtime ทั้ง 48 ชิ้นอยู่ใน `public/assets/hero/` ชื่อเต็มตาม convention เช่น `hero_sword_idle_s_01.png`, `hero_sword_walk_nw_04.png`.

นัทผูกสไปรต์ฮีโร่ใน `WorldScene` แล้ว (origin 0.5, 88/96) — พร็อพโลกยังเป็นสี่เหลี่ยม placeholder

---

## Concept / WIP (อ้างอิง — ไม่โหลดใน build จนกว่าจะย้ายมา runtime)

| ID | Path | Notes |
|----|------|-------|
| | `public/assets/concept/` | พรเจน/เก็บ concept ที่นี่ — dev ไม่แก้ทับ |
| `hero_sword_sheet_ref` | `public/assets/concept/hero_sword_sheet_ref.png` | pixel-art turnaround จาก Andy — ใช้ดูสัดส่วน/ท่า/น้ำหนักผ้า-ผมเท่านั้น **ห้ามทำ pixel art ตามเรฟ** |
| `concept_hero_sword_idle_s` | `public/assets/concept/concept_hero_sword_idle_s.png` | โครงตัวเอกเดิมของพร (Phase 0) — Phase 1 เกลี่ยกล้อง/ผ้าจากภาพนี้ ไม่รื้อตัวใหม่ |
| `hero_src` | `public/assets/concept/hero_src/` | ซอร์สเจน 1:1 ก่อนคีย์/ย่อ — อย่าโหลดในเกม |
| `hero_phase1_contact` | `public/assets/concept/hero_phase1_contact.png` | ชีทเทียบ 8 ทิศ × (idle01 + walk 01–04) จุดส้ม = pivot (48, 88) |

---

*อัปเดตล่าสุด: 2026-10-03 Phase 1 hero idle/walk (พร)*
