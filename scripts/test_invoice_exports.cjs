const { chromium }=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
async function main(){
 const root=path.resolve('web'),out=path.resolve('export-test');
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{
  let p=path.join(root,new URL(req.url,'http://localhost').pathname);
  if(p===root||p===root+'/')p=path.join(root,'index.html');
  if(!p.startsWith(root+'/')||!fs.existsSync(p)){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.webmanifest')?'application/manifest+json':'text/html');
  res.end(fs.readFileSync(p));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>{ if(d.type()==='alert')errors.push(d.message());return d.accept(); });
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.locator('[data-f=number]').fill('90001');
  await page.locator('[data-f=date]').fill('2026-11-18');
  await page.locator('[data-f=customer]').fill('Export Test Customer');
  await page.locator('[data-i="0"][data-r=qty]').fill('10');
  await page.locator('[data-i="0"][data-r=price]').fill('100');
  await page.locator('[data-i="0"][data-r=description]').fill('Field service test — invoice export');
  await page.locator('#remove-last').click();
  assert.equal(await page.locator('#rows tr').count(),17);
  assert.match(await page.locator('#subtotal').innerText(),/1,150\.00/);
  assert.match(await page.locator('#psttotal').innerText(),/57\.50/);
  assert.match(await page.locator('#total').innerText(),/1,207\.50/);
  for(const [id,ext] of [['save-pdf','pdf'],['save-image','png']]){
   const pending=page.waitForEvent('download',{timeout:30000});
   await page.locator('#'+id).click();
   const download=await pending;
   assert.equal(download.suggestedFilename(),'Invoice-90001.'+ext);
   await download.saveAs(path.join(out,download.suggestedFilename()));
  }
  assert.equal(errors.length,0,errors.join('\n'));
  assert.ok(fs.statSync(path.join(out,'Invoice-90001.pdf')).size>1000);
  assert.ok(fs.statSync(path.join(out,'Invoice-90001.png')).size>1000);
  console.log('Invoice rows, fuel, tax, total and both export downloads passed.');
 }finally{if(browser)await browser.close();server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1});
