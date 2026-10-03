# EXORCIST INK — Design Specs (Phase 1–2)

เจ้าของเอกสาร: **ภูมิ (Game Designer)** · ขอบเขตไฟล์: `docs/design/` เท่านั้น

## สารบัญ

| ไฟล์ | เนื้อหา |
|---|---|
| `01-movement-world.md` | Phase 1 — เดิน 8 ทิศ, animation state, collision, Y-sort, occlusion, กล้อง, ขนาดแผนที่ |
| `02-combat.md` | Phase 2 — basic attack/combo, สูตรดาเมจ/crit, HP/MP, EXP, stat point, Demon Boar, VFX, death, server-authoritative notes |
| `03-data-schema.md` | คำอธิบาย schema + หน่วยของทุกฟิลด์ใน `data/*.json` (เพราะ JSON ใส่ comment ไม่ได้) |
| `04-backlog.md` | ไอเดีย/สิ่งที่เลื่อนไป Phase 3+ และคำถามที่ต้องให้ต้น/Andy ตัดสินใจ |
| `data/*.json` | ตัวเลขจริง พร้อมวางใน `src/data/` |

## กฎพื้นฐานที่สเปกทั้งหมดยึด

1. **Sim tick = 60 Hz คงที่** (`SIM_TICK_HZ = 60`, `SIM_FIXED_DT_MS = 16.667`)
   เวลาทุกค่าใน combat/animation จึงระบุเป็น **ticks** เป็นหลัก และแปลงเป็น ms ให้ดูประกอบ
   (ms ที่เขียนในเอกสาร = ticks × 16.667 ปัดเศษ) — **โค้ดต้องใช้ ticks** เพื่อให้ deterministic
2. **Simulation ไม่แตะ Phaser** ค่าทุกค่าในเอกสารนี้อยู่ในหน่วย world-space px / ticks / ค่าดิบ
   ไม่มีอะไรอ้างอิง screen px หรือ delta time จาก render loop
3. ตัวเลขสุ่มทุกค่ามาจาก **seeded PRNG stream เดียว** และต้องเรียกตาม **ลำดับที่ระบุ** ใน `02-combat.md`
4. Tile = 64 px, Hero sprite = 96×96 px, Design resolution = 1920×1080

## สรุปค่าหลัก (quick reference)

| หัวข้อ | ค่า |
|---|---|
| ความเร็วเดิน hero | 180 px/s (= 2.8125 tile/s) |
| Collision box hero | 36 × 24 px ที่ฐานเท้า |
| maxHP | `150 + (level-1)*30 + VIT*20` → Lv32/VIT36 = **1800** |
| maxMP | `50 + (level-1)*10 + INT*10` → Lv32/INT26 = **620** |
| ATK | `10 + level + STR*2 + DEX*0.5 + weaponATK(refine)` |
| Mitigation | `1 - DEF/(DEF + 100 + 5*attackerLevel)` |
| Crit rate | `5 + LUK*0.3 + DEX*0.1` % (cap 60) |
| Stat point | 4/level + 1 ทุกเลเวลที่หาร 5 ลงตัว → Lv32 ได้รวม 130 |
| Demon Boar | Lv6, HP 320, ATK 38, DEF 18, EXP 42 |
