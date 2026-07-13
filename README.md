# nan-development

Dashboard ติดตามความสอดคล้องโครงการจังหวัดน่านกับแผนพัฒนาจังหวัด ตัวชี้วัด แผนงานหลัก และ SDGs พร้อมดึงข้อมูลจาก Google Sheets โดยอัตโนมัติ

## แหล่งข้อมูลที่ตั้งค่าไว้

- Spreadsheet ID: `15oinAJNrPYt3utkaJ9XszfsMkydKO5HBxtC7U-OOIm0`
- Sheet GID: `1020842207`
- รีเฟรชอัตโนมัติทุก 5 นาที และทุกครั้งที่ผู้ใช้กลับมาเปิดแท็บเว็บ
- หาก Google Sheets เข้าถึงไม่ได้ ระบบจะใช้ `data/projects.json` เป็นข้อมูลสำรอง

## ตั้งค่าสิทธิ์ Google Sheets

เพื่อให้ GitHub Pages อ่านข้อมูลได้ ให้ตั้งค่าไฟล์ Google Sheets อย่างใดอย่างหนึ่ง:

1. กด **Share** แล้วตั้ง General access เป็น **Anyone with the link – Viewer**
2. หรือใช้ **File > Share > Publish to web** แล้วเผยแพร่ชีตที่ต้องการ

ห้ามใส่ข้อมูลส่วนบุคคลหรือข้อมูลลับในชีตที่เปิดเป็นสาธารณะ

## หัวคอลัมน์ที่ระบบรองรับ

ระบบรองรับชื่อหัวตารางทั้งแบบไทยและอังกฤษ โดยหัวข้อหลักที่แนะนำคือ:

| หัวคอลัมน์ |
|---|
| ลำดับ |
| กลุ่ม |
| ชื่อโครงการ |
| หน่วยงานรับผิดชอบ |
| ประเด็นการพัฒนา |
| แนวทางการพัฒนา |
| แผนงานหลัก |
| ตัวชี้วัด |
| งบประมาณรวม (บาท) |
| ผลผลิต (Output) |
| ผลลัพธ์ (Outcome) |
| SDGs ที่สอดคล้อง |
| คำอธิบาย SDGs & Keyword |
| ระดับความสอดคล้อง |
| เหตุผล / ผลการวิเคราะห์ |
| เกณฑ์ที่ใช้ประเมิน |
| ข้อเสนอแนะ |

หัวตารางต้องอยู่แถวแรกของชีต และหนึ่งโครงการต่อหนึ่งแถว

## เปลี่ยน Spreadsheet หรือ Sheet

แก้ไฟล์ `assets/config.js`

```js
window.NAN_DEVELOPMENT_CONFIG = {
  spreadsheetId: 'SPREADSHEET_ID',
  sheetGid: 'SHEET_GID',
  refreshIntervalMs: 300000,
  localFallbackUrl: 'data/projects.json'
};
```

## อัปโหลดขึ้น GitHub Pages

1. แตกไฟล์ ZIP
2. อัปโหลดไฟล์ทั้งหมดภายในโฟลเดอร์ `nan-development` ไปยัง repository
3. เปิด **Settings > Pages**
4. เลือก **Deploy from a branch**
5. เลือก branch `main` และโฟลเดอร์ `/root`
6. กด Save

หลังจากแก้ข้อมูลใน Google Sheets หน้าเว็บจะดึงข้อมูลใหม่โดยอัตโนมัติ ไม่ต้องอัปโหลด ZIP ใหม่
