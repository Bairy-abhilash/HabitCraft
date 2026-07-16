// =============================================
//           HABIT TRACKER APPLICATION
// =============================================

const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES=['Mo','Tu','We','Th','Fr','Sa','Su'];
const DAY_NAMES_FULL=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const EMOJIS=[];

// Mood and Motivation option definitions
const MOOD_OPTIONS=[
  {v:1, e:'😭', t:'Terrible'},
  {v:2, e:'😞', t:'Very Bad'},
  {v:3, e:'😕', t:'Bad'},
  {v:4, e:'😐', t:'Low'},
  {v:5, e:'🙂', t:'Neutral'},
  {v:6, e:'😊', t:'Good'},
  {v:7, e:'😄', t:'Happy'},
  {v:8, e:'😁', t:'Great'},
  {v:9, e:'🤩', t:'Amazing'},
  {v:10,e:'🥳', t:'Fantastic'}
];

const MOTIV_OPTIONS=[
  {v:1, e:'😴', t:'None'},
  {v:2, e:'😪', t:'Very Low'},
  {v:3, e:'😕', t:'Low'},
  {v:4, e:'😐', t:'Fair'},
  {v:5, e:'👍', t:'Average'},
  {v:6, e:'💪', t:'Good'},
  {v:7, e:'🚀', t:'High'},
  {v:8, e:'🔥', t:'Very High'},
  {v:9, e:'⚡', t:'Excellent'},
  {v:10,e:'🏆', t:'Maximum'}
];

function getOptionFor(type,val){
  const list = type==='mood' ? MOOD_OPTIONS : MOTIV_OPTIONS;
  return list.find(o=>o.v===val) || null;
}

function buildOptionsHTML(type,day){
  const list = type==='mood' ? MOOD_OPTIONS : MOTIV_OPTIONS;
  return list.map(o=>{
    return `<div class="custom-select-option" role="option" tabindex="0" data-value="${o.v}" onclick="setMood('${type}',${day},${o.v})">${o.e} ${o.v} · ${o.t}</div>`;
  }).join('');
}

function togglePicker(btn){
  const wrap=btn.closest('.custom-select');
  const isOpen=wrap.classList.contains('open');
  closeAllPickers();
  if(!isOpen){
    wrap.classList.add('open');
    const opts=wrap.querySelector('.custom-select-options');
    opts.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    // focus first option for keyboard
    const first=opts.querySelector('.custom-select-option');
    if(first) first.focus();
  }
}

function closeAllPickers(){
  document.querySelectorAll('.custom-select.open').forEach(w=>{
    w.classList.remove('open');
    const btn=w.querySelector('.custom-select-toggle');
    const opts=w.querySelector('.custom-select-options');
    if(opts) opts.setAttribute('aria-hidden','true');
    if(btn) btn.setAttribute('aria-expanded','false');
  });
}

// Clicking outside closes pickers
document.addEventListener('click', (e)=>{
  if(!e.target.closest || !document.querySelector) return;
  if(!e.target.closest('.custom-select')) closeAllPickers();
});

// Keyboard support: Enter/Space to open when toggle focused, Esc to close
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){ closeAllPickers(); return; }
  const active=document.activeElement;
  if(active && active.classList && active.classList.contains('custom-select-toggle')){
    if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
      e.preventDefault(); togglePicker(active);
    }
    if(e.key==='ArrowDown'){
      e.preventDefault(); togglePicker(active);
    }
  }
  if(active && active.classList && active.classList.contains('custom-select-option')){
    if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
      e.preventDefault(); active.click();
    }
  }
});

function setMood(type,day,value){
  const mkey=mk();
  if(!data[type]) data[type]={};
  if(!data[type][mkey]) data[type][mkey]={};
  if(!value || value===0) delete data[type][mkey][day]; else data[type][mkey][day]=value;
  saveData();
  closeAllPickers();
  renderMoodRows();
  renderMentalChart();
}

let currentYear, currentMonth;
let data={};
let editingId=null;
let selectedEmoji='';
let quoteData=null;
let themeMode='light';
let themeOverrideUntil=null;
let themeOverrideMode='auto';
let quoteCache=[];

function getDateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}

function getMonthKeyFromDate(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;}

// === INIT ===
function init(){
  loadData();
  initTheme();
  initQuote();
  // Cleanup any blank habits from storage so no empty row is displayed.
  if(data.habits && data.habits.length>0){
    const cleaned=data.habits.filter(h=>h.name&&h.name.trim()!=='');
    if(cleaned.length!==data.habits.length){
      data.habits=cleaned;
      saveData();
    }
  }
  // MIGRATION: replace any existing habits with the new default set once
  // This ensures the reduced list appears in the UI even if previous data existed.
  if(!data.migratedToV1){
    data.habits=[
      {id:uid(),name:'Cold Shower',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Plan the day',emoji:'',color:'#00b894'},
      {id:uid(),name:'DSA',emoji:'',color:'#fdcb6e'},
      {id:uid(),name:'Drink 2L water',emoji:'',color:'#d63031'},
      {id:uid(),name:'Github',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Devlopment',emoji:'',color:'#6c5ce7'},
    ];
    data.migratedToV1=true;
    saveData();
  }
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
    // Default habits reduced to 6 rows as requested
    data.habits=[
      {id:uid(),name:'Cold Shower',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Plan the day',emoji:'',color:'#00b894'},
      {id:uid(),name:'DSA',emoji:'',color:'#fdcb6e'},
      {id:uid(),name:'Drink 2L water',emoji:'',color:'#d63031'},
      {id:uid(),name:'Github',emoji:'',color:'#0984e3'},
      {id:uid(),name:'Devlopment',emoji:'',color:'#6c5ce7'},
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

function initTheme(){
  const savedTheme=localStorage.getItem('habitcraft-theme');
  if(savedTheme){themeMode=savedTheme;}
  const savedMode=localStorage.getItem('habitcraft-theme-mode');
  if(savedMode){themeOverrideMode=savedMode;}
  themeOverrideUntil=Number(localStorage.getItem('habitcraft-theme-until')||'0');
  applyTheme();
  const toggle=document.getElementById('themeToggle');
  if(toggle){toggle.textContent=themeMode==='dark'?'☀️':'🌙';toggle.addEventListener('click',toggleTheme);}
  setInterval(syncThemeByTime,1000);
}

function applyTheme(){
  document.body.classList.toggle('dark-mode',themeMode==='dark');
  document.documentElement.style.setProperty('--app-bg', themeMode==='dark' ? '#1f2328' : '#2d2d2d');
  const toggle=document.getElementById('themeToggle');
  if(toggle){toggle.textContent=themeMode==='dark'?'☀️':'🌙';}
}

function getNextScheduledSwitchTime(now){
  const next=new Date(now);
  next.setMinutes(0,0,0);
  if(now.getHours()<12){
    next.setHours(12,0,0,0);
  }else{
    next.setHours(24,0,0,0);
  }
  if(next<=now){next.setDate(next.getDate()+1);}
  if(next.getHours()===24){next.setHours(0,0,0,0);}
  return next.getTime();
}

function toggleTheme(){
  themeMode=themeMode==='dark'?'light':'dark';
  themeOverrideMode='manual';
  themeOverrideUntil=null;
  localStorage.setItem('habitcraft-theme',themeMode);
  localStorage.setItem('habitcraft-theme-mode','manual');
  localStorage.removeItem('habitcraft-theme-until');
  applyTheme();
}

function syncThemeByTime(){
  if(themeOverrideMode==='manual'){
    return;
  }

  const now=new Date();
  const hour=now.getHours();
  const shouldBeDark=hour>=12;
  const nextTheme=shouldBeDark?'dark':'light';
  if(themeOverrideUntil && Date.now()<themeOverrideUntil){
    return;
  }
  if(themeMode!==nextTheme){
    themeMode=nextTheme;
    localStorage.setItem('habitcraft-theme',themeMode);
    localStorage.setItem('habitcraft-theme-mode','auto');
    localStorage.removeItem('habitcraft-theme-until');
    themeOverrideUntil=null;
    applyTheme();
  }
}

function getLocalQuotes(){
  return [
    {text:'Success is not final, failure is not fatal: it is the courage to continue that counts.', author:'Winston Churchill'},
    {text:'The only way to do great work is to love what you do.', author:'Steve Jobs'},
    {text:'What you do every day matters more than what you do once in a while.', author:'Gretchen Rubin'},
    {text:'It does not matter how slowly you go as long as you do not stop.', author:'Confucius'},
    {text:'The future depends on what you do today.', author:'Mahatma Gandhi'},
    {text:'Small deeds done are better than great deeds planned.', author:'Peter Marshall'},
    {text:'You do not have to be great to start, but you have to start to be great.', author:'Zig Ziglar'},
    {text:'Discipline is choosing between what you want most and what you want now.', author:'Abraham Lincoln'},
    {text:'A journey of a thousand miles begins with a single step.', author:'Lao Tzu'},
    {text:'The secret of getting ahead is getting started.', author:'Mark Twain'},
    {text:'Focus on being productive instead of busy.', author:'Tim Ferriss'},
    {text:'Success usually comes to those who are too busy to be looking for it.', author:'Henry David Thoreau'},
    {text:'Dream big. Start small. Act now.', author:'Robin Sharma'},
    {text:'The best way to predict the future is to create it.', author:'Peter Drucker'},
    {text:'Don’t watch the clock; do what it does. Keep going.', author:'Sam Levenson'},
    {text:'Action is the foundational key to all success.', author:'Pablo Picasso'},
    {text:'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author:'Aristotle'},
    {text:'The way to get started is to quit talking and begin doing.', author:'Walt Disney'},
    {text:'Consistency is what transforms average into excellence.', author:'Tony Robbins'},
    {text:'One day or day one. You decide.', author:'Unknown'},
    {text:'Productivity is being able to do things that you were never able to do before.', author:'Franz Kafka'},
    {text:'Do the hard jobs first. The easy jobs will take care of themselves.', author:'Dale Carnegie'},
    {text:'It always seems impossible until it is done.', author:'Nelson Mandela'},
    {text:'The difference between ordinary and extraordinary is that little extra.', author:'Jimmy Johnson'},
    {text:'Success is the sum of small efforts, repeated day in and day out.', author:'Robert Collier'},
    {text:'You miss 100% of the shots you don’t take.', author:'Wayne Gretzky'},
    {text:'If you can dream it, you can do it.', author:'Walt Disney'},
    {text:'Don’t be afraid to give up the good to go for the great.', author:'John D. Rockefeller'},
    {text:'Great things are done by a series of small things brought together.', author:'Vincent Van Gogh'},
    {text:'Work hard in silence, let your success be your noise.', author:'Frank Ocean'},
    {text:'The man who moves a mountain begins by carrying away small stones.', author:'Confucius'},
    {text:'Start where you are. Use what you have. Do what you can.', author:'Arthur Ashe'},
    {text:'An inch of movement will bring you miles of no regret.', author:'Unknown'},
    {text:'Make today count.', author:'Unknown'},
    {text:'Don’t count the days, make the days count.', author:'Muhammad Ali'},
    {text:'You are what you do, not what you say you’ll do.', author:'C. G. Jung'},
    {text:'The only limit to our realization of tomorrow is our doubts of today.', author:'Franklin D. Roosevelt'},
    {text:'Success is walking from failure to failure with no loss of enthusiasm.', author:'Winston Churchill'},
    {text:'Motivation is what gets you started. Habit is what keeps you going.', author:'Jim Ryun'},
    {text:'Be stubborn about your goals and flexible about your methods.', author:'Unknown'},
    {text:'Small steps every day lead to big results.', author:'Unknown'},
    {text:'What matters is not how long you live, but how well you live.', author:'John Wooden'},
    {text:'The harder you work for something, the greater you’ll feel when you achieve it.', author:'Unknown'},
    {text:'A little progress each day adds up to big results.', author:'Unknown'},
    {text:'Focus on progress, not perfection.', author:'Unknown'},
    {text:'No matter how small the step, it is still a step forward.', author:'Unknown'},
    {text:'The best investment is in yourself.', author:'Warren Buffett'},
    {text:'Your future is created by what you do today, not tomorrow.', author:'Robert Kiyosaki'},
    {text:'The key to success is action.', author:'Pablo Picasso'},
    {text:'Set your goals high, and don’t stop till you get there.', author:'Bo Jackson'},
    {text:'Your habits define your future.', author:'Unknown'},
    {text:'Excellence is never an accident.', author:'John Wooden'},
    {text:'Motivation will almost always beat mere talent.', author:'Norman Ralph Augustine'},
    {text:'The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.', author:'Vince Lombardi'},
    {text:'You can’t change the past, but you can change the future.', author:'Unknown'},
    {text:'The more you practice, the better you get.', author:'Unknown'},
    {text:'Success is not about being the best. It’s about being better than you were yesterday.', author:'Unknown'},
    {text:'The first step in solving a problem is recognizing there is one.', author:'Will Rogers'}
  ];
}

async function initQuote(){
  const today=new Date();
  const dayKey=today.toISOString().slice(0,10);
  const storedQuote=localStorage.getItem('habitcraft-quote');
  if(storedQuote){
    try{const parsed=JSON.parse(storedQuote); if(parsed.day===dayKey){quoteData=parsed;}}catch(e){}
  }
  if(quoteData){
    renderQuote();
    return;
  }

  try{
    const response=await fetch('https://api.quotable.io/random?maxLength=140');
    if(response.ok){
      const data=await response.json();
      quoteData={text:data.content, author:data.author, day:dayKey};
      localStorage.setItem('habitcraft-quote',JSON.stringify(quoteData));
      renderQuote();
      return;
    }
  }catch(e){}

  const quotes=getLocalQuotes();
  const seen=JSON.parse(localStorage.getItem('habitcraft-quote-history')||'[]');
  const available=quotes.filter(q=>!seen.includes(q.text));
  const chosen=available[Math.floor(Math.random()*available.length)]||quotes[0];
  quoteData={text:chosen.text, author:chosen.author, day:dayKey};
  const nextSeen=[quoteData.text,...seen].slice(0,20);
  localStorage.setItem('habitcraft-quote-history',JSON.stringify(nextSeen));
  localStorage.setItem('habitcraft-quote',JSON.stringify(quoteData));
  renderQuote();
}

function renderQuote(){
  const textEl=document.getElementById('quoteText');
  const authorEl=document.getElementById('quoteAuthor');
  if(textEl)textEl.textContent=quoteData?quoteData.text:'';
  if(authorEl)authorEl.textContent=quoteData?`— ${quoteData.author}`:'';
}

function uid(){return Math.random().toString(36).substr(2,9);}
function mk(){return `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;}
function daysInMonth(){return new Date(currentYear,currentMonth+1,0).getDate();}
// ISO weekday: Mon=0 ... Sun=6
function isoDow(d){const dow=new Date(currentYear,currentMonth,d).getDay();return dow===0?6:dow-1;}

function isPastDate(year,month,day){
  const today=new Date();
  const dateToCheck=new Date(year,month,day,23,59,59,999);
  return dateToCheck < today;
}

function getDaysRemainingForHabit(hb, checksForMonth){
  const today=new Date();
  const isCurrentMonth=today.getFullYear()===currentYear && today.getMonth()===currentMonth;
  if(!isCurrentMonth) return 0;

  const totalDays=daysInMonth();
  const remainingDays=Math.max(0,totalDays-today.getDate());
  const todayCompleted=!!(checksForMonth[hb.id] && checksForMonth[hb.id][today.getDate()]);
  return Math.max(0, remainingDays + (todayCompleted ? 0 : 1));
}

// === RENDER ALL ===
function render(){
  document.getElementById('subtitleMonth').textContent=`~${MONTH_NAMES[currentMonth].toUpperCase()}~`;
  document.getElementById('monthSelect').value=currentMonth;
  document.getElementById('yearInput').value=currentYear;
  renderAchievementBadges();
  renderStats();
  renderGrid();
  renderAnalysis();
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

function renderAchievementBadges(){
  const container=document.getElementById('achievementBadges');
  if(!container)return;
  const badges=getAchievementBadges();
  container.innerHTML=badges.map(b=>`<span class="badge" title="${b.title}">${b.icon}</span>`).join('');
}

function getAchievementBadges(){
  const badges=[];
  const monthKey=mk();
  const habits=data.habits||[];
  const checks=data.checks||{};
  const monthChecks=checks[monthKey]||{};
  const totalCompleted=getTotalCompletedHabitCount();
  const dayStreak=getDayCompletionStreak(monthKey);
  const hasAnyCompleted=Object.values(checks).some(m=>Object.values(m||{}).some(h=>Object.values(h||{}).some(v=>v)));
  const perfectWeek=hasPerfectWeek(monthKey);
  const perfectMonth=hasPerfectMonth(monthKey);
  const perfectDay=hasPerfectDay(monthKey);
  const zeroThreeDays=hasZeroThreeDays(monthKey);
  const manyHabits=habits.length>10;

  if(hasAnyCompleted)badges.push({icon:'👏',title:'First Habit Completed'});
  if(dayStreak>=7)badges.push({icon:'🔥',title:'7-Day Streak'});
  if(dayStreak>=30)badges.push({icon:'🐦‍🔥',title:'30-Day Streak'});
  if(totalCompleted>=100)badges.push({icon:'🥇',title:'100 Habits Completed'});
  if(perfectWeek)badges.push({icon:'🏆',title:'Perfect Week'});
  if(perfectMonth)badges.push({icon:'💯',title:'Perfect Month'});
  if(manyHabits)badges.push({icon:'👾',title:'Added more than 10 habits'});
  if(dayStreak>=150)badges.push({icon:'👑',title:'150-Day Streak'});
  if(dayStreak>=90)badges.push({icon:'🗿',title:'90-Day Streak'});
  if(zeroThreeDays)badges.push({icon:'🤡',title:'0 habits completed in 3 days'});
  if(perfectDay)badges.push({icon:'🚀',title:'Perfect Day'});
  return badges;
}

function getTotalCompletedHabitCount(){
  let total=0;
  Object.values(data.checks||{}).forEach(month=>{
    Object.values(month||{}).forEach(habit=>{
      Object.values(habit||{}).forEach(done=>{if(done)total++;});
    });
  });
  return total;
}

function getDayCompletionCount(monthKey,day){
  const monthChecks=data.checks[monthKey]||{};
  let completed=0;
  (data.habits||[]).forEach(hb=>{if(monthChecks[hb.id]&&monthChecks[hb.id][day])completed++;});
  return completed;
}

function isDayFullyCompleted(monthKey,day){
  const habits=data.habits||[];
  if(habits.length===0)return false;
  const monthChecks=data.checks[monthKey]||{};
  return habits.every(hb=>!!(monthChecks[hb.id]&&monthChecks[hb.id][day]));
}

function hasPerfectWeek(monthKey){
  const days=daysInMonth();
  const weeks=[]; let current=[];
  for(let d=1;d<=days;d++){const dow=isoDow(d); if(dow===0&&current.length>0){weeks.push(current);current=[];} current.push(d);} if(current.length>0)weeks.push(current);
  return weeks.some(w=>w.every(d=>isDayFullyCompleted(monthKey,d)));
}

function hasPerfectMonth(monthKey){
  const days=daysInMonth();
  return Array.from({length:days},(_,i)=>i+1).every(d=>isDayFullyCompleted(monthKey,d));
}

function hasPerfectDay(monthKey){
  const days=daysInMonth();
  return Array.from({length:days},(_,i)=>i+1).some(d=>isDayFullyCompleted(monthKey,d));
}

function hasZeroThreeDays(monthKey){
  const days=daysInMonth();
  let streak=0;
  for(let d=1;d<=days;d++){
    if(getDayCompletionCount(monthKey,d)===0)streak++; else streak=0;
    if(streak>=3)return true;
  }
  return false;
}

function getDayCompletionStreak(monthKey){
  const days=daysInMonth();
  let streak=0;
  let current=0;
  for(let d=1;d<=days;d++){
    if(isDayFullyCompleted(monthKey,d)){current++; streak=Math.max(streak,current);} else {current=0;}
  }
  return streak;
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
  let h1='<tr><th rowspan="3" style="min-width:160px;text-align:left;padding-left:8px;"></th>';
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
    const displayName = hb.name && hb.name.trim() !== '' ? hb.name : '<span class="placeholder">Click to add habit</span>';
    const nameClass = hb.name && hb.name.trim() !== '' ? 'habit-name-cell' : 'habit-name-cell empty';
    body+=`<td class="${nameClass}"><span class="emoji">${hb.emoji}</span>${displayName}
      <span style="float:right;display:inline-flex;gap:2px;">
        <span style="cursor:pointer;font-size:12px;" onclick="editHabit('${hb.id}')" title="Edit">[EDIT]</span>
        <span style="cursor:pointer;font-size:12px;" onclick="deleteHabit('${hb.id}')" title="Delete">[DEL]</span>
      </span>
    </td>`;
    for(let d=1;d<=days;d++){
      const checked=!!data.checks[mkey][hb.id][d];
      const pastDay=isPastDate(currentYear,currentMonth,d);
      const cellClass=`cb-cell${pastDay?' disabled':''}${pastDay&&checked?' checked-disabled':''}`;
      body+=`<td class="${cellClass}"><input type="checkbox" ${checked?'checked':''} ${pastDay?'disabled title="Past days cannot be changed"':''} onchange="toggleDay('${hb.id}',${d},this.checked)"/></td>`;
    }
    body+='</tr>';
  });
  document.getElementById('gridBody').innerHTML=body;
}

// === TOGGLE ===
function toggleDay(hid,day,val){
  if(isPastDate(currentYear,currentMonth,day)) return;
  const mkey=mk();
  const today=new Date();
  const isToday=currentYear===today.getFullYear()&&currentMonth===today.getMonth()&&day===today.getDate();
  const wasComplete=isDayFullyCompleted(mkey,day);
  if(!data.checks[mkey])data.checks[mkey]={};
  if(!data.checks[mkey][hid])data.checks[mkey][hid]={};
  if(val)data.checks[mkey][hid][day]=true;
  else delete data.checks[mkey][hid][day];
  const isCompleteNow=isDayFullyCompleted(mkey,day);
  if(isToday && !wasComplete && isCompleteNow){
    const celebrationDay=getDateKey(today);
    if(data.lastCelebrationDay!==celebrationDay){
      data.lastCelebrationDay=celebrationDay;
      showCelebration();
    }
  }
  saveData();
  // Re-render stats & charts but NOT the grid (to keep checkbox state smooth)
  renderStats();renderAnalysis();renderDailyChart();renderWeeklyChart();renderDonut();
}

function showCelebration(){
  const existing=document.getElementById('celebrationLayer');
  if(existing)existing.remove();
  const layer=document.createElement('div');
  layer.id='celebrationLayer';
  layer.className='celebration-layer';
  const toast=document.createElement('div');
  toast.className='celebration-toast';
  toast.setAttribute('role','status');
  toast.setAttribute('aria-live','polite');
  toast.innerHTML='<div class="celebration-icon">🎉</div><div><strong>All habits completed today!</strong><div>Great job! Keep the streak going!</div></div>';
  layer.appendChild(toast);
  for(let i=0;i<24;i++){
    const piece=document.createElement('span');
    piece.className='confetti-piece';
    const left=Math.random()*100;
    const delay=Math.random()*0.2;
    const duration=1.8+Math.random()*0.8;
    const hue=20+Math.random()*140;
const colors = [
    "#FFD93D", // Yellow
    "#FF6B6B", // Red
    "#6BCB77", // Green
    "#4D96FF", // Blue
    "#C77DFF", // Purple
    "#FF9F1C", // Orange
    "#F72585", // Pink
    "#00C2A8"  // Teal
];

piece.style.left = `${left}%`;

piece.style.setProperty('--delay', `${delay}s`);
piece.style.setProperty('--duration', `${duration}s`);

// Makes each piece drift left/right while falling
piece.style.setProperty('--drift', `${Math.random() * 250 - 125}px`);

// Gives each piece a random color
piece.style.setProperty(
    '--piece-color',
    colors[Math.floor(Math.random() * colors.length)]
);

layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(()=>layer.remove(),2600);
}

// === ANALYSIS TABLE ===
function renderAnalysis(){
  const days=daysInMonth(),mkey=mk(),ck=data.checks[mkey]||{};
  let html='';
  data.habits.forEach(hb=>{
    let actual=0;const hc=ck[hb.id]||{};
    for(let d=1;d<=days;d++){if(hc[d])actual++;}
    const left=getDaysRemainingForHabit(hb, ck);
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

// === MOOD ROWS ===
function renderMoodRows(){
  const days=daysInMonth(),mkey=mk();
  const md=data.mood[mkey]||{};
  const mt=data.motivation[mkey]||{};
  let mh='',mvh='';
  for(let d=1;d<=days;d++){
    const mv=md[d]!==undefined?md[d]:0;
    const mtv=mt[d]!==undefined?mt[d]:0;
    const mcls=mv?` level-${mv}`:'';
    const mtcls=mtv?` level-${mtv}`:'';
    const mvEmoji = mv? (getOptionFor('mood',mv)||{}).e : '';
    const mtEmoji = mtv? (getOptionFor('motivation',mtv)||{}).e : '';
    mh+=`<div class="mood-cell"><div class="custom-select" data-type="mood" data-day="${d}"><button class="custom-select-toggle mood-val${mcls}" onclick="togglePicker(this)" aria-haspopup="listbox" aria-expanded="false" title="Day ${d}">${mv?mvEmoji:'-'}</button><div class="custom-select-options" role="listbox" aria-hidden="true">${buildOptionsHTML('mood', d)}</div></div></div>`;
    mvh+=`<div class="mood-cell"><div class="custom-select" data-type="motivation" data-day="${d}"><button class="custom-select-toggle mood-val${mtcls}" onclick="togglePicker(this)" aria-haspopup="listbox" aria-expanded="false" title="Day ${d}">${mtv?mtEmoji:'-'}</button><div class="custom-select-options" role="listbox" aria-hidden="true">${buildOptionsHTML('motivation', d)}</div></div></div>`;
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
  const days=daysInMonth(),h=data.habits,goal=h.length*days;
  let done=0;const ck=data.checks[mk()]||{};
  h.forEach(hb=>{for(let d=1;d<=days;d++){if(ck[hb.id]&&ck[hb.id][d])done++;}});
  const pct=goal>0?done/goal:0;
  const cx=65,cy=65,r=52,lw=18;

  const pctVal=Math.round(pct*100);
  const leftPct=(100-pctVal);
  const pctEl=document.getElementById('donutPct');
  const subEl=document.getElementById('donutSub');
  const startPct=parseFloat(canvas.dataset.pct || '0');
  const startVal=Number.isFinite(startPct)?Math.round(startPct*100):0;
  animateText(pctEl,pctVal,startVal,700);
  if(subEl)subEl.textContent=leftPct+'%';
  const targetPct=pct;
  canvas.dataset.pct=targetPct;

  const drawFrame=(timestamp)=>{
    const startTime=canvas.dataset.startTime?parseFloat(canvas.dataset.startTime):timestamp;
    if(!canvas.dataset.startTime){canvas.dataset.startTime=timestamp;}
    const elapsed=Math.min(1,(timestamp-startTime)/700);
    const eased=1-Math.pow(1-elapsed,3);
    const displayPct=startPct+(targetPct-startPct)*eased;
    drawDonutArc(ctx,cx,cy,r,lw,displayPct);
    if(elapsed<1){requestAnimationFrame(drawFrame);} else {canvas.dataset.startTime='';}
  };

  drawDonutArc(ctx,cx,cy,r,lw,startPct);
  requestAnimationFrame(drawFrame);
}

function animateText(el,target,start,duration){
  if(!el)return;
  const startTime=performance.now();
  const step=(now)=>{
    const progress=Math.min(1,(now-startTime)/duration);
    const eased=1-Math.pow(1-progress,3);
    const current=Math.round(start+(target-start)*eased);
    el.textContent=current+'%';
    if(progress<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function drawDonutArc(ctx,cx,cy,r,lw,pct){
  ctx.clearRect(0,0,130,130);
  ctx.save();
  ctx.lineCap='round';
  ctx.lineWidth=lw;

  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='#d6cbbf';
  ctx.shadowColor='rgba(0,0,0,0.08)';
  ctx.shadowBlur=6;
  ctx.stroke();

  if(pct>0){
    const gradient=ctx.createLinearGradient(20,20,110,110);
    gradient.addColorStop(0,'#d4956a');
    gradient.addColorStop(0.5,'#e2b37c');
    gradient.addColorStop(1,'#c97d4f');
    ctx.beginPath();
    ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
    ctx.strokeStyle=gradient;
    ctx.shadowColor='rgba(212,149,106,0.35)';
    ctx.shadowBlur=10;
    ctx.stroke();
  }

  ctx.restore();
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

  const gridColor=themeMode==='dark'?'#7b8591':'#757373';
  const labelColor=themeMode==='dark'?'#d8d8d8':'#383636';
  const fillColorA=themeMode==='dark'?'rgba(243, 58, 58, 0.24)':'rgba(243, 58, 58, 0.18)';
  const fillColorB=themeMode==='dark'?'rgba(26, 30, 228, 0.24)':'rgba(26, 30, 228, 0.16)';

  ctx.fillStyle=labelColor;ctx.font='9px sans-serif';
  for(let i=0;i<=10;i+=2){
    const y=8+chartH-(i/10)*chartH;
    ctx.strokeStyle=gridColor;ctx.lineWidth=0.4;
    ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-4,y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(i,4,y+3);
  }

  function drawArea(vals,lineColor,fillColor){
    const pts=[];
    for(let d=1;d<=days;d++){
      if(vals[d]!==undefined){
        const x=pad+((d-1)/(Math.max(1,days-1)))*chartW;
        const y=8+chartH-(vals[d]/10)*chartH;
        pts.push({x,y});
      }
    }
    if(pts.length<2)return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x,8+chartH);
    ctx.lineTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,8+chartH);ctx.closePath();
    ctx.fillStyle=fillColor;ctx.fill();

    ctx.beginPath();
    pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.strokeStyle=lineColor;ctx.lineWidth=1.4;ctx.shadowBlur=4;ctx.shadowColor='rgba(0,0,0,0.12)';ctx.stroke();
    ctx.shadowBlur=0;
  }

  drawArea(md,'#f33a3a',fillColorA);
  drawArea(mt,'#1a1ee4',fillColorB);

  ctx.fillStyle=labelColor;ctx.font='8px sans-serif';ctx.textAlign='center';
  for(let d=1;d<=days;d++){
    const x=pad+((d-1)/(Math.max(1,days-1)))*chartW;
    ctx.fillText(d,x,8+chartH+12);
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
