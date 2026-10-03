# EXORCIST INK — Art Bible / Style Guide (Phase 0)

สถานะ: เป้าหมายภาพสำหรับ style test ก่อนผลิต asset จริง  
Reference หลัก: mood board ที่ Andy ให้เมื่อ 2026-10-03

## 1. Visual direction

เกมต้องอ่านเป็น **Eastern dark-fantasy wuxia ที่วาดด้วยหมึกจีน** ไม่ใช่แฟนตาซีจีนสีสดและไม่ใช่ pixel art ภาพรวมมืด หม่น ชื้น มีหมอก โดยใช้แสงโคมแดง แสงผลึก และขอบแสงเย็นเป็นจุดนำสายตา ฉากเป็นมุม ¾ top-down / 2.5D และคง silhouette ของตัวละครกับทางเดินให้ชัดเมื่อย่อสู่ gameplay scale

คำหลักร่วม: painterly, Chinese ink wash, dry-brush edge, soot, aged paper grain, restrained color, readable top-down silhouette, atmospheric depth

## 2. Palette

ค่าสีด้านล่างเป็น representative swatches ที่ดูดและปรับรวมจาก reference หลัก เพื่อใช้เป็น token กลาง ไม่ได้หมายความว่าทุก pixel ต้องตรงค่านี้

### พื้นหลัง / เงามืด

| Token | Hex | ใช้กับ |
|---|---:|---|
| `ink-void` | `#090B0E` | ดำลึก, ช่องว่างนอกฉาก, panel เกือบทึบ |
| `ink-panel` | `#11161A` | พื้น UI |
| `ink-blueblack` | `#172027` | เงาฉากกลางคืน |
| `ink-mid` | `#2A3032` | ผิวหิน/ไม้ในเงา |
| `mist-cool` | `#687277` | หมอกและ atmospheric perspective |

### ทองเหลืองกรอบ UI

| Token | Hex | ใช้กับ |
|---|---:|---|
| `brass-shadow` | `#4B3A24` | ขอบด้านมืด/ร่อง |
| `brass-base` | `#80633A` | เส้นกรอบหลัก |
| `brass-warm` | `#A9864E` | สันรับแสง |
| `brass-highlight` | `#C5A86E` | highlight เล็กมาก |

### แดงโคม / ไฟ

| Token | Hex | ใช้กับ |
|---|---:|---|
| `lantern-deep` | `#6D211D` | ตัวโคมด้านมืด |
| `lantern-red` | `#B83D2F` | สีแดงหลัก |
| `ember-orange` | `#E46F3D` | เปลว/ขอบโคม |
| `fire-core` | `#F3B36A` | ใจกลางแสง ใช้แต้มเท่านั้น |

### ม่วงหมึก / พลังมาร

| Token | Hex | ใช้กับ |
|---|---:|---|
| `demon-plum` | `#38283F` | เงาพลังมาร |
| `ink-violet` | `#58456F` | ชุดตัวเอก/หมึกพลัง |
| `spirit-violet` | `#7762A5` | rim/VFX ชั้นกลาง |
| `spirit-cold` | `#9A8ED0` | core VFX เล็กน้อย |

### เขียวหม่นของทุ่ง

| Token | Hex | ใช้กับ |
|---|---:|---|
| `field-shadow` | `#26352F` | เงาหญ้า |
| `moss-dark` | `#3C5143` | มวลพุ่ม |
| `sage-muted` | `#65745D` | plane ที่รับแสง |
| `dead-grass` | `#817A58` | หญ้าแห้ง/ดิน |

### ผมเงินของตัวเอก

| Token | Hex | ใช้กับ |
|---|---:|---|
| `hair-shadow` | `#62666A` | กลุ่มผมด้านล่าง |
| `hair-silver` | `#AEB3B5` | สีหลัก |
| `hair-light` | `#D8D8D2` | ปอยรับแสง |
| `hair-spec` | `#EEE9DC` | highlight จำกัดพื้นที่ |
| `black-lock` | `#17191D` | ปอยดำประจำตัว |

### ตัวเลขดาเมจ

| ประเภท | Hex | Outline | หมายเหตุ |
|---|---:|---:|---|
| Normal damage | `#F1E3CF` | `#2A1512` | ขาวอุ่น อ่านง่าย |
| Critical damage | `#FF5A4E` | `#3A0C0A` | ขยาย 115–125% และกระแทกสั้น |
| Heal | `#67D79A` | `#102A1D` | ห้ามใช้เขียวนีออน |

ใช้ตัวเลขสีเต็มเฉพาะ HUD/VFX; สิ่งแวดล้อมจำกัด saturation โดยเฉลี่ยไว้ต่ำกว่า UI feedback

## 3. Composition และ value

- ค่า luminance ของฉากส่วนใหญ่ควรอยู่ในช่วงประมาณ 8–38%; พื้นที่สว่างเกิน 70% รวมกันไม่เกิน 8% ของเฟรม
- ตัวละครหลักต้องแยกจากพื้นหลังด้วย value difference อย่างน้อยประมาณ 2.5:1 ที่ silhouette สำคัญ; ข้อความ UI body ต้องตั้งเป้า WCAG contrast 4.5:1 กับพื้น panel
- ใช้ foreground มืด, midground อ่านรายละเอียด, background ลด contrast และ saturation 20–35% เพื่อสร้างระยะ
- จุดสว่างสุดเป็นใบหน้า/ผมเงิน, คมดาบ, ใจกลางโคม/ผลึก และ feedback การต่อสู้ ไม่กระจายเท่ากันทั้งจอ
- Rim light ตัวละครกว้าง 1–3 px ที่ขนาด sprite 96 px: สีเย็น `#8C94B8`/ม่วง `#7762A5`, opacity 35–65%; ฝั่งใกล้โคมใช้ rim อุ่น `#E46F3D` ได้แต่ไม่ล้อมรอบทั้งตัว
- Combat arena ต้องเหลือ negative space รอบผู้เล่นอย่างน้อยรัศมี 1.5–2 tiles เพื่ออ่าน telegraph และศัตรู

## 4. ภาษา Eastern ink

- **Brush stroke:** ขอบนอกมีจังหวะแห้ง/แตก แต่ silhouette หลักต้องไม่ฟุ้งจนชนพื้น; ใช้เส้นหนาบางตามน้ำหนัก ไม่ใช้ outline ดำเท่ากันรอบวัตถุ
- **Ink wash:** เงาใหญ่เป็นมวล 2–4 ระดับ เกลี่ยแบบหมึกซึมเฉพาะปลายเงา ไม่ใช้ airbrush เนียนทั่วภาพ
- **Paper texture:** grain ความถี่ละเอียด opacity 3–7% ด้วย `Soft Light`/`Multiply`; ห้ามทำให้ tile seam หรือ UI text สกปรก
- **Negative space:** เว้นพื้นที่มืดสงบเพื่อให้โคม, ผู้เล่น และ VFX มีจุดเด่น; ไม่เติม ornament ทุกช่อง
- **Detail hierarchy:** หน้า/อาวุธ/มือและฐานวัตถุคมที่สุด; ชายผ้า ใบไม้ หมอก และขอบไกลแตกเป็น brush shape
- ห้าม: pixel art, glossy mobile-fantasy, neon rainbow, cel-shaded anime, photoreal 3D render, ลายจีนแน่นทุกพื้นที่

## 5. ตัวเอก

นักพรตชาย ผมยาวสีเงินมีปอยดำที่อ่านได้แม้ย่อ ชุดนักพรตม่วงดำ ใช้ดาบจีนหนึ่งเล่ม รูปร่างเพรียวแต่ไม่บอบบาง ทิศใต้ (`s`) ต้องเห็นใบหน้า/อกและตำแหน่งเท้าชัด มุมกล้องต้องตรงกับ world ¾ top-down ไม่ใช่ภาพยืน front view

Hero sprite เป้าหมาย 96×96 px, PNG alpha, pivot กลาง-ล่างที่เท้า (`origin 0.5, 1.0` = **(48, 88)** ในเฟรม) ทุกทิศต้องรักษาความสูงศีรษะและตำแหน่งเท้าให้คงที่

บรีฟท่า / กริด / ลำดับผลิต / shading จากเรฟ Andy อยู่ที่ **`docs/art/CHARACTER_SHEET.md`** — เกลี่ยจากโครงเดิม ห้ามรื้อทั้งตัว; เรฟ pixel sheet ใช้เป็นน้ำหนักแสงเงาและท่า ไม่ได้สั่งให้ทำ pixel art

## 6. กติกา UI

### โครงและ hierarchy

- พื้น panel `#11161A` ที่ opacity 92–97%; texture หมึกละเอียดไม่เกิน 5%
- กรอบโลหะทองเหลือง: ขอบหลัก 2 px ที่ 1080p, inner hairline 1 px, bevel/shadow รวมไม่เกิน 5 px
- มุมประดับกินพื้นที่ไม่เกิน 24×24 px สำหรับ panel มาตรฐาน; ใช้รูปทรงจีนแบบ abstract ห้ามคล้ายตัวอักษร
- Radius 0–2 px; รูปทรงค่อนข้างเหลี่ยม ไม่ใช้ rounded card แบบแอปสมัยใหม่
- สัดส่วนแนะนำ: modal 16:10, status/skill panel 4:3, inventory 5:6, horizontal HUD strip ตามเนื้อหา
- เว้น safe padding จากกรอบถึง content 16 px; panel หนาแน่นใช้ขั้นต่ำ 12 px

### Typography ไทย

- Body: **Noto Sans Thai**, 18–22 px ที่ 1920×1080, line-height 1.45–1.60
- Heading: **Charm**, 26–34 px, line-height 1.35–1.50; ใช้เฉพาะหัวข้อสั้น
- Label เล็กสุด 16 px เฉพาะข้อมูลรอง; ห้ามต่ำกว่านี้ที่ native 1080p
- ต้องเผื่อ vertical clearance ด้านบนตัวอักษรไทยอย่างน้อย `0.35em` และด้านล่าง `0.20em` เพิ่มจากกล่อง x-height เพื่อรองรับสระบนสองชั้น/วรรณยุกต์ เช่น “ผู้ฝึกตน”, “การบำเพ็ญตน”
- ปุ่มสูงขั้นต่ำ 48 px; tab/header rail สูงขั้นต่ำ 52 px; ห้าม crop ด้วย line-height ตายตัวที่ชิด glyph
- จัด baseline ด้วย DOM/Canvas text metrics จริง ห้ามใช้การเล็งด้วยสายตาจากตัวอักษรละติน

### กฎเหล็กของภาพ UI

**UI image ทุกชิ้นต้องเป็นกรอบเปล่า ห้ามฝังชื่อ ตัวเลข ข้อความ ไอคอนสถานะ หรือข้อมูล dynamic ลงในภาพโดยเด็ดขาด** ชื่อผู้เล่น, เลเวล, HP/MP/EXP, ค่าสเตตัส, quest, จำนวนไอเท็ม และราคา ให้นัทวาดด้วยโค้ดทั้งหมด

ภาพที่เจนมี text-like artifact แม้เพียงเล็กน้อยถือว่าไม่ผ่าน

### 9-slice

ทำเป็น 9-slice:

- `ui_frame_panel_*`: slice border **16 px** ที่ไฟล์ export @1x
- `ui_frame_modal_*`: **24 px** เพราะมีมุมประดับใหญ่กว่า
- `ui_frame_tooltip_*`: **12 px**
- `ui_button_*`: ซ้าย/ขวา **16 px**, บน/ล่าง **12 px**
- `ui_slot_*`: ถ้าขนาดคงที่ 48/64 px ไม่ต้อง slice; ถ้าต้องยืดให้ใช้ **8 px**
- แถบ HP/MP/EXP: frame **8 px**, fill เป็นภาพ/shape แยก ห้าม bake ค่า fill

ห้ามวาง ornament หรือ highlight ที่พาดผ่าน stretch zone; ทดสอบที่ 0.75×, 1×, 1.5× และ panel กว้างสุดจริง

## 7. Asset convention ที่ต้องยึด

- Working resolution 1920×1080; tile 64×64 px; hero 96×96 px
- Character pivot = กลาง-ล่างที่เท้า; prop pivot = ฐานวัตถุ
- ทิศเรียง `n, ne, e, se, s, sw, w, nw`
- ชื่อไฟล์ `<หมวด>_<ชื่อ>_<action>_<dir>_<เฟรม 2 หลัก>.png`
- ตัวอย่าง `hero_sword_walk_s_01.png`, `prop_house_a.png`, `ui_frame_status.png`
- Delivery เป็น PNG มี alpha

ข้อเสนอเพื่อให้ทีมยืนยันภายหลัง: เพิ่ม metadata sidecar สำหรับ trim box/pivot และกำหนด padding extrusion ของ tileset 2 px เพื่อลด texture bleeding แต่ Phase 0 ยังไม่แก้ convention ที่ล็อกไว้

## 8. Phase 0 acceptance

- ภาพ concept ใช้พิสูจน์ mood เท่านั้น ยังไม่ใช่ game-ready asset
- ต้องตรวจ 3 ระดับ: ภาพเต็ม, ย่อประมาณ 96/256 px และวางบนพื้นเกมจริง
- ห้ามแตกชุดบ้าน/ต้นไม้/NPC/animation จน Andy อนุมัติ camera angle, material language และสี
