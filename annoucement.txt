📢 **ประกาศ: Final Project — NestJS Backend API**

**🎯 ภาพรวม**
โปรเจคพัฒนา REST API ด้วย NestJS และ TypeScript
**Template Repository:** https://github.com/42bangkok-classroom/oop-typescript-final-project-2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**👥 โครงสร้างทีม**
- กลุ่มละ **3-4 คน**
- ระยะเวลา **2 สัปดาห์**
- สมาชิกทุกคนต้องมี commit
- ระบุข้อมูลใน `package.json` (key `contributors`)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🧩 Model Sets** *(สำคัญ!)*
แต่ละกลุ่มต้องเลือก **Model Set 1 ชุด** จาก 10 ชุดที่มีให้

**วิธีการเลือก:**
1. นำ Student ID ของสมาชิกทุกคนในกลุ่มมารวมกัน
2. นำผลรวม **mod 10**
3. ค่าที่ได้ (0-9) จะเป็น Model Set ID ที่กลุ่มได้รับ

**ตัวอย่าง:**
- สมาชิก 3 คน: Student ID = `64123456`, `64123457`, `64123458`
- `sumStudentId` = `192370371`
- `192370371 % 10 = 1` → **Model Set ID: "1"** (Blog / Content Platform)

⚠️ **เมื่อได้ Model Set แล้ว ห้ามเปลี่ยน** เว้นแต่ได้รับอนุญาต

**หลังจากเลือกแล้ว ให้บันทึกใน `package.json`:**
```json
{
  "project": {
    "model": {
      "id": "1",
      "name": "Blog / Content Platform"
    },
    "sumStudentId": 192370371
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 ข้อกำหนดหลัก**

**Data Model**
- ต้องเลือก Model Set 1 ชุด (แต่ละชุดมี Core Models 2 ตัว)
- ต้องบันทึก Model Set ใน `package.json` (key `project`)
- ใช้ **Enum อย่างน้อย 1 จุด**
- ❌ **ห้ามใช้ `any` type**

**API Design**
- ทุก Model รองรับ **CRUD ครบถ้วน**
- ใช้ HTTP Method ถูกต้อง (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Response format เป็นมาตรฐานเดียวกัน

**Validation & Error Handling**
- Validate ทุก request
- ใช้ HTTP Status Code ถูกต้อง
- ⚠️ **Error 500 ต้องไม่เกิน 5 จุด**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📄 เอกสารที่ต้องจัดทำ**
- Swagger API Specification
- Data Model Documentation
- UML Diagram

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✅ การส่งงาน**
- ส่งเป็น **GitHub Repository URL** (ในนาม Team Lead)
- **วันส่งงาน:** วันที่ 8 มี.ค. 2569 เวลา 23.59
- **ส่งงานผ่านฟอร์ม:** https://forms.gle/wu8ApezHfSzBzvAr8
- **วัน Presentation:** วันที่ 9 มี.ค. 2569 ตามคาบเรียน
- Repository ต้องเข้าถึงได้
- `README.md` ต้องครบถ้วน
- ต้องบันทึก Model Set ใน `package.json`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 เกณฑ์การให้คะแนน (20 คะแนน)**
1. Code Quality — 3 คะแนน
2. API Standard — 2 คะแนน
3. Functionality — 4 คะแนน
4. Error Handling & Validation — 4 คะแนน
5. Documentation — 3 คะแนน
6. Collaboration & Version Control — 2 คะแนน
7. Presentation & Explanation — 2 คะแนน

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🚀 เริ่มต้น**
```bash
npm install
npm run start:dev
```
Swagger: `http://localhost:3000/api`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📚 อ่านรายละเอียดเพิ่มเติม**
- **Project Requirement** → `subjects/requirement.md`
- **Model Sets** → `subjects/models.md`
- **Submission Guideline** → `subjects/submission.md`
- **Evaluation Criteria** → `subjects/evaluation.md`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🤖 นโยบาย AI**
- อนุญาตให้ใช้ AI ช่วยพัฒนา ✅
- ต้องอธิบายโค้ดและแนวคิดได้ด้วยตนเอง ⚠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **หมายเหตุ:** กรุณาอ่านเอกสารในโฟลเดอร์ `subjects/` ให้ครบถ้วนก่อนเริ่มพัฒนา

**ขอให้ทุกคนโชคดี! 🎉**
