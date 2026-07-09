# nan-development

ระบบ Dashboard สำหรับติดตามความสอดคล้องของโครงการจังหวัดน่านกับแผนพัฒนาจังหวัดและ SDGs

## คุณสมบัติ

- Dashboard ภาพรวมโครงการ
- แบ่งกลุ่ม: สังคม, ท่องเที่ยว, ทรัพยากร, การค้า, เกษตร
- แสดงงบประมาณพร้อมร้อยละของงบรวม
- วิเคราะห์ SDGs ที่เกี่ยวข้อง
- ค้นหาและกรองข้อมูล
- หน้ารายละเอียดโครงการ
- Export PDF ด้วยคำสั่งพิมพ์ของ Browser
- Export Excel เป็นไฟล์ `.xls`
- รองรับ Export PDF และ Export Excel ตามข้อกำหนด

## วิธีอัปโหลดขึ้น GitHub Pages

1. แตกไฟล์ ZIP นี้
2. สร้าง Repository ชื่อ `nan-development`
3. อัปโหลดไฟล์ทั้งหมดขึ้น Repository
4. ไปที่ Settings > Pages
5. เลือก Branch: `main` และ Folder: `/root`
6. กด Save
7. เปิด URL ที่ GitHub Pages สร้างให้

## ข้อมูลที่ใช้

- จำนวนโครงการ: 112 โครงการ
- งบประมาณรวม: 1,067,920,919 บาท
- แหล่งข้อมูล: Excel ที่ผู้ใช้อัปโหลดในระบบ ChatGPT

## ไฟล์สำคัญ

- `index.html` หน้า Dashboard หลัก
- `assets/style.css` ไฟล์ตกแต่งหน้าเว็บ
- `assets/app.js` ไฟล์ควบคุม Dashboard
- `data/projects.json` ข้อมูลโครงการ
- `data/summary.json` ข้อมูลสรุป
- `data/sdgs.json` รายชื่อ SDGs
- `assets/logo-aiat.jpg` โลโก้ AIAT
- `assets/logo-rmutl.png` โลโก้ RMUTL
