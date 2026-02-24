/**
 * ═══════════════════════════════════════════════════════════════════════
 * 📘 OOP Concept: Inheritance + Dependency Injection
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ProductsRepository สืบทอดจาก JsonFileRepository<Product>
 * → ได้ CRUD methods ทั้งหมดมาฟรี! (findAll, findById, create, update, delete)
 *
 * @Injectable() บอก NestJS ว่า:
 * "class นี้สามารถ inject (ฉีด) เข้าไปใน class อื่นได้"
 * → NestJS จะสร้าง instance ให้อัตโนมัติ (Singleton Pattern)
 *
 * 👤 Assigned to: Lukazx15 (ณัฐนันท์)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { JsonFileRepository } from '../common/repositories/json-file.repository';
import { Product } from './entities/product.entity';
import process from 'node:process';

@Injectable()
export class ProductsRepository extends JsonFileRepository<Product> {
  constructor() {
    // super() เรียก constructor ของ class แม่ (JsonFileRepository)
    // ส่ง path ไปยังไฟล์ JSON ที่เก็บข้อมูลสินค้า
    super(join(process.cwd(), 'data', 'products.json'));
  }
}
