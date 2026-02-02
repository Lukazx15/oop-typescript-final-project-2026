# Submission Guideline — NestJS Backend API Project

## 0. GitHub Template
- **Template Repository:** [https://github.com/42bangkok-classroom/oop-typescript-final-project-2026](https://github.com/42bangkok-classroom/oop-typescript-final-project-2026)
- ใช้ Template นี้เป็นจุดเริ่มต้นสำหรับการทำโปรเจค

---

## 1. Submission Method
- ส่งงานเป็น **GitHub Repository URL**
- Repository ต้องอยู่ภายใต้นามของ **Team Lead**
- **วันส่งงาน:** วันที่ 8 มี.ค. 2569 เวลา 23.59
- **ส่งงานผ่านฟอร์ม:** [https://forms.gle/wu8ApezHfSzBzvAr8](https://forms.gle/wu8ApezHfSzBzvAr8)
- **วัน Presentation:** วันที่ 9 มี.ค. 2569 ตามคาบเรียน

---

## 2. Team & Contributor
- สมาชิกทุกคนต้องถูกระบุไว้ใน key `contributors` ภายในไฟล์ `package.json`
- สมาชิกทุกคนต้องมี commit ใน repository

---

## 2.5. Model Set Registration

หลังจากคำนวณและเลือก Model Set แล้ว ให้บันทึกข้อมูลดังกล่าวไว้ในไฟล์ `package.json` ของโปรเจค

### รูปแบบที่กำหนด

```json
{
  "project": {
    "model": {
      "id": "3",
      "name": "Event Management System"
    },
    "sumStudentId": 192370371
  }
}
```

* ค่า `id` คือหมายเลข Model Set ที่ได้รับ (0-9) **เป็น string**
* ค่า `name` คือชื่อ Model Set ตามที่ระบุใน [`subjects/models.md`](subjects/models.md)
* ค่า `sumStudentId` คือผลรวมของ Student ID ทั้งหมดในกลุ่ม

**รายละเอียด Model Sets:** → [`subjects/models.md`](subjects/models.md)

---

## 3. Repository Structure
- เอกสารทั้งหมดต้องอยู่ในโฟลเดอร์:
```text
docs/
```

## 4. README.md Requirement
ไฟล์ `README.md` ต้องประกอบด้วย:
- Project Overview
- Technology Stack
- วิธีการติดตั้งและรันโปรเจค
- โครงสร้างโปรเจคโดยสรุป
- ลิงก์ไปยังเอกสารในโฟลเดอร์ docs/

## 5. Documentation
- Swagger API Specification
- Data Model Documentation
- UML Diagram

## 6. Pre-submission Checklist
ก่อนส่งงาน แนะนำให้ตรวจสอบความครบถ้วนด้วยไฟล์:
- `submission-checklist.md`

## 7. Important Notes
- Repository ต้องสามารถเข้าถึงได้
- หากเอกสารหรือโครงสร้างไม่ครบ อาจมีผลต่อการประเมินคะแนน