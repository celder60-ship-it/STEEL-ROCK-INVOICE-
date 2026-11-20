'use strict';
(()=>{
const W=612,H=792,S=3;
function font(c,n,b=false){c.font=(b?'bold ':'')+n+'px Arial,sans-serif'}
function text(c,v,x,y,n=10,b=false,align='left',color='#171717'){font(c,n,b);c.fillStyle=color;c.textAlign=align;c.textBaseline='top';c.fillText(String(v??''),x,y);c.textAlign='left'}
function wrap(c,v,w,n=10){font(c,n);const out=[];for(const para of String(v??'').split('\n')){let line='';for(const word of para.split(/\s+/)){if(line&&c.measureText(line+' '+word).width>w){out.push(line);line=''}if(line)line+=' ';for(const ch of word){if(line&&c.measureText(line+ch).width>w){out.push(line);line=''}line+=ch}}out.push(line)}return out}
function rect(c,x,y,w,h,fill){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h)}c.strokeStyle='#7a7a7a';c.lineWidth=.6;c.strokeRect(x,y,w,h)}
function canvas(){const a=document.createElement('canvas');a.width=W*S;a.height=H*S;const c=a.getContext('2d',{alpha:false});c.scale(S,S);c.fillStyle='#fff';c.fillRect(0,0,W,H);return [a,c]}
function line(c,v,x,y,w,n=10){wrap(c,v,w,n).forEach((s,i)=>text(c,s,x,y+i*(n+3),n))}
async function render(){
 const rows=selected(),employee=$('employee').value.trim(),week=$('week').value;
 if(!employee)throw Error('Enter an employee name first.');
 const s=sums(rows),logo=$('logo');if(logo.decode)await logo.decode().catch(()=>{});
 const pages=[];let pair,c,y;
 function newPage(){pair=canvas();c=pair[1];pages.push(pair[0]);if(logo.naturalWidth)c.drawImage(logo,30,25,225,225*logo.naturalHeight/logo.naturalWidth);else text(c,'STEEL ROCK',30,34,20,true);text(c,'WEEKLY TIMESHEET',582,30,18,true,'right');text(c,'FIELD SERVICES • DAILY WORK LOG',582,54,9,true,'right');rect(c,30,92,552,53);text(c,'EMPLOYEE',38,99,8,true);line(c,employee,38,112,270,11);text(c,'WEEK (MON–SUN)',574,99,8,true,'right');text(c,week+' to '+offset(week,6),574,114,10,true,'right');c.fillStyle='#171717';c.fillRect(30,153,552,24);for(const [v,x] of [['DATE / JOB / WORK LOG',38],['SHIFT',337],['BREAK',409],['WORK',457],['TRAVEL',505],['TOTAL',574]])text(c,v,x,161,8,true,x===38?'left':'right','#fff');y=177}
 function footer(last){if(last){const v=[['WORK HOURS',fmt(s.work)],['TRAVEL HOURS',fmt(s.travel)],['KM',s.km.toFixed(1)],['TOTAL HOURS',fmt(s.total)]];v.forEach(([k,n],i)=>{const x=30+i*138;rect(c,x,646,138,42,i===3?'#171717':'#f0f0f0');text(c,k,x+8,652,8,true,'left',i===3?'#fff':'#171717');text(c,n,x+8,665,15,true,'left',i===3?'#fff':'#171717')});text(c,'Supervisor: ',30,701,9,true);line(c,$('supervisor').value,30,714,265,10);text(c,'Employee confirmation:',310,701,9,true);line(c,$('signed').value,310,714,270,10)}text(c,'Steel Rock Energy Services Ltd. • Work time record',30,768,8);text(c,'Page '+pages.length,582,768,8,false,'right')}
 newPage();
 for(const r of rows){const details=[r.date+' • '+(r.site||'No site'),r.job?'Job: '+r.job:'',r.unit?'Unit: '+r.unit:'',Number(r.km)?r.km+' km':'',r.notes].filter(Boolean).join('\n');const lines=wrap(c,details,278,9);const h=Math.max(38,lines.length*12+12);if(y+h>634&&y>177){footer(false);newPage()}if(y+h>634)throw Error('A work log is too long to fit on a page. Shorten this entry and retry.');rect(c,30,y,552,h);lines.forEach((l,i)=>text(c,l,38,y+6+i*12,9,i===0));text(c,r.start+'–'+r.end,337,y+6,8,false,'right');if(mins(r.end)<mins(r.start))text(c,'+1 day',337,y+17,8,false,'right');for(const [v,x] of [[r.break+'m',409],[fmt(work(r)),457],[fmt(r.travel),505],[fmt(total(r)),574]])text(c,v,x,y+6,9,x===574,'right');y+=h}
 if(!rows.length)text(c,'No entries for the selected employee and week.',38,y+12,10);
 footer(true);return pages;
}
const blob=(c,t,q)=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Export failed')),t,q));
async function pdf(pages){
 const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 function add(v){const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);length+=b.length}
 function object(id,s){offsets[id]=length;add(id+' 0 obj\n'+s+'\nendobj\n')}
 add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+3*i)+' 0 R').join(' ')+'] >>');
 for(let i=0;i<pages.length;i++){const p=pages[i],id=3+i*3,jpg=new Uint8Array(await(await blob(p,'image/jpeg',.95)).arrayBuffer());object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');offsets[id+1]=length;add((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.width+' /Height '+p.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpg.length+' >>\nstream\n');add(jpg);add('\nendstream\nendobj\n');const stream='q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n';object(id+2,'<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream')}
 const xref=length,n=3+3*pages.length;add('xref\n0 '+n+'\n0000000000 65535 f \n');for(let i=1;i<n;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(chunks,{type:'application/pdf'})
}
function b64(b){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(b)})}
async function save(b,name){const cap=window.Capacitor;if(window.InvoiceAndroid?.saveInvoiceFile){window.InvoiceAndroid.saveInvoiceFile(await b64(b),name,b.type);return}if(cap?.getPlatform?.()==='ios'&&cap.nativePromise){const f=await cap.nativePromise('Filesystem','writeFile',{path:name,data:await b64(b),directory:'CACHE'});await cap.nativePromise('Share','share',{title:name,files:[f.uri]});return}const a=document.createElement('a'),url=URL.createObjectURL(b);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('Export prepared: '+name)}
let busy=false;async function run(task){if(busy)return;busy=true;for(const id of ['pdf','png','csv','backup'])$(id).disabled=true;try{await task()}catch(e){alert(e.message||'Could not export file')}finally{busy=false;for(const id of ['pdf','png','csv','backup'])$(id).disabled=false}}
const filename=()=> 'Timesheet-'+($('employee').value.trim().replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40)||'Employee')+'-'+$('week').value;
$('pdf').onclick=()=>run(async()=>save(await pdf(await render()),filename()+'.pdf'));
$('png').onclick=()=>run(async()=>{const pages=await render();if(pages.length!==1)throw Error('This week needs multiple pages. Use Save PDF to include every entry.');await save(await blob(pages[0],'image/png'),filename()+'.png')});
$('csv').onclick=()=>run(async()=>{if(!$('employee').value.trim())throw Error('Enter an employee name first.');const quote=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};const list=[['Employee','Date','Job','Site','Start','Finish','Break minutes','Work hours','Travel hours','Total hours','Kilometres','Unit','Work log'],...selected().map(r=>[r.employee,r.date,r.job,r.site,r.start,r.end,r.break,fmt(work(r)),fmt(r.travel),fmt(total(r)),r.km,r.unit,r.notes])];await save(new Blob(['\ufeff'+list.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv'}),filename()+'.csv')});
$('backup').onclick=()=>run(async()=>{const json=JSON.stringify(db,null,2);if(window.InvoiceAndroid?.saveBackup){window.InvoiceAndroid.saveBackup(json);return}await save(new Blob([json],{type:'application/json'}),'Timesheet-Backup.json')});
})();
