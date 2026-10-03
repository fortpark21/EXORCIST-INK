# Phase 1 — Movement & World

เวอร์ชัน 1.1 · ภูมิ (Game Design) · ค่าทุกค่า = world-space px, ticks @60Hz, ms (อนุพันธ์)
เพิ่มใน 1.1: ทัช joystick → ธง 8 ทิศชุดเดียวกับคีย์บอร์ด · เลย์เอาต์มือถือ landscape + HUD responsive (§1.4, §10)

---

## 1. Input → Intent Vector

### 1.1 Key mapping

| Action | ปุ่ม |
|---|---|
| ขึ้น | `W` หรือ `ArrowUp` |
| ลง | `S` หรือ `ArrowDown` |
| ซ้าย | `A` หรือ `ArrowLeft` |
| ขวา | `D` หรือ `ArrowRight` |

- WASD และลูกศรเป็น **OR กัน** (กดอันไหนก็ได้ผลเดียวกัน) ไม่มี priority
- Render / bridge แปลง **keyboard และ/หรือทัช** → `InputFrame` ชุดเดียว แล้วส่งเข้า Sim **หนึ่งครั้งต่อ tick**

```
InputFrame { up, down, left, right, attack, potion, interact }   // boolean ล้วน
```

- ฟิลด์ทั้ง 7 มีอยู่ตั้งแต่ Phase 1 — **ห้ามเพิ่มฟิลด์** และห้ามใส่พิกัดนิ้ว / analog / pointerId ลงไป
- Phase 1 ใช้จริง: `up/down/left/right` + `interact` (ปุ่ม E)
- `attack` / `potion` **จองที่ไว้** ให้ Phase 2 ต่อปุ่มได้เลย — Phase 1 ส่ง `false` ตลอดถ้ายังไม่มีปุ่ม
- **ห้าม** ส่ง mouse position, นิ้ว (x/y), joystick magnitude, pointerId, หรือ delta time เข้า Sim

แหล่งอินพุตถูกรวมที่ render ก่อนเข้า Sim:

| แหล่ง | ได้ธงอะไรใน Phase 1 |
|---|---|
| คีย์บอร์ด | WASD/ลูกศร → ทิศ · `E` → `interact` |
| ทัช | joystick → ทิศ 8 ทางชุดเดียวกับคีย์บอร์ด · ปุ่มสัมผัส → `interact` |
| รวม | **OR** ทุกแหล่ง แล้วค่อยเข้าสูตร `rawX/rawY` ข้อ 1.2 (ตรงข้ามหักล้างเป็นศูนย์ตามเดิม) |

### 1.2 สร้าง raw vector

```
rawX = (right ? 1 : 0) - (left ? 1 : 0)
rawY = (down  ? 1 : 0) - (up   ? 1 : 0)
```

> หมายเหตุ: ใช้ **y ลงเป็นบวก** ตลอดสเปกนี้ (ตรงกับ screen space ของ Phaser) เพื่อไม่ต้องกลับเครื่องหมายใน render

**กดปุ่มตรงข้ามพร้อมกัน** (เช่น A+D): rawX = 0 → หักล้างกันเป็นศูนย์ ไม่ใช่ last-input-wins
เหตุผล: deterministic ง่ายกว่า และไม่ต้องเก็บ state ลำดับการกด (สำคัญตอนทำ netcode)

### 1.3 Normalize — เดินทแยงต้องไม่เร็วกว่าเดินตรง

```
len = sqrt(rawX² + rawY²)
if len > 0:
    dirX = rawX / len
    dirY = rawY / len
else:
    dirX = dirY = 0
```

ผลลัพธ์: เดินตรง = (±1, 0) หรือ (0, ±1) · เดินทแยง = (±0.70710678, ±0.70710678)
ความเร็วปลายทางเท่ากันทุกทิศ = **180 px/s**

> **ห้าม** ใช้ `velX = speed * rawX; velY = speed * rawY` เพราะทแยงจะได้ 254.6 px/s (เร็วขึ้น 41%)

### 1.4 ทัช joystick → ธง 8 ทิศ (render / bridge เท่านั้น)

> **กฎเหล็ก:** Sim เห็นแค่ boolean สี่ทิศเหมือนกด WASD  
> Joystick เป็น analog บนจอ แต่ **ห้าม** ส่งพิกัดนิ้วหรือความแรงแท่งเข้า Sim  
> พอผ่าน dead zone แล้วเดินเต็ม `walkSpeed` เสมอ — ไม่มีเดินช้าตามแรงนิ้ว (Phase 1–2 ไม่มี stamina/dodge)

ค่าคงที่ของชั้นแปลง (ไม่เข้า Sim):

| ค่า | ตัวเลข | ความหมาย |
|---|---|---|
| `joystickDeadzone` | **0.28** | สัดส่วนรัศมีแท่ง — ต่ำกว่านี้ = ไม่มีอินพุต |
| `axisThreshold` | **0.38268343** | `cos(67.5°)` — แบ่ง 8 เสี้ยวละ 45° |

```
// render/bridge เท่านั้น — y ลงเป็นบวก เหมือนข้อ 1.2
nx = stickX / maxRadius
ny = stickY / maxRadius
mag = hypot(nx, ny)
if mag > 1:
    nx /= mag; ny /= mag; mag = 1

if mag < 0.28:
    up = down = left = right = false     // ปล่อยแท่ง / อยู่ใน dead zone
else:
    dirX = stickX / hypot(stickX, stickY)
    dirY = stickY / hypot(stickX, stickY)
    left  = dirX <= -0.38268343
    right = dirX >=  0.38268343
    up    = dirY <= -0.38268343
    down  = dirY >=  0.38268343
```

ผลลัพธ์เข้าข้อ 1.2–1.3 และ `DIR_LUT` ข้อ 3.2 **โดยไม่แก้สูตร Sim**

| มุมแท่ง (0° = ขวา, หมุนตามเข็ม, y ลงบวก) | ธงที่ได้ | ทิศ 8 ทาง |
|---|---|---|
| 337.5° .. 22.5° | right | ขวา |
| 22.5° .. 67.5° | right+down | ลง-ขวา |
| 67.5° .. 112.5° | down | ลง |
| 112.5° .. 157.5° | left+down | ลง-ซ้าย |
| 157.5° .. 202.5° | left | ซ้าย |
| 202.5° .. 247.5° | left+up | ขึ้น-ซ้าย |
| 247.5° .. 292.5° | up | ขึ้น |
| 292.5° .. 337.5° | right+up | ขึ้น-ขวา |

**กฎนิ้ว (pointer):**
- รองรับ **สองนิ้วพร้อมกัน**: นิ้วหนึ่งจับ joystick + นิ้วหนึ่งแตะปุ่ม (จำเป็นตั้งแต่ Phase 1 เพราะต้องเดินไปกดคุย)
- Joystick ผูกกับ pointer ที่เริ่มใน **โซนจับซ้าย** (§10.2) ไม่ใช่ทุกนิ้วบนจอ
- ปุ่มผูกกับ pointer ที่ลงใน hit rect ของปุ่มนั้น
- pointer up / cancel / หลุดนอกจอ → ปล่อยเฉพาะคอนโทรลนั้น ไม่รีเซ็ตอีกนิ้ว
- ภาพลูกบิดตามนิ้วได้ (clamp ในวง) แต่ InputFrame ยังเป็น digital 8 ทิศ

**อย่าทำ:** analog walk speed · ส่ง `{ stickX, stickY }` เข้า Sim · เพิ่มแกน dodge/stamina · ปุ่มโจมตี/โพชั่นใน Phase 1 (จองที่เลย์เอาต์อย่างเดียว)

---

## 2. ความเร็วและความเร่ง

| ค่า | ตัวเลข | หน่วย |
|---|---|---|
| `walkSpeed` | **180** | px/s |
| `accel` | **1440** | px/s² |
| `decel` | **2160** | px/s² |
| `turnSnap` | ทันที | — |
| `stopEpsilon` | 4 | px/s |

### 2.1 อัปเดตความเร็วต่อ tick (dt = 1/60 s)

```
targetVel = { dirX * walkSpeed, dirY * walkSpeed }

if (dirX,dirY) != (0,0):
    // มี input → เร่งเข้าหา target
    rate = accel
else:
    rate = decel

velX = moveToward(velX, targetVel.x, rate * dt)
velY = moveToward(velY, targetVel.y, rate * dt)

if (dirX,dirY) == (0,0) and magnitude(vel) < stopEpsilon:
    vel = {0, 0}          // กันค่าหางแมวลอยค้าง
```

`moveToward(cur, target, maxStep)` = `cur + clamp(target - cur, -maxStep, +maxStep)`

**เวลาเร่งถึงความเร็วเต็ม** = 180 / 1440 = **0.125 s (8 ticks)**
**เวลาเบรกจนหยุด** = 180 / 2160 = **0.0833 s (5 ticks)**

### 2.2 เปลี่ยนทิศกลางทาง
ไม่ต้องหยุดก่อน — `moveToward` ทำงานแยกแกน X/Y จึงหักเลี้ยวได้ลื่น
การหมุน 180° (เช่น เดินขวาแล้วกดซ้าย) จะใช้ 180→-180 = 360 px/s ที่ rate = accel → **0.25 s (15 ticks)**
ถ้าทดสอบแล้วรู้สึกหนืด: ให้เพิ่ม rule ว่าถ้า `sign(target) != sign(vel)` ใช้ `decel` แทน `accel` (จะเหลือ 10 ticks)
→ **เปิด flag `snappyReverse` ใน `movement.json` ให้นัทลองสองแบบ** ค่า default = `true`

### 2.3 Movement ขณะทำ action
| State | เดินได้ไหม |
|---|---|
| `idle`, `walk` | ได้เต็มความเร็ว |
| `attack.startup` | ไม่ได้ (vel ถูกบังคับเป็น 0 ทันที) |
| `attack.active` | ไม่ได้ |
| `attack.recovery` | ได้ หลังผ่าน 50% ของ recovery ticks (ปัดขึ้น) — ก่อนนั้นล็อก |
| `hurt` (stagger) | ไม่ได้ |
| `dead` | ไม่ได้ |

---

## 3. ทิศทาง 8 ทิศ (Facing)

### 3.1 Index มาตรฐาน
ใช้เลข 0–7 เรียงตามเข็มนาฬิกาเริ่มจากลง (down) — **ล็อกลำดับนี้ไว้ ใช้ตรงกับ sprite sheet row index**

| idx | ชื่อ | vector | suffix ชื่อ animation |
|---|---|---|---|
| 0 | ลง | (0, +1) | `down` |
| 1 | ลง-ซ้าย | (−0.707, +0.707) | `down_left` |
| 2 | ซ้าย | (−1, 0) | `left` |
| 3 | ขึ้น-ซ้าย | (−0.707, −0.707) | `up_left` |
| 4 | ขึ้น | (0, −1) | `up` |
| 5 | ขึ้น-ขวา | (+0.707, −0.707) | `up_right` |
| 6 | ขวา | (+1, 0) | `right` |
| 7 | ลง-ขวา | (+0.707, +0.707) | `down_right` |

### 3.2 แปลง vector → idx

เพราะ input เป็น discrete 8 ค่าเท่านั้น ให้ใช้ **lookup table** ไม่ต้องใช้ atan2 (เร็วกว่าและ deterministic 100%):

```
key = (rawX + 1) * 3 + (rawY + 1)      // rawX,rawY ∈ {-1,0,1} → key ∈ 0..8
DIR_LUT = [
  3,  // key0: x=-1 y=-1  up-left
  2,  // key1: x=-1 y= 0  left
  1,  // key2: x=-1 y=+1  down-left
  4,  // key3: x= 0 y=-1  up
  -1, // key4: x= 0 y= 0  ไม่มี input → คงทิศเดิม
  0,  // key5: x= 0 y=+1  down
  5,  // key6: x=+1 y=-1  up-right
  6,  // key7: x=+1 y= 0  right
  7,  // key8: x=+1 y=+1  down-right
]
```

**กฎ:** ถ้า `DIR_LUT[key] == -1` (ปล่อยปุ่มหมด หรือ joystick อยู่ใน dead zone ที่แปลงแล้วได้ธงว่าง) → **ไม่เปลี่ยน facing** ค้างทิศล่าสุดไว้
Sim **ไม่มี** hysteresis / ไม่มี dead zone เพราะอินพุตที่เข้ามาเป็น digital แล้ว
Dead zone ของ joystick อยู่ที่ชั้นแปลงข้อ 1.4 เท่านั้น ห้ามย้ายเข้า Sim

### 3.3 Facing lock ตอนโจมตี
- `facing` ถูก **freeze** ตั้งแต่ frame แรกของ `attack.startup` จนจบ `attack.active`
- ช่วง `attack.recovery` เปลี่ยน facing ได้ (เพื่อเล็งคอมโบถัดไป) แต่ sprite ยังเล่น animation โจมตีค้างอยู่
- ตอน hurt: facing **ไม่เปลี่ยน** (ยังหันทิศเดิม) ให้อ่านง่ายว่าเราหันไหน

---

## 4. Animation State Machine

### 4.1 Sprite sheet layout (ให้พอร์นทำตามนี้)
- Frame ขนาด **96 × 96 px**
- Pivot / origin = **(48, 88)** ในเฟรม → จุดนี้คือ "จุดกลางระหว่างเท้า" ของตัวละคร
  (ไม่ใช่ 96 เพราะเว้น 8 px ไว้ให้เงา/ฝุ่นใต้เท้า)
- `idle`: 8 แถว × **2 เฟรม** (หายใจ) — บรีฟบอก "idle 8 ทิศ" แต่ภาพนิ่งทื่อ ขอ 2 เฟรมไว้
  **ถ้าพอร์นส่งมา 1 เฟรม ให้ระบบรองรับทั้ง 1 และ 2 เฟรม** (`idleFrameCount` ใน json)
- `walk`: 8 แถว × **4 เฟรม**
- `attack`: 8 แถว × 4 เฟรม (รายละเอียดใน `02-combat.md`)
- `hurt`: 8 แถว × 1 เฟรม
- `dead`: 8 แถว × 4 เฟรม (ใช้แค่แถว 0 ก็พอในเฟสนี้ แต่เผื่อไว้)

### 4.2 FPS

| Animation | เฟรม | FPS | ความยาวรอบ |
|---|---|---|---|
| `idle` | 2 | **3** | 667 ms (40 ticks) |
| `walk` | 4 | **10** | **400 ms (24 ticks)** — 6 ticks/เฟรม |
| `attack` step1/2 | 4 | ผูกกับ action ticks | 367 ms |
| `attack` step3 | 4 | ผูกกับ action ticks | 550 ms |
| `hurt` | 1 | — | 8 ticks (133 ms) |
| `dead` | 4 | 6 | 667 ms |

**เช็ค stride:** walk 4 เฟรม/400 ms ที่ 180 px/s = เดินได้ 72 px ต่อรอบ = 18 px ต่อเฟรม
→ 1 รอบ walk ≈ 1.125 tile พอดีกับก้าว 2 ก้าว (ซ้าย-ขวา) ของสไปรท์ 96px **ไม่ลื่นไถล**

**Walk animation ต้องไม่ผูก FPS กับความเร็วจริง** (คงที่ 10 FPS) แต่ **ถ้า** `|vel| < 0.4 * walkSpeed`
(ช่วงกำลังเร่ง 3 ticks แรก) ให้เล่นที่ 6 FPS เพื่อไม่ให้ดูขาถี่ตอนออกตัว

### 4.3 เงื่อนไขสลับ state (priority สูง → ต่ำ)

```
1. dead       : hp <= 0
2. hurt       : staggerTicksRemaining > 0
3. attack     : attackState != none   (startup/active/recovery)
4. walk       : magnitude(vel) >= WALK_ANIM_THRESHOLD (= 12 px/s)
5. idle       : นอกนั้นทั้งหมด
```

- `WALK_ANIM_THRESHOLD = 12 px/s` — ต่ำกว่านี้ถือว่านิ่ง (กัน flicker ตอนชนกำแพงแล้ว vel เหลือเศษ)
- **เปลี่ยน state แล้ว reset frame index เป็น 0** ยกเว้น `walk → walk` ที่เปลี่ยนแค่ทิศ
  (ให้ **คงเฟรมเดิม** ไว้ตอนหักเลี้ยว ไม่งั้นขาจะกระตุก)
- `attack → idle/walk` ต้องรอ animation โจมตีจบจริง (ticks หมด) ไม่ตัดกลางคัน
  ยกเว้นถูก interrupt ด้วย `hurt` หรือ `dead`

---

## 5. Collision

### 5.1 หลักการ — Base-only collider

> **กฎเหล็ก:** collider ของทุกอย่างคือ **รูปทรงที่ฐานของวัตถุเท่านั้น** ไม่ใช่ขอบภาพ
> ตัวละครต้องเดินผ่านหลังคาบ้าน ยอดต้นไม้ หัวโคม ได้โดยไม่ชน

ทุก collider เป็น **AABB** (axis-aligned bounding box) นิยามด้วย:
- `w`, `h` = ความกว้าง/สูงของกล่อง (px)
- `anchor` = จุดอ้างอิงคือ **pivot ของวัตถุ** (= จุดกลางฐาน)
- `offsetX`, `offsetY` = เลื่อนจุดศูนย์กลางกล่องจาก pivot (px, y ลงเป็นบวก)

AABB ใน world space:
```
left   = pivotX + offsetX - w/2
right  = pivotX + offsetX + w/2
top    = pivotY + offsetY - h/2
bottom = pivotY + offsetY + h/2
```

### 5.2 Hero collider

| ค่า | ตัวเลข |
|---|---|
| `w` | **36 px** |
| `h` | **24 px** |
| `offsetX` | 0 |
| `offsetY` | **−10 px** |

→ กล่องกินพื้นที่ `pivotY - 22` ถึง `pivotY + 2` คือ **คร่อมเท้าพอดี ล้ำลงล่าง 2 px**
เทียบกับ sprite 96×96: กล่องกว้าง 37.5% ของภาพ สูง 25% ของภาพ อยู่ล่างสุด
เหตุผลเลือก 36 px (< 64 px tile): เดินลอดช่องกว้าง 1 tile ได้สบาย ไม่ติดมุม

> **หมายเหตุสำคัญ:** collider นี้ใช้สำหรับ **เดินชนฉาก** เท่านั้น
> hitbox รับดาเมจ (hurtbox) เป็นอีกกล่อง = **44 × 72 px, offsetY −44** (คร่อมลำตัว) ดู `02-combat.md`

### 5.3 Prop collider ทั้งหมด

ค่าทั้งหมดอยู่ใน `data/world-props.json` ตารางนี้คือฉบับอ่านง่าย

| id | ชื่อไทย | visual (px) | collider w×h | offsetY | หมายเหตุ |
|---|---|---|---|---|---|
| `house_small` | บ้านเล็ก | 256×320 | **240 × 96** | −40 | ฐานบ้าน+ชายคาล่าง |
| `house_large` | บ้านใหญ่ | 384×448 | **368 × 128** | −56 | |
| `tree_large` | ต้นไม้ใหญ่ | 192×256 | **44 × 32** | −14 | แค่ลำต้น เดินใต้พุ่มได้ |
| `tree_small` | ต้นไม้เล็ก | 128×160 | **30 × 24** | −10 | |
| `wall_stone` | กำแพงหิน (1 ช่วง) | 64×128 | **64 × 52** | −24 | ต่อกันเป็นแนวได้ ไม่มีรอยรั่ว |
| `rock_large` | หินก้อนใหญ่ | 128×112 | **96 × 48** | −20 | |
| `rock_small` | หินก้อนเล็ก | 64×64 | **52 × 32** | −14 | |
| `crate` | ลัง | 64×64 | **56 × 40** | −18 | |
| `barrel` | ถัง | 64×80 | **44 × 36** | −16 | |
| `sign_wood` | ป้ายไม้ | 64×96 | **40 × 20** | −8 | interactable |
| `shrine` | ศาล | 192×256 | **160 × 80** | −34 | จุด respawn ผู้เล่น |
| `fence_wood` | รั้วไม้ (1 ช่วง) | 64×64 | **64 × 24** | −10 | เตี้ย ไม่ fade |
| `gate_town` | ประตูเมือง | 192×224 | **สองกล่อง** ดูล่าง | — | ตรงกลางเดินผ่านได้ |
| `lantern_post` | โคมเสา | 64×160 | **22 × 22** | −10 | ชนแค่เสา |

**`gate_town` ใช้ 2 collider:**
- ซ้าย: `w 44, h 56, offsetX −74, offsetY −26`
- ขวา: `w 44, h 56, offsetX +74, offsetY −26`
- ช่องกลางกว้าง **104 px** (> hero 36 px) เดินผ่านได้ ไม่ต้องมี state เปิด/ปิดในเฟสนี้

### 5.4 Tile collision
- Tilemap มี layer `collision` ที่แต่ละ tile เป็น blocked/passable (boolean)
- tile ที่ blocked = AABB เต็ม 64×64 px ตามกริด
- ใช้สำหรับ: น้ำ, เหว, ขอบแผนที่, พื้นที่ห้าม

### 5.5 Collision resolution — per-axis swept AABB

```
// 1) ขยับแกน X ก่อน
nextX = pos.x + velX * dt
if overlapsAnySolid(aabbAt(nextX, pos.y)):
    nextX = resolveX(pos.x, nextX)   // ดันกลับไปชิดขอบ blocker
    velX = 0
pos.x = nextX

// 2) แล้วขยับแกน Y
nextY = pos.y + velY * dt
if overlapsAnySolid(aabbAt(pos.x, nextY)):
    nextY = resolveY(pos.y, nextY)
    velY = 0
pos.y = nextY
```

**ทำไมแยกแกน:** ทำให้ได้ **wall sliding** ฟรี — เดินทแยงเข้ากำแพงแนวตั้ง แกน X ตัน แต่แกน Y ยังเลื่อนได้
ผู้เล่นจะไถลไปตามกำแพงแทนที่จะหยุดตาย (สำคัญมากกับเกม action)

**Broadphase:** แบ่ง prop collider ลง **spatial hash grid ขนาด 128 × 128 px** (2×2 tile)
query เฉพาะ 9 cell รอบตัว → ไม่ต้องวน collider ทั้งแมพ

**Corner cut:** ถ้า tick เดียวขยับได้ 180/60 = 3 px เท่านั้น → ไม่มีปัญหา tunneling
แต่ **ต้องใส่ guard**: ถ้า `|velX * dt| > 16 px` ให้แบ่ง sub-step ทีละ 8 px (เผื่อ knockback/charge ในอนาคต)

### 5.6 Monster collision
- Demon Boar collider: **56 × 36 px, offsetY −16** (ดู `monsters.json`)
- มอนชนฉาก: ใช้ระบบเดียวกับ hero
- **มอน ↔ มอน: ไม่ชนกันแบบแข็ง** ใช้ **soft separation** แทน
  ถ้า distance ระหว่าง pivot < `58 px` ให้ดันแยกกันด้วยแรง `90 px/s` ตามแนวเชื่อมจุดศูนย์
  (ป้องกันมอนทับกันเป็นก้อนเดียว แต่ไม่ทำให้ติดกันจนขยับไม่ได้)
- **ผู้เล่น ↔ มอน: ไม่ชนกันแบบแข็ง** เดินทะลุกันได้ ป้องกันถูกขังมุมจนตาย (body block)
  แต่ยังโดนโจมตีปกติ

---

## 6. Y-sorting / Depth

### 6.1 กฎ
> ใครที่ **เท้าอยู่ล่างกว่า** (pivotY มากกว่า) จะถูกวาด **ทับ** คนที่เท้าอยู่บนกว่า

```
depth = round(pivotY * 10) + layerBias + tieBreak
```

| ส่วน | ความหมาย |
|---|---|
| `pivotY * 10` | ค่าหลัก คูณ 10 เพื่อมีที่ให้ bias แทรกไม่ชนกัน |
| `layerBias` | `-5` = เงา/เอฟเฟกต์พื้น, `0` = entity/prop ปกติ, `+3` = เอฟเฟกต์ลอยเหนือตัว, `+5` = damage number |
| `tieBreak` | ถ้า pivotY เท่ากันเป๊ะ ใช้ `entityId % 3` (0–2) ให้ลำดับคงที่ ไม่กระพริบ |

ช่วงค่า: แผนที่สูงสุด 6144 px → depth max ≈ 61,445 ปลอดภัยใน int32 ของ Phaser

### 6.2 เลเยอร์ที่ **ไม่** เข้า Y-sort (depth คงที่)

| เลเยอร์ | depth |
|---|---|
| Ground tilemap | `-100000` |
| Ground decal (รอยเท้า, คราบหมึก, พรม) | `-90000` |
| **Y-sorted layer** | ตามสูตรข้อ 6.1 |
| Overhead tilemap (สะพาน/ชั้นลอย — Phase 3) | `200000` |
| UI / HUD | ใช้ Scene แยก |

### 6.3 Prop ที่ต้องแตกเป็นหลายชิ้น
`house_large` สูง 448 px ถ้าใช้ depth เดียวจาก pivot จะมีกรณีผู้เล่นยืนข้าง ๆ บ้านด้านบนแล้วถูกบ้านทับทั้งตัว
→ **ไม่ต้องแตกชิ้นในเฟสนี้** ใช้ occlusion fade (ข้อ 7) แก้แทน ง่ายกว่าและเพียงพอ
(บันทึกไว้ใน backlog ว่าถ้าภายหลังมีตึกสูงมาก ให้แยกเป็น `_base` + `_top` sprite สองตัว)

---

## 7. Occlusion — วัตถุจางลง 50%

### 7.1 เงื่อนไขว่าวัตถุบังผู้เล่นอยู่

วัตถุ `P` ต้องจาง เมื่อ **ครบทั้ง 3 ข้อ**:

1. `P.fadeable == true` (ตั้งใน `world-props.json`)
2. `P.depth > hero.depth` — นั่นคือ `P.pivotY > hero.pivotY` แปลว่า P ถูกวาดทับ hero
3. **hurtbox ของ hero** (44 × 72 px, offsetY −44) **ซ้อนทับ** กับ `occlusionRect` ของ P

`occlusionRect` = กรอบส่วน "ที่ลอยอยู่เหนือฐาน" ของวัตถุ นิยามแยกจาก collider
(ไม่ใช้กรอบภาพทั้งใบเพราะ sprite มีพื้นที่โปร่งใสเยอะ จะ false positive)

| id | occlusionRect w×h | offsetY | fadeable |
|---|---|---|---|
| `house_small` | 240 × 240 | −200 | ✅ |
| `house_large` | 368 × 340 | −278 | ✅ |
| `tree_large` | 176 × 170 | −168 | ✅ |
| `tree_small` | 112 × 110 | −102 | ✅ |
| `wall_stone` | 64 × 80 | −88 | ✅ |
| `shrine` | 180 × 180 | −164 | ✅ |
| `gate_town` | 192 × 160 | −144 | ✅ |
| `lantern_post` | 56 × 56 | −130 | ✅ |
| `rock_large` / `rock_small` | — | — | ❌ เตี้ย |
| `crate` / `barrel` / `fence_wood` / `sign_wood` | — | — | ❌ เตี้ย |

### 7.2 ค่า fade

| ค่า | ตัวเลข | หน่วย |
|---|---|---|
| `fadeAlpha` | **0.50** | alpha (= จาง 50% ตามบรีฟ) |
| `fadeInDuration` | **120** | ms (7 ticks) — จางเร็ว ให้เห็นตัวละครทันที |
| `fadeOutDuration` | **260** | ms (16 ticks) — กลับทึบช้ากว่า ไม่วูบวาบ |
| `fadeEasing` | linear | — |
| `holdTicks` | **6** (100 ms) | ยังนับว่า "บัง" ต่ออีก 6 ticks หลังหลุดเงื่อนไข กัน flicker ตอนเดินเลียบขอบ |
| `maxFadingObjects` | **12** | soft cap กัน perf ถ้าเกิน เอาตัวที่ overlap area มากสุด 12 ตัว |

### 7.3 ที่อยู่ของ logic นี้
> **Occlusion เป็นงานของ Render layer ไม่ใช่ Sim**
> Sim ส่งแค่ `heroPivot` + `heroHurtbox` มาให้ และ render ตัดสินเอง
> เหตุผล: alpha ไม่มีผลต่อ gameplay → ไม่ต้อง sync ข้าม network เลย

### 7.4 ข้อยกเว้น
- ถ้า hero อยู่ใน `attack.active` → **ไม่เปลี่ยน alpha** (freeze ค่าปัจจุบัน) ไม่ให้ภาพวูบกลางคอมโบ
- มอนสเตอร์ **ไม่** trigger fade (เฉพาะผู้เล่นเท่านั้น) กัน alpha กระพริบรัว ๆ ตอนมอนวิ่งผ่าน
- Damage number / HP bar ของ hero ใช้ depth `+5` อยู่บน prop ตลอด ไม่ต้องพึ่ง fade

---

## 8. กล้อง (Camera)

### 8.1 ค่า

| ค่า | ตัวเลข | หน่วย |
|---|---|---|
| Viewport (design / กล้องโลก) | 1920 × 1080 | px (= 30 × 16.875 tile) — **ไม่ใช่พิกัดวาง HUD** |
| `zoom` | 1.0 | — |
| `deadzoneW` | **200** | px |
| `deadzoneH` | **130** | px |
| `smoothTimeConstant` | **110** | ms |
| `lookaheadFactor` | **0.12** | × ความเร็วผู้เล่น (px/s → px) |
| `lookaheadMax` | **90** | px |
| `pixelSnap` | true | ปัด camera scroll เป็น int ทุกเฟรม กัน sprite สั่น |

### 8.2 Deadzone
กรอบ 200 × 130 px กลางจอ ผู้เล่นขยับในนี้ **กล้องไม่ขยับ**
พอ hurtbox hero ชนขอบ deadzone กล้องเริ่มไล่ตามจนผู้เล่นกลับเข้ากรอบ

deadzone แนวนอนกว้างกว่าแนวตั้ง เพราะเกม top-down ขยับซ้าย-ขวาถี่กว่าขึ้น-ลง

### 8.3 Smoothing (frame-rate independent)
**ห้าม** ใช้ `lerp(cam, target, 0.1)` ตรง ๆ เพราะผลลัพธ์เปลี่ยนตาม frame rate
ใช้ exponential smoothing:

```
alpha = 1 - exp(-dtSeconds / 0.110)
cam.x += (targetX - cam.x) * alpha
cam.y += (targetY - cam.y) * alpha
```

ที่ 60 FPS → alpha ≈ 0.1399 · ที่ 144 FPS → alpha ≈ 0.0611 → ความรู้สึกเท่ากัน

### 8.4 Look-ahead
```
targetX = heroPivotX + clamp(velX * 0.12, -90, +90)
targetY = heroPivotY + clamp(velY * 0.12, -90, +90)
```
ที่ความเร็วเต็ม 180 px/s → นำหน้า 21.6 px (เบา ๆ พอให้เห็นข้างหน้ามากขึ้น ไม่เวียนหัว)

### 8.5 Clamp ขอบแผนที่
```
cam.scrollX = clamp(cam.x - 960, 0, mapWidthPx  - 1920)
cam.scrollY = clamp(cam.y - 540, 0, mapHeightPx - 1080)
```
แผนที่ทุกใบต้อง **กว้าง ≥ 1920 และสูง ≥ 1080** (ทั้งเมืองและทุ่งผ่านเงื่อนไขนี้สบาย)

### 8.6 Screen shake
shake เป็น offset **หลัง** clamp แล้ว (shake ทะลุขอบแมพได้ ยอมรับได้ที่ amplitude ≤ 6 px)
ค่า amplitude/duration ดู `02-combat.md` ข้อ VFX

### 8.7 จอจริง ≠ พิกัด HUD 1920

- ค่ากล้องข้อ 8.1–8.6 เป็น **world camera** — อย่าแก้สูตร deadzone / clamp / lookahead เพราะจอมือถือ
- Canvas ย่อ/ขยายแบบ **contain** ให้พอดีจอ (อาจมีแถบดำ) โลกเกมยังอ้าง 1920×1080
- HUD + ปุ่มสัมผัสวางบน **CSS viewport จริง** เป็นสัดส่วนจอ + safe area — ห้ามยึด `left: 48px` จาก mockup 1920 เป็นตำแหน่งเดียว
- รายละเอียดเลย์เอาต์มือถืออยู่ §11

---

## 9. ขนาดแผนที่

### 9.1 เมือง — "เมืองหมึกเงิน" (`town_silverink`)

| ค่า | ตัวเลข |
|---|---|
| ขนาด | **80 × 64 tile** |
| = px | **5120 × 4096** |
| = หน้าจอ | 2.67 × 3.79 viewport |
| เวลาเดินข้างฉาก (ซ้าย→ขวา) | 5120 / 180 = **28.4 วินาที** |

Zoning (tile coords, origin ซ้าย-บน):

| โซน | ช่วง tile | เนื้อหา |
|---|---|---|
| ลานกลางเมือง | x 30–50, y 24–40 | ศาล (จุด respawn), NPC ให้เควสต์, น้ำพุหมึก |
| ย่านร้านค้า | x 10–30, y 20–42 | ร้านของ, ช่างตีเหล็ก (Phase 3) |
| ย่านที่พัก | x 50–72, y 14–44 | บ้าน 8–10 หลัง เดินเข้าไม่ได้ในเฟสนี้ |
| ประตูเมืองทิศใต้ | x 38–42, y 60–63 | ทางออกไปทุ่ง (trigger เปลี่ยนแมพ) |
| ขอบเขตกันออกนอกแมพ | ขอบ 2 tile ทุกด้าน | tile blocked ทั้งหมด |

### 9.2 ทุ่ง — "ทุ่งหมอกหมึก" (`field_inkmist`)

| ค่า | ตัวเลข |
|---|---|
| ขนาด | **128 × 96 tile** |
| = px | **8192 × 6144** |
| = หน้าจอ | 4.27 × 5.69 viewport |
| พื้นที่เดินได้ (ประมาณ) | ~78% ของแมพ (ที่เหลือเป็นหินผา/พุ่ม) |

Spawn zone ของ Demon Boar — **6 โซน × 4 ตัว = 24 ตัวสูงสุดในแมพ**

| zone id | จุดกลาง (tile) | รัศมี (tile) | จำนวน | ระยะจากประตู |
|---|---|---|---|---|
| `boar_z1` | (62, 86) | 8 | 3 | ใกล้สุด — โซนฝึกมือ |
| `boar_z2` | (40, 74) | 9 | 4 | |
| `boar_z3` | (88, 72) | 9 | 4 | |
| `boar_z4` | (28, 50) | 10 | 4 | |
| `boar_z5` | (100, 46) | 10 | 4 | |
| `boar_z6` | (64, 28) | 11 | 5 | ไกลสุด — หนาแน่นสุด |

- ทางเข้าทุ่งจากเมืองอยู่ที่ tile (64, 93) → ผู้เล่นโผล่ด้านล่างแมพ เดินขึ้นเหนือ = ยากขึ้นเรื่อย ๆ
- `spawnMinDistanceFromPlayer` = **480 px** (7.5 tile) — ห้ามเกิดใกล้ผู้เล่นกว่านี้
  ถ้าทุกจุดในโซนไม่ผ่านเงื่อนไข → **เลื่อน respawn ออกไปอีก 60 ticks** แล้วลองใหม่
- `spawnMinDistanceFromProp` = **48 px** กัน spawn ซ้อนใน collider

### 9.3 Transition ระหว่างแมพ
- Trigger zone = AABB 256 × 128 px หน้าประตู
- เข้า trigger → fade to black 220 ms → โหลดแมพ → fade in 220 ms → ผู้เล่นโผล่ที่ `entryPoint` ของแมพปลายทาง
- **มอนสเตอร์ทั้งหมดใน field ถูก despawn** ตอนออกจากแมพ และ spawn ใหม่หมดตอนกลับเข้า (ไม่ persist)
  เหตุผล: ง่าย, ไม่มี save state ของมอน, Offline-first
  **ข้อแลก:** ผู้เล่นออก-เข้าแมพเพื่อ reset มอนได้ ยอมรับได้ในเฟสนี้ (เสียเวลา fade 440 ms + เดินกลับ)

---

## 10. ทัชคอนโทรล + HUD responsive (มือถือ landscape)

มติแพลตฟอร์ม: **เว็บเป็นหลัก** ต้องเล่นมือถือ/แท็บเล็ตในเบราว์เซอร์ได้ เน้น **landscape + ปุ่มสัมผัส** · เลย์เอาต์เป็นสัดส่วนจอ ไม่ผูก px เดสก์ท็อปอย่างเดียว
Phase 1–2 **ไม่มี dodge / stamina** — ห้ามเผื่อปุ่มโรลในคลัสเตอร์นี้

งานนี้เป็น **render / UI** ทั้งก้อน ไม่แตะสูตรเดิน ข้อ 2 และไม่ redesign combat

### 10.1 ปุ่มสัมผัสที่ต้องมี

| ปุ่ม | Phase 1 | ธง InputFrame | เทียบคีย์ |
|---|---|---|---|
| Virtual joystick | โชว์บนทัช | `up/down/left/right` ตามข้อ 1.4 | WASD / ลูกศร |
| Interact | โชว์บนทัช | `interact` | `E` |
| Attack | **จองที่** ไม่โชว์ / ปิดใช้ | `attack` (ส่ง `false`) | `J` / `Space` |
| Potion | **จองที่** ไม่โชว์ / ปิดใช้ | `potion` (ส่ง `false`) | `Q` |

เดสก์ท็อป (เมาส์/คีย์บอร์ด ไม่มีทัช): **ซ่อน** joystick + ปุ่มสัมผัสทั้งหมด คีย์บอร์ดทำงานตามข้อ 1.1
แท็บเล็ตมีคีย์บอร์ดต่ออยู่: โชว์ปุ่มทัชถ้ามี pointer แบบสัมผัส — คีย์บอร์ดยัง OR รวมตามข้อ 1.1

### 10.2 เลย์เอาต์ landscape (ซ้ายเดิน ขวาปุ่ม)

ทุกขนาดเป็น **% ของ CSS viewport** หลังหัก safe area แล้ว ห้ามระบุตำแหน่งเดียวเป็น px ของจอ 1920

```
safeLeft   = max(env(safe-area-inset-left),   2vw)
safeRight  = max(env(safe-area-inset-right),  2vw)
safeTop    = max(env(safe-area-inset-top),    2vh)
safeBottom = max(env(safe-area-inset-bottom), 3vh)
```

```
+---------------------------------------------------------+
|  HUD แถบบน (HP/MP/เลเวล/เงิน)  สูงไม่เกิน 12vh + safeTop |
|                                                         |
|                                                         |
|  (joystick)              โซนเล่น              [ATK]     |
|   ซ้ายล่าง                                  [POT] [INT] |
|   ฐาน 30vh                                 คลัสเตอร์ขวา |
+---------------------------------------------------------+
```

| ชิ้น | ขนาดภาพ | ขนาด hit | ตำแหน่ง (จุดยึด) |
|---|---|---|---|
| Joystick ฐาน | เส้นผ่านศูนย์กลาง **30% vh** | วง 36% vh | มุมซ้ายล่าง: `left = safeLeft + 3vw`, `bottom = safeBottom + 6vh` |
| Joystick ลูกบิด | **42%** ของเส้นผ่านศูนย์กลางฐาน | — | กลางฐาน เลื่อนตามนิ้ว คลamped ในวง |
| โซนจับ joystick | — | สี่เหลี่ยม **ซ้าย 42% ของจอ × ล่าง 62% ของจอ** ตัดแถบ HUD บนออก | นิ้วเริ่มในโซนนี้ = ถือแท่ง (ไม่ต้องโดนวงเป๊ะ) |
| Interact | **18% vh** | **22% vh** | คลัสเตอร์ขวา ช่องล่าง |
| Attack (จอง P2) | **20% vh** | **24% vh** | คลัสเตอร์ขวา ช่องบนขวา — Phase 1 ว่าง/ซ่อน ห้ามย้ายช่องอื่นมาทับ |
| Potion (จอง P2) | **14% vh** | **18% vh** | คลัสเตอร์ขวา ช่องซ้ายของ interact — Phase 1 ว่าง/ซ่อน |

คลัสเตอร์ขวา (จุดยึดมุมขวาล่าง หลัง safe inset):

```
ช่องว่างระหว่างปุ่ม = 2.5vw
จุดยึดขวา  = safeRight + 3vw
จุดยึดล่าง = safeBottom + 6vh

[ATK] อยู่บน interact เยื้องขวา
[POT] อยู่ซ้าย interact เยื้องขึ้นเล็กน้อย
[INT] ชิดมุมขวาล่างของคลัสเตอร์
```

**Portrait:** Phase 1 **ไม่ทำเลย์เอาต์เล่นแนวตั้ง** — โชว์ overlay "หมุนเครื่องเป็นแนวนอน" แล้วหยุดรับอินพุตเดิน
**แท็บเล็ต landscape:** สูตร % เดียวกัน ห้ามแยกตำแหน่ง px คนละชุด

### 10.3 HUD อ่านได้บน mobile landscape

- HUD อยู่ Scene แยกตามข้อ 6.2 — วางด้วย **% / vmin** ไม่ใช่พิกัดโลก 1920
- ตัวเลข HP / MP / เลเวล / เงิน: ตัวอักษรต่ำสุด **12 CSS px** แนะนำ **2.2% vh** (ไม่บางจนอ่านไม่ได้บนจอ ~360 CSS px ด้านสั้น)
- แถบ HP/MP กว้างอย่างน้อย **28% vw** สูงอย่างน้อย **2.2% vh**
- แถบบนทั้งก้อนสูงไม่เกิน **12% vh** + `safeTop` และ **ห้ามทับ** โซน joystick / คลัสเตอร์ปุ่ม
- loot toast / ข้อความคุย: กลางจอหรือบนแถบ เว้นล่าง **38% vh** ไว้ให้มือ
- Mockup 1920 = เดสก์ท็อปอ้างอิง มือถือต้องจัดใหม่ตามสัดส่วนด้านบน ห้าม scale UI ทั้งก้อนจาก 1920 แล้วอ่านไม่ออก

ให้พอร์น: อาร์ตแท่ง + ปุ่ม interact (และโครงปุ่มว่าง attack/potion ที่ซ่อนได้) · overlay หมุนจอ
ให้มิว: แตะปุ่ม interact มี tap สั้น 1 เสียง · ห้ามทำ SFX dodge / โรล

---

## 11. Acceptance Criteria — Phase 1

นัทเช็คตามนี้ได้เลย ทุกข้อต้องผ่าน:

| # | เกณฑ์ | วิธีวัด |
|---|---|---|
| 1 | เดินตรง 1 วินาทีได้ 180 px (±2 px) | log pos ก่อน/หลัง 60 ticks |
| 2 | เดินทแยง 1 วินาทีได้ 180 px (±2 px) | เท่ากับข้อ 1 เป๊ะ |
| 3 | กด A+D พร้อมกัน → ตัวละครหยุด ไม่ขยับ | |
| 4 | ปล่อยปุ่มหมด → facing ค้างทิศเดิม ไม่ snap ลง | |
| 5 | เดินทแยงชนกำแพงแนวตั้ง → ยังไถลขึ้น/ลงได้ | |
| 6 | เดินใต้พุ่ม `tree_large` ได้ ไม่ชน | |
| 7 | เดินหลัง `house_small` → บ้านจางเหลือ alpha 0.5 ภายใน 120 ms | |
| 8 | เดินหน้าบ้าน (pivotY > บ้าน) → บ้านไม่จาง และตัวละครอยู่ทับบ้าน | |
| 9 | กล้องไม่ขยับเมื่อผู้เล่นอยู่ในกรอบ 200×130 กลางจอ | |
| 10 | กล้องไม่โผล่ออกนอกขอบแมพ (scrollX/Y ไม่ติดลบ ไม่เกิน max) | |
| 11 | Sim ไม่ import อะไรจาก `phaser` เลย | test `sim-no-phaser.test.ts` ที่นัทมีแล้ว |
| 12 | Walk animation 10 FPS คงที่ ไม่ผูก frame rate จริง | รัน 30 FPS กับ 144 FPS ได้รอบ walk เท่ากัน |
| 13 | Joystick ดันสุดขวา 60 ticks เดินได้ 180 px (±2) | เท่ากับกด `D` ข้อ 1 |
| 14 | Joystick ดันทแยง 60 ticks เดินได้ 180 px (±2) | เท่ากับข้อ 2 — ต้องผ่านข้อ 1.3 ไม่ใช่ analog speed |
| 15 | อยู่ใน dead zone (mag < 0.28) → ไม่เดิน และ facing ไม่เปลี่ยน | เทียบข้อ 4 |
| 16 | `InputFrame` จากทัชมีแค่ boolean 7 ฟิลด์ | ไม่มี `stickX/Y`, pointerId, magnitude ใน Sim |
| 17 | จอมือถือ landscape: joystick ซ้าย + interact ขวา ไม่ทับตัวเลข HUD | วัดบน viewport จริง ไม่ใช่พิกัด 1920 |
| 18 | เดสก์ท็อปไม่มีทัช → ซ่อนปุ่มเสมือน คีย์บอร์ดยังเดิน/คุยได้ | |
| 19 | สองนิ้วพร้อมกัน: ถือแท่ง + แตะ interact แล้วทั้งสองธงติด | |
| 20 | เปิดจอแนวตั้ง → overlay หมุนเครื่อง และไม่รับอินพุตเดิน | Phase 1 ไม่บังคับเลย์เอาต์ portrait |

---

## ภาคผนวก — ไฟล์ข้อมูลที่เกี่ยวข้อง

- `data/movement.json` — speed, accel, animation FPS, camera, direction LUT (สูตร Sim ไม่เปลี่ยนเพราะทัช)
- `data/world-props.json` — collider + occlusionRect ของ prop ทุกชนิด
- `data/maps.json` — ขนาดแมพ, zoning, spawn zone, transition
- Schema อธิบายทุกฟิลด์ที่ `03-data-schema.md`
- ทัช / HUD responsive = งาน render ตาม §1.4 และ §10 **ไม่ต้องเพิ่มฟิลด์เข้า Sim**
