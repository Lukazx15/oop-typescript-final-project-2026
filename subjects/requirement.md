# Project Requirement — NestJS Backend API

## 1. Project Overview
โปรเจคนี้เป็นส่วนหนึ่งของรายวิชาการพัฒนา Backend โดยมีวัตถุประสงค์เพื่อให้นักศึกษา
- ออกแบบและพัฒนา REST API ด้วย NestJS Framework
- ใช้ TypeScript อย่างปลอดภัย (Type-safe)
- ออกแบบโครงสร้างระบบตามมาตรฐาน
- จัดการ Validation และ Error Handling อย่างเหมาะสม
- จัดทำเอกสารประกอบระบบ

---

## 2. Team Structure
- ทำงานเป็นกลุ่ม กลุ่มละ **3–4 คน**
- ระยะเวลาการพัฒนา **ประมาณ 2 สัปดาห์**

---

## 3. Technology & Tools
- Framework: NestJS
- Language: TypeScript
- API Style: REST API
- Database: JSON-based (file-based หรือ in-memory)
- API Documentation: Swagger (OpenAPI)
- Linting: TSLint (recommended)

---

## 4. Project Structure
- ต้องเริ่มต้นจาก **Template ที่อาจารย์จัดเตรียมให้**
- ไม่จำเป็นต้องแยก module
- สามารถเรียก service ผ่าน controller ได้โดยตรง
- โค้ดต้องอ่านง่าย เป็นระบบ และดูแลรักษาได้

---

## 5. Data Model Requirement
- ต้องเลือกใช้ **Model Set 1 ชุด** จาก 10 ชุดที่มีให้
- วิธีการเลือก Model Set: ดูรายละเอียดใน [`subjects/models.md`](subjects/models.md)
- แต่ละ Model Set มี **Core Data Model 2 Models**
- ใช้ TypeScript data type ให้ครบถ้วน
- ต้องมีการใช้งาน **Enum อย่างน้อย 1 จุด**
- Model ย่อย, attribute, enum และความสัมพันธ์เชิงลึก ให้นักศึกษาออกแบบเองทั้งหมด
- ❌ ห้ามใช้ `any` type ในทุกกรณี

**รายละเอียด Model Sets:** → [`subjects/models.md`](subjects/models.md)

---

## 6. API Design Requirement
- ทุก Model ต้องรองรับ CRUD Operation

### Standard Endpoints
- GET /resources
- GET /resources/{id}
- POST /resources
- PUT /resources/{id}
- PATCH /resources/{id}
- DELETE /resources/{id}

- ใช้ HTTP Method ให้ถูกต้องตามหลัก REST API
- URL path ต้องตั้งชื่อให้สื่อความหมาย

---

## 7. Request & Response Standard
- ทุก request และ response ต้องกำหนด interface แบบ narrow type
- ❌ ห้ามใช้ `any` type ในทุกกรณี

### Standard Response Format
```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

## 8. Validation & Error Handling
- ทุก API ต้องมีการ validate ข้อมูล
- ใช้ HTTP Status Code ที่เหมาะสม (200, 201, 403, 404)
- ไม่ควรเกิด Error 500 จาก logic ที่สามารถป้องกันได้
- หากพบ Error 500 มากกว่า 5 จุด จะมีผลต่อการให้คะแนน

## 9. Documentation Requirement
- นักศึกษาต้องจัดทำเอกสารดังนี้:
- Swagger API Specification
- Data Model Documentation
- UML Diagram

## 10. Policy on AI Usage
- อนุญาตให้ใช้ AI (เช่น ChatGPT) ช่วยในการพัฒนาโปรเจค
- นักศึกษาต้องสามารถอธิบายโค้ดและแนวคิดของระบบได้