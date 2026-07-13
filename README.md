# Nan AI Project Dashboard

ระบบประกอบด้วย 3 ส่วน
1. Google Sheets เป็นฐานข้อมูลหลัก
2. Google Apps Script เป็น API และส่วนเรียก AI
3. GitHub Pages เป็นหน้า Dashboard สาธารณะ/ภายในองค์กร

## 1) เตรียม Google Sheet
ใช้แถวที่ 1 เป็นชื่อคอลัมน์ และแต่ละโครงการอยู่ 1 แถว คอลัมน์ข้อมูลต้นทางที่แนะนำ:
- ชื่อโครงการ
- หน่วยงานรับผิดชอบ
- ประเด็นการพัฒนา
- แนวทางการพัฒนา
- วัตถุประสงค์
- กิจกรรม
- ผลผลิต (Output)
- ผลลัพธ์จากการดำเนินโครงการ (Outcome)
- ตัวชี้วัดโครงการ
- ค่าเป้าหมาย
- กลุ่มเป้าหมาย
- พื้นที่ดำเนินการ
- งบประมาณรวม (บาท)

Apps Script จะเพิ่มคอลัมน์ผลวิเคราะห์ให้อัตโนมัติ

## 2) ติดตั้ง Apps Script
1. เปิด Google Sheet > Extensions > Apps Script
2. วางไฟล์ `apps-script/Code.gs`
3. เปิด Project Settings และเพิ่ม Script Properties:
   - `SPREADSHEET_ID` = `1x73TIgDGg736RPAUsx4JGYSjtclCRNQr72SdYS2_5Kw`
   - `SHEET_NAME` = ชื่อแท็บข้อมูล เช่น `Sheet1` (เว้นว่างได้เพื่อใช้แท็บแรก)
   - `AI_API_KEY` = API Key ของผู้ให้บริการ AI
   - `AI_API_URL` = URL แบบ OpenAI-compatible chat completions
   - `AI_MODEL` = ชื่อโมเดลที่บัญชีของท่านใช้งานได้
4. Deploy > New deployment > Web app
   - Execute as: Me
   - Who has access: Anyone หรือ Anyone within organization ตามนโยบายข้อมูล
5. คัดลอก Web App URL
6. Triggers > Add Trigger
   - Function: `onEditInstalled`
   - Event source: From spreadsheet
   - Event type: On edit

> การวิเคราะห์หลังแก้ไขจะเกิดในระดับประมาณไม่กี่วินาทีถึงหนึ่งนาที ขึ้นกับ AI API และโควตา ไม่ใช่การคำนวณในเบราว์เซอร์โดยตรง

## 3) ตั้งค่า GitHub Pages
1. แก้ `config.js` และใส่ Web App URL ใน `API_URL`
2. อัปโหลดไฟล์ทั้งหมด ยกเว้นโฟลเดอร์ `apps-script` ก็ได้ ไปยัง GitHub repository
3. Settings > Pages > Deploy from a branch > main / root
4. เปิด URL ของ GitHub Pages

## 4) หลักการอัปเดตแบบอัตโนมัติ
- เมื่อแก้เซลล์ในแถวโครงการ `onEditInstalled` จะวิเคราะห์แถวนั้นใหม่
- ระบบสร้าง SHA-256 Hash จากข้อมูลต้นทาง หากข้อมูลไม่เปลี่ยนจะไม่เรียก AI ซ้ำ
- Dashboard ดึงข้อมูลใหม่ทุก 30 วินาที ปรับได้ใน `config.js`

## 5) ความปลอดภัย
- ห้ามใส่ AI API Key ใน `config.js`, `app.js` หรือ GitHub
- เก็บ API Key ใน Apps Script Properties เท่านั้น
- หากข้อมูลโครงการเป็นข้อมูลภายใน ให้จำกัด Web App เป็นผู้ใช้ในองค์กร และเพิ่มระบบล็อกอินก่อนเผยแพร่ Dashboard
- GitHub Pages เหมาะกับข้อมูลที่เปิดเผยได้ หากข้อมูลอ่อนไหวควรใช้ Hosting ที่รองรับ Authentication

## 6) ข้อเสนอแนะด้านคุณภาพการวิเคราะห์
- บังคับให้ 1 โครงการ = 1 แถว
- ห้ามรวมหลายโครงการในเซลล์เดียว
- กรอก Output, Outcome, ตัวชี้วัด และค่าเป้าหมายให้วัดผลได้
- ให้เจ้าหน้าที่ตรวจรับรองผล AI ก่อนนำไปใช้ประกอบการตัดสินใจงบประมาณ
