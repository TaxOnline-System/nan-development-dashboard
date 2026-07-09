let projects=[], sdgs=[], filtered=[], currentCategory='all';
const categoryOrder=['all','สังคม','ท่องเที่ยว','ทรัพยากร','การค้า','เกษตร'];
const fmtNum=n=>Number(n||0).toLocaleString('th-TH');
const fmtPct=n=>(Number(n||0)).toFixed(2)+'%';
const fmtBudget=n=>{n=Number(n||0); if(n>=1e9)return (n/1e9).toFixed(2)+' พันล้าน'; if(n>=1e6)return (n/1e6).toFixed(2)+' ล้าน'; return fmtNum(n)+' บาท'};
const qs=id=>document.getElementById(id);
const totalAllBudget=()=>projects.reduce((s,p)=>s+(Number(p.budget)||0),0);
const totalFilteredBudget=()=>filtered.reduce((s,p)=>s+(Number(p.budget)||0),0);
const budgetPctOfAll=p=>totalAllBudget()?((Number(p.budget)||0)/totalAllBudget()*100):0;
const budgetLabel=p=>`${escapeHtml(p.budgetText||fmtBudget(p.budget))}<br><span class="budget-pct">${fmtPct(budgetPctOfAll(p))} ของงบประมาณรวม</span>`;
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
  const allBudget=totalAllBudget(); const fBudget=totalFilteredBudget();
  qs('totalProjects').textContent=fmtNum(filtered.length);
  qs('totalBudget').textContent=fmtBudget(fBudget);
  qs('budgetPercent').textContent=`คิดเป็น ${fmtPct(allBudget?fBudget/allBudget*100:0)} ของงบประมาณรวมทั้งหมด`;
  const high=filtered.filter(p=>['สูงมาก','สูง'].includes(p.alignment)).length; qs('highCount').textContent=fmtNum(high);
  qs('improveCount').textContent=fmtNum(filtered.filter(p=>!['สูงมาก','สูง'].includes(p.alignment)).length);
  qs('resultCount').textContent=`พบ ${fmtNum(filtered.length)} รายการ • งบประมาณ ${fmtBudget(fBudget)} (${fmtPct(allBudget?fBudget/allBudget*100:0)})`;
}
function countBy(arr,keyFn){return arr.reduce((o,x)=>{const k=keyFn(x)||'ไม่ระบุ';o[k]=(o[k]||0)+1;return o;},{});} 
function sumBy(arr,keyFn,valFn){return arr.reduce((o,x)=>{const k=keyFn(x)||'ไม่ระบุ';o[k]=(o[k]||0)+(Number(valFn(x))||0);return o;},{});} 
function renderBar(elId,data,options={}){
  const el=qs(elId); const entries=Object.entries(data).sort((a,b)=>b[1]-a[1]); const max=Math.max(1,...entries.map(e=>e[1]));
  const total=options.total ?? entries.reduce((s,e)=>s+Number(e[1]||0),0);
  el.innerHTML=entries.map(([k,v])=>{
    const pct=total?Number(v)/total*100:0;
    const val=options.type==='budget'?`${fmtBudget(v)} <span>${fmtPct(pct)}</span>`:`${fmtNum(v)} <span>${fmtPct(pct)}</span>`;
    return `<div class="bar-row ${options.type==='budget'?'budget-row':''}"><div class="bar-label" title="${escapeHtml(k)}">${escapeHtml(k)}</div><div class="bar-track"><div class="bar-fill" style="width:${(v/max)*100}%"></div></div><div class="bar-value">${val}</div></div>`;
  }).join('')||'<p>ไม่พบข้อมูล</p>';
}
function renderCharts(){
  renderBar('categoryChart', countBy(filtered,p=>p.category)); 
  renderBar('alignmentChart', countBy(filtered,p=>p.alignment));
  renderBar('categoryBudgetChart', sumBy(filtered,p=>p.category,p=>p.budget), {type:'budget', total: totalFilteredBudget()});
  renderBar('alignmentBudgetChart', sumBy(filtered,p=>p.alignment,p=>p.budget), {type:'budget', total: totalFilteredBudget()});
  const counts={}; filtered.forEach(p=>(p.sdgs||[]).forEach(s=>counts[s]=(counts[s]||0)+1));
  const active=sdgs.filter(s=>counts[s.id]); qs('sdgSummary').textContent=`พบ ${active.length} SDGs`;
  qs('sdgChart').innerHTML=active.sort((a,b)=>a.id-b.id).map(s=>`<div class="sdg-card"><strong>SDG ${s.id}</strong><span>${escapeHtml(s.goal)}</span><div class="badge">${counts[s.id]} โครงการ</div></div>`).join('')||'<p>ไม่พบ SDGs</p>';
}
function renderTable(){
  const tbody=qs('projectTable').querySelector('tbody');
  tbody.innerHTML=filtered.map((p,i)=>`<tr><td><span class="badge">${escapeHtml(p.category)}</span></td><td class="project-name">${escapeHtml(p.projectName)}</td><td>${escapeHtml(p.agency)}</td><td>${budgetLabel(p)}</td><td>${(p.sdgs||[]).map(s=>`<span class="badge">SDG ${s}</span>`).join('')}</td><td><span class="badge align-${escapeHtml(p.alignment)}">${escapeHtml(p.alignment)}</span></td><td><button onclick="showDetail('${p.id}')">เปิดดู</button></td></tr>`).join('');
}
function showDetail(id){
  const p=projects.find(x=>x.id===id); if(!p)return; qs('detailTitle').textContent=p.projectName;
  const sdgBadges=(p.sdgs||[]).map(s=>`<span class="badge">SDG ${s}</span>`).join(' ');
  qs('detailBody').innerHTML=`<div class="detail-grid">
    ${box('กลุ่ม / หน่วยงาน',`${p.category}\n${p.agency}`)}${box('งบประมาณ',`${p.budgetText||fmtBudget(p.budget)}\nคิดเป็น ${fmtPct(budgetPctOfAll(p))} ของงบประมาณรวมทั้งหมด`)}
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
  const header=['id','category','projectName','agency','budgetText','budget','budgetPercentOfTotal','sdgs','alignment','suggestion'];
  const rows=[header.join(',')].concat(filtered.map(p=>header.map(h=>{
    const value=h==='budgetPercentOfTotal'?fmtPct(budgetPctOfAll(p)):Array.isArray(p[h])?p[h].join('|'):p[h]||'';
    return `"${String(value).replace(/"/g,'""')}"`;
  }).join(',')));
  download('ppad-projects.csv',rows.join('\n'),'text/csv;charset=utf-8;');
}
function exportJSON(){
  const data=filtered.map(p=>({...p,budgetPercentOfTotal:Number(budgetPctOfAll(p).toFixed(4))}));
  download('ppad-projects.json',JSON.stringify(data,null,2),'application/json;charset=utf-8;');
}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);} 
init();
