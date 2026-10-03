# Phase 2 — Combat, Progression & Demon Boar

เวอร์ชัน 1.0 · ภูมิ (Game Design)
หน่วย: ระยะ = px (world) · เวลา = **ticks @60Hz** (ms = ticks × 16.667) · % = เปอร์เซ็นต์ · ค่าดิบ = ไม่มีหน่วย

> **ตัวละครอ้างอิงที่ใช้เช็คทุกสูตรในเอกสารนี้** (ตรงกับ mockup UI)
> Lv.32 · STR 42 · DEX 38 · INT 26 · VIT 36 · LUK 18 · HP 1800/1800 · MP 620/620

---

## 1. Sword Exorcist — Basic Attack "ปัดหมึก"

### 1.1 ภาพรวม
- อาชีพเดียวที่เล่นได้ใน Phase 2 (Dual Blades / Bow / Magic ล็อก)
- Basic attack เป็น **คอมโบ 3 step** กดปุ่มโจมตีรัว ๆ ไม่มี MP cost
- ปุ่ม: `J` (หลัก) หรือ `Space` — render map ให้ทั้งสองปุ่มเป็น `InputFrame.attack`
- Hitbox เป็น **sector (arc)** จุดกำเนิดที่ pivot เท้าของ hero เลื่อนไปข้างหน้าเล็กน้อย

### 1.2 ตาราง Frame data

| Step | ชื่อท่า | startup | active | recovery | รวม | dmg mult | arc (องศาเต็ม) | radius | targets สูงสุด | knockback |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ปัดเฉียง | **7t** (117 ms) | **5t** (83 ms) | **10t** (167 ms) | 22t (367 ms) | **1.00** | **100°** | **95 px** | 3 | 12 px |
| 2 | สวนกลับ | **6t** (100 ms) | **5t** (83 ms) | **11t** (183 ms) | 22t (367 ms) | **1.15** | **110°** | **100 px** | 3 | 14 px |
| 3 | ผ่าหมึกดับ | **9t** (150 ms) | **6t** (100 ms) | **18t** (300 ms) | 33t (550 ms) | **1.45** | **150°** | **118 px** | 5 | **48 px** |

- `originForward` (เลื่อนจุดกำเนิด arc ไปข้างหน้าตาม facing): step1 = 8 px, step2 = 10 px, step3 = 12 px
- **ดาเมจรวมคอมโบเต็ม = 3.60 × ATK** (ก่อน DEF/variance)
- รอบคอมโบเต็ม 77 ticks (1283 ms) + lockout = **1483 ms** → DPS theoretical ≈ 2.43 × ATK/s

### 1.3 Attack speed (ASPD)
```
aspdBonus = min(0.40, DEX * 0.004)              // DEX 1 แต้ม = +0.4% cap +40%
scaledStartup  = max(2, round(baseStartup  / (1 + aspdBonus)))
scaledRecovery = max(3, round(baseRecovery / (1 + aspdBonus)))
scaledActive   = baseActive                      // ** active ไม่ย่อ ** เพื่อให้ hitbox timing คงที่
```
ตัวละครอ้างอิง DEX 38 → `aspdBonus = 0.152`
step1: startup 7→6t, recovery 10→9t · step2: 6→5t, 11→10t · step3: 9→8t, 18→16t
รอบคอมโบเต็ม = 71 ticks (1183 ms) **เร็วขึ้น 8%**

### 1.4 Combo chaining
| ค่า | ตัวเลข |
|---|---|
| `comboWindowTicks` | **27t (450 ms)** นับจากเฟรมสุดท้ายของ `active` |
| `inputBufferTicks` | **12t (200 ms)** — กดปุ่มค้างไว้ล่วงหน้าได้ |
| `postChainLockoutTicks` | **12t (200 ms)** หลัง step3 recovery จบ |
| `comboResetOn` | หมด window / ถูก stagger / ตาย / เปลี่ยนแมพ |

- กดโจมตีช่วง `startup`/`active`/`recovery` → **บัฟเฟอร์** step ถัดไป ยิงทันทีที่ recovery จบ
- ถ้าไม่กดต่อภายใน `comboWindowTicks` → รีเซ็ตกลับ step 1
- ไม่มี step 4 — กดต่อหลัง step3 ต้องรอ lockout แล้วเริ่ม step1 ใหม่

### 1.5 Cancel rules
| ช่วง | ยกเลิกได้ไหม |
|---|---|
| `startup` | ❌ ไม่ได้เลย (commit แล้ว) |
| `active` | ❌ ไม่ได้ |
| `recovery` (ครึ่งแรก) | ❌ |
| `recovery` (ครึ่งหลัง ตั้งแต่ `ceil(recovery/2)`) | ✅ ยกเลิกด้วยการ **เดิน** ได้ |
| ทุกช่วง | ✅ ถูก **ยกเลิกโดย** `hurt` (stagger) และ `dead` เสมอ |
| ทุกช่วง | ✅ **กินโพชั่นได้** (potion ไม่มี animation ขัดจังหวะ) |

### 1.6 การตรวจ hit (Sector vs Circle)
```
toTarget   = target.hurtboxCenter - (hero.pivot + facingVec * originForward)
dist       = |toTarget|
targetR    = target.hurtbox.w / 2                 // approx เป็นวงกลม
if dist > radius + targetR:            → ไม่โดน
if dist <= targetR:                    → โดน (ติดตัวเลย ไม่ต้องเช็คองศา)
angleDiff  = acos( dot(normalize(toTarget), facingVec) )   // 0..180°
if angleDiff <= arcDegrees / 2:        → โดน
else:                                  → ไม่โดน
```
- **Hit-list dedupe:** แต่ละ `active` window เก็บ set ของ `entityId` ที่โดนแล้ว ตีซ้ำตัวเดิมไม่ได้
- ตรวจ hit **ทุก tick** ในช่วง active (5–6 ticks) ไม่ใช่เฟรมเดียว กันมอนวิ่งแทรกเข้ามากลางท่า
- ถ้า targets เกิน `maxTargets` → เรียงตาม **ระยะใกล้→ไกล** แล้วตัดเอาเท่าที่กำหนด (deterministic)

---

## 2. HP / MP

### 2.1 สูตร (ล็อกตาม mockup เป๊ะ)

```
maxHP = 150 + (level - 1) * 30 + VIT * 20
maxMP =  50 + (level - 1) * 10 + INT * 10
```

**ตรวจกับ mockup:**
- `maxHP` Lv32 VIT36 = 150 + 31×30 + 36×20 = 150 + 930 + 720 = **1800** ✅
- `maxMP` Lv32 INT26 = 50 + 31×10 + 26×10 = 50 + 310 + 260 = **620** ✅

| Level | VIT | maxHP | INT | maxMP |
|---|---|---|---|---|
| 1 | 7 | 290 | 4 | 90 |
| 6 | 13 | 560 | 5 | 150 |
| 10 | 18 | 780 | 8 | 220 |
| 20 | 26 | 1240 | 16 | 400 |
| 32 | 36 | **1800** | 26 | **620** |
| 50 | 50 | 2620 | 38 | 920 |

### 2.2 Regen
```
hpRegenPerSec = 0.5 + VIT * 0.04
mpRegenPerSec = 0.8 + INT * 0.05
outOfCombat   = ไม่ได้รับและไม่สร้างดาเมจมา >= 300 ticks (5 วินาที)
→ ถ้า outOfCombat:  hpRegen × 6.0  ·  mpRegen × 4.0
```
- เก็บเป็น **accumulator ทศนิยม** บวกทีละ `regenPerSec / 60` ต่อ tick
  แล้วย้ายเฉพาะส่วนจำนวนเต็มเข้า HP/MP (ไม่ปัดทิ้งทุก tick ไม่งั้น regen ต่ำ ๆ จะหายหมด)
- Regen **หยุดทำงานตอน `dead`**

ตัวละครอ้างอิง: HP regen 1.94/s (ในคอมแบท) / 11.64/s (นอกคอมแบท) · MP 2.10/s / 8.40/s

---

## 3. สเตตัส 5 ตัว

### 3.1 ค่าเริ่มต้น Lv.1 — Sword Exorcist
| STR | DEX | INT | VIT | LUK | รวม |
|---|---|---|---|---|---|
| **8** | **6** | **4** | **7** | **5** | **30** |

### 3.2 แต้มที่ได้
| ค่า | ตัวเลข |
|---|---|
| `statPointsPerLevel` | **4** |
| `statPointBonusEveryNLevels` | **5** (ได้ +1 ที่ Lv 5, 10, 15, 20, …) |
| `skillPointsPerLevel` | **1** |
| `skillPointBonusEveryNLevels` | **10** (ได้ +1 ที่ Lv 10, 20, 30, …) |
| `statCapPerStat` | **99** |
| `statPointCost` | **1 แต้ม = 1 สเตตัส** (ไม่มีราคาแพงขึ้น — เฟสนี้เอาเรียบง่าย) |
| Respec | **ไม่มีใน Phase 2** (อยู่ใน backlog) |

**ตรวจกับ mockup:** Lv.32 → stat point ได้รวม `31×4 + 6 = 130` · เริ่มต้น 30 → **รวมสูงสุด 160**
mockup: 42+38+26+36+18 = **160** ✅ พอดีเป๊ะ (ผู้เล่นใช้แต้มหมดไม่เหลือ)
Skill point Lv.32 = `31 + 3 = 34`

### 3.3 ผลของแต่ละสเตตัส (ต่อ 1 แต้ม)

| สเตตัส | ผล |
|---|---|
| **STR** | ATK **+2.0** |
| **DEX** | ATK **+0.5** · ASPD **+0.4%** (cap +40%) · Crit rate **+0.10%** · HIT **+1** |
| **INT** | maxMP **+10** · MP regen **+0.05/s** · MATK **+1.5** *(สำรองไว้ ยังไม่ใช้ใน Phase 2)* |
| **VIT** | maxHP **+20** · DEF **+0.5** · HP regen **+0.04/s** |
| **LUK** | Crit rate **+0.30%** · Crit damage **+0.5%** (คือ +0.005 ตัวคูณ) · Drop rate **+0.20% (relative)** cap +30% |

### 3.4 ค่าที่ derive จากเลเวล
```
levelATK  = 10 + level            // ATK ติดตัวจากเลเวล
levelDEF  = floor(level * 0.3)
HIT_base  = 50 + level
FLEE_base = 30 + level
```

---

## 4. สูตรดาเมจเต็มรูปแบบ

### 4.1 ATK ของผู้เล่น
```
weaponATK = weapon.atk + weapon.refineStep * refineLevel      // ตีบวก
ATK = floor( 10 + level + STR * 2.0 + DEX * 0.5 + weaponATK )
```
- `refineLevel` 0–10 ใน Phase 2 ยังตีบวกไม่ได้ (ไม่มี Blacksmith) แต่ **ฟิลด์ต้องมีและคำนวณถูก** เผื่อ item ที่ดรอปมาพร้อม refine
- ตัวละครอ้างอิง + ดาบหยกหมึก (`atk 45`, `refineStep 3`, `+5`) → `ATK = 10+32+84+19+60 = ` **205**

### 4.2 DEF ของผู้เล่น
```
DEF = armorDEF_total + floor(VIT * 0.5) + floor(level * 0.3)
```
`armorDEF_total` = ผลรวม `defenseBonus` ของทุกชิ้นที่สวม (head/body/accessory)
ตัวละครอ้างอิง (armor รวม 30) → `30 + 18 + 9 = ` **57**

### 4.3 ลำดับการคำนวณดาเมจ (ห้ามสลับลำดับ)

```
STEP 0 — Hit check
    HIT_atk  = HIT_base  + DEX * 1.0        (ผู้เล่น)  |  monster.hit    (มอน)
    FLEE_def = FLEE_base + DEX * 0.8        (ผู้เล่น)  |  monster.flee   (มอน)
    hitChance = clamp(0.50, 1.00, 0.80 + (HIT_atk - FLEE_def) * 0.004)
    [RNG #1] ถ้า roll > hitChance  → MISS (แสดง "หลบ") จบ ไม่มีดาเมจ

STEP 1 — Raw damage
    raw = ATK * skillMultiplier * comboMultiplier
    (basic attack: skillMultiplier = 1.0, comboMultiplier = ตารางข้อ 1.2)

STEP 2 — Critical roll
    critRate = min(critRateCap, 5.0 + LUK * 0.30 + DEX * 0.10)       // หน่วย %
    critRateCap = 60.0
    [RNG #2] isCrit = (roll * 100 < critRate)
    critMult = min(2.50, 1.50 + LUK * 0.005)

STEP 3 — Defense mitigation  (crit เจาะ DEF ได้ 20%)
    defUsed   = isCrit ? DEF_target * 0.80 : DEF_target
    K         = 100 + 5 * attackerLevel
    reduction = defUsed / (defUsed + K)              // 0..1 เสมอ ไม่เคยถึง 1
    afterDef  = raw * (1 - reduction)

STEP 4 — Apply crit multiplier
    afterCrit = isCrit ? afterDef * critMult : afterDef

STEP 5 — Variance
    [RNG #3] v = uniform(-0.10, +0.10)               // ±10%
    afterVar = afterCrit * (1 + v)

STEP 6 — Clamp
    minDamage = max(1, floor(ATK * 0.05))            // 5% ของ ATK ผู้ตี
    damage    = max(minDamage, floor(afterVar))
```

**เหตุผลที่ mitigation เป็นสูตรหาร (ไม่ใช่ลบตรง ๆ):**
ไม่มีวันลดดาเมจเป็น 0 หรือติดลบ · ไม่มี breakpoint ที่มอน DEF สูงกลายเป็นอมตะ · ปรับบาลานซ์ด้วยค่า `K` ตัวเดียว
ค่า `K` โตตามเลเวลผู้ตี = **ผู้เล่นที่เลเวลสูงกว่าจะทะลวง DEF มอนต่ำได้มากขึ้น** (คนเลเวลเกินฟาร์มมอนเก่าได้ไว)

**ตาราง reduction ที่ควรรู้:**
| DEF เป้าหมาย | ผู้ตี Lv.6 (K=130) | ผู้ตี Lv.32 (K=260) | ผู้ตี Lv.50 (K=350) |
|---|---|---|---|
| 18 (Demon Boar) | 12.2% | 6.5% | 4.9% |
| 57 (ผู้เล่นอ้างอิง) | 30.5% | 18.0% | 14.0% |
| 120 | 48.0% | 31.6% | 25.5% |
| 300 | 69.8% | 53.6% | 46.2% |

### 4.4 ตัวเลขจริง — ตรวจสอบบาลานซ์

**ผู้เล่น Lv.6 (STR 18, DEX 10, ดาบไม้พรต atk 10 → ATK 67) ตี Demon Boar (DEF 18, HP 320):**
| | step1 | step2 | step3 | คอมโบเต็ม |
|---|---|---|---|---|
| raw | 67 | 77 | 97 | 241 |
| หลัง DEF (−12.2%) | 59 | 68 | 85 | 212 |
| ช่วง variance | 53–65 | 61–74 | 77–94 | 191–233 |
→ **ฆ่าได้ใน 5–6 ครั้ง (1.5 คอมโบ ≈ 2.2 วินาที)** ไม่ยืดเยื้อ

**Demon Boar (ATK 38) ตีผู้เล่น Lv.6 (DEF 13, HP 560):**
`38 × (1 − 13/143) = 34.5` → ±10% = **31–38 ต่อครั้ง** → ตาย 16 ครั้ง
ท่าพุ่งชน (×1.8) = **56–68** → ตาย 9 ครั้ง · ที่ interval 1600 ms = มีเวลาถอยเยอะ **ไม่หนักเกินมือใหม่**

**ผู้เล่นอ้างอิง Lv.32 (ATK 205) ตี Demon Boar:** step1 = 192 → ฆ่าใน **2 ครั้ง** (ตามคาด มอนเฟสแรก)

### 4.5 Crit — ตารางตรวจ
| LUK | DEX | crit rate | crit mult |
|---|---|---|---|
| 5 | 6 | 7.1% | 1.525 |
| 5 | 10 | 7.5% | 1.525 |
| 18 | 38 | **14.2%** | **1.590** |
| 40 | 60 | 23.0% | 1.700 |
| 99 | 99 | **44.6%** | 1.995 |
| — | — | cap **60%** | cap **2.50** |

> LUK 99 + DEX 99 ยังไม่ถึง cap → cap เป็นเพดานเผื่ออุปกรณ์/สกิลใน Phase 3+ ไม่ใช่สิ่งที่แตะได้ด้วยสเตตัสเพียว

### 4.6 Monster → Player
ใช้สูตรเดียวกันทุกขั้น โดย:
- `ATK` = `monster.atk` (ไม่คำนวณจากสเตตัส)
- `attackerLevel` ใน `K` = `monster.level`
- `critRate` = `monster.critRate` · `critMult` = `monster.critMult`
- `minDamage` = `max(1, floor(monster.atk * 0.05))`

---

## 5. EXP & Leveling

### 5.1 สูตร
```
base(L)    = 25 * L * (L + 3)                  // = 25L² + 75L
tierNum(L) = 100  ถ้า L ใน  1–10   (×1.00)
             115  ถ้า L ใน 11–20   (×1.15)
             130  ถ้า L ใน 21–30   (×1.30)
             150  ถ้า L ใน 31–40   (×1.50)
             175  ถ้า L ใน 41–50   (×1.75)

expToNext(L)  = floor( base(L) * tierNum(L) / 100 )     // ** integer arithmetic **
expToNext(50) = 0                                        // level cap ของ Phase 2
```

> ⚠️ **ห้ามเขียน `floor(base * 1.15)` ด้วย float**
> `5200 * 1.15` ใน IEEE-754 ได้ `5979.999...` → floor เป็น **5979** ไม่ใช่ 5980 (ผิดไป 1 ที่ Lv.13 และ Lv.20)
> ตัวเลขใน `exp-curve.json` คือ **แหล่งความจริง** — ถ้าจะคำนวณเองต้องใช้ `base * tierNum / 100` แบบจำนวนเต็มเท่านั้น
`expToNext(L)` = exp ที่ต้องเก็บเพิ่ม **ขณะอยู่** เลเวล L เพื่อไปเลเวล L+1

**ทำไมเป็น tier step ไม่ใช่เลขยกกำลังเรียบ ๆ:**
ได้ "กำแพง" ชัดเจนที่ Lv 11/21/31/41 ซึ่งเป็นจุดที่เราจะวางพื้นที่ใหม่/มอนใหม่ใน Phase 3
และปรับความชันแต่ละช่วงได้โดยไม่ต้องแก้ exponent ทั้งเส้น

### 5.2 ตาราง (ย่อ — ฉบับเต็ม 1–50 อยู่ใน `data/exp-curve.json`)

| Lv | expToNext | cumulative (ถึงเลเวลนี้) |
|---|---|---|
| 1 | 100 | 0 |
| 2 | 250 | 100 |
| 5 | 1,000 | 1,500 |
| 6 | 1,350 | 2,500 |
| 10 | 3,250 | 10,500 |
| 11 | 4,427 | 13,750 |
| 20 | 13,225 | 85,335 |
| 21 | 16,380 | 98,560 |
| 30 | 32,175 | 305,260 |
| 31 | 39,525 | 337,435 |
| **32** | **42,000** | **376,960** |
| 40 | 64,500 | 788,560 |
| 41 | 78,925 | 853,060 |
| 50 | 0 (cap) | **1,706,183** |

### 5.3 EXP จากมอนสเตอร์ — ปรับตามส่วนต่างเลเวล

```
diff = monster.level - player.level
expGained = max(1, floor(monster.expReward * diffMult(diff)))
```

| `diff` | multiplier | ความหมาย |
|---|---|---|
| ≥ +5 | **1.25** | มอนสูงกว่าเรามาก = โบนัส |
| +3 … +4 | **1.15** | |
| −2 … +2 | **1.00** | ช่วงเหมาะสม |
| −3 … −5 | **0.75** | |
| −6 … −9 | **0.40** | |
| −10 … −14 | **0.15** | |
| ≤ −15 | **0.05** | ไม่เคยเป็น 0 — ยังได้ `max(1, …)` |

**ตรวจ:** Demon Boar (Lv6, exp 42)
- ผู้เล่น Lv6 → ได้ 42/ตัว · ต้องใช้ 1,350 → **33 ตัวต่อเลเวล** (~8 วินาที/ตัว รวมเดิน ≈ 4.4 นาที/เลเวล) ✅
- ผู้เล่น Lv1 → diff +5 → 52/ตัว · ต้องใช้ 100 → **2 ตัว** ✅ เริ่มเกมเลเวลขึ้นไว
- ผู้เล่น Lv32 → diff −26 → `floor(42 × 0.05) = 2`/ตัว · ต้องใช้ 42,000 → 21,000 ตัว → **ฟาร์มไม่คุ้มโดยสมบูรณ์** ✅ บังคับให้ไปพื้นที่ใหม่ (แต่ Phase 2 ยังไม่มี → ดู backlog)

### 5.4 Level-up
เมื่อ `exp >= expToNext(level)`:
```
loop:
    if level >= LEVEL_CAP(50):  exp = min(exp, expToNext(49));  break   // ตัน
    need = expToNext(level)
    if exp < need: break
    exp     -= need                                // ** หัก ไม่ใช่รีเซ็ตเป็น 0 **
    level   += 1
    statPoints  += 4 + (level % 5  == 0 ? 1 : 0)
    skillPoints += 1 + (level % 10 == 0 ? 1 : 0)
    recalcDerivedStats()                           // maxHP/maxMP เพิ่ม
    hp = maxHP;  mp = maxMP                        // ** เลเวลอัพฟื้นเต็ม **
    emit LEVEL_UP event (level)                    // render เล่น VFX/SFX
```
- **ขึ้นหลายเลเวลพร้อมกันได้** วนลูปจนกว่า exp ไม่พอ — ต้องยิง event ทุกเลเวลที่ผ่าน (HUD แสดงเลขวิ่ง)
- `recalcDerivedStats()` ต้องถูกเรียก **หลัง** เพิ่ม level และ **หลัง** ใช้ stat point ทุกครั้ง
- HP/MP เพิ่มตอนเลเวลอัพ → เติมเต็มทั้งสองค่า (ให้รางวัลชัดเจน + กันบั๊ก hp > maxHP)

---

## 6. Healing / Potion

### 6.1 โพชั่น
| item | ฟื้น | cooldown | ราคาซื้อ | ขายคืน |
|---|---|---|---|---|
| `pot_hp_small` โพชั่นหมึกชุบชีวิต (เล็ก) | `120 + 10% ของ maxHP` | **90t (1500 ms)** | 55 | 13 |
| `pot_mp_small` โพชั่นหมึกคืนพลัง (เล็ก) | `40 + 10% ของ maxMP` | **90t (1500 ms)** | 45 | 11 |

- cooldown **แยกกันต่อชนิด** (กิน HP แล้วกิน MP ต่อได้ทันที)
- `globalItemCooldownTicks` = **18t (300 ms)** ใช้กันกดรวดเดียวหลายใบในเฟรมเดียว
- ฟื้นแบบ **instant** ไม่มี channel ไม่มี animation ขัดจังหวะ — กินได้แม้กลางคอมโบ
- **Overheal clamp:** `hp = min(maxHP, hp + healAmount)` ส่วนเกินหายไป ไม่สะสม
- กินตอน HP เต็มแล้ว → **ไม่ consume ไอเท็ม ไม่กิน cooldown** แสดง toast "HP เต็มแล้ว"
- กินตอน `dead` → ❌ ทำไม่ได้

**ค่าฟื้นจริง:**
| Level | maxHP | ฟื้น HP | % | maxMP | ฟื้น MP |
|---|---|---|---|---|---|
| 6 | 560 | 176 | 31.4% | 150 | 55 |
| 32 | 1800 | 300 | 16.7% | 620 | 102 |
| 50 | 2620 | 382 | 14.6% | 920 | 132 |

ส่วน flat ทำให้มีประโยชน์มากช่วงต้น ส่วน % ทำให้ยังไม่ไร้ค่าช่วงปลาย
(โพชั่น "กลาง/ใหญ่" ไว้ Phase 3 ดู backlog)

### 6.2 Auto Potion
| ค่า | ตัวเลข |
|---|---|
| `autoPotionEnabled` | toggle ใน UI, เก็บลง save, default **ON** |
| `triggerThreshold` | **HP ≤ 35% ของ maxHP** |
| `internalCooldownTicks` | **180t (3000 ms)** — บนสุดของ cooldown โพชั่นปกติ |
| `itemUsed` | `pot_hp_small` (Phase 3 ให้เลือกช่องได้) |

**จุดตรวจในลูป (ลำดับสำคัญมาก):**
```
1. applyDamage()                 → hp -= damage
2. if hp <= 0:  hp = 0; enterDeath();  → ** จบที่นี่ ไม่ auto potion **
3. if autoPotionEnabled
   and hp / maxHP <= 0.35
   and autoPotionCd == 0
   and potionCd == 0
   and inventory.count(pot_hp_small) > 0:
        usePotion(pot_hp_small)
        autoPotionCd = 180
4. if ไม่มีโพชั่นเหลือ → ยิง event WARN_NO_POTION (แสดงครั้งเดียวต่อ 10 วินาที)
```
> **Auto potion ไม่ช่วยตอนโดนดาเมจทีเดียวตาย** — เป็นดีไซน์ที่ตั้งใจ (ไม่ใช่บั๊ก)
> ไม่ทำ "ตายแล้วฟื้นด้วยโพชั่น" เพราะจะทำให้ตัดสินใจ netcode ยากตอน Multiplayer

---

## 7. Demon Boar (หมูปีศาจ) — `mon_demon_boar`

### 7.1 สเตตัส
| ค่า | ตัวเลข | หน่วย |
|---|---|---|
| Level | **6** | |
| maxHP | **320** | ค่าดิบ |
| ATK | **38** | ค่าดิบ |
| DEF | **18** | ค่าดิบ |
| MDEF | 6 | ค่าดิบ (สำรอง) |
| HIT | **45** | ค่าดิบ |
| FLEE | **40** | ค่าดิบ |
| Crit rate | **3.0** | % |
| Crit mult | **1.40** | ตัวคูณ |
| EXP reward | **42** | |
| Collider | 56 × 36, offsetY −16 | px |
| Hurtbox | 60 × 52, offsetY −30 | px |
| Sprite | 96 × 96, pivot (48, 88) | px |

### 7.2 ความเร็วและระยะ
| ค่า | ตัวเลข | หน่วย | หมายเหตุ |
|---|---|---|---|
| `speedPatrol` | **55** | px/s | 0.31 × ความเร็วผู้เล่น |
| `speedChase` | **145** | px/s | **ช้ากว่าผู้เล่น (180)** → วิ่งหนีได้ตลอด = สำคัญ |
| `speedCharge` | **300** | px/s | เร็วกว่าผู้เล่น แต่เป็นเส้นตรง หลบข้างได้ |
| `aggroRange` | **280** | px | 4.4 tile |
| `aggroLoseRange` | **560** | px | 8.75 tile — หลุดทันทีเมื่อเกิน |
| `aggroLoseTicks` | **300** (5 s) | ticks | หรือไล่ไม่เจอเกิน 5 วินาทีก็เลิก |
| `attackRange` | **72** | px | ระยะเข้าท่าพุ่งขวิด |
| `attackRangeExit` | **92** | px | hysteresis กัน state กระพริบ |
| `chargeRangeMin / Max` | **180 / 420** | px | ระยะที่เลือกท่าพุ่งชน |
| `chargeAlignTolerance` | **25** | องศา | ต้องเกือบตรงแนวก่อนพุ่ง |

### 7.3 ท่าโจมตี

**ท่า A — พุ่งขวิด (`gore`) ท่าหลัก**
| | ticks | ms |
|---|---|---|
| startup (ก้มหัว) | **27t** | 450 |
| active | **7t** | 117 |
| recovery | **42t** | 700 |
| รวม | 76t | 1267 |
- dmg mult **1.00** (= 38) · hitbox sector **90°, radius 78 px**, originForward 10 px
- `attackIntervalTicks` = **96t (1600 ms)** นับจากจบ recovery → รอบโจมตีจริง ≈ 1.6 s
- knockback ผู้เล่น **60 px ใน 9t (150 ms)**

**ท่า B — พุ่งชน (`charge`)**
| | ticks | ms |
|---|---|---|
| telegraph (ขูดเท้า + ฝุ่น) | **36t** | 600 |
| dash | สูงสุด **30t** | 500 |
| recovery | **48t** | 800 |
| cooldown | **360t** | 6000 |
- dmg mult **1.80** (= 68) · hitbox = collider ตัวมอนขณะ dash (หน้ากว้าง 56 px)
- ระหว่าง dash: วิ่ง `speedCharge` ตาม facing ที่ล็อกไว้ตอน telegraph **ห้ามเลี้ยว**
- dash จบเมื่อ: ชนผู้เล่น / ชนฉาก / ครบ 30t
- knockback ผู้เล่น **90 px ใน 12t (200 ms)**
- โดนครั้งเดียวต่อ dash (hit-list dedupe)
- **telegraph 600 ms คือหน้าต่างให้ผู้เล่นหลบ** — ต้องมีเอฟเฟกต์ชัด (ฝุ่น + เส้นหมึกบอกทิศ) → งานพอร์น

### 7.4 AI State Machine

```
                   ┌──────────────────────────────────────┐
                   ▼                                      │
 spawn ──► IDLE ◄──────────► PATROL                       │
            │  ▲                │                        │
            │  │ (เกิน aggroLose)│                        │
            ▼  │                ▼                        │
          CHASE ◄───────────────┘                        │
          │   │ │                                        │
          │   │ └──► CHARGE ──(dash จบ)──► recovery ──────┘
          │   │
          │   └──► ATTACK ──(recovery จบ)──► CHASE
          │
 ทุก state ──(stagger)──► HURT ──► CHASE
 ทุก state ──(hp<=0)────► DEAD ──► DESPAWN ──► (respawn timer) ──► spawn
```

| state | พฤติกรรม | เงื่อนไขออก |
|---|---|---|
| `IDLE` | ยืนนิ่ง เล่น idle anim · สุ่ม `idleTicks` = **120–300t (2–5 s)** | `idleTicks` หมด → `PATROL` · ผู้เล่นเข้า `aggroRange` → `CHASE` |
| `PATROL` | สุ่มจุดในรัศมี spawn zone เดินด้วย `speedPatrol` | ถึงจุด (≤ 16 px) → `IDLE` · เดินเกิน **600t (10 s)** ยังไม่ถึง → `IDLE` (กันติด) · ผู้เล่นเข้า `aggroRange` → `CHASE` |
| `CHASE` | วิ่งหาผู้เล่นด้วย `speedChase` (ใช้ 8-dir เหมือนผู้เล่น) | dist ≤ `attackRange` → `ATTACK` · dist ∈ [180, 420] + cooldown พร้อม + align ≤ 25° → `CHARGE` · dist > `aggroLoseRange` **หรือ** chase เกิน `aggroLoseTicks` → `PATROL` |
| `ATTACK` | เล่นท่า gore · vel = 0 ตลอด startup+active · **ล็อก facing ตอน startup** | recovery จบ → `CHASE` (รอ `attackIntervalTicks` ก่อนตีอีก) |
| `CHARGE` | telegraph → dash → recovery | recovery จบ → `CHASE` |
| `HURT` | stagger 8t · vel = 0 · knockback ตามข้อ 7.5 | ticks หมด → `CHASE` (aggro ใส่คนที่ตีเสมอ) |
| `DEAD` | anim ตาย **40t (667 ms)** · ไม่มี collider ไม่มี hurtbox แล้ว | anim จบ → drop ไอเท็ม → ศพค้าง **60t** → fade **30t** → `DESPAWN` |

**กฎ aggro เพิ่มเติม:**
- โดนตี → **บังคับ aggro ใส่คนที่ตี** ทันที แม้อยู่นอก `aggroRange` (รีเซ็ต `aggroLoseTicks`)
- ไม่ต้องมี line-of-sight check ใน Phase 2 (แมพทุ่งเปิดโล่ง) — จดไว้ใน backlog
- `maxSimultaneousChasers` = **6** ตัวต่อผู้เล่น 1 คน · ตัวที่ 7+ ค้าง `PATROL`
- `maxMeleeSlots` = **3** ตัวที่เข้า `ATTACK` พร้อมกัน · ตัวที่เกินวนรอผู้เล่นที่ระยะ **150 px**
  (orbit: เดินตามเส้นรอบวงรัศมี 150 px ทิศตาม `entityId % 2` → ครึ่งซ้ายครึ่งขวา ไม่กองด้านเดียว)
- Soft separation ระหว่างมอน: ดู `01-movement-world.md` ข้อ 5.6

### 7.5 Knockback & Stagger

**มอนถูกตี:**
```
staggerThreshold = 8% ของ monster.maxHP = 26 ดาเมจ
if damage >= 26 and staggerImmunityTicks == 0:
    state = HURT
    staggerTicks = 8          (133 ms)
    staggerImmunityTicks = 90 (1500 ms)       // กัน stun-lock
    knockbackDistance = (attack.step == 3) ? 48 : (step==2 ? 14 : 12)   // px
    knockbackDurationTicks = (step == 3) ? 12 : 8
else:
    ไม่ stagger — เสียแค่ HP (ดาเมจยังเข้าปกติ)
```
- Knockback เป็น **การเลื่อนตำแหน่งแบบ ease-out** ตามทิศ `facing` ของผู้ตี (ไม่ใช่ทิศจากจุดกลางถึงจุดกลาง — ทิศผู้ตีคุมได้ รู้สึกดีกว่า)
- ขณะ knockback **ยังเช็ค collision ฉากปกติ** ชนกำแพงแล้วหยุด ไม่ทะลุ
- ขณะ `HURT` มอน **รับดาเมจได้ปกติ** (ไม่มี invulnerable)
- `staggerImmunityTicks` นับลดทุก tick ไม่สนว่าอยู่ state ไหน

**ผู้เล่นถูกตี:**
```
playerStaggerTicks = 8  (133 ms)   // ทุกครั้งที่โดน ไม่มี threshold
playerStaggerImmunityTicks = 42 (700 ms)
knockback = gore 60 px / 9t · charge 90 px / 12t
```
- stagger ของผู้เล่น **ยกเลิกคอมโบและ action ทุกอย่าง** (ดูข้อ 1.5)
- ไม่มี i-frame หลังโดน นอกจาก `staggerImmunity` ที่กันแค่ "โดน stagger ซ้ำ" (ดาเมจยังเข้า)
  → ถ้าเทสต์แล้วรุมแล้วขยับไม่ได้เลย ให้ลด `playerStaggerTicks` เป็น 5t

### 7.6 Respawn ของมอน
| ค่า | ตัวเลข |
|---|---|
| `respawnTicks` | **1500t (25 วินาที)** นับจาก DESPAWN |
| จุด respawn | สุ่มในรัศมี spawn zone เดิม (ดู `01-movement-world.md` ข้อ 9.2) |
| `spawnMinDistanceFromPlayer` | **480 px** — ถ้าหาจุดไม่ได้ เลื่อน respawn อีก 60t แล้วลองใหม่ (ลองได้ไม่เกิน 20 รอบ แล้วยอม spawn จุดใดก็ได้) |
| state เริ่มต้นหลัง spawn | `IDLE` + `idleTicks` สุ่ม 120–300t (มอนไม่กระโจนใส่ทันที) |
| HP ตอน spawn | เต็ม 320 เสมอ |

### 7.7 Drop table
สุ่มแบบ **independent roll** (แต่ละบรรทัดสุ่มแยกกัน ได้หลายอย่างพร้อมกันได้) — **ไม่ใช่** weighted pick

| item | โอกาส | จำนวน | หมายเหตุ |
|---|---|---|---|
| `mat_silver_coin` เงิน | **100%** | **12–28** | รับเข้ากระเป๋าเงินตรง ไม่กินช่อง inventory |
| `mat_beast_bone` กระดูกสัตว์ | **45%** | 1–2 | |
| `mat_beast_hide` หนังสัตว์ | **35%** | 1–2 | |
| `mat_boar_tusk` เขี้ยวหมูปีศาจ | **8%** | 1 | ของหายาก ใช้ตีบวก Phase 3 |
| `pot_hp_small` โพชั่น HP เล็ก | **10%** | 1 | |
| `pot_mp_small` โพชั่น MP เล็ก | **5%** | 1 | |

**โอกาสได้อย่างน้อย 1 วัตถุดิบ** = 1 − (0.55 × 0.65) = **64.25%** (นับ bone/hide)
**EV เงินต่อตัว** = 20 · ฟาร์ม 33 ตัว/เลเวล ≈ **660 เงิน** → พอซื้อโพชั่น 12 ขวด

**ผลของ LUK:**
```
effectiveRate = min(baseRate * (1 + min(0.30, LUK * 0.002)), 100)
```
- LUK 18 → ×1.036 (bone 45% → 46.6%) · LUK 99 → ×1.198 (cap ที่ ×1.30 ต้องมีอุปกรณ์ช่วย)
- แถว **100%** ไม่โดนคูณ (เป็น 100% อยู่แล้ว) · **จำนวนเงินไม่โดนคูณ** (กัน LUK stack เป็น money printer)

**ลำดับ RNG ตอนมอนตาย (ต้องตรงเป๊ะทุกเครื่อง):**
```
for i in 0..entries.length-1:          // ตามลำดับ index ในไฟล์ ไม่ใช่ลำดับสุ่ม
    [RNG] chanceRoll  → ผ่าน/ไม่ผ่าน
    if ผ่าน:
        [RNG] qtyRoll → minQty..maxQty (uniform integer)
        pushDrop(itemId, qty)
```
→ **ห้าม** skip การ roll เมื่อ inventory เต็ม ต้อง roll ให้ครบก่อนแล้วค่อยจัดการ (ดูข้อ 10)

### 7.8 ไอเท็มที่ดรอป → ที่พื้นหรือเข้ากระเป๋า?
**Phase 2: เข้ากระเป๋าทันที (auto-loot)** ไม่มีไอเท็มร่วงที่พื้นให้เดินเก็บ
เหตุผล: ไม่ต้องทำ pickup entity, pickup radius, loot ownership — ซึ่งทั้งหมดเป็นปัญหาตอน Multiplayer
Render แสดงเป็น **loot toast มุมขวาล่าง** + ไอคอนลอยขึ้นจากศพ
(ไอเท็มร่วงพื้น + loot ownership → backlog)

---

## 8. Damage Number & VFX

### 8.1 สีและขนาดตัวเลข
| ประเภท | สี | ขนาด | รูปแบบ |
|---|---|---|---|
| ดาเมจปกติ (เราตีมอน) | `#F5F0E6` ขาวหมึก | **30 px** | `123` |
| **Critical** | `#FFC53D` ทองหมึก | **42 px** | `246!` + ตัวอักษรสั่น 2 px + scale punch 1.0→1.15→1.0 ใน 8t |
| เราโดนดาเมจ | `#E34B4B` แดงชาด | **32 px** | `-35` |
| ฟื้น HP | `#6BD37A` เขียวหยก | **30 px** | `+176` |
| ฟื้น MP | `#5FA8E8` ฟ้าหมึก | **28 px** | `+55` |
| MISS / หลบ | `#9A9A9A` เทา | **26 px** | `หลบ` |
| EXP | `#C9A227` ทองหม่น | **22 px** | `+42 EXP` |

ทุกตัวมี **outline สีดำ 3 px** (อ่านได้บนพื้นหมึกจีนที่มีทั้งขาวและดำ) ฟอนต์ `FONT_DISPLAY`

### 8.2 การลอย
| ค่า | ตัวเลข |
|---|---|
| ระยะลอยขึ้น | **46 px** |
| ระยะเวลา | **46t (767 ms)** |
| easing | ease-out quad (เร็วตอนแรก ช้าตอนปลาย) |
| fade out | **14t (233 ms)** สุดท้าย |
| x jitter | สุ่ม ±14 px (deterministic จาก `entityId + tick` ไม่ใช้ RNG หลัก) |
| stack offset | ถ้ามีตัวเลขใหม่ ≤ 8t จากตัวก่อน → เลื่อนเริ่มต้นลง **+16 px** (ซ้อนได้สูงสุด 5 ชั้น) |
| จุดเกิด | hurtbox center ของเป้า + y −20 px |
| depth | `layerBias +5` (อยู่บน prop ทุกชิ้น) |
| `maxConcurrentNumbers` | **40** เกินกว่านั้นลบตัวที่เก่าสุด |

### 8.3 Hit stop
> ⚠️ **Hit stop เป็น render-only ห้ามหยุด Sim**
> Sim เดิน 60 Hz สม่ำเสมอตลอด · render แค่ freeze เฟรม animation + หยุด interpolate ตำแหน่งชั่วคราว
> ถ้าหยุด Sim จะพัง determinism และทำ netcode ไม่ได้

| เหตุการณ์ | freeze |
|---|---|
| ดาเมจปกติ | **0t** (ไม่มี) |
| Critical | **4t (67 ms)** |
| Combo step 3 โดน | **5t (83 ms)** |
| ผู้เล่นโดน charge | **6t (100 ms)** |
| ผู้เล่นตาย | **10t (167 ms)** |

freeze เฉพาะ **sprite ของผู้ตีและเป้าหมาย** ไม่ freeze ทั้งจอ

### 8.4 Screen shake
| เหตุการณ์ | amplitude | duration |
|---|---|---|
| Critical | **2 px** | 100 ms |
| Combo step 3 โดน | **3 px** | 130 ms |
| ผู้เล่นโดน gore | **4 px** | 150 ms |
| ผู้เล่นโดน charge | **6 px** | 200 ms |
| มอนตาย | **2 px** | 90 ms |
| ผู้เล่นตาย | **8 px** | 400 ms |
- รูปแบบ: random offset ต่อเฟรม + decay เชิงเส้นถึง 0
- shake **ไม่ซ้อนทับกัน** ตัวที่ amplitude สูงกว่าเขียนทับตัวที่ต่ำกว่า (ไม่บวกกัน) กันจอเหวี่ยงตอนรุม

### 8.5 Audio cue — สำหรับมิว
| เหตุการณ์ | เสียงที่ต้องการ |
|---|---|
| โจมตี step1/2 | ดาบผ่าอากาศ เบา สั้น (2 variant สลับกัน) |
| โจมตี step3 | ดาบผ่าหนัก + เสียงหมึกสะบัด |
| โดนเป้า (ปกติ) | เนื้อ/หนังโดนฟัน แหบ ๆ |
| **Critical** | เสียง "เพล้ง" โลหะใส + ระฆังเบา ๆ ซ้อน |
| MISS | เสียงลมผ่านเปล่า |
| Boar telegraph charge | เสียงหมูพ่นลมหายใจ + เท้าขูดดิน (**ต้องชัดมาก เป็น audio cue หลักของเกมนี้**) |
| Boar ตาย | ร้องสั้น + เสียงฝุ่น |
| กินโพชั่น | เสียงจิบ + ประกายเบา |
| Level up | ระฆังวัด + เสียงหมึกแผ่ |
| ผู้เล่นตาย | ระฆังต่ำ ยาว + เสียงหมึกหยด |

---

## 9. Death & Respawn ของผู้เล่น

```
เมื่อ hp <= 0:
    hp = 0                                  // ** clamp ที่ 0 ห้ามติดลบ **
    state = DEAD
    ล้าง: combo, buffer input, knockback, regen accumulator, aggro ของมอนทุกตัว
    มอนที่ aggro เราอยู่ → กลับ PATROL ทันที
    deathAnimTicks = 72 (1200 ms) — ล็อก input ทั้งหมด
    แสดงหน้าจอตาย (ปุ่ม "กลับเมือง")
```

### 9.1 บทลงโทษ
| ค่า | ตัวเลข |
|---|---|
| `expPenaltyPercent` | **3%** ของ `expToNext(currentLevel)` |
| `gracePeriodMaxLevel` | **5** — Lv.1–5 **ไม่เสีย exp เลย** |
| **ห้าม de-level** | `exp = max(0, exp - penalty)` ถ้า exp ปัจจุบันไม่พอ → เหลือ 0 ไม่ลดเลเวล |
| เสียไอเท็ม / เงิน | **ไม่เสีย** ใน Phase 2 |
| ค่าซ่อมอุปกรณ์ | ไม่มีระบบ durability ใน Phase 2 |

ตัวอย่าง: Lv.32 ตาย → เสีย `floor(42000 × 0.03) = 1260 exp` ≈ 30 ตัว Demon Boar ที่เลเวลเดียวกัน
→ เจ็บพอให้ระวัง แต่ไม่ถึงกับเลิกเล่น

### 9.2 Respawn
| ค่า | ตัวเลข |
|---|---|
| จุดเกิด | **ศาลเมืองหมึกเงิน** `town_silverink` tile (40, 32) → world px **(2592, 2080)** |
| HP ตอนเกิด | **50% ของ maxHP** (ปัดลง) |
| MP ตอนเกิด | **30% ของ maxMP** (ปัดลง) |
| `invulnerableTicks` | **180t (3000 ms)** — เมืองไม่มีมอนอยู่แล้ว แต่ใส่ไว้กันเคสอนาคต |
| facing | 0 (ลง) |
| fade | จอดำ 300 ms → โหลดเมือง → fade in 300 ms |
| save | **เซฟอัตโนมัติทันทีหลัง respawn** |

ไม่มี "respawn ที่จุดตาย" ใน Phase 2 (ไม่มีค่าใช้จ่าย ไม่มีตัวเลือก) — เป็นทางเดียว

---

## 10. Edge Cases — ต้องทำตามนี้ทุกข้อ

| # | เคส | พฤติกรรมที่ต้องเป็น |
|---|---|---|
| 1 | **HP ติดลบ** | `hp = max(0, hp - damage)` ทุกจุดที่เขียน HP · HUD/HP bar อ่านค่า clamp แล้วเท่านั้น · ไม่ใช้ `hp < 0` เป็นเงื่อนไขตายที่ไหนเลย ใช้ `hp <= 0` |
| 2 | **HP เกิน maxHP** | `hp = min(maxHP, hp)` ทุกครั้งหลัง heal/level up/recalc |
| 3 | **maxHP ลดลง** (ถอดเกราะ VIT, Phase 3) | ถ้า `hp > maxHP` → `hp = maxHP` ไม่ทำให้ตาย |
| 4 | **ได้ exp เกินหลายเลเวลพร้อมกัน** | วนลูปตามข้อ 5.4 · ยิง `LEVEL_UP` event **ทุกเลเวล** · แจกแต้มทุกเลเวล · `recalcDerivedStats()` ทุกรอบ · ส่วนที่เหลือค้างไว้ไม่ทิ้ง |
| 5 | **ได้ exp ตอน Lv.50 (cap)** | exp ค้างไว้แต่ไม่เกิน `expToNext(49)` · HUD แสดง "MAX" · ไม่แจกแต้ม |
| 6 | **Inventory เต็มตอน drop** | roll ให้ครบทุกบรรทัดก่อน → ของที่ลงไม่ได้ **หายไป** + toast สีแดง "กระเป๋าเต็ม! สูญเสีย [ชื่อ] × N" · **เงินเข้าตลอด** (ไม่กินช่อง) · ของที่ stack ได้และมี stack เดิมอยู่ให้ลงก่อน (เรียงลำดับ: เติม stack เดิม → ช่องว่าง → ทิ้ง) |
| 7 | **ตีมอนที่กำลังตาย** (`DEAD` state) | มอนที่ `DEAD` **ไม่มี hurtbox** → หา hit ไม่เจอตั้งแต่ต้น · hit-list ไม่นับ · **ห้าม** drop/exp ซ้ำ ใช้ flag `rewardsGranted` ยิงครั้งเดียวตอนเข้า `DEAD` |
| 8 | **ดาเมจทีเดียวเกิน HP ที่เหลือ** | หัก HP เหลือ 0 (ไม่ overkill carry) · damage number แสดง **ค่าดาเมจจริงที่คำนวณได้** ไม่ใช่ HP ที่เหลือ (ให้ฟีลแรง) |
| 9 | **มอนหลายตัวรุมพร้อมกัน** | `maxSimultaneousChasers` 6 · `maxMeleeSlots` 3 · ตัวที่เกินวน orbit 150 px · screen shake ไม่บวกกัน · damage number stack ไม่เกิน 5 ชั้น · soft separation กันทับกัน |
| 10 | **ดาเมจเข้าพร้อมกันหลายตัวใน tick เดียว** | ประมวลผล **ตามลำดับ `entityId` เพิ่มขึ้น** (deterministic) · เช็คตายหลังจบทุกตัวใน tick นั้น ไม่เช็คกลางลูป |
| 11 | **Combo ถูกขัดกลางคัน** | reset `comboStep = 1`, ล้าง input buffer, ล้าง hit-list · ไม่ต้องรอ lockout |
| 12 | **กดโจมตีตอนตาย** | input ทั้งหมดถูกทิ้ง (ไม่บัฟเฟอร์) |
| 13 | **กินโพชั่นตอน HP เต็ม** | ไม่ consume ไม่กิน cooldown · toast แจ้งเตือน |
| 14 | **โพชั่นหมดตอน auto potion ทำงาน** | ยิง `WARN_NO_POTION` throttle 600t (10 s) · auto potion ไม่ติด cooldown ถ้าไม่ได้ใช้จริง |
| 15 | **มอน spawn ทับ collider/ทับผู้เล่น** | เช็ค `spawnMinDistanceFromPlayer` 480 px + `spawnMinDistanceFromProp` 48 px · ลองใหม่ได้ 20 รอบ (ห่างกัน 60t) แล้วค่อยยอม |
| 16 | **มอน charge ชนกำแพง** | dash หยุดทันที · เข้า recovery **ยาวกว่าปกติ 1.5×** (72t) = ลงโทษให้ผู้เล่นได้โอกาสฟรี · ไม่มีดาเมจตัวเอง |
| 17 | **ผู้เล่นออกจากแมพตอนมอนกำลังตี** | despawn มอนทั้งหมด · ล้าง knockback/stagger ของผู้เล่น · HP/MP คงค่าเดิม (ไม่ฟื้น) |
| 18 | **Stagger lock** (โดนรุมจนขยับไม่ได้) | `playerStaggerImmunityTicks` 42t กันโดน stagger ซ้ำถี่ (ดาเมจยังเข้า) · ถ้าเทสต์ยังแย่ให้ลด `playerStaggerTicks` 8→5 |
| 19 | **ค่า DEF สูงมาก** | สูตรหารไม่มีวันถึง 100% · ไม่ต้องใส่ cap เพิ่ม |
| 20 | **damage = 0 จากการปัดเศษ** | `minDamage = max(1, floor(ATK * 0.05))` การันตีไม่มี 0 |
| 21 | **Knockback ดันออกนอกแมพ** | knockback ผ่าน collision resolution ปกติ (per-axis) · tile ขอบแมพเป็น blocked หมด → ดันทะลุไม่ได้ |
| 22 | **เลเวลอัพขณะกำลังตาย** (ได้ exp จากดาเมจก้อนสุดท้ายแล้วตายใน tick เดียวกัน) | ลำดับใน tick: ประมวลผลดาเมจทั้งหมด → ให้ exp/drop → เช็ค level up → เช็คตาย · ผลคือ **เลเวลอัพก่อน แล้ว maxHP โต แล้วเลเวลอัพฟื้นเต็ม → ไม่ตาย** (ตั้งใจให้เป็นโมเมนต์ลุ้น) |

---

## 11. 📡 Multiplayer — ค่า/การตัดสินใจที่ต้องเป็น Server-Authoritative

> Phase 2 ยังเป็น Offline-first รัน Sim ที่ client ทั้งหมด
> **แต่ต้องเขียนโค้ดตั้งแต่วันนี้ให้ "ย้ายฝั่ง" ได้โดยไม่ต้องรื้อ** — เกณฑ์ง่าย ๆ คือ
> *ถ้าผู้เล่นโกงค่านี้แล้วได้เปรียบ → มันต้องอยู่ฝั่ง server*

### 11.1 ต้องเป็น server-authoritative เด็ดขาด (โกงได้ = พังเกม)

| เรื่อง | เพราะอะไร | สิ่งที่ต้องทำตั้งแต่วันนี้ |
|---|---|---|
| **คำนวณดาเมจทุกขั้น** (§4.3 STEP 0–6) | client ส่ง "ฉันทำดาเมจ 99999" ไม่ได้ | ฟังก์ชันเดียว `resolveDamage(attacker, target, move, rng)` **pure function** ไม่แตะ global state ไม่แตะ `Math.random()` |
| **สุ่ม Hit / Crit / Variance** | สุ่มใหม่จนได้ crit | ทุกค่าสุ่มมาจาก `rng` object ที่ **ส่งเข้าเป็นพารามิเตอร์** เท่านั้น · ห้ามเรียก `Math.random()` ใน `src/sim/` แม้แต่ครั้งเดียว (เพิ่ม eslint rule `no-restricted-globals`) |
| **สุ่ม Drop table** | re-roll จนได้เขี้ยวหมู | ลำดับ roll ตาม §7.7 เป๊ะ · drop ตัดสินที่ฝั่งเดียวกับที่ตัดสินว่ามอนตาย |
| **HP / MP ปัจจุบัน** | ตั้ง hp = 99999 | เป็น state ใน Sim ไม่ให้ render เขียนย้อนกลับได้ (render อ่าน snapshot อย่างเดียว) |
| **ตัดสินว่า hit โดนไหม** (sector vs circle) | ขยาย hitbox / ตีข้ามแมพ | `checkSectorHit()` pure · ใช้ค่า radius/arc จาก data ที่ server โหลด ไม่ใช่ที่ client ส่งมา |
| **EXP ที่ได้ / เลเวล / แต้มสเตตัส** | ตั้งเลเวล 50 | level-up loop อยู่ใน Sim ล้วน · client ส่งได้แค่ intent `ALLOCATE_STAT { stat }` ทีละ 1 แต้ม |
| **การตายและบทลงโทษ** | ไม่ยอมตาย | |
| **จำนวนไอเท็ม / เงิน** | ปั๊มของ | |
| **มอน spawn/respawn/aggro/state** | ลบมอน หรือรู้ว่ามอนจะเกิดที่ไหน | spawn point roll ใช้ rng stream ของ server |
| **ตำแหน่งมอนทุกตัว** | | |
| **Cooldown ทุกชนิด** (โพชั่น, combo lockout, charge) | spam | นับเป็น **ticks** ไม่ใช่ `Date.now()` — timestamp ของ client โกงง่าย |

### 11.2 Client ส่งได้แค่ "intent" ไม่ใช่ "ผลลัพธ์"

```
// ✅ สิ่งที่ client ส่งได้
InputFrame { tick, up, down, left, right, attack, potion, interact }
IntentMessage { ALLOCATE_STAT | USE_ITEM(slot) | EQUIP(slot) | TOGGLE_AUTO_POTION | INTERACT(npcId) }

// ❌ สิ่งที่ client ห้ามส่งตลอดกาล
{ damage: 500 }  { hp: 1800 }  { exp: 99999 }  { position: {x,y} }  { killed: monsterId }
{ drops: [...] } { isCrit: true } { level: 50 }
```

### 11.3 อยู่ฝั่ง client ได้ (ไม่กระทบ gameplay — "cosmetic")
Damage number (สี/ขนาด/การลอย/x jitter) · Screen shake · **Hit stop** (§8.3 — ย้ำว่าต้อง render-only) ·
**Occlusion fade 50%** · Camera (deadzone/lerp/lookahead) · Animation frame index · SFX/BGM ·
Loot toast · UI layout ทั้งหมด

### 11.4 เส้นแบ่งในโค้ดที่ต้องรักษาตั้งแต่ Phase 2

```
src/sim/          ← server-authoritative ทั้งหมด · pure TS · ห้าม import phaser
                     ห้าม Math.random() · ห้าม Date.now() · ห้าม performance.now()
                     ห้ามอ่าน DOM / localStorage โดยตรง
src/render/       ← cosmetic ทั้งหมด · อ่าน snapshot จาก Sim อย่างเดียว ห้ามเขียนกลับ
src/bridge/       ← แปลง input → InputFrame และ snapshot → render command
                     วันที่ทำ MP: แทนที่ bridge ตัวนี้ด้วย network layer ** ไม่ต้องแก้ sim เลย **
src/data/         ← ไฟล์ JSON ของภูมิ (เหมือนกันทั้ง client และ server)
```

### 11.5 เรื่องที่ **ต้อง** ตัดสินใจก่อนเริ่มทำ MP (ยังไม่ต้องทำตอนนี้ แต่อย่าปิดทางเลือก)
1. **RNG seed ส่งให้ client ไหม** — ถ้าส่ง client ทำนาย crit/drop ล่วงหน้าได้ (โกงเชิงข้อมูล)
   → แนะนำ: ใช้ **2 stream** — `rngCosmetic` (seed แชร์ได้) และ `rngGameplay` (server เท่านั้น)
   **ตั้งโครงเป็น 2 stream ตั้งแต่ Phase 2** จะได้ไม่ต้องรื้อ
2. ใช้ **lockstep** หรือ **server-tick + client prediction + rollback** — ตัวหลังเหมาะกับเกม action กว่า
   แต่ต้องการให้ Sim **rollback ได้** → ตั้งแต่วันนี้ให้ state ของ Sim เป็น **serializable snapshot ทั้งก้อน**
   (นัทมี `src/sim/save/serialize.ts` อยู่แล้ว — ใช้ตัวเดียวกันได้เลย ดีมาก)
3. Monster ownership / exp sharing ตอนหลายคนตีมอนตัวเดียวกัน → **ยังไม่ออกแบบ (Phase 5)**
   แต่ **ต้องใส่ฟิลด์ `damageContributors: Map<entityId, number>` ใน monster state ตั้งแต่ Phase 2**
   (เก็บไปก่อน ไม่ใช้ก็ได้ ราคาถูกมาก แต่ถ้าไม่มีจะต้องรื้อ)

---

## 12. Acceptance Criteria — Phase 2

| # | เกณฑ์ | ค่าที่ต้องได้ |
|---|---|---|
| 1 | `maxHP(32, VIT 36)` | **1800** เป๊ะ |
| 2 | `maxMP(32, INT 26)` | **620** เป๊ะ |
| 3 | stat point รวมที่ Lv.32 (รวมค่าเริ่มต้น 30) | **160** เป๊ะ |
| 4 | `expToNext(31)` / `expToNext(32)` | **39,525** / **42,000** |
| 5 | cumulative exp ถึง Lv.50 | **1,706,183** |
| 6 | `critRate(LUK 18, DEX 38)` | **14.2%** |
| 7 | `critMult(LUK 18)` | **1.59** |
| 8 | `ATK` ตัวละครอ้างอิง + ดาบหยกหมึก +5 | **205** |
| 9 | ผู้เล่น Lv.6 ฆ่า Demon Boar | **5–6 ครั้ง** |
| 10 | เดินทแยงหนี Demon Boar ที่ chase | **หนีได้ตลอด** (180 > 145) |
| 11 | ดาเมจต่ำสุดที่เป็นไปได้ | **≥ 1 เสมอ** ไม่มี 0 ไม่มีติดลบ |
| 12 | HP ไม่ติดลบ ไม่เกิน max ในทุกเคส | unit test ครอบ §10 ข้อ 1–3 |
| 13 | ได้ exp ก้อนใหญ่ → ขึ้นหลายเลเวลถูกต้อง | ยิง event ครบทุกเลเวล แต้มครบ |
| 14 | `grep -r "Math.random" src/sim/` | **ไม่เจอเลย** |
| 15 | `grep -rE "Date.now\|performance.now" src/sim/` | **ไม่เจอเลย** |
| 16 | รัน Sim 2 instance ด้วย seed + input เดียวกัน 10,000 ticks | state hash **ตรงกันเป๊ะ** |
| 17 | ตีมอนที่ `DEAD` | ไม่ได้ exp/drop ซ้ำ |
| 18 | Hit stop ไม่หยุด Sim | tick counter เดินต่อเนื่องขณะ hit stop |

---

## ภาคผนวก — ไฟล์ข้อมูลที่เกี่ยวข้อง
`data/exp-curve.json` · `data/player-stats.json` · `data/combat-formulas.json` ·
`data/monsters.json` · `data/drop-tables.json` · `data/items.json`
คำอธิบาย schema + หน่วยทุกฟิลด์: `03-data-schema.md`
