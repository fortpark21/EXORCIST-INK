# EXORCIST INK — Phaser 3 Rendering Notes (Phase 0)

เป้าหมาย: mood แบบ reference ที่ 1920×1080, WebGL, 60 FPS บน Phaser 3 >= 3.60  
หลักสำคัญ: ให้แสง/หมอกเสริมภาพวาด ไม่เปลี่ยน asset ให้เป็นงานเรืองแสงจัด

> API post-FX เปลี่ยนรายละเอียดได้ระหว่าง Phaser minor versions นัทต้องตรวจ type definition ของเวอร์ชันที่ติดตั้งจริง หากเมธอดใดไม่มี ให้ใช้ fallback ที่ระบุ ห้ามผูกระบบหลักกับ undocumented API

## 1. ลำดับชั้นภาพ

ลำดับจากล่างขึ้นบน:

1. ground tiles
2. decals / ground stains
3. props หลังตัวละคร (y-sort)
4. หมอกพื้นต่ำชั้นหลัง
5. characters / monsters / props หน้า (y-sort จาก pivot ฐาน)
6. VFX สกิลและแสงเฉพาะวัตถุ
7. หมอกบางชั้นหน้า
8. weather/foreground particles
9. camera color grade + vignette
10. HUD/UI ซึ่งต้องไม่รับ world color grade, bloom หรือ vignette

แยก `worldCamera` กับ `uiCamera`; ให้ UI camera ignore world layers และกลับกัน

## 2. หมอก (fog)

ใช้ **layered scrolling fog sprites** เป็นวิธีหลัก เพราะควบคุมง่ายและถูกกว่า full-screen shader:

- texture หมอก seamless ขาวเทา 512×512 หรือ 1024×512, 2–3 แบบ
- ชั้นหลัง: opacity `0.08–0.14`, scale `1.6–2.2`, ความเร็ว `3–7 px/s`, อยู่เหนือพื้นแต่หลัง character
- ชั้นกลาง/พื้นต่ำ: opacity `0.10–0.18`, scale `1.0–1.6`, ความเร็ว `7–12 px/s`, อยู่หลัง character และ mask ให้เกาะทาง/แอ่ง
- ชั้นหน้า: opacity `0.04–0.09`, scale `2.0–2.8`, ความเร็ว `12–20 px/s`, อยู่หน้า character แต่ห้ามบังกลางจอเกิน 15% alpha
- tint เมือง `#9AA4A5`, ป่า `#83958C`, dungeon `#777789`
- blend mode ใช้ `NORMAL` เป็นหลัก; `SCREEN` หรือ `ADD` เฉพาะ wisps บางมาก opacity <= `0.06`
- ใช้ `TileSprite.tilePositionX/Y` เลื่อนต่อเนื่องและ parallax ตามกล้อง 0.85–0.98

ทางเลือกคุณภาพสูง: custom fragment shader ใช้ 2-channel noise, UV scroll สองทิศ, distortion `0.015–0.025`, density `0.10–0.18`, edge falloff และ world-space mask แต่เปิดเฉพาะ preset High เพราะเป็น full-screen pass

Particle fog ใช้เฉพาะก้อนเฉพาะจุด: ไม่เกิน 40 particles ที่เห็นพร้อมกัน, lifespan 5–10 s, alpha peak <= 0.14; ไม่ใช้ particle หลายร้อยชิ้นแทนหมอกทั้งฉาก

## 3. แสงโคม / แสงไฟ

### วิธีหลัก: Light2D เมื่อทดสอบแล้วคุ้ม

- เปิด Lights Manager, ambient color เมืองประมาณ `#30363B`, ป่า `#25342E`, dungeon `#25232E`
- วัตถุ world ที่รับแสงต้องใช้ Light2D pipeline ตาม API ของ Phaser เวอร์ชันจริง
- โคมแดง: color `0xE0643E`, radius `170–230 px`, intensity `0.75–1.05`
- คบไฟ: color `0xF0A05A`, radius `140–200 px`, intensity `0.85–1.15`
- ผลึกแดง: color `0xB84145`, radius `190–270 px`, intensity `0.60–0.90`
- โคมประกอบฉากไกลลด radius เหลือ 100–150 px และ intensity 0.4–0.7

Flicker ห้ามใช้ random ใหม่ทุก frame เพราะกระตุก ให้ใช้ sine + smooth noise:

```ts
intensity = base * (1 + 0.045 * Math.sin(t * 7.1 + phase) + 0.025 * smoothNoise);
radius = baseRadius * (1 + 0.025 * Math.sin(t * 5.3 + phase));
```

อัปเดต noise 8–12 ครั้ง/วินาทีแล้ว interpolate; จำกัดความแกว่ง intensity รวมไม่เกิน ±8%

### Fallback: additive radial sprite

ใช้ gradient sprite 256×256 แบบโปร่ง, tint ตามสีด้านบน, `BlendModes.ADD`, alpha `0.12–0.24`, scale ให้ได้ radius เดียวกัน วางใต้ sprite เปลว/โคม แต่เหนือ geometry หลัก วิธีนี้ไม่เกิด shadow/normal response แต่คาดเดา performance ง่ายกว่า

อย่าวาง additive glow ซ้อนกันหลายชั้นจนดำหม่นกลายเป็นส้มขาว

## 4. Bloom / Glow

ใช้ object-local FX เป็นหลัก ไม่ bloom ทั้ง camera:

- โคม/ไฟ core: `addBloom(0xE46F3D, 1, 1, 0.8, 0.65, 4)` เป็น **ค่าเริ่มต้นเชิงแนวทาง**; ตรวจ signature ใน Phaser ที่ติดตั้งจริง
- ผลึก/VFX พลัง: bloom strength `0.55–0.85`, blur strength `0.6–1.0`, steps `3–4`
- ขอบสกิล: `addGlow(color, outerStrength 1.5–2.5, innerStrength 0–0.5, knockout false, quality 0.08–0.12, distance 8–12)`
- ห้ามใส่ bloom กับ panel UI, ตัวอักษร, ผมทั้งหัว หรือ terrain ทั้ง layer
- เปิดพร้อมกันเป้าหมาย: bloom objects <= 8, glow objects <= 12

Phaser 3.60+ มี FX API หลายชุด (`preFX`/`postFX`) แต่ availability ขึ้นกับชนิด Game Object และ renderer ถ้า `addBloom`/`addGlow` ใช้ไม่ได้ ให้ fallback เป็น pre-baked glow sprite + `ADD` หรือ render VFX กลุ่มหนึ่งลง RenderTexture แล้วทำ custom blur pass เดียว

หลีกเลี่ยง camera-wide bloom ที่ 1080p; ถ้าจำเป็นในฉาก cinematic ให้ downsample buffer 0.5× และปิดระหว่าง gameplay บน preset Medium

## 5. Vignette

ใช้กับ `worldCamera` เท่านั้น:

- center `x=0.50`, `y=0.48`
- radius `0.82–0.90`
- strength เมือง `0.28–0.38`, ป่า `0.32–0.42`, dungeon `0.40–0.52`
- ระหว่าง boss telegraph ลด strength ชั่วคราว 0.05–0.10 เพื่อไม่กินพื้นที่อันตรายที่ขอบ

แนวทาง API: `worldCamera.postFX.addVignette(0.5, 0.48, 0.86, 0.36)` หาก camera postFX ไม่มีใน build จริง ให้ใช้ full-screen vignette PNG บน camera-fixed world overlay, blend `MULTIPLY`, alpha 0.25–0.45 และให้ UI camera ignore

## 6. เอฟเฟกต์หมึก

ใช้ระบบผสม:

1. **Sprite sheet** สำหรับจังหวะหลักที่ art-direct ได้: slash, blot, talisman burst, demon flare; 8–16 frames, 12–20 fps, alpha PNG
2. **Distortion shader** เฉพาะ VFX ใหญ่: noise scale 3–6, edge distortion `0.02–0.045`, dissolve threshold animate 0→1 ใน 250–600 ms, feather `0.04–0.10`
3. **Mask/RenderTexture** สำหรับรอยหมึกแผ่: stamp brush 6–12 จุดลง RenderTexture แล้ว fade ทั้งก้อน แทนการมี particle จำนวนมาก
4. **Particles** เป็นเศษปลายพู่กัน: 12–30 ต่อ cast, lifespan 180–550 ms, speed 40–160 px/s, alpha 0.2→0, scale 0.25–0.8

สีสกิลผู้เล่น: core `#D8D8D2`, ink `#58456F`, edge `#9A8ED0`  
พลังมาร: core `#B83D2F`, ink `#38283F`, edge `#7762A5`

Blend: มวลหมึกใช้ `NORMAL`/`MULTIPLY`; ใช้ `ADD` เฉพาะ core/เส้นพลังไม่เกิน 20–30% ของพื้นที่ VFX ห้ามทำหมึกทั้งก้อนเรืองแสง

Sprite sheet เป็นทางเลือก production หลักเพราะคงรูปร่างและ performance ได้ดีที่สุด; shader เป็น accent ไม่ใช่ข้อบังคับทุกสกิล

## 7. Color grading

ให้ asset ต้นทางใกล้ palette ก่อน แล้วใช้ ColorMatrix แค่รวมภาพ:

- saturation `-0.16` ถึง `-0.24`
- contrast `+0.08` ถึง `+0.14`
- brightness `-0.03` ถึง `-0.07`
- blue/cyan bias ใน shadow เล็กน้อย; ห้าม tint ทั้งภาพด้วยสีน้ำเงินทึบ

ถ้าใช้ ColorMatrix API:

```ts
const grade = worldCamera.postFX.addColorMatrix();
grade.saturate(-0.20);
grade.contrast(0.10);
grade.brightness(-0.04);
```

ตัวเลขเป็นค่าเริ่มต้น ต้องตรวจ semantics/range กับ Phaser version จริง เพราะเมธอด ColorMatrix บางเวอร์ชันรับช่วงค่าต่างกัน ถ้าผลรุนแรงผิดคาด ให้ใช้ custom 4×5 color matrix หรือ LUT shader:

- shadows: เพิ่ม blue +3%, green +1%, ลด red -2%
- highlights: เพิ่ม warm red +2%, green +1%
- global saturation 82%, contrast 108%

ทำ grade ต่อโซน (เมือง/ป่า/dungeon) ผ่าน transition 400–800 ms ห้ามเปลี่ยนทันที

## 8. Performance budget

เป้าหมาย 60 FPS: frame time <= 16.67 ms; ตั้ง budget GPU สำหรับ world render <= 10–11 ms บนเครื่องเป้าหมายขั้นต่ำ

- dynamic Light2D ที่มีผลจริงพร้อมกัน <= 8 บน Medium, <= 16 บน High; decorative lights ที่เหลือใช้ additive sprite
- post-FX full-screen <= 2 passes ระหว่าง gameplay (color grade + vignette); fog shader/bloom full-screen นับเพิ่มและควรอยู่ High
- bloom <= 8 objects, glow <= 12 objects; pool FX และ Game Objects ห้ามสร้าง/ทำลายทุก cast
- transparent overdraw เป็นความเสี่ยงหลัก: หมอกใหญ่ซ้อน <= 3 layers, ลด texture bounds ให้แนบภาพ, หลีกเลี่ยง full-screen alpha spritesหลายใบ
- particles active รวมเป้าหมาย <= 250, ใน combat burst ไม่เกิน 400 ชั่วคราว; fog particles <= 40
- texture atlas แนะนำ 2048×2048; ตรวจ `MAX_TEXTURE_SIZE` ก่อนใช้ 4096
- RenderTexture หมึกไม่เกิน 1024×1024 ต่อพื้นที่ใช้งาน และ clear/reuse
- ไม่มี real-time shadow หลายดวงใน Phase 0; ใช้ baked/contact shadow
- มี preset Low/Medium/High: Low ปิด shader fog และ bloom, Medium ใช้ sprite fog + local glow, High เพิ่ม shader accent

เก็บ GPU timing/Chrome Performance trace ในฉาก stress test: ผู้เล่น 1, มอนสเตอร์ 20, โคมเห็นพร้อมกัน 12, VFX ซ้อน 6 casts, หมอก 3 layers

## 9. Integration checklist

- world และ UI อยู่คนละ camera/effect path
- asset alpha/premultiplication ไม่เกิดขอบดำ
- y-sort จาก pivot เท้า/ฐาน ไม่ใช่ขอบบน sprite
- ทดสอบ effect บนพื้นเมือง ป่า และ dungeon อย่างน้อยอย่างละหนึ่งฉาก
- ตรวจ color blindness/readability: danger telegraph ต้องพึ่ง shape/timing เพิ่มจากสีแดง
- ถ้า API ไม่ตรง type definition ให้เลือก fallback ในเอกสารนี้ก่อนเขียน custom pipeline ใหม่
