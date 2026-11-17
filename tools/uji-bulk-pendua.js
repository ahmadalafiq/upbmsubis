// Ujian semakan pendua muat naik Excel (jsdom). Guna: npm i jsdom@22.1.0 ; node tools/uji-bulk-pendua.js [folder-app]
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path');const DIR=process.argv[2]||process.cwd();
function makeClient(){const res=Promise.resolve({data:null,error:null});const q=new Proxy(function(){},{get(t,k){if(k==='then')return(r,j)=>res.then(r,j);return q},apply(){return q}});return{auth:{onAuthStateChange(){return{data:{subscription:{unsubscribe(){}}}}},getSession(){return Promise.resolve({data:{session:null}})},signOut(){return Promise.resolve({})},signInWithOAuth(){return Promise.resolve({})}},from(){return q},rpc(){return q},channel(){return q},removeChannel(){},functions:{invoke(){return res}}};}
class RL extends ResourceLoader{fetch(url){
  if(url.startsWith('file://')){const p=url.replace('file://','').split('?')[0];try{return Promise.resolve(fs.readFileSync(decodeURIComponent(p)))}catch(e){return Promise.reject(e)}}
  if(/supabase-js/.test(url))return Promise.resolve(Buffer.from('window.supabase={createClient:function(){return window.__mkClient()}};'));
  if(/xlsx/.test(url))return Promise.resolve(Buffer.from('window.XLSX={utils:{},read(){},write(){}};'));
  if(/pdf-lib/.test(url))return Promise.resolve(Buffer.from('window.PDFLib={};'));
  if(/jszip/i.test(url))return Promise.resolve(Buffer.from('window.JSZip=function(){};'));
  return Promise.resolve(Buffer.from(''));}}
let fail=0;const ok=(c,m)=>{console.log((c?'  LULUS ':'  GAGAL ')+m);if(!c)fail++;};
async function boot(){
  const dom=await JSDOM.fromFile(path.join(DIR,'index.html'),{runScripts:'dangerously',resources:new RL(),pretendToBeVisual:true,virtualConsole:new VirtualConsole(),url:'file://'+DIR+'/index.html',beforeParse(w){w.__mkClient=makeClient;w.scrollTo=()=>{};}});
  const w=dom.window;await new Promise(r=>setTimeout(r,300));
  const o={alerts:[],toasts:[]};w.alert=m=>o.alerts.push(m);w.toast=(m,t)=>o.toasts.push(m);
  w.XLSX={utils:{sheet_to_json:ws=>ws.rows}};
  w.renderMainPesList=()=>{};w.renderMainGuruList=()=>{};
  w.eval("_selKatList=['A','B']");
  const reset=(pes,guru)=>w.eval('_penyData={pesList:'+JSON.stringify(pes||[])+',guruList:'+JSON.stringify(guru||[])+'};_pPCnt=0;_pGCnt=0;');
  const run=(P,G)=>{o.alerts=[];o.toasts=[];const wb={Sheets:{}};if(P)wb.Sheets.PESERTA={rows:[['NAMA','KP','J','B','KAT'],...P]};if(G)wb.Sheets.GURU={rows:[['NAMA','KP','J','B','TEL'],...G]};w._prosesBulkXlsx(wb);};
  const pes=()=>JSON.parse(w.eval('JSON.stringify(_penyData.pesList)'));const guru=()=>JSON.parse(w.eval('JSON.stringify(_penyData.guruList)'));
  return {w,o,reset,run,pes,guru,close:()=>w.close()};
}
(async()=>{
 const t=await boot();
 console.log('1. baris unik semua ditambah');
 t.reset();t.run([['ALI','010203-04-0506','LELAKI','MELAYU','A'],['SITI','020304-05-0607','PEREMPUAN','MELAYU','B']],[['CIKGU X','800101-13-1111','LELAKI','MELAYU','0123456789']]);
 ok(t.pes().length===2&&t.guru().length===1,'2 peserta + 1 guru ditambah');ok(t.o.toasts.length===1&&t.o.alerts.length===0,'toast kejayaan, tiada alert');
 console.log('2. KP sama dua kali dalam fail (kategori berbeza) -> satu baris, kategori digabung');
 t.reset();t.run([['ALI','010203-04-0506','LELAKI','MELAYU','A'],['ALI','010203-04-0506','LELAKI','MELAYU','B']]);
 ok(t.pes().length===1,'hanya 1 baris peserta');ok(JSON.stringify(t.pes()[0].kategori)==='["A","B"]','kategori [A,B]');ok(t.o.alerts.length===1&&/pendua/.test(t.o.alerts[0]),'alert melaporkan pendua');
 console.log('3. KP sudah ada dalam borang -> tidak ditambah semula, kategori digabung');
 t.reset([{id:'p1',nama:'ALI',kp:'010203-04-0506',jantina:'LELAKI',bangsa:'MELAYU',kategori:['A']}]);t.run([['ALI','010203-04-0506','LELAKI','MELAYU','B']]);
 ok(t.pes().length===1,'masih 1 baris');ok(JSON.stringify(t.pes()[0].kategori)==='["A","B"]','kategori sedia ada digabung [A,B]');ok(/digabungkan/.test(t.o.alerts[0]||''),'laporan menyebut digabungkan');
 console.log('4. KP guru sudah ada -> dilangkau');
 t.reset([],[{id:'g1',nama:'CIKGU X',kp:'800101-13-1111',tel:'+60123456789'}]);t.run(null,[['CIKGU X','800101-13-1111','LELAKI','MELAYU','0123456789'],['CIKGU Y','810202-14-2222','PEREMPUAN','MELAYU','0129999999']]);
 ok(t.guru().length===2,'guru: 1 sedia ada + 1 baharu (Y)');ok(t.guru().some(g=>g.nama==='CIKGU Y'),'CIKGU Y ditambah');
 console.log('5. KP tidak sah / kosong tidak dianggap pendua');
 t.reset();t.run([['AMIN','',   'LELAKI','MELAYU','A'],['AMIN','','LELAKI','MELAYU','A'],['BAD','123','LELAKI','MELAYU','A'],['BAD','123','LELAKI','MELAYU','A']]);
 ok(t.pes().length===4,'4 baris ditambah (tiada KP sah untuk dibandingkan)');
 console.log('6. semua baris pendua -> tiada toast "Tiada data sah"');
 t.reset([{id:'p1',nama:'ALI',kp:'010203-04-0506',kategori:['A']}]);t.run([['ALI','010203-04-0506','LELAKI','MELAYU','A']]);
 ok(t.pes().length===1,'tiada baris baharu');ok(!t.o.toasts.some(m=>/Tiada data sah/.test(m)),'bukan mesej "Tiada data sah"');ok(t.o.alerts.length===1,'alert ringkasan pendua');
 t.close();console.log(fail?`\n${fail} UJIAN GAGAL`:'\nSEMUA UJIAN LULUS');process.exit(fail?1:0);
})();
