# 📋 TODO Assignments — E-commerce Basic (Model Set 5)

> **โปรเจกต์**: ระบบ E-commerce Backend API  
> **สถาปัตยกรรม**: NestJS + Repository Pattern + JSON Storage  
> **วันที่สร้าง**: 24 กุมภาพันธ์ 2026

---

## 🏗️ สถาปัตยกรรมภาพรวม

```
            HTTP Request
                │
                ▼
        ┌──────────────┐
        │  Controller   │  ← รับ request, ส่ง response
        └──────┬───────┘
               │  เรียก method
               ▼
        ┌──────────────┐
        │   Service     │  ← Business Logic (สมองของระบบ)
        └──────┬───────┘
               │  เรียก CRUD
               ▼
        ┌──────────────┐
        │  Repository   │  ← จัดการข้อมูล (อ่าน/เขียน JSON)
        └──────┬───────┘
               │
               ▼
          📄 JSON File
```

---

## 🔗 ลำดับการทำงาน (Dependency Chain)

```
bouquetofroses (Repository) ─→ Lukazx15 (Products) ─→ pockypycok (Orders)
        ▲                            ▲                        ▲
   ทำก่อน!                     ทำเป็นลำดับ 2            ทำเป็นลำดับ 3
  (ทุกคนต้องใช้)          (Orders ต้องใช้ Products)
```

> ⚠️ **สำคัญ**: `bouquetofroses` ต้องทำเสร็จก่อน เพราะ Repository เป็นพื้นฐานที่ทุกคนต้องใช้  
> `Lukazx15` ต้องทำ Products เสร็จก่อน `pockypycok` จะเริ่ม Orders ได้ (เพราะ Orders เรียกใช้ ProductsService)

---

## 📊 สรุปจำนวน TODO ต่อคน

| นักเรียน | GitHub Username | ไฟล์ที่ต้องแก้ | จำนวน TODO | ความยาก |
|----------|----------------|----------------|-----------|---------|
| นภัทร์ | `bouquetofroses` | `json-file.repository.ts` | 4 TODOs | ⭐⭐ ปานกลาง |
| ณัฐนันท์ | `Lukazx15` | `products.service.ts` | 6 TODOs | ⭐⭐ ปานกลาง |
| ณัชชา | `pockypycok` | `orders.service.ts` | 4 TODOs | ⭐⭐⭐ ยาก |

---

## 🧪 วิธีทดสอบ

```bash
# รันทุกเทส
npm run test:e2e

# รันเฉพาะ Products tests
npx jest --config test/jest-e2e.json --testPathPattern="products" --forceExit

# รันเฉพาะ Orders tests
npx jest --config test/jest-e2e.json --testPathPattern="orders" --forceExit

# เปิด Swagger UI (ทดสอบผ่านหน้าเว็บ)
npm run start:dev
# แล้วเปิด http://localhost:3000/api
```

---

---

# 👤 bouquetofroses (นภัทร์) — Core Infrastructure

## 📁 ไฟล์ที่ต้องแก้: `src/common/repositories/json-file.repository.ts`

### บทบาท
คุณรับผิดชอบ **Repository Layer** — "ชั้นจัดเก็บข้อมูล" ของระบบทั้งหมด  
ทุก method ที่คุณเขียนจะถูกใช้โดยทั้ง ProductsService (ของ Lukazx15) และ OrdersService (ของ pockypycok)

### ✅ ตัวอย่างที่ทำเสร็จแล้ว (ศึกษาเป็นแนวทาง)
- `loadFromFile()` — อ่านไฟล์ JSON จาก disk เข้า memory
- `ensureLoaded()` — Lazy Loading: โหลดเมื่อต้องใช้ครั้งแรก
- `findAll()` — ดึงข้อมูลทั้งหมด (return สำเนาด้วย spread operator `[...this.data]`)
- `update()` — แก้ไขข้อมูลด้วย `findIndex()` + แทนที่ + `saveToFile()`

---

### 📌 TODO B03 — `saveToFile()` (บรรทัดที่ ~119)

**Concept ที่ใช้**: Atomic Write Strategy (การเขียนไฟล์แบบปลอดภัย)

**ปัญหาที่แก้**: ถ้าเขียนไฟล์ตรงๆ แล้วเครื่องดับกลางทาง → ไฟล์เสียหาย ข้อมูลหายหมด!

**วิธีแก้**: เขียนลงไฟล์ชั่วคราว (.tmp) ก่อน แล้วค่อย rename ทับไฟล์จริง (rename เป็น atomic operation ของ OS)

**ขั้นตอน**:
```typescript
private async saveToFile(): Promise<void> {
  // 1. สร้างชื่อไฟล์ชั่วคราว
  const tmpPath = this.filePath + '.tmp';

  // 2. แปลง this.data เป็น JSON string (pretty-print ด้วย 2 spaces)
  const jsonString = JSON.stringify(this.data, null, 2);

  // 3. เขียน JSON string ลงไฟล์ชั่วคราว
  await writeFile(tmpPath, jsonString, 'utf-8');

  // 4. เปลี่ยนชื่อไฟล์ชั่วคราวเป็นไฟล์จริง (atomic!)
  await rename(tmpPath, this.filePath);
}
```

**Functions ที่ต้องใช้** (import ไว้ให้แล้วด้านบนของไฟล์):
- `writeFile(path, content, encoding)` — เขียนไฟล์
- `rename(oldPath, newPath)` — เปลี่ยนชื่อไฟล์

**สิ่งที่ต้องลบ**: `throw new Error('TODO [bouquetofroses-03]: ...')` ← ลบบรรทัดนี้ แล้วแทนที่ด้วยโค้ดของคุณ

---

### 📌 TODO B04 — `findById(id)` (บรรทัดที่ ~155)

**Concept ที่ใช้**: `Array.find()` + Nullish Coalescing (`??`)

**ขั้นตอน**:
```typescript
async findById(id: string): Promise<T | null> {
  // 1. ต้อง ensure ว่าข้อมูลถูกโหลดจากไฟล์แล้ว
  await this.ensureLoaded();

  // 2. ค้นหาข้อมูลที่มี id ตรงกัน
  //    find() คืนค่า element แรกที่เงื่อนไขเป็น true
  //    ถ้าไม่เจอ คืน undefined
  //    ?? null แปลง undefined → null (เพื่อให้ type ถูกต้อง)
  return this.data.find(item => item.id === id) ?? null;
}
```

**ฟังก์ชันที่ต้องรู้**:
| ฟังก์ชัน | ทำอะไร | ตัวอย่าง |
|----------|--------|---------|
| `Array.find()` | หาตัวแรกที่ตรงเงื่อนไข | `[1,2,3].find(x => x === 2)` → `2` |
| `??` | ถ้าค่าซ้ายเป็น null/undefined ใช้ค่าขวา | `undefined ?? null` → `null` |

---

### 📌 TODO B05 — `create(entity)` (บรรทัดที่ ~176)

**Concept ที่ใช้**: `Array.push()` + Persistence (บันทึกลงไฟล์)

**ขั้นตอน**:
```typescript
async create(entity: T): Promise<T> {
  // 1. โหลดข้อมูลก่อน (ถ้ายังไม่ได้โหลด)
  await this.ensureLoaded();

  // 2. เพิ่ม entity ใหม่เข้า array ใน memory
  this.data.push(entity);

  // 3. บันทึกลงไฟล์ (เรียก saveToFile ที่คุณเขียนใน B03)
  await this.saveToFile();

  // 4. คืนค่า entity ที่เพิ่มไป
  return entity;
}
```

> ⚠️ ต้องทำ B03 (saveToFile) ให้เสร็จก่อน! เพราะ create() เรียกใช้ saveToFile()

---

### 📌 TODO B06 — `delete(id)` (บรรทัดที่ ~220)

**Concept ที่ใช้**: `Array.findIndex()` + `Array.splice()`

**ขั้นตอน**:
```typescript
async delete(id: string): Promise<T | null> {
  // 1. โหลดข้อมูลก่อน
  await this.ensureLoaded();

  // 2. หาตำแหน่ง (index) ของข้อมูลด้วย id
  const index = this.data.findIndex(item => item.id === id);

  // 3. ถ้าไม่เจอ (index === -1) → คืน null
  if (index === -1) {
    return null;
  }

  // 4. เก็บข้อมูลที่จะลบไว้ก่อน (เพื่อ return กลับไป)
  const deleted = this.data[index];

  // 5. ลบออกจากอาร์เรย์
  //    splice(ตำแหน่ง, จำนวนที่จะลบ) → ลบ 1 ตัวที่ตำแหน่ง index
  this.data.splice(index, 1);

  // 6. บันทึกลงไฟล์
  await this.saveToFile();

  // 7. คืนค่าข้อมูลที่ลบไป
  return deleted;
}
```

**ฟังก์ชันที่ต้องรู้**:
| ฟังก์ชัน | ทำอะไร | ตัวอย่าง |
|----------|--------|---------|
| `findIndex()` | หาตำแหน่งตัวแรกที่ตรงเงื่อนไข | `['a','b','c'].findIndex(x => x === 'b')` → `1` |
| `splice(i, n)` | ลบ n ตัวที่ตำแหน่ง i | `arr.splice(1, 1)` → ลบ 1 ตัวที่ index 1 |

**ดู `update()` เป็นตัวอย่าง** — ใช้ `findIndex()` เหมือนกัน!

---

### ✅ Checklist (bouquetofroses)
- [ ] B03: `saveToFile()` — เขียนไฟล์แบบ atomic (tmp → rename)
- [ ] B04: `findById()` — ค้นหาด้วย `find()` + `?? null`
- [ ] B05: `create()` — push + `saveToFile()`
- [ ] B06: `delete()` — `findIndex()` + `splice()` + `saveToFile()`
- [ ] รันเทส: `npx jest --config test/jest-e2e.json --testPathPattern="products" --forceExit` ← ถ้า 35/35 all pass = สำเร็จ!

---

---

# 👤 Lukazx15 (ณัฐนันท์) — Product Domain

## 📁 ไฟล์ที่ต้องแก้: `src/products/products.service.ts`

### บทบาท
คุณรับผิดชอบ **Product Business Logic** — ตรรกะทางธุรกิจของสินค้าทั้งหมด  
Service คือ "เชฟ" ที่ประมวลผลข้อมูลก่อนส่งกลับให้ Controller

### ✅ ตัวอย่างที่ทำเสร็จแล้ว (ศึกษาเป็นแนวทาง)
- `findAll()` — เรียก `this.productsRepository.findAll()` ตรงๆ
- `findOne(id)` — เรียก `findById()` + throw `NotFoundException` ถ้าไม่เจอ (Guard Clause Pattern)

### ⚙️ สิ่งที่ import ให้แล้ว (ใช้ได้เลย ไม่ต้อง import เพิ่ม)
- `uuidv4()` — สร้าง UUID ใหม่
- `NotFoundException` — throw เมื่อหาข้อมูลไม่เจอ (→ HTTP 404)
- `BadRequestException` — throw เมื่อข้อมูลไม่ถูกต้อง (→ HTTP 400)
- `ProductStatus` — enum ค่า `.ACTIVE`, `.OUT_OF_STOCK`, `.DISCONTINUED`
- DTO types: `CreateProductDto`, `UpdateProductDto`, `PatchProductDto`

---

### 📌 TODO L03 — `create(dto)` (บรรทัดที่ ~83)

**Concept ที่ใช้**: Object Creation + Unique Constraint (SKU ห้ามซ้ำ)

**ขั้นตอน**:
```typescript
async create(dto: CreateProductDto): Promise<Product> {
  // ── ขั้นที่ 1: ตรวจสอบ SKU ซ้ำ ──
  const allProducts = await this.findAll();
  if (allProducts.some(p => p.sku === dto.sku)) {
    throw new BadRequestException('SKU already exists');
  }

  // ── ขั้นที่ 2: สร้าง Product object ใหม่ ──
  const now = new Date().toISOString();
  const product: Product = {
    id: uuidv4(),                               // สร้าง UUID ใหม่
    name: dto.name,
    description: dto.description,
    price: dto.price,
    stockQuantity: dto.stockQuantity,
    sku: dto.sku,
    category: dto.category,
    brand: dto.brand,
    images: dto.images,
    weight: dto.weight ?? null,                  // ถ้าไม่มี → null
    status: dto.status ?? ProductStatus.ACTIVE,  // ค่าเริ่มต้น ACTIVE
    createdAt: now,
    updatedAt: now,
  };

  // ── ขั้นที่ 3: บันทึกผ่าน Repository ──
  return this.productsRepository.create(product);
}
```

**สิ่งสำคัญ**:
- `dto.weight ?? null` → ถ้า weight ไม่ได้ส่งมา (undefined) จะกลายเป็น null
- `dto.status ?? ProductStatus.ACTIVE` → ถ้า status ไม่ได้ส่งมา จะเป็น ACTIVE อัตโนมัติ
- `uuidv4()` → สร้าง UUID แบบสุ่ม เช่น `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`

---

### 📌 TODO L04 — `update(id, dto)` (บรรทัดที่ ~126)

**Concept ที่ใช้**: Full Replacement (PUT) — แทนที่ข้อมูลทั้งหมด

**ขั้นตอน**:
```typescript
async update(id: string, dto: UpdateProductDto): Promise<Product> {
  // ── ขั้นที่ 1: หา product เดิม ──
  // findOne() จะ throw NotFoundException อัตโนมัติถ้าไม่เจอ
  const existing = await this.findOne(id);

  // ── ขั้นที่ 2: ตรวจสอบ SKU ซ้ำ (เฉพาะกรณี SKU เปลี่ยน) ──
  if (dto.sku !== existing.sku) {
    const all = await this.findAll();
    if (all.some(p => p.sku === dto.sku)) {
      throw new BadRequestException('SKU already exists');
    }
  }

  // ── ขั้นที่ 3: สร้าง Product ใหม่ (เก็บ id และ createdAt เดิม) ──
  const updated: Product = {
    ...existing,                                // ค่าเดิมทั้งหมด
    name: dto.name,                             // แทนที่ด้วยค่าใหม่
    description: dto.description,
    price: dto.price,
    stockQuantity: dto.stockQuantity,
    sku: dto.sku,
    category: dto.category,
    brand: dto.brand,
    images: dto.images,
    weight: dto.weight ?? null,
    status: dto.status,
    updatedAt: new Date().toISOString(),         // อัปเดตเวลาแก้ไข
  };

  // ── ขั้นที่ 4: บันทึก ──
  const result = await this.productsRepository.update(id, updated);
  if (!result) {
    throw new NotFoundException(`Product with id '${id}' not found`);
  }
  return result;
}
```

**ความแตกต่าง PUT vs PATCH**:
| PUT (update) | PATCH (patch) |
|-------------|---------------|
| ต้องส่งข้อมูล **ทุก field** | ส่งเฉพาะ field ที่ต้องการแก้ |
| แทนที่ทั้งหมด | merge เฉพาะที่ส่งมา |

---

### 📌 TODO L05 — `patch(id, dto)` (บรรทัดที่ ~170)

**Concept ที่ใช้**: Partial Update (PATCH) + Spread Operator

**ขั้นตอน**:
```typescript
async patch(id: string, dto: PatchProductDto): Promise<Product> {
  // ── ขั้นที่ 1: หา product เดิม ──
  const existing = await this.findOne(id);

  // ── ขั้นที่ 2: ตรวจสอบ SKU ซ้ำ (ถ้า dto.sku ถูกส่งมา) ──
  if (dto.sku !== undefined && dto.sku !== existing.sku) {
    const all = await this.findAll();
    if (all.some(p => p.sku === dto.sku)) {
      throw new BadRequestException('SKU already exists');
    }
  }

  // ── ขั้นที่ 3: Merge ด้วย Spread Operator ──
  const patched: Product = {
    ...existing,       // ← ค่าเดิมทั้งหมดก่อน
    ...dto,            // ← แทนที่เฉพาะ field ที่ส่งมา
    updatedAt: new Date().toISOString(),
  };

  // ── ขั้นที่ 4: บันทึก ──
  const result = await this.productsRepository.update(id, patched);
  if (!result) {
    throw new NotFoundException(`Product with id '${id}' not found`);
  }
  return result;
}
```

**Spread Operator `...` ทำงานยังไง?**
```
existing = { name: 'iPhone', price: 100, brand: 'Apple' }
dto      = { price: 200 }

{ ...existing, ...dto }
= { name: 'iPhone', price: 200, brand: 'Apple' }
              ↑ ถูกแทนที่!      ↑ เหมือนเดิม
```

---

### 📌 TODO L06 — `remove(id)` (บรรทัดที่ ~205)

**Concept ที่ใช้**: Delete with Existence Check

**ขั้นตอน**:
```typescript
async remove(id: string): Promise<Product> {
  // 1. ตรวจสอบว่า product มีอยู่จริง (throw 404 ถ้าไม่เจอ)
  await this.findOne(id);

  // 2. ลบจาก repository
  const deleted = await this.productsRepository.delete(id);
  if (!deleted) {
    throw new NotFoundException(`Product with id '${id}' not found`);
  }

  return deleted;
}
```

---

### 📌 TODO L07 — `deductStock(productId, quantity)` (บรรทัดที่ ~224)

**Concept ที่ใช้**: Stock Mutation + Status Transition

**ใครจะเรียก method นี้?** → `pockypycok` จะเรียกจาก `OrdersService.create()` ทุกครั้งที่มีออเดอร์ใหม่

**ขั้นตอน**:
```typescript
async deductStock(productId: string, quantity: number): Promise<Product> {
  // 1. หาสินค้า
  const product = await this.findOne(productId);

  // 2. ลดจำนวนสต็อก
  product.stockQuantity -= quantity;

  // 3. ถ้าสต็อกหมด → เปลี่ยนสถานะเป็น OUT_OF_STOCK
  if (product.stockQuantity === 0) {
    product.status = ProductStatus.OUT_OF_STOCK;
  }

  // 4. อัปเดตเวลาแก้ไข
  product.updatedAt = new Date().toISOString();

  // 5. บันทึก
  await this.productsRepository.update(productId, product);

  return product;
}
```

**ตัวอย่างสถานการณ์**:
```
สินค้า A มี stock = 5
ลูกค้าสั่ง 3 → deductStock('A', 3) → stock = 2, status = ACTIVE
ลูกค้าสั่ง 2 → deductStock('A', 2) → stock = 0, status = OUT_OF_STOCK ✅
```

---

### 📌 TODO L08 — `restoreStock(productId, quantity)` (บรรทัดที่ ~260)

**Concept ที่ใช้**: Reverse Mutation (คืนสต็อกกลับ)

**ใครจะเรียก method นี้?** → `pockypycok` จะเรียกเมื่อยกเลิกหรือลบออเดอร์

**ขั้นตอน**:
```typescript
async restoreStock(productId: string, quantity: number): Promise<Product> {
  // 1. หาสินค้า
  const product = await this.findOne(productId);

  // 2. เพิ่มสต็อกกลับ
  product.stockQuantity += quantity;

  // 3. ถ้าเคย OUT_OF_STOCK แต่ตอนนี้มีสต็อกแล้ว → เปลี่ยนกลับเป็น ACTIVE
  if (product.status === ProductStatus.OUT_OF_STOCK && product.stockQuantity > 0) {
    product.status = ProductStatus.ACTIVE;
  }

  // 4. อัปเดตเวลาแก้ไข
  product.updatedAt = new Date().toISOString();

  // 5. บันทึก
  await this.productsRepository.update(productId, product);

  return product;
}
```

---

### ✅ Checklist (Lukazx15)
- [ ] L03: `create()` — สร้าง product ใหม่ (ตรวจ SKU ซ้ำ + UUID + default values)
- [ ] L04: `update()` — PUT แทนที่ทั้งหมด (ตรวจ SKU ซ้ำถ้า SKU เปลี่ยน)
- [ ] L05: `patch()` — PATCH แก้ไขบางส่วน (Spread Operator)
- [ ] L06: `remove()` — DELETE ลบสินค้า
- [ ] L07: `deductStock()` — ตัดสต็อก (เปลี่ยน status ถ้าสต็อกหมด)
- [ ] L08: `restoreStock()` — คืนสต็อก (เปลี่ยน status กลับ ACTIVE)
- [ ] รันเทส: `npx jest --config test/jest-e2e.json --testPathPattern="products" --forceExit` ← ถ้า 35/35 all pass = สำเร็จ!

---

---

# 👤 pockypycok (ณัชชา) — Order Domain

## 📁 ไฟล์ที่ต้องแก้: `src/orders/orders.service.ts`

### บทบาท
คุณรับผิดชอบ **Order Business Logic** — ตรรกะทางธุรกิจของคำสั่งซื้อ  
นี่คือส่วนที่ซับซ้อนที่สุดในระบบ เพราะเกี่ยวข้องกับ:
- **Cross-Service Dependency** — ต้องเรียกใช้ `ProductsService` (ของ Lukazx15)
- **State Machine** — สถานะออเดอร์เปลี่ยนได้เฉพาะตามเส้นทางที่กำหนด
- **Stock Management** — ตัดสต็อก/คืนสต็อกอัตโนมัติ

### ✅ ตัวอย่างที่ทำเสร็จแล้ว
- `findAll()` — ดึงออเดอร์ทั้งหมด
- `findOne(id)` — ดึงออเดอร์ตาม ID + throw NotFoundException ถ้าไม่เจอ

### ⚙️ สิ่งที่ import ให้แล้ว (ใช้ได้เลย)
- `uuidv4()` — สร้าง UUID
- `NotFoundException`, `BadRequestException`
- `OrderStatus` — enum: `.PENDING`, `.PAID`, `.SHIPPED`, `.COMPLETED`, `.CANCELLED`
- `VALID_ORDER_TRANSITIONS` — Record ที่บอกว่าสถานะไหนเปลี่ยนไปสถานะไหนได้
- `ProductStatus` — ใช้ตรวจสอบสินค้าพร้อมขาย (`.ACTIVE`)
- `this.productsService` — เรียกใช้ `findOne()`, `deductStock()`, `restoreStock()` ของ Products

### 📘 State Machine (แผนที่สถานะ)

```
📦 PENDING ──→ 💳 PAID ──→ 🚚 SHIPPED ──→ ✅ COMPLETED
     │              │
     ▼              ▼
 ❌ CANCELLED   ❌ CANCELLED

กฎ:
  PENDING   → [PAID, CANCELLED]
  PAID      → [SHIPPED, CANCELLED]
  SHIPPED   → [COMPLETED]           ← ยกเลิกไม่ได้แล้ว!
  COMPLETED → []                    ← จบ ห้ามเปลี่ยน
  CANCELLED → []                    ← จบ ห้ามเปลี่ยน
```

---

### 📌 TODO P03 — `create(dto)` (บรรทัดที่ ~84)

**Concept ที่ใช้**: Cross-service Composition + Price Snapshot + Stock Deduction

**⚠️ นี่คือ method ที่ซับซ้อนที่สุดในระบบทั้งหมด — ค่อยๆ ทำทีละขั้น!**

**ขั้นตอน**:
```typescript
async create(dto: CreateOrderDto): Promise<Order> {
  // ═══════════════════════════════════════════════════════
  // ขั้นที่ 1: ตรวจสอบสินค้า + สร้างรายการ (OrderItem[])
  // ═══════════════════════════════════════════════════════
  const orderItems: OrderItem[] = [];
  let totalAmount = 0;

  for (const item of dto.items) {
    // 1a. หาสินค้า (ต้อง try-catch เพราะ findOne throw 404 แต่เราต้องการ 400)
    let product;
    try {
      product = await this.productsService.findOne(item.productId);
    } catch {
      throw new BadRequestException(`Product '${item.productId}' not found`);
    }

    // 1b. ตรวจสอบว่าสินค้าพร้อมขาย (ACTIVE)
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `Product '${product.name}' is not available (${product.status})`,
      );
    }

    // 1c. ตรวจสอบสต็อกเพียงพอ
    if (product.stockQuantity < item.quantity) {
      throw new BadRequestException(
        `Insufficient stock for '${product.name}'`,
      );
    }

    // 1d. สร้าง OrderItem (เก็บ "Price Snapshot" ณ เวลาที่สั่ง)
    const subtotal = product.price * item.quantity;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      priceAtPurchase: product.price,   // ← ราคา ณ ตอนสั่ง (ไม่เปลี่ยนแม้ราคาสินค้าจะเปลี่ยนทีหลัง)
      quantity: item.quantity,
      subtotal: subtotal,
    });
    totalAmount += subtotal;
  }

  // ═══════════════════════════════════════════════════════
  // ขั้นที่ 2: ตัดสต็อกสินค้า (เรียก ProductsService)
  // ═══════════════════════════════════════════════════════
  for (const item of dto.items) {
    await this.productsService.deductStock(item.productId, item.quantity);
  }

  // ═══════════════════════════════════════════════════════
  // ขั้นที่ 3: สร้าง Order Object
  // ═══════════════════════════════════════════════════════
  const now = new Date().toISOString();
  const order: Order = {
    id: uuidv4(),
    customerId: dto.customerId,
    items: orderItems,
    totalAmount: totalAmount,
    status: OrderStatus.PENDING,         // ← ออเดอร์ใหม่เริ่มต้นที่ PENDING เสมอ
    paymentMethod: dto.paymentMethod,
    shippingAddress: dto.shippingAddress,
    trackingNumber: null,                // ← ยังไม่มีเลขพัสดุ
    note: dto.note ?? null,
    placedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // ═══════════════════════════════════════════════════════
  // ขั้นที่ 4: บันทึกและ return
  // ═══════════════════════════════════════════════════════
  return this.ordersRepository.create(order);
}
```

**💡 Price Snapshot คืออะไร?**
- เก็บราคาสินค้า **ณ ตอนที่สั่ง** ไว้ใน `priceAtPurchase`
- แม้ว่าราคาสินค้าจะเปลี่ยนทีหลัง ออเดอร์เก่ายังคงแสดงราคาเดิม
- เหมือนใบเสร็จที่แสดงราคา ณ วันที่ซื้อ

---

### 📌 TODO P04 — `patch(id, dto)` (บรรทัดที่ ~153)

**Concept ที่ใช้**: State Machine + Guard Clauses + Cancel Logic

**ขั้นตอน**:
```typescript
async patch(id: string, dto: PatchOrderDto): Promise<Order> {
  // ── ขั้นที่ 1: หาออเดอร์เดิม ──
  const existing = await this.findOne(id);

  // ── ขั้นที่ 2: ตรวจสอบ Terminal State ──
  // ⚠️ ถ้าออเดอร์เป็น COMPLETED หรือ CANCELLED → ห้ามแก้ไขอะไรทั้งนั้น!
  if (
    existing.status === OrderStatus.COMPLETED ||
    existing.status === OrderStatus.CANCELLED
  ) {
    throw new BadRequestException(
      `Cannot update a ${existing.status} order`,
    );
  }

  // ── ขั้นที่ 3: ตรวจสอบ State Transition (ถ้ามีการเปลี่ยนสถานะ) ──
  if (dto.status) {
    const allowedNextStates = VALID_ORDER_TRANSITIONS[existing.status];
    if (!allowedNextStates.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${dto.status}`,
      );
    }

    // ── ขั้นที่ 3b: คืนสต็อกถ้ายกเลิก ──
    if (dto.status === OrderStatus.CANCELLED) {
      await this.restoreOrderStock(existing);
    }
  }

  // ── ขั้นที่ 4: อัปเดตข้อมูล (Spread Merge) ──
  const updated: Order = {
    ...existing,
    ...dto,
    updatedAt: new Date().toISOString(),
  };

  // ── ขั้นที่ 5: บันทึก ──
  const result = await this.ordersRepository.update(id, updated);
  if (!result) {
    throw new NotFoundException(`Order with id '${id}' not found`);
  }
  return result;
}
```

**ตัวอย่างสถานการณ์**:
| สถานะเดิม | patch status เป็น | ผลลัพธ์ |
|-----------|------------------|---------|
| PENDING | PAID | ✅ สำเร็จ |
| PENDING | CANCELLED | ✅ สำเร็จ + คืนสต็อก |
| PAID | SHIPPED | ✅ สำเร็จ |
| PAID | CANCELLED | ✅ สำเร็จ + คืนสต็อก |
| SHIPPED | COMPLETED | ✅ สำเร็จ |
| SHIPPED | CANCELLED | ❌ BadRequest (ส่งของไปแล้ว!) |
| COMPLETED | อะไรก็ตาม | ❌ BadRequest (Terminal State) |
| CANCELLED | อะไรก็ตาม | ❌ BadRequest (Terminal State) |

---

### 📌 TODO P05 — `remove(id)` (บรรทัดที่ ~212)

**Concept ที่ใช้**: Delete with Side Effects (ลบแล้วต้องคืนสต็อกด้วย)

**ขั้นตอน**:
```typescript
async remove(id: string): Promise<Order> {
  // 1. หาออเดอร์
  const order = await this.findOne(id);

  // 2. คืนสต็อก (เฉพาะกรณียังไม่ได้ cancel)
  //    → ถ้า cancel ไปแล้ว สต็อกถูกคืนตอน cancel แล้ว ไม่ต้องคืนซ้ำ!
  if (order.status !== OrderStatus.CANCELLED) {
    await this.restoreOrderStock(order);
  }

  // 3. ลบจาก repository
  const deleted = await this.ordersRepository.delete(id);
  if (!deleted) {
    throw new NotFoundException(`Order with id '${id}' not found`);
  }

  return deleted;
}
```

**⚠️ ทำไมต้องเช็ค `status !== CANCELLED`?**
```
ลูกค้าสั่ง iPhone 2 เครื่อง → stock ลดจาก 10 → 8
ลูกค้ากด cancel → stock คืนจาก 8 → 10  (คืนแล้ว!)
Admin ลบออเดอร์ → ❌ ห้ามคืน stock ซ้ำ! (ไม่งั้น stock จะเป็น 12)
```

---

### 📌 TODO P06 — `restoreOrderStock(order)` (บรรทัดที่ ~247)

**Concept ที่ใช้**: Private Helper Method + Loop

**method นี้ถูกเรียกจาก**:
- `patch()` → เมื่อเปลี่ยนสถานะเป็น CANCELLED
- `remove()` → เมื่อลบออเดอร์ที่ยังไม่ได้ cancel

**ขั้นตอน**:
```typescript
private async restoreOrderStock(order: Order): Promise<void> {
  // วนลูปผ่านทุกสินค้าในออเดอร์ แล้วคืนสต็อก
  for (const item of order.items) {
    await this.productsService.restoreStock(item.productId, item.quantity);
  }
}
```

**ตัวอย่าง**: ถ้าออเดอร์มี 3 รายการ:
```
items = [
  { productId: 'A', quantity: 2 },  → restoreStock('A', 2)
  { productId: 'B', quantity: 1 },  → restoreStock('B', 1)
  { productId: 'C', quantity: 5 },  → restoreStock('C', 5)
]
```

---

### ✅ Checklist (pockypycok)
- [ ] P06: `restoreOrderStock()` — private helper คืนสต็อก (ทำอันนี้ก่อนเพราะ P04, P05 เรียกใช้)
- [ ] P03: `create()` — สร้างออเดอร์ (ตรวจสินค้า + ตัดสต็อก + Price Snapshot)
- [ ] P04: `patch()` — อัปเดตสถานะ (State Machine + cancel logic)
- [ ] P05: `remove()` — ลบออเดอร์ + คืนสต็อก
- [ ] รันเทส: `npx jest --config test/jest-e2e.json --testPathPattern="orders" --forceExit` ← ถ้า all pass = สำเร็จ!

---

---

## 📖 Glossary — ศัพท์ OOP ที่ใช้ในโปรเจกต์

| ศัพท์ | ความหมาย | ตัวอย่างในโค้ด |
|-------|----------|---------------|
| **Abstract Class** | คลาสที่ไม่สามารถ `new` ได้โดยตรง ต้องสืบทอดไปใช้ | `BaseEntity` |
| **Inheritance** | การสืบทอดคุณสมบัติจาก parent class | `Product extends BaseEntity` |
| **Encapsulation** | การซ่อนข้อมูลภายใน class (`private`, `protected`) | `private data: T[]` |
| **Generics** | ให้ class/function ทำงานกับ type ใดก็ได้ | `JsonFileRepository<T>` |
| **Dependency Injection** | NestJS สร้างและ "ฉีด" dependency ให้อัตโนมัติ | `constructor(private readonly repo: ProductsRepository)` |
| **Repository Pattern** | แยกชั้นจัดเก็บข้อมูลออกจาก business logic | `JsonFileRepository` ↔ `ProductsService` |
| **Guard Clause** | ตรวจสอบเงื่อนไขผิดปกติก่อน แล้ว throw ทันที | `if (!product) throw new NotFoundException(...)` |
| **State Machine** | สถานะเปลี่ยนได้เฉพาะตามเส้นทางที่กำหนด | `VALID_ORDER_TRANSITIONS` |
| **Atomic Write** | เขียนไฟล์แบบปลอดภัย (tmp → rename) | `saveToFile()` |
| **Spread Operator** | `...obj` คัดลอก/merge object | `{ ...existing, ...dto }` |
| **Nullish Coalescing** | `??` ใช้ค่า default ถ้าเป็น null/undefined | `dto.weight ?? null` |
| **Price Snapshot** | เก็บราคา ณ ตอนสั่ง (ไม่เปลี่ยนตามราคาปัจจุบัน) | `priceAtPurchase: product.price` |
