let projects=[], sdgs=[], filtered=[], currentCategory='all';
const categoryOrder=['all','สังคม','ท่องเที่ยว','ทรัพยากร','การค้า','เกษตร'];
const fmtNum=n=>Number(n||0).toLocaleString('th-TH');
const fmtBudget=n=>{n=Number(n||0); if(n>=1e9)return (n/1e9).toFixed(2)+' พันล้าน'; if(n>=1e6)return (n/1e6).toFixed(2)+' ล้าน'; return fmtNum(n)};
const qs=id=>document.getElementById(id);
async function init(){
  const [p,s]=await Promise.all([fetch('data/projects.json').then(r=>r.json()),fetch('data/sdgs.json').then(r=>r.json())]);
  projects=p; sdgs=s; setupControls(); applyFilters();
}
function setupControls(){
  const cats=[...new Set(projects.map(p=>p.category))].sort((a,b)=>categoryOrder.indexOf(a)-categoryOrder.indexOf(b));
  const nav=qs('categoryNav'); nav.innerHTML='';
  ['all',...cats].forEach(c=>{const b=document.createElement('button');b.textContent=c==='all'?'ภาพรวมทั้งหมด':c;b.onclick=()=>{currentCategory=c;qs('categoryFilter').value=c;applyFilters();};nav.appendChild(b);});
  cats.forEach(c=>qs('categoryFilter').append(new Option(c,c)));
  [...new Set(projects.map(p=>p.alignment||'ไม่ระบุ'))].sort().forEach(a=>qs('alignmentFilter').append(new Option(a,a)));
  sdgs.forEach(s=>qs('sdgFilter').append(new Option(`${s.code} ${s.goal}`,s.id)));
  ['searchInput','categoryFilter','alignmentFilter','sdgFilter'].forEach(id=>qs(id).addEventListener('input',()=>{if(id==='categoryFilter')currentCategory=qs(id).value;applyFilters();}));
  qs('resetBtn').onclick=()=>{currentCategory='all';qs('searchInput').value='';qs('categoryFilter').value='all';qs('alignmentFilter').value='all';qs('sdgFilter').value='all';applyFilters();};
  qs('exportCsvBtn').onclick=exportCSV; qs('exportJsonBtn').onclick=exportJSON; qs('closeDialog').onclick=()=>qs('detailDialog').close();
}
function applyFilters(){
  const q=qs('searchInput').value.trim().toLowerCase(); const cat=qs('categoryFilter').value; const al=qs('alignmentFilter').value; const sdg=qs('sdgFilter').value;
  filtered=projects.filter(p=>{
    const text=[p.projectName,p.agency,p.sdgText,p.sdgKeyword,p.plan,p.assessment,p.suggestion].join(' ').toLowerCase();
    return (!q||text.includes(q)) && (cat==='all'||p.category===cat) && (al==='all'||p.alignment===al) && (sdg==='all'||(p.sdgs||[]).includes(Number(sdg)));
  });
  updateNav(); renderSummary(); renderCharts(); renderTable();
}
function updateNav(){[...qs('categoryNav').children].forEach(b=>b.classList.toggle('active',(b.textContent==='ภาพรวมทั้งหมด'?'all':b.textContent)===currentCategory));}
function renderSummary(){
  qs('totalProjects').textContent=fmtNum(filtered.length);
  qs('totalBudget').textContent=fmtBudget(filtered.reduce((s,p)=>s+(p.budget||0),0));
  const high=filtered.filter(p=>['สูงมาก','สูง'].includes(p.alignment)).length; qs('highCount').textContent=fmtNum(high);
  qs('improveCount').textContent=fmtNum(filtered.filter(p=>!['สูงมาก','สูง'].includes(p.alignment)).length);
  qs('resultCount').textContent=`พบ ${fmtNum(filtered.length)} รายการ`;
}
function countBy(arr,keyFn){return arr.reduce((o,x)=>{const k=keyFn(x)||'ไม่ระบุ';o[k]=(o[k]||0)+1;return o;},{});} 
function renderBar(elId,data){
  const el=qs(elId); const entries=Object.entries(data).sort((a,b)=>b[1]-a[1]); const max=Math.max(1,...entries.map(e=>e[1]));
  el.innerHTML=entries.map(([k,v])=>`<div class="bar-row"><div class="bar-label" title="${escapeHtml(k)}">${escapeHtml(k)}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/max)*100}%"></div></div><div class="bar-value">${v}</div></div>`).join('')||'<p>ไม่พบข้อมูล</p>';
}
function renderCharts(){
  renderBar('categoryChart', countBy(filtered,p=>p.category)); renderBar('alignmentChart', countBy(filtered,p=>p.alignment));
  const counts={}; filtered.forEach(p=>(p.sdgs||[]).forEach(s=>counts[s]=(counts[s]||0)+1));
  const active=sdgs.filter(s=>counts[s.id]); qs('sdgSummary').textContent=`พบ ${active.length} SDGs`;
  qs('sdgChart').innerHTML=active.sort((a,b)=>a.id-b.id).map(s=>`<div class="sdg-card"><strong>SDG ${s.id}</strong><span>${escapeHtml(s.goal)}</span><div class="badge">${counts[s.id]} โครงการ</div></div>`).join('')||'<p>ไม่พบ SDGs</p>';
}
function renderTable(){
  const tbody=qs('projectTable').querySelector('tbody');
  tbody.innerHTML=filtered.map((p,i)=>`<tr><td><span class="badge">${escapeHtml(p.category)}</span></td><td class="project-name">${escapeHtml(p.projectName)}</td><td>${escapeHtml(p.agency)}</td><td>${escapeHtml(p.budgetText||fmtBudget(p.budget))}</td><td>${(p.sdgs||[]).map(s=>`<span class="badge">SDG ${s}</span>`).join('')}</td><td><span class="badge align-${escapeHtml(p.alignment)}">${escapeHtml(p.alignment)}</span></td><td><button onclick="showDetail('${p.id}')">เปิดดู</button></td></tr>`).join('');
}
function showDetail(id){
  const p=projects.find(x=>x.id===id); if(!p)return; qs('detailTitle').textContent=p.projectName;
  const sdgBadges=(p.sdgs||[]).map(s=>`<span class="badge">SDG ${s}</span>`).join(' ');
  qs('detailBody').innerHTML=`<div class="detail-grid">
    ${box('กลุ่ม / หน่วยงาน',`${p.category}\n${p.agency}`)}${box('งบประมาณ',p.budgetText||fmtBudget(p.budget))}
    ${box('ประเด็นการพัฒนา',p.developmentIssue,true)}${box('แนวทางการพัฒนา',p.developmentApproach,true)}
    ${box('แผนงาน',p.plan,true)}${box('ตัวชี้วัดและค่าเป้าหมาย',p.indicator,true)}
    ${box('ผลผลิต (Output)',p.output,true)}${box('ผลลัพธ์ (Outcome)',p.outcome,true)}
    ${box('SDGs ที่สอดคล้อง',`${sdgBadges}\n\n${escapeHtml(p.sdgText)}`,true,true)}
    ${box('Keyword / เหตุผล SDGs',p.sdgKeyword,true)}
    ${box('ระดับความสอดคล้อง',p.alignment)}${box('เกณฑ์ที่ใช้ประเมิน',p.criteria,true)}
    ${box('ผลการประเมิน',p.assessment,true)}${box('ข้อเสนอแนะเพื่อเพิ่มความสอดคล้อง',p.suggestion||'ควรเพิ่ม Output, Outcome, KPI และค่าเป้าหมายที่วัดผลได้ให้ชัดเจน',true,true,'rec')}
  </div>`;
  qs('detailDialog').showModal();
}
function box(title,text,full=false,html=false,extra=''){return `<div class="detail-box ${full?'full':''} ${extra}"><h4>${escapeHtml(title)}</h4>${html?text:escapeHtml(text||'ไม่พบข้อมูล')}</div>`}
function escapeHtml(x){return String(x||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function exportCSV(){
  const header=['id','category','projectName','agency','budgetText','sdgs','alignment','suggestion'];
  const rows=[header.join(',')].concat(filtered.map(p=>header.map(h=>`"${String(Array.isArray(p[h])?p[h].join('|'):p[h]||'').replace(/"/g,'""')}"`).join(',')));
  download('ppad-projects.csv',rows.join('\n'),'text/csv;charset=utf-8;');
}
function exportJSON(){download('ppad-projects.json',JSON.stringify(filtered,null,2),'application/json;charset=utf-8;');}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);} 
init();
