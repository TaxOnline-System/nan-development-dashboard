# nan-development

ระบบ Dashboard สำหรับติดตามและวิเคราะห์ความสอดคล้องของโครงการจังหวัดน่านกับแผนพัฒนาจังหวัดและ SDGs

## ข้อมูลในระบบ

- จำนวนโครงการ: 112 รายการ
- งบประมาณรวม: 1,067,920,918.84 บาท
- แบ่งกลุ่ม: สังคม, ท่องเที่ยว, ทรัพยากร, การค้า, เกษตร
- Export ที่รองรับ: PDF และ Excel
- ไม่มี Export CSV และ Export JSON ตามข้อกำหนด

## วิธีอัปโหลดขึ้น GitHub Pages

1. แตกไฟล์ ZIP นี้
2. สร้าง Repository ใหม่ชื่อ `nan-development`
3. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น Repository
4. ไปที่ Settings > Pages
5. เลือก Deploy from branch
6. เลือก branch `main` และ folder `/root`
7. รอ GitHub สร้างลิงก์เว็บไซต์

## โครงสร้างไฟล์

```text
nan-development/
├── index.html
├── assets/
│   ├── app.js
│   ├── style.css
│   ├── logo-aiat.jpg
│   └── logo-rmutl.png
├── data/
│   ├── projects.json
│   ├── summary.json
│   ├── sdgs.json
│   └── province-plan.json
└── .nojekyll
```

## หมายเหตุ

ระบบนี้เป็น Static Web Application ใช้งานได้บน GitHub Pages โดยไม่ต้องติดตั้ง Server
