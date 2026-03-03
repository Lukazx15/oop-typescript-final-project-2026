/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📘 OrdersService — "สมอง" ของระบบสั่งซื้อ
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Service นี้มี Business Logic ที่ซับซ้อนที่สุดในระบบ:
 *
 * 1️⃣ สร้างออเดอร์ (create):
 *    → ตรวจสอบสินค้ามีอยู่จริง + พร้อมขาย (ACTIVE)
 *    → ตรวจสอบสต็อกเพียงพอ
 *    → เก็บ "สแนปช็อต" ราคา ณ ตอนสั่ง (Price Snapshot)
 *    → ตัดสต็อกสินค้า (Stock Deduction)
 *    → คำนวณยอดรวม (Total Calculation)
 *
 * 2️⃣ อัปเดตสถานะ (patch):
 *    → ตรวจสอบ State Machine (PENDING → PAID → SHIPPED → COMPLETED)
 *    → คืนสต็อกเมื่อยกเลิก (Cancel → Stock Restoration)
 *
 * 3️⃣ ลบออเดอร์ (remove):
 *    → คืนสต็อกสินค้า (ถ้ายังไม่ได้ cancel)
 *
 * 📘 Concept: Cross-Service Dependency
 * → OrdersService ต้องใช้ ProductsService เพื่อตรวจสอบและแก้ไขสต็อก
 * → NestJS inject ProductsService เข้ามาผ่าน Constructor
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { OrdersRepository } from './orders.repository';
import { ProductsService } from '../products/products.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PatchOrderDto } from './dto/patch-order.dto';
import { OrderStatus } from './enums/order-status.enum'; 
import { ProductStatus } from '../products/enums/product-status.enum';
import { VALID_ORDER_TRANSITIONS } from './enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';






@Injectable()
export class OrdersService {
  /**
   * 📘 Multiple Dependencies Injection
   * OrdersService ต้องการทั้ง:
   *   - OrdersRepository → สำหรับจัดการข้อมูล Order
   *   - ProductsService  → สำหรับตรวจสอบ/แก้ไขสต็อกสินค้า
   */
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsService: ProductsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // 📗 READ OPERATIONS
  // ═══════════════════════════════════════════════════════════════════

  /** ดึงออเดอร์ทั้งหมด ✅ ตัวอย่างที่ทำเสร็จแล้ว */
  async findAll(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  /** ดึงออเดอร์ตาม ID ✅ ตัวอย่างที่ทำเสร็จแล้ว */
  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }
    return order;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📕 CREATE ORDER — สร้างออเดอร์ใหม่
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [pockypycok-03]: Implement Create Order
  // ─────────────────────────────────────────────────────────────────
  // 💡 นี่คือ method ที่ซับซ้อนที่สุดในระบบ ทำทีละขั้น!
  //
  // 🎯 Steps:
  //
  //   ── ขั้นที่ 1: สร้างรายการสินค้า (OrderItem[]) ──
  //   const orderItems: OrderItem[] = [];
  //   let totalAmount = 0;
  //
  //   for (const item of dto.items) {
  //     // 1a. หาสินค้า (ถ้าไม่เจอ → findOne จะ throw NotFoundException)
  //     //     แต่เราต้องการ 400 ไม่ใช่ 404 → ต้อง try-catch หรือใช้ findAll
  //     //     วิธีง่าย: ใช้ productsService แล้ว catch error
  //     let product;
  //     try {
  //       product = await this.productsService.findOne(item.productId);
  //     } catch {
  //       throw new BadRequestException(
  //         `Product '${item.productId}' not found`,
  //       );
  //     }
  //
  //     // 1b. ตรวจสอบว่าสินค้าพร้อมขาย (ACTIVE)
  //     if (product.status !== ProductStatus.ACTIVE) {
  //       throw new BadRequestException(
  //         `Product '${product.name}' is not available (${product.status})`,
  //       );
  //     }
  //
  //     // 1c. ตรวจสอบสต็อกเพียงพอ
  //     if (product.stockQuantity < item.quantity) {
  //       throw new BadRequestException(
  //         `Insufficient stock for '${product.name}'`,
  //       );
  //     }
  //
  //     // 1d. สร้าง OrderItem พร้อม Price Snapshot
  //     const subtotal = product.price * item.quantity;
  //     orderItems.push({
  //       productId: product.id,
  //       productName: product.name,
  //       priceAtPurchase: product.price,  ← ราคา ณ ตอนสั่ง
  //       quantity: item.quantity,
  //       subtotal: subtotal,
  //     });
  //     totalAmount += subtotal;
  //   }
  //
  //   ── ขั้นที่ 2: ตัดสต็อกสินค้า ──
  //   for (const item of dto.items) {
  //     await this.productsService.deductStock(item.productId, item.quantity);
  //   }
  //
  //   ── ขั้นที่ 3: สร้าง Order Object ──
  //   const now = new Date().toISOString();
  //   const order: Order = {
  //     id: uuidv4(),
  //     customerId: dto.customerId,
  //     items: orderItems,
  //     totalAmount: totalAmount,
  //     status: OrderStatus.PENDING,       ← เริ่มต้นเป็น PENDING เสมอ
  //     paymentMethod: dto.paymentMethod,
  //     shippingAddress: dto.shippingAddress,
  //     trackingNumber: null,              ← ยังไม่มีเลขพัสดุ
  //     note: dto.note ?? null,
  //     placedAt: now,
  //     createdAt: now,
  //     updatedAt: now,
  //   };
  //
  //   ── ขั้นที่ 4: บันทึกและ return ──
  //   return this.ordersRepository.create(order);
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
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
  // ═══════════════════════════════════════════════════════════════════
  // 📕 PATCH ORDER — อัปเดตออเดอร์ (เปลี่ยนสถานะ / แก้ข้อมูล)
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [pockypycok-04]: Implement Patch Order (State Machine)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: State Machine + Guard Clauses
  //
  // 🎯 Steps:
  //
  //   ── ขั้นที่ 1: หาออเดอร์เดิม ──
  //   const existing = await this.findOne(id);
  //
  //   ── ขั้นที่ 2: ตรวจสอบ Terminal State ──
  //   ⚠️ ถ้าออเดอร์เป็น COMPLETED หรือ CANCELLED → ห้ามแก้ไขอะไรทั้งนั้น!
  //   if (existing.status === OrderStatus.COMPLETED ||
  //       existing.status === OrderStatus.CANCELLED) {
  //     throw new BadRequestException(
  //       `Cannot update a ${existing.status} order`,
  //     );
  //   }
  //
  //   ── ขั้นที่ 3: ตรวจสอบ State Transition (ถ้ามีการเปลี่ยนสถานะ) ──
  //   if (dto.status) {
  //     // ใช้ VALID_ORDER_TRANSITIONS ที่ import มาจาก order-status.enum.ts
  //     const allowedNextStates = VALID_ORDER_TRANSITIONS[existing.status];
  //     if (!allowedNextStates.includes(dto.status)) {
  //       throw new BadRequestException(
  //         `Cannot transition from ${existing.status} to ${dto.status}`,
  //       );
  //     }
  //
  //     // ── ขั้นที่ 3b: คืนสต็อกถ้ายกเลิก ──
  //     if (dto.status === OrderStatus.CANCELLED) {
  //       await this.restoreOrderStock(existing);
  //     }
  //   }
  //
  //   ── ขั้นที่ 4: อัปเดตข้อมูล ──
  //   const updated: Order = {
  //     ...existing,
  //     ...dto,                             ← Spread! merge เฉพาะ field ที่ส่งมา
  //     updatedAt: new Date().toISOString(),
  //   };
  //
  //   ── ขั้นที่ 5: บันทึก ──
  //   const result = await this.ordersRepository.update(id, updated);
  //   if (!result) throw new NotFoundException(...);
  //   return result;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
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

  // ═══════════════════════════════════════════════════════════════════
  // 📕 DELETE ORDER — ลบออเดอร์ + คืนสต็อก
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [pockypycok-05]: Implement Remove Order
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Delete with Side Effects (ลบ + ผลข้างเคียง)
  //
  // 🎯 Steps:
  //   1. หาออเดอร์: const order = await this.findOne(id);
  //
  //   2. คืนสต็อก (ถ้าออเดอร์ยังไม่ได้ cancel):
  //      if (order.status !== OrderStatus.CANCELLED) {
  //        await this.restoreOrderStock(order);
  //      }
  //      → ทำไม? เพราะถ้า cancel ไปแล้ว สต็อกถูกคืนตอน cancel แล้ว
  //      → ถ้า delete ออเดอร์ที่ยังไม่ cancel ต้องคืนสต็อกก่อน
  //
  //   3. ลบจาก repository:
  //      const deleted = await this.ordersRepository.delete(id);
  //      if (!deleted) throw new NotFoundException(...);
  //
  //   4. return deleted;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
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

  // ═══════════════════════════════════════════════════════════════════
  // 🔧 PRIVATE HELPERS — เมธอดช่วยภายใน
  // ═══════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [pockypycok-06]: Implement Stock Restoration Helper
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Private Helper Method
  //    → method นี้ใช้ภายใน class เท่านั้น (private)
  //    → ถูกเรียกจาก patch() (เมื่อ cancel) และ remove()
  //
  // 🎯 Steps:
  //   วนลูปผ่านทุกรายการในออเดอร์ แล้วคืนสต็อก:
  //
  //   for (const item of order.items) {
  //     await this.productsService.restoreStock(item.productId, item.quantity);
  //   }
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  private async restoreOrderStock(order: Order): Promise<void> {
  // วนลูปผ่านทุกสินค้าในออเดอร์ แล้วคืนสต็อก
  for (const item of order.items) {
    await this.productsService.restoreStock(item.productId, item.quantity);
  }
}