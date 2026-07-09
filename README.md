# Provincial Project Alignment Dashboard (PPAD)

ระบบ Dashboard สำหรับวิเคราะห์ความสอดคล้องของโครงการกับแผนพัฒนาจังหวัดน่านและ SDGs

## วิธีใช้งานบน GitHub Pages

1. แตกไฟล์ ZIP นี้
2. อัปโหลดไฟล์ทั้งหมดขึ้น GitHub Repository
3. ไปที่ Settings > Pages
4. เลือก Deploy from branch
5. เลือก branch `main` และ folder `/root`
6. กด Save
7. เปิด URL ที่ GitHub Pages สร้างให้

## ไฟล์สำคัญ

- `index.html` หน้าเว็บหลัก
- `assets/style.css` รูปแบบหน้าจอ
- `assets/app.js` ระบบค้นหา กรอง Dashboard และ Export
- `data/projects.json` ข้อมูลโครงการจาก Excel
- `data/sdgs.json` รายการ SDGs
- `data/province-plan.json` ข้อมูลแผนจังหวัดจาก Sheet แผนปี 71-75

## การอัปเดตข้อมูล

แก้ไขไฟล์ `data/projects.json` หรือแปลง Excel ใหม่ให้เป็น JSON แล้วแทนที่ไฟล์เดิม จากนั้น commit/push ขึ้น GitHub

## หมายเหตุ

เวอร์ชันนี้เป็น Static Dashboard ใช้งานได้ทันทีบน GitHub Pages โดยไม่ต้องติดตั้ง Node.js และไม่ต้องมี Database
