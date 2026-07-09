const state={projects:[],sdgs:[],filtered:[],totalBudget:0};
const THB=new Intl.NumberFormat('th-TH');
function escapeHtml(v){return String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}
function money(v){v=Number(v||0);if(v>=1e9)return `${(v/1e9).toFixed(2)} พันล้าน`;if(v>=1e6)return `${(v/1e6).toFixed(2)} ล้านบาท`;return THB.format(v)+' บาท'}
function pct(v){return Number(v||0).toFixed(2)+'%'}
function groupBy(arr,fn){return arr.reduce((m,x)=>{const k=typeof fn==='function'?fn(x):x[fn];(m[k||'ไม่ระบุ']??=[]).push(x);return m},{})}
function sum(arr,fn){return arr.reduce((a,x)=>a+Number(fn(x)||0),0)}
function levelClass(a){a=String(a||''); if(a.includes('สูง'))return 'level-high'; if(a.includes('ต่ำ'))return 'level-low'; if(a.includes('ปานกลาง'))return 'level-mid'; return 'level-none'}
function sdgPills(s){return (s&&s.length?s:[]).map(x=>`<span class="pill">SDG ${x}</span>`).join('')||'<span class="pill">ไม่ระบุ</span>'}
async function load(){
 const [projects,sdgs]=await Promise.all([fetch('data/projects.json').then(r=>r.json()),fetch('data/sdgs.json').then(r=>r.json())]);
 state.projects=projects; state.sdgs=sdgs; state.filtered=projects; state.totalBudget=sum(projects,p=>p.budget);
 init(); bind(); render();
}
function init(){
 const order=['สังคม','ท่องเที่ยว','ทรัพยากร','การค้า','เกษตร'];
 const cats=[...new Set(state.projects.map(p=>p.category||'ไม่ระบุ'))].sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
 document.getElementById('categoryNav').innerHTML='<button class="active" data-cat="all">ภาพรวมทั้งหมด</button>'+cats.map(c=>`<button data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
 const cf=document.getElementById('categoryFilter'); cats.forEach(c=>cf.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`));
 const aligns=[...new Set(state.projects.map(p=>p.alignment||'ไม่ระบุ'))].sort(); const af=document.getElementById('alignmentFilter'); aligns.forEach(a=>af.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`));
 const sf=document.getElementById('sdgFilter'); state.sdgs.forEach(s=>sf.insertAdjacentHTML('beforeend',`<option value="${s.id}">SDG ${s.id} ${escapeHtml(s.goal)}</option>`));
}
function bind(){
 ['searchInput','categoryFilter','alignmentFilter','sdgFilter'].forEach(id=>document.getElementById(id).addEventListener('input',apply));
 document.getElementById('resetBtn').onclick=()=>{['searchInput'].forEach(id=>document.getElementById(id).value='');['categoryFilter','alignmentFilter','sdgFilter'].forEach(id=>document.getElementById(id).value='all');apply()};
 document.getElementById('categoryNav').onclick=e=>{if(!e.target.matches('button'))return;document.getElementById('categoryFilter').value=e.target.dataset.cat;apply()};
 document.getElementById('closeDialog').onclick=()=>document.getElementById('detailDialog').close();
}
function apply(){
 const q=document.getElementById('searchInput').value.trim().toLowerCase(); const c=document.getElementById('categoryFilter').value; const a=document.getElementById('alignmentFilter').value; const s=document.getElementById('sdgFilter').value;
 document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.cat===c));
 state.filtered=state.projects.filter(p=>{
   const hay=[p.projectName,p.agency,p.category,p.developmentIssue,p.developmentApproach,p.plan,p.indicator,p.output,p.outcome,p.sdgText,p.sdgKeyword,p.alignment,p.assessment,p.criteria,p.suggestion].join(' ').toLowerCase();
   return (!q||hay.includes(q))&&(c==='all'||p.category===c)&&(a==='all'||p.alignment===a)&&(s==='all'||(p.sdgs||[]).map(String).includes(s));
 }); render();
}
function render(){renderKpi();renderBars();renderSdg();renderTop();renderTable()}
function renderKpi(){const list=state.filtered;const total=sum(list,p=>p.budget);document.getElementById('totalProjects').textContent=THB.format(list.length);document.getElementById('totalBudget').textContent=money(total);document.getElementById('budgetRatio').textContent=`${pct(state.totalBudget?total/state.totalBudget*100:0)} ของงบทั้งหมด`;document.getElementById('highProjects').textContent=THB.format(list.filter(p=>String(p.alignment).includes('สูง')).length);document.getElementById('improveProjects').textContent=THB.format(list.filter(p=>String(p.alignment).includes('ปานกลาง')||String(p.alignment).includes('ต่ำ')).length)}
function bar(id,items){const max=Math.max(...items.map(x=>x.value),1);document.getElementById(id).innerHTML=items.length?items.map(x=>`<div class="bar-row"><div class="bar-label" title="${escapeHtml(x.label)}">${escapeHtml(x.label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,x.value/max*100)}%"></div></div><div class="bar-value">${x.text}</div></div>`).join(''):'<div class="empty">ไม่พบข้อมูล</div>'}
function renderBars(){const list=state.filtered;const total=sum(list,p=>p.budget);document.getElementById('categoryCaption').textContent=`รวม ${THB.format(list.length)} โครงการ`;
 bar('categoryChart',Object.entries(groupBy(list,'category')).map(([label,arr])=>({label,value:arr.length,text:`${THB.format(arr.length)} โครงการ`})).sort((a,b)=>b.value-a.value));
 bar('budgetCategoryChart',Object.entries(groupBy(list,'category')).map(([label,arr])=>{const v=sum(arr,p=>p.budget);return{label,value:v,text:`${money(v)} • ${pct(total?v/total*100:0)}`}}).sort((a,b)=>b.value-a.value));
 bar('alignmentChart',Object.entries(groupBy(list,'alignment')).map(([label,arr])=>({label,value:arr.length,text:`${THB.format(arr.length)} โครงการ`})).sort((a,b)=>b.value-a.value));
}
function renderTop(){const top=[...state.filtered].sort((a,b)=>b.budget-a.budget).slice(0,5);document.getElementById('topBudgetList').innerHTML=top.length?top.map((p,i)=>`<div class="top-item"><p class="top-title"><span class="rank">${i+1}</span>${escapeHtml(p.projectName)}</p><div class="top-meta">${money(p.budget)} • ${pct(p.budgetPercent)} ของงบรวมทั้งหมด • ${escapeHtml(p.category)}</div></div>`).join(''):'<div class="empty">ไม่พบข้อมูล</div>'}
function renderSdg(){const counts={},budgets={};state.filtered.forEach(p=>(p.sdgs||[]).forEach(s=>{counts[s]=(counts[s]||0)+1;budgets[s]=(budgets[s]||0)+Number(p.budget||0)}));const total=sum(state.filtered,p=>p.budget);document.getElementById('sdgCaption').textContent=`พบ ${Object.keys(counts).length} เป้าหมาย`;document.getElementById('sdgGrid').innerHTML=state.sdgs.map(s=>{const c=counts[s.id]||0,b=budgets[s.id]||0;return `<div class="sdg-card ${c?'active':''}"><div class="sdg-code">SDG ${s.id}</div><div class="sdg-goal">${escapeHtml(s.goal)}</div><div class="sdg-metric">${THB.format(c)}</div><small>${money(b)} • ${pct(total?b/total*100:0)}</small></div>`}).join('')}
function renderTable(){document.getElementById('resultCount').textContent=`แสดง ${THB.format(state.filtered.length)} รายการ`;document.getElementById('tableBody').innerHTML=state.filtered.map(p=>`<tr><td>${escapeHtml(p.category)}</td><td class="project-cell"><strong>${escapeHtml(p.projectName)}</strong><div class="muted">${escapeHtml(p.agency||'ไม่พบข้อมูล')}</div></td><td class="plan-cell"><span><b>แผนงาน:</b> ${escapeHtml(p.plan||'ไม่พบข้อมูล')}</span><span><b>ตัวชี้วัด:</b> ${escapeHtml(p.indicator||'ไม่พบข้อมูล')}</span></td><td class="money">${money(p.budget)}</td><td class="pct">${pct(p.budgetPercent)}</td><td>${sdgPills(p.sdgs)}</td><td><span class="level ${levelClass(p.alignment)}">${escapeHtml(p.alignment||'ไม่ระบุ')}</span></td><td><button class="detail-open" onclick="detail('${p.id}')">รายละเอียด</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">ไม่พบข้อมูล</td></tr>'}
window.detail=function(id){const p=state.projects.find(x=>x.id===id);if(!p)return;document.getElementById('detailCategory').textContent=`${p.category} • ${money(p.budget)} • ${pct(p.budgetPercent)} ของงบรวม`;document.getElementById('detailTitle').textContent=p.projectName;document.getElementById('detailBody').innerHTML=`<div class="detail-grid"><div class="detail-card"><h4>ข้อมูลเจ้าของโครงการ</h4><p>หน่วยงาน: ${escapeHtml(p.agency||'ไม่พบข้อมูล')}\nกลุ่ม: ${escapeHtml(p.category||'ไม่ระบุ')}\nงบประมาณ: ${money(p.budget)} (${pct(p.budgetPercent)} ของงบรวม)</p></div><div class="detail-card"><h4>SDGs และระดับความสอดคล้อง</h4><p>${(p.sdgs||[]).map(s=>'SDG '+s).join(', ')||'ไม่ระบุ'}\nระดับ: ${escapeHtml(p.alignment||'ไม่ระบุ')}\nKeyword: ${escapeHtml(p.sdgKeyword||'ไม่พบข้อมูล')}</p></div><div class="detail-card full criteria"><h4>แผนงานหลัก / ตัวชี้วัด / เกณฑ์ที่ใช้ประเมิน</h4><p>ประเด็นการพัฒนา: ${escapeHtml(p.developmentIssue||'ไม่พบข้อมูล')}\nแนวทางการพัฒนา: ${escapeHtml(p.developmentApproach||'ไม่พบข้อมูล')}\nแผนงานหลัก: ${escapeHtml(p.plan||'ไม่พบข้อมูล')}\nตัวชี้วัด: ${escapeHtml(p.indicator||'ไม่พบข้อมูล')}\n\nเกณฑ์ประเมิน: ${escapeHtml(p.criteria||'ไม่พบข้อมูล')}</p></div><div class="detail-card"><h4>Output ที่ระบุในโครงการ</h4><p>${escapeHtml(p.output||'ไม่พบข้อมูล')}</p></div><div class="detail-card"><h4>Outcome ที่ระบุในโครงการ</h4><p>${escapeHtml(p.outcome||'ไม่พบข้อมูล')}</p></div><div class="detail-card full"><h4>เหตุผลการประเมิน</h4><p>${escapeHtml(p.assessment||'ไม่พบข้อมูล')}</p></div><div class="detail-card full recommend"><h4>ข้อเสนอแนะเพื่อให้เข้าเกณฑ์มากขึ้น</h4><p>${escapeHtml(p.suggestion||'ควรเพิ่มตัวชี้วัดเชิงปริมาณ ค่าเป้าหมาย ผู้ได้รับประโยชน์ วิธีติดตามผล และเหตุผลเชื่อมโยง SDGs ให้ชัดเจน')}</p></div></div>`;document.getElementById('detailDialog').showModal()}
load().catch(err=>{document.body.innerHTML=`<pre style="padding:24px">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(err.message)}</pre>`;console.error(err)})
