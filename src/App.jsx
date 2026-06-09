import { useState, useEffect } from "react";

const ACCESS_CODE = "jaeam2026";
const AUTH_KEY = "jaeam_auth";
const API_KEY   = "jaeam_api_url";

const C = {
  bg:"#ffffff",    sur:"#f8f8f8",  card:"#ffffff",  card2:"#f3f3f3",
  bdr:"#e8e8e8",   line:"#f0f0f0",
  acc:"#e8450a",   acc2:"#f56e1a", glow:"#e8450a12",
  blu:"#1a56cc",   grn:"#0a7a50",
  txt:"#0d0d0d",   txt2:"#444444", mut:"#888888",
  err:"#cc2200",   pur:"#5b21b6",  gold:"#a16207",
  pipe:["#1a56cc","#e8450a","#0a7a50","#5b21b6","#a16207","#9f1239","#0284c7","#78350f"],
};

const SPEC = {
  "벽체 금속배관":[
    {range:"~25A",  A:25,   steps:[]},
    {range:"~50A",  A:50,   steps:[{t:"1단",mm:100}]},
    {range:"~100A", A:100,  steps:[{t:"1단",mm:600}]},
    {range:"~150A", A:150,  steps:[{t:"1단",mm:1000}]},
    {range:"150A~", A:9999, steps:[{t:"1단",mm:1000},{t:"2단",mm:1000}]},
  ],
  "입상 금속배관":[
    {range:"~25A",  A:25,   steps:[{t:"1단",mm:100},{t:"2단",mm:100}]},
    {range:"~50A",  A:50,   steps:[{t:"1단",mm:300},{t:"2단",mm:100}]},
    {range:"~100A", A:100,  steps:[{t:"1단",mm:700},{t:"2단",mm:100}]},
    {range:"~150A", A:150,  steps:[{t:"1단",mm:1000},{t:"2단",mm:300},{t:"3단",mm:100}]},
    {range:"150A~", A:9999, steps:[{t:"1단",mm:2000},{t:"2단",mm:1000},{t:"3단",mm:1000},{t:"4단",mm:100}]},
  ],
  "입상 비금속(상부)":[
    {range:"~50A",  A:50,   steps:[{t:"1단",mm:300},{t:"2단",mm:250}]},
    {range:"~100A", A:100,  steps:[{t:"1단",mm:300},{t:"2단",mm:250}]},
    {range:"~150A", A:150,  steps:[{t:"1단",mm:300},{t:"2단",mm:250}]},
    {range:"~200A", A:200,  steps:[{t:"1단",mm:450},{t:"2단",mm:250}]},
    {range:"~250A", A:250,  steps:[{t:"1단",mm:250}]},
  ],
};
const STYPES = Object.keys(SPEC);
const NOM_OD = {25:34,50:60.3,65:76.1,80:89.1,100:114.3,125:139.7,150:165.2,200:216.3,250:267.4};
const getNomOD = a => {
  const ks = Object.keys(NOM_OD).map(Number).sort((x,y)=>x-y);
  return NOM_OD[ks.find(k=>k>=a)||ks[ks.length-1]] || 114.3;
};

const SK = "fw_v2";
const RK = "fw_requests";
const loadLogs = () => { try { return JSON.parse(localStorage.getItem(SK)||"[]"); } catch { return []; } };
const saveLogs = l => { try { localStorage.setItem(SK, JSON.stringify(l)); } catch {} };
const loadReqs = () => { try { return JSON.parse(localStorage.getItem(RK)||"[]"); } catch { return []; } };
const saveReqs = l => { try { localStorage.setItem(RK, JSON.stringify(l));
const syncReqsToSheet = (d, url) => { if(!url) return; apiPost(url, {action:"syncReqs", reqs:d}).catch(()=>{}); };
const syncChecksToSheet = (checks, installed, url) => { if(!url) return; apiPost(url, {action:"syncChecks", checks}).catch(()=>{}); apiPost(url, {action:"syncInstalled", installed}).catch(()=>{}); };
const syncLogsToSheet = (logs, url) => { if(!url) return; apiPost(url, {action:"syncLogs", logs}).catch(()=>{}); }; } catch {} };
const todayStr = () => new Date().toISOString().slice(0,10);
const fmt4 = n => typeof n==="number" ? n.toFixed(4) : "0.0000";
const fmtDt = s => s ? s.replace("T"," ").slice(0,16) : "";

let _id = 1;
const nid = () => String(_id++);

const mkDuct2  = () => ({id:nid(),type:"single",label:"",w:"",h:"",fold:"",qty:""});
const mkPipe2  = () => ({id:nid(),d:"",gap:"",fromBottom:"",fromTop:""});
const mkGroup  = () => ({id:nid(),type:"group",label:"",mode:"field",pipes:[mkPipe2()],pX:"",pY:"",cols:"",rows:"",mT:"150",mB:"",mL:"150",mR:"150"});
const mkIns    = () => ({id:nid(),kind:"pipe",label:"",specType:STYPES[0],specRange:"",customOD:"",thickness:"25",qty:""});
const mkInsDuct= () => ({id:nid(),kind:"duct",label:"",shape:"circle",diam:"",dw:"",dh:"",insW:"",qty:""});

const pink  = "#e8450a";
const grn   = "#0a7a50";
const ADMIN_CODE  = "jaeam2026";
const USER_CODE   = "jaeam0000";
const APP_VERSION = "v1";
const ROLE_KEY    = "jaeam_role";
const VER_KEY     = "jaeam_ver";
const loadPhotos  = () => { try{ return JSON.parse(localStorage.getItem("fw_photos")||"[]"); }catch{ return []; } };
// API 호출 - 항상 Vercel /api/gas 프록시 경유 (CORS 완전 해결)
// gasUrl 인자는 무시하고 항상 /api/gas 프록시만 사용
const PROXY = "https://jaeam-app.vercel.app/api/gas";

const apiGet = async (_url, p={}) => {
  try {
    const q = Object.entries(p).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${PROXY}?${q}`);
    const text = await r.text();
    try { return JSON.parse(text); }
    catch { return {ok:false, msg:"응답 파싱 오류: "+text.slice(0,80)}; }
  } catch(e) { return {ok:false, msg:e.message}; }
};

const apiPost = async (_url, b={}) => {
  try {
    const r = await fetch(PROXY, {
      method:  "POST",
      headers: {"Content-Type":"application/json"},
      body:    JSON.stringify(b),
    });
    const text = await r.text();
    try { return JSON.parse(text); }
    catch { return {ok:false, msg:"응답 파싱 오류: "+text.slice(0,80)}; }
  } catch(e) { return {ok:false, msg:e.message}; }
};
const SI = {background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:4,padding:"0 12px",color:"#0d0d0d",fontSize:13,width:"100%",height:"40px",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color .12s"};
const Lbl = ({c}) => <div style={{fontSize:9,fontWeight:600,color:"#888",marginBottom:4,letterSpacing:1,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</div>;
const SectionTitle = ({icon,title,color}) => (
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}}>
    <span style={{fontSize:13}}>{icon}</span>
    <span style={{fontSize:10,fontWeight:700,color:color||"#0d0d0d",letterSpacing:1.2,textTransform:"uppercase"}}>{title}</span>
  </div>
);
const PageHdr = ({title,sub,onBack,right}) => (
  <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
      <div style={{flex:1}}>
        {sub&&<div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>{sub}</div>}
        <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>{title}</div>
      </div>
      {right&&<div style={{flexShrink:0}}>{right}</div>}
    </div>
  </div>
);

// ── 보드 계산 ─────────────────────────────────────────────
function splitPanels(tw,th,BW,BH,lbl){
  const nc=Math.ceil(tw/BW), nr=Math.ceil(th/BH), out=[];
  for(let r=0;r<nr;r++) for(let c=0;c<nc;c++){
    const pw=Math.min(BW,tw-c*BW), ph=Math.min(BH,th-r*BH);
    const pos = nr===1&&nc===1?"" : nr===1?(nc===2?(c===0?"[좌]":"[우]"):`[${c+1}/${nc}열]`) : nc===1?(nr===2?(r===0?"[상]":"[하]"):`[${r+1}/${nr}행]`) : `[${r+1}행${c+1}열]`;
    out.push({w:pw,h:ph,label:lbl+pos,isSplit:nc>1||nr>1,sp:{c,r,nc,nr,x0:c*BW,y0:r*BH,tw,th}});
  }
  return out;
}
function calcGroup2(item,BW,BH){
  const mt=parseFloat(item.mT)||0, mb=parseFloat(item.mB)||0, ml=parseFloat(item.mL)||0, mr=parseFloat(item.mR)||0;
  if(item.mode==="field"){
    const raw=item.pipes.map(p=>({d:parseFloat(p.d)||0,gap:parseFloat(p.gap)||0,fromBottom:parseFloat(p.fromBottom)||0})).filter(p=>p.d>0);
    if(!raw.length) return {ok:false,msg:"직경이 입력된 배관이 없습니다."};
    const pipes=[]; let curX=ml;
    for(let i=0;i<raw.length;i++){
      const p=raw[i];
      curX = i===0 ? ml+(p.gap||0)+p.d/2 : pipes[i-1].cx+pipes[i-1].d/2+p.gap+p.d/2;
      pipes.push({d:p.d,cx:curX,cy:p.fromBottom+p.d/2,fromBottom:p.fromBottom});
    }
    const maxTop=Math.max(...pipes.map(p=>p.cy+p.d/2));
    const bw=Math.ceil(pipes[pipes.length-1].cx+pipes[pipes.length-1].d/2+mr);
    const bh=Math.ceil(maxTop+mt+mb);
    const np=pipes.map(p=>({...p,bx:p.cx,by:bh-mb-p.cy}));
    if(bw>BW||bh>BH){ const panels=splitPanels(bw,bh,BW,BH,""); return {ok:true,bw,bh,mt,mb,ml,mr,pipes:np,isSplit:true,panels,splitMsg:`${bw}×${bh}mm 분할`}; }
    return {ok:true,bw,bh,mt,mb,ml,mr,pipes:np};
  } else {
    const pX=parseFloat(item.pX)||0, pY=parseFloat(item.pY)||0, nc=parseInt(item.cols)||1, nr=parseInt(item.rows)||1, d=parseFloat(item.pipes[0]?.d)||0;
    if(!d||!pX) return {ok:false,msg:"직경 또는 X피치가 없습니다."};
    const pipes=[];
    for(let r=0;r<nr;r++) for(let c=0;c<nc;c++) pipes.push({d,bx:ml+d/2+c*pX,by:mt+d/2+r*(pY||pX)});
    const bw=Math.ceil((nc-1)*pX+d+ml+mr), bh=Math.ceil((nr-1)*(pY||pX)+d+mt+mb);
    if(bw>BW||bh>BH){ const panels=splitPanels(bw,bh,BW,BH,""); return {ok:true,bw,bh,mt,mb,ml,mr,pipes,isSplit:true,panels,splitMsg:`${bw}×${bh}mm 분할`}; }
    return {ok:true,bw,bh,mt,mb,ml,mr,pipes};
  }
}
function calcSingle2(item,BW,BH){
  const qty=parseInt(item.qty)||1, pieces=[], warns=[];
  const w=parseFloat(item.w), h=parseFloat(item.h);
  const fold=parseFloat(item.fold)||0; // 폭 (wrap thickness)
  if(!w||!h||w<=0||h<=0) return {ok:false,msg:"가로/세로를 입력해주세요."};

  if(fold>0){
    // 폭 입력 시 → 면별 4장 재단
    // 가로면(상/하): 가로 × 폭 × 2장
    // 세로면(좌/우): (세로 + 폭×2) × 폭 × 2장
    // 가로면(상/하): 덕트 가로(w) × 폭(fold)
    // 세로면(좌/우): (덕트 세로(h) + 폭(fold)×2) × 폭(fold)
    // 예) 가로600×세로300, 폭150 → 가로면 600×150, 세로면 600×150
    const horzW=w, horzH=fold;
    const vertW=h+fold*2, vertH=fold;
    const lbl=item.label||"덕트";
    for(let i=0;i<qty;i++){
      pieces.push({w:horzW,h:horzH,shape:"rect",label:`${lbl}[가로-상]`,faceLabel:"가로면(상)"});
      pieces.push({w:horzW,h:horzH,shape:"rect",label:`${lbl}[가로-하]`,faceLabel:"가로면(하)"});
      pieces.push({w:vertW, h:vertH, shape:"rect",label:`${lbl}[세로-좌]`,faceLabel:"세로면(좌)"});
      pieces.push({w:vertW, h:vertH, shape:"rect",label:`${lbl}[세로-우]`,faceLabel:"세로면(우)"});
    }
    // 면별 요약 저장
    pieces._foldSummary = {lbl, w, h, fold, horzW, horzH, vertW, vertH, qty};
  } else {
    for(let i=0;i<qty;i++){
      if(w>BW||h>BH){ splitPanels(w,h,BW,BH,item.label||"덕트").forEach(p=>pieces.push({...p,shape:"rect"})); if(i===0) warns.push(`${item.label||"덕트"} 분할 맞대기`); }
      else pieces.push({w,h,shape:"rect",label:item.label||"덕트"});
    }
  }
  return {ok:true,pieces,warnings:warns,foldSummary:fold>0?{lbl:item.label||"덕트",w,h,fold,horzW:w,horzH:fold,vertW:h+fold*2,vertH:fold,qty}:null};
}
function packPieces(pieces,BW){
  const sorted=[...pieces].sort((a,b)=>b.h-a.h);
  const rows=[]; let cur=[], used=0, y=8;
  for(const p of sorted){
    if(used+p.w+8>BW&&cur.length){ rows.push({pieces:cur,y}); y+=Math.max(...cur.map(c=>c.h))+8; cur=[]; used=0; }
    cur.push({...p,x:used+8}); used+=p.w+8;
  }
  if(cur.length){ rows.push({pieces:cur,y}); y+=Math.max(...cur.map(c=>c.h))+8; }
  return {rows,totalH:y};
}

// ── UI 공통 ──────────────────────────────────────────────

// ── 도면 ─────────────────────────────────────────────────
function BoardDiagram({piece}){
  const PAD=40, sc=Math.min((260-PAD*2)/piece.w,(180-PAD*2)/piece.h,1);
  const pw=piece.w*sc, ph=piece.h*sc, ox=PAD, oy=PAD;
  return (
    <svg width={pw+PAD*2+14} height={ph+PAD*2+14} style={{display:"block",margin:"0 auto",maxWidth:"100%"}}>
      <defs><marker id="ar" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff9a3c"/></marker></defs>
      {piece.shape==="rect"&&<rect x={ox} y={oy} width={pw} height={ph} fill="#3d8ef033" stroke="#1a56cc" strokeWidth={2} rx={2}/>}
      {piece.shape==="circle"&&<ellipse cx={ox+pw/2} cy={oy+ph/2} rx={pw/2} ry={ph/2} fill="#3d8ef033" stroke="#1a56cc" strokeWidth={2}/>}
      <line x1={ox+pw/2} y1={oy} x2={ox+pw/2} y2={oy+ph} stroke="#3d8ef044" strokeWidth={1} strokeDasharray="4,3"/>
      <line x1={ox} y1={oy+ph/2} x2={ox+pw} y2={oy+ph/2} stroke="#3d8ef044" strokeWidth={1} strokeDasharray="4,3"/>
      <line x1={ox} y1={oy+ph+14} x2={ox+pw} y2={oy+ph+14} stroke="#ff9a3c" strokeWidth={1} markerStart="url(#ar)" markerEnd="url(#ar)"/>
      <line x1={ox} y1={oy+ph+8} x2={ox} y2={oy+ph+20} stroke="#ff9a3c" strokeWidth={1}/>
      <line x1={ox+pw} y1={oy+ph+8} x2={ox+pw} y2={oy+ph+20} stroke="#ff9a3c" strokeWidth={1}/>
      <text x={ox+pw/2} y={oy+ph+30} textAnchor="middle" fill="#ff9a3c" fontSize={9} fontWeight="700" fontFamily="monospace">{Math.round(piece.w)}mm</text>
      <line x1={ox+pw+14} y1={oy} x2={ox+pw+14} y2={oy+ph} stroke="#ff9a3c" strokeWidth={1} markerStart="url(#ar)" markerEnd="url(#ar)"/>
      <line x1={ox+pw+8} y1={oy} x2={ox+pw+20} y2={oy} stroke="#ff9a3c" strokeWidth={1}/>
      <line x1={ox+pw+8} y1={oy+ph} x2={ox+pw+20} y2={oy+ph} stroke="#ff9a3c" strokeWidth={1}/>
      <text x={ox+pw+8} y={oy+ph/2+4} textAnchor="middle" fill="#ff9a3c" fontSize={9} fontWeight="700" fontFamily="monospace" transform={`rotate(-90,${ox+pw+8},${oy+ph/2})`}>{Math.round(piece.h)}mm</text>
      {pw>28&&ph>14&&<text x={ox+pw/2} y={oy+ph/2+5} textAnchor="middle" fill="#fff" fontSize={Math.min(pw/6,12)} fontWeight="900">{piece.label}</text>}
    </svg>
  );
}

function GroupDiagram({g}){
  const LP=60,RP=32,TP=18,BP=46;
  const sc=Math.min((300-LP-RP)/g.bw,(220-TP-BP)/g.bh,1);
  const pw=g.bw*sc, ph=g.bh*sc, ox=LP, oy=TP, mb=g.mb||0;
  return (
    <svg width={pw+LP+RP} height={ph+TP+BP+16} style={{display:"block",margin:"0 auto",maxWidth:"100%"}}>
      <defs>
        <marker id="ag" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff9a3c"/></marker>
        <marker id="ags" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff9a3c"/></marker>
      </defs>
      <rect x={ox} y={oy} width={pw} height={ph} fill="#f8f8f8" stroke="#e8e8e8" strokeWidth={1.5} rx={2}/>
      {g.pipes.map((p,i)=>{
        const r=(p.d/2)*sc, cx=ox+p.bx*sc, cy=oy+p.by*sc, col=C.pipe[i%C.pipe.length];
        const dY=Math.round(p.cy!==undefined?p.cy:(g.bh-mb-p.by));
        return (
 <g key={i}>
 <line x1={cx-r-5} y1={cy} x2={cx+r+5} y2={cy} stroke={col+"66"} strokeWidth={.8} strokeDasharray="3,2"/>
 <line x1={cx} y1={cy-r-5} x2={cx} y2={cy+r+5} stroke={col+"66"} strokeWidth={.8} strokeDasharray="3,2"/>
 <circle cx={cx} cy={cy} r={r} fill={col+"20"} stroke={col} strokeWidth={1.8}/>
 <circle cx={cx} cy={cy} r={Math.min(r*.42,9)} fill={col}/>
 <text x={cx} y={cy+4} textAnchor="middle" fill="#fff" fontSize={Math.min(r*.42,8)} fontWeight="900">{i+1}</text>
 {r>10&&<text x={cx} y={cy-r-3} textAnchor="middle" fill={col} fontSize={7} fontWeight="700" fontFamily="monospace">Ø{p.d}</text>}
 <text x={cx} y={oy+ph+18} textAnchor="middle" fill={col} fontSize={8} fontWeight="700" fontFamily="monospace">X{Math.round(p.bx)}</text>
 <line x1={ox-6} y1={oy+ph} x2={ox-6} y2={cy} stroke={col} strokeWidth={1} markerEnd="url(#ag)" markerStart="url(#ags)"/>
 <text x={ox-10} y={(oy+ph+cy)/2+3} textAnchor="end" fill={col} fontSize={7} fontWeight="700" fontFamily="monospace">Y{dY}</text>
 </g>
        );
      })}
      <line x1={ox} y1={oy+ph+30} x2={ox+pw} y2={oy+ph+30} stroke="#ff9a3c" strokeWidth={1} markerStart="url(#ags)" markerEnd="url(#ag)"/>
      <line x1={ox} y1={oy+ph+24} x2={ox} y2={oy+ph+36} stroke="#ff9a3c" strokeWidth={1}/>
      <line x1={ox+pw} y1={oy+ph+24} x2={ox+pw} y2={oy+ph+36} stroke="#ff9a3c" strokeWidth={1}/>
      <text x={ox+pw/2} y={oy+ph+46} textAnchor="middle" fill="#ff9a3c" fontSize={10} fontWeight="700" fontFamily="monospace">{g.bw}mm</text>
      <line x1={ox+pw+16} y1={oy} x2={ox+pw+16} y2={oy+ph} stroke="#ff9a3c" strokeWidth={1} markerStart="url(#ags)" markerEnd="url(#ag)"/>
      <line x1={ox+pw+10} y1={oy} x2={ox+pw+22} y2={oy} stroke="#ff9a3c" strokeWidth={1}/>
      <line x1={ox+pw+10} y1={oy+ph} x2={ox+pw+22} y2={oy+ph} stroke="#ff9a3c" strokeWidth={1}/>
      <text x={ox+pw+30} y={oy+ph/2+3} textAnchor="middle" fill="#ff9a3c" fontSize={10} fontWeight="700" fontFamily="monospace" transform={`rotate(-90,${ox+pw+30},${oy+ph/2})`}>{g.bh}mm</text>
      <text x={ox} y={oy-6} fill="#888888" fontSize={7} fontFamily="monospace">X=좌측기준 Y=하단~배관중심(mm)</text>
    </svg>
  );
}

// ── 스플래시 ─────────────────────────────────────────────
// ── 홈 화면 ─────────────────────────────────────────────
function HomeScreen({onMenu,isAdmin,onLogout}){
  // 3행 구성
  const rows=[
    [{id:"notice",icon:"📢",label:"공지사항",acc:"#e8450a"},{id:"calc",icon:"🔥",label:"재단계산기",acc:"#1a56cc"},{id:"spec",icon:"📋",label:"시방서",acc:"#0a7a50"}],
    [{id:"schedule",icon:"📅",label:"일정표",acc:"#5b21b6"},{id:"plan",icon:"📝",label:"금일계획",acc:"#a16207"},{id:"request",icon:"📄",label:"재단요청서",acc:"#9f1239"}],
    [{id:"photo",icon:"📸",label:"공사사진",acc:"#0284c7"},{id:"perf",icon:"📊",label:"시공실적",acc:"#e8450a"},null],
  ];
  const today=new Date();
  const ds=`${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const dw=["일","월","화","수","목","금","토"][today.getDay()]+"요일";
  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      
      <div style={{padding:"24px 22px 18px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
 <div>
 <div style={{fontSize:10,fontWeight:600,color:"#e8450a",letterSpacing:2.5,textTransform:"uppercase",marginBottom:5}}>JAEAM INDUSTRY</div>
 <div style={{fontSize:23,fontWeight:900,color:"#0d0d0d",letterSpacing:-.5,lineHeight:1}}>재암산업</div>
 <div style={{fontSize:11,color:"#aaa",marginTop:4}}>방화마감 통합 관리 시스템</div>
 </div>
 <div style={{textAlign:"right"}}>
 <div style={{fontSize:13,fontWeight:600,color:"#0d0d0d"}}>{ds}</div>
 <div style={{fontSize:11,color:"#888",marginTop:2}}>{dw}</div>
 <div style={{marginTop:7,display:"inline-block",fontSize:9,fontWeight:700,letterSpacing:.5,
 color:isAdmin?"#e8450a":"#555555",
 background:isAdmin?"#fff3ee":"#f5f5f5",
 border:"1px solid "+(isAdmin?"#ffd4b8":"#e0e0e0"),
 borderRadius:3,padding:"2px 10px"}}>
 {isAdmin?"👑 관리자":"👤 일반"}
 </div>
 </div>
        </div>
      </div>

      
      <div style={{flex:1,padding:"16px 16px 0",overflowY:"auto"}}>
        {rows.map((row,ri)=>(
 <div key={ri} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
 {row.map((m,ci)=> m ? (
 <button key={m.id} onClick={()=>onMenu(m.id)}
 style={{background:"#ffffff",border:"1px solid #f0f0f0",borderRadius:14,padding:"16px 8px 13px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,position:"relative",overflow:"hidden",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 4px rgba(0,0,0,.05)",transition:"box-shadow .15s"}}>
 <div style={{position:"absolute",top:0,left:"18%",right:"18%",height:2,background:m.acc,borderRadius:"0 0 2px 2px"}}/>
 <div style={{width:44,height:44,borderRadius:12,background:m.acc+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{m.icon}</div>
 <div style={{fontSize:11,fontWeight:700,color:"#0d0d0d",letterSpacing:-.2,textAlign:"center"}}>{m.label}</div>
 </button>
 ) : (
 <div key={ci}/>
 ))}
 </div>
        ))}
      </div>

      
      <div style={{padding:"14px 22px 26px",borderTop:"1px solid #f0f0f0",marginTop:6}}>
        {isAdmin&&(
 <button onClick={()=>onMenu("connect")}
 style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f5f5f5",marginBottom:12,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
 <span>⚙️</span>
 <span style={{fontSize:12,fontWeight:600,color:"#555"}}>구글 연동 설정</span>
 <span style={{marginLeft:"auto",fontSize:12,color:"#ccc"}}>›</span>
 </button>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
 <span style={{fontSize:9,color:"#ccc",letterSpacing:.8,textTransform:"uppercase"}}>Jaeam Industry Co., Ltd.</span>
 <button onClick={()=>onLogout()}
 style={{fontSize:10,color:"#888",background:"none",border:"1px solid #e8e8e8",borderRadius:3,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
 로그아웃
 </button>
        </div>
      </div>
    </div>
  );
}

function PhotoScreen({apiUrl,onBack}){
  const teal="#00ccc4";
    const [photos,setPhotos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [form,setForm]=useState({site:"",date:todayStr,memo:""});
  const [previews,setPreviews]=useState([]); // {file, dataUrl}
  const [result,setResult]=useState(null);
  const [tab,setTab]=useState("upload"); // upload | list

  useEffect(()=>{if(tab==="list") loadPhotos();},[tab]);

  const loadPhotos=async()=>{
    setLoading(true);
    try{const r=await apiGet("",{action:"getPhotos"});if(r.ok)setPhotos(r.data||[]);}catch{}
    setLoading(false);
  };

  // 파일 선택
  const onFiles=async(e)=>{
    const files=Array.from(e.target.files);
    if(!files.length) return;
    const next=[];
    for(const file of files){
      const dataUrl=await new Promise(res=>{
        const fr=new FileReader();
        fr.onload=ev=>res(ev.target.result);
        // 리사이즈
        fr.onload=ev=>{
 const img=new Image();
 img.onload=()=>{
 const MAX=1200;
 let w=img.width,h=img.height;
 if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
 if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
 const canvas=document.createElement("canvas");
 canvas.width=w;canvas.height=h;
 canvas.getContext("2d").drawImage(img,0,0,w,h);
 res(canvas.toDataURL("image/jpeg",0.75));
 };
 img.src=ev.target.result;
        };
        fr.readAsDataURL(file);
      });
      next.push({file,dataUrl});
    }
    setPreviews(p=>[...p,...next]);
  };

  const removePreview=(i)=>setPreviews(p=>p.filter((_,idx)=>idx!==i));

  // 업로드
  const upload=async()=>{
    if(!form.site){setResult({ok:false,msg:"현장명을 입력해주세요."});return;}
    if(!previews.length){setResult({ok:false,msg:"사진을 선택해주세요."});return;}
    
    setUploading(true);setResult(null);
    let ok=0;
    for(let i=0;i<previews.length;i++){
      setProgress(Math.round((i/previews.length)*100));
      const {file,dataUrl}=previews[i];
      const base64=dataUrl.split(",")[1];
      const ts=Date.now();
      const fileName=`${form.site}_${form.date}_${ts}.jpg`;
      try{
        const r=await apiPost("",{
 action:"uploadPhoto",
 site:form.site,
 date:form.date,
 memo:form.memo,
 fileName,
 mimeType:"image/jpeg",
 data:base64,
        });
        if(r.ok) ok++;
      }catch(e){}
    }
    setProgress(100);
    setResult({ok:ok>0,msg:ok>0?`✅ ${ok}장 업로드 완료! (드라이브: ${form.site}/${form.date})`:`❌ 업로드 실패`});
    if(ok>0){setPreviews([]);setForm(p=>({...p,memo:""}));}
    setUploading(false);setProgress(0);
  };

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      
      <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Photos</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>공사사진</div>
 </div>
 <div style={{display:"flex",gap:5}}>
 <button onClick={()=>setTab("upload")} style={{background:tab==="upload"?"#e8450a":"#f5f5f5",border:"1px solid "+(tab==="upload"?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"5px 10px",color:tab==="upload"?"#fff":"#555",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>업로드</button>
 <button onClick={()=>setTab("list")} style={{background:tab==="list"?"#e8450a":"#f5f5f5",border:"1px solid "+(tab==="list"?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"5px 10px",color:tab==="list"?"#fff":"#555",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>목록</button>
 </div>
        </div>
      </div>

      {!apiUrl&&<div style={{padding:"12px 16px",background:"#fff3ee",borderBottom:"1px solid #ffd4b8",fontSize:12,color:"#e8450a"}}>⚙️ 홈 → 구글 연동 설정을 먼저 해주세요</div>}

      
      {tab==="upload"&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
 
 <div style={{background:"#ffffff",border:`1px solid ${C.line}`,borderRadius:14,padding:"14px",marginBottom:14}}>
 <div style={{display:"flex",gap:8,marginBottom:8}}>
 <div style={{flex:2}}>
 <div style={{fontSize:11,color:"#888888",marginBottom:4}}>현장명 *</div>
 <input value={form.site} onChange={e=>setForm(p=>({...p,site:e.target.value}))} placeholder="예) 3층 화장실"
 style={{width:"100%",background:"#f8f8f8",border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 12px",color:"#0d0d0d",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
 </div>
 <div style={{flex:1}}>
 <div style={{fontSize:11,color:"#888888",marginBottom:4}}>날짜</div>
 <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
 style={{width:"100%",background:"#f8f8f8",border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 8px",color:"#0d0d0d",fontSize:12,boxSizing:"border-box",outline:"none"}}/>
 </div>
 </div>
 <div>
 <div style={{fontSize:11,color:"#888888",marginBottom:4}}>메모</div>
 <input value={form.memo} onChange={e=>setForm(p=>({...p,memo:e.target.value}))} placeholder="작업 내용 메모"
 style={{width:"100%",background:"#f8f8f8",border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 12px",color:"#0d0d0d",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
 </div>
 </div>

 
 <label style={{display:"block",marginBottom:14,cursor:"pointer"}}>
 <div style={{background:`${teal}11`,border:`2px dashed ${teal}66`,borderRadius:14,padding:"22px",textAlign:"center"}}>
 <div style={{fontSize:32,marginBottom:6}}>📷</div>
 <div style={{fontSize:13,fontWeight:700,color:teal,marginBottom:2}}>사진 선택 또는 촬영</div>
 <div style={{fontSize:11,color:"#888888"}}>여러 장 동시 선택 가능 · 자동 압축 적용</div>
 </div>
 <input type="file" accept="image/*" multiple onChange={onFiles} style={{display:"none"}}/>
 </label>

 
 {previews.length>0&&(
 <div style={{marginBottom:14}}>
 <div style={{fontSize:12,fontWeight:700,color:"#888888",marginBottom:8}}>{previews.length}장 선택됨</div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
 {previews.map((p,i)=>(
 <div key={i} style={{position:"relative",borderRadius:10,overflow:"hidden",aspectRatio:"1"}}>
 <img src={p.dataUrl} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
 <button onClick={()=>removePreview(i)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:22,height:22,color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
 </div>
 ))}
 </div>
 </div>
 )}

 
 {uploading&&(
 <div style={{marginBottom:14}}>
 <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:teal,marginBottom:6}}>
 <span>업로드 중...</span><span>{progress}%</span>
 </div>
 <div style={{background:"#f8f8f8",borderRadius:4,height:6,overflow:"hidden"}}>
 <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${teal},#00f0e0)`,transition:"width .3s",borderRadius:4}}/>
 </div>
 </div>
 )}

 
 {result&&<div style={{background:result.ok?"#00ccc418":"#e0454518",border:`1px solid ${result.ok?teal+"55":"#e0454544"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:result.ok?teal:"#e04545"}}>{result.msg}</div>}

 
 <button onClick={upload} disabled={uploading||!previews.length||!form.site}
 style={{width:"100%",background:previews.length&&form.site?`linear-gradient(135deg,${teal},#00f0e0)`:`${C.sur}`,border:"none",borderRadius:12,padding:"14px 0",color:previews.length&&form.site?"#fff":C.mut,fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:previews.length&&form.site?`0 6px 20px ${teal}44`:"none",transition:"all .2s"}}>
 {uploading?`⏳ 업로드 중 (${progress}%)`:`📤 드라이브에 업로드 (${previews.length}장)`}
 </button>
        </div>
      )}

      
      {tab==="list"&&(
        <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
 {loading&&<div style={{textAlign:"center",padding:"40px",color:"#888888"}}>⏳ 불러오는 중...</div>}
 {!loading&&!photos.length&&<div style={{textAlign:"center",padding:"60px 20px",color:"#888888"}}><div style={{fontSize:44,marginBottom:12}}>📸</div><div style={{fontSize:13}}>업로드된 사진이 없습니다</div></div>}
 {(()=>{
 // 날짜+현장 그룹
 const groups={};
 for(const p of photos){
 const k=`${p["날짜"]}__${p["현장명"]}`;
 if(!groups[k]) groups[k]={date:p["날짜"],site:p["현장명"],items:[]};
 groups[k].items.push(p);
 }
 return Object.values(groups).map((g,i)=>(
 <div key={i} style={{background:"#ffffff",border:`1px solid ${C.line}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
 <div style={{padding:"11px 14px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:8}}>
 <div style={{width:3,height:16,background:teal,borderRadius:2}}/>
 <div>
 <div style={{fontSize:13,fontWeight:800,color:"#0d0d0d"}}>{g.site}</div>
 <div style={{fontSize:11,color:"#888888"}}>{g.date.replace(/-/g,".")} · {g.items.length}장</div>
 </div>
 </div>
 <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
 {g.items.map((item,j)=>(
 <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",background:"#f8f8f8",borderRadius:8}}>
 <div style={{fontSize:20}}>📷</div>
 <div style={{flex:1}}>
 <div style={{fontSize:12,color:"#0d0d0d",fontWeight:600}}>{item["파일명"]}</div>
 {item["메모"]&&<div style={{fontSize:11,color:"#888888",marginTop:1}}>{item["메모"]}</div>}
 </div>
 <a href={item["드라이브URL"]} target="_blank" rel="noreferrer"
 style={{background:`${teal}22`,border:`1px solid ${teal}55`,borderRadius:7,padding:"5px 10px",color:teal,fontSize:11,fontWeight:700,textDecoration:"none",flexShrink:0}}>보기</a>
 </div>
 ))}
 </div>
 </div>
 ));
 })()}
        </div>
      )}
    </div>
  );
}

// ── 구글 연동 설정 화면 ──────────────────────────────────
function ConnectScreen({apiUrl,setApiUrl,onBack}){
  const [input,setInput]=useState(apiUrl);
  const [status,setStatus]=useState(null);
  const [testing,setTesting]=useState(false);

  const test=async()=>{
    if(!input.trim()){setStatus({ok:false,msg:"URL을 입력해주세요."});return;}
    setTesting(true);setStatus(null);
    try{
      // Vercel 프록시(/api/gas)를 통해 GAS에 ping
      const r=await apiGet("",{action:"ping"});
      if(r.ok){setStatus({ok:true,msg:"✅ 연결 성공! "+r.msg});setApiUrl(input.trim());}
      else setStatus({ok:false,msg:"❌ 응답 오류: "+r.msg});
    }catch(e){setStatus({ok:false,msg:"❌ 연결 실패: "+e.message});}
    setTesting(false);
  };

  const runSetup=async()=>{
    const url=apiUrl||input.trim();
    if(!url) return;
    setTesting(true);
    setStatus({ok:true,msg:"⏳ 설정 중... 잠시 기다려주세요 (10~20초)"});
    try{
      const r=await apiGet(url,{action:"setup"});
      if(r.ok){
        setStatus({ok:true,msg:"✅ 설정 완료! 구글 시트·캘린더·드라이브 폴더가 생성됐습니다."});
      } else {
        setStatus({ok:false,msg:"❌ 설정 오류: "+(r.msg||"알 수 없는 오류")});
      }
    }catch(e){
      setStatus({ok:false,msg:"❌ 연결 실패. URL 끝이 /exec 인지 확인해주세요."});
    }
    setTesting(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Settings</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>구글 연동 설정</div>
 </div>
        </div>
      </div>
      <div style={{flex:1,padding:"20px 16px",overflowY:"auto"}}>
        
        <div style={{background:"#ffffff",border:"1px solid #3d8ef055",borderRadius:14,padding:"16px",marginBottom:18}}>
 <div style={{fontSize:13,fontWeight:800,color:"#1a56cc",marginBottom:10}}>📋 설치 순서</div>
 {["1. script.google.com 접속 → 새 프로젝트 생성","2. 제공받은 jaeam_gas.js 코드 전체 붙여넣기","3. 상단 메뉴 → 배포 → 새 배포","4. 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자","5. 배포 → URL 복사 후 아래에 붙여넣기","6. '연결 테스트' 버튼 클릭","7. 성공 시 '초기 설정 실행' 클릭 (최초 1회)"].map((s,i)=>(
 <div key={i} style={{fontSize:12,color:i===4||i===5||i===6?"#ff9a3c":"#8a8ea8",marginBottom:6,lineHeight:1.6}}>{s}</div>
 ))}
        </div>
        
        <div style={{marginBottom:14}}>
 <div style={{fontSize:12,color:"#888888",marginBottom:6,fontWeight:700}}>Apps Script 웹앱 URL</div>
 <input value={input} onChange={e=>setInput(e.target.value)}
 placeholder="https://script.google.com/macros/s/..."
 style={{width:"100%",background:"#ffffff",border:"1px solid #2d3245",borderRadius:10,padding:"12px",color:"#0d0d0d",fontSize:12,fontFamily:"monospace",boxSizing:"border-box",outline:"none"}}/>
        </div>
        {status&&<div style={{background:status.ok?"#3ec46d18":"#e0454518",border:`1px solid ${status.ok?"#3ec46d44":"#e0454544"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:status.ok?"#0a7a50":"#e04545"}}>{status.msg}</div>}
        <div style={{display:"flex",gap:8}}>
 <button onClick={test} disabled={testing} style={{flex:1,background:"#1a56cc",border:"none",borderRadius:10,padding:"12px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:testing?.6:1}}>{testing?"⏳ 확인 중...":"🔗 연결 테스트"}</button>
 <button onClick={runSetup} disabled={testing||!apiUrl} style={{flex:1,background:apiUrl?"#f56e1a":"#e8e8e8",border:"none",borderRadius:10,padding:"12px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:testing?.6:1}}>🚀 초기 설정 실행</button>
        </div>
        {apiUrl&&<div style={{marginTop:12,background:"#3ec46d18",border:"1px solid #3ec46d44",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#0a7a50"}}>✅ 현재 연결됨: {apiUrl.slice(0,60)}...</div>}
      </div>
    </div>
  );
}

// ── 공지사항 화면 ─────────────────────────────────────────
function NoticeScreen({apiUrl,onBack}){
  const [notices,setNotices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",content:"",important:false});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{load();},[]);
  const load=async()=>{
    
    setLoading(true);
    try{const r=await apiGet("",{action:"getNotices"});if(r.ok)setNotices(r.data||[]);}catch{}
    setLoading(false);
  };
  const save=async()=>{
    if(!form.title) return;
    setSaving(true);
    try{await apiPost("",{action:"addNotice",...form,date:todayStr()});setForm({title:"",content:"",important:false});setShowForm(false);load();}catch{}
    setSaving(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Notice</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>공지사항</div>
 </div>
        </div>
      </div>
      {false&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요 (홈 → 연동 설정)</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#ffffff",borderBottom:"1px solid #2d3245"}}>
        <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="제목"
 style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#0d0d0d",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} placeholder="내용"
 style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#0d0d0d",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none",resize:"vertical",minHeight:80}}/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
 <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#0d0d0d",cursor:"pointer"}}>
 <input type="checkbox" checked={form.important} onChange={e=>setForm(p=>({...p,important:e.target.checked}))}/> ⭐ 중요
 </label>
 <button onClick={save} disabled={saving||!form.title} style={{marginLeft:"auto",background:"#f56e1a",border:"none",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"저장"}</button>
        </div>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#888888"}}>⏳ 불러오는 중...</div>}
        {!loading&&!notices.length&&<div style={{textAlign:"center",padding:"60px 20px",color:"#888888"}}><div style={{fontSize:40,marginBottom:12}}>📢</div><div style={{fontSize:13}}>공지사항이 없습니다</div></div>}
        {notices.map((n,i)=>(
 <div key={i} style={{background:"#ffffff",border:`1px solid ${n["중요도"]==="⭐중요"?"#f56e1a55":"#e8e8e8"}`,borderRadius:12,padding:"13px 14px",marginBottom:9}}>
 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
 {n["중요도"]==="⭐중요"&&<span style={{fontSize:10,background:"#f56e1a33",color:"#f56e1a",borderRadius:4,padding:"2px 7px",fontWeight:700}}>⭐ 중요</span>}
 <span style={{fontSize:14,fontWeight:800,color:"#0d0d0d",flex:1}}>{n["제목"]}</span>
 </div>
 <div style={{fontSize:12,color:"#8a8ea8",lineHeight:1.7,marginBottom:6}}>{n["내용"]}</div>
 <div style={{display:"flex",gap:8,fontSize:10,color:"#3a3e52"}}>
 <span>{n["날짜"]}</span><span>·</span><span>{n["작성자"]}</span>
 </div>
 </div>
        ))}
      </div>
    </div>
  );
}

// ── 일정표 화면 ──────────────────────────────────────────
function ScheduleScreen({apiUrl,onBack}){
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",start:todayStr(),end:"",allDay:true,location:"",description:""});
  const [saving,setSaving]=useState(false);

  
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    try{
      const start=new Date(); start.setDate(1);
      const end=new Date(); end.setMonth(end.getMonth()+2);
      const r=await apiGet("",{action:"getCalendar",start:start.toISOString(),end:end.toISOString()});
      if(r.ok && r.data) setEvents(r.data||[]);
      else if(!r.ok) console.warn("[일정표] GAS 오류:", r.msg);
    }catch(e){ console.error("[일정표] 오류:", e); }
    setLoading(false);
  };
  const save=async()=>{
    if(!form.title) return;
    setSaving(true);
    try{
      const body={action:"addEvent",...form};
      if(form.allDay){body.start=form.start;delete body.end;}
      else{body.start=form.start+"T09:00:00";body.end=(form.end||form.start)+"T18:00:00";}
      await apiPost("",body);
      setShowForm(false);setForm({title:"",start:todayStr(),end:"",allDay:true,location:"",description:""});load();
    }catch{}
    setSaving(false);
  };
  const delEv=async(id)=>{
    if(!window.confirm("삭제할까요?")) return;
    await apiPost("",{action:"deleteEvent",eventId:id});load();
  };

  // 날짜별 그룹
  const byDate={};
  for(const ev of events){
    const d=ev.start?.slice(0,10)||"";
    if(!byDate[d]) byDate[d]=[];
    byDate[d].push(ev);
  }
  const dates=Object.keys(byDate).sort();

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Schedule</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>일정표</div>
 </div>
        </div>
      </div>
      {false&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#ffffff",borderBottom:"1px solid #2d3245"}}>
        <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="일정 제목"
 style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#0d0d0d",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
 <div style={{flex:1}}><div style={{fontSize:11,color:"#888888",marginBottom:3}}>날짜</div><input type="date" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"8px",color:"#0d0d0d",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
 <div style={{flex:1}}><div style={{fontSize:11,color:"#888888",marginBottom:3}}>장소</div><input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="장소" style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"8px",color:"#0d0d0d",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
        </div>
        <button onClick={save} disabled={saving||!form.title} style={{width:"100%",background:"#5b21b6",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"일정 저장"}</button>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#888888"}}>⏳ 불러오는 중...</div>}
        {!loading&&!events.length&&<div style={{textAlign:"center",padding:"60px 20px",color:"#888888"}}><div style={{fontSize:40,marginBottom:12}}>📅</div><div style={{fontSize:13}}>일정이 없습니다</div></div>}
        {dates.map(date=>(
 <div key={date} style={{marginBottom:14}}>
 <div style={{fontSize:12,fontWeight:800,color:"#5b21b6",marginBottom:6,paddingLeft:2}}>{date.replace(/-/g,".")}</div>
 {byDate[date].map((ev,i)=>(
 <div key={i} style={{background:"#ffffff",border:"1px solid #b56af044",borderRadius:10,padding:"11px 14px",marginBottom:7,display:"flex",alignItems:"center",gap:10}}>
 <div style={{width:4,height:36,background:"#5b21b6",borderRadius:2,flexShrink:0}}/>
 <div style={{flex:1}}>
 <div style={{fontSize:13,fontWeight:700,color:"#0d0d0d",marginBottom:2}}>{ev.title}</div>
 {ev.location&&<div style={{fontSize:11,color:"#888888"}}>📍 {ev.location}</div>}
 <div style={{fontSize:10,color:"#3a3e52",marginTop:2}}>{ev.allDay?"종일":ev.start?.slice(11,16)}</div>
 </div>
 <button onClick={()=>delEv(ev.id)} style={{background:"transparent",border:"1px solid #2d3245",borderRadius:7,width:28,height:28,color:"#888888",fontSize:13,flexShrink:0}}>🗑</button>
 </div>
 ))}
 </div>
        ))}
      </div>
    </div>
  );
}

// ── 금일계획 화면 ────────────────────────────────────────
function PlanScreen({apiUrl,onBack}){
  const today=todayStr();
  const [plans,setPlans]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({site:"",work:"",worker:"",memo:""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    try{
      // 전체 불러온 후 앱에서 날짜 필터링 (날짜 형식 차이 대응)
      const r=await apiGet("",{action:"getPlans"});
      if(r.ok){
        const todayNorm=today.replace(/-/g,""); // "2026-06-10" → "20260610"
        const filtered=(r.data||[]).filter(p=>{
          const d=String(p["날짜"]||p["date"]||"");
          const dNorm=d.replace(/-/g,"");
          return dNorm===todayNorm || d===today;
        });
        // 필터 결과 없으면 전체 표시 (오늘 일정이 없는 경우)
        setPlans(filtered.length>0 ? filtered : (r.data||[]));
      }
    }catch(e){console.error(e);}
    setLoading(false);
  };
  const save=async()=>{
    if(!form.site||!form.work) return;
    setSaving(true);
    try{await apiPost("",{action:"addPlan",...form,date:today,status:"예정"});setForm({site:"",work:"",worker:"",memo:""});setShowForm(false);load();}catch{}
    setSaving(false);
  };
  const updateStatus=async(id,status)=>{
    try{await apiPost("",{action:"updatePlan",id,status});load();}catch{}
  };

  const statusColor={예정:"#888888",진행중:"#1a56cc",완료:"#0a7a50",보류:"#e04545"};

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#fafafa"}}>
        <button onClick={onBack} style={{background:"#ffffff",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d0d",fontSize:18}}>‹</button>
        <div><div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Daily Plan</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>금일계획</div><div style={{fontSize:11,color:"#888888"}}>{today.replace(/-/g,".")}</div></div>
        <button onClick={()=>setShowForm(p=>!p)} style={{marginLeft:"auto",background:"#ff9a3c",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>＋ 계획</button>
      </div>
      {false&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#ffffff",borderBottom:"1px solid #2d3245"}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
 <input value={form.site} onChange={e=>setForm(p=>({...p,site:e.target.value}))} placeholder="현장명" style={{flex:1,background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#0d0d0d",fontSize:13,outline:"none"}}/>
 <input value={form.worker} onChange={e=>setForm(p=>({...p,worker:e.target.value}))} placeholder="담당자" style={{flex:1,background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#0d0d0d",fontSize:13,outline:"none"}}/>
        </div>
        <input value={form.work} onChange={e=>setForm(p=>({...p,work:e.target.value}))} placeholder="작업 내용" style={{width:"100%",background:"#fafafa",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#0d0d0d",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <button onClick={save} disabled={saving||!form.site||!form.work} style={{width:"100%",background:"#ff9a3c",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"저장"}</button>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#888888"}}>⏳ 불러오는 중...</div>}
        {!loading&&!plans.length&&<div style={{textAlign:"center",padding:"60px 20px",color:"#888888"}}><div style={{fontSize:40,marginBottom:12}}>📝</div><div style={{fontSize:13}}>오늘 계획이 없습니다</div></div>}
        
        {plans.length>0&&(
 <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
 {Object.entries(statusColor).map(([s,c])=>(
 <div key={s} style={{background:"#ffffff",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
 <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"monospace"}}>{plans.filter(p=>p["상태"]===s).length}</div>
 <div style={{fontSize:10,color:"#888888"}}>{s}</div>
 </div>
 ))}
 </div>
        )}
        {plans.map((p,i)=>(
 <div key={i} style={{background:"#ffffff",border:`1px solid ${statusColor[p["상태"]]||"#e8e8e8"}44`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
 <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
 <div style={{flex:1}}>
 <div style={{fontSize:13,fontWeight:700,color:"#0d0d0d",marginBottom:2}}>{p["현장명"]}</div>
 <div style={{fontSize:12,color:"#8a8ea8"}}>{p["작업내용"]}</div>
 {p["담당자"]&&<div style={{fontSize:11,color:"#888888",marginTop:2}}>👤 {p["담당자"]}</div>}
 </div>
 <span style={{fontSize:11,background:`${statusColor[p["상태"]]}22`,color:statusColor[p["상태"]],borderRadius:6,padding:"3px 8px",fontWeight:700,flexShrink:0}}>{p["상태"]}</span>
 </div>
 <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
 {["예정","진행중","완료","보류"].map(s=>(
 <button key={s} onClick={()=>updateStatus(p["ID"],s)}
 style={{background:p["상태"]===s?statusColor[s]:"#fafafa",border:`1px solid ${statusColor[s]}66`,borderRadius:6,padding:"4px 10px",color:p["상태"]===s?"#fff":statusColor[s],fontSize:11,cursor:"pointer",fontWeight:p["상태"]===s?700:400}}>{s}</button>
 ))}
 </div>
 </div>
        ))}
      </div>
    </div>
  );
}

// ── 재단요청서 화면 ──────────────────────────────────────
function RequestScreen({reqs,setReqs,installed:instProp,setInstalled:setInstProp,onBack}){
  const [selDate,  setSelDate]  = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [confirmId,setConfirmId]= useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [showStatus,setShowStatus]=useState(false);

  const [checked,setChecked]=useState(()=>{ try{return JSON.parse(localStorage.getItem("fw_checks")||"{}");}catch{return {};} });
  const [localInst,setLocalInst]=useState(()=>{ try{return JSON.parse(localStorage.getItem("fw_installed")||"{}");}catch{return {};} });
  const installed=instProp&&Object.keys(instProp).length>0?instProp:localInst;

  const toggleCheck=(reqId,idx)=>{
    const key=`${reqId}_${idx}`;
    const next={...checked,[key]:!checked[key]};
    setChecked(next);
    try{localStorage.setItem("fw_checks",JSON.stringify(next));}catch{}
  };
  const isChecked=(reqId,idx)=>!!checked[`${reqId}_${idx}`];
  const allDone=(req)=>req.cuts?.length>0&&req.cuts?.every((_,i)=>isChecked(req.id,i));
  const doneCnt=(req)=>req.cuts?.filter((_,i)=>isChecked(req.id,i)).length||0;
  const toggleInstall=(reqId)=>{
    const next={...installed,[reqId]:!installed[reqId]};
    setLocalInst(next);
    if(setInstProp)setInstProp(next);
    try{localStorage.setItem("fw_installed",JSON.stringify(next));}catch{}
  };
  const isInstalled=(reqId)=>!!installed[reqId];

  const deleteReq=(id)=>setConfirmId(id);
  const confirmDelete=()=>{
    if(!confirmId)return;
    const u=reqs.filter(r=>r.id!==confirmId); setReqs(u); saveReqs(u);
    if(detail?.id===confirmId)setDetail(null);
    setConfirmId(null);
  };

  const pink="#e8450a", grn="#0a7a50";

  const filteredReqs=reqs.filter(r=>{
    if(dateFrom&&r.date<dateFrom)return false;
    if(dateTo&&r.date>dateTo)return false;
    if(statusFilter==="inst_done")return isInstalled(r.id);
    if(statusFilter==="inst_todo")return !isInstalled(r.id);
    if(statusFilter==="cut_done") return allDone(r);
    if(statusFilter==="cut_todo") return !allDone(r);
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const byDate={};
  for(const r of filteredReqs){if(!byDate[r.date])byDate[r.date]=[];byDate[r.date].push(r);}
  const dates=Object.keys(byDate).sort((a,b)=>b.localeCompare(a));

  const confirmModal=confirmId?(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,width:"100%",maxWidth:280,textAlign:"center",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#0d0d0d",marginBottom:6}}>삭제할까요?</div>
        <div style={{fontSize:11,color:"#999",marginBottom:20}}>삭제하면 복구할 수 없습니다</div>
        <div style={{display:"flex",gap:8}}>
 <button onClick={()=>setConfirmId(null)} style={{flex:1,background:"#f5f5f5",border:"none",borderRadius:6,padding:"10px",color:"#0d0d0d",fontSize:13,fontWeight:600,cursor:"pointer"}}>취소</button>
 <button onClick={confirmDelete} style={{flex:1,background:"#cc2200",border:"none",borderRadius:6,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>삭제</button>
        </div>
      </div>
    </div>
  ):null;

  const pageHdr=(title,engSub,onB,right)=>(
    <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",background:"#ffffff",position:"sticky",top:0,zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onB} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
        <div style={{flex:1}}>
 {engSub&&<div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>{engSub}</div>}
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>{title}</div>
        </div>
        {right&&<div style={{flexShrink:0}}>{right}</div>}
      </div>
    </div>
  );

  // ── 상세보기 ─────────────────────────────────────────────
  if(detail){
    const cnt=doneCnt(detail), total=detail.cuts?.length||0, done=allDone(detail);
    const colors=["#1a56cc","#e8450a","#0a7a50","#5b21b6","#a16207"];
    return(
      <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
        {confirmModal}
        {pageHdr(
 detail.site||"재단요청서",
 (detail.date||"").replace(/-/g,".")+" · "+(detail.at||"").replace("T"," ").slice(0,16),
 ()=>setDetail(null),
 <button onClick={()=>deleteReq(detail.id)} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,padding:"5px 12px",color:"#cc2200",fontSize:11,cursor:"pointer"}}>삭제</button>
        )}
        <div style={{flex:1,overflowY:"auto",padding:14}}>
 
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
 <div onClick={()=>{ const allOk=detail.cuts?.every((_,i)=>isChecked(detail.id,i)); detail.cuts?.forEach((_,i)=>{ if(allOk===isChecked(detail.id,i))toggleCheck(detail.id,i); }); }}
 style={{background:done?"#f0fff8":"#fafafa",border:"1.5px solid "+(done?"#0a7a50":"#e8e8e8"),borderRadius:10,padding:"14px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
 <div style={{fontSize:24,marginBottom:5}}>{done?"✅":"✂️"}</div>
 <div style={{fontSize:12,fontWeight:700,color:done?"#0a7a50":"#444"}}>재단 완료</div>
 <div style={{fontSize:10,color:"#999",marginTop:2}}>{cnt}/{total} · {done?"탭하여 취소":"탭하여 완료"}</div>
 </div>
 <div onClick={()=>toggleInstall(detail.id)}
 style={{background:isInstalled(detail.id)?"#fff5f0":"#fafafa",border:"1.5px solid "+(isInstalled(detail.id)?"#e8450a":"#e8e8e8"),borderRadius:10,padding:"14px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
 <div style={{fontSize:24,marginBottom:5}}>{isInstalled(detail.id)?"🏗️":"🔲"}</div>
 <div style={{fontSize:12,fontWeight:700,color:isInstalled(detail.id)?"#e8450a":"#444"}}>시공 완료</div>
 <div style={{fontSize:10,color:"#999",marginTop:2}}>{parseFloat(detail.m2||0).toFixed(3)}㎡ · {isInstalled(detail.id)?"탭하여 취소":"탭하여 완료"}</div>
 </div>
 </div>
 
 <div style={{marginBottom:12}}>
 <div style={{background:"#f0f0f0",borderRadius:2,height:3,overflow:"hidden"}}>
 <div style={{width:(total>0?cnt/total*100:0)+"%",height:"100%",background:done?grn:pink,borderRadius:2,transition:"width .4s"}}/>
 </div>
 </div>
 
 <div style={{display:"flex",gap:12,marginBottom:12,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>
 {[{l:"면적",v:parseFloat(detail.m2||0).toFixed(3)+"㎡",c:"#1a56cc"},{l:"보드",v:detail.boards+"장",c:"#e8450a"}].map(s=>(
 <div key={s.l} style={{flex:1,textAlign:"center"}}>
 <div style={{fontSize:9,fontWeight:600,color:"#999",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{s.l}</div>
 <div style={{fontSize:18,fontWeight:900,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
 </div>
 ))}
 </div>
 
 {(detail.site||detail.note)&&(
 <div style={{background:"#fafafa",border:"1px solid #f0f0f0",borderRadius:6,padding:"10px 14px",marginBottom:10,fontSize:12}}>
 {detail.site&&<div style={{color:"#0d0d0d",fontWeight:600,marginBottom:2}}>📍 {detail.site}</div>}
 {detail.note&&<div style={{color:"#999"}}>{detail.note}</div>}
 </div>
 )}
 
 {detail.special&&(
 <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:"10px 14px",marginBottom:10}}>
 <div style={{fontSize:10,fontWeight:700,color:"#a16207",marginBottom:4}}>⚠️ 재단 특이사항</div>
 <div style={{fontSize:13,color:"#0d0d0d",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{detail.special}</div>
 </div>
 )}
 
 {detail.diagrams&&detail.diagrams.length>0&&(
 <div style={{border:"1px solid #f0f0f0",borderRadius:8,overflow:"hidden",marginBottom:12}}>
 <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f0f0",fontSize:11,fontWeight:700,color:"#1a56cc",background:"#fafafa"}}>📐 재단 도면</div>
 <div style={{padding:12,display:"flex",flexDirection:"column",gap:12}}>
 {detail.diagrams.map((d,di)=>(
 <div key={di} style={{background:"#fafafa",borderRadius:6,padding:"10px 12px"}}>
 <div style={{fontSize:11,fontWeight:700,color:pink,marginBottom:8}}>✂ {d.label||("항목"+(di+1))}</div>
 {d.isGroup&&d.bw>0&&d.bh>0&&(()=>{
 const sc=Math.min(240/(d.bw||1),180/(d.bh||1),1);
 const bw=d.bw*sc, bh=d.bh*sc, PL=40, PT=14;
 return(
 <div style={{overflowX:"auto"}}>
 <svg width={bw+PL+20} height={bh+PT+40}>
 <text x={PL+2} y={PT-2} fill="#999" fontSize="9">X=좌측기준 Y=하단~배관중심(mm)</text>
 <rect x={PL} y={PT} width={bw} height={bh} fill="#f5f5f5" stroke="#1a56cc" strokeWidth="1.5" rx="2"/>
 {(d.pipes||[]).map((p,pi)=>{
 const col=colors[pi%colors.length];
 const pcx=PL+(p.bx/d.bw)*bw;
 const pcy=PT+bh-(p.cy!==undefined?p.cy:p.by)/d.bh*bh;
 const pr=Math.max((p.d/2)*sc,4);
 return(
 <g key={pi}>
 <line x1={pcx} y1={PT} x2={pcx} y2={PT+bh} stroke={col+"44"} strokeWidth=".8" strokeDasharray="3,3"/>
 <line x1={PL} y1={pcy} x2={PL+bw} y2={pcy} stroke={col+"44"} strokeWidth=".8" strokeDasharray="3,3"/>
 <circle cx={pcx} cy={pcy} r={pr} fill={col+"22"} stroke={col} strokeWidth="1.5"/>
 <circle cx={pcx} cy={pcy} r={3} fill={col}/>
 <text x={pcx} y={pcy-pr-5} textAnchor="middle" fill={col} fontSize="10" fontWeight="700" fontFamily="monospace">{"Ø"+p.d}</text>
 </g>
 );
 })}
 <line x1={PL} y1={PT+bh+12} x2={PL+bw} y2={PT+bh+12} stroke="#e8450a" strokeWidth="1"/>
 <text x={PL+bw/2} y={PT+bh+26} textAnchor="middle" fill="#e8450a" fontSize="10" fontFamily="monospace" fontWeight="700">{d.bw+"mm"}</text>
 <line x1={PL-12} y1={PT} x2={PL-12} y2={PT+bh} stroke="#e8450a" strokeWidth="1"/>
 <text x={PL-14} y={PT+bh/2+4} textAnchor="middle" fill="#e8450a" fontSize="10" fontFamily="monospace" fontWeight="700" transform={"rotate(-90,"+(PL-28)+","+(PT+bh/2)+")"}>{d.bh+"mm"}</text>
 </svg>
 </div>
 );
 })()}
 {d.isFaceGroup&&(
 <div style={{fontSize:12,color:"#0d0d0d",lineHeight:2}}>
 <div>① 가로면(상/하): <span style={{color:"#e8450a",fontWeight:700}}>{d.horzW}×{d.horzH}mm</span> ×2장</div>
 <div>② 세로면(좌/우): <span style={{color:"#e8450a",fontWeight:700}}>{d.vertW}×{d.vertH}mm</span> ×2장</div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 
 {detail.cuts&&detail.cuts.length>0&&(
 <div style={{border:"1px solid #f0f0f0",borderRadius:8,overflow:"hidden"}}>
 <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f0f0",fontSize:11,fontWeight:700,color:"#1a56cc",background:"#fafafa"}}>✂ 재단 목록</div>
 <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:6}}>
 {detail.cuts.map((c,i)=>(
 <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fafafa",borderRadius:6}}>
 <div style={{width:20,height:20,borderRadius:4,background:pink+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:pink,flexShrink:0}}>{i+1}</div>
 <div style={{flex:1,fontSize:12,fontWeight:600,color:"#0d0d0d"}}>{c.label}{c.faceLabel&&<span style={{marginLeft:5,fontSize:10,color:"#e8450a",background:"#fff3ee",borderRadius:3,padding:"1px 5px"}}>{c.faceLabel}</span>}</div>
 <span style={{fontSize:11,color:"#e8450a",fontFamily:"monospace",fontWeight:700}}>{c.w}×{c.h}mm</span>
 <span style={{fontSize:12,fontWeight:700,color:"#1a56cc",fontFamily:"monospace"}}>{c.qty}장</span>
 </div>
 ))}
 </div>
 </div>
 )}
        </div>
      </div>
    );
  }

  // ── 목록 ─────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      {confirmModal}
      {pageHdr("재단요청서","Request",onBack,
        <div style={{fontSize:11,color:pink,fontWeight:700}}>{reqs.length}건</div>
      )}
      
      <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0",background:"#fafafa"}}>
        <div style={{marginBottom:8}}>
 <div style={{display:"flex",gap:5,marginBottom:6}}>
 {[{lb:"당일",fn:()=>{const t=todayStr();setDateFrom(t);setDateTo(t);}},{lb:"1개월",fn:()=>{const t=todayStr();const f=new Date();f.setMonth(f.getMonth()-1);setDateFrom(f.toISOString().slice(0,10));setDateTo(t);}},{lb:"3개월",fn:()=>{const t=todayStr();const f=new Date();f.setMonth(f.getMonth()-3);setDateFrom(f.toISOString().slice(0,10));setDateTo(t);}},{lb:"6개월",fn:()=>{const t=todayStr();const f=new Date();f.setMonth(f.getMonth()-6);setDateFrom(f.toISOString().slice(0,10));setDateTo(t);}},{lb:"전체",fn:()=>{setDateFrom("");setDateTo("");}}].map(q=>(
 <button key={q.lb} onClick={q.fn} style={{flex:1,background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:4,padding:"5px 0",color:"#555",fontSize:10,fontWeight:600,cursor:"pointer"}}>{q.lb}</button>
 ))}
 </div>
 <div style={{display:"flex",gap:6,alignItems:"center"}}>
 <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{flex:1,background:"#fff",border:"1px solid "+(dateFrom?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"6px 8px",color:"#0d0d0d",fontSize:11,outline:"none"}}/>
 <span style={{color:"#ccc"}}>—</span>
 <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{flex:1,background:"#fff",border:"1px solid "+(dateTo?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"6px 8px",color:"#0d0d0d",fontSize:11,outline:"none"}}/>
 {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{background:"none",border:"none",color:"#999",fontSize:14,cursor:"pointer",padding:"0 4px"}}>✕</button>}
 </div>
        </div>
        
        <div style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
 {[{k:"all",lb:"전체",c:"#444"},{k:"cut_todo",lb:"✂️ 재단전",c:"#e8450a"},{k:"cut_done",lb:"✅ 재단완",c:"#0a7a50"},{k:"inst_todo",lb:"🔲 시공전",c:"#888"},{k:"inst_done",lb:"🏗️ 시공완",c:"#e8450a"}].map(s=>(
 <button key={s.k} onClick={()=>setStatusFilter(s.k)} style={{flex:1,background:"none",border:"none",borderBottom:"2px solid "+(statusFilter===s.k?s.c:"transparent"),padding:"7px 2px 6px",color:statusFilter===s.k?s.c:"#999",fontSize:9,fontWeight:statusFilter===s.k?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>
 {s.lb}
 </button>
 ))}
        </div>
      </div>
      
      <div style={{flex:1,overflowY:"auto",padding:"10px 14px 32px"}}>
        {!filteredReqs.length?(
 <div style={{textAlign:"center",padding:"52px 20px",color:"#999"}}>
 <div style={{fontSize:36,marginBottom:10}}>📄</div>
 <div style={{fontSize:13,color:"#444",marginBottom:4}}>{statusFilter==="all"&&!dateFrom&&!dateTo?"재단 요청이 없습니다":"해당 조건 없음"}</div>
 </div>
        ):dates.map(date=>{
 const dayR=byDate[date], isOpen=selDate===date;
 const dayCutDone=dayR.filter(r=>allDone(r)).length;
 const dayInstDone=dayR.filter(r=>isInstalled(r.id)).length;
 return(
 <div key={date} style={{marginBottom:8}}>
 <div onClick={()=>setSelDate(isOpen?null:date)} style={{display:"flex",alignItems:"center",padding:"8px 10px",cursor:"pointer",borderRadius:8,background:isOpen?"#fafafa":"transparent"}}>
 <div style={{fontSize:13,fontWeight:700,color:isOpen?"#0d0d0d":"#555"}}>{date.replace(/-/g,".")}</div>
 <div style={{marginLeft:8,display:"flex",gap:5}}>
 {dayCutDone>0&&<span style={{fontSize:9,background:"#f0fff8",color:"#0a7a50",borderRadius:3,padding:"1px 5px",fontWeight:700}}>✅{dayCutDone}</span>}
 {dayInstDone>0&&<span style={{fontSize:9,background:"#fff5f0",color:"#e8450a",borderRadius:3,padding:"1px 5px",fontWeight:700}}>🏗{dayInstDone}</span>}
 <span style={{fontSize:9,color:"#ccc"}}>{dayR.length}건</span>
 </div>
 <span style={{marginLeft:"auto",color:"#ccc",fontSize:11}}>{isOpen?"▲":"▼"}</span>
 </div>
 {isOpen&&(
 <div style={{background:"#ffffff",borderRadius:8,overflow:"hidden",border:"1px solid #f0f0f0"}}>
 {dayR.map((req,i)=>{
 const done_r=allDone(req), inst_r=isInstalled(req.id);
 return(
 <div key={req.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:i<dayR.length-1?"1px solid #f5f5f5":"none",cursor:"pointer"}} onClick={()=>setDetail(req)}>
 <div style={{width:3,height:36,borderRadius:2,background:inst_r?"#e8450a":done_r?"#0a7a50":"#e8e8e8",flexShrink:0}}/>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:13,fontWeight:700,color:"#0d0d0d",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{req.site||"현장명 없음"}</div>
 <div style={{display:"flex",gap:5}}>
 <span style={{fontSize:10,fontWeight:600,color:done_r?"#0a7a50":"#e8450a"}}>{done_r?"✅ 재단완":"✂️ 재단전"}</span>
 <span style={{fontSize:10,color:"#ddd"}}>·</span>
 <span style={{fontSize:10,fontWeight:600,color:inst_r?"#e8450a":"#999"}}>{inst_r?"🏗️ 시공완":"🔲 시공전"}</span>
 </div>
 </div>
 <div style={{textAlign:"right",flexShrink:0}}>
 <div style={{fontSize:12,fontWeight:700,color:"#1a56cc",fontFamily:"monospace"}}>{parseFloat(req.m2||0).toFixed(2)}㎡</div>
 <div style={{fontSize:9,color:"#ccc",marginTop:1}}>{(req.at||"").slice(11,16)}</div>
 </div>
 <span style={{color:"#ddd",fontSize:12}}>›</span>
 <button onClick={e=>{e.stopPropagation();deleteReq(req.id);}} style={{background:"none",border:"none",color:"#ddd",fontSize:14,cursor:"pointer",padding:"0 2px",flexShrink:0}}>🗑</button>
 </div>
 );
 })}
 <div style={{padding:"8px 14px",background:"#fafafa",display:"flex",justifyContent:"space-between",fontSize:10,color:"#999"}}>
 <span>{date.replace(/-/g,".")} 합계</span>
 <span style={{fontFamily:"monospace",fontWeight:700}}>{dayR.reduce((s,r)=>s+parseFloat(r.m2||0),0).toFixed(2)}㎡ · 재단 {dayCutDone}/{dayR.length} · 시공 {dayInstDone}/{dayR.length}</span>
 </div>
 </div>
 )}
 </div>
 );
        })}
      </div>
    </div>
  );
}

function PerfScreen({reqs,installed,onBack,apiUrl,isAdmin}){
  const [viewMode,setViewMode]=useState("daily");
  const [syncing,setSyncing]=useState(false);
  const [syncMsg,setSyncMsg]=useState("");

  const instReqs=reqs.filter(r=>installed&&installed[r.id]);
  const byDay={},byMonth={};
  for(const r of instReqs){
    const d=r.date||""; if(!d) continue;
    const m=d.slice(0,7);
    if(!byDay[d])   byDay[d]  ={label:d.slice(5).replace("-","/"),m2:0,cnt:0};
    if(!byMonth[m]) byMonth[m]={label:m.slice(0,4)+"년 "+parseInt(m.slice(5))+"월",m2:0,cnt:0};
    const v=parseFloat(r.m2||0);
    byDay[d].m2+=v; byDay[d].cnt++;
    byMonth[m].m2+=v; byMonth[m].cnt++;
  }
  const dayList =Object.entries(byDay).sort((a,b)=>a[0].localeCompare(b[0])).map(([,v])=>v);
  const monList =Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).map(([,v])=>v);
  const dataList=viewMode==="daily"?[...dayList].reverse():([...monList].reverse());
  const chartData=viewMode==="daily"?dayList.slice(-10):monList.slice(-8);
  const totalM2 =instReqs.reduce((s,r)=>s+parseFloat(r.m2||0),0);
  const totalCnt=instReqs.length;
  const avgM2   =totalCnt>0?totalM2/totalCnt:0;
  const maxM2   =Math.max(...chartData.map(d=>d.m2),0.001);

  const syncToSheet=async()=>{
    if(!apiUrl){setSyncMsg("API URL이 설정되지 않았습니다");setTimeout(()=>setSyncMsg(""),3000);return;}
    setSyncing(true);setSyncMsg("동기화 중...");
    try{
      const rows=instReqs.map(r=>({id:r.id,date:r.date,site:r.site||"",m2:parseFloat(r.m2||0).toFixed(4),boards:r.boards||0,note:r.note||"",at:(r.at||"").replace("T"," ").slice(0,16)}));
      const res=await apiPost("",{action:"syncPerf",rows});
      setSyncMsg(res.ok?"✅ 구글 시트 동기화 완료!":"❌ 동기화 실패");
    }catch{setSyncMsg("❌ 오류가 발생했습니다");}
    setSyncing(false);setTimeout(()=>setSyncMsg(""),4000);
  };

  // 꺾은선 그래프 SVG 생성
  const LineChart=({data,maxVal})=>{
    if(!data.length) return null;
    const W=320, H=140, PL=36, PR=16, PT=16, PB=32;
    const gW=W-PL-PR, gH=H-PT-PB;
    const n=data.length;
    const pts=data.map((d,i)=>({
      x:PL+(n===1?gW/2:i/(n-1)*gW),
      y:PT+gH*(1-d.m2/maxVal),
      m2:d.m2,
      label:d.label,
    }));
    const polyline=pts.map(p=>`${p.x},${p.y}`).join(" ");
    const area=`M${pts[0].x},${PT+gH} `+pts.map(p=>`L${p.x},${p.y}`).join(" ")+` L${pts[pts.length-1].x},${PT+gH} Z`;
    // Y축 가이드 3개
    const yGuides=[0,0.5,1];
    return(
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        
        {yGuides.map(t=>{
 const y=PT+gH*(1-t);
 return(
 <g key={t}>
 <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#f0f0f0" strokeWidth="1"/>
 <text x={PL-4} y={y+4} textAnchor="end" fill="#aaa" fontSize="8">{(maxVal*t).toFixed(1)}</text>
 </g>
 );
        })}
        
        <line x1={PL} y1={PT+gH} x2={W-PR} y2={PT+gH} stroke="#e8e8e8" strokeWidth="1"/>
        
        <path d={area} fill="#e8450a" fillOpacity="0.06"/>
        
        <polyline points={polyline} fill="none" stroke="#e8450a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        
        {pts.map((p,i)=>(
 <g key={i}>
 <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#e8450a" strokeWidth="2"/>
 
 {p.m2===maxVal&&(
 <circle cx={p.x} cy={p.y} r="5" fill="#e8450a" stroke="#fff" strokeWidth="1.5"/>
 )}
 
 <text x={p.x} y={p.y-8} textAnchor="middle" fill="#e8450a" fontSize="8" fontFamily="monospace" fontWeight="700">
 {p.m2.toFixed(2)}
 </text>
 
 <text x={p.x} y={PT+gH+14} textAnchor="middle" fill="#888" fontSize="7.5">{p.label}</text>
 </g>
        ))}
      </svg>
    );
  };

  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      
      <div style={{padding:"18px 20px 0",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer"}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:10,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Performance</div>
 <div style={{fontSize:17,fontWeight:800,color:"#0d0d0d",letterSpacing:-.3}}>시공 실적</div>
 </div>
 {isAdmin&&(
 <button onClick={syncToSheet} disabled={syncing}
 style={{background:"#f0f4ff",border:"1px solid #d0daf8",borderRadius:4,padding:"6px 12px",color:"#1a56cc",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
 {syncing?"⟳":"📊"} 시트 저장
 </button>
 )}
        </div>
        {syncMsg&&<div style={{fontSize:11,color:syncMsg.includes("✅")?"#0a7a50":"#cc2200",padding:"0 0 10px",textAlign:"center"}}>{syncMsg}</div>}
        <div style={{display:"flex"}}>
 {[["daily","일별"],["monthly","월별"]].map(([k,lb])=>(
 <button key={k} onClick={()=>setViewMode(k)}
 style={{flex:1,padding:"9px 4px 11px",background:"none",border:"none",borderBottom:"2px solid "+(viewMode===k?"#e8450a":"transparent"),color:viewMode===k?"#e8450a":"#aaa",fontSize:12,fontWeight:viewMode===k?700:400,cursor:"pointer"}}>
 {lb}
 </button>
 ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 0 40px"}}>
        {!instReqs.length?(
 <div style={{textAlign:"center",padding:"60px 20px",color:"#aaa"}}>
 <div style={{fontSize:40,marginBottom:12}}>📊</div>
 <div style={{fontSize:14,color:"#444",marginBottom:6}}>시공 실적 없음</div>
 <div style={{fontSize:12}}>재단요청서에서 시공완료 체크 후 표시됩니다</div>
 </div>
        ):(
 <>
 
 <div style={{padding:"20px 22px 16px",borderBottom:"1px solid #f0f0f0"}}>
 <div style={{borderTop:"2px solid #0d0d0d",paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
 {[
 {label:"총 시공면적",value:totalM2.toFixed(2),unit:"㎡",color:"#e8450a"},
 {label:"시공 건수",  value:String(totalCnt), unit:"건", color:"#0d0d0d"},
 {label:"건당 평균",  value:avgM2.toFixed(2),  unit:"㎡", color:"#0d0d0d"},
 ].map((k,i)=>(
 <div key={i} style={{textAlign:i===0?"left":i===1?"center":"right"}}>
 <div style={{fontSize:9,fontWeight:600,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{k.label}</div>
 <div style={{fontSize:26,fontWeight:900,color:k.color,fontFamily:"monospace",letterSpacing:-1,lineHeight:1}}>{k.value}</div>
 <div style={{fontSize:10,color:"#aaa",marginTop:3}}>{k.unit}</div>
 </div>
 ))}
 </div>
 </div>

 
 {chartData.length>0&&(
 <div style={{padding:"20px 22px",borderBottom:"1px solid #f0f0f0"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
 <div style={{fontSize:12,fontWeight:700,color:"#0d0d0d"}}>{viewMode==="daily"?"일별":"월별"} 시공면적 추이</div>
 <div style={{fontSize:9,color:"#aaa",letterSpacing:.5}}>단위 ㎡</div>
 </div>
 <LineChart data={chartData} maxVal={maxM2}/>
 </div>
 )}

 
 <div style={{padding:"20px 22px"}}>
 <div style={{fontSize:12,fontWeight:700,color:"#0d0d0d",marginBottom:14}}>{viewMode==="daily"?"일별":"월별"} 상세 내역</div>
 <div style={{borderTop:"2px solid #0d0d0d"}}>
 <div style={{display:"grid",gridTemplateColumns:"1fr 70px 28px",padding:"8px 0",borderBottom:"1px solid #e8e8e8"}}>
 {[viewMode==="daily"?"날짜":"월","면적 ㎡","건"].map((h,i)=>(
 <div key={h} style={{fontSize:9,fontWeight:700,color:"#aaa",letterSpacing:.8,textTransform:"uppercase",textAlign:i===0?"left":"right"}}>{h}</div>
 ))}
 </div>
 {dataList.map((d,i)=>(
 <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px 28px",padding:"11px 0",borderBottom:"1px solid #f8f8f8",alignItems:"baseline"}}>
 <div style={{fontSize:13,fontWeight:500,color:"#0d0d0d"}}>{d.label}</div>
 <div style={{fontSize:15,fontWeight:800,color:"#e8450a",fontFamily:"monospace",textAlign:"right"}}>{d.m2.toFixed(3)}</div>
 <div style={{fontSize:11,color:"#aaa",textAlign:"right"}}>{d.cnt}</div>
 </div>
 ))}
 <div style={{display:"grid",gridTemplateColumns:"1fr 70px 28px",padding:"12px 0 0",borderTop:"2px solid #0d0d0d",alignItems:"baseline",marginTop:2}}>
 <div style={{fontSize:11,fontWeight:700,color:"#0d0d0d",textTransform:"uppercase",letterSpacing:.5}}>합계</div>
 <div style={{fontSize:17,fontWeight:900,color:"#e8450a",fontFamily:"monospace",textAlign:"right"}}>{totalM2.toFixed(3)}</div>
 <div style={{fontSize:11,fontWeight:700,color:"#0d0d0d",textAlign:"right"}}>{totalCnt}</div>
 </div>
 </div>
 </div>
 </>
        )}
      </div>
    </div>
  );
}

function SpecScreen({onBack}){
  const [selCompany,setSelCompany]=useState("전체");
  const [selProcess,setSelProcess]=useState("전체");
  const [search,setSearch]=useState("");
  const companies=["전체",...Object.keys(COMPANY_COLORS)];
  const processes=["전체",...[...new Set(SPEC_DATA.map(d=>d.process))]];
  const filtered=SPEC_DATA.filter(d=>{
    if(selCompany!=="전체"&&d.company!==selCompany) return false;
    if(selProcess!=="전체"&&d.process!==selProcess) return false;
    if(search){const q=search.toLowerCase();return d.company.includes(search)||d.process.includes(search)||d.type.toLowerCase().includes(q)||d.spec.toLowerCase().includes(q);}
    return true;
  });
  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f0f0f0",position:"sticky",top:0,background:"#ffffff",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
 <button onClick={onBack} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer"}}>‹</button>
 <div style={{flex:1}}>
 <div style={{fontSize:10,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Documents</div>
 <div style={{fontSize:16,fontWeight:800,color:"#0d0d0d"}}>시방서 <span style={{fontSize:11,fontWeight:400,color:"#aaa",marginLeft:4}}>{filtered.length}건</span></div>
 </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="업체, 공정, 배관 종류 검색..."
 style={{width:"100%",height:38,background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:4,padding:"0 12px",fontSize:12,color:"#0d0d0d",boxSizing:"border-box",outline:"none"}}/>
      </div>
      <div style={{padding:"12px 20px",borderBottom:"1px solid #f0f0f0",background:"#fafafa"}}>
        <div style={{fontSize:9,fontWeight:700,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>업체</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
 {companies.map(c=>{const col=c==="전체"?"#0d0d0d":COMPANY_COLORS[c]||"#0d0d0d";const active=selCompany===c;return(
 <button key={c} onClick={()=>setSelCompany(c)} style={{background:active?col:"#ffffff",border:"1px solid "+(active?col:"#e8e8e8"),borderRadius:3,padding:"4px 12px",color:active?"#fff":col,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
 );})}
        </div>
        <div style={{fontSize:9,fontWeight:700,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>공정</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
 {processes.map(p=>{const active=selProcess===p;return(
 <button key={p} onClick={()=>setSelProcess(p)} style={{background:active?"#e8450a":"#ffffff",border:"1px solid "+(active?"#e8450a":"#e8e8e8"),borderRadius:3,padding:"4px 12px",color:active?"#fff":"#555",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>
 );})}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {!filtered.length?(<div style={{textAlign:"center",padding:"48px 20px",color:"#aaa",fontSize:12}}>검색 결과 없음</div>):
        filtered.map((d,i)=>{const col=COMPANY_COLORS[d.company]||"#0d0d0d";return(
 <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",borderBottom:"1px solid #f5f5f5"}}>
 <div style={{width:2,height:34,background:col,borderRadius:1,flexShrink:0}}/>
 <div style={{flex:1,minWidth:0}}>
 <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
 <span style={{fontSize:9,fontWeight:700,color:col,letterSpacing:.6,textTransform:"uppercase"}}>{d.company}</span>
 <span style={{fontSize:9,color:"#e8450a",fontWeight:600}}>{d.process}</span>
 {d.spec&&<span style={{fontSize:9,color:"#aaa"}}>{d.spec}</span>}
 </div>
 <div style={{fontSize:13,fontWeight:600,color:"#0d0d0d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.type}</div>
 <div style={{fontSize:9,color:"#ccc",marginTop:2}}>상세도 {d.no}</div>
 </div>
 <a href={d.url} target="_blank" rel="noreferrer" style={{background:"#e8450a",borderRadius:3,padding:"7px 14px",color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none",flexShrink:0,letterSpacing:.3}}>열기</a>
 </div>
        );})}
      </div>
    </div>
  );
}

// ── 시방서 데이터 ────────────────────────────────────────────
const COMPANY_COLORS = {"디오이엔씨":"#1a56cc","서용":"#0a7a50","마가캠":"#5b21b6","아그니":"#e8450a","아이캡":"#9f1239"};
const PROCESS_ICONS  = {"입상":"🏢","벽체":"🧱","케이블":"🔌"};
const SPEC_DATA = [
  {no:"13",company:"디오이엔씨",process:"입상",type:"금속 비보온 배관",spec:"100A 이하",url:"https://drive.google.com/file/d/1dlP5McpKtURYLmDduG76__6AuQhmL04B/view"},
  {no:"14",company:"디오이엔씨",process:"입상",type:"금속 비보온 배관",spec:"150A 이하",url:"https://drive.google.com/file/d/1EuwkB3uKjoBMpIkQZ9O1Lt2yhN0QbM1r/view"},
  {no:"18",company:"디오이엔씨",process:"입상",type:"금속 보온 배관",spec:"50A 이하",url:"https://drive.google.com/file/d/1efSifegmSGSUE1N-mvAYY8wbfGrRPHMF/view"},
  {no:"19",company:"디오이엔씨",process:"입상",type:"금속 보온 배관",spec:"100A 이하",url:"https://drive.google.com/file/d/1RV2prUx25M8UmN7nHTlSEOKbmaD5Pt_M/view"},
  {no:"20",company:"디오이엔씨",process:"입상",type:"금속 보온 배관",spec:"200A 이하",url:"https://drive.google.com/file/d/1ZUJiFPi9b4Mh5fRNKdV_j4-w45dNg51U/view"},
  {no:"21",company:"디오이엔씨",process:"입상",type:"금속 보온 배관",spec:"전규격",url:"https://drive.google.com/file/d/1i_AX379edEadt3YLV6C-wgtc6xEimCvW/view"},
  {no:"30",company:"디오이엔씨",process:"입상",type:"비금속 배관",spec:"50A 이하",url:"https://drive.google.com/file/d/1SBonx-ZFeqpyeez4unUXApHQnZhsPJ0i/view"},
  {no:"31",company:"디오이엔씨",process:"입상",type:"비금속 배관",spec:"100A 이하",url:"https://drive.google.com/file/d/120e0ny6lj0ZbPAVSdHYchcF92LuqB1OP/view"},
  {no:"32",company:"디오이엔씨",process:"입상",type:"비금속 배관",spec:"150A 이하",url:"https://drive.google.com/file/d/1QuLIraLJ816yxyGiYvPAbl3a0TSMyJg7/view"},
  {no:"33",company:"디오이엔씨",process:"입상",type:"비금속 배관",spec:"200A 이하",url:"https://drive.google.com/file/d/110t7d1Yl7y_VabycqUEeHjXnSYWqW3MF/view"},
  {no:"34",company:"디오이엔씨",process:"입상",type:"비금속 배관",spec:"250A 이하",url:"https://drive.google.com/file/d/1dA59C_WgIOwI02QE1PbZoS7mGlsPfLc2/view"},
  {no:"51",company:"디오이엔씨",process:"입상",type:"금속 덕트",spec:"자체성능",url:"https://drive.google.com/file/d/11fksKn6J3-7iDEaFURlSP2WXvIgm1WC6/view"},
  {no:"25",company:"디오이엔씨",process:"벽체",type:"비금속 배관",spec:"50A 이하",url:"https://drive.google.com/file/d/1fy-fNyOfpeXq9mJedBQCAs6dsdgFZXB0/view"},
  {no:"26",company:"디오이엔씨",process:"벽체",type:"비금속 배관",spec:"100A 이하",url:"https://drive.google.com/file/d/1_UQJfiYNVB1vhTGIP4QLK_8GhOA2YV7c/view"},
  {no:"27",company:"디오이엔씨",process:"벽체",type:"비금속 배관",spec:"150A 이하",url:"https://drive.google.com/file/d/1BuqvY4iBmAh72ba-gof5xGa72EfATGi9/view"},
  {no:"28",company:"디오이엔씨",process:"벽체",type:"비금속 배관",spec:"200A 이하",url:"https://drive.google.com/file/d/1d_sO1qDvPpopE6tCb2l6c5AVIPWDxI-A/view"},
  {no:"29",company:"디오이엔씨",process:"벽체",type:"비금속 배관",spec:"250A 이하",url:"https://drive.google.com/file/d/1v0V6MBBcDDFmk813XWa0nFAXBGC9uQ6q/view"},
  {no:"38",company:"디오이엔씨",process:"벽체",type:"금속 다발 보온 배관",spec:"",url:"https://drive.google.com/file/d/13qYHXHe-yIQIhB99NDb3ZYHfKj8kEZjU/view"},
  {no:"39",company:"디오이엔씨",process:"벽체",type:"금속 다발 비보온 배관",spec:"",url:"https://drive.google.com/file/d/1QA12pMGNvFlFoIY-Mn7Qh_bDJbEmegTl/view"},
  {no:"40",company:"디오이엔씨",process:"벽체",type:"금속 다발 보온 배관",spec:"전규격",url:"https://drive.google.com/file/d/1ywEeUDABqQwFuafgoRqL07Fa708WyrCl/view"},
  {no:"40-1",company:"디오이엔씨",process:"벽체",type:"금속다발 400A 차염",spec:"",url:"https://drive.google.com/file/d/1WKELrDTf4X1GgaXeu8EDJ44H4L_XnYKT/view"},
  {no:"41",company:"디오이엔씨",process:"벽체",type:"금속다발 200A",spec:"",url:"https://drive.google.com/file/d/1skmJOZDMf2xy7fv8qaBEv8RaRs64fxHt/view"},
  {no:"42",company:"디오이엔씨",process:"벽체",type:"금속다발 S-가스",spec:"",url:"https://drive.google.com/file/d/1tDHwqTfCJly2AroKsDe0iIuD1EKfqzLF/view"},
  {no:"47",company:"디오이엔씨",process:"벽체",type:"금속 비보온 덕트",spec:"",url:"https://drive.google.com/file/d/1x4pS8QADb2p92RSNRz-DI15m66DKtI0X/view"},
  {no:"48",company:"디오이엔씨",process:"벽체",type:"금속 보온 덕트",spec:"",url:"https://drive.google.com/file/d/1AShFYpjUC7SUBbFXSAGJRpgsPPimcImK/view"},
  {no:"49",company:"디오이엔씨",process:"벽체",type:"금속 비보온 덕트",spec:"",url:"https://drive.google.com/file/d/1geGfaebHVe_sjdrbp0MkB3LW9gupAHVb/view"},
  {no:"17",company:"서용",process:"입상",type:"금속 비보온 배관",spec:"전규격",url:"https://drive.google.com/file/d/1Lv3LEVq5ngF78TiCKFjJ5Sk2amU1Hzxr/view"},
  {no:"41,42",company:"서용",process:"입상",type:"금속 다발 배관",spec:"",url:"https://drive.google.com/file/d/112SHhENTeznQlfuGmC0HYUTmnrE1nnah/view"},
  {no:"43,44,46",company:"서용",process:"입상",type:"비금속 금속 다발 배관",spec:"",url:"https://drive.google.com/file/d/1zH00ityyh2ltvXOdD2S-a4528oWE28CS/view"},
  {no:"36,37",company:"서용",process:"벽체",type:"금속 다발 보온·비보온 배관",spec:"",url:"https://drive.google.com/file/d/1Hhq3SBk3ftQNAKvp5yIPRA6M1RGiFkAs/view"},
  {no:"45",company:"서용",process:"벽체",type:"비금속 다발 배관",spec:"",url:"https://drive.google.com/file/d/1Td1shZzq0GJPHFavzBurU0T885QNKGAV/view"},
  {no:"66",company:"마가캠",process:"케이블",type:"설비관통부 V-1404",spec:"1단",url:"https://drive.google.com/file/d/1ffEUjj9mg34vxOaQNqFPEre-k1ARa9sq/view"},
  {no:"67",company:"마가캠",process:"케이블",type:"설비관통부 V-1405",spec:"2단",url:"https://drive.google.com/file/d/1aDVbf394AQIQTSFtsMZaFLTZwRmS6aRg/view"},
  {no:"68",company:"마가캠",process:"케이블",type:"설비관통부 H-1404",spec:"1단",url:"https://drive.google.com/file/d/1gWXIfMAlKjPtgALtnX-aHo-kzp0WhXtG/view"},
  {no:"69",company:"마가캠",process:"케이블",type:"설비관통부 H-1405",spec:"2단",url:"https://drive.google.com/file/d/14djooT2XsVLGBCcKRE_xWDUy1qn29Xth/view"},
  {no:"35",company:"아그니",process:"벽체",type:"금속 다발 비보온 배관",spec:"",url:"https://drive.google.com/file/d/1OZ0pu1Zt977K89dEPTNSxqifqw4uPsb4/view"},
  {no:"50",company:"아그니",process:"입상",type:"비보온 금속 덕트",spec:"",url:"https://drive.google.com/file/d/1RTh7StP3XNWIw9eD0I20jSh0B1Jhcsdx/view"},
  {no:"54",company:"아이캡",process:"벽체",type:"제어덕트",spec:"",url:"https://drive.google.com/file/d/1Ug51AK7q36etw8WSTxsHeZ3bpmjUmaMI/view"},
  {no:"55",company:"아이캡",process:"벽체",type:"트레이 대칭-150",spec:"",url:"https://drive.google.com/file/d/11N6OOwF2EYIKJP5blHjoOU1KGRzV-4f9/view"},
  {no:"56",company:"아이캡",process:"벽체",type:"트레이 대칭-100",spec:"",url:"https://drive.google.com/file/d/1Ej8OhWgwZdr3o32fAab65c4L7Ycr54nr/view"},
  {no:"57",company:"아이캡",process:"벽체",type:"트레이 비대칭-100",spec:"",url:"https://drive.google.com/file/d/1bCkBA64ZByKhB82W5Fyfw3Z8ppaAsKYB/view"},
  {no:"58",company:"아이캡",process:"벽체",type:"다단 트레이 대칭-100",spec:"",url:"https://drive.google.com/file/d/1Q7Z2jlKFaVWKrN0FnQZyUJGAMQkpw7vg/view"},
  {no:"62",company:"아이캡",process:"벽체",type:"부스 덕트 대칭",spec:"",url:"https://drive.google.com/file/d/1jstReXsqosG8i-y0ZNd-pNIXvKOdvcTw/view"},
  {no:"63",company:"아이캡",process:"벽체",type:"레이스웨이 대칭",spec:"",url:"https://drive.google.com/file/d/1wDXYTtRHBn769NPh0P35juFhBdPPKQrz/view"},
  {no:"64",company:"아이캡",process:"벽체",type:"전선관 28C",spec:"",url:"https://drive.google.com/file/d/1VzvED3SPB8zXz69feF-XKD5dD1qm07L0/view"},
  {no:"65",company:"아이캡",process:"벽체",type:"전선관 36C",spec:"",url:"https://drive.google.com/file/d/1vrWAu1L6RkaAREg9BC5Ery43LB7bceg1/view"},
  {no:"59",company:"아이캡",process:"입상",type:"트레이-150",spec:"",url:"https://drive.google.com/file/d/10-_gVjQkPTIHgO1iST5rYtYsD0_VNdi9/view"},
  {no:"60",company:"아이캡",process:"입상",type:"트레이-100",spec:"",url:"https://drive.google.com/file/d/1eWgqIngwpixgBsM4W8sUn3Eq9-wHZvve/view"},
  {no:"61",company:"아이캡",process:"입상",type:"제어덕트",spec:"",url:"https://drive.google.com/file/d/1nNBajUJ0SpA2W3H3OYuLIasNctf2RRua/view"},
];

// ── 작업요청현황 탭 컴포넌트 ───────────────────────────────
function HistoryTab({logs,setLogs}){
  const [hFrom, setHFrom] = useState("");
  const [hTo,   setHTo]   = useState("");
  const [confirmDel,setConfirmDel]=useState(null);
  const t = todayStr();

  const filtered = logs.filter(l=>{
    if(hFrom && l.date < hFrom) return false;
    if(hTo   && l.date > hTo)   return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const grand = filtered.reduce((s,l)=>s+(l.m2||0), 0);

  const byDate = {};
  for(const l of filtered){
    if(!byDate[l.date]) byDate[l.date] = [];
    byDate[l.date].push(l);
  }
  const dates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));

  const deleteEntry=(id)=>{
    const next=logs.filter(l=>l.id!==id);
    setLogs(next); saveLogs(next); setConfirmDel(null);
  };

  return(
    <div>
      
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
 <div style={{background:"#fff",borderRadius:12,padding:24,width:"100%",maxWidth:280,textAlign:"center"}}>
 <div style={{fontSize:13,fontWeight:700,color:"#0d0d0d",marginBottom:6}}>이 항목을 삭제할까요?</div>
 <div style={{fontSize:11,color:"#aaa",marginBottom:20}}>삭제하면 복구할 수 없습니다</div>
 <div style={{display:"flex",gap:8}}>
 <button onClick={()=>setConfirmDel(null)} style={{flex:1,background:"#f5f5f5",border:"none",borderRadius:6,padding:"10px",color:"#0d0d0d",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>취소</button>
 <button onClick={()=>deleteEntry(confirmDel)} style={{flex:1,background:"#cc2200",border:"none",borderRadius:6,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>삭제</button>
 </div>
 </div>
        </div>
      )}

      
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:5,marginBottom:7}}>
 {[
 {lb:"당일",  fn:()=>{setHFrom(t);setHTo(t);}},
 {lb:"1개월", fn:()=>{const f=new Date();f.setMonth(f.getMonth()-1);setHFrom(f.toISOString().slice(0,10));setHTo(t);}},
 {lb:"3개월", fn:()=>{const f=new Date();f.setMonth(f.getMonth()-3);setHFrom(f.toISOString().slice(0,10));setHTo(t);}},
 {lb:"전체",  fn:()=>{setHFrom("");setHTo("");}},
 ].map(q=>(
 <button key={q.lb} onClick={q.fn}
 style={{flex:1,background:"#f5f5f5",border:"1px solid #e8e8e8",borderRadius:4,padding:"6px 0",color:"#444",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
 {q.lb}
 </button>
 ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
 <input type="date" value={hFrom} onChange={e=>setHFrom(e.target.value)}
 style={{flex:1,background:"#fff",border:"1px solid "+(hFrom?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"7px 8px",color:"#0d0d0d",fontSize:11,outline:"none"}}/>
 <span style={{color:"#ccc"}}>—</span>
 <input type="date" value={hTo} onChange={e=>setHTo(e.target.value)}
 style={{flex:1,background:"#fff",border:"1px solid "+(hTo?"#e8450a":"#e8e8e8"),borderRadius:4,padding:"7px 8px",color:"#0d0d0d",fontSize:11,outline:"none"}}/>
 {(hFrom||hTo)&&<button onClick={()=>{setHFrom("");setHTo("");}} style={{background:"none",border:"none",color:"#aaa",fontSize:14,cursor:"pointer",padding:"0 4px"}}>✕</button>}
        </div>
      </div>

      
      <div style={{borderTop:"2px solid #0d0d0d",paddingTop:12,display:"flex",gap:0,marginBottom:16}}>
        <div style={{flex:1}}>
 <div style={{fontSize:9,fontWeight:600,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>요청 건수</div>
 <div style={{fontSize:24,fontWeight:900,color:"#0d0d0d",fontFamily:"monospace"}}>{filtered.length}건</div>
        </div>
        <div style={{flex:1,textAlign:"right"}}>
 <div style={{fontSize:9,fontWeight:600,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>총 면적</div>
 <div style={{fontSize:24,fontWeight:900,color:"#e8450a",fontFamily:"monospace"}}>{grand.toFixed(2)}㎡</div>
        </div>
      </div>

      
      {!filtered.length?(
        <div style={{textAlign:"center",padding:"30px 0",color:"#aaa",fontSize:12}}>요청 내역이 없습니다</div>
      ):dates.map(date=>(
        <div key={date} style={{marginBottom:12}}>
 <div style={{fontSize:10,fontWeight:700,color:"#888",letterSpacing:.5,marginBottom:6,display:"flex",justifyContent:"space-between"}}>
 <span>{date.replace(/-/g,".")}</span>
 <span style={{fontFamily:"monospace",color:"#e8450a"}}>{byDate[date].reduce((s,l)=>s+(l.m2||0),0).toFixed(2)}㎡</span>
 </div>
 {byDate[date].map((l,li)=>(
 <div key={li} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fafafa",borderRadius:6,border:"1px solid #f0f0f0",marginBottom:5}}>
 <div style={{width:3,height:36,background:"#e8450a",borderRadius:2,flexShrink:0}}/>
 <div style={{flex:1,minWidth:0}}>
 <div style={{fontSize:12,fontWeight:700,color:"#0d0d0d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.site||l.note||"미입력"}</div>
 <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{(l.at||"").replace("T"," ").slice(0,16)}</div>
 </div>
 <div style={{fontSize:13,fontWeight:700,color:"#1a56cc",fontFamily:"monospace",flexShrink:0}}>{(l.m2||0).toFixed(3)}㎡</div>
 <button onClick={()=>setConfirmDel(l.id)}
 style={{background:"none",border:"none",color:"#ddd",fontSize:16,cursor:"pointer",padding:"0 2px",flexShrink:0,fontFamily:"inherit"}}>🗑</button>
 </div>
 ))}
        </div>
      ))}
    </div>
  );
}

function ComingSoon({title,icon,onBack}){
  return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"Noto Sans KR,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1d2029"}}>
        <button onClick={onBack} style={{background:"#ffffff",border:"1px solid #2d3245",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d0d",fontSize:16}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#0d0d0d"}}>{icon} {title}</span>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"40px 24px"}}>
        <div style={{fontSize:56}}>{icon}</div>
        <div style={{fontSize:20,fontWeight:900,color:"#0d0d0d"}}>{title}</div>
        <div style={{background:"#ffffff",border:"1px solid #f56e1a44",borderRadius:12,padding:"14px 24px",textAlign:"center"}}>
 <div style={{fontSize:13,color:"#f56e1a",fontWeight:700,marginBottom:4}}>🚧 준비 중입니다</div>
 <div style={{fontSize:12,color:"#888888"}}>곧 업데이트될 예정입니다</div>
        </div>
        <button onClick={onBack} style={{marginTop:8,background:"linear-gradient(135deg,#f56e1a,#ff9a3c)",border:"none",borderRadius:10,padding:"11px 32px",color:"#fff",fontSize:14,fontWeight:700}}>← 홈으로</button>
      </div>
    </div>
  );
}

// ── 로그인 화면 ──────────────────────────────────────────
function LoginScreen({onLogin}){
  const [pw,setPw]=useState(""); const [err,setErr]=useState(false);
  const tryLogin=()=>{
    if(pw===ADMIN_CODE){onLogin("admin");}
    else if(pw===USER_CODE){onLogin("user");}
    else{setErr(true);setTimeout(()=>setErr(false),1500);}
  };
  return(
    <div style={{minHeight:"100vh",background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"Noto Sans KR,sans-serif"}}>
      <div style={{width:"100%",maxWidth:300}}>
        <div style={{marginBottom:48,textAlign:"center"}}>
 <div style={{fontSize:10,fontWeight:600,color:"#e8450a",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>JAEAM INDUSTRY</div>
 <div style={{fontSize:32,fontWeight:900,color:"#0d0d0d",letterSpacing:-.8}}>재암산업</div>
 <div style={{width:32,height:2,background:"#e8450a",margin:"14px auto 0"}}/>
        </div>
        <div style={{marginBottom:8}}>
 <div style={{fontSize:9,fontWeight:600,color:"#888",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>접속 코드</div>
 <input value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryLogin()}
 type="password" placeholder="코드 입력"
 style={{width:"100%",height:48,border:"none",borderBottom:`2px solid ${err?"#cc2200":"#e8e8e8"}`,padding:"0 4px",fontSize:16,color:"#0d0d0d",background:"transparent",fontFamily:"inherit",letterSpacing:3,textAlign:"center",transition:"border-color .15s",outline:"none",boxSizing:"border-box"}}
 autoFocus/>
        </div>
        {err&&<div style={{fontSize:11,color:"#cc2200",textAlign:"center",marginBottom:12}}>잘못된 접속 코드입니다</div>}
        <button onClick={tryLogin} style={{width:"100%",height:48,background:"#e8450a",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:.5,marginTop:16,fontFamily:"inherit",borderRadius:4}}>접속</button>
        <div style={{marginTop:24,textAlign:"center",fontSize:10,color:"#ccc"}}>허가된 사용자만 이용 가능합니다</div>
      </div>
    </div>
  );
}

function Splash({onDone}){
  useEffect(()=>{const t=setTimeout(onDone,800);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"Noto Sans KR,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:600,color:"#e8450a",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>JAEAM INDUSTRY</div>
        <div style={{fontSize:36,fontWeight:900,color:"#0d0d0d",letterSpacing:-.8}}>재암산업</div>
        <div style={{width:32,height:2,background:"#e8450a",margin:"16px auto 20px"}}/>
        <div style={{fontSize:11,color:"#aaa"}}>방화마감 통합 관리 시스템</div>
      </div>
    </div>
  );
}

export default function App(){
  const [authed,setAuthed]=useState(()=>{ try{ return localStorage.getItem(AUTH_KEY)==="1"; }catch{ return false; } });
  const isAdmin = (localStorage.getItem(ROLE_KEY)||"")==="admin";
  const [homeTab,setHomeTab]=useState("home");
  const [apiUrl,setApiUrl]=useState(()=>{ try{return localStorage.getItem(API_KEY)||"";}catch{return "";} });
  const [splash,   setSplash]   = useState(true);
  const [mainTab,  setMainTab]  = useState("board");
  const [logs,     setLogs]     = useState([]);
  const [specOpen, setSpecOpen] = useState(false);
  const [selDate,  setSelDate]  = useState(null);
  useEffect(()=>setLogs(loadLogs()),[]);

  // 방화보드 state
  const [BW, setBW] = useState("");
  const [BH, setBH] = useState("");
  const [bItems,   setBItems]   = useState([]);
  const [bResult,  setBResult]  = useState(null);
  const [bErrs,    setBErrs]    = useState([]);
  const [bErrIds,  setBErrIds]  = useState(new Set());
  const [bTab,     setBTab]     = useState("input");
  const [bDrawTab, setBDrawTab] = useState(0);
  const [bWarns,   setBWarns]   = useState([]);
  const [saved,    setSaved]    = useState(false);
  const [wDate,    setWDate]    = useState(todayStr());
  const [wNote,    setWNote]    = useState("");
  const [wSite,    setWSite]    = useState("");
  const [wSpecial, setWSpecial] = useState("");
  const [hFrom,    setHFrom]    = useState("");
  const [hTo,      setHTo]      = useState("");
  const [reqSaved, setReqSaved] = useState(false);
  const [reqs,     setReqs]     = useState([]);
  const [installed,setInstalled]= useState(()=>{ try{ return JSON.parse(localStorage.getItem("fw_installed")||"{}"); }catch{ return {}; } });
  const [synced,   setSynced]   = useState(false);

  // 앱 시작 시 구글 시트에서 데이터 로드
  // 앱 시작 시 자동 연동 (직원들은 설정 불필요)
  useEffect(()=>{
    // 로컬 데이터 먼저 표시
    setReqs(loadReqs());
    // PROXY를 통해 구글 시트 자동 로드 (apiUrl 설정 여부 무관)
    const autoLoad = async () => {
      try {
        // 재단요청 데이터 로드
        const r1 = await apiGet("", {action:"getReqs"});
        if(r1.ok && r1.reqs && r1.reqs.length > 0){
          setReqs(r1.reqs); saveReqs(r1.reqs);
        }
        // 체크/설치 상태 로드
        const r2 = await apiGet("", {action:"getChecks"});
        if(r2.ok){
          if(r2.checks) try{ localStorage.setItem("fw_checks", JSON.stringify(r2.checks)); }catch{}
          if(r2.installed){ setInstalled(r2.installed); try{ localStorage.setItem("fw_installed", JSON.stringify(r2.installed)); }catch{} }
        }
        // 작업로그 로드
        const r3 = await apiGet("", {action:"getLogs"});
        if(r3.ok && r3.logs) try{ localStorage.setItem("jaeam_logs", JSON.stringify(r3.logs)); }catch{}
        // 자동 연동 성공 시 apiUrl 설정
        if(!apiUrl){ setApiUrl("auto"); try{ localStorage.setItem(API_KEY,"auto"); }catch{} }
        setSynced(true);
      } catch(e) {
        // 오프라인이거나 연동 미설정 → 로컬 데이터 사용
      }
    };
    autoLoad();
  },[]);


  // 차열재 state
  const [iItems, setIItems] = useState([]);
  const [iResult,setIResult]= useState(null);
  const [iErrs,  setIErrs]  = useState({});
  const [iTab,   setITab]   = useState("input");

  const bw = parseFloat(BW)||1220;
  const bh = parseFloat(BH)||2440;

  // 방화보드 계산
  const calcBoard = () => {
    const errs=[], warns=[], pieces=[], groups=[];
    const badIds=new Set();
    for(let i=0;i<bItems.length;i++){
      const item=bItems[i];
      if(item.type==="single"){
        const res=calcSingle2(item,bw,bh);
        if(!res.ok){ errs.push({idx:i,label:item.label,msg:res.msg}); badIds.add(item.id); }
        else { pieces.push(...res.pieces); warns.push(...res.warnings); }
      } else {
        const res=calcGroup2(item,bw,bh);
        if(!res.ok){ errs.push({idx:i,label:item.label,msg:res.msg}); badIds.add(item.id); }
        else {
 groups.push({label:item.label||"다배관",...res});
 if(res.isSplit){ warns.push(`[${item.label||"다배관"}] ${res.splitMsg}`); res.panels.forEach(p=>pieces.push({...p,shape:"group_split",pipes:res.pipes,bw:res.bw,bh:res.bh,mt:res.mt,mb:res.mb})); }
 else pieces.push({w:res.bw,h:res.bh,shape:"group",label:item.label||"다배관",pipes:res.pipes,bw:res.bw,bh:res.bh,mt:res.mt,mb:res.mb});
        }
      }
    }
    if(errs.length){ setBErrs(errs); setBErrIds(badIds); setBTab("result"); return; }
    if(!pieces.length){ setBErrs([{idx:0,label:"",msg:"항목을 입력해주세요."}]); setBTab("result"); return; }
    const {rows,totalH}=packPieces(pieces,bw);
    const boards=Math.ceil(totalH/bh);
    const area=pieces.reduce((s,p)=>s+p.w*p.h,0);
    const eff=((area/(boards*bw*bh))*100).toFixed(1);
    const m2=area/1e6;
    const diagMap={};
    for(const p of pieces){
      if(p.shape==="group"||p.shape==="group_split") continue;
      if(p.faceLabel){
        const base=p.label.replace(/\[.*?\]/g,"").trim();
        const k=`face-${base}`;
        if(!diagMap[k]){
 // 첫 피스로 초기화 - 나중에 가로/세로면 정보 채움
 diagMap[k]={label:base,count:0,isFaceGroup:true,
 horzW:null,horzH:null,vertW:null,vertH:null};
        }
        diagMap[k].count++;
        if(p.faceLabel&&p.faceLabel.startsWith("가로")){
 diagMap[k].horzW=p.w; diagMap[k].horzH=p.h;
        } else {
 diagMap[k].vertW=p.w; diagMap[k].vertH=p.h;
        }
      } else {
        const k=`${p.shape}-${p.w}-${p.h}-${p.label}`;
        if(!diagMap[k]) diagMap[k]={...p,count:0};
        diagMap[k].count++;
      }
    }
    const diagrams=[...Object.values(diagMap),...groups.map(g=>({...g,isGroup:true,count:1}))];
    setBErrs([]); setBErrIds(new Set()); setBWarns(warns);
    setBResult({pieces,rows,totalH,boards,eff,m2,groups,diagrams,bw,bh});
    setBDrawTab(0); setBTab("result");
  };

  const saveBoard = () => {
    if(!bResult) return;
    const entry={id:Date.now(),date:wDate,at:new Date().toISOString(),site:wSite||wNote||"",note:wNote,type:"board",boards:bResult.boards,m2:bResult.m2,eff:bResult.eff};
    const u=[entry,...logs]; setLogs(u); saveLogs(u);
    setSaved(true); setTimeout(()=>setSaved(false),2500);
  };

  const saveRequest = () => {
    if(!bResult) return;
    // 재단 피스 목록 수집
    const seen={};
    for(const p of bResult.pieces){
      const k=p.faceLabel
        ? p.label.replace(/\[.*?\]/g,"").trim()+`[${p.faceLabel}]`
        : `${p.label}|${Math.round(p.w)}|${Math.round(p.h)}`;
      if(!seen[k]) seen[k]={label:p.faceLabel?p.label.replace(/\[.*?\]/g,"").trim():p.label, w:Math.round(p.w), h:Math.round(p.h), faceLabel:p.faceLabel||null, qty:0};
      seen[k].qty++;
    }
    const cuts=Object.values(seen);
    const req={
      id:Date.now(),
      date:wDate,
      at:new Date().toISOString(),
      site:wSite||wNote||"현장명 없음",
      note:wNote,
      special:wSpecial,
      boards:bResult.boards,
      m2:bResult.m2,
      eff:bResult.eff,
      cuts,
      diagrams:(bResult.diagrams||[]).map(d=>({label:d.label||"",isGroup:!!d.isGroup,isFaceGroup:!!d.isFaceGroup,w:d.w||0,h:d.h||0,bw:d.bw||0,bh:d.bh||0,horzW:d.horzW||0,horzH:d.horzH||0,vertW:d.vertW||0,vertH:d.vertH||0,pipes:(d.pipes||[]).map(p=>({d:p.d,bx:Math.round(p.bx||0),by:Math.round(p.by||0),cx:p.cx,cy:p.cy}))})),
    };
    const u=[req,...reqs]; setReqs(u); saveReqs(u); syncReqsToSheet(u, apiUrl);
    setReqSaved(true);
    setTimeout(()=>{
      setReqSaved(false);
      setBItems([mkDuct2()]);
      setBResult(null);
      setBErrs([]);
      setWDate(todayStr());
      setWNote(""); setWSite(""); setWSpecial("");
      setBTab("input");
    },1500);
  };

  // 차열재 계산
  const calcInsul = () => {
    const e={};
    for(const it of iItems){
      if(it.kind==="pipe"&&!it.specRange) e[it.id]="배관 규격을 선택해주세요.";
      if(it.kind==="duct"){
        if(it.shape==="circle"&&!it.diam) e[it.id]="직경을 입력해주세요.";
        if(it.shape==="rect"&&(!it.dw||!it.dh)) e[it.id]="가로/세로를 입력해주세요.";
        if(!it.insW) e[it.id]=(e[it.id]||"")+"차열재 폭을 입력해주세요.";
      }
    }
    setIErrs(e);
    if(Object.keys(e).length) return;
    const rows=iItems.map(it=>{
      const qty=parseInt(it.qty)||1;
      if(it.kind==="pipe"){
        const row=SPEC[it.specType]?.find(r=>r.range===it.specRange);
        if(!row||!row.steps.length) return {...it,qty,cuts:[],noWork:!row?.steps.length};
        const od=parseFloat(it.customOD)||getNomOD(row.A===9999?151:row.A);
        const t=parseFloat(it.thickness)||25;
        const cuts=row.steps.map((s,i)=>{
 const layerOD=od+i*t*2;
 const width=Math.round(Math.PI*layerOD);
 return {seq:i+1,label:s.t,width,height:s.mm,sheets:qty,layerOD};
        });
        const perim=cuts[0]?.width||Math.round(Math.PI*od);
        return {...it,qty,od,t,perim,cuts};
      } else {
        const insW=parseFloat(it.insW)||0;
        if(it.shape==="circle"){
 const d=parseFloat(it.diam)||0;
 const pr=Math.PI*d;
 const perim=Math.round(pr);
 const turns=pr>0?insW/pr:0;
 const cuts=[{seq:1,label:"1겹",width:perim,height:insW,sheets:qty}];
 return {...it,qty,perim,turns,cuts,ductType:"circle"};
        } else {
 const dw=parseFloat(it.dw)||0, dh=parseFloat(it.dh)||0;
 if(!dw||!dh||!insW) return {...it,qty,cuts:[],ductType:"rect"};
 const cuts=[
 {seq:1,label:"가로면(상/하)",width:dw,height:insW,sheets:2*qty,note:"상판·하판"},
 {seq:2,label:"세로면(좌/우)",width:dh+insW*2,height:insW,sheets:2*qty,note:`세로${dh}+폭${insW}×2`},
 ];
 return {...it,qty,cuts,ductType:"rect",dw,dh};
        }
      }
    });
    setIResult(rows); setITab("result");
  };

  const scale = bResult ? Math.min(280/bResult.bw, 480/Math.max(bResult.totalH,bResult.bh)) : 1;

  // 앱 숨김 여부
  const hidden = splash;

  if(!authed) return <LoginScreen onLogin={(role)=>{localStorage.setItem(AUTH_KEY,"1");localStorage.setItem(ROLE_KEY,role);localStorage.setItem(VER_KEY,APP_VERSION);setAuthed(true);}}/>;
  if(homeTab==="home") return <HomeScreen onMenu={setHomeTab} isAdmin={isAdmin} onLogout={()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem(ROLE_KEY);localStorage.removeItem(VER_KEY);setAuthed(false);}}/>;
  if(homeTab==="notice")   return <NoticeScreen   apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="connect")   return <ConnectScreen  apiUrl={apiUrl} setApiUrl={(u)=>{setApiUrl(u);localStorage.setItem(API_KEY,u);}} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="spec")     return <SpecScreen onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="schedule") return <ScheduleScreen apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="plan")     return <PlanScreen     apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="request")  return <RequestScreen reqs={reqs} setReqs={setReqs} installed={installed} setInstalled={setInstalled} apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="photo")    return <PhotoScreen    apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="perf")     return <PerfScreen     reqs={reqs} installed={installed} onBack={()=>setHomeTab("home")} apiUrl={apiUrl} isAdmin={isAdmin}/>;

  return (
    <div style={{background:"#ffffff",minHeight:"100vh"}}>
      {splash && <Splash onDone={()=>setSplash(false)}/>}
      <div style={{visibility:hidden?"hidden":"visible",opacity:hidden?0:1,transition:"opacity 0.3s ease 0.1s",minHeight:"100vh",color:"#0d0d0d",fontFamily:"Noto Sans KR,sans-serif",padding:"14px 12px 60px"}}>
        
        <div style={{maxWidth:740,margin:"0 auto"}}>

 
 
 <div style={{padding:"14px 0 14px",borderBottom:"1px solid #f0f0f0",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
 <button onClick={()=>setHomeTab("home")} style={{background:"none",border:"1px solid #e8e8e8",borderRadius:4,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontSize:16,cursor:"pointer",flexShrink:0}}>‹</button>
 <div>
 <div style={{fontSize:9,fontWeight:600,color:"#e8450a",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Calculator</div>
 <div style={{fontSize:16,fontWeight:900,color:"#0d0d0d",letterSpacing:-.4}}>재단계산기</div>
 </div>
 </div>

 
 <div style={{display:"flex",gap:6,marginBottom:20,background:"#f8f8f8",borderRadius:14,padding:5,border:`1px solid ${C.line}`}}>
 {[["board","🔥","방화보드"],["insul","🔥","차열재"],["history","📋","작업요청현황"]].map(([k,ic,lb])=>{
 const active=mainTab===k;
 return (
 <button key={k} onClick={()=>setMainTab(k)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:active?`linear-gradient(135deg,${C.acc},${C.acc2}cc)`:C.sur,border:`1px solid ${active?C.acc:"transparent"}`,borderRadius:10,padding:"10px 6px",color:active?"#fff":C.mut,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s",boxShadow:active?`0 3px 14px ${C.acc}44`:"none"}}>
 <span style={{fontSize:16}}>{ic}</span>
 <span>{lb}</span>
 </button>
 );
 })}
 </div>

 
 {mainTab==="board" && (
 <div>
 
 <div style={{background:"#ffffff",border:`1px solid ${C.line}`,borderRadius:14,padding:"14px",marginBottom:12}}>
 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
 <div style={{width:3,height:16,background:"#e8450a",borderRadius:2}}/>
 <span style={{fontSize:13,fontWeight:800,color:"#0d0d0d"}}>방화보드 규격</span>
 <div style={{marginLeft:"auto",display:"flex",gap:5}}>
 {[["915","600"],["1220","2440"],["900","1800"]].map(([w,h])=>(
 <button key={w} onClick={()=>{setBW(w);setBH(h);}} style={{background:BW===w&&BH===h?C.acc:"transparent",border:`1px solid ${BW===w&&BH===h?C.acc:C.line}`,borderRadius:6,padding:"3px 8px",color:BW===w&&BH===h?"#fff":C.mut,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>{w}×{h}</button>
 ))}
 </div>
 </div>
 <div style={{display:"flex",gap:10,alignItems:"center"}}>
 <div style={{flex:1}}><Lbl c="가로 (mm)"/><input style={SI} type="number" value={BW} onChange={e=>setBW(e.target.value)}/></div>
 <div style={{color:"#888888",fontSize:18,paddingTop:16}}>×</div>
 <div style={{flex:1}}><Lbl c="세로 (mm)"/><input style={SI} type="number" value={BH} onChange={e=>setBH(e.target.value)}/></div>
 </div>
 </div>

 
 <div style={{display:"flex",gap:5,marginBottom:14}}>
 {[["input","입력"],["result","결과"]].map(([k,lb])=>(
 <button key={k} onClick={()=>setBTab(k)} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:`1px solid ${bTab===k?C.acc:C.line}`,background:bTab===k?C.acc:C.sur,color:bTab===k?"#fff":C.mut,transition:"all .15s"}}>
 {lb}{k==="result"&&bErrs.length>0&&<span style={{marginLeft:5,background:C.err,color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:10}}>오류</span>}
 </button>
 ))}
 </div>

 
 {bTab==="input" && (
 <div>
 <div style={{display:"flex",gap:8,marginBottom:12}}>
 <button onClick={()=>setBItems(p=>[...p,mkDuct2()])} style={{flex:1,background:"#e8450a11",border:`1px solid ${C.acc}44`,borderRadius:12,padding:"13px",color:"#e8450a",cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 덕트</button>
 <button onClick={()=>setBItems(p=>[...p,mkGroup()])}  style={{flex:1,background:`${C.blu}11`,border:`1px solid ${C.blu}44`,borderRadius:12,padding:"13px",color:"#1a56cc",cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 배관</button>
 </div>
 {bItems.length===0&&(
 <div style={{textAlign:"center",padding:"36px 20px",color:"#888888",background:"#f8f8f8",borderRadius:12,marginBottom:10,border:`1px dashed ${C.line}`}}>
 <div style={{fontSize:28,marginBottom:8}}>👆</div>
 <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:"#0d0d0d"}}>덕트 또는 배관을 추가해주세요</div>
 <div style={{fontSize:11}}>위 버튼을 눌러 항목을 추가하세요</div>
 </div>
 )}
 {bItems.map((item,idx)=>{
 const hasErr=bErrIds.has(item.id);
 const errMsg=bErrs.find(e=>e.idx===idx)?.msg;
 const updB = (patch) => setBItems(p=>p.map(it=>it.id===item.id?{...it,...patch}:it));
 const updP = (pid,f,v) => setBItems(p=>p.map(it=>it.id!==item.id?it:{...it,pipes:it.pipes.map(pp=>pp.id===pid?{...pp,[f]:v}:pp)}));
 return (
 <div key={item.id} style={{background:"#ffffff",border:`1px solid ${hasErr?C.err:item.type==="group"?C.blu+"44":C.bdr}`,borderRadius:14,padding:"14px",marginBottom:10}}>
 {hasErr&&<div style={{background:C.err+"20",borderRadius:7,padding:"6px 10px",marginBottom:8,fontSize:12,color:"#cc2200",borderLeft:`3px solid ${C.err}`}}>❌ {errMsg}</div>}
 <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
 <span style={{background:hasErr?C.err:item.type==="group"?C.blu:C.acc,color:"#fff",borderRadius:5,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{idx+1}</span>
 <span style={{fontSize:11,color:item.type==="group"?C.blu:C.acc,fontWeight:700,background:item.type==="group"?C.blu+"22":C.acc+"22",padding:"2px 6px",borderRadius:4}}>{item.type==="group"?"배관":"덕트"}</span>
 
 {bItems.length>1&&<button onClick={()=>setBItems(p=>p.filter(it=>it.id!==item.id))} style={{background:"transparent",border:"1px solid #e8e8e8",borderRadius:5,width:24,height:24,cursor:"pointer",color:"#888888",fontSize:13}}>×</button>}
 </div>
 {item.type==="single"&&(
 <div>
 <div style={{display:"flex",gap:7,marginBottom:7}}>
 <div style={{flex:1}}><Lbl c="가로(mm)"/><input style={SI} type="number" value={item.w} onChange={e=>updB({w:e.target.value})}/></div>
 <div style={{flex:1}}><Lbl c="세로(mm)"/><input style={SI} type="number" value={item.h} onChange={e=>updB({h:e.target.value})}/></div>
 <div style={{flex:1}}><Lbl c="폭(mm, 선택)"/><input style={SI} type="number" value={item.fold??""} onChange={e=>updB({fold:e.target.value})}/></div>
 <div style={{width:58}}><Lbl c="수량"/><input style={SI} type="number" value={item.qty} onChange={e=>updB({qty:e.target.value})}/></div>
 </div>
 {item.fold&&parseFloat(item.fold)>0&&item.w&&item.h&&(()=>{
 const dW=parseFloat(item.w),dH=parseFloat(item.h),fold=parseFloat(item.fold);
 // 가로면(상/하): 덕트가로(dW) × 폭(fold)
 // 세로면(좌/우): (덕트세로(dH)+폭(fold)×2) × 폭(fold)
 const vertW=dH+fold*2;
 const maxW=Math.max(dW,vertW);
 const sc=Math.min(120/maxW,90/dH,0.85);
 const bw=dW*sc,bh=dH*sc,fw=fold*sc;
 const PAD=fw+18; const ox=PAD,oy=fw+14;
 const svgW=bw+fw*2+PAD+14,svgH=bh+fw*2+36;
 const cD="#2e3d50",cTB=C.acc+"dd",cLR=C.acc+"99";
 return (
 <div style={{background:"#f8f8f8",border:`1px solid ${C.acc}33`,borderRadius:8,padding:"10px 12px"}}>
 <div style={{fontSize:11,fontWeight:700,color:"#e8450a",marginBottom:8}}>📐 설치 단면 미리보기</div>
 <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
 <svg width={svgW} height={svgH} style={{flexShrink:0}}>
 
 <rect x={ox} y={oy} width={bw} height={bh} fill={cD} stroke="#4a5e72" strokeWidth="1.2"/>
 
 <rect x={ox} y={oy-fw} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5"/>
 
 <rect x={ox} y={oy+bh} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5"/>
 
 <rect x={ox-fw} y={oy-fw} width={fw} height={bh+fw*2} fill={cLR} stroke={C.acc} strokeWidth="1.5"/>
 
 <rect x={ox+bw} y={oy-fw} width={fw} height={bh+fw*2} fill={cLR} stroke={C.acc} strokeWidth="1.5"/>
 
 <line x1={ox+bw/2} y1={oy} x2={ox+bw/2} y2={oy+bh} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="4,3"/>
 <line x1={ox} y1={oy+bh/2} x2={ox+bw} y2={oy+bh/2} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="4,3"/>
 
 <line x1={ox-fw} y1={svgH-6} x2={ox+bw+fw} y2={svgH-6} stroke={C.acc2} strokeWidth=".9"/>
 <line x1={ox-fw} y1={svgH-10} x2={ox-fw} y2={svgH-2} stroke={C.acc2} strokeWidth=".9"/>
 <line x1={ox+bw+fw} y1={svgH-10} x2={ox+bw+fw} y2={svgH-2} stroke={C.acc2} strokeWidth=".9"/>
 <text x={ox+bw/2} y={svgH} textAnchor="middle" fill={C.acc2} fontSize="8" fontFamily="monospace">{dW+fold*2}mm</text>
 
 <line x1={ox-fw-12} y1={oy-fw} x2={ox-fw-12} y2={oy+bh+fw} stroke={C.acc2} strokeWidth=".9"/>
 <line x1={ox-fw-16} y1={oy-fw} x2={ox-fw-8} y2={oy-fw} stroke={C.acc2} strokeWidth=".9"/>
 <line x1={ox-fw-16} y1={oy+bh+fw} x2={ox-fw-8} y2={oy+bh+fw} stroke={C.acc2} strokeWidth=".9"/>
 <text x={ox-fw-14} y={oy+bh/2+4} textAnchor="middle" fill={C.acc2} fontSize="8" fontFamily="monospace" transform={`rotate(-90,${ox-fw-14},${oy+bh/2})`}>{dH+fold*2}mm</text>
 </svg>
 <div style={{fontSize:11,lineHeight:2.1,color:"#888888"}}>
 <div style={{marginBottom:6}}>
 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
 <span style={{width:12,height:10,background:cTB,border:`1px solid ${C.acc}`,borderRadius:1,display:"inline-block"}}/>
 <span style={{fontWeight:700,color:"#0d0d0d"}}>가로면 (상/하)</span>
 </div>
 <span style={{color:C.acc2,fontWeight:700,fontFamily:"monospace"}}>{dW}×{fold}mm</span>
 <span style={{color:"#e8450a",marginLeft:6}}>×2장</span>
 </div>
 <div>
 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
 <span style={{width:12,height:10,background:cLR,border:`1px solid ${C.acc}`,borderRadius:1,display:"inline-block"}}/>
 <span style={{fontWeight:700,color:"#0d0d0d"}}>세로면 (좌/우)</span>
 </div>
 <span style={{color:C.acc2,fontWeight:700,fontFamily:"monospace"}}>{vertW}×{fold}mm</span>
 <span style={{color:"#e8450a",marginLeft:6}}>×2장</span>
 <div style={{fontSize:10,color:"#888888"}}>({dH}+{fold}×2={vertW})</div>
 </div>
 </div>
 </div>
 </div>
 );
 })()}
 </div>
 )}
 {item.type==="group"&&(
 <div>
 <div style={{display:"flex",gap:5,marginBottom:9,background:"#f8f8f8",borderRadius:8,padding:3}}>
 {[["field","📏 현장실측"],["pitch","🔢 피치배열"]].map(([k,lb])=>(
 <button key={k} onClick={()=>updB({mode:k})} style={{flex:1,padding:"5px 0",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:item.mode===k?C.blu:"transparent",color:item.mode===k?"#fff":C.mut}}>{lb}</button>
 ))}
 </div>
 <div style={{marginBottom:10}}>
 <div style={{fontSize:11,fontWeight:700,color:C.acc2,marginBottom:7}}>보드 여유 (mm)</div>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
 <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"center"}}><div style={{width:100}}><Lbl c="⬆ 상단"/><input style={SI} type="number" value={item.mT??""} onChange={e=>updB({mT:e.target.value})}/></div></div>
 <div><Lbl c="⬅ 좌측"/><input style={SI} type="number" value={item.mL??""} onChange={e=>updB({mL:e.target.value})}/></div>
 <div><Lbl c="➡ 우측"/><input style={SI} type="number" value={item.mR??""} onChange={e=>updB({mR:e.target.value})}/></div>
 <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"center"}}><div style={{width:100}}><Lbl c="⬇ 하단"/><input style={SI} type="number" value={item.mB??""} onChange={e=>updB({mB:e.target.value})}/></div></div>
 </div>
 </div>
 {item.mode==="field"&&(
 <div>
 <div style={{fontSize:11,color:"#888888",marginBottom:7,background:"#f8f8f8",borderRadius:6,padding:"6px 9px"}}>직경·간격·하단~배관끝(mm) 입력</div>
 {item.pipes.map((pp,pi)=>(
 <div key={pp.id} style={{display:"flex",gap:6,marginBottom:6,alignItems:"flex-end"}}>
 <div style={{width:12,height:12,borderRadius:"50%",background:C.pipe[pi%C.pipe.length],flexShrink:0,marginBottom:10}}/>
 <div style={{flex:1}}><Lbl c="직경"/><input style={SI} type="number" value={pp.d} onChange={e=>updP(pp.id,"d",e.target.value)}/></div>
 <div style={{flex:1.2}}><Lbl c={pi===0?"좌끝~배관외면":"앞배관~배관외면"}/><input style={SI} type="number" value={pp.gap} onChange={e=>updP(pp.id,"gap",e.target.value)}/></div>
 <div style={{flex:1}}><Lbl c="하단~배관끝"/><input style={SI} type="number" value={pp.fromBottom} onChange={e=>updP(pp.id,"fromBottom",e.target.value)}/></div>
 {item.pipes.length>1&&<button onClick={()=>setBItems(p=>p.map(it=>it.id!==item.id?it:{...it,pipes:it.pipes.filter(x=>x.id!==pp.id)}))} style={{background:"transparent",border:"1px solid #e8e8e8",borderRadius:5,width:24,height:24,cursor:"pointer",color:"#888888",fontSize:12,flexShrink:0}}>×</button>}
 </div>
 ))}
 <button onClick={()=>setBItems(p=>p.map(it=>it.id===item.id?{...it,pipes:[...it.pipes,mkPipe2()]}:it))} style={{background:"transparent",border:`1px dashed ${C.blu}55`,borderRadius:6,padding:"5px 10px",color:"#1a56cc",cursor:"pointer",fontSize:11,width:"100%",marginTop:2}}>+ 배관 추가</button>
 </div>
 )}
 {item.mode==="pitch"&&(
 <div>
 <div style={{display:"flex",gap:7,marginBottom:7}}>
 <div style={{flex:1}}><Lbl c="직경"/><input style={SI} type="number" value={item.pipes[0]?.d??""} onChange={e=>setBItems(p=>p.map(it=>it.id!==item.id?it:{...it,pipes:it.pipes.map((pp,i)=>i===0?{...pp,d:e.target.value}:pp)}))}/></div>
 <div style={{flex:1}}><Lbl c="X피치"/><input style={SI} type="number" value={item.pX??""} onChange={e=>updB({pX:e.target.value})}/></div>
 <div style={{flex:1}}><Lbl c="Y피치"/><input style={SI} type="number" value={item.pY??""} onChange={e=>updB({pY:e.target.value})}/></div>
 </div>
 <div style={{display:"flex",gap:7}}>
 <div style={{flex:1}}><Lbl c="열 수"/><input style={SI} type="number" value={item.cols??""} onChange={e=>updB({cols:e.target.value})}/></div>
 <div style={{flex:1}}><Lbl c="행 수"/><input style={SI} type="number" value={item.rows??""} onChange={e=>updB({rows:e.target.value})}/></div>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
 })}
 <button onClick={calcBoard} style={{width:"100%",background:`linear-gradient(135deg,${C.acc},${C.acc2})`,border:"none",borderRadius:12,padding:"15px 0",color:"#fff",cursor:"pointer",fontSize:15,fontWeight:900,boxShadow:`0 6px 24px ${C.acc}55`,marginTop:8,letterSpacing:-.3}}>재단 계산하기</button>
 </div>
 )}

 
 {bTab==="result" && (
 <div>
 {bErrs.length>0&&(
 <div style={{background:C.err+"18",border:`1.5px solid ${C.err}55`,borderRadius:12,padding:"13px",marginBottom:10}}>
 <div style={{fontWeight:900,color:"#cc2200",fontSize:14,marginBottom:8}}>🚫 계산 오류</div>
 {bErrs.map((e,i)=><div key={i} style={{fontSize:12,color:"#cc2200",marginBottom:4}}>❌ 항목{e.idx+1}{e.label&&` [${e.label}]`} — {e.msg}</div>)}
 <button onClick={()=>setBTab("input")} style={{marginTop:8,width:"100%",background:"transparent",border:`1.5px solid ${C.acc}`,borderRadius:8,padding:"9px",color:"#e8450a",cursor:"pointer",fontSize:13,fontWeight:700}}>← 수정하러 가기</button>
 </div>
 )}
 {bWarns.length>0&&<div style={{background:C.acc2+"20",border:`1px solid ${C.acc2}44`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>{bWarns.map((w,i)=><div key={i} style={{color:C.acc2,fontSize:12}}>⚡ {w}</div>)}</div>}
 {bResult&&(
 <div>
 <button onClick={()=>setBTab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:"#888888",cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
 
 <div style={{background:`linear-gradient(135deg,${C.acc}18,${C.card})`,border:`1px solid ${C.acc}55`,borderRadius:14,padding:"16px",marginBottom:12}}>
 <SectionTitle icon="📊" title="계산 결과 요약" color={C.acc}/>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
 {[{l:"필요 보드",v:`${bResult.boards}장`,c:"#e8450a"},{l:"작업 면적",v:`${bResult.m2.toFixed(3)}㎡`,c:"#1a56cc"}].map(s=>(
 <div key={s.l} style={{background:"#ffffff",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
 <div style={{fontSize:20,fontWeight:900,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
 <div style={{fontSize:10,color:"#888888",marginTop:2}}>{s.l}</div>
 </div>
 ))}
 </div>
 <div style={{background:"#ffffff",borderRadius:8,padding:"10px 12px"}}>
 <div style={{fontSize:11,fontWeight:700,color:"#888888",marginBottom:7}}>재단 목록</div>
 {(()=>{
 // 면별 재단(faceLabel)은 그룹으로 묶기
 const faceGroups={}, normal=[];
 for(const p of bResult.pieces){
 if(p.faceLabel){
 const base=p.label.replace(/\[.*?\]/g,"").trim();
 const k=`${base}::${p.w}x${p.h}`;
 if(!faceGroups[k]) faceGroups[k]={base,w:p.w,h:p.h,count:0,type:"face"};
 faceGroups[k].count++;
 } else if(p.shape==="group"||p.shape==="group_split"){
 const k=`g-${p.label}`;
 if(!faceGroups[k]) faceGroups[k]={...p,count:0,type:"group"};
 faceGroups[k].count++;
 } else {
 const k=`${p.w}x${p.h}-${p.label}`;
 if(!faceGroups[k]) faceGroups[k]={...p,count:0,type:"normal"};
 faceGroups[k].count++;
 }
 }
 const all=[...Object.values(faceGroups)];
 return all.map((g,i)=>(
 <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:i<all.length-1?`1px solid ${C.line}22`:"none"}}>
 <span style={{fontSize:12}}>{g.type==="group"?"⊞":"■"}</span>
 <span style={{flex:1,fontSize:12}}>{g.type==="face"?g.base:g.label}</span>
 <span style={{fontSize:11,color:"#888888",fontFamily:"monospace"}}>{Math.round(g.w)}×{Math.round(g.h)}mm</span>
 <span style={{background:C.acc+"33",color:"#e8450a",borderRadius:4,padding:"1px 6px",fontSize:11,fontWeight:700}}>×{g.count}</span>
 </div>
 ));
 })()}
 </div>
 </div>
 
 <div style={{background:"#ffffff",border:`1px solid ${C.blu}44`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
 <div style={{padding:"10px 13px",borderBottom:"1px solid #f0f0f0",background:`linear-gradient(90deg,${C.blu}15,transparent)`}}>
 <SectionTitle icon="📐" title="재단 도면" color={C.blu}/>
 </div>
 <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid #e8e8e8"}}>
 {bResult.diagrams.map((d,i)=>(
 <button key={i} onClick={()=>setBDrawTab(i)} style={{padding:"7px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:bDrawTab===i?C.sur:"transparent",color:bDrawTab===i?C.txt:C.mut,borderBottom:bDrawTab===i?`2px solid ${C.blu}`:"2px solid transparent",border:"none",cursor:"pointer"}}>
 {d.isGroup?"⊞":d.isFaceGroup?"◧":"■"} {d.label||`항목${i+1}`}
 {d.isFaceGroup&&<span style={{marginLeft:3,fontSize:9,color:C.acc2}}>4면</span>}
 {!d.isFaceGroup&&d.count>1&&<span style={{marginLeft:3,fontSize:9,color:"#e8450a"}}>×{d.count}</span>}
 </button>
 ))}
 </div>
 {bResult.diagrams.map((d,i)=>i!==bDrawTab?null:(
 <div key={i} style={{padding:"12px"}}>
 <div style={{background:"#f8f8f8",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:12,lineHeight:1.9}}>
 {d.isFaceGroup?(
 <>
 <div style={{fontWeight:700,color:"#e8450a",marginBottom:6}}>✂ 면별 재단</div>
 <div style={{color:"#0d0d0d"}}>① 가로면(상/하): <span style={{color:C.acc2,fontWeight:700}}>{d.horzW}×{d.horzH}mm</span> <span style={{color:"#888888"}}>× 2장</span></div>
 <div style={{color:"#0d0d0d"}}>② 세로면(좌/우): <span style={{color:C.acc2,fontWeight:700}}>{d.vertW}×{d.vertH}mm</span> <span style={{color:"#888888"}}>× 2장</span> <span style={{fontSize:10,color:"#888888"}}>(세로{d.vertW-(d.horzH||0)*2}+폭{d.horzH}×2)</span></div>
 <div style={{marginTop:4,fontSize:11,color:"#888888"}}>수량당 4장 · 총 {d.count}장</div>
 </>
 ):d.isGroup?(
 <>
 <div style={{fontWeight:700,color:"#1a56cc",marginBottom:4}}>✂ 재단 순서</div>
 <div style={{color:"#0d0d0d"}}>① 보드 <span style={{color:C.acc2,fontWeight:700}}>{d.bw}×{d.bh}mm</span> 재단</div>
 {d.pipes?.map((p,pi)=>{const dX=Math.round(p.bx),dY=Math.round(p.cy!==undefined?p.cy:(d.bh-(d.mb||0)-p.by));return <div key={pi} style={{color:"#0d0d0d"}}>② <span style={{color:C.pipe[pi%C.pipe.length],fontWeight:700}}>{pi+1}타공</span> X={dX} Y={dY} <span style={{color:C.pipe[pi%C.pipe.length],fontWeight:700}}>Ø{p.d}mm</span></div>;})}
 </>
 ):(
 <>
 <div style={{fontWeight:700,color:"#1a56cc",marginBottom:4}}>✂ 재단 방법</div>
 <div style={{color:"#0d0d0d"}}>① 가로 <span style={{color:C.acc2,fontWeight:700}}>{Math.round(d.w)}mm</span></div>
 <div style={{color:"#0d0d0d"}}>② 세로 <span style={{color:C.acc2,fontWeight:700}}>{Math.round(d.h)}mm</span></div>
 <div style={{color:"#0d0d0d"}}>③ 직각 확인 후 절단{d.count>1&&<span style={{color:"#e8450a"}}> ×{d.count}장</span>}</div>
 </>
 )}
 </div>
 <div style={{background:"#f8f8f8",borderRadius:8,padding:10,overflowX:"auto"}}>
 {d.isFaceGroup?(()=>{
 const dW=d.horzW||300, dH=(d.vertW||600)-(d.horzH||150)*2, fold=d.horzH||150;
 // 단면도 (정면 뷰): 가로면=주황, 세로면=파란, 덕트=다크
 const maxW=dW+fold*2, maxH=dH+fold*2;
 const sc=Math.min(200/maxW, 160/maxH, 1.0);
 const bw=dW*sc, bh=dH*sc, fw=fold*sc;
 // 레이아웃: 왼쪽 치수, 오른쪽 도면
 const PAD_L=52, PAD_T=16, PAD_B=70, PAD_R=16;
 const ox=PAD_L, oy=PAD_T;
 const W=bw+fw*2+PAD_L+PAD_R;
 const H=bh+fw*2+PAD_T+PAD_B;
 const cD="#2e3d50", cTB="#f56e1a", cLR="#1a56cc";
 return (
 <svg width={W} height={H} style={{display:"block",margin:"0 auto",maxWidth:"100%"}}>

 
 <rect x={ox+fw} y={oy+fw} width={bw} height={bh} fill={cD} stroke="#4a5e72" strokeWidth="1.2" rx="1"/>

 
 <rect x={ox}      y={oy} width={fw} height={bh+fw*2} fill={cLR} stroke="#5aaaf8" strokeWidth="1.5" rx="2"/>
 <rect x={ox+fw+bw} y={oy} width={fw} height={bh+fw*2} fill={cLR} stroke="#5aaaf8" strokeWidth="1.5" rx="2"/>

 
 <rect x={ox+fw} y={oy}      width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5" rx="2"/>
 <rect x={ox+fw} y={oy+fw+bh} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5" rx="2"/>

 
 <line x1={ox+fw} y1={oy+fw+bh/2} x2={ox+fw+bw} y2={oy+fw+bh/2} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="5,4"/>
 <line x1={ox+fw+bw/2} y1={oy+fw} x2={ox+fw+bw/2} y2={oy+fw+bh} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="5,4"/>

 
 <line x1={ox} y1={oy+bh+fw*2+10} x2={ox+bw+fw*2} y2={oy+bh+fw*2+10} stroke="#aaa" strokeWidth=".8"/>
 <line x1={ox} y1={oy+bh+fw*2+6} x2={ox} y2={oy+bh+fw*2+14} stroke="#aaa" strokeWidth=".8"/>
 <line x1={ox+bw+fw*2} y1={oy+bh+fw*2+6} x2={ox+bw+fw*2} y2={oy+bh+fw*2+14} stroke="#aaa" strokeWidth=".8"/>
 <text x={ox+(bw+fw*2)/2} y={oy+bh+fw*2+24} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace">{dW+fold*2}mm</text>

 
 <line x1={ox-10} y1={oy} x2={ox-10} y2={oy+bh+fw*2} stroke="#aaa" strokeWidth=".8"/>
 <line x1={ox-14} y1={oy} x2={ox-6} y2={oy} stroke="#aaa" strokeWidth=".8"/>
 <line x1={ox-14} y1={oy+bh+fw*2} x2={ox-6} y2={oy+bh+fw*2} stroke="#aaa" strokeWidth=".8"/>
 <text x={ox-12} y={oy+(bh+fw*2)/2+4} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace" transform={`rotate(-90,${ox-28},${oy+(bh+fw*2)/2})`}>{dH+fold*2}mm</text>

 
 <line x1={ox+fw} y1={oy+bh+fw*2+34} x2={ox+fw+bw} y2={oy+bh+fw*2+34} stroke={cTB} strokeWidth=".8"/>
 <line x1={ox+fw} y1={oy+bh+fw*2+30} x2={ox+fw} y2={oy+bh+fw*2+38} stroke={cTB} strokeWidth=".8"/>
 <line x1={ox+fw+bw} y1={oy+bh+fw*2+30} x2={ox+fw+bw} y2={oy+bh+fw*2+38} stroke={cTB} strokeWidth=".8"/>
 <text x={ox+fw+bw/2} y={oy+bh+fw*2+48} textAnchor="middle" fill={cTB} fontSize="9" fontWeight="700" fontFamily="monospace">{dW}mm</text>

 
 <rect x={ox} y={H-20} width="10" height="8" fill={cTB} stroke={C.acc} strokeWidth="1" rx="1.5"/>
 <text x={ox+14} y={H-13} fill={cTB} fontSize="10" fontWeight="700">가로면(상/하) {dW}×{fold}mm ×2장</text>
 <rect x={ox} y={H-8} width="10" height="8" fill={cLR} stroke="#5aaaf8" strokeWidth="1" rx="1.5"/>
 <text x={ox+14} y={H-1} fill={cLR} fontSize="10" fontWeight="700">세로면(좌/우) {dH+fold*2}×{fold}mm ×2장</text>
 </svg>
 );
 })():d.isGroup?<GroupDiagram g={d}/>:<BoardDiagram piece={d}/>}
 </div>
 </div>
 ))}
 </div>
 
 <div style={{background:"#ffffff",border:"1px solid #e8e8e8",borderRadius:12,padding:"12px",marginBottom:12}}>
 <div style={{fontSize:11,fontWeight:700,color:"#888888",marginBottom:8}}>보드 배치 ({bResult.bw}×{bResult.bh}mm)</div>
 <div style={{overflowX:"auto"}}>
 {(()=>{
 const PAD_L=44, PAD_B=28;
 const svgW=bResult.bw*scale+PAD_L+8;
 const svgH=Math.min(bResult.totalH,bResult.bh)*scale+PAD_B+8;
 const ox=PAD_L, oy=4;
 return (
 <svg width={svgW} height={svgH} style={{display:"block",margin:"0 auto"}}>
 
 <rect x={ox} y={oy} width={bResult.bw*scale} height={Math.min(bResult.totalH,bResult.bh)*scale} fill={C.sur} stroke={C.bdr} strokeWidth={1.5} rx={3}/>
 
 {[...Array(Math.floor(bResult.bw/200))].map((_,i)=><line key={`v${i}`} x1={ox+(i+1)*200*scale} y1={oy} x2={ox+(i+1)*200*scale} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.bdr} strokeWidth={.5} strokeDasharray="3,3"/>)}
 
 {bResult.rows.flatMap((row,ri)=>row.pieces.map((p,pi)=>{
 const hue=(ri*60+pi*40)%360;
 const px2=ox+p.x*scale, py2=oy+row.y*scale, pw=p.w*scale, ph=p.h*scale;
 return (
 <g key={`${ri}-${pi}`}>
 {p.shape==="group"||p.shape==="group_split"
 ?<><rect x={px2} y={py2} width={pw} height={ph} fill={C.blu+"20"} stroke={C.blu} strokeWidth={1.5} rx={2}/>{p.pipes?.map((pp,ppi)=><circle key={ppi} cx={px2+(pp.bx/p.bw)*pw} cy={py2+(pp.by/p.bh)*ph} r={Math.max((pp.d/2/p.bw)*pw,2)} fill={C.pipe[ppi%C.pipe.length]+"55"} stroke={C.pipe[ppi%C.pipe.length]} strokeWidth={1}/>)}</>
 :<rect x={px2} y={py2} width={pw} height={ph} fill={`hsla(${hue},55%,55%,.28)`} stroke={`hsla(${hue},65%,65%,.9)`} strokeWidth={1.2} rx={2}/>}
 
 {pw>30&&ph>14&&<text x={px2+pw/2} y={py2+ph/2-3} textAnchor="middle" fill="#fff" fontSize={Math.min(pw/7,9)} fontWeight="700">{p.label}</text>}
 
 {pw>38&&ph>18&&<text x={px2+pw/2} y={py2+ph/2+7} textAnchor="middle" fill="#ffffff99" fontSize={Math.min(pw/9,8)} fontFamily="monospace">{Math.round(p.w)}×{Math.round(p.h)}</text>}
 </g>
 );
 }))}
 
 <line x1={ox-6} y1={oy} x2={ox-6} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.acc2} strokeWidth={1}/>
 <line x1={ox-11} y1={oy} x2={ox-1} y2={oy} stroke={C.acc2} strokeWidth={1}/>
 <line x1={ox-11} y1={oy+Math.min(bResult.totalH,bResult.bh)*scale} x2={ox-1} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.acc2} strokeWidth={1}/>
 <text x={ox-8} y={oy+Math.min(bResult.totalH,bResult.bh)*scale/2+4} textAnchor="end" fill={C.acc2} fontSize={9} fontWeight="700" fontFamily="monospace" transform={`rotate(-90,${ox-26},${oy+Math.min(bResult.totalH,bResult.bh)*scale/2})`}>{bResult.bh}mm</text>
 
 <line x1={ox} y1={oy+Math.min(bResult.totalH,bResult.bh)*scale+8} x2={ox+bResult.bw*scale} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale+8} stroke={C.acc2} strokeWidth={1}/>
 <line x1={ox} y1={oy+Math.min(bResult.totalH,bResult.bh)*scale+4} x2={ox} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale+12} stroke={C.acc2} strokeWidth={1}/>
 <line x1={ox+bResult.bw*scale} y1={oy+Math.min(bResult.totalH,bResult.bh)*scale+4} x2={ox+bResult.bw*scale} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale+12} stroke={C.acc2} strokeWidth={1}/>
 <text x={ox+bResult.bw*scale/2} y={oy+Math.min(bResult.totalH,bResult.bh)*scale+22} textAnchor="middle" fill={C.acc2} fontSize={9} fontWeight="700" fontFamily="monospace">{bResult.bw}mm</text>
 </svg>
 );
 })()}
 </div>
 {bResult.totalH>bResult.bh&&<div style={{marginTop:7,fontSize:11,color:C.acc2,textAlign:"center"}}>⚠ {bResult.boards}장 분할 필요</div>}
 </div>
 
 <div style={{background:"#ffffff",border:`1px solid ${C.grn}44`,borderRadius:12,padding:"12px 13px",marginBottom:12}}>
 <SectionTitle icon="💾" title="작업 저장 · 재단 요청" color={C.grn}/>
 <div style={{display:"flex",gap:8,marginBottom:8}}>
 <div style={{flex:1}}><Lbl c="날짜"/><input style={SI} type="date" value={wDate} onChange={e=>setWDate(e.target.value)}/></div>
 <div style={{flex:2}}><Lbl c="현장명"/><input style={SI} value={wSite} onChange={e=>setWSite(e.target.value)} placeholder="현장명 입력"/></div>
 </div>
 <div style={{marginBottom:8}}><Lbl c="메모"/><input style={SI} value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="작업 메모 입력"/></div>
 <div style={{marginBottom:10}}>
 <Lbl c="⚠️ 재단 특이사항"/>
 <textarea value={wSpecial} onChange={e=>setWSpecial(e.target.value)} placeholder="예) 3번 보드 45도 컷, 타공 위치 현장 확인 후 작업..." style={{...SI,height:"60px",padding:"10px 14px",resize:"none",lineHeight:1.6}}/>
 </div>
 <button onClick={()=>{saveBoard();saveRequest();}}
 style={{width:"100%",background:reqSaved?"#0a7a50":"#e8450a",border:"none",borderRadius:4,padding:"14px 0",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",fontFamily:"inherit",transition:"all .3s"}}>
 {reqSaved?"✅ 저장 및 재단 요청 완료!":"재단 요청하기"}
 </button>
 </div>
 <button onClick={()=>setBTab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:"#888888",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 
 {mainTab==="insul" && (
 <div>
 <div style={{marginBottom:14,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>
 <div style={{fontSize:10,fontWeight:700,color:"#e8450a",letterSpacing:1.2,textTransform:"uppercase",marginBottom:4}}>차열재 시공 규정표</div>
 <div style={{fontSize:11,color:"#888"}}>배관 품질인정서 기준</div>
 </div>
 {STYPES.map(type=>(
 <div key={type} style={{marginBottom:14,borderBottom:"1px solid #f5f5f5",paddingBottom:14}}>
 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
 <div style={{width:3,height:16,background:"#e8450a",borderRadius:2}}/>
 <span style={{fontSize:13,fontWeight:700,color:"#0d0d0d"}}>{type}</span>
 </div>
 {SPEC[type].map((row,i)=>(
 <div key={i} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:i<SPEC[type].length-1?"1px solid #f8f8f8":"none",gap:12}}>
 <div style={{width:80,fontSize:12,fontWeight:600,color:"#444",flexShrink:0}}>{row.range}</div>
 <div style={{flex:1}}>
 {row.steps.length===0
 ?<span style={{fontSize:11,color:"#aaa"}}>시공 없음</span>
 :<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
 {row.steps.map((s,si)=>(
 <span key={si} style={{fontSize:11,fontWeight:600,color:"#e8450a",background:"#fff3ee",borderRadius:3,padding:"3px 9px",border:"1px solid #ffd4c0"}}>
 {s.t} <span style={{fontFamily:"monospace"}}>{s.mm}mm</span>
 </span>
 ))}
 </div>
 }
 </div>
 </div>
 ))}
 </div>
 ))}
 <div style={{background:"#f8f8f8",borderRadius:6,padding:"12px 14px",marginTop:4}}>
 <div style={{fontSize:10,color:"#888",lineHeight:1.9}}>
 <div>📌 차열재 두께 기본 <span style={{color:"#e8450a",fontWeight:700}}>25mm</span> 기준</div>
 <div>📌 단수는 겹쳐 감는 횟수 (1단=1겹, 2단=2겹)</div>
 <div>📌 mm는 벽체에서 배관 방향으로 감는 길이</div>
 </div>
 </div>
 </div>
 )}

 
 {mainTab==="history" && <HistoryTab logs={logs} setLogs={setLogs}/>}

        </div>
      </div>
    </div>
  );
}
