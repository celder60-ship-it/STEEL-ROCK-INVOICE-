/* Offline, single-page Letter invoice exports shared by Android, iOS and Safari.
   The same invoice data and calculation functions drive both export formats. */
(function () {
  'use strict';
  const W=612,H=792,DPI=300;
  const left=42,right=588,width=right-left;
  const fmt=n=>money(n);
  const textValue=v=>String(v??'');
  const canvasBlob=(canvas,type,quality)=>new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not generate file.')),type,quality);
  });
  function wrap(ctx,value,maxWidth){
    const lines=[];
    for(const para of textValue(value).split(/\r?\n/)){
      let line='';
      for(const word of para.split(/\s+/)){
        let next=line?line+' '+word:word;
        if(ctx.measureText(next).width<=maxWidth){line=next;continue}
        if(line){lines.push(line);line=''}
        for(const ch of word){
          if(line&&ctx.measureText(line+ch).width>maxWidth){lines.push(line);line=''}
          line+=ch;
        }
      }
      lines.push(line);
    }
    return lines.length?lines:[''];
  }
  function font(ctx,size,bold=false){ctx.font=(bold?'bold ':'')+size+'px Arial, sans-serif'}
  function label(ctx,value,x,y,size=8,bold=false,align='left'){
    font(ctx,size,bold);ctx.fillStyle='#111';ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(textValue(value),x,y);
    ctx.textAlign='left';
  }
  function fit(ctx,value,x,y,w,h,size=10,bold=false,align='left',min=6.5){
    for(let s=size;s>=min-.01;s-=.5){
      font(ctx,s,bold);
      const lines=wrap(ctx,value,w),lh=s*1.13;
      if(lines.length*lh<=h+.01){
        ctx.fillStyle='#111';ctx.textBaseline='top';ctx.textAlign=align;
        lines.forEach((line,i)=>ctx.fillText(line,x+(align==='right'?w:align==='center'?w/2:0),y+i*lh));
        ctx.textAlign='left';return;
      }
    }
    throw new Error('Some invoice text is too long for a single page. Shorten the description or remove lines, then try again.');
  }
  function border(ctx,x,y,w,h){ctx.strokeStyle='#111';ctx.lineWidth=.65;ctx.strokeRect(x,y,w,h)}
  function imageReady(img){
    if(!img)return Promise.resolve(false);
    if(img.complete)return Promise.resolve(img.naturalWidth>0);
    return new Promise(resolve=>{img.addEventListener('load',()=>resolve(true),{once:true});img.addEventListener('error',()=>resolve(false),{once:true})});
  }
  async function renderInvoice(inv){
    const canvas=document.createElement('canvas');
    canvas.width=2550;canvas.height=3300;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Image export is unavailable on this device.');
    ctx.scale(DPI/72,DPI/72);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    const logo=document.querySelector('.logo-crop img'),wm=document.querySelector('.watermark');
    const [hasLogo,hasWatermark]=await Promise.all([imageReady(logo),imageReady(wm)]);
    ctx.strokeStyle='#111';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(26,26);ctx.lineTo(26,766);ctx.stroke();
    ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(30,26);ctx.lineTo(30,766);ctx.stroke();
    ctx.save();ctx.translate(18,441);ctx.rotate(-Math.PI/2);ctx.fillStyle='#fff';ctx.fillRect(-99,-11,198,15);
    label(ctx,'STEEL ROCK  •  Energy Services LTD.',0,-9,10,true,'center');ctx.restore();
    if(hasLogo)ctx.drawImage(logo,left,30,292,292*logo.naturalHeight/logo.naturalWidth);
    else label(ctx,'STEEL ROCK ENERGY SERVICES LTD.',left,42,13,true);
    label(ctx,'INVOICE',right,26,10,true,'right');
    fit(ctx,inv.number,420,42,168,27,22,true,'right');
    border(ctx,413,72,175,24);label(ctx,'DATE',418,79,8,true);fit(ctx,inv.date,459,78,124,17,10);
    border(ctx,413,96,175,26);label(ctx,'TAX REG NO.',418,103,7,true);fit(ctx,inv.business?.tax,473,101,110,19,9);

    const boxY=132,half=width/2,fieldH=31;
    const company=inv.business||{};
    const fields=[
      [['SHIP TO / EXPÉDIER À',company.name],['ADDRESS / ADRESSE',company.address],['EMAIL',company.email],['PHONE',company.phone]],
      [['SOLD TO / VENDU À',inv.customer],['ADDRESS / ADRESSE',inv.address],['EMAIL / PHONE',inv.contact],['JOB / SITE LOCATION',inv.location]]
    ];
    fields.forEach((group,side)=>group.forEach(([name,value],i)=>{
      const x=left+side*half,y=boxY+i*fieldH;
      border(ctx,x,y,half,fieldH);fit(ctx,name,x+5,y+3,74,25,7.5,true);
      fit(ctx,value,x+83,y+4,half-88,24,9.5);
    }));
    const detailY=262,detailH=36;
    let dx=left;
    const details=[["CUSTOMER'S ORDER",inv.po,.26],['SOLD BY',inv.soldBy,.22],['TERMS',inv.terms,.22],['FOB',inv.fob,.15],['VIA',inv.via,.15]];
    for(const [name,value,fraction] of details){
      const w=width*fraction;
      border(ctx,dx,detailY,w,detailH);fit(ctx,name,dx+4,detailY+4,w-8,12,7.5,true);
      fit(ctx,value,dx+4,detailY+16,w-8,17,9);dx+=w;
    }

    const tableY=305,headH=23,footerY=690,bodyY=tableY+headH;
    const rows=inv.rows||[];
    const colWidths=[.10,.46,.16,.10,.18].map(x=>x*width);
    const colX=[left];for(let i=0;i<colWidths.length;i++)colX.push(colX[i]+colWidths[i]);
    const available=footerY-bodyY-12;
    let rowSize=9.5,heights=[];
    function measureRows(size){
      font(ctx,size);
      return rows.map(r=>{
        const lines=Math.max(wrap(ctx,r.description,colWidths[1]-10).length,wrap(ctx,r.unit,colWidths[3]-8).length);
        return Math.max(16,lines*(size*1.13)+6);
      });
    }
    for(;rowSize>=7;rowSize-=.5){
      heights=measureRows(rowSize);
      if(heights.reduce((a,b)=>a+b,0)<=available)break;
    }
    if(rowSize<7)throw new Error('Too many invoice lines for one Letter page. Delete unused lines or shorten descriptions.');
    const spare=Math.max(0,available-heights.reduce((a,b)=>a+b,0));
    const extra=rows.length?Math.min(4,spare/rows.length):0;
    heights=heights.map(h=>h+extra);
    if(hasWatermark&&rows.length){
      ctx.save();ctx.translate(left+width/2,bodyY+available/2);ctx.rotate(-12*Math.PI/180);
      ctx.globalAlpha=.08;const iw=width*.77,ih=iw*wm.naturalHeight/wm.naturalWidth;
      ctx.drawImage(wm,-iw/2,-ih/2,iw,ih);ctx.restore();
    }
    ctx.fillStyle='#171717';ctx.fillRect(left,tableY,width,headH);
    const headings=['QUANTITY','DESCRIPTION','PRICE','UNIT','AMOUNT'];
    headings.forEach((title,i)=>{
      ctx.fillStyle='#fff';font(ctx,8,true);ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(title,colX[i]+colWidths[i]/2,tableY+headH/2);
      if(i){ctx.strokeStyle='#fff';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(colX[i],tableY);ctx.lineTo(colX[i],bodyY);ctx.stroke()}
    });ctx.textAlign='left';
    let y=bodyY;
    rows.forEach((r,i)=>{
      const h=heights[i];
      const values=[r.qty,r.description,r.price,r.unit,r.qty!==''&&r.price!==''?fmt(lineCents(inv,i)/100):''];
      for(let c=0;c<5;c++){
        border(ctx,colX[c],y,colWidths[c],h);
        fit(ctx,values[c],colX[c]+4,y+3,colWidths[c]-8,h-5,rowSize,false,c===4||c===2?'right':c===0?'center':'left',7);
      }
      y+=h;
    });
    if(!rows.length){border(ctx,left,bodyY,width,20)}
    const noteW=width*.63-8,totX=left+noteW+8,totW=right-totX,footH=69;
    border(ctx,left,footerY,noteW,footH);label(ctx,'NOTES / PAYMENT INSTRUCTIONS',left+6,footerY+6,8,true);
    fit(ctx,inv.notes,left+6,footerY+19,noteW-12,footH-24,10);
    const totalsData=totals(inv);
    [['SUBTOTAL',fmt(totalsData.subtotal)],['PST 5%',fmt(totalsData.pst)],['TOTAL DUE (CAD)',fmt(totalsData.total)]].forEach(([name,value],i)=>{
      const yy=footerY+i*23;
      if(i===2){ctx.fillStyle='#171717';ctx.fillRect(totX,yy,totW,23);ctx.fillStyle='#fff';font(ctx,10,true);ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(name,totX+6,yy+11.5);ctx.textAlign='right';ctx.fillText(value,right-6,yy+11.5);ctx.textAlign='left'}
      else{border(ctx,totX,yy,totW,23);label(ctx,name,totX+6,yy+7,8,true);fit(ctx,value,totX+100,yy+6,totW-106,17,10,true,'right')}
    });
    label(ctx,'Steel Rock Energy Services Ltd.  |  Invoice '+textValue(inv.number),right,770,7,false,'right');
    return canvas;
  }

  // A standard PDF 1.4 document with a single 612 × 792-point page and embedded
  // high-resolution JPEG of the very same sheet. Byte offsets are calculated
  // from the binary stream, so the xref remains valid for any image contents.
  async function createPDF(canvas){
    const jpeg=new Uint8Array(await (await canvasBlob(canvas,'image/jpeg',.96)).arrayBuffer());
    const encoder=new TextEncoder(),parts=[],offsets=[0];let n=0;
    function add(v){const b=typeof v==='string'?encoder.encode(v):v;parts.push(b);n+=b.length}
    function obj(id,data){offsets[id]=n;add(id+' 0 obj\n');add(data);add('\nendobj\n')}
    add('%PDF-1.4\n');
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4]=n;add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');add(jpeg);add('\nendstream\nendobj\n');
    const stream='q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n';
    obj(5,'<< /Length '+encoder.encode(stream).length+' >>\nstream\n'+stream+'endstream');
    const xref=n;
    add('xref\n0 6\n0000000000 65535 f \n');
    for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
    return new Blob(parts,{type:'application/pdf'});
  }
  function toBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);
    });
  }
  async function saveFile(blob,filename){
    const cap=window.Capacitor;
    if(window.InvoiceAndroid&&typeof window.InvoiceAndroid.saveInvoiceFile==='function'){
      window.InvoiceAndroid.saveInvoiceFile(await toBase64(blob),filename,blob.type);return;
    }
    if(cap?.getPlatform?.()==='ios'&&typeof cap.nativePromise==='function'){
      const file=await cap.nativePromise('Filesystem','writeFile',{path:filename,data:await toBase64(blob),directory:'CACHE'});
      await cap.nativePromise('Share','share',{title:filename,files:[file.uri],dialogTitle:'Save invoice'});
      return;
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast('Invoice file prepared: '+filename);
  }
  let exporting=false;
  async function exportInvoice(format){
    if(exporting)return;
    exporting=true;
    const buttons=[document.querySelector('#save-pdf'),document.querySelector('#save-image')];
    buttons.forEach(b=>b.disabled=true);
    try{
      calc();
      const snapshot=JSON.parse(JSON.stringify(current));
      const filename='Invoice-'+(String(snapshot.number||'draft').replace(/[^a-zA-Z0-9_-]/g,'_')||'draft')+'.'+format;
      const canvas=await renderInvoice(snapshot);
      const blob=format==='pdf'?await createPDF(canvas):await canvasBlob(canvas,'image/png');
      await saveFile(blob,filename);
    }catch(e){console.error(e);alert(e?.message||'Unable to export this invoice. Please try again.')}
    finally{exporting=false;buttons.forEach(b=>b.disabled=false)}
  }
  document.querySelector('#save-pdf').onclick=()=>exportInvoice('pdf');
  document.querySelector('#save-image').onclick=()=>exportInvoice('png');
})();
