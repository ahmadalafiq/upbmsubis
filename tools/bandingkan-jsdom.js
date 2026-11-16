// Banding dua versi app dalam jsdom (stub Supabase/CDN): nama fungsi global, ralat, pengendali inline.
// Guna: npm i jsdom@22.1.0 (di luar repo) ; node tools/bandingkan-jsdom.js <folder-asal> <folder-baharu>
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path');
function stub(){const f=function(){return p};const p=new Proxy(f,{get(t,k){if(k==='then')return undefined;if(k===Symbol.toPrimitive)return()=>'';if(k==='data'||k==='error')return null;return p},apply(){return p},construct(){return p}});return p;}
function makeClient(){
  const res=Promise.resolve({data:null,error:null});
  const q=new Proxy(function(){},{get(t,k){if(k==='then')return(r,j)=>res.then(r,j);return q},apply(){return q}});
  return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession(){return Promise.resolve({data:{session:null}})},signOut(){return Promise.resolve({})},signInWithOAuth(){return Promise.resolve({})}},from(){return q},rpc(){return q},channel(){return q},removeChannel(){},functions:{invoke(){return res}}};
}
class RL extends ResourceLoader{
  constructor(root){super();this.root=root}
  fetch(url,opts){
    if(url.startsWith('file://')){const p=url.replace('file://','').split('?')[0];try{return Promise.resolve(fs.readFileSync(decodeURIComponent(p)))}catch(e){return Promise.reject(e)}}
    if(/supabase-js/.test(url))return Promise.resolve(Buffer.from('window.supabase={createClient:function(){return window.__mkClient()}};'));
    if(/xlsx/.test(url))return Promise.resolve(Buffer.from('window.XLSX={utils:{},read(){},write(){}};'));
    if(/pdf-lib/.test(url))return Promise.resolve(Buffer.from('window.PDFLib={};'));
    if(/jszip/i.test(url))return Promise.resolve(Buffer.from('window.JSZip=function(){};'));
    return Promise.resolve(Buffer.from(''));
  }
}
async function run(dir){
  const errs=[];const vc=new VirtualConsole();
  vc.on('jsdomError',e=>errs.push('jsdomError: '+String(e.message).slice(0,160)));
  vc.on('error',e=>errs.push('console.error: '+String(e).slice(0,160)));
  const dom=await JSDOM.fromFile(path.join(dir,'index.html'),{runScripts:'dangerously',resources:new RL(dir),pretendToBeVisual:true,virtualConsole:vc,url:'file://'+dir+'/index.html',
    beforeParse(w){w.__mkClient=makeClient;w.matchMedia=w.matchMedia||(()=>({matches:false,addListener(){},removeListener(){},addEventListener(){}}));w.scrollTo=()=>{};}});
  await new Promise(r=>setTimeout(r,2500));
  const w=dom.window;
  const names=Object.getOwnPropertyNames(w).filter(n=>{try{return typeof w[n]==='function'&&/^[A-Za-z_$]/.test(n)}catch(e){return false}});
  // inline handler identifiers
  const hs=new Set();w.document.querySelectorAll('*').forEach(el=>{for(const a of el.attributes){if(/^on/.test(a.name)){const m=a.value.match(/[A-Za-z_$][\w$]*(?=\s*\()/g);if(m)m.forEach(x=>hs.add(x))}}});
  const missing=[...hs].filter(h=>typeof w[h]!=='function'&&!['if','function','return','event','alert','confirm','prompt','stopPropagation','preventDefault','setTimeout','focus','click','blur','select','remove','add','toggle','querySelector','getElementById','replace','trim','stop','contains','closest','then','stopImmediatePropagation','submit','classList'].includes(h));
  const vars=['_sesi','_selTahun','_aPg','sb','_dashJenis','LUAR_POLISI','PELIBATAN_DEDUP_SCOPE'].map(v=>{try{return v+':'+typeof w.eval('typeof '+v+'==="undefined"?"undef":typeof '+v)}catch(e){return v+':err'}});
  const out={fnCount:names.length,fns:names.filter(n=>!/^(on|webkit|moz)/.test(n)),errs,handlers:hs.size,missing,evalv:[]};
  for(const v of ['_sesi','_selTahun','_aPg','sb','_dashJenis','LUAR_POLISI','PELIBATAN_DEDUP_SCOPE','_C','_moOpenCount']){try{out.evalv.push(v+'='+w.eval('typeof '+v))}catch(e){out.evalv.push(v+'=ERR')}}
  out.title=w.document.title;out.pgLogin=!!w.document.getElementById('pg-login');
  // computed style sample: ensure css applied
  const cs=w.getComputedStyle(w.document.body);out.bodyBg=cs.backgroundColor;
  dom.window.close();return out;
}
(async()=>{
  const a=await run(process.argv[2]);const b=await run(process.argv[3]);
  const sa=new Set(a.fns),sb=new Set(b.fns);
  console.log('ORIG  fn:',a.fnCount,'handlers:',a.handlers,'missing:',JSON.stringify(a.missing),'errs:',a.errs.length,'bodyBg:',a.bodyBg,'|',a.evalv.join(' '));
  console.log('SPLIT fn:',b.fnCount,'handlers:',b.handlers,'missing:',JSON.stringify(b.missing),'errs:',b.errs.length,'bodyBg:',b.bodyBg,'|',b.evalv.join(' '));
  console.log('only in orig:',[...sa].filter(x=>!sb.has(x)).slice(0,20));
  console.log('only in split:',[...sb].filter(x=>!sa.has(x)).slice(0,20));
  console.log('orig errs:',a.errs.slice(0,5));console.log('split errs:',b.errs.slice(0,5));
})();
