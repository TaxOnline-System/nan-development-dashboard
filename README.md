# nan-development

Dashboard สำหรับติดตามและวิเคราะห์ความสอดคล้องโครงการจังหวัดน่านกับแผนพัฒนาจังหวัด ตัวชี้วัด แผนงานหลัก และ SDGs พร้อมเผยแพร่ผ่าน GitHub Pages

## โครงสร้างข้อมูล

ระบบเชื่อมกับ Google Spreadsheet ID:

`15oinAJNrPYt3utkaJ9XszfsMkydKO5HBxtC7U-OOIm0`

และอ่านข้อมูลอัตโนมัติจาก 2 ชีต:

1. `Dashboard_จ.1-1`
2. `Dashboard_จ.3`

ภายใน `Dashboard_จ.1-1` ต้องมีคอลัมน์ `กลุ่ม` หรือ `กลุ่มโครงการ` และใช้ค่าใดค่าหนึ่งเท่านั้น:

- สังคม
- ท่องเที่ยว
- ทรัพยากร
- การค้า
- เกษตร

## การอัปเดตข้อมูล

- โหลดข้อมูลล่าสุดทุกครั้งที่เปิดเว็บ
- รีเฟรชอัตโนมัติทุก 5 นาที
- ตรวจสอบข้อมูลใหม่เมื่อกลับมาเปิดแท็บ
- หาก Google Sheets ใช้งานไม่ได้ ระบบจะใช้ `data/projects.json` เป็นข้อมูลสำรอง

## หัวคอลัมน์ที่รองรับ

- ลำดับ
- กลุ่ม / กลุ่มโครงการ
- ชื่อโครงการ
- หน่วยงานรับผิดชอบ
- ประเด็นการพัฒนา
- แนวทางการพัฒนา
- แผนงานหลัก / แผนงานที่สอดคล้อง
- ตัวชี้วัดของแผน / ตัวชี้วัดที่สนับสนุน
- งบประมาณรวม (บาท)
- ผลผลิต (Output)
- ผลลัพธ์จากการดำเนินโครงการ (Outcome)
- SDGs ที่สอดคล้อง
- คำอธิบาย SDGs & Keyword
- ระดับความสอดคล้อง
- เหตุผล / ผลการวิเคราะห์
- เกณฑ์การประเมิน
- ข้อเสนอแนะ

## เปิดสิทธิ์ Google Sheets

Google Sheets ต้องเปิดให้อ่านข้อมูลได้:

`Share > General access > Anyone with the link > Viewer`

หรือใช้ `File > Share > Publish to web`

## Deploy บน GitHub Pages

1. สร้าง Public repository ชื่อ `nan-development`
2. อัปโหลดไฟล์ทั้งหมดภายในโฟลเดอร์นี้ โดยให้ `index.html` อยู่ที่ root
3. ไปที่ `Settings > Pages`
4. เลือก `Deploy from a branch`
5. เลือก Branch `main` และ Folder `/ (root)`
6. กด Save และรอประมาณ 1-5 นาที

## แก้ชื่อชีตหรือ Spreadsheet

แก้ไขไฟล์ `assets/config.js`

```js
window.NAN_DEVELOPMENT_CONFIG = {
  spreadsheetId: 'SPREADSHEET_ID',
  dataSources: [
    { id: 'j11', label: 'จ.1-1', sheetName: 'Dashboard_จ.1-1' },
    { id: 'j3', label: 'จ.3', sheetName: 'Dashboard_จ.3' }
  ]
};
```

## การแบ่งกลุ่ม จ.1-1 จากคอลัมน์ "ประเด็นการพัฒนา"
ระบบรองรับรหัสใน Google Sheets ดังนี้:
- social = สังคม
- tour = ท่องเที่ยว
- env = ทรัพยากร
- trade = การค้า
- agri = เกษตร

ระบบจะอ่านจากคอลัมน์ "กลุ่ม" ก่อน และถ้าไม่มี จะอ่านจากคอลัมน์ "ประเด็นการพัฒนา" อัตโนมัติ
