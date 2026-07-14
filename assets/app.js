const THB = new Intl.NumberFormat('th-TH');
const CONFIG = window.NAN_DEVELOPMENT_CONFIG || {};
const state = { projects: [], filtered: [], sdgs: [], totalBudget: 0, sourceStatus: [], activeForm: 'all', activeCategory: 'all' };

const $ = id => document.getElementById(id);
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const sum = (arr, fn) => arr.reduce((a, x) => a + Number(fn(x) || 0), 0);
const groupBy = (arr, fn) => arr.reduce((m, x) => { const k = typeof fn === 'function' ? fn(x) : x[fn]; (m[k || 'ไม่ระบุ'] ??= []).push(x); return m; }, {});
function money(v){v=Number(v||0);if(v>=1e9)return `${(v/1e9).toFixed(2)} พันล้านบาท`;if(v>=1e6)return `${(v/1e6).toFixed(2)} ล้านบาท`;return `${THB.format(v)} บาท`;}
function pct(v){return `${Number(v||0).toFixed(2)}%`;}
function normalizeHeader(v){return String(v||'').trim().toLowerCase().replace(/[\s\n\r()（）._\-–—/\\:]+/g,'');}
function firstValue(row, aliases){for(const a of aliases){const k=normalizeHeader(a);if(row[k]!==undefined&&String(row[k]).trim()!=='')return String(row[k]).trim();}return '';}
function parseNumber(v){const n=Number(String(v||'').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:0;}
function extractSdgs(v){return [...new Set((String(v||'').match(/(?:sdg\s*)?(1[0-7]|[1-9])/gi)||[]).map(x=>Number(x.replace(/\D/g,''))).filter(n=>n>=1&&n<=17))].sort((a,b)=>a-b);}
function hasAny(text, words){text=String(text||'').toLowerCase();return words.some(w=>text.includes(w.toLowerCase()));}
function levelClass(a){a=String(a||'');if(a.includes('สูง'))return 'level-high';if(a.includes('ต่ำ')||a.includes('ปรับปรุง'))return 'level-low';if(a.includes('ปานกลาง'))return 'level-mid';return 'level-none';}
function sdgPills(s){return (s?.length?s:[]).map(x=>`<span class="pill">SDG ${x}</span>`).join('')||'<span class="no-data-text">ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)</span>';}
function normalizeCategory(v){const t=String(v||'').trim().toLowerCase();if(t==='social'||/สังคม|คุณภาพชีวิต|การศึกษา|สุขภาพ/.test(t))return 'สังคม';if(t==='tour'||/ท่อง/.test(t))return 'ท่องเที่ยว';if(t==='env'||/ทรัพ|สิ่งแวดล้อม|น้ำ|ป่า/.test(t))return 'ทรัพยากร';if(t==='trade'||/ค้า|ลงทุน|บริการ|โลจิสติกส์/.test(t))return 'การค้า';if(t==='agri'||/เกษตร|ปศุสัตว์|ประมง/.test(t))return 'เกษตร';return t||'ไม่ระบุกลุ่ม';}

const FIELD_ALIASES = {
  sequence:['ลำดับ','ลำดับที่','no','number'], category:['กลุ่ม','กลุ่มโครงการ','หมวดหมู่','ประเภทโครงการ'],
  projectName:['ชื่อโครงการ','โครงการ','ชื่อกิจกรรม'], developmentIssue:['ประเด็นการพัฒนา','ประเด็นยุทธศาสตร์'],
  developmentApproach:['แนวทางการพัฒนา','แนวทางพัฒนา'], plan:['แผนงานหลัก','แผนงานที่สอดคล้อง','แผนงาน'],
  alignedPlan:['แผนงานที่สอดคล้อง'], alignedIndicatorTarget:['ตัวชี้วัดและค่าเป้าหมายที่สอดคล้อง'],
  alignedProvincialGoal:['เป้าหมายการพัฒนาจังหวัด5ปีที่สอดคล้อง','เป้าหมายการพัฒนาจังหวัด (5 ปี) ที่สอดคล้อง'],
  indicator:['ตัวชี้วัดโครงการ','ตัวชี้วัดของโครงการ','ตัวชี้วัดของแผน','ตัวชี้วัดที่สนับสนุน','ตัวชี้วัดและค่าเป้าหมาย','ตัวชี้วัด'],
  agency:['หน่วยงานรับผิดชอบ','หน่วยงานเจ้าของโครงการ','หน่วยงาน'],
  budget:['งบประมาณรวมบาท','งบประมาณรวม','งบประมาณปี2571บาท','งบประมาณบาท','งบประมาณ'],
  output:['ผลผลิตoutput','ผลผลิต','output'], outcome:['ผลลัพธ์จากการดำเนินโครงการoutcome','ผลลัพธ์outcome','ผลลัพธ์','outcome'],
  sdgText:['sdgsที่สอดคล้อง','sdgs','sdg'], sdgKeyword:['คำอธิบายsdgsและkeyword','คำอธิบายsdgskeyword','keywordsdg','คำอธิบายsdgs','keyword'],
  alignment:['ระดับความสอดคล้องกับแผนปี7175','ระดับความสอดคล้อง','ความสอดคล้อง'],
  assessment:['ผลการประเมินความสอดคล้อง','จากการประเมินว่าสอดคล้องกับแผนงานตัวชี้วัดและค่าเป้าหมายเป้าหมายการพัฒนาจังหวัด5ปีหรือไม่','เหตุผลการประเมิน','เหตุผล','ผลการวิเคราะห์','จากการประเมิน'],
  criteria:['เกณฑ์ที่ใช้ประเมินกับแผนปี25712575','เกณฑ์ที่ใช้ประเมินกับแผนปี7175','เกณฑ์การประเมิน','เกณฑ์'],
  suggestion:['วิธีการแก้ไขและข้อเสนอแนะ','วิธีการแก้ไขข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง','ข้อเสนอแนะหลัก','ข้อเสนอแนะ','แนวทางปรับปรุง']
};


const PROVINCIAL_GOALS = {
  '1': 'ส่งเสริมและพัฒนาทรัพยากรมนุษย์ทุกช่วงวัยให้มีคุณภาพ พร้อมสำหรับการดำรงชีวิตในศตวรรษที่ 21',
  '2': 'ยกระดับการผลิต ภาคอุตสาหกรรม การท่องเที่ยว และการบริการ ให้จังหวัดน่านเป็นเมืองเป้าหมายด้านการลงทุน การค้าชายแดน และการค้าผ่านแดน โดยอาศัยเครือข่ายความร่วมมือจากทุกภาคส่วนและนวัตกรรมที่สอดคล้องกับบริบทของการเปลี่ยนแปลง',
  '3': 'ส่งเสริมการพัฒนาในทุกมิติ เพื่อให้เกิดการเติบโตที่เป็นมิตรต่อสิ่งแวดล้อม'
};
function planDescription(value){
  const raw=String(value||'').trim();
  const key=(raw.match(/^([123])(?:\.0+)?$/)||[])[1];
  return key&&PROVINCIAL_GOALS[key]?`${key} ${PROVINCIAL_GOALS[key]}`:(raw||'ไม่พบข้อมูล');
}

function gvizUrl(source){
  const id=encodeURIComponent(CONFIG.spreadsheetId);
  const sheet=encodeURIComponent(source.sheetName);
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${sheet}&t=${Date.now()}`;
}
function parseGviz(text){
  const start=text.indexOf('{'), end=text.lastIndexOf('}');
  if(start<0||end<0)throw new Error('รูปแบบข้อมูล Google Sheets ไม่ถูกต้อง');
  const data=JSON.parse(text.slice(start,end+1));
  const cols=(data.table?.cols||[]).map((c,i)=>normalizeHeader(c.label||c.id||`column${i+1}`));
  return (data.table?.rows||[]).map(r=>{const obj={};cols.forEach((h,i)=>{const cell=r.c?.[i];obj[h]=cell?.f??cell?.v??'';});return obj;});
}
function mapRows(rows, source){
  return rows.map((r,index)=>{
    const get=k=>firstValue(r,FIELD_ALIASES[k]);
    const sdgText=get('sdgText');
    return {
      id:`${source.id}-${get('sequence')||index+1}`, formId:source.id, formLabel:source.label, sheetName:source.sheetName,
      sequence:get('sequence')||String(index+1), category:source.id==='j11'?normalizeCategory(get('category')||get('developmentIssue')):(get('category')||source.label),
      projectName:get('projectName'), developmentIssue:source.id==='j11'?normalizeCategory(get('developmentIssue')):(get('developmentIssue')||'ไม่พบข้อมูล'), developmentApproach:get('developmentApproach')||'ไม่พบข้อมูล',
      plan:planDescription(get('plan')), indicator:get('indicator')||'ไม่พบข้อมูล', agency:get('agency')||'ไม่พบข้อมูล',
      alignedPlan:get('alignedPlan')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)', alignedIndicatorTarget:get('alignedIndicatorTarget')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)',
      alignedProvincialGoal:get('alignedProvincialGoal')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)',
      budgetText:get('budget'), budget:parseNumber(get('budget')), output:get('output')||'ไม่พบข้อมูล', outcome:get('outcome')||'ไม่พบข้อมูล',
      sdgText, sdgs:extractSdgs(sdgText), sdgKeyword:get('sdgKeyword')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)', alignment:get('alignment')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)',
      assessment:get('assessment')||'ไม่พบข้อมูล\n(อยู่ระหว่างการวิเคราะห์ข้อมูล)', criteria:get('criteria')||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)',
      suggestion:get('suggestion')||'ไม่พบข้อมูล\n(อยู่ระหว่างการวิเคราะห์ข้อมูล)'
    };
  }).filter(p=>p.projectName);
}
async function fetchSource(source){
  const response=await fetch(gvizUrl(source),{cache:'no-store'});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const projects=mapRows(parseGviz(await response.text()),source);
  if(!projects.length)throw new Error('ไม่พบข้อมูล หรือชื่อหัวคอลัมน์ไม่ตรง');
  return projects;
}
async function fetchLocal(){
  const r=await fetch(`${CONFIG.localFallbackUrl||'data/projects.json'}?t=${Date.now()}`,{cache:'no-store'});
  if(!r.ok)throw new Error('โหลดข้อมูลสำรองไม่สำเร็จ');
  const data=await r.json();
  return data.map((p,i)=>({...p,id:`local-${p.id||i+1}`,formId:'j11',formLabel:'จ.1-1',sheetName:'ข้อมูลสำรอง',category:normalizeCategory(p.category),plan:planDescription(p.plan),sdgs:p.sdgs||extractSdgs(p.sdgText),budget:Number(p.budget||0)}));
}
async function loadProjects(){
  $('dataStatus').textContent='กำลังโหลดข้อมูลล่าสุดจาก Google Sheets…';
  const results=await Promise.allSettled((CONFIG.dataSources||[]).map(async s=>({source:s,projects:await fetchSource(s)})));
  state.sourceStatus=[]; let all=[];
  results.forEach((r,i)=>{const s=CONFIG.dataSources[i];if(r.status==='fulfilled'){all.push(...r.value.projects);state.sourceStatus.push(`${s.label}: ${r.value.projects.length} โครงการ`);}else{state.sourceStatus.push(`${s.label}: โหลดไม่สำเร็จ`);console.warn(s.sheetName,r.reason);}});
  if(!all.length){all=await fetchLocal();state.sourceStatus.push('ใช้ข้อมูลสำรอง');}
  const total=sum(all,p=>p.budget); all.forEach(p=>p.budgetPercent=total?p.budget/total*100:0);
  $('dataStatus').textContent=`อัปเดต ${new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})} • ${state.sourceStatus.join(' • ')}`;
  $('dataStatus').title=state.sourceStatus.join('\n');
  return all;
}

function scoreProject(p){
  let score=35; const all=[p.projectName,p.output,p.outcome,p.indicator,p.assessment,p.criteria,p.suggestion].join(' ');
  if(p.developmentIssue!=='ไม่พบข้อมูล')score+=7;if(p.developmentApproach!=='ไม่พบข้อมูล')score+=7;if(p.plan!=='ไม่พบข้อมูล')score+=10;
  if(p.indicator!=='ไม่พบข้อมูล')score+=10;if(String(p.output).length>30)score+=8;if(String(p.outcome).length>50)score+=8;
  if((p.sdgs||[]).length>=1)score+=5;if(hasAny(all,['ร้อยละ','%','จำนวน','คน','ครัวเรือน','ราย','กิโลเมตร','เมตร','บาท','ไม่น้อยกว่า']))score+=7;
  if(String(p.alignment).includes('สูง'))score+=5;if(String(p.alignment).includes('ต่ำ'))score-=10;return Math.max(25,Math.min(98,score));
}
function suggestedOutcome(p){
  if(p.category==='ท่องเที่ยว')return 'นักท่องเที่ยวและประชาชนได้รับความสะดวกและปลอดภัยเพิ่มขึ้น ส่งผลให้รายได้จากการท่องเที่ยวของพื้นที่เพิ่มขึ้นตามค่าเป้าหมายที่กำหนด โดยติดตามจากจำนวนนักท่องเที่ยว รายได้ และระดับความพึงพอใจหลังดำเนินโครงการ';
  if(p.category==='เกษตร')return 'เกษตรกรและครัวเรือนเป้าหมายได้รับประโยชน์จากการเพิ่มประสิทธิภาพการผลิต การลดต้นทุน และการเพิ่มมูลค่าสินค้าเกษตร โดยกำหนดจำนวนผู้ได้รับประโยชน์และร้อยละการเปลี่ยนแปลงเป็นค่าเป้าหมาย';
  if(p.category==='ทรัพยากร')return 'พื้นที่และประชาชนได้รับประโยชน์จากการอนุรักษ์ ฟื้นฟู หรือบริหารจัดการทรัพยากรอย่างยั่งยืน ลดความเสี่ยงด้านสิ่งแวดล้อม และมีตัวชี้วัดด้านพื้นที่ คุณภาพทรัพยากร หรือจำนวนผู้ได้รับประโยชน์';
  if(p.category==='การค้า')return 'ผู้ประกอบการมีช่องทางตลาดและขีดความสามารถในการแข่งขันเพิ่มขึ้น ส่งผลให้ยอดขาย รายได้ หรือจำนวนผู้ประกอบการที่ได้มาตรฐานเพิ่มขึ้นตามค่าเป้าหมายที่กำหนด';
  return 'ประชาชนและกลุ่มเป้าหมายได้รับประโยชน์จากโครงการอย่างเป็นรูปธรรม โดยระบุจำนวนผู้ได้รับประโยชน์ ผลลัพธ์ที่เปลี่ยนแปลง ค่าเป้าหมาย และวิธีติดตามประเมินผลให้ชัดเจน';
}
function checklist(p){
  const all=[p.output,p.outcome,p.indicator,p.assessment,p.criteria,p.suggestion,p.sdgKeyword].join(' ');
  const quantitative=hasAny(all,['ร้อยละ','%','จำนวน','คน','ครัวเรือน','ราย','กิโลเมตร','เมตร','บาท','ไม่น้อยกว่า']);
  const beneficiary=hasAny(all,['ประชาชน','เกษตรกร','ผู้ประกอบการ','นักท่องเที่ยว','ชุมชน','ครัวเรือน','กลุ่มเป้าหมาย']);
  const followup=hasAny(all,['ติดตาม','ประเมิน','สำรวจ','รายงาน','หลังดำเนิน']);
  return [
    {title:'ประเด็นการพัฒนา',ok:p.developmentIssue!=='ไม่พบข้อมูล',found:p.developmentIssue,fix:'ระบุประเด็นการพัฒนาให้ตรงกับแผนจังหวัด และอธิบายความเชื่อมโยงกับปัญหาและความจำเป็นของโครงการ'},
    {title:'แนวทางการพัฒนา',ok:p.developmentApproach!=='ไม่พบข้อมูล',found:p.developmentApproach,fix:'ใช้ชื่อแนวทางการพัฒนาตามแผนจังหวัดฉบับเต็ม และระบุกิจกรรมของโครงการที่สนับสนุนแนวทางดังกล่าว'},
    {title:'แผนงานหลัก',ok:p.plan!=='ไม่พบข้อมูล',found:p.plan,fix:'ใช้ชื่อแผนงานหลักให้ครบถ้วนและตรงตามเอกสารแผน พร้อมระบุว่าผลผลิตและผลลัพธ์ของโครงการสนับสนุนแผนงานอย่างไร'},
    {title:'ตัวชี้วัดและค่าเป้าหมาย',ok:p.indicator!=='ไม่พบข้อมูล'&&quantitative,found:p.indicator,fix:'เพิ่มหน่วยนับ ค่าเริ่มต้น ค่าเป้าหมาย ระยะเวลา และแหล่งข้อมูล เช่น จำนวนคน ร้อยละ รายได้ ระยะทาง พื้นที่ หรือระดับความพึงพอใจ'},
    {title:'ผลผลิต (Output)',ok:String(p.output).length>30&&quantitative,found:p.output,fix:'ระบุสิ่งที่จะส่งมอบให้วัดได้ เช่น จำนวนกิจกรรม จำนวนผู้ผ่านการอบรม ระยะทาง พื้นที่ สิ่งก่อสร้าง หรือชุดองค์ความรู้'},
    {title:'ผลลัพธ์ (Outcome)',ok:String(p.outcome).length>50&&beneficiary,found:p.outcome,fix:'ระบุการเปลี่ยนแปลงที่เกิดกับผู้ได้รับประโยชน์ ไม่ใช้เพียงคำว่า “สะดวกขึ้น” หรือ “ดีขึ้น” และควรมีค่าเป้าหมาย'},
    {title:'SDGs และเหตุผล',ok:(p.sdgs||[]).length>0&&p.sdgKeyword!=='ไม่พบข้อมูล',found:`${p.sdgText||'ไม่ระบุ'} | ${p.sdgKeyword}`,fix:'เลือกเฉพาะ SDGs ที่มีความเชื่อมโยงโดยตรง ระบุ Keyword และอธิบายกลไกที่โครงการทำให้เกิดผลต่อเป้าหมายนั้น'},
    {title:'ผู้ได้รับประโยชน์และการติดตามผล',ok:beneficiary&&followup,found:beneficiary?'พบกลุ่มผู้ได้รับประโยชน์ แต่ควรตรวจสอบจำนวนและวิธีติดตาม':'ยังไม่พบข้อมูลชัดเจน',fix:'ระบุกลุ่มและจำนวนผู้ได้รับประโยชน์ วิธีเก็บข้อมูล ผู้รับผิดชอบ ความถี่ และช่วงเวลาประเมินผล'}
  ];
}
function checkHtml(c){const cls=c.ok?'ok':'bad',label=c.ok?'ครบ/ควรตรวจทาน':'ต้องปรับแก้';return `<div class="check-card ${cls}"><div class="check-head"><strong>${escapeHtml(c.title)}</strong><span class="badge">${label}</span></div><p><b>ข้อมูลที่พบ:</b> ${escapeHtml(c.found||'ไม่พบข้อมูล')}</p><div class="fix-box"><b>สิ่งที่ต้องแก้ไข:</b> ${escapeHtml(c.fix)}</div></div>`;}

async function loadSdgs(){try{const r=await fetch('data/sdgs.json');state.sdgs=await r.json();}catch{state.sdgs=Array.from({length:17},(_,i)=>({id:i+1,goal:`เป้าหมายที่ ${i+1}`}));}}
function setupNavs(){
  $('formNav').innerHTML=`<button data-form="all" class="active">Dashboard ผู้บริหาร</button>`+(CONFIG.dataSources||[]).map(s=>`<button data-form="${s.id}">${s.label}</button>`).join('');
  renderCategoryNav();
}
function renderCategoryNav(){
  const source=(CONFIG.dataSources||[]).find(s=>s.id===state.activeForm);
  const show=state.activeForm==='j11'||state.activeForm==='all';
  $('categoryNavTitle').style.display=show?'block':'none';$('categoryNav').style.display=show?'flex':'none';
  if(!show)return;
  $('categoryNav').innerHTML=`<button data-category="all" class="${state.activeCategory==='all'?'active':''}">ทุกกลุ่ม จ.1-1</button>`+['สังคม','ท่องเที่ยว','ทรัพยากร','การค้า','เกษตร'].map(c=>`<button data-category="${c}" class="${state.activeCategory===c?'active':''}">${c}</button>`).join('');
}
function rebuildOptions(){
  $('formFilter').innerHTML='<option value="all">จ.1-1 และ จ.3</option>'+(CONFIG.dataSources||[]).map(s=>`<option value="${s.id}">${s.label}</option>`).join('');
  $('formFilter').value=state.activeForm;
  const categories=state.activeForm==='j3'?[]:['สังคม','ท่องเที่ยว','ทรัพยากร','การค้า','เกษตร'];
  $('categoryFilter').innerHTML='<option value="all">ทุกกลุ่ม</option>'+categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  $('categoryFilter').value=categories.includes(state.activeCategory)?state.activeCategory:'all';
  const aligns=[...new Set(state.projects.map(p=>p.alignment||'ไม่ระบุ'))].sort();
  $('alignmentFilter').innerHTML='<option value="all">ทุกระดับความสอดคล้อง</option>'+aligns.map(a=>`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
  $('sdgFilter').innerHTML='<option value="all">ทุก SDGs</option>'+state.sdgs.map(s=>`<option value="${s.id}">SDG ${s.id} ${escapeHtml(s.goal)}</option>`).join('');
}
function updateHeading(){
  let title='Dashboard ผู้บริหาร', sub='ภาพรวมโครงการ จ.1-1 และ จ.3';
  if(state.activeForm==='j11'){title='Dashboard จ.1-1';sub=state.activeCategory==='all'?'ภาพรวมโครงการ จ.1-1 แบ่งเป็น 5 กลุ่ม':'Dashboard กลุ่ม'+state.activeCategory+' ภายใต้ จ.1-1';}
  if(state.activeForm==='j3'){title='Dashboard จ.3';sub='ภาพรวมและผลการประเมินโครงการ จ.3';}
  $('pageTitle').textContent=title;$('pageSubtitle').textContent=`${sub} พร้อมรายละเอียดสิ่งที่ต้องปรับแก้ให้สอดคล้องกับแผนงานหลัก ตัวชี้วัดโครงการ และ SDGs`;
}
function apply(){
  const q=$('searchInput').value.trim().toLowerCase(), form=$('formFilter').value, cat=$('categoryFilter').value, align=$('alignmentFilter').value, sdg=$('sdgFilter').value;
  state.activeForm=form;state.activeCategory=cat;renderCategoryNav();updateHeading();
  document.querySelectorAll('#formNav button').forEach(b=>b.classList.toggle('active',b.dataset.form===form));
  state.filtered=state.projects.filter(p=>{
    const hay=Object.values(p).join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(form==='all'||p.formId===form)&&(cat==='all'||p.category===cat)&&(align==='all'||p.alignment===align)&&(sdg==='all'||(p.sdgs||[]).map(String).includes(sdg));
  });render();
}
function render(){renderKpis();renderBars();renderTop();renderSdgs();renderTable();}
function renderKpis(){const total=sum(state.filtered,p=>p.budget);$('totalProjects').textContent=THB.format(state.filtered.length);$('totalBudget').textContent=money(total);$('budgetRatio').textContent=`${pct(state.totalBudget?total/state.totalBudget*100:0)} ของงบทั้งหมด`;$('highProjects').textContent=THB.format(state.filtered.filter(p=>String(p.alignment).includes('สูง')).length);$('improveProjects').textContent=THB.format(state.filtered.filter(p=>/ปานกลาง|ต่ำ|ปรับปรุง/.test(String(p.alignment))).length);}
function bar(id,items){const max=Math.max(...items.map(x=>x.value),1);$(id).innerHTML=items.length?items.map(x=>`<div class="bar-row"><div class="bar-label" title="${escapeHtml(x.label)}">${escapeHtml(x.label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,x.value/max*100)}%"></div></div><div class="bar-value">${x.text}</div></div>`).join(''):'<div class="empty">ไม่พบข้อมูล</div>';}
function groupingLabel(p){return state.activeForm==='all'?`${p.formLabel} • ${p.category}`:p.category;}
function renderBars(){const total=sum(state.filtered,p=>p.budget);$('categoryCaption').textContent=`รวม ${THB.format(state.filtered.length)} โครงการ`;bar('categoryChart',Object.entries(groupBy(state.filtered,groupingLabel)).map(([label,a])=>({label,value:a.length,text:`${a.length} โครงการ`})).sort((a,b)=>b.value-a.value));bar('budgetCategoryChart',Object.entries(groupBy(state.filtered,groupingLabel)).map(([label,a])=>{const v=sum(a,p=>p.budget);return{label,value:v,text:`${money(v)} • ${pct(total?v/total*100:0)}`};}).sort((a,b)=>b.value-a.value));bar('alignmentChart',Object.entries(groupBy(state.filtered,'alignment')).map(([label,a])=>({label,value:a.length,text:`${a.length} โครงการ`})).sort((a,b)=>b.value-a.value));}
function renderTop(){$('topBudgetList').innerHTML=[...state.filtered].sort((a,b)=>b.budget-a.budget).slice(0,5).map((p,i)=>`<div class="top-item"><p class="top-title"><span class="rank">${i+1}</span>${escapeHtml(p.projectName)}</p><div class="top-meta">${escapeHtml(p.formLabel)} • ${escapeHtml(p.category)} • ${money(p.budget)} • ${pct(p.budgetPercent)}</div></div>`).join('')||'<div class="empty">ไม่พบข้อมูล</div>';}
function renderSdgs(){const c={},b={};state.filtered.forEach(p=>(p.sdgs||[]).forEach(s=>{c[s]=(c[s]||0)+1;b[s]=(b[s]||0)+p.budget;}));const total=sum(state.filtered,p=>p.budget);$('sdgCaption').textContent=`พบ ${Object.keys(c).length} เป้าหมาย`;$('sdgGrid').innerHTML=state.sdgs.map(s=>`<div class="sdg-card ${c[s.id]?'active':''}"><div class="sdg-code">SDG ${s.id}</div><div class="sdg-goal">${escapeHtml(s.goal)}</div><div class="sdg-metric">${THB.format(c[s.id]||0)}</div><small>${money(b[s.id]||0)} • ${pct(total?(b[s.id]||0)/total*100:0)}</small></div>`).join('');}
function renderTable(){
  $('resultCount').textContent=`แสดง ${THB.format(state.filtered.length)} รายการ`;
  $('tableBody').innerHTML=state.filtered.map(p=>{
    const tableSdgs=(p.sdgs||[]).length
      ? sdgPills(p.sdgs)
      : '<span class="no-data-text">ไม่พบข้อมูล</span>';
    const rawAlignment=String(p.alignment||'').trim();
    const tableAlignment=(!rawAlignment||rawAlignment==='ไม่ระบุ'||rawAlignment==='ไม่พบข้อมูล'||rawAlignment.includes('อยู่ระหว่างการวิเคราะห์ข้อมูล'))
      ? 'ไม่พบข้อมูล'
      : rawAlignment;
    return `<tr><td><b>${escapeHtml(p.formLabel)}</b></td><td>${escapeHtml(p.category)}</td><td class="project-cell"><strong>${escapeHtml(p.projectName)}</strong><div class="muted">${escapeHtml(p.agency)}</div></td><td class="plan-cell"><span><b>แผนงาน:</b> ${escapeHtml(p.plan)}</span><span><b>ตัวชี้วัดโครงการ:</b> ${escapeHtml(p.indicator)}</span></td><td class="money">${money(p.budget)}</td><td class="pct">${pct(p.budgetPercent)}</td><td>${tableSdgs}</td><td><span class="level ${levelClass(tableAlignment)}">${escapeHtml(tableAlignment)}</span></td><td><button class="detail-open" onclick="detail('${escapeHtml(p.id)}')">เปิดรายงาน</button></td></tr>`;
  }).join('')||'<tr><td colspan="9" class="empty">ไม่พบข้อมูล</td></tr>';
}
window.detail=function(id){const p=state.projects.find(x=>x.id===id);if(!p)return;const score=scoreProject(p);$('detailCategory').textContent=`${p.formLabel} • ${p.category} • ${money(p.budget)} • ${pct(p.budgetPercent)} ของงบรวม`;$('detailTitle').textContent=p.projectName;$('detailBody').innerHTML=`<div class="detail-grid"><div class="assessment-box full"><div class="score-wrap"><div class="score">${score}<small>Alignment Score / 100</small></div><div><div class="progress"><span style="width:${score}%"></span></div><p class="muted">คะแนนจากความครบถ้วนของประเด็นและแนวทางพัฒนา แผนงานหลัก ตัวชี้วัดโครงการ Output Outcome SDGs ค่าเป้าหมาย และผู้ได้รับประโยชน์</p></div></div></div><div class="detail-card"><h4>ข้อมูลโครงการ</h4><p>ประเภท: ${escapeHtml(p.formLabel)}\nหน่วยงาน: ${escapeHtml(p.agency)}\nกลุ่ม: ${escapeHtml(p.category)}\nงบประมาณ: ${money(p.budget)} (${pct(p.budgetPercent)})</p></div><div class="detail-card evaluation-sdg-card"><h4>ผลประเมินและ SDGs</h4><div class="evaluation-sdg-list"><div class="evaluation-sdg-item alignment-item"><div class="evaluation-sdg-label">ระดับความสอดคล้อง</div><div><span class="level ${levelClass(p.alignment)}">${escapeHtml(p.alignment && p.alignment !== 'ไม่ระบุ' ? p.alignment : 'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)')}</span></div></div><div class="evaluation-sdg-item"><div class="evaluation-sdg-label">SDGs ที่สอดคล้อง</div><div class="evaluation-sdg-values">${sdgPills(p.sdgs)}</div></div><div class="evaluation-sdg-item keyword-item"><div class="evaluation-sdg-label">Keyword ที่ตรวจพบ</div><div class="keyword-list">${String(p.sdgKeyword||'').split(/[\n,;|]+/).map(k=>k.trim()).filter(Boolean).map(k=>`<span class="keyword-chip">${escapeHtml(k)}</span>`).join('')||'<span class="no-data-text">ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)</span>'}</div></div></div></div><div class="detail-card aligned-data-card"><h4>ข้อมูลที่สอดคล้องกับแผนจังหวัด (ผลจากการวิเคราะห์)</h4><div class="aligned-data-list"><div class="aligned-data-item"><strong>แผนงานที่สอดคล้อง</strong><p>${escapeHtml(p.alignedPlan||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)')}</p></div><div class="aligned-data-item"><strong>ตัวชี้วัดและค่าเป้าหมายที่สอดคล้อง</strong><p>${escapeHtml(p.alignedIndicatorTarget||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)')}</p></div><div class="aligned-data-item"><strong>เป้าหมายการพัฒนาจังหวัด (5 ปี) ที่สอดคล้อง</strong><p>${escapeHtml(p.alignedProvincialGoal||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)')}</p></div></div></div><div class="detail-card full criteria"><h4>ความเชื่อมโยงกับแผนพัฒนาจังหวัด</h4><div class="plan-group"><div class="plan-box issue"><div class="plan-box-title">ประเด็นการพัฒนา</div><div class="plan-box-content">${escapeHtml(p.developmentIssue||'ไม่พบข้อมูล')}</div></div><div class="plan-box approach"><div class="plan-box-title">แนวทางการพัฒนา</div><div class="plan-box-content">${escapeHtml(p.developmentApproach||'ไม่พบข้อมูล')}</div></div><div class="plan-box main-plan"><div class="plan-box-title">แผนงานหลัก</div><div class="plan-box-content">${escapeHtml(p.plan||'ไม่พบข้อมูล')}</div></div><div class="plan-box indicator"><div class="plan-box-title">ตัวชี้วัดโครงการ</div><div class="plan-box-content ${!p.indicator||p.indicator==='ไม่พบข้อมูล'?'no-data':''}">${escapeHtml(p.indicator||'ไม่พบข้อมูล')}</div></div><div class="plan-box criteria-box"><div class="plan-box-title">เกณฑ์ที่ใช้ประเมินกับแผนปี 2571–2575 (ผลจากการวิเคราะห์)</div><div class="plan-box-content ${!p.criteria||p.criteria==='ไม่พบข้อมูล'?'no-data':''}">${escapeHtml(p.criteria||'ไม่พบข้อมูล (อยู่ระหว่างการวิเคราะห์ข้อมูล)')}</div></div></div></div><div class="detail-card"><h4>Output ที่ระบุ</h4><p>${escapeHtml(p.output)}</p></div><div class="detail-card"><h4>Outcome ที่ระบุ</h4><p>${escapeHtml(p.outcome)}</p></div><div class="detail-card full"><h4>ผลการประเมินความสอดคล้อง (ผลจากการวิเคราะห์)</h4><p>${escapeHtml(p.assessment)}</p></div><div class="detail-card full recommend"><h4>ข้อเสนอแนะหลัก</h4><p>${escapeHtml(p.suggestion)}</p></div></div>`;$('detailDialog').showModal();};

function bind(){
  ['searchInput','formFilter','categoryFilter','alignmentFilter','sdgFilter'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='formFilter'){state.activeForm=$(id).value;state.activeCategory='all';rebuildOptions();}apply();}));
  $('formNav').addEventListener('click',e=>{if(!e.target.matches('button'))return;state.activeForm=e.target.dataset.form;state.activeCategory='all';rebuildOptions();apply();});
  $('categoryNav').addEventListener('click',e=>{if(!e.target.matches('button'))return;state.activeForm='j11';state.activeCategory=e.target.dataset.category;rebuildOptions();apply();});
  $('resetBtn').onclick=()=>{$('searchInput').value='';state.activeForm='all';state.activeCategory='all';rebuildOptions();apply();};
  $('closeDialog').onclick=()=>$('detailDialog').close();
}
async function refresh(){const projects=await loadProjects();state.projects=projects;state.totalBudget=sum(projects,p=>p.budget);rebuildOptions();apply();}
async function init(){await loadSdgs();state.projects=await loadProjects();state.totalBudget=sum(state.projects,p=>p.budget);setupNavs();rebuildOptions();bind();apply();setInterval(refresh,Math.max(60000,Number(CONFIG.refreshIntervalMs||300000)));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});}
init().catch(err=>{console.error(err);document.body.innerHTML=`<pre style="padding:24px">โหลดระบบไม่สำเร็จ: ${escapeHtml(err.message)}</pre>`;});
