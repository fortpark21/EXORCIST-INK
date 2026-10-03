# EXORCIST INK — Workflow & Definition of Done

เอกสารฉบับ Phase 0 สำหรับทีมพ разработ — นัท (โปรแกรม), ภูมิ (ดีไซน์), พร (อาร์ต), มิว (เสียง), เฟิร์น (QA)

---

## Checklist (10 ข้อเดิม + 6 ข้อเพิ่ม)

### 1) Code Reuse
- ก่อนเขียนระบบใหม่ ค้นใน `src/` ว่ามี utility / pattern เดิมหรือไม่
- หลีกเลี่ยง duplicate logic โดยเฉพาะ save, data loader, tick loop

### 2) Clear Communication
- requirement ไม่ชัด (UX, balance, asset size) **ถามต้นก่อนลงมือ** — ต้นกรองไป Andy เฉพาะมติ product ที่บล็อกงาน
- บันทึกการตัดสินใจสั้น ๆ ใน **PR** หรือ docs ที่เกี่ยวข้อง

### 3) Scope Control
- ทำทีละระบบตาม task / phase — Phase 0 ไม่แตะ combat, tilemap เมือง, inventory จริง
- งานนอก scope ใส่ backlog ท้ายรายงาน

### 4) Architecture — Sim / Render แยกเคร่งครัด
- `src/sim/` = logic ล้วน **ห้าม import Phaser**
- `src/render/` = Scenes, sprite, UI, postFX
- `src/bridge/` = เชื่อม sim ↔ render + persistence (localStorage)
- ทุก PR ต้องผ่าน `tests/sim-no-phaser.test.ts` และ ESLint `no-restricted-imports` ใน `src/sim/`

### 5) Backward Compatibility (Save)
- ทุก save มี `version`
- เพิ่มเวอร์ชันใหม่ผ่าน migration chain ใน `src/sim/save/migrate.ts`
- save เสีย / เวอร์ชันแปลก → fallback เป็น default ไม่ crash

### 6) Pre-commit / ก่อนเปิด PR
```bash
npm run typecheck
npm run build
npm run test:run
```
- `test:run` ครอบ pure logic ใน `src/sim/`, `src/data/`, tests
- ผลต้องผ่านก่อนขอรีวิว — **ห้าม commit ตรง `main`**

### 7) Visual QA
- ตรวจ **desktop 1920×1080** แนบ screenshot
- ตรวจ **tablet** (เช่น 1024×768 หรือ iPad landscape) ว่า UI ไม่แตก
- ตรวจ **mobile landscape** อย่างน้อย 1 ขนาด (เช่น 854×480 / 812×375) — ปุ่มสัมผัสอ่านได้ กดได้
- ตรวจ **1280×720** (Scale FIT) เป็นจุดกลาง
- **ฟอนต์ไทย**: สระบน-ล่างไม่โดนตัด (ทดสอบคำเช่น "ปรับปรุงสำนักวิญญาณ", "ผู้ฝึกตน")
- เทียบ tone / framing กับ art bible (`docs/art/` — พรเป็นเจ้าของ)

### 8) Asset Management
- คลังภาพเริ่มจากศูนย์ — **ทำใหม่ทั้งหมด** ห้ามอ้างอิงไฟล์นอก repo ที่ไม่มีใน manifest
- อัปเดต `docs/ASSET_MANIFEST.md` ทุกครั้งที่เพิ่ม/เปลี่ยน asset ใน `public/assets/`
- **กรอกครบทุกคอลัมน์**: path, ขนาด px, pivot/anchor, จำนวนเฟรม, FPS, scale ในเกม, collision box (+ 9-slice ถ้าเป็น UI ยืดได้)

### 9) AI Prompt Documentation
- อัปเดต `docs/GENERATION_PROMPTS.md` (เจ้าของ: **พร** — นักพัฒนาคนอื่นห้ามแก้ไฟล์นี้)
- ต้องบันทึก **model, seed, negative prompt** คู่กับ asset

### 10) Transparent Reporting
- สรุปใน **PR**: สิ่งที่ทำ, ไฟล์ที่แก้, ผล typecheck/build/test, งานค้าง, dependency จากทีมอื่น

---

### A) Save Versioning & Migration
- `SaveDataV1` ใน `src/sim/save/types.ts`, `SAVE_VERSION_LATEST`
- serialize/deserialize ใน `src/sim/save/serialize.ts`
- chain migration ใน `src/sim/save/migrate.ts`

### B) Data-Driven Config
- Balance อยู่ใน `src/data/` — **ห้าม magic number ในระบบ gameplay**
- โหลดผ่าน `loadGameData()` + `validateGameData()`

### C) Definition of Done (DoD)
งานนับ **เสร็จ** เมื่อครบ **ทั้ง 4**:
1. โค้ดผ่าน `typecheck` + `build` + `test:run`
2. เล่น / ใช้งานได้จริงในเกม (ไม่ใช่แค่คอมไพล์ผ่าน)
3. เอกสาร + ASSET_MANIFEST อัปเดตแล้ว (ถ้างานเกี่ยวกับ asset/docs)
4. เฟิร์น (QA) ตรวจผ่านตาม checklist Visual + smoke ที่เกี่ยวข้อง

### D) Asset Naming & Pivot Convention
- ดู `docs/ASSET_CONVENTIONS.md` — ต้องตรงกับที่ส่งพรแล้ว

### E) Playtest Smoke Test
- ก่อนปิดงานใหญ่แต่ละ phase: เล่นครบ **core loop** (เควสต์ → ทุ่ง → ต่อสู้ → กลับเมือง → อัปเกรด) อย่างน้อย 1 รอบ
- Phase 0: smoke = เปิดเกม → เห็น Title ภาษาไทย + ไม่ error ใน console

### F) Performance Budget
- เป้า **60 FPS** ที่ 1920×1080 (WebGL) และอ่านได้บน tablet / mobile landscape
- กำหนดเพดาน entity บนจอ (รอ balance จากภูมิ — ตอนนี้ยังไม่ล็อกตัวเลข)

### G) Git — Branch & PR (มติ Andy)
- แยก `feature/…` หรือ `fix/…` จาก `main` ทุกงาน
- เปิด PR → ผ่าน `typecheck` + `build` + `test:run` + รีวิว ก่อน merge
- **ห้าม commit / push ตรง `main`**

### H) ฟอนต์เชิงพาณิชย์
- ใช้ได้เฉพาะฟอนต์ที่ **commercial use 100%** พร้อมหลักฐาน license ใน repo (เช่น ไฟล์ `OFL.txt` / `LICENSE` คู่กับไฟล์ฟอนต์)
- ระยะยาว **self-host** ใน repo — ไม่พึ่ง Google Fonts CDN
- ชุดปัจจุบันที่ล็อก: **Noto Sans Thai + Charm** (SIL OFL ใช้เชิงพาณิชย์ได้) — นัทย้ายเข้า repo เมื่อเข้า Phase 1 UI

### I) Asset จากศูนย์
- ไม่มีคลังเดิม — ทุกภาพ/เสียง/UI ผลิตใหม่ตาม art bible + conventions
- ไฟล์ที่ยังไม่มีใน `public/assets/` = ยังไม่มี ห้ามสมมติว่ามี

---

## มติที่ล็อกแล้ว (Andy + ต้น)

| หัวข้อ | มติ | ที่มา |
|--------|-----|--------|
| แพลตฟอร์ม | เว็บเป็นหลัก ต้องเล่นบนมือถือและแท็บเล็ตได้ (เบราว์เซอร์) เน้น landscape + ปุ่มสัมผัส — ยังไม่ห่อแอปเนทีฟ / Electron / Tauri | Andy |
| UX/UI | Responsive ทุกขนาดจอ — desktop 1920×1080 + tablet + mobile landscape | Andy |
| Git | Branch & PR ทุกงาน ไม่ commit ตรง `main` | Andy |
| ฟอนต์ | Commercial-free เท่านั้น; คง Noto Sans Thai + Charm (OFL) และ self-host พร้อม LICENSE | Andy + ต้น |
| เดดไลน์ | งานเดินต่อเนื่อง ไม่ดอง ติดขัดคุยต้นทันที | Andy |
| คลัง asset | ทำใหม่จากศูนย์ | Andy |

---

## โครงสร้าง repo (ย่อ)

```
exorcist-ink/
  src/sim/       ← headless logic + save + tick
  src/render/    ← Phaser scenes
  src/bridge/    ← sim driver + localStorage
  src/data/      ← balance types + loader
  docs/          ← workflow, manifest (design/art/audio = ทีมอื่น)
  public/assets/ ← runtime assets (concept/ = พร)
```

---

## สมมติฐานที่ต้นล็อกเพื่อไม่ดองงาน (Andy ไม่ทัก = ใช้ตามนี้)

| หัวข้อ | ที่ถือไป | หมายเหตุ |
|--------|----------|----------|
| ปิด Phase 0 | เฟิร์น smoke Title ผ่าน แล้วเข้า Phase 1 ทันที | ไม่รอสเปกเพิ่ม |
| ขอบเขต Phase 2 | เล่นจริง Lv.1–10 มอนหลัก Demon Boar ตัวเดียว | แคป 50 เป็นเอกสาร ไม่ทำถึงในเฟสนี้ |
| Loot | Auto-loot เข้ากระเป๋าทันที ไม่มีของร่วงพื้น | ตัด pickup entity / loot ownership |
| ร้าน Phase 2 | NPC ขายโพชั่น 2 รายการ (hardcode) | ปิดวงจรกลับเมืองซื้อของ |
| Dodge / Stamina | Phase 1–2 ไม่มีทั้งคู่ | อย่าวางเฟรม dodge |
| ทัช | Joystick + โจมตี / คุย / โพชั่น บน mobile/tablet landscape | ยังไม่ห่อแอปเนทีฟ |

---

## Backlog แนะนำหลัง Phase 0 (ยังไม่ทำในชิ้นแรก)

- Phase 1: การเคลื่อนที่ 8 ทิศ, collision, camera + ปุ่มสัมผัสพื้นฐาน
- ผูก UI กรอบทองเหลือง (9-slice) เมื่อพรส่ง asset — ต้องยืดตามจอ
- Light2D + postFX (bloom/vignette) ตาม art direction
- Multiplayer: lockstep / snapshot จาก sim layer (ออกแบบ protocol ทีหลัง)
