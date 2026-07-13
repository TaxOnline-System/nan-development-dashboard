/**
 * Backend สำหรับ Google Sheets + AI Analysis + GitHub Pages
 * ตั้งค่า Script Properties:
 * SPREADSHEET_ID, SHEET_NAME, AI_API_KEY, AI_API_URL, AI_MODEL, ALLOWED_ORIGIN
 */
const OUTPUT_HEADERS = [
  'แผนงานที่สอดคล้อง',
  'ตัวชี้วัดและค่าเป้าหมายที่สอดคล้อง',
  'เป้าหมายการพัฒนาจังหวัด (5 ปี) ที่สอดคล้อง',
  'SDGs ที่สอดคล้อง',
  'คำอธิบาย SDGs & Keyword',
  'ระดับความสอดคล้อง',
  'จากการประเมินว่าสอดคล้องกับแผนงาน ตัวชี้วัดและค่าเป้าหมาย เป้าหมายการพัฒนาจังหวัด (5 ปี) หรือไม่',
  'เกณฑ์ที่ใช้ประเมินกับแผนปี 71–75',
  'วิธีการแก้ไข / ข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง',
  'สถานะการวิเคราะห์',
  'วิเคราะห์ล่าสุด',
  'Analysis Hash'
];

const CRITERIA = {
  plans: [
    '1 ขยายผลการพัฒนาเมืองอัจฉริยะในท้องถิ่น เชื่อมโยงเครือข่ายเมืองอัจฉริยะในระดับประเทศ',
    '2 พัฒนาเส้นทางท่องเที่ยว แหล่งท่องเที่ยว สินค้าและบริการ และผู้ประกอบการในอุตสาหกรรมการท่องเที่ยว เพื่อรองรับการเป็นเมืองสร้างสรรค์และเมืองมรดกโลก',
    '3 ยกระดับการผลิตภาคการเกษตรทั้งระบบ และเพิ่มศักยภาพเกษตรกร กลุ่มเกษตรกร และสถาบันเกษตรกร ตามแนวทาง BCG',
    '4 พัฒนาการแปรรูปผลผลิตทางการเกษตรภายใต้มาตรฐาน เชื่อมโยงตลาด และการจัดการระบบโลจิสติกส์ภาคการเกษตร',
    '5 ขยายช่องทางการตลาดสินค้าเกษตร ส่งเสริมการลงทุนภาคการเกษตร และเพิ่มขีดความสามารถในการแข่งขัน',
    '6 ขับเคลื่อนและขยายผลโครงการอันเนื่องมาจากพระราชดำริ',
    '7 สร้างสิ่งแวดล้อมการเรียนรู้เพื่อสนับสนุนและส่งเสริมให้คนทุกช่วงวัยมีทักษะแห่งศตวรรษที่ 21 และการเรียนรู้อย่างต่อเนื่องตลอดชีวิต และการเข้าถึงบริการทางการแพทย์และสุขภาพ เพื่อให้คนน่านมีสุขภาวะที่ดีอย่างต่อเนื่อง และสามารถแก้ไขปัญหาสำคัญของจังหวัด',
    '8 ส่งเสริมการใช้ประโยชน์จากทรัพยากรธรรมชาติภายใต้แนวคิดการพัฒนาเศรษฐกิจ สังคม และสิ่งแวดล้อมที่ยั่งยืน (SDGs) อาทิ การพัฒนาระบบคาร์บอนเครดิต (Carbon Credit)'
  ],
  indicators: [
    '1 อัตราการขยายตัวของรายได้จากการท่องเที่ยว ไม่น้อยกว่าร้อยละ 20 ต่อปี',
    '2 ผลิตภัณฑ์มวลรวมจังหวัด (GPP) ภาคเกษตรกรรมเพิ่มขึ้นอย่างน้อยร้อยละ 0.5 ต่อปี',
    '3 อัตราการขยายตัวของมูลค่าสินค้าเกษตรปลอดภัย (สินค้า GAP ขยายตัวร้อยละ 4 และสินค้าเกษตรอินทรีย์ขยายตัวร้อยละ 4)',
    '4 โครงสร้างพื้นฐานเพื่อการเกษตร การบริหารจัดการน้ำ การค้า การลงทุน และการท่องเที่ยว รวมทั้งการเพิ่มศักยภาพและส่งเสริมกิจกรรมการค้าและการลงทุน ได้รับการพัฒนา',
    '4.1 สายทางได้รับการพัฒนาเพิ่มขึ้นอย่างน้อย 5 สายทางต่อปี',
    '4.2 แหล่งน้ำหรือระบบบริหารจัดการน้ำได้รับการพัฒนาเพิ่มขึ้นอย่างน้อย 5 แห่งต่อปี',
    '5 คนน่านทุกช่วงวัยได้รับการพัฒนาคุณภาพชีวิตที่ดีขึ้น ตามดัชนีความก้าวหน้าของคน (HAI) ทั้ง 8 มิติ ไม่น้อยกว่าร้อยละ 66 ต่อปี',
    '6 อายุคาดเฉลี่ยของคนน่าน 79 ปี',
    '7 ร้อยละของพื้นที่ที่ได้รับการแก้ไขปัญหาการใช้ประโยชน์ การอยู่อาศัย และการทำกินตามมติคณะรัฐมนตรีและโครงการจัดที่ดินทำกินให้ชุมชนตามนโยบายรัฐบาล (คทช.) เพิ่มขึ้นร้อยละ 80',
    '8 ร้อยละของประชากรที่อยู่ภายใต้เส้นความยากจนลดลงร้อยละ 8',
    '9 กลุ่มเปราะบางในระบบบริหารจัดการข้อมูลการพัฒนาคนแบบชี้เป้า (TPMAP) ได้รับการช่วยเหลืออย่างน้อยร้อยละ 25',
    '10 ร้อยละของพื้นที่ป่าทุกประเภทเพิ่มขึ้นร้อยละ 0.16',
    '11 จำนวนจุดความร้อน (Hotspot) ลดลงร้อยละ 10 เมื่อเทียบกับค่าเฉลี่ยย้อนหลัง 5 ปี',
    '12 ขยะทุกประเภทได้รับการจัดการอย่างถูกต้องตามประเภท และสามารถนำกลับมาหมุนเวียนสร้างคุณค่าด้วยกระบวนการที่เหมาะสม ไม่น้อยกว่าร้อยละ 60'
  ],
  goals: [
    '1 ส่งเสริมและพัฒนาทรัพยากรมนุษย์ทุกช่วงวัยให้มีคุณภาพ พร้อมสำหรับการดำรงชีวิตในศตวรรษที่ 21',
    '2 ยกระดับการผลิต ภาคอุตสาหกรรม การท่องเที่ยว และการบริการ ให้จังหวัดน่านเป็นเมืองเป้าหมายด้านการลงทุน การค้าชายแดน และการค้าผ่านแดน โดยอาศัยเครือข่ายความร่วมมือจากทุกภาคส่วนและนวัตกรรมที่สอดคล้องกับบริบทของการเปลี่ยนแปลง',
    '3 ส่งเสริมการพัฒนาในทุกมิติ เพื่อให้เกิดการเติบโตที่เป็นมิตรต่อสิ่งแวดล้อม'
  ]
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'list') return json_({ok:true, rows:readRows_(), generatedAt:new Date().toISOString()});
    if (action === 'health') return json_({ok:true, service:'nan-ai-dashboard'});
    return json_({ok:false,error:'Unknown action'});
  } catch (err) { return json_({ok:false,error:String(err.message || err)}); }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.action === 'analyzeRow') return json_({ok:true,result:analyzeSheetRow_(Number(body.row))});
    if (body.action === 'analyzeAll') { analyzeAll_(); return json_({ok:true}); }
    return json_({ok:false,error:'Unknown action'});
  } catch (err) { return json_({ok:false,error:String(err.message || err)}); }
}

function onEditInstalled(e) {
  if (!e || !e.range || e.range.getRow() < 2) return;
  const sheet = getSheet_();
  if (e.range.getSheet().getSheetId() !== sheet.getSheetId()) return;
  analyzeSheetRow_(e.range.getRow());
}

function analyzeAll_() {
  const sheet=getSheet_();
  ensureOutputHeaders_(sheet);
  const values=sheet.getDataRange().getDisplayValues();
  for(let r=2;r<=values.length;r++) analyzeSheetRow_(r);
}

function analyzeSheetRow_(rowNumber) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sheet=getSheet_(); ensureOutputHeaders_(sheet);
    const range=sheet.getDataRange(); const values=range.getDisplayValues();
    if(rowNumber<2 || rowNumber>values.length) throw new Error('Row out of range');
    const headers=values[0]; const row=values[rowNumber-1]; const obj=rowToObject_(headers,row);
    const inputHeaders=headers.filter(h=>h && !OUTPUT_HEADERS.includes(h));
    const projectInput={}; inputHeaders.forEach(h=>projectInput[h]=obj[h]);
    const hash=sha256_(JSON.stringify(projectInput));
    if(obj['Analysis Hash']===hash && obj['สถานะการวิเคราะห์']==='วิเคราะห์แล้ว') return {skipped:true,row:rowNumber};
    setCellByHeader_(sheet,rowNumber,'สถานะการวิเคราะห์','กำลังวิเคราะห์');
    SpreadsheetApp.flush();
    const result=callAi_(projectInput);
    validateResult_(result);
    const mapping={
      'แผนงานที่สอดคล้อง':result.plans,
      'ตัวชี้วัดและค่าเป้าหมายที่สอดคล้อง':result.indicators,
      'เป้าหมายการพัฒนาจังหวัด (5 ปี) ที่สอดคล้อง':result.provincial_goals,
      'SDGs ที่สอดคล้อง':result.sdgs,
      'คำอธิบาย SDGs & Keyword':result.sdg_keywords,
      'ระดับความสอดคล้อง':result.alignment_level,
      'จากการประเมินว่าสอดคล้องกับแผนงาน ตัวชี้วัดและค่าเป้าหมาย เป้าหมายการพัฒนาจังหวัด (5 ปี) หรือไม่':result.assessment,
      'เกณฑ์ที่ใช้ประเมินกับแผนปี 71–75':result.criteria_used,
      'วิธีการแก้ไข / ข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง':result.recommendations,
      'สถานะการวิเคราะห์':'วิเคราะห์แล้ว',
      'วิเคราะห์ล่าสุด':Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Bangkok','dd/MM/yyyy HH:mm:ss'),
      'Analysis Hash':hash
    };
    Object.keys(mapping).forEach(h=>setCellByHeader_(sheet,rowNumber,h,toCell_(mapping[h])));
    return {skipped:false,row:rowNumber};
  } catch(err) {
    try { setCellByHeader_(getSheet_(),rowNumber,'สถานะการวิเคราะห์','เกิดข้อผิดพลาด: '+String(err.message||err).slice(0,180)); } catch(_){ }
    throw err;
  } finally { lock.releaseLock(); }
}

function callAi_(projectInput) {
  const props=PropertiesService.getScriptProperties();
  const key=props.getProperty('AI_API_KEY'); const url=props.getProperty('AI_API_URL'); const model=props.getProperty('AI_MODEL');
  if(!key||!url||!model) throw new Error('กรุณาตั้งค่า AI_API_KEY, AI_API_URL และ AI_MODEL ใน Script Properties');
  const prompt=`คุณเป็นนักวิเคราะห์โครงการภาครัฐจังหวัดน่าน วิเคราะห์เฉพาะข้อมูลที่ให้ ห้ามสร้างข้อเท็จจริง หากข้อมูลไม่พอให้ระบุว่าไม่พบข้อมูล\n\nเกณฑ์แผนพัฒนาจังหวัด พ.ศ. 2571–2575:\n${JSON.stringify(CRITERIA,null,2)}\n\nข้อมูลโครงการ:\n${JSON.stringify(projectInput,null,2)}\n\nข้อกำหนด:\n- ชื่อ SDGs ต้องเขียนชื่อเต็มภาษาไทย ห้ามย่อชื่อเป้าหมาย\n- sdg_keywords ต้องระบุ SDG ข้อใดและ Keyword ที่จับคู่\n- alignment_level เลือกเพียง สูงมาก, สูง, ปานกลาง, ควรปรับปรุง\n- ประเมินจากวัตถุประสงค์ กิจกรรม ผลผลิต ผลลัพธ์ ตัวชี้วัด ค่าเป้าหมาย กลุ่มเป้าหมาย และงบประมาณที่ปรากฏจริง\n- ส่ง JSON เท่านั้น ตาม schema ที่กำหนด`;
  const schema={plans:['ข้อความ'],indicators:['ข้อความ'],provincial_goals:['ข้อความ'],sdgs:['ข้อความชื่อเต็ม'],sdg_keywords:['SDG X ...: keyword ...'],alignment_level:'สูงมาก|สูง|ปานกลาง|ควรปรับปรุง',assessment:'ข้อความ',criteria_used:'ข้อความ',recommendations:'ข้อความ'};
  const payload={model:model,messages:[{role:'system',content:'ตอบเป็น JSON ที่ parse ได้เท่านั้น'},{role:'user',content:prompt+'\nSchema:\n'+JSON.stringify(schema)}],temperature:0.1,response_format:{type:'json_object'}};
  const res=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+key},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const code=res.getResponseCode(); const text=res.getContentText();
  if(code<200||code>=300) throw new Error('AI API '+code+': '+text.slice(0,500));
  const data=JSON.parse(text); const content=data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if(!content) throw new Error('ไม่พบผลลัพธ์จาก AI');
  return JSON.parse(String(content).replace(/^```json\s*|\s*```$/g,''));
}

function validateResult_(r){['plans','indicators','provincial_goals','sdgs','sdg_keywords','alignment_level','assessment','criteria_used','recommendations'].forEach(k=>{if(r[k]===undefined) throw new Error('AI response missing '+k)});if(!['สูงมาก','สูง','ปานกลาง','ควรปรับปรุง'].includes(r.alignment_level)) r.alignment_level='ควรปรับปรุง';}
function readRows_(){const s=getSheet_();ensureOutputHeaders_(s);const v=s.getDataRange().getDisplayValues();if(v.length<2)return[];return v.slice(1).filter(r=>r.some(Boolean)).map(r=>rowToObject_(v[0],r));}
function getSheet_(){const p=PropertiesService.getScriptProperties();const id=p.getProperty('SPREADSHEET_ID');if(!id)throw new Error('ยังไม่ได้ตั้งค่า SPREADSHEET_ID');const ss=SpreadsheetApp.openById(id);const name=p.getProperty('SHEET_NAME');return name?ss.getSheetByName(name):ss.getSheets()[0];}
function ensureOutputHeaders_(s){const last=Math.max(1,s.getLastColumn());const headers=s.getRange(1,1,1,last).getDisplayValues()[0];OUTPUT_HEADERS.forEach(h=>{if(!headers.includes(h)){s.getRange(1,s.getLastColumn()+1).setValue(h);headers.push(h)}});}
function setCellByHeader_(s,row,h,val){const headers=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0];const col=headers.indexOf(h)+1;if(!col)throw new Error('Header not found: '+h);s.getRange(row,col).setValue(val);}
function rowToObject_(h,r){const o={};h.forEach((x,i)=>{if(x)o[x]=r[i]});return o;}
function toCell_(v){return Array.isArray(v)?v.join('\n'):String(v??'ไม่พบข้อมูล');}
function sha256_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('');}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
