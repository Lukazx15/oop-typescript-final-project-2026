/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📘 Design Pattern: Repository Pattern (รูปแบบคลังข้อมูล)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ลองจินตนาการว่า "Repository" เหมือนกับ "พนักงานคลังสินค้า"
 * เวลาคุณต้องการสินค้า คุณไม่ต้องเข้าไปหาเองในคลัง
 * แค่บอกพนักงาน: "ขอสินค้ารหัส A123" แล้วเขาจะไปหาให้
 *
 * Repository Pattern แยก "ตรรกะทางธุรกิจ" (Business Logic)
 * ออกจาก "วิธีการจัดเก็บข้อมูล" (Data Storage)
 *
 * ตอนนี้เราใช้ไฟล์ JSON แต่ถ้าอนาคตเปลี่ยนไปใช้ฐานข้อมูล SQL
 * เราแก้แค่ไฟล์นี้ไฟล์เดียว! Service ไม่ต้องแก้เลย
 *
 * 📘 OOP Concept: Generics + Encapsulation
 * ─────────────────────────────────────────
 *   - Generics (<T>): ให้ Repository ทำงานกับ Entity ชนิดใดก็ได้
 *   - Encapsulation: ซ่อนรายละเอียดการอ่าน/เขียนไฟล์ไว้ภายใน
 *     ภายนอกเรียกแค่ findAll(), create() ไม่ต้องรู้ว่าข้างในอ่านไฟล์ยังไง
 *

 * ═══════════════════════════════════════════════════════════════════════
 */

import { readFile, writeFile, rename } from 'fs/promises';
import { BaseEntity } from '../entities/base.entity';

/**
 * JsonFileRepository<T> — Generic Repository ที่จัดเก็บข้อมูลในไฟล์ JSON
 *
 * T extends BaseEntity หมายความว่า:
 * T ต้องเป็น class ที่สืบทอดมาจาก BaseEntity เท่านั้น
 * (ต้องมี id, createdAt, updatedAt)
 */
export class JsonFileRepository<T extends BaseEntity> {
  /**
   * 📘 OOP Concept: Encapsulation (การห่อหุ้ม)
   * ─────────────────────────────────────────────
   * "private" หมายถึงข้อมูลนี้เข้าถึงได้จากภายในคลาสนี้เท่านั้น
   * ภายนอกจะไม่สามารถแก้ไข data โดยตรงได้ → ปลอดภัย!
   *
   * data คืออาร์เรย์ที่เก็บข้อมูลทั้งหมดไว้ใน memory (RAM)
   * ทำให้อ่านเร็วมาก ไม่ต้องอ่านไฟล์ทุกครั้ง
   */
  private data: T[] = [];
  private isLoaded = false;

  /**
   * 📘 OOP Concept: Constructor + Parameter Properties
   * ────────────────────────────────────────────────────
   * Constructor คือเมธอดที่ทำงานอัตโนมัติเมื่อสร้าง Object ใหม่
   *
   * "protected readonly filePath" ทำ 2 อย่างพร้อมกัน:
   *   1. ประกาศ property ชื่อ filePath
   *   2. กำหนดค่าจาก parameter
   *
   * "protected" → class ลูกเข้าถึงได้ แต่ภายนอกไม่ได้
   * "readonly" → กำหนดค่าได้ครั้งเดียว แก้ไขภายหลังไม่ได้
   */
  constructor(protected readonly filePath: string) {}

  // ═══════════════════════════════════════════════════════════════════
  // 🔧 PRIVATE HELPERS — ใช้ภายในคลาสนี้เท่านั้น
  // ═══════════════════════════════════════════════════════════════════

  /**
   * โหลดข้อมูลจากไฟล์ JSON เข้าสู่ memory (RAM)
   * ✅ ตัวอย่างที่ทำเสร็จแล้ว — ใช้เป็นแนวทางสำหรับ saveToFile()
   *
   * 📘 Concept: async/await
   * ─────────────────────
   * "async" = ฟังก์ชันนี้ทำงานแบบ asynchronous (ไม่บล็อก)
   * "await" = รอให้การทำงานเสร็จก่อนไปต่อ
   * readFile() อ่านไฟล์จาก disk → ใช้เวลา → ต้อง await
   */
  private async loadFromFile(): Promise<void> {
    const content = await readFile(this.filePath, 'utf-8');
    this.data = JSON.parse(content) as T[];
    this.isLoaded = true;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [bouquetofroses-03]: เขียน Atomic Write (เขียนไฟล์แบบปลอดภัย)
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Atomic Write Strategy (กลยุทธ์การเขียนแบบอะตอม)
  //
  //    ปัญหา: ถ้าเขียนไฟล์ตรงๆ แล้วเครื่องดับกลางทาง
  //    → ไฟล์จะเสียหาย (corrupted) ข้อมูลหายหมด!
  //
  //    วิธีแก้: เขียนลงไฟล์ชั่วคราว (.tmp) ก่อน แล้วค่อย rename
  //    → ถ้าเครื่องดับกลางทาง ไฟล์ต้นฉบับยังปลอดภัย!
  //
  // 🎯 Steps:
  //   1. สร้างชื่อไฟล์ชั่วคราว: const tmpPath = this.filePath + '.tmp';
  //   2. แปลง this.data เป็น JSON string: JSON.stringify(this.data, null, 2)
  //      → null, 2 ทำให้ JSON อ่านง่าย (pretty-print ด้วย 2 spaces)
  //   3. เขียน JSON string ลงไฟล์ชั่วคราว: await writeFile(tmpPath, jsonString, 'utf-8')
  //   4. เปลี่ยนชื่อไฟล์ชั่วคราวเป็นไฟล์จริง: await rename(tmpPath, this.filePath)
  //      → rename เป็น atomic operation ของ OS → ปลอดภัย!
  //
  // 📖 Functions ที่ต้องใช้ (import ไว้ให้แล้วด้านบน):
  //   - writeFile(path, content, encoding) → เขียนไฟล์
  //   - rename(oldPath, newPath) → เปลี่ยนชื่อไฟล์
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง แทนที่ throw ⬇️
  private async saveToFile(): Promise<void> {
    // สร้างชื่อไฟล์ชั่วคราว เช่น "data/products.json.tmp"
    const tmpPath = this.filePath + '.tmp';

    // แปลง array ใน memory → JSON string (pretty-print 2 spaces)
    const jsonString = JSON.stringify(this.data, null, 2);

    // เขียนลงไฟล์ชั่วคราวก่อน
    await writeFile(tmpPath, jsonString, 'utf-8');

    // rename เป็น atomic operation → ถ้าเครื่องดับกลางทาง ไฟล์จริงไม่เสียหาย
    await rename(tmpPath, this.filePath);
  }

  /**
   * ตรวจสอบว่าโหลดข้อมูลจากไฟล์แล้วหรือยัง
   * ถ้ายังไม่โหลด → โหลดเลย (Lazy Loading Pattern)
   *
   * 📘 Concept: Lazy Loading
   * → ไม่ต้องโหลดข้อมูลตั้งแต่เริ่มต้น
   * → โหลดเมื่อมีคนต้องการใช้ครั้งแรกเท่านั้น → ประหยัดทรัพยากร
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadFromFile();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📗 PUBLIC METHODS — เมธอด CRUD ที่ Service จะเรียกใช้
  // ═══════════════════════════════════════════════════════════════════

  /**
   * ดึงข้อมูลทั้งหมด
   * ✅ ตัวอย่างที่ทำเสร็จแล้ว — ใช้เป็นแนวทางสำหรับเมธอดอื่น
   *
   * 📘 Concept: Spread Operator [...array]
   * → สร้าง "สำเนา" ของอาร์เรย์ แทนที่จะส่งอาร์เรย์ต้นฉบับ
   * → ป้องกันไม่ให้ภายนอกแก้ไข data ของเราโดยไม่ผ่าน repository
   */
  async findAll(): Promise<T[]> {
    await this.ensureLoaded();
    return [...this.data];
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [bouquetofroses-04]: ค้นหาข้อมูลด้วย id
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Array.find() + Nullish Coalescing (??)
  //
  // 🎯 Steps:
  //   1. เรียก await this.ensureLoaded() ก่อนเสมอ
  //   2. ใช้ this.data.find(item => item.id === id) เพื่อหาข้อมูล
  //      → find() จะคืนค่า element แรกที่ตรงเงื่อนไข หรือ undefined ถ้าไม่เจอ
  //   3. คืนค่าที่พบ หรือ null ถ้าไม่เจอ
  //      → ใช้ ?? null (Nullish Coalescing: ถ้าค่าเป็น undefined → ใช้ null แทน)
  //
  // 📖 ตัวอย่าง:
  //   const result = this.data.find(item => item.id === id) ?? null;
  //   return result;
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async findById(id: string): Promise<T | null> {
    // โหลดข้อมูลจากไฟล์เข้า memory (ถ้ายังไม่เคยโหลด)
    await this.ensureLoaded();

    // find() คืน element แรกที่ id ตรง หรือ undefined ถ้าไม่เจอ
    // ?? null แปลง undefined → null เพื่อให้ type ตรง
    return this.data.find((item) => item.id === id) ?? null;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [bouquetofroses-05]: เพิ่มข้อมูลใหม่ลงในคลัง
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Array.push() + Persistence (การบันทึกถาวร)
  //
  // 🎯 Steps:
  //   1. เรียก await this.ensureLoaded()
  //   2. เพิ่ม entity เข้าอาร์เรย์: this.data.push(entity)
  //   3. บันทึกลงไฟล์: await this.saveToFile()
  //   4. คืนค่า entity ที่เพิ่มไป
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async create(entity: T): Promise<T> {
    // โหลดข้อมูลจากไฟล์เข้า memory ก่อน
    await this.ensureLoaded();

    // เพิ่ม entity ใหม่เข้า array ใน memory
    this.data.push(entity);

    // บันทึก array ที่อัปเดตแล้วลงไฟล์ JSON
    await this.saveToFile();

    // คืนค่า entity ที่เพิ่งสร้าง
    return entity;
  }

  /**
   * แก้ไขข้อมูลที่มี id ตรงกัน (แทนที่ทั้ง Object)
   * ✅ ตัวอย่างที่ทำเสร็จแล้ว — ใช้เป็นแนวทางสำหรับ delete()
   *
   * 📘 Concept: Array.findIndex()
   * → เหมือน find() แต่คืนค่า "ตำแหน่ง" (index) แทนค่าข้อมูล
   * → ถ้าไม่เจอ จะคืนค่า -1
   */
  async update(id: string, updatedEntity: T): Promise<T | null> {
    await this.ensureLoaded();

    // findIndex() → หาตำแหน่งของข้อมูลที่มี id ตรงกัน
    const index = this.data.findIndex((item) => item.id === id);

    // ถ้าไม่เจอ (index === -1) → คืนค่า null
    if (index === -1) {
      return null;
    }

    // แทนที่ข้อมูลเก่าด้วยข้อมูลใหม่ ที่ตำแหน่งเดิม
    this.data[index] = updatedEntity;

    // บันทึกลงไฟล์
    await this.saveToFile();

    return updatedEntity;
  }

  // ─────────────────────────────────────────────────────────────────
  // 📌 TODO [bouquetofroses-06]: ลบข้อมูลด้วย id
  // ─────────────────────────────────────────────────────────────────
  // 💡 Concept: Array.findIndex() + Array.splice()
  //
  // 🎯 Steps:
  //   1. เรียก await this.ensureLoaded()
  //   2. หาตำแหน่งของข้อมูล: const index = this.data.findIndex(item => item.id === id)
  //   3. ถ้าไม่เจอ (index === -1) → return null
  //   4. เก็บข้อมูลที่จะลบไว้ก่อน (เพื่อ return กลับไป)
  //   5. ลบออกจากอาร์เรย์: this.data.splice(index, 1)
  //      → splice(ตำแหน่ง, จำนวนที่จะลบ) → ลบ 1 ตัวที่ตำแหน่ง index
  //   6. บันทึกลงไฟล์: await this.saveToFile()
  //   7. คืนค่าข้อมูลที่ลบไป
  //
  // 📖 ตัวอย่าง splice:
  //   const arr = ['a', 'b', 'c'];
  //   arr.splice(1, 1);  // ลบ 'b' → arr = ['a', 'c']
  //
  // ⬇️ เขียนโค้ดของคุณด้านล่าง ⬇️
  async delete(id: string): Promise<T | null> {
    // โหลดข้อมูลจากไฟล์เข้า memory ก่อน
    await this.ensureLoaded();

    // หาตำแหน่ง (index) ของข้อมูลที่มี id ตรงกัน
    const index = this.data.findIndex((item) => item.id === id);

    // ถ้าไม่เจอ (index === -1) → คืน null
    if (index === -1) {
      return null;
    }

    // เก็บข้อมูลที่จะลบไว้ก่อน เพื่อ return กลับไปให้ caller
    const deleted = this.data[index];

    // ลบออกจาก array: splice(ตำแหน่ง, จำนวน) → ลบ 1 ตัวที่ index
    this.data.splice(index, 1);

    // บันทึก array ที่อัปเดตแล้วลงไฟล์
    await this.saveToFile();

    // คืนค่าข้อมูลที่ถูกลบ
    return deleted;
  }
}