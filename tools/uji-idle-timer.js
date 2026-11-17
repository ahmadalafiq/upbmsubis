// Ujian idle timer dengan jam palsu (jsdom). Guna: npm i jsdom@22.1.0 ; node tools/uji-idle-timer.js [folder-app]
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path');
const DIR=process.argv[2]||process.cwd();
function stub(){}
function makeClient(){const res=Promise.resolve({data:null,error:null});const q=new Proxy(function(){},{get(t,k){if(k==='then')return(r,j)=>res.then(r,j);return q},apply(){return q}});return{auth:{onAuthStateChange(){return{data:{subscription:{unsubscribe(){}}}}},getSession(){return Promise.resolve({data:{session:null}})},signOut(){return Promise.resolve({})},signInWithOAuth(){return Promise.resolve({})}},from(){return q},rpc(){return q},channel(){return q},removeChannel(){},functions:{invoke(){return res}}};}
class RL extends ResourceLoader{fetch(url){
  if(url.startsWith('file://')){const p=url.replace('file://','').split('?')[0];try{return Promise.resolve(fs.readFileSync(decodeURIComponent(p)))}catch(e){return Promise.reject(e)}}
  if(/supabase-js/.test(url))return Promise.resolve(Buffer.from('window.supabase={createClient:function(){return window.__mkClient()}};'));
  if(/xlsx/.test(url))return Promise.resolve(Buffer.from('window.XLSX={utils:{},read(){},write(){}};'));
  if(/pdf-lib/.test(url))return Promise.resolve(Buffer.from('window.PDFLib={};'));
  if(/jszip/i.test(url))return Promise.resolve(Buffer.from('window.JSZip=function(){};'));
  return Promise.resolve(Buffer.from(''));}}
async function boot(){
  const clock={now:1_000_000,id:0,timers:new Map()};
  const vc=new VirtualConsole();
  const dom=await JSDOM.fromFile(path.join(DIR,'index.html'),{runScripts:'dangerously',resources:new RL(),pretendToBeVisual:true,virtualConsole:vc,url:'file://'+DIR+'/index.html',
   beforeParse(w){w.__mkClient=makeClient;w.scrollTo=()=>{};
    const RealDate=w.Date;w.Date=class extends RealDate{constructor(...a){a.length?super(...a):super(clock.now)}static now(){return clock.now}};
    w.setTimeout=(fn,ms=0)=>{const id=++clock.id;clock.timers.set(id,{fn,due:clock.now+ms,every:null});return id};
    w.setInterval=(fn,ms=0)=>{const id=++clock.id;clock.timers.set(id,{fn,due:clock.now+ms,every:ms});return id};
    w.clearTimeout=w.clearInterval=(id)=>{clock.timers.delete(id)};}});
  const w=dom.window;
  // biar skrip mula (setTimeout awal app tidak penting): kosongkan pemasa sedia ada
  await new Promise(r=>setImmediate(r));
  clock.timers.clear();
  const log={logouts:[],toasts:[]};
  w.lgKeluar=(m)=>log.logouts.push(m);w.toast=(m)=>log.toasts.push(m);
  let formActive=false;w._isPenyFormAktif=()=>formActive;
  const tick=async()=>{await Promise.resolve();await new Promise(r=>setImmediate(r));};
  async function advance(ms){const end=clock.now+ms;
    for(;;){let best=null;for(const [id,t] of clock.timers){if(t.due<=end&&(!best||t.due<best.t.due))best={id,t};}
      if(!best)break;clock.now=best.t.due;if(best.t.every!=null)best.t.due=clock.now+Math.max(best.t.every,1);else clock.timers.delete(best.id);
      try{best.t.fn()}catch(e){log.err=(log.err||[]).concat(String(e))}}
    clock.now=end;await tick();}
  const warn=()=>!!w.document.getElementById('idle-warn');
  async function login(){w.document.body.classList.add('loggedin');await tick();}
  const act=async(ev='mousedown')=>{w.document.dispatchEvent(new w.Event(ev,{bubbles:true}));await tick();};
  return {w,clock,log,advance,warn,login,act,setForm:v=>formActive=v,close:()=>w.close()};
}
const S=60000,M=60000;let fail=0;
function ok(c,msg){console.log((c?'  LULUS ':'  GAGAL ')+msg);if(!c)fail++;}
(async()=>{
 console.log('A. biasa (tanpa borang): amaran 4:00, log keluar 5:00');
 let t=await boot();await t.login();
 await t.advance(3*M+59*1000);ok(!t.warn(),'tiada amaran pada 3:59');
 await t.advance(2*1000);ok(t.warn(),'amaran muncul pada ~4:01');
 await t.advance(60*1000);ok(t.log.toasts.length===1,'toast sesi tamat pada ~5:01');
 await t.advance(2000);ok(t.log.logouts.length===1&&t.log.logouts[0]===true,'lgKeluar(true) dipanggil sekali (mod idle)');ok(!t.warn(),'amaran dibuang');t.close();
 console.log('B. aktiviti pada 4:30 semasa amaran');
 t=await boot();await t.login();await t.advance(4*M+30*1000);ok(t.warn(),'amaran ada pada 4:30');
 await t.act();ok(!t.warn(),'amaran hilang selepas aktiviti');
 await t.advance(60*1000);ok(t.log.logouts.length===0,'tiada log keluar pada ~5:30');
 await t.advance(3*M+10*1000);ok(t.warn(),'amaran semula ~8:40 (4:30 + 4:00)');
 await t.advance(60*1000+2000);ok(t.log.logouts.length===1,'log keluar ~9:40 selepas senyap');t.close();
 console.log('C. borang aktif sejak mula: amaran 14:00, log keluar 15:00');
 t=await boot();t.setForm(true);await t.login();
 await t.advance(13*M+59*1000);ok(!t.warn(),'tiada amaran pada 13:59 (had 15 min)');
 await t.advance(2000);ok(t.warn(),'amaran ~14:01');
 await t.advance(M+2000);ok(t.log.logouts.length===1,'log keluar ~15:03');t.close();
 console.log('D. borang menjadi aktif SELEPAS aktiviti terakhir (semasa amaran 4:30)');
 t=await boot();await t.login();await t.advance(4*M+30*1000);ok(t.warn(),'amaran ada (had 5 min)');
 t.setForm(true);await t.advance(2000);ok(!t.warn(),'amaran dibuang bila had berubah ke 15 min');
 await t.advance(1*M);ok(t.log.logouts.length===0,'TIADA log keluar pada ~5:33 (dahulu: log keluar)');
 await t.advance(8*M+30*1000);ok(t.warn(),'amaran ~14:03');
 await t.advance(M+2000);ok(t.log.logouts.length===1,'log keluar ~15:05');t.close();
 console.log('E. butang TERUSKAN');
 t=await boot();await t.login();await t.advance(4*M+20*1000);ok(t.warn(),'amaran ada');
 t.w.document.querySelector('#idle-warn button').click();await t.advance(10);ok(!t.warn(),'amaran hilang selepas klik TERUSKAN');
 await t.advance(60*1000);ok(t.log.logouts.length===0,'tiada log keluar');t.close();
 console.log('F. log keluar manual membersihkan pemasa & amaran');
 t=await boot();await t.login();await t.advance(4*M+10*1000);ok(t.warn(),'amaran ada');
 t.w.document.body.classList.remove('loggedin');await t.advance(2000);ok(!t.warn(),'amaran dibuang');
 await t.advance(10*M);ok(t.log.logouts.length===0&&t.log.toasts.length===0,'tiada toast/log keluar selepas logout manual');t.close();
 console.log(fail?`\n${fail} UJIAN GAGAL`:'\nSEMUA UJIAN LULUS');process.exit(fail?1:0);
})();
