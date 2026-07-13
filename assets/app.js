const cfg = window.APP_CONFIG || {};
const state = { rows: [], filtered: [] };
const $ = (id) => document.getElementById(id);

function levelClass(level='') {
  if (/สูงมาก|สูง/.test(level)) return 'badge-high';
  if (/ปานกลาง/.test(level)) return 'badge-medium';
  return 'badge-low';
}
function money(v){const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n.toLocaleString('th-TH',{maximumFractionDigits:0})+' บาท':'0 บาท'}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function pick(r, names){for(const n of names){if(r[n]!==undefined && r[n]!==null && String(r[n]).trim()!=='') return r[n]}return ''}
function projectName(r){return pick(r,['ชื่อโครงการ','โครงการ','project_name','Project Name']) || 'ไม่พบชื่อโครงการ'}
function agency(r){return pick(r,['หน่วยงานรับผิดชอบ','หน่วยงาน','agency']) || 'ไม่พบข้อมูล'}
function analysis(r,key){return pick(r,[key,`ผลวิเคราะห์_${key}`]) || 'ไม่พบข้อมูล'}

async function loadData(){
  const url=cfg.API_URL;
  if(!url || url.includes('PUT_YOUR')){showError('กรุณากำหนด API_URL ในไฟล์ config.js หลัง Deploy Google Apps Script เป็น Web App');return}
  setSync('กำลังอัปเดตข้อมูล',false);
  try{
    const res=await fetch(`${url}${url.includes('?')?'&':'?'}action=list&t=${Date.now()}`,{cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload=await res.json();
    if(payload.ok===false) throw new Error(payload.error||'API error');
    state.rows=Array.isArray(payload.rows)?payload.rows:[];
    buildFilters(); applyFilters();
    $('lastUpdated').textContent='อัปเดต '+new Date().toLocaleString('th-TH');
    setSync('เชื่อมต่อข้อมูลแล้ว',true); hideError();
  }catch(e){setSync('เชื่อมต่อไม่สำเร็จ',false,true);showError('ไม่สามารถโหลดข้อมูลได้: '+e.message)}
}
function setSync(text,ok,error=false){$('syncStatus').textContent=text;$('syncDot').className='dot'+(ok?' ok':'')+(error?' error':'')}
function showError(msg){$('alert').textContent=msg;$('alert').classList.remove('hidden')}
function hideError(){$('alert').classList.add('hidden')}
function buildFilters(){
  const levels=[...new Set(state.rows.map(r=>analysis(r,'ระดับความสอดคล้อง')).filter(Boolean))].sort();
  const plans=[...new Set(state.rows.flatMap(r=>String(analysis(r,'แผนงานที่สอดคล้อง')).split(/\n|,|;/)).map(s=>s.trim()).filter(Boolean))].sort();
  const currentL=$('levelFilter').value,currentP=$('planFilter').value;
  $('levelFilter').innerHTML='<option value="">ทุกระดับความสอดคล้อง</option>'+levels.map(x=>`<option>${esc(x)}</option>`).join('');
  $('planFilter').innerHTML='<option value="">ทุกแผนงาน</option>'+plans.map(x=>`<option>${esc(x)}</option>`).join('');
  $('levelFilter').value=currentL;$('planFilter').value=currentP;
}
function applyFilters(){
  const q=$('searchInput').value.trim().toLowerCase(),level=$('levelFilter').value,plan=$('planFilter').value;
  state.filtered=state.rows.filter(r=>{const blob=Object.values(r).join(' ').toLowerCase();return(!q||blob.includes(q))&&(!level||analysis(r,'ระดับความสอดคล้อง')===level)&&(!plan||String(analysis(r,'แผนงานที่สอดคล้อง')).includes(plan))});
  render();
}
function render(){renderKpis();renderSummaries();renderTable()}
function renderKpis(){
  $('totalProjects').textContent=state.filtered.length.toLocaleString('th-TH');
  $('highProjects').textContent=state.filtered.filter(r=>/สูงมาก|สูง/.test(analysis(r,'ระดับความสอดคล้อง'))).length.toLocaleString('th-TH');
  $('lowProjects').textContent=state.filtered.filter(r=>/ควรปรับปรุง|ต่ำ|ไม่สอดคล้อง/.test(analysis(r,'ระดับความสอดคล้อง'))).length.toLocaleString('th-TH');
  const total=state.filtered.reduce((s,r)=>s+Number(String(pick(r,['งบประมาณรวม (บาท)','งบประมาณรวม','งบประมาณ','budget'])).replace(/[^0-9.-]/g,'' )||0),0);
  $('totalBudget').textContent=money(total);
}
function renderSummaries(){
  const lc={};state.filtered.forEach(r=>{const x=analysis(r,'ระดับความสอดคล้อง')||'ไม่พบข้อมูล';lc[x]=(lc[x]||0)+1});
  const max=Math.max(1,...Object.values(lc));$('levelSummary').innerHTML=Object.entries(lc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join('')||'<p class="muted">ไม่มีข้อมูล</p>';
  const sc={};state.filtered.forEach(r=>{const text=analysis(r,'SDGs ที่สอดคล้อง');(text.match(/SDG\s*\d+/gi)||[]).forEach(x=>{x=x.toUpperCase().replace(/\s+/g,' ');sc[x]=(sc[x]||0)+1})});
  $('sdgSummary').innerHTML=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>`<span class="tag">${esc(k)} · ${v}</span>`).join('')||'<p class="muted">ไม่มีข้อมูล</p>';
}
function renderTable(){
  $('resultCount').textContent=state.filtered.length.toLocaleString('th-TH')+' รายการ';
  $('projectRows').innerHTML=state.filtered.map((r,i)=>`<tr><td>${i+1}</td><td class="project-name">${esc(projectName(r))}</td><td>${esc(agency(r))}</td><td>${esc(analysis(r,'แผนงานที่สอดคล้อง'))}</td><td>${esc(analysis(r,'SDGs ที่สอดคล้อง'))}</td><td><span class="badge ${levelClass(analysis(r,'ระดับความสอดคล้อง'))}">${esc(analysis(r,'ระดับความสอดคล้อง'))}</span></td><td class="muted">${esc(pick(r,['วิเคราะห์ล่าสุด','วันที่วิเคราะห์','updated_at']))}</td><td><button class="view-btn" data-i="${i}">ดูผล</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">ไม่พบข้อมูล</td></tr>';
  document.querySelectorAll('.view-btn').forEach(b=>b.onclick=()=>openDetail(state.filtered[Number(b.dataset.i)]));
}
function openDetail(r){
  $('detailTitle').textContent=projectName(r);
  const items=[['หน่วยงานรับผิดชอบ',agency(r)],['SDGs ที่สอดคล้อง',analysis(r,'SDGs ที่สอดคล้อง')],['คำอธิบาย SDGs และ Keyword',analysis(r,'คำอธิบาย SDGs & Keyword')],['ระดับความสอดคล้อง',analysis(r,'ระดับความสอดคล้อง')],['ผลการประเมินความสอดคล้อง',analysis(r,'จากการประเมินว่าสอดคล้องกับแผนงาน ตัวชี้วัดและค่าเป้าหมาย เป้าหมายการพัฒนาจังหวัด (5 ปี) หรือไม่')],['เกณฑ์ที่ใช้ประเมินกับแผนปี 71–75',analysis(r,'เกณฑ์ที่ใช้ประเมินกับแผนปี 71–75')],['วิธีการแก้ไข / ข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง',analysis(r,'วิธีการแก้ไข / ข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง')]];
  $('detailContent').innerHTML=items.map(([h,v])=>`<section class="detail-block"><h3>${esc(h)}</h3><p>${esc(v)}</p></section>`).join('');$('detailDialog').showModal();
}
$('closeDialog').onclick=()=>$('detailDialog').close();$('refreshBtn').onclick=loadData;$('searchInput').oninput=applyFilters;$('levelFilter').onchange=applyFilters;$('planFilter').onchange=applyFilters;
$('pageTitle').textContent=cfg.TITLE||$('pageTitle').textContent;
loadData();setInterval(loadData,Math.max(10,Number(cfg.REFRESH_SECONDS||30))*1000);
