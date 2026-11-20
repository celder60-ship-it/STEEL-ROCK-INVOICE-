'use strict';
const $=id=>document.getElementById(id), key='steel-rock-timesheet-v1';
const ids=['date','job','site','start','end','break','travel','km','unit','notes'];
const empty=()=>({entries:[],employee:'',signoffs:{},draft:null});
let db=empty(),editing=null;
try{const x=JSON.parse(localStorage.getItem(key));if(x&&Array.isArray(x.entries)&&x.signoffs)db=x}catch{}
const day=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dateObj=s=>new Date(s+'T12:00:00');
function offset(s,n){const d=dateObj(s);d.setDate(d.getDate()+n);return day(d)}
function monday(s){const d=dateObj(s);return offset(s,-((d.getDay()+6)%7))}
const today=()=>day(new Date());
const fmt=n=>Number(n).toFixed(2), nameKey=v=>String(v).trim().toLowerCase();
const mins=t=>{if(!/^\d{2}:\d{2}$/.test(t))return NaN;const [h,m]=t.split(':').map(Number);return h<24&&m<60?h*60+m:NaN};
function duration(r){const a=mins(r.start),b=mins(r.end);if(!Number.isFinite(a)||!Number.isFinite(b))return NaN;return (b-a+1440)%1440}
function work(r){return (duration(r)-Number(r.break))/60}
function total(r){return work(r)+Number(r.travel)}
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
let toastTimer;
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500)}
function persist(){try{localStorage.setItem(key,JSON.stringify(db));$('status').textContent='Saved on this device • No login required';return true}catch{$('status').textContent='Storage unavailable — export a backup before closing';return false}}
function fields(){return Object.fromEntries(ids.map(id=>[id,$(id).value]))}
function draft(){db.draft={...fields(),editing};persist()}
function selected(){return db.entries.filter(r=>nameKey(r.employee)===nameKey($('employee').value)&&r.date>=$('week').value&&r.date<=offset($('week').value,6)).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start))}
function sums(rows){return rows.reduce((a,r)=>({work:a.work+work(r),travel:a.travel+Number(r.travel),km:a.km+Number(r.km||0),total:a.total+total(r)}),{work:0,travel:0,km:0,total:0})}
function signKey(){return JSON.stringify([nameKey($('employee').value),$('week').value])}
function showSign(){const s=db.signoffs[signKey()]||{};$('supervisor').value=s.supervisor||'';$('signed').value=s.signed||''}
function weekRender(){const start=$('week').value;const rows=selected(),s=sums(rows);$('range').textContent=start+' to '+offset(start,6)+' • '+rows.length+' entries';$('workTotal').textContent=fmt(s.work);$('travelTotal').textContent=fmt(s.travel);$('kmTotal').textContent=Number(s.km.toFixed(1)).toString();$('grandTotal').textContent=fmt(s.total);const el=$('entries');el.replaceChildren();if(!rows.length){const p=document.createElement('p');p.className='hint';p.textContent='No entries for this employee and week.';el.append(p)}
for(const r of rows){const row=document.createElement('div');row.className='entry';const a=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p'),detail=document.createElement('p');h.textContent=r.date+' • '+(r.site||'No site entered');p.textContent=r.start+' – '+r.end+(mins(r.end)<mins(r.start)?' (+1 day)':'')+' • Break '+r.break+' min • Travel '+fmt(r.travel)+' h';detail.textContent=[r.job?'Job: '+r.job:'',r.unit?'Unit: '+r.unit:'',Number(r.km)?r.km+' km':'',r.notes].filter(Boolean).join('\n');const controls=document.createElement('div');controls.className='buttons';for(const [label,fn] of [['Edit',()=>edit(r)],['Delete',()=>remove(r)]]){const b=document.createElement('button');b.textContent=label;b.type='button';if(label==='Delete')b.className='danger';b.onclick=fn;controls.append(b)}a.append(h,p,detail,controls);const hrs=document.createElement('div');hrs.className='hours';hrs.textContent=fmt(total(r))+' h';row.append(a,hrs);el.append(row)}}
function updateEntry(){const r=fields(),w=work(r),t=total(r);$('entryWork').textContent=Number.isFinite(w)&&w>=0?fmt(w):'—';$('entryTotal').textContent=Number.isFinite(t)&&t>=0?fmt(t):'—'}
function reset(){editing=null;for(const id of ids)$(id).value=['break','travel','km'].includes(id)?'0':id==='date'?today():'';if($('date').value<$('week').value||$('date').value>offset($('week').value,6))$('date').value=$('week').value;$('editorTitle').textContent='New daily entry';$('saveEntry').textContent='Save entry';$('cancelEdit').hidden=true;$('formError').textContent='';updateEntry();draft()}
function edit(r){editing=r.id;for(const id of ids)$(id).value=r[id]??'';$('editorTitle').textContent='Edit daily entry';$('saveEntry').textContent='Update entry';$('cancelEdit').hidden=false;updateEntry();draft();$('editor').scrollIntoView({behavior:'smooth'})}
function remove(r){if(!confirm('Delete the entry for '+r.date+'?'))return;db.entries=db.entries.filter(x=>x.id!==r.id);if(editing===r.id)reset();persist();weekRender();toast('Entry deleted')}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(dateObj(v))&&day(dateObj(v))===v}
function valid(r){return r&&typeof r.id==='string'&&typeof r.employee==='string'&&r.employee.trim()&&validDate(r.date)&&Number.isFinite(duration(r))&&duration(r)>0&&Number.isInteger(Number(r.break))&&Number(r.break)>=0&&work(r)>=0&&Number.isFinite(Number(r.travel))&&Number(r.travel)>=0&&total(r)<=24&&Number.isFinite(Number(r.km))&&Number(r.km)>=0&&['job','site','unit','notes'].every(k=>typeof r[k]==='string')}
function selectWeek(v){if(!validDate(v))v=today();$('week').value=monday(v);db.week=$('week').value;persist();showSign();weekRender()}
$('employee').value=db.employee||'';$('week').value=validDate(db.week)?monday(db.week):monday(today());
$('employee').addEventListener('input',()=>{db.employee=$('employee').value;persist();showSign();weekRender()});
$('week').onchange=()=>selectWeek($('week').value);$('prev').onclick=()=>selectWeek(offset($('week').value,-7));$('next').onclick=()=>selectWeek(offset($('week').value,7));$('today').onclick=()=>selectWeek(today());
for(const id of ids)$(id).addEventListener('input',()=>{updateEntry();draft()});
$('entryForm').onsubmit=e=>{e.preventDefault();const r={...fields(),id:editing||uid(),employee:$('employee').value.trim()};r.km=r.km||'0';if(!valid(r)){$('formError').textContent='Enter a name and valid shift. Break cannot exceed shift length; work plus outside travel cannot exceed 24 hours.';return}
const interval=x=>{const d=dateObj(x.date);d.setHours(0,0,0,0);const a=d.getTime()+mins(x.start)*60000;return [a,a+duration(x)*60000]};const [a,b]=interval(r);if(db.entries.some(x=>x.id!==r.id&&nameKey(x.employee)===nameKey(r.employee)&&(()=>{const [c,d]=interval(x);return a<d&&b>c})())){if(!confirm('This shift overlaps another saved shift. Save anyway?'))return}
db.entries=db.entries.filter(x=>x.id!==r.id);db.entries.push(r);db.employee=r.employee;selectWeek(r.date);reset();persist();weekRender();toast('Entry saved')};
$('clear').onclick=reset;$('cancelEdit').onclick=reset;
for(const id of ['supervisor','signed'])$(id).oninput=()=>{db.signoffs[signKey()]={supervisor:$('supervisor').value,signed:$('signed').value};persist()};
$('restore').onclick=()=>$('file').click();
$('file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const x=JSON.parse(await f.text());if(!x||!Array.isArray(x.entries)||!x.entries.every(valid)||!x.signoffs||typeof x.signoffs!=='object'||Array.isArray(x.signoffs)||new Set(x.entries.map(r=>r.id)).size!==x.entries.length)throw Error('Invalid timesheet backup');if(!confirm('Replace all local timesheet records with this backup?'))return;db={...empty(),...x};$('employee').value=db.employee||'';selectWeek(db.week||today());reset();persist();showSign();weekRender();toast('Backup imported')}catch(err){alert(err.message||'Could not import backup')}finally{e.target.value=''}};
if(db.draft&&ids.every(id=>typeof db.draft[id]==='string')){for(const id of ids)$(id).value=db.draft[id];editing=db.entries.some(r=>r.id===db.draft.editing)?db.draft.editing:null;if(editing){$('editorTitle').textContent='Edit daily entry';$('saveEntry').textContent='Update entry';$('cancelEdit').hidden=false}}else reset();
updateEntry();showSign();weekRender();
if(!window.InvoiceAndroid&&location.protocol==='https:'&&'serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
