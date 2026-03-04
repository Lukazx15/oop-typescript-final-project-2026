/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📘 NestJS Concept: Service Layer (ชั้นตรรกะทางธุรกิจ)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Service คือ "สมอง" ของระบบ — ที่ที่ Business Logic ทั้งหมดอยู่
 *
 * เปรียบเสมือนเชฟในครัว:
 *   - Controller = พนักงานเสิร์ฟ (รับออเดอร์จากลูกค้า)
 *   - Service    = เชฟ (ทำอาหาร / ประมวลผลข้อมูล)
 *   - Repository = ตู้เย็น (เก็บวัตถุดิบ / ข้อมูล)
 *
 * 📘 OOP Concept: Dependency Injection (DI)
 * ─────────────────────────────────────────
 * แทนที่ Service จะสร้าง Repository เอง:
 *   ❌ const repo = new ProductsRepository();  // ผูกติดกันแน่น
 *
 * NestJS จะ "ฉีด" Repository เข้ามาให้ผ่าน Constructor:
 *   ✅ constructor(private readonly repo: ProductsRepository) {}
 * → ทำให้ทดสอบง่าย + เปลี่ยน Repository ได้โดยไม่ต้องแก้ Service
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.entity';
import { ProductStatus } from './enums/product-status.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PatchProductDto } from './dto/patch-product.dto';

@Injectable()
export class ProductsService {
  /**
   * 📘 Dependency Injection ผ่าน Constructor
   * NestJS เห็น type "ProductsRepository" → สร้าง instance ให้อัตโนมัติ
   * "private readonly" → ใช้ได้เฉพาะใน class นี้ + แก้ไขค่าไม่ได้
   */
  constructor(private readonly productsRepository: ProductsRepository) {}

  // ═══════════════════════════════════════════════════════════════════
  // 📗 READ OPERATIONS — เมธอดสำหรับอ่านข้อมูล
  // ═══════════════════════════════════════════════════════════════════

  /**
   * ดึงสินค้าทั้งหมด
   * ✅ ตัวอย่างที่ทำเสร็จแล้ว
   */
  async findAll(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }

  /**
   * ดึงสินค้าตาม ID
   * ✅ ตัวอย่างที่ทำเสร็จแล้ว
   *
   * 📘 Concept: Guard Clause (เงื่อนไขป้องกัน)
   * → ตรวจสอบเงื่อนไข "ผิดปกติ" ก่อน แล้ว throw error ทันที
   * → ถ้าผ่านหมด = ข้อมูลถูกต้อง ดำเนินการต่อ
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return product;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📕 WRITE OPERATIONS — เมธอดสำหรับเขียนข้อมูล
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-03]: Implement Create Product
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Object Creation + Unique Constraint
  //
  // 🎯 Steps:
  //   1. ตรวจสอบ SKU ซ้ำ:
  //      - ดึงสินค้าทั้งหมด: const allProducts = await this.findAll();
  //      - ค้นหาว่ามี SKU ซ้ำมั้ย: allProducts.some(p => p.sku === dto.sku)
  //      - ถ้าซ้ำ → throw new BadRequestException('SKU already exists');
  //
  //   2. สร้าง Product object ใหม่:
  //      const now = new Date().toISOString();
  //      const product: Product = {
  //        id: uuidv4(),                        ← สร้าง UUID ใหม่
  //        name: dto.name,                      ← ค่าจาก DTO
  //        description: dto.description,
  //        price: dto.price,
  //        stockQuantity: dto.stockQuantity,
  //        sku: dto.sku,
  //        category: dto.category,
  //        brand: dto.brand,
  //        images: dto.images,
  //        weight: dto.weight ?? null,           ← ถ้าไม่มีให้เป็น null
  //        status: dto.status ?? ProductStatus.ACTIVE,  ← ค่าเริ่มต้น ACTIVE
  //        createdAt: now,
  //        updatedAt: now,
  //      };
  //
  //   3. บันทึกลง Repository:
  //      return this.productsRepository.create(product);
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async create(dto: CreateProductDto): Promise<Product> {
    // ── ขั้นที่ 1: ตรวจสอบว่า SKU ซ้ำกับสินค้าที่มีอยู่แล้วหรือไม่ ──
    const allProducts = await this.findAll();
    if (allProducts.some((p) => p.sku === dto.sku)) {
      throw new BadRequestException('SKU already exists');
    }

    // ── ขั้นที่ 2: สร้าง Product object ใหม่จากข้อมูลที่รับมา ──
    const now = new Date().toISOString();
    const product: Product = {
      id: uuidv4(),                               // สร้าง UUID ใหม่ให้สินค้า
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stockQuantity: dto.stockQuantity,
      sku: dto.sku,
      category: dto.category,
      brand: dto.brand,
      images: dto.images,
      weight: dto.weight ?? null,                  // ถ้าไม่ส่งมา → null
      status: dto.status ?? ProductStatus.ACTIVE,  // ค่า default = ACTIVE
      createdAt: now,
      updatedAt: now,
    };

    // ── ขั้นที่ 3: บันทึกลง Repository แล้ว return สินค้าที่สร้าง ──
    return this.productsRepository.create(product);
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-04]: Implement Update Product (PUT — แก้ไขทั้งหมด)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Full Replacement + Unique Constraint Check
  //
  // 🎯 Steps:
  //   1. หา product เดิม:
  //      const existing = await this.findOne(id);
  //      → ถ้าไม่เจอ findOne() จะ throw NotFoundException ให้อัตโนมัติ
  //
  //   2. ตรวจสอบ SKU ซ้ำ (เฉพาะกรณีที่ SKU เปลี่ยน):
  //      if (dto.sku !== existing.sku) {
  //        const all = await this.findAll();
  //        if (all.some(p => p.sku === dto.sku)) {
  //          throw new BadRequestException('SKU already exists');
  //        }
  //      }
  //
  //   3. สร้าง Product object ใหม่ (เก็บ id และ createdAt เดิมไว้):
  //      const updated: Product = {
  //        ...existing,              ← เอาข้อมูลเดิมมาก่อน
  //        name: dto.name,           ← แทนที่ด้วยข้อมูลใหม่
  //        description: dto.description,
  //        price: dto.price,
  //        stockQuantity: dto.stockQuantity,
  //        sku: dto.sku,
  //        category: dto.category,
  //        brand: dto.brand,
  //        images: dto.images,
  //        weight: dto.weight ?? null,
  //        status: dto.status,
  //        updatedAt: new Date().toISOString(),  ← อัปเดตเวลาแก้ไข
  //      };
  //
  //   4. บันทึก:
  //      const result = await this.productsRepository.update(id, updated);
  //      if (!result) throw new NotFoundException(...);
  //      return result;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    // ── ขั้นที่ 1: หา product เดิม (throw 404 ถ้าไม่เจอ) ──
    const existing = await this.findOne(id);

    // ── ขั้นที่ 2: ตรวจ SKU ซ้ำ เฉพาะกรณี SKU เปลี่ยน ──
    if (dto.sku !== existing.sku) {
      const all = await this.findAll();
      if (all.some((p) => p.sku === dto.sku)) {
        throw new BadRequestException('SKU already exists');
      }
    }

    // ── ขั้นที่ 3: สร้าง Product ใหม่โดยเก็บ id + createdAt เดิม ──
    const updated: Product = {
      ...existing,                                // ค่าเดิมทั้งหมด (id, createdAt ฯลฯ)
      name: dto.name,                             // แทนที่ด้วยค่าใหม่จาก DTO
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

    // ── ขั้นที่ 4: บันทึกลง Repository ──
    const result = await this.productsRepository.update(id, updated);
    if (!result) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-05]: Implement Patch Product (PATCH — แก้ไขบางส่วน)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Partial Update + Object Spread
  //
  // 🎯 Steps:
  //   1. หา product เดิม: const existing = await this.findOne(id);
  //
  //   2. ตรวจสอบ SKU ซ้ำ (ถ้า dto.sku ถูกส่งมา และไม่เท่ากับเดิม):
  //      if (dto.sku !== undefined && dto.sku !== existing.sku) {
  //        → ตรวจซ้ำเหมือน update()
  //      }
  //
  //   3. สร้าง Product object ใหม่ด้วย Spread Operator:
  //      const patched: Product = {
  //        ...existing,          ← ค่าเดิมทั้งหมด
  //        ...dto,               ← แทนที่เฉพาะ field ที่ส่งมา
  //        updatedAt: new Date().toISOString(),
  //      };
  //
  //      📘 Spread Operator (...) ทำงานยังไง?
  //      ถ้า existing = { name: 'A', price: 100, brand: 'X' }
  //      และ dto      = { price: 200 }
  //      ผลลัพธ์       = { name: 'A', price: 200, brand: 'X' }
  //      → price ถูกแทนที่ด้วยค่าใหม่ field อื่นเหมือนเดิม!
  //
  //   4. บันทึก:
  //      const result = await this.productsRepository.update(id, patched);
  //      if (!result) throw new NotFoundException(...);
  //      return result;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async patch(id: string, dto: PatchProductDto): Promise<Product> {
    // ── ขั้นที่ 1: หา product เดิม ──
    const existing = await this.findOne(id);

    // ── ขั้นที่ 2: ตรวจ SKU ซ้ำ (เฉพาะเมื่อ dto.sku ถูกส่งมาและไม่เท่าเดิม) ──
    if (dto.sku !== undefined && dto.sku !== existing.sku) {
      const all = await this.findAll();
      if (all.some((p) => p.sku === dto.sku)) {
        throw new BadRequestException('SKU already exists');
      }
    }

    // ── ขั้นที่ 3: Merge ด้วย Spread — เฉพาะ field ที่ส่งมาจะถูกแทนที่ ──
    const patched: Product = {
      ...existing,       // ค่าเดิมทั้งหมด
      ...dto,            // แทนที่เฉพาะ field ที่ส่งมา
      updatedAt: new Date().toISOString(),
    };

    // ── ขั้นที่ 4: บันทึก ──
    const result = await this.productsRepository.update(id, patched);
    if (!result) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-06]: Implement Remove Product (DELETE)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Delete with Existence Check
  //
  // 🎯 Steps:
  //   1. ตรวจสอบว่า product มีอยู่จริง:
  //      await this.findOne(id);  ← throw NotFoundException ถ้าไม่เจอ
  //
  //   2. ลบจาก repository:
  //      const deleted = await this.productsRepository.delete(id);
  //      if (!deleted) throw new NotFoundException(...);
  //      return deleted;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async remove(id: string): Promise<Product> {
    // ตรวจสอบว่าสินค้ามีอยู่จริง (throw 404 ถ้าไม่เจอ)
    await this.findOne(id);

    // ลบออกจาก Repository
    const deleted = await this.productsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return deleted;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📘 STOCK MANAGEMENT — เมธอดจัดการสต็อก (ใช้โดย OrdersService)
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-07]: Implement Stock Deduction (ตัดสต็อก)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Method นี้จะถูกเรียกโดย OrdersService เมื่อมีคนสั่งซื้อ
  //
  // 🎯 Steps:
  //   1. หาสินค้า: const product = await this.findOne(productId);
  //   2. ลด stockQuantity: product.stockQuantity -= quantity;
  //   3. ถ้า stockQuantity === 0 → เปลี่ยน status เป็น OUT_OF_STOCK:
  //      if (product.stockQuantity === 0) {
  //        product.status = ProductStatus.OUT_OF_STOCK;
  //      }
  //   4. อัปเดต updatedAt: product.updatedAt = new Date().toISOString();
  //   5. บันทึก: await this.productsRepository.update(productId, product);
  //   6. return product;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async deductStock(productId: string, quantity: number): Promise<Product> {
    // หาสินค้าจาก id
    const product = await this.findOne(productId);

    // ลดจำนวนสต็อก
    product.stockQuantity -= quantity;

    // ถ้าสต็อกเหลือ 0 → เปลี่ยนสถานะเป็น OUT_OF_STOCK
    if (product.stockQuantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    }

    // อัปเดตเวลาแก้ไข
    product.updatedAt = new Date().toISOString();

    // บันทึกลง Repository แล้ว return
    await this.productsRepository.update(productId, product);
    return product;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [Lukazx15-08]: Implement Stock Restoration (คืนสต็อก)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Method นี้จะถูกเรียกเมื่อยกเลิกหรือลบออเดอร์
  //
  // 🎯 Steps:
  //   1. หาสินค้า: const product = await this.findOne(productId);
  //   2. เพิ่ม stockQuantity: product.stockQuantity += quantity;
  //   3. ถ้า status เป็น OUT_OF_STOCK และตอนนี้ stock > 0
  //      → เปลี่ยน status เป็น ACTIVE
  //   4. อัปเดต updatedAt
  //   5. บันทึกและ return
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async restoreStock(productId: string, quantity: number): Promise<Product> {
    // หาสินค้าจาก id
    const product = await this.findOne(productId);

    // เพิ่มสต็อกกลับ
    product.stockQuantity += quantity;

    // ถ้าเคย OUT_OF_STOCK แต่ตอนนี้มีสต็อกแล้ว → กลับเป็น ACTIVE
    if (product.status === ProductStatus.OUT_OF_STOCK && product.stockQuantity > 0) {
      product.status = ProductStatus.ACTIVE;
    }

    // อัปเดตเวลาแก้ไข
    product.updatedAt = new Date().toISOString();

    // บันทึกลง Repository แล้ว return
    await this.productsRepository.update(productId, product);
    return product;
  }
}