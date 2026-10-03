# Data Schema — หน่วยและความหมายของทุกฟิลด์

เอกสารนี้แทน comment ใน JSON (เพราะ JSON ใส่ comment ไม่ได้)
ไฟล์ทั้งหมดอยู่ที่ `docs/design/data/` → **คัดลอกไปวางที่ `src/data/` ได้ทันที**

---

## 0. กฎหน่วยกลาง (อ่านข้อนี้ก่อน)

| suffix ชื่อฟิลด์ | หน่วย | หมายเหตุ |
|---|---|---|
| `...Px` | pixel (world space) | ไม่ใช่ screen px — ไม่ขึ้นกับ zoom |
| `...PxPerSec` | px / วินาที | |
| `...PxPerSec2` | px / วินาที² | ความเร่ง |
| `...Ticks` | **sim ticks @ 60 Hz** | 1 tick = 16.6667 ms · **โค้ดต้องใช้ค่านี้** |
| `...Ms` | millisecond | **เฉพาะค่า render/cosmetic** (fade, shake) ที่ไม่กระทบ gameplay |
| `...Percent` | เปอร์เซ็นต์ (0–100) | เช่น `35.0` = 35% |
| `...Fraction` | สัดส่วน (0–1) | เช่น `0.5` |
| `...Multiplier` | ตัวคูณ | `1.0` = ไม่เปลี่ยน |
| `...Deg` / `...Degrees` | องศา | arc = **องศาเต็ม** ไม่ใช่ครึ่ง |
| `...Flat` | ค่าดิบบวกตรง ๆ | ไม่มีหน่วย |
| `...TileX` / `...Tiles` | index/จำนวน tile (64 px) | |
| ไม่มี suffix | ค่าดิบ | `maxHp`, `atk`, `def`, `hit`, `flee`, `expReward` |

**กฎการปัดเศษ:** ทุกค่าที่เข้า HP/MP/damage/exp ปัด **floor** เสมอ (ดู `combat-formulas.json → rounding`)
**ห้ามใช้ `...Ms` ใน Sim** — ถ้าต้องใช้เวลาใน Sim ให้ใช้ `...Ticks`

---

## 1. `exp-curve.json`

| ฟิลด์ | type | หน่วย | ความหมาย |
|---|---|---|---|
| `levelCap` | int | — | เลเวลสูงสุด Phase 2 = 50 |
| `formula.base` | string | — | สูตรดิบ (ไว้อ่าน ไม่ต้อง eval) |
| `formula.tierMultipliers[]` | array | — | ตัวคูณตามช่วงเลเวล `fromLevel`–`toLevel` (inclusive ทั้งสองฝั่ง) · ใช้ `numerator`/`100` **ห้ามใช้ `multiplier` ที่เป็น float** |
| `formula.useIntegerArithmetic` | bool | — | **true** — `floor(base * numerator / 100)` เท่านั้น |
| `expToNextByLevel[]` | int[50] | exp | **index = level − 1** · ค่า = exp ที่ต้องเก็บเพิ่มขณะอยู่เลเวลนั้น · index 49 (Lv.50) = `0` |
| `cumulativeExpByLevel[]` | int[50] | exp | **index = level − 1** · exp สะสมทั้งหมดที่ต้องมีเพื่อ **ถึง** เลเวลนั้น · index 0 = `0` |

**Invariant ที่ต้องเป็นจริง (ใส่ใน unit test):**
```
cumulativeExpByLevel[L]     === cumulativeExpByLevel[L-1] + expToNextByLevel[L-1]
cumulativeExpByLevel[0]     === 0
expToNextByLevel[49]        === 0
cumulativeExpByLevel[49]    === 1706183
expToNextByLevel[L-1]       === Math.floor(25 * L * (L+3) * tierNum(L) / 100)   // L = 1..49
```

> ⚠️ **กับดัก float ที่เจอจริงตอนตรวจตาราง:** `Math.floor(5200 * 1.15)` ได้ **5979** (ควรเป็น 5980)
> และ `Math.floor(11500 * 1.15)` ได้ **13224** (ควรเป็น 13225)
> → ต้องใช้ `Math.floor(base * 115 / 100)` เท่านั้น · ตารางใน JSON ถูกแล้ว ตรวจด้วย integer math ผ่าน 49/49 ค่า
> ถ้าสงสัยให้เชื่อ `expToNextByLevel[]` ไม่ต้องคำนวณเอง

> ✅ `cumulativeExpByLevel` ตรงกับ `ExpCurve` type ที่นัทมีอยู่แล้วใน `src/data/types/defs.ts` ใช้ได้เลย
> ต้อง **เพิ่ม** field `expToNextByLevel` เข้า type (แนะนำให้ใช้ตัวนี้เป็นหลัก คำนวณ level-up ง่ายกว่า)

---

## 2. `player-stats.json`

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `startingStats` | ค่าดิบ | ค่าเริ่มต้น Lv.1 ของ Sword Exorcist · `totalStatValue` 30 คือผลรวมไว้เช็ค |
| `statCapPerStat` | ค่าดิบ | เพดานต่อสเตตัส = 99 |
| `statPointCostPerPoint` | ค่าดิบ | 1 แต้ม = 1 สเตตัส (ไม่มีราคาเพิ่มขึ้น) |
| `pointsPerLevel.statPointsPerLevel` | ค่าดิบ | 4 แต้มทุกเลเวล |
| `pointsPerLevel.statPointBonus` | — | `{everyNLevels: 5, amount: 1}` → ได้เพิ่มที่ Lv ที่หาร 5 ลงตัว |
| `resourceFormulas.maxHp` | — | `base + perLevel*(level-1) + perVit*vit` |
| `resourceFormulas.maxMp` | — | `base + perLevel*(level-1) + perInt*int` |
| `regen.*PerSec*` | หน่วย/วินาที | **ต้องใช้ fractional accumulator** (`+= perSec/60` ต่อ tick) ไม่ปัดทุก tick |
| `regen.outOfCombatTicks` | ticks | 300 = 5 วินาทีที่ไม่ได้รับ/ไม่สร้างดาเมจ |
| `statEffectsPerPoint.<stat>.*` | ตามชื่อฟิลด์ | ผลต่อ **1 แต้ม** คูณจำนวนแต้มที่มีทั้งหมด (ไม่ใช่แค่แต้มที่ลงเพิ่ม) |
| `statEffectsPerPoint.int.matkFlat` | ค่าดิบ | `_matkNote: RESERVED_PHASE3_LOCKED_CLASSES` — คำนวณได้แต่ยังไม่มีสกิลใช้ |
| `levelDerived.*` | — | ค่าที่ได้จากเลเวลเพียว ๆ ไม่เกี่ยวสเตตัส |
| `derivedFormulas` | string | สูตรฉบับเต็ม เขียนไว้ให้อ่านประกอบ ไม่ต้อง eval |
| `deathPenalty.expPenaltyPercentOfCurrentLevelRequirement` | % | 3% ของ `expToNextByLevel[level-1]` **ไม่ใช่** 3% ของ exp สะสม |
| `deathPenalty.gracePeriodMaxLevel` | ค่าดิบ | Lv ≤ 5 ไม่เสีย exp |
| `referenceBuildCheck` | — | **unit test fixture** ค่าทุกตัวต้องตรงเป๊ะ (ตรงกับ mockup UI) |

---

## 3. `combat-formulas.json`

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `resolveOrder[]` | — | **ลำดับคำนวณดาเมจ ห้ามสลับ** — สลับแล้วตัวเลขเปลี่ยน |
| `rngCallOrderPerAttack[]` | — | **ลำดับเรียก RNG ต่อการโจมตี 1 ครั้ง** ห้ามสลับ ห้าม skip (determinism) |
| `hit.*` | fraction | `hitChance` อยู่ในสเกล 0–1 (ไม่ใช่ %) |
| `mitigation.kBase` / `kPerAttackerLevel` | ค่าดิบ | `K = 100 + 5 * attackerLevel` |
| `mitigation.critDefPenetrationPercent` | % | crit ใช้ DEF เป้าหมายเพียง 80% |
| `crit.baseRatePercent` etc. | % | `critRate` อยู่ในสเกล 0–100 |
| `crit.baseDamageMultiplier` | ตัวคูณ | 1.5 = +50% |
| `variance.min/maxPercent` | % | `-10 .. +10` uniform ต่อเนื่อง (ไม่ใช่ integer) |
| `minDamage.percentOfAttackerAtk` | % | ของ **ATK ผู้ตี** ไม่ใช่ของ raw damage |
| `basicAttack.steps[].startupTicks` | ticks | ค่า **ก่อน** ปรับ ASPD |
| `basicAttack.steps[].arcDegrees` | องศาเต็ม | ตรวจ hit ใช้ `arcDegrees / 2` เทียบกับมุมจาก facing |
| `basicAttack.steps[].radiusPx` | px | วัดจาก `pivot + facing * originForwardPx` |
| `basicAttack.aspdScalesActive` | bool | **false** — active ticks ไม่ย่อ (ให้ hitbox timing คงที่) |
| `basicAttack.excessTargetSelection` | — | `nearest_first` — เรียงระยะใกล้→ไกล แล้วตัด (deterministic ต้องไม่สุ่ม) |
| `playerHitboxes.collisionBox` | px | ใช้ชนฉากเท่านั้น |
| `playerHitboxes.hurtbox` | px | ใช้รับดาเมจ + trigger occlusion |
| `expFromMonster.diffMultipliers[]` | — | `minDiff`/`maxDiff` inclusive · `diff = monster.level - player.level` · **เรียงจาก diff สูงไปต่ำ ค้นเจอตัวแรกให้ใช้ตัวนั้น** |
| `dropRateLuk.relativeBonusPerLuk` | fraction | `0.002` = +0.2% **relative** (คูณกับ base rate ไม่ใช่บวกเข้าไป) |
| `potion.globalItemCooldownTicks` | ticks | 18 = 300 ms กันกดรวดเดียวหลายใบ |
| `autoPotion.triggerHpPercent` | % | ตรวจ `hp / maxHp <= 0.35` |
| `autoPotion._checkOrderNote` | — | **ลำดับสำคัญ**: damage → death check (ถ้าตายหยุด) → auto potion |
| `hitStop.renderOnly` | bool | **true ตลอด** — ห้าม pause Sim |
| `screenShake.stackingMode` | — | `max_not_additive` — เอา amplitude สูงสุด ไม่บวกกัน |
| `damageNumbers.*` | — | cosmetic ล้วน · `xJitterSource` ต้อง **ไม่** ใช้ RNG หลัก (จะพัง determinism) |
| `edgeCaseRules.*` | — | เช็คลิสต์ที่ต้อง implement ครบ ดู `02-combat.md §10` |
| `serverAuthoritative.*` | — | รายการแบ่งฝั่งตอนทำ MP ดู `02-combat.md §11` |

---

## 4. `monsters.json`

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `level` | ค่าดิบ | ใช้ทั้งคำนวณ `K` ตอนมอนตี และ exp diff multiplier |
| `maxHp` / `atk` / `def` / `mdef` / `hit` / `flee` | ค่าดิบ | เข้าสูตรเดียวกับผู้เล่น |
| `critRatePercent` | % | มอนก็ crit ได้ |
| `expReward` | exp | ค่า **ก่อน** คูณ diff multiplier |
| `collisionBox` / `hurtbox` | px | offset อ้างอิงจาก pivot (จุดกลางฐาน) |
| `movement.speedChasePxPerSec` | px/s | **145 < ผู้เล่น 180 โดยเจตนา** — ต้องวิ่งหนีได้ |
| `ranges.attackRangeExitPx` | px | hysteresis — เข้า ATTACK ที่ 72 ออกที่ 92 กัน state กระพริบ |
| `ranges.chargeAlignToleranceDeg` | องศา | มุมระหว่าง facing มอนกับทิศไปหาผู้เล่น ต้อง ≤ 25° |
| `attacks[].telegraphTicks` | ticks | **36t = 600 ms คือหน้าต่างให้ผู้เล่นหลบ** ห้ามลดโดยไม่คุยกับภูมิ |
| `attacks[].recoveryTicksOnWallHit` | ticks | ชนกำแพงแล้ว recovery ยาวขึ้น 1.5× = ลงโทษ |
| `attacks[].attackIntervalTicks` | ticks | นับ **จากจบ recovery** ไม่ใช่จากเริ่มท่า |
| `stagger.staggerDamageThresholdPercentOfMaxHp` | % | ตีเบากว่า 8% maxHP ไม่ stagger (ดาเมจยังเข้า) |
| `stagger.staggerImmunityTicks` | ticks | 90t = 1.5 s กัน stun-lock · นับลดทุก tick ไม่สนว่าอยู่ state ไหน |
| `stagger.knockbackDirectionSource` | — | `attacker_facing` ไม่ใช่ center-to-center (ผู้เล่นคุมทิศได้ รู้สึกดีกว่า) |
| `ai.transitions[]` | — | `from: "ANY"` = ทุก state ยกเว้น `DEAD` |
| `ai.maxSimultaneousChasersPerPlayer` | ค่าดิบ | 6 · ตัวที่เกินค้าง PATROL |
| `ai.maxMeleeSlots` | ค่าดิบ | 3 · ตัวที่เกิน orbit ที่ `ranges.orbitRadiusPx` |
| `ai.orbitDirectionSource` | — | `entityId % 2` → ครึ่งซ้าย/ครึ่งขวา ไม่กองด้านเดียว (deterministic) |
| `death.grantRewardsAtTick` | — | `on_enter_DEAD` + flag `grantRewardsOnce` → **ห้ามแจกซ้ำ** |
| `respawn.respawnTicks` | ticks | 1500t = 25 s นับจาก DESPAWN (ไม่ใช่จากตาย) |
| `multiplayerFields.damageContributors` | map | ว่างไว้ใน Phase 2 · ใส่ field ไว้เพื่อไม่ต้องรื้อ state ตอนทำ exp sharing |

> ⚠️ `MonsterDef` type ปัจจุบันของนัทมีแค่ `maxHp, moveSpeed, attackPower, expReward, dropTableId`
> ต้อง **ขยาย type** ให้ครบตามไฟล์นี้ · `attackPower` → `atk` · `moveSpeed` → แตกเป็น `movement.speed*PxPerSec` 3 ค่า

---

## 5. `drop-tables.json`

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `rollModel` | — | **`independent_roll_per_entry`** — สุ่มทุกบรรทัดแยกกัน ได้หลายอย่างพร้อมกัน |
| `entries[].index` | int | **ลำดับการ roll ที่บังคับ** — ต้อง roll ตาม index เรียงขึ้น ไม่สน array order จริง |
| `entries[].chancePercent` | % | โอกาสดรอป 0–100 |
| `entries[].minQty` / `maxQty` | ชิ้น | uniform integer inclusive ทั้งสองฝั่ง |
| `entries[].isCurrency` | bool | ถ้า true → เข้ากระเป๋าเงิน ไม่เข้า inventory |
| `entries[].affectedByLuk` | bool | ถ้า true → คูณ `dropRateLuk` ก่อน roll |
| `entries[].bypassesInventory` | bool | ถ้า true → ไม่เคยหายเพราะกระเป๋าเต็ม |
| `quantityRollSkippedWhenMinEqualsMax` | bool | **true** — `minQty == maxQty` → **ไม่เรียก RNG** (ประหยัดและต้องทำเหมือนกันทุกเครื่อง!) |
| `rollsStillConsumedWhenInventoryFull` | bool | **true** — roll ครบก่อนแล้วค่อยทิ้งของที่ลงไม่ได้ (ไม่งั้น RNG stream เคลื่อน) |
| `expectedValues` | — | ค่าอ้างอิงบาลานซ์ที่ LUK 0 ไม่ใช่ข้อมูลที่โค้ดใช้ |

> ⚠️ `DropEntry` type ของนัทใช้ `weight` (weighted pick) → **ต้องเปลี่ยนเป็น `chancePercent`**
> โมเดล weight ใช้กับดีไซน์นี้ไม่ได้ เพราะเราอยากให้ดรอปหลายอย่างพร้อมกัน

---

## 6. `items.json`

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `inventorySlots` | ช่อง | 40 ช่อง (ของที่ stack ได้นับเป็น 1 ช่องต่อ stack) |
| `items[].category` | enum | `currency` / `material` / `consumable` |
| `items[].stackMax` | ชิ้น | จำนวนสูงสุดต่อ 1 ช่อง |
| `items[].sellPrice` / `buyPrice` | เงิน | `buyPrice: 0` = ไม่มีขายในร้าน |
| `items[].occupiesInventorySlot` | bool | `mat_silver_coin` = false |
| `items[].use.flatAmount` | ค่าดิบ | ส่วนคงที่ |
| `items[].use.percentOfMaxAmount` | % | ส่วนที่คิดจาก maxHP/maxMP → `flat + floor(max * pct/100)` |
| `items[].use.cooldownTicks` | ticks | **cooldown แยกต่อ item type** (ดู `potion.cooldownIsPerItemType`) |
| `items[].use.refuseWhenFull` | bool | true → ไม่ consume ไม่ติด cooldown |
| `equipment[].attackBonus` / `defenseBonus` | ค่าดิบ | ที่ refine 0 |
| `equipment[].refineStep` | ค่าดิบ | ATK/DEF เพิ่มต่อ 1 ขั้นตีบวก → `effective = bonus + refineStep * refineLevel` |
| `equipment[].refineMax` | ขั้น | 10 (Phase 3 ถึงจะตีบวกได้จริง) |
| `wep_jade_ink_sword` | — | **`_note: REFERENCE_ONLY_FOR_UNIT_TEST`** ใช้ตรวจ ATK 205 · ยังไม่ต้องวางในเกม |

---

## 7. `movement.json` *(Phase 1)*

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `yAxisPositiveDirection` | — | **`down`** — y เพิ่มคือลงล่าง ตรงกับ Phaser |
| `player.snappyReverse` | bool | flag ให้ลอง 2 แบบ (ดู `01-movement-world.md §2.2`) |
| `player.oppositeKeysCancelToZero` | bool | **true** — A+D = หยุด ไม่ใช่ last-input-wins |
| `player.diagonalComponent` | — | `0.70710678` = 1/√2 **hardcode ไว้** ไม่ต้องคำนวณ sqrt ทุก tick |
| `directions.indexOrder[]` | — | **ล็อกลำดับนี้** = row index ใน sprite sheet ของพอร์น |
| `directions.lookupTable.values[]` | — | `key = (rawX+1)*3 + (rawY+1)` → index ทิศ · `-1` = ไม่มี input คงทิศเดิม |
| `animation.walk.fps` | เฟรม/วินาที | **10 คงที่** ไม่ผูก frame rate จริง |
| `animation.walk.slowFpsBelowSpeedFraction` | fraction | ถ้า `|vel| < 0.4 * walkSpeed` เล่นที่ `slowFps` แทน |
| `animation.statePriority[]` | — | เช็คจากซ้ายไปขวา เจอข้อแรกที่เงื่อนไขจริงให้ใช้ข้อนั้น |
| `collision.resolutionMode` | — | `per_axis_x_then_y` → ได้ wall sliding |
| `collision.subStepTriggerPx` | px | ถ้า movement ต่อ tick เกิน 16 px ให้แบ่ง sub-step ทีละ 8 px (กัน tunneling ตอน knockback) |
| `collision.playerVsMonsterSolid` | bool | **false** — เดินทะลุกันได้ กัน body block |
| `depthSorting.expression` | — | `round(pivotY * 10) + layerBias + tieBreak` |
| `occlusion.ownedBy` | — | **`render_layer_only`** Sim ไม่รู้จักเรื่องนี้เลย |
| `camera.smoothingExpression` | — | exponential smoothing **ห้ามใช้ lerp คงที่** (ผลเปลี่ยนตาม FPS) |

---

## 8. `world-props.json` *(Phase 1)*

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `pivotRule` | — | `bottom_center_of_sprite` — ทุก offset อ้างจากจุดนี้ |
| `props[].visualWidthPx/HeightPx` | px | ขนาดภาพ — **ไม่ใช่** ขนาด collider |
| `props[].colliders[]` | px | array เพราะ `gate_town` มี 2 กล่อง · กล่องเดียวก็ยังเป็น array |
| `props[].colliders[].offsetYPx` | px | **ติดลบเสมอ** (กล่องอยู่เหนือ pivot) |
| `props[].fadeable` | bool | false = ไม่จาง (ของเตี้ยที่บังไม่มิด) |
| `props[].occlusionRect` | px \| null | กรอบส่วนที่ลอยเหนือฐาน ใช้ตรวจว่าบังผู้เล่นไหม · `null` ถ้า `fadeable: false` |
| `props[].tileable` | bool | ต่อแนวติดกันได้ไม่มีรอยรั่ว (collider กว้างเต็ม 64 px) |
| `props[].interactRadiusPx` | px | ระยะกด `E` ได้ (วัดจาก pivot ถึง pivot) |
| `props[].isRespawnPoint` | bool | `shrine` = จุดเกิดใหม่ของผู้เล่น |
| `props[].lightRadiusPx` | px | cosmetic ล้วน (Phase 3 ถ้าทำ lighting) |

---

## 9. `maps.json` *(Phase 1)*

| ฟิลด์ | หน่วย | ความหมาย |
|---|---|---|
| `tileCenterOffsetPx` | px | 32 — `worldPx = tileIndex * 64 + 32` |
| `maps[].widthTiles` / `heightTiles` | tile | ขนาดแมพ |
| `maps[].widthPx` / `heightPx` | px | = tiles × 64 (ใส่ซ้ำไว้ให้ไม่ต้องคูณ) |
| `maps[].borderBlockedTiles` | tile | ขอบที่ blocked ทุกด้าน = 2 tile |
| `maps[].entryPoints[].facing` | index 0–7 | ทิศที่หันตอนโผล่ (ตาม `directions.indexOrder`) |
| `maps[].zones[].tileX1..tileY2` | tile | inclusive ทั้งสี่ค่า |
| `monsterSpawnZones[].radiusTiles` | tile | รัศมีวงกลมจากจุดกลาง |
| `monsterSpawnZones[].count` | ตัว | จำนวนที่คงอยู่ในโซนนั้น |
| `totalMonsterCap` | ตัว | 24 = ผลรวม count ทุกโซน |
| `despawnAllOnMapExit` | bool | true (ดู `_despawnTradeoffNote`) |
| `transitions[].triggerWidthPx/HeightPx` | px | AABB กลางที่ `triggerCenterTileX/Y` |
| `transitions[].fadeOutMs` / `fadeInMs` | ms | cosmetic |

---

## 10. สิ่งที่นัทต้องแก้ใน `src/data/types/defs.ts`

สรุปรายการเดียว (ภูมิไม่แตะ `src/` เอง):

| type | ต้องทำอะไร |
|---|---|
| `MonsterDef` | ขยายให้ครบตาม `monsters.json` · `attackPower` → `atk` · `moveSpeed` → `movement.speed{Patrol,Chase,Charge}PxPerSec` · เพิ่ม `def, mdef, hit, flee, critRatePercent, critDamageMultiplier, collisionBox, hurtbox, ranges, attacks[], stagger, ai, death, respawn` |
| `DropEntry` | `weight: number` → **`chancePercent: number`** + เพิ่ม `index, isCurrency, affectedByLuk, bypassesInventory` |
| `ExpCurve` | เพิ่ม `expToNextByLevel: number[]`, `levelCap: number` |
| `ItemDef` | เพิ่ม `category, buyPrice, occupiesInventorySlot, use?` |
| `EquipmentDef` | เพิ่ม `refineStep, refineMax, sellPrice, buyPrice, isStartingGear` |
| `SkillDef` | ยังไม่ใช้ใน Phase 2 (basic attack ไม่ใช่ skill) — ปล่อยไว้ได้ |
| `ShopDef` / `UpgradeDef` | Phase 3 — ปล่อยเป็น placeholder ต่อ |
| **ใหม่** | `PlayerStatsConfig`, `CombatFormulasConfig`, `MovementConfig`, `PropDef`, `MapDef` |
| `GameDataBundle` | เพิ่ม `playerStats, combatFormulas, movement, props, maps` |

**ลบ `_note: 'PLACEHOLDER_AWAITING_DESIGN'`** ได้ทุกตัวที่ไฟล์ของภูมิครอบแล้ว
ยกเว้น `shops` / `upgrades` / `skills` ที่ยังเป็น Phase 3 จริง ๆ

### Validator ที่ควรเพิ่ม (`src/data/validator.ts`)
1. `cumulativeExpByLevel` สอดคล้องกับ `expToNextByLevel` (invariant §1)
2. `referenceBuildCheck` ทุกค่าตรงกับผลจากสูตร → **fail build ถ้าไม่ตรง**
3. `dropTables[].entries[].index` เรียงต่อเนื่องจาก 0 ไม่มีซ้ำไม่มีข้าม
4. `itemId` ทุกตัวใน drop table มีอยู่ใน `items.json`
5. `monsterId` ทุกตัวใน `maps.json` มีอยู่ใน `monsters.json`
6. `totalMonsterCap` === ผลรวม `monsterSpawnZones[].count`
7. `maps[].widthPx` === `widthTiles * 64`
8. ทุก prop ที่ `fadeable: true` ต้องมี `occlusionRect !== null` และกลับกัน
9. `collider.offsetYPx` ต้อง ≤ 0 ทุกตัว (กันพิมพ์เครื่องหมายผิด)
10. `expToNextByLevel[L-1]` ตรงกับ `floor(25*L*(L+3) * numerator / 100)` ทั้ง 49 ค่า (**integer math**)
