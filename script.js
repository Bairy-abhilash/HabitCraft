// =============================================
//           HABIT TRACKER APPLICATION
// =============================================

const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES=['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAY_NAMES_FULL=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const EMOJIS=[];

let currentYear, currentMonth;
let data={};
let editingId=null;
let selectedEmoji='';

// === INIT ===
function init(){
  loadData();
  const now=new Date();
  currentYear=now.getFullYear();
  currentMonth=now.getMonth();

  // Check if we need to auto-refresh for a new month
  autoRefreshMonth();

  // Build month selector
  const sel=document.getElementById('monthSelect');
  MONTH_NAMES.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=m;sel.appendChild(o);});
  sel.value=currentMonth;
  document.getElementById('yearInput').value=currentYear;

  sel.addEventListener('change',()=>{currentMonth=parseInt(sel.value);render();});
  document.getElementById('yearInput').addEventListener('change',(e)=>{currentYear=parseInt(e.target.value);render();});

  if(!data.habits||data.habits.length===0){
    data.habits=[
      {id:uid(),name:'Wake up at 6:00 AM',emoji:'',color:'#6c5ce7'},
      {id:uid(),name:'Cold Shower',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Plan the day',emoji:'',color:'#00b894'},
      {id:uid(),name:'Work',emoji:'',color:'#fdcb6e'},
      {id:uid(),name:'No sugar',emoji:'',color:'#e17055'},
      {id:uid(),name:'No Alcohol',emoji:'',color:'#d63031'},
      {id:uid(),name:'Read 10 pages',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Meditation',emoji:'',color:'#6c5ce7'},
      {id:uid(),name:'Yoga',emoji:'',color:'#00cec9'},
      {id:uid(),name:'Social media less than 1H',emoji:'',color:'#e94560'},
      {id:uid(),name:'Gym',emoji:'',color:'#f5a623'},
      {id:uid(),name:'Talk with friends',emoji:'',color:'#fd79a8'},
    ];
    saveData();
  }
  buildEmojiGrid();
  render();
}

// === AUTO REFRESH: clear checks when a new month starts ===
function autoRefreshMonth(){
  const now=new Date();
  const currentMK=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const lastActiveMonth=data.lastActiveMonth||'';
  if(lastActiveMonth && lastActiveMonth!==currentMK){
    // New month detected — checks for the NEW month start blank automatically
    // (we don't delete old data, new month just has no entries yet)
    // But we record that we've entered this month
  }
  data.lastActiveMonth=currentMK;
  saveData();
}

// === PERSISTENCE ===
function loadData(){try{const r=localStorage.getItem('ht_data');data=r?JSON.parse(r):{};}catch(e){data={};}
if(!data.habits)data.habits=[];if(!data.checks)data.checks={};if(!data.mood)data.mood={};if(!data.motivation)data.motivation={};}
function saveData(){localStorage.setItem('ht_data',JSON.stringify(data));}

// === UTILS ===
function uid(){return Math.random().toString(36).substr(2,9);}
function mk(){return `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;}
function daysInMonth(){return new Date(currentYear,currentMonth+1,0).getDate();}
// ISO weekday: Mon=0 ... Sun=6
function isoDow(d){const dow=new Date(currentYear,currentMonth,d).getDay();return dow===0?6:dow-1;}

// === RENDER ALL ===
function render(){
  document.getElementById('subtitleMonth').textContent=`~${MONTH_NAMES[currentMonth].toUpperCase()}~`;
  document.getElementById('monthSelect').value=currentMonth;
  document.getElementById('yearInput').value=currentYear;
  renderStats();
  renderGrid();
  renderAnalysis();
  renderTop10();
  renderMoodRows();
  renderDailyChart();
  renderWeeklyChart();
  renderDonut();
  renderMentalChart();
}

// === STATS ===
function renderStats(){
  const days=daysInMonth(),h=data.habits,goal=h.length*days;
  let done=0;const ck=data.checks[mk()]||{};
  h.forEach(hb=>{for(let d=1;d<=days;d++){if(ck[hb.id]&&ck[hb.id][d])done++;}});
  document.getElementById('statGoal').textContent=goal;
  document.getElementById('statDone').textContent=done;
  document.getElementById('statLeft').textContent=goal-done;
}

// === HABIT GRID ===
function renderGrid(){
  const days=daysInMonth();
  const mkey=mk();
  if(!data.checks[mkey])data.checks[mkey]={};
  const today=new Date();
  const isNow=today.getFullYear()===currentYear&&today.getMonth()===currentMonth;
  const todayD=today.getDate();

  // Figure out weeks
  // Group days into weeks (Mon-Sun)
  const weeks=[];
  let currentWeek=[];
  for(let d=1;d<=days;d++){
    const dow=isoDow(d); // 0=Mon
    if(dow===0&&currentWeek.length>0){weeks.push(currentWeek);currentWeek=[];}
    currentWeek.push(d);
  }
  if(currentWeek.length>0)weeks.push(currentWeek);

  // === HEADER ROW 1: Week labels ===
  let h1='<tr><th rowspan="3" style="min-width:160px;text-align:left;padding-left:8px;">My Habits</th>';
  weeks.forEach((w,i)=>{
    h1+=`<th class="week-header" colspan="${w.length}">Week ${i+1}</th>`;
  });
  h1+='</tr>';

  // === HEADER ROW 2: Day names ===
  let h2='<tr>';
  for(let d=1;d<=days;d++){
    const dow=isoDow(d);
    h2+=`<th class="day-header">${DAY_NAMES[dow]}</th>`;
  }
  h2+='</tr>';

  // === HEADER ROW 3: Day numbers ===
  let h3='<tr>';
  for(let d=1;d<=days;d++){
    const cls=isNow&&d===todayD?'color:#c0392b;font-weight:800;':'';
    h3+=`<th class="day-num" style="${cls}">${d}</th>`;
  }
  h3+='</tr>';

  document.getElementById('gridHead').innerHTML=h1+h2+h3;

  // === BODY: Habit rows ===
  let body='';
  data.habits.forEach(hb=>{
    if(!data.checks[mkey][hb.id])data.checks[mkey][hb.id]={};
    body+='<tr>';
    body+=`<td class="habit-name-cell"><span class="emoji">${hb.emoji}</span>${hb.name}
      <span style="float:right;display:inline-flex;gap:2px;">
        <span style="cursor:pointer;font-size:12px;" onclick="editHabit('${hb.id}')" title="Edit">[EDIT]</span>
        <span style="cursor:pointer;font-size:12px;" onclick="deleteHabit('${hb.id}')" title="Delete">[DEL]</span>
      </span>
    </td>`;
    for(let d=1;d<=days;d++){
      const checked=!!data.checks[mkey][hb.id][d];
      body+=`<td class="cb-cell"><input type="checkbox" ${checked?'checked':''} onchange="toggleDay('${hb.id}',${d},this.checked)"/></td>`;
    }
    body+='</tr>';
  });
  document.getElementById('gridBody').innerHTML=body;
}

// === TOGGLE ===
function toggleDay(hid,day,val){
  const mkey=mk();
  if(!data.checks[mkey])data.checks[mkey]={};
  if(!data.checks[mkey][hid])data.checks[mkey][hid]={};
  if(val)data.checks[mkey][hid][day]=true;
  else delete data.checks[mkey][hid][day];
  saveData();
  // Re-render stats & charts but NOT the grid (to keep checkbox state smooth)
  renderStats();renderAnalysis();renderTop10();renderDailyChart();renderWeeklyChart();renderDonut();
}

// === ANALYSIS TABLE ===
function renderAnalysis(){
  const days=daysInMonth(),mkey=mk(),ck=data.checks[mkey]||{};
  let html='';
  data.habits.forEach(hb=>{
    let actual=0;const hc=ck[hb.id]||{};
    for(let d=1;d<=days;d++){if(hc[d])actual++;}
    const left=days-actual;
    const pct=Math.round(actual/days*100);
    const color=pct>=80?'#4a7c59':pct>=50?'#c0960a':'#c0392b';
    html+=`<tr>
      <td style="text-align:left;">${hb.emoji} ${hb.name}</td>
      <td>${days}</td>
      <td>${actual}</td>
      <td>${left}</td>
      <td><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color};"></div></div></td>
      <td style="font-weight:700;color:${color};">${pct.toFixed(2)}%</td>
    </tr>`;
  });
  document.getElementById('analysisBody').innerHTML=html;
}

// === TOP 10 ===
function renderTop10(){
  const days=daysInMonth(),mkey=mk(),ck=data.checks[mkey]||{};
  const ranked=data.habits.map(hb=>{
    let actual=0;const hc=ck[hb.id]||{};
    for(let d=1;d<=days;d++){if(hc[d])actual++;}
    return{...hb,pct:Math.round(actual/days*100)};
  }).sort((a,b)=>b.pct-a.pct).slice(0,10);

  let html='';
  ranked.forEach((h,i)=>{
    html+=`<li><span class="top10-rank">${i+1}</span><span class="top10-name">${h.name}</span><span class="top10-emoji">${h.emoji}</span></li>`;
  });
  document.getElementById('top10List').innerHTML=html;
}

// === MOOD ROWS ===
function renderMoodRows(){
  const days=daysInMonth(),mkey=mk();
  const md=data.mood[mkey]||{};
  const mt=data.motivation[mkey]||{};
  let mh='',mvh='';
  for(let d=1;d<=days;d++){
    const mv=md[d]!==undefined?md[d]:'';
    const mtv=mt[d]!==undefined?mt[d]:'';
    const mcls=mv?` level-${mv}`:'';
    const mtcls=mtv?` level-${mtv}`:'';
    mh+=`<div class="mood-val${mcls}" onclick="cycleMood('mood',${d})" title="Day ${d}">${mv||'-'}</div>`;
    mvh+=`<div class="mood-val${mtcls}" onclick="cycleMood('motivation',${d})" title="Day ${d}">${mtv||'-'}</div>`;
  }
  document.getElementById('moodRow').innerHTML=mh;
  document.getElementById('motivRow').innerHTML=mvh;
}

function cycleMood(type,day){
  const mkey=mk();
  if(!data[type][mkey])data[type][mkey]={};
  const cur=data[type][mkey][day]||0;
  data[type][mkey][day]=cur>=10?0:cur+1;
  if(data[type][mkey][day]===0)delete data[type][mkey][day];
  saveData();
  renderMoodRows();
  renderMentalChart();
}

// === DONUT ===
function renderDonut(){
  const canvas=document.getElementById('donutChart');
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,130,130);
  const days=daysInMonth(),h=data.habits,goal=h.length*days;
  let done=0;const ck=data.checks[mk()]||{};
  h.forEach(hb=>{for(let d=1;d<=days;d++){if(ck[hb.id]&&ck[hb.id][d])done++;}});
  const pct=goal>0?done/goal:0;
  const left=1-pct;
  const cx=65,cy=65,r=52,lw=18;

  // Background
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#ccc5bb';ctx.lineWidth=lw;ctx.stroke();

  // Done slice (pinkish like screenshot)
  if(pct>0){
    ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
    ctx.strokeStyle='#d4956a';ctx.lineWidth=lw;ctx.lineCap='butt';ctx.stroke();
  }
  // Left slice (grey like screenshot)
  if(left>0){
    ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2+Math.PI*2*pct,-Math.PI/2+Math.PI*2);
    ctx.strokeStyle='#a8a098';ctx.lineWidth=lw;ctx.lineCap='butt';ctx.stroke();
  }

  const pctVal=Math.round(pct*100);
  const leftPct=(100-pctVal);
  document.getElementById('donutPct').textContent=pctVal+'%';
  document.getElementById('donutSub').textContent=leftPct+'%';
}

// === DAILY CHART (Bar) ===
function renderDailyChart(){
  const canvas=document.getElementById('dailyChart');
  const ctx=canvas.getContext('2d');
  const W=canvas.parentElement.clientWidth-20;
  canvas.width=W;canvas.height=110;
  ctx.clearRect(0,0,W,110);

  const days=daysInMonth(),h=data.habits,total=h.length;
  if(total===0)return;
  const mkey=mk(),ck=data.checks[mkey]||{};
  const vals=[];
  for(let d=1;d<=days;d++){
    let c=0;h.forEach(hb=>{if(ck[hb.id]&&ck[hb.id][d])c++;});
    vals.push(total>0?c/total*100:0);
  }

  const pad=28,chartH=75;
  const barW=Math.max(3,(W-pad-10)/days-1.5);

  // Y axis
  ctx.fillStyle='#777';ctx.font='9px sans-serif';
  [0,25,50,75,100].forEach(p=>{
    const y=8+chartH-(p/100)*chartH;
    ctx.fillText(p+'%',0,y+3);
    ctx.strokeStyle='#bbb';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-4,y);ctx.stroke();
  });

  // Bars
  vals.forEach((v,i)=>{
    const x=pad+i*((W-pad-4)/days);
    const bh=(v/100)*chartH;
    const y=8+chartH-bh;
    ctx.fillStyle=v>=75?'#555':v>=50?'#777':'#999';
    ctx.fillRect(x,y,barW,bh);
  });
}

// === WEEKLY CHART (Bar) ===
function renderWeeklyChart(){
  const canvas=document.getElementById('weeklyChart');
  const ctx=canvas.getContext('2d');
  const W=canvas.parentElement.clientWidth-20;
  canvas.width=W;canvas.height=110;
  ctx.clearRect(0,0,W,110);

  const days=daysInMonth(),h=data.habits,total=h.length;
  if(total===0)return;
  const mkey=mk(),ck=data.checks[mkey]||{};

  // Build weeks
  const weeks=[];let wk={done:0,goal:0};
  for(let d=1;d<=days;d++){
    const dow=isoDow(d);
    if(dow===0&&wk.goal>0){weeks.push(wk);wk={done:0,goal:0};}
    h.forEach(hb=>{wk.goal++;if(ck[hb.id]&&ck[hb.id][d])wk.done++;});
  }
  if(wk.goal>0)weeks.push(wk);

  const vals=weeks.map(w=>w.goal>0?w.done/w.goal*100:0);
  const pad=28,chartH=75;
  const barW=Math.min(35,(W-pad-20)/weeks.length-8);

  // Y axis
  ctx.fillStyle='#777';ctx.font='9px sans-serif';
  [0,25,50,75,100].forEach(p=>{
    const y=8+chartH-(p/100)*chartH;
    ctx.fillText(p+'%',0,y+3);
    ctx.strokeStyle='#bbb';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-4,y);ctx.stroke();
  });

  vals.forEach((v,i)=>{
    const x=pad+i*((W-pad-4)/vals.length)+10;
    const bh=(v/100)*chartH;
    const y=8+chartH-bh;
    ctx.fillStyle='#888';
    ctx.fillRect(x,y,barW,bh);
    // Week label
    ctx.fillStyle='#666';ctx.font='9px sans-serif';ctx.textAlign='center';
    ctx.fillText('W'+(i+1),x+barW/2,8+chartH+12);
    ctx.textAlign='start';
  });
}

// === MENTAL STATS AREA CHART ===
function renderMentalChart(){
  const canvas=document.getElementById('mentalChart');
  const ctx=canvas.getContext('2d');
  const W=canvas.parentElement.clientWidth-20;
  canvas.width=W;canvas.height=130;
  ctx.clearRect(0,0,W,130);

  const days=daysInMonth(),mkey=mk();
  const md=data.mood[mkey]||{};
  const mt=data.motivation[mkey]||{};
  const pad=22,chartH=95,chartW=W-pad-10;

  // Grid
  ctx.fillStyle='#999';ctx.font='9px sans-serif';
  for(let i=0;i<=10;i+=2){
    const y=8+chartH-(i/10)*chartH;
    ctx.strokeStyle='#ccc';ctx.lineWidth=0.3;
    ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-4,y);ctx.stroke();
    ctx.fillText(i,4,y+3);
  }

  function drawArea(vals,lineColor,fillColor){
    const pts=[];
    for(let d=1;d<=days;d++){
      if(vals[d]!==undefined){
        const x=pad+((d-1)/(days-1))*chartW;
        const y=8+chartH-(vals[d]/10)*chartH;
        pts.push({x,y});
      }
    }
    if(pts.length<2)return;
    // Fill
    ctx.beginPath();ctx.moveTo(pts[0].x,8+chartH);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,8+chartH);ctx.closePath();
    ctx.fillStyle=fillColor;ctx.fill();
    // Line
    ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle=lineColor;ctx.lineWidth=1.5;ctx.stroke();
  }

  drawArea(md,'#e07050','rgba(224,112,80,0.25)');
  drawArea(mt,'#d4a050','rgba(212,160,80,0.25)');

  // X labels
  ctx.fillStyle='#999';ctx.font='8px sans-serif';ctx.textAlign='center';
  for(let d=1;d<=days;d++){
    if(days<=16||d%2===1){
      const x=pad+((d-1)/(days-1))*chartW;
      ctx.fillText(d,x,8+chartH+12);
    }
  }
  ctx.textAlign='start';
}

// === ADD/EDIT HABIT ===
function buildEmojiGrid(){
  let html='';
  EMOJIS.forEach(e=>{html+=`<div class="emoji-opt${e===selectedEmoji?' sel':''}" onclick="pickEmoji(this,'${e}')">${e}</div>`;});
  document.getElementById('emojiGrid').innerHTML=html;
}
function pickEmoji(el,e){
  selectedEmoji=e;
  document.querySelectorAll('.emoji-opt').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
}
function openAddHabit(){
  editingId=null;selectedEmoji='';
  document.getElementById('modalTitle').textContent='Add New Habit';
  document.getElementById('inputName').value='';
  document.getElementById('inputColor').value='#4a7c59';
  buildEmojiGrid();
  document.getElementById('habitModal').classList.add('show');
  setTimeout(()=>document.getElementById('inputName').focus(),100);
}
function editHabit(id){
  const h=data.habits.find(x=>x.id===id);if(!h)return;
  editingId=id;selectedEmoji=h.emoji;
  document.getElementById('modalTitle').textContent='Edit Habit';
  document.getElementById('inputName').value=h.name;
  document.getElementById('inputColor').value=h.color;
  buildEmojiGrid();
  document.getElementById('habitModal').classList.add('show');
  setTimeout(()=>document.getElementById('inputName').focus(),100);
}
function closeModal(){document.getElementById('habitModal').classList.remove('show');}
function saveHabit(){
  const name=document.getElementById('inputName').value.trim();
  if(!name){alert('Enter a habit name.');return;}
  const color=document.getElementById('inputColor').value;
  if(editingId){
    const h=data.habits.find(x=>x.id===editingId);
    if(h){h.name=name;h.emoji=selectedEmoji;h.color=color;}
  }else{
    data.habits.push({id:uid(),name,emoji:selectedEmoji,color});
  }
  saveData();closeModal();render();
}
function deleteHabit(id){
  if(!confirm('Delete this habit and all its data?'))return;
  data.habits=data.habits.filter(x=>x.id!==id);
  Object.keys(data.checks).forEach(k=>{delete data.checks[k][id];});
  saveData();render();
}

// === EXPORT / IMPORT ===
function exportData(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`habit-tracker-${mk()}.json`;a.click();
}
function importData(){
  const inp=document.getElementById('fileInput');
  inp.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const d=JSON.parse(ev.target.result);
        if(d.habits){data=d;saveData();render();alert('Imported!');}
        else alert('Invalid file.');
      }catch{alert('Failed to parse.');}
    };
    r.readAsText(f);inp.value='';
  };
  inp.click();
}

// === EVENTS ===
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
document.getElementById('habitModal').addEventListener('click',e=>{if(e.target.id==='habitModal')closeModal();});

let resizeT;window.addEventListener('resize',()=>{clearTimeout(resizeT);resizeT=setTimeout(render,200);});

// === GO ===
init();
