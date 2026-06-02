import { useState, useEffect } from "react";

const ACCESS_CODE = "jaeam2026";
const AUTH_KEY = "jaeam_auth";
const API_KEY   = "jaeam_api_url";

const C = {
  bg:"#0f1015", sur:"#16181f", card:"#1d2029", bdr:"#272c3a", line:"#2d3245",
  acc:"#f56e1a", acc2:"#ff9a3c", blu:"#3d8ef0", grn:"#3ec46d",
  txt:"#e8eaf2", mut:"#5c6278", err:"#e04545", pur:"#b56af0",
  pipe:["#3d8ef0","#f56e1a","#3ec46d","#b56af0","#ff9a3c","#ff4d88","#00ccc4","#f5d000"],
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
const saveReqs = l => { try { localStorage.setItem(RK, JSON.stringify(l)); } catch {} };
const todayStr = () => new Date().toISOString().slice(0,10);
const fmt4 = n => typeof n==="number" ? n.toFixed(4) : "0.0000";
const fmtDt = s => s ? s.replace("T"," ").slice(0,16) : "";

let _id = 1;
const nid = () => String(_id++);

const mkDuct2  = () => ({id:nid(),type:"single",label:"",w:"",h:"",fold:"",qty:""});
const mkPipe2  = () => ({id:nid(),d:"",gap:"",fromBottom:""});
const mkGroup  = () => ({id:nid(),type:"group",label:"",mode:"field",pipes:[mkPipe2()],pX:"",pY:"",cols:"",rows:"",mT:"150",mB:"",mL:"150",mR:"150"});
const mkIns    = () => ({id:nid(),kind:"pipe",label:"",specType:STYPES[0],specRange:"",customOD:"",thickness:"25",qty:""});
const mkInsDuct= () => ({id:nid(),kind:"duct",label:"",shape:"circle",diam:"",dw:"",dh:"",insW:"",qty:""});

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
const SI = {background:"#13151c",border:"1px solid #272c3a",borderRadius:8,padding:"0 12px",color:"#e8eaf2",fontSize:13,width:"100%",height:"38px",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color .15s"};
const Lbl = ({c}) => <div style={{fontSize:11,color:"#5c6278",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c}</div>;
const SectionTitle = ({icon,title,color}) => (
  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,paddingBottom:8,borderBottom:"1px solid #2d3245"}}>
    <span style={{fontSize:15}}>{icon}</span>
    <span style={{fontSize:14,fontWeight:800,color:color||"#e8eaf2",letterSpacing:-.3}}>{title}</span>
  </div>
);

// ── 도면 ─────────────────────────────────────────────────
function BoardDiagram({piece}){
  const PAD=40, sc=Math.min((260-PAD*2)/piece.w,(180-PAD*2)/piece.h,1);
  const pw=piece.w*sc, ph=piece.h*sc, ox=PAD, oy=PAD;
  return (
    <svg width={pw+PAD*2+14} height={ph+PAD*2+14} style={{display:"block",margin:"0 auto",maxWidth:"100%"}}>
      <defs><marker id="ar" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff9a3c"/></marker></defs>
      {piece.shape==="rect"&&<rect x={ox} y={oy} width={pw} height={ph} fill="#3d8ef033" stroke="#3d8ef0" strokeWidth={2} rx={2}/>}
      {piece.shape==="circle"&&<ellipse cx={ox+pw/2} cy={oy+ph/2} rx={pw/2} ry={ph/2} fill="#3d8ef033" stroke="#3d8ef0" strokeWidth={2}/>}
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
      <rect x={ox} y={oy} width={pw} height={ph} fill="#16181f" stroke="#272c3a" strokeWidth={1.5} rx={2}/>
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
      <text x={ox} y={oy-6} fill="#5c6278" fontSize={7} fontFamily="monospace">X=좌측기준 Y=하단~배관중심(mm)</text>
    </svg>
  );
}

// ── 스플래시 ─────────────────────────────────────────────
// ── 홈 화면 ─────────────────────────────────────────────
function HomeScreen({onMenu}){
  const menus = [
    { id:"notice",  icon:"📢", label:"공지사항",   color:"#f56e1a", sub:"현장 공지" },
    { id:"calc",    icon:"🔥", label:"재단계산기", color:"#3d8ef0", sub:"방화·차열재" },
    { id:"spec",    icon:"📋", label:"시방서",     color:"#3ec46d", sub:"시공 기준" },
    { id:"schedule",icon:"📅", label:"일정표",     color:"#b56af0", sub:"작업 일정" },
    { id:"plan",    icon:"📝", label:"금일계획",   color:"#ff9a3c", sub:"오늘 작업" },
    { id:"request", icon:"📄", label:"재단요청서", color:"#ff4d88", sub:"재단 신청" },
    { id:"photo",    icon:"📸", label:"공사사진",   color:"#00ccc4", sub:"현장 사진" },
  ];

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const days = ["일","월","화","수","목","금","토"];
  const dayStr = days[today.getDay()]+"요일";

  return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}button{cursor:pointer;border:none;background:none;font-family:inherit}.menu-btn:active{transform:scale(.94);transition:transform .1s}`}</style>

      {/* ── 헤더 배너 ── */}
      <div style={{background:"linear-gradient(160deg,#1a1008 0%,#2a1a05 60%,#0f1015 100%)",padding:"0 0 0"}}>
        {/* 상단 바 */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px"}}>
          <svg width="110" height="32" viewBox="0 0 110 32">
            <defs><linearGradient id="hg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f56e1a"/><stop offset="100%" stopColor="#ff9a3c"/></linearGradient></defs>
            <rect width="110" height="32" rx="7" fill="url(#hg3)"/>
            <text x="55" y="11" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="7" fontWeight="700" fontFamily="Arial" letterSpacing="2">SINCE 1984</text>
            <text x="55" y="26" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="2">Jaeam</text>
          </svg>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e8eaf2"}}>{dateStr}</div>
            <div style={{fontSize:11,color:"#f56e1a",fontWeight:600}}>{dayStr}</div>
          </div>
        </div>

        {/* 인사말 */}
        <div style={{padding:"8px 20px 24px"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-.5,marginBottom:4}}>
            안녕하세요 👋
          </div>
          <div style={{fontSize:13,color:"#8a8ea8"}}>재암산업 방화마감 통합 관리 시스템</div>
        </div>

        {/* 오렌지 구분선 */}
        <div style={{height:2,background:"linear-gradient(90deg,#f56e1a,#ff9a3c44,transparent)"}}/>
      </div>

      {/* ── 메뉴 그리드 ── */}
      <div style={{flex:1,padding:"24px 16px 32px"}}>
        <div style={{fontSize:12,color:"#5c6278",fontWeight:600,letterSpacing:1,marginBottom:14,paddingLeft:4}}>MENU</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {menus.map(m=>(
            <button key={m.id} className="menu-btn" onClick={()=>onMenu(m.id)}
              style={{background:"#1d2029",border:`1px solid #2d3245`,borderRadius:16,padding:"18px 8px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,position:"relative",overflow:"hidden",transition:"all .2s"}}>
              {/* 색상 글로우 */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:m.color,borderRadius:"16px 16px 0 0"}}/>
              {/* 아이콘 배경 */}
              <div style={{width:52,height:52,borderRadius:14,background:m.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginTop:4}}>
                {m.icon}
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:800,color:"#e8eaf2",marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:10,color:"#5c6278"}}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 하단 ── */}
      <div style={{padding:"12px 16px 10px",borderTop:"1px solid #1d2029"}}>
        <button onClick={()=>onMenu("connect")} style={{width:"100%",background:"#1d2029",border:"1px solid #2d3245",borderRadius:12,padding:"11px 16px",color:"#5c6278",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontFamily:"inherit",marginBottom:10}}>
          <span style={{fontSize:16}}>⚙️</span>
          <span style={{fontWeight:700}}>구글 연동 설정</span>
          <span style={{fontSize:11,marginLeft:"auto",background:"#2d3245",borderRadius:6,padding:"2px 8px"}}>시트·캘린더·드라이브</span>
        </button>
        <div style={{display:"flex",justifyContent:"space-between",padding:"0 4px"}}>
          <div style={{fontSize:10,color:"#2a2e42"}}>JAEAM INDUSTRY Co., Ltd.</div>
          <div style={{fontSize:10,color:"#2a2e42"}}>v2.0</div>
        </div>
      </div>
    </div>
  );
}

// ── 준비중 화면 ──────────────────────────────────────────

// ── API 공통 ─────────────────────────────────────────────
async function apiGet(url, params={}) {
  const q = new URLSearchParams({...params}).toString();
  const res = await fetch(`${url}?${q}`);
  return res.json();
}
async function apiPost(url, body={}) {
  const res = await fetch(url, {method:"POST",body:JSON.stringify(body)});
  return res.json();
}
const pink="#ff4d88";


// ── 공사사진 화면 ─────────────────────────────────────────
function PhotoScreen({apiUrl,onBack}){
  const teal="#00ccc4";
  const todayStr=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;})();
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
    if(!apiUrl) return;
    setLoading(true);
    try{const r=await apiGet(apiUrl,{action:"getPhotos"});if(r.ok)setPhotos(r.data||[]);}catch{}
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
    if(!apiUrl){setResult({ok:false,msg:"구글 연동 설정을 먼저 해주세요."});return;}
    setUploading(true);setResult(null);
    let ok=0;
    for(let i=0;i<previews.length;i++){
      setProgress(Math.round((i/previews.length)*100));
      const {file,dataUrl}=previews[i];
      const base64=dataUrl.split(",")[1];
      const ts=Date.now();
      const fileName=`${form.site}_${form.date}_${ts}.jpg`;
      try{
        const r=await apiPost(apiUrl,{
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
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      {/* 헤더 */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>📸 공사사진</span>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {["upload","list"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?teal:C.sur,border:`1px solid ${tab===t?teal:C.line}`,borderRadius:8,padding:"5px 12px",color:tab===t?"#fff":C.mut,fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {t==="upload"?"📤 업로드":"📂 목록"}
            </button>
          ))}
        </div>
      </div>

      {!apiUrl&&<div style={{padding:"14px 16px",background:"#f56e1a18",borderBottom:"1px solid #f56e1a33",fontSize:12,color:"#f56e1a"}}>⚙️ 홈 → 구글 연동 설정을 먼저 해주세요</div>}

      {/* 업로드 탭 */}
      {tab==="upload"&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
          {/* 입력폼 */}
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:"14px",marginBottom:14}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div style={{flex:2}}>
                <div style={{fontSize:11,color:C.mut,marginBottom:4}}>현장명 *</div>
                <input value={form.site} onChange={e=>setForm(p=>({...p,site:e.target.value}))} placeholder="예) 3층 화장실"
                  style={{width:"100%",background:C.sur,border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 12px",color:C.txt,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.mut,marginBottom:4}}>날짜</div>
                <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                  style={{width:"100%",background:C.sur,border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 8px",color:C.txt,fontSize:12,boxSizing:"border-box",outline:"none"}}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:C.mut,marginBottom:4}}>메모</div>
              <input value={form.memo} onChange={e=>setForm(p=>({...p,memo:e.target.value}))} placeholder="작업 내용 메모"
                style={{width:"100%",background:C.sur,border:`1px solid ${C.line}`,borderRadius:8,padding:"9px 12px",color:C.txt,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
            </div>
          </div>

          {/* 사진 선택 */}
          <label style={{display:"block",marginBottom:14,cursor:"pointer"}}>
            <div style={{background:`${teal}11`,border:`2px dashed ${teal}66`,borderRadius:14,padding:"22px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:6}}>📷</div>
              <div style={{fontSize:13,fontWeight:700,color:teal,marginBottom:2}}>사진 선택 또는 촬영</div>
              <div style={{fontSize:11,color:C.mut}}>여러 장 동시 선택 가능 · 자동 압축 적용</div>
            </div>
            <input type="file" accept="image/*" multiple capture="environment" onChange={onFiles} style={{display:"none"}}/>
          </label>

          {/* 미리보기 */}
          {previews.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.mut,marginBottom:8}}>{previews.length}장 선택됨</div>
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

          {/* 진행바 */}
          {uploading&&(
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:teal,marginBottom:6}}>
                <span>업로드 중...</span><span>{progress}%</span>
              </div>
              <div style={{background:C.sur,borderRadius:4,height:6,overflow:"hidden"}}>
                <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${teal},#00f0e0)`,transition:"width .3s",borderRadius:4}}/>
              </div>
            </div>
          )}

          {/* 결과 */}
          {result&&<div style={{background:result.ok?"#00ccc418":"#e0454518",border:`1px solid ${result.ok?teal+"55":"#e0454544"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:result.ok?teal:"#e04545"}}>{result.msg}</div>}

          {/* 업로드 버튼 */}
          <button onClick={upload} disabled={uploading||!previews.length||!form.site}
            style={{width:"100%",background:previews.length&&form.site?`linear-gradient(135deg,${teal},#00f0e0)`:`${C.sur}`,border:"none",borderRadius:12,padding:"14px 0",color:previews.length&&form.site?"#fff":C.mut,fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:previews.length&&form.site?`0 6px 20px ${teal}44`:"none",transition:"all .2s"}}>
            {uploading?`⏳ 업로드 중 (${progress}%)`:`📤 드라이브에 업로드 (${previews.length}장)`}
          </button>
        </div>
      )}

      {/* 목록 탭 */}
      {tab==="list"&&(
        <div style={{flex:1,overflowY:"auto",padding:"14px"}}>
          {loading&&<div style={{textAlign:"center",padding:"40px",color:C.mut}}>⏳ 불러오는 중...</div>}
          {!loading&&!photos.length&&<div style={{textAlign:"center",padding:"60px 20px",color:C.mut}}><div style={{fontSize:44,marginBottom:12}}>📸</div><div style={{fontSize:13}}>업로드된 사진이 없습니다</div></div>}
          {(()=>{
            // 날짜+현장 그룹
            const groups={};
            for(const p of photos){
              const k=`${p["날짜"]}__${p["현장명"]}`;
              if(!groups[k]) groups[k]={date:p["날짜"],site:p["현장명"],items:[]};
              groups[k].items.push(p);
            }
            return Object.values(groups).map((g,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
                <div style={{padding:"11px 14px",borderBottom:`1px solid ${C.line}`,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:3,height:16,background:teal,borderRadius:2}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:C.txt}}>{g.site}</div>
                    <div style={{fontSize:11,color:C.mut}}>{g.date.replace(/-/g,".")} · {g.items.length}장</div>
                  </div>
                </div>
                <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:7}}>
                  {g.items.map((item,j)=>(
                    <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",background:C.sur,borderRadius:8}}>
                      <div style={{fontSize:20}}>📷</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:C.txt,fontWeight:600}}>{item["파일명"]}</div>
                        {item["메모"]&&<div style={{fontSize:11,color:C.mut,marginTop:1}}>{item["메모"]}</div>}
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
      const r=await apiGet(input,{action:"ping"});
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
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>⚙️ 구글 연동 설정</span>
      </div>
      <div style={{flex:1,padding:"20px 16px",overflowY:"auto"}}>
        {/* 안내 */}
        <div style={{background:"#1d2029",border:"1px solid #3d8ef055",borderRadius:14,padding:"16px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:"#3d8ef0",marginBottom:10}}>📋 설치 순서</div>
          {["1. script.google.com 접속 → 새 프로젝트 생성","2. 제공받은 jaeam_gas.js 코드 전체 붙여넣기","3. 상단 메뉴 → 배포 → 새 배포","4. 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자","5. 배포 → URL 복사 후 아래에 붙여넣기","6. '연결 테스트' 버튼 클릭","7. 성공 시 '초기 설정 실행' 클릭 (최초 1회)"].map((s,i)=>(
            <div key={i} style={{fontSize:12,color:i===4||i===5||i===6?"#ff9a3c":"#8a8ea8",marginBottom:6,lineHeight:1.6}}>{s}</div>
          ))}
        </div>
        {/* URL 입력 */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,color:"#5c6278",marginBottom:6,fontWeight:700}}>Apps Script 웹앱 URL</div>
          <input value={input} onChange={e=>setInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            style={{width:"100%",background:"#1d2029",border:"1px solid #2d3245",borderRadius:10,padding:"12px",color:"#e8eaf2",fontSize:12,fontFamily:"monospace",boxSizing:"border-box",outline:"none"}}/>
        </div>
        {status&&<div style={{background:status.ok?"#3ec46d18":"#e0454518",border:`1px solid ${status.ok?"#3ec46d44":"#e0454544"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:status.ok?"#3ec46d":"#e04545"}}>{status.msg}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={test} disabled={testing} style={{flex:1,background:"#3d8ef0",border:"none",borderRadius:10,padding:"12px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:testing?.6:1}}>{testing?"⏳ 확인 중...":"🔗 연결 테스트"}</button>
          <button onClick={runSetup} disabled={testing||!apiUrl} style={{flex:1,background:apiUrl?"#f56e1a":"#2d3245",border:"none",borderRadius:10,padding:"12px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:testing?.6:1}}>🚀 초기 설정 실행</button>
        </div>
        {apiUrl&&<div style={{marginTop:12,background:"#3ec46d18",border:"1px solid #3ec46d44",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#3ec46d"}}>✅ 현재 연결됨: {apiUrl.slice(0,60)}...</div>}
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
    if(!apiUrl){setNotices([]);return;}
    setLoading(true);
    try{const r=await apiGet(apiUrl,{action:"getNotices"});if(r.ok)setNotices(r.data||[]);}catch{}
    setLoading(false);
  };
  const save=async()=>{
    if(!form.title||!apiUrl) return;
    setSaving(true);
    try{await apiPost(apiUrl,{action:"addNotice",...form,date:todayStr()});setForm({title:"",content:"",important:false});setShowForm(false);load();}catch{}
    setSaving(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>📢 공지사항</span>
        <button onClick={()=>setShowForm(p=>!p)} style={{marginLeft:"auto",background:"#f56e1a",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>＋ 작성</button>
      </div>
      {!apiUrl&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요 (홈 → 연동 설정)</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#1d2029",borderBottom:"1px solid #2d3245"}}>
        <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="제목"
          style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#e8eaf2",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} placeholder="내용"
          style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#e8eaf2",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none",resize:"vertical",minHeight:80}}/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#e8eaf2",cursor:"pointer"}}>
            <input type="checkbox" checked={form.important} onChange={e=>setForm(p=>({...p,important:e.target.checked}))}/> ⭐ 중요
          </label>
          <button onClick={save} disabled={saving||!form.title} style={{marginLeft:"auto",background:"#f56e1a",border:"none",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"저장"}</button>
        </div>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#5c6278"}}>⏳ 불러오는 중...</div>}
        {!loading&&!notices.length&&<div style={{textAlign:"center",padding:"60px 20px",color:"#5c6278"}}><div style={{fontSize:40,marginBottom:12}}>📢</div><div style={{fontSize:13}}>공지사항이 없습니다</div></div>}
        {notices.map((n,i)=>(
          <div key={i} style={{background:"#1d2029",border:`1px solid ${n["중요도"]==="⭐중요"?"#f56e1a55":"#2d3245"}`,borderRadius:12,padding:"13px 14px",marginBottom:9}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              {n["중요도"]==="⭐중요"&&<span style={{fontSize:10,background:"#f56e1a33",color:"#f56e1a",borderRadius:4,padding:"2px 7px",fontWeight:700}}>⭐ 중요</span>}
              <span style={{fontSize:14,fontWeight:800,color:"#e8eaf2",flex:1}}>{n["제목"]}</span>
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

  const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};

  useEffect(()=>{load();},[]);
  const load=async()=>{
    if(!apiUrl) return;
    setLoading(true);
    try{
      const start=new Date(); start.setDate(1);
      const end=new Date(); end.setMonth(end.getMonth()+2);
      const r=await apiGet(apiUrl,{action:"getCalendar",start:start.toISOString(),end:end.toISOString()});
      if(r.ok) setEvents(r.data||[]);
    }catch{}
    setLoading(false);
  };
  const save=async()=>{
    if(!form.title||!apiUrl) return;
    setSaving(true);
    try{
      const body={action:"addEvent",...form};
      if(form.allDay){body.start=form.start;delete body.end;}
      else{body.start=form.start+"T09:00:00";body.end=(form.end||form.start)+"T18:00:00";}
      await apiPost(apiUrl,body);
      setShowForm(false);setForm({title:"",start:todayStr(),end:"",allDay:true,location:"",description:""});load();
    }catch{}
    setSaving(false);
  };
  const delEv=async(id)=>{
    if(!window.confirm("삭제할까요?")) return;
    await apiPost(apiUrl,{action:"deleteEvent",eventId:id});load();
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
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>📅 일정표</span>
        <button onClick={()=>setShowForm(p=>!p)} style={{marginLeft:"auto",background:"#b56af0",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>＋ 일정</button>
      </div>
      {!apiUrl&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#1d2029",borderBottom:"1px solid #2d3245"}}>
        <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="일정 제목"
          style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"10px",color:"#e8eaf2",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}><div style={{fontSize:11,color:"#5c6278",marginBottom:3}}>날짜</div><input type="date" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"8px",color:"#e8eaf2",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
          <div style={{flex:1}}><div style={{fontSize:11,color:"#5c6278",marginBottom:3}}>장소</div><input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="장소" style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"8px",color:"#e8eaf2",fontSize:12,boxSizing:"border-box",outline:"none"}}/></div>
        </div>
        <button onClick={save} disabled={saving||!form.title} style={{width:"100%",background:"#b56af0",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"일정 저장"}</button>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#5c6278"}}>⏳ 불러오는 중...</div>}
        {!loading&&!events.length&&apiUrl&&<div style={{textAlign:"center",padding:"60px 20px",color:"#5c6278"}}><div style={{fontSize:40,marginBottom:12}}>📅</div><div style={{fontSize:13}}>일정이 없습니다</div></div>}
        {dates.map(date=>(
          <div key={date} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:800,color:"#b56af0",marginBottom:6,paddingLeft:2}}>{date.replace(/-/g,".")}</div>
            {byDate[date].map((ev,i)=>(
              <div key={i} style={{background:"#1d2029",border:"1px solid #b56af044",borderRadius:10,padding:"11px 14px",marginBottom:7,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:4,height:36,background:"#b56af0",borderRadius:2,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#e8eaf2",marginBottom:2}}>{ev.title}</div>
                  {ev.location&&<div style={{fontSize:11,color:"#5c6278"}}>📍 {ev.location}</div>}
                  <div style={{fontSize:10,color:"#3a3e52",marginTop:2}}>{ev.allDay?"종일":ev.start?.slice(11,16)}</div>
                </div>
                <button onClick={()=>delEv(ev.id)} style={{background:"transparent",border:"1px solid #2d3245",borderRadius:7,width:28,height:28,color:"#5c6278",fontSize:13,flexShrink:0}}>🗑</button>
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
  const today=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;})();
  const [plans,setPlans]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({site:"",work:"",worker:"",memo:""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{load();},[]);
  const load=async()=>{
    if(!apiUrl) return;
    setLoading(true);
    try{const r=await apiGet(apiUrl,{action:"getPlans",date:today});if(r.ok)setPlans(r.data||[]);}catch{}
    setLoading(false);
  };
  const save=async()=>{
    if(!form.site||!form.work||!apiUrl) return;
    setSaving(true);
    try{await apiPost(apiUrl,{action:"addPlan",...form,date:today,status:"예정"});setForm({site:"",work:"",worker:"",memo:""});setShowForm(false);load();}catch{}
    setSaving(false);
  };
  const updateStatus=async(id,status)=>{
    try{await apiPost(apiUrl,{action:"updatePlan",id,status});load();}catch{}
  };

  const statusColor={예정:"#5c6278",진행중:"#3d8ef0",완료:"#3ec46d",보류:"#e04545"};

  return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
        <div><div style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>📝 금일계획</div><div style={{fontSize:11,color:"#5c6278"}}>{today.replace(/-/g,".")}</div></div>
        <button onClick={()=>setShowForm(p=>!p)} style={{marginLeft:"auto",background:"#ff9a3c",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>＋ 계획</button>
      </div>
      {!apiUrl&&<div style={{padding:"20px",background:"#f56e1a18",border:"1px solid #f56e1a44",margin:"16px",borderRadius:12,fontSize:13,color:"#f56e1a"}}>⚙️ 구글 연동 설정을 먼저 해주세요</div>}
      {showForm&&<div style={{padding:"14px 16px",background:"#1d2029",borderBottom:"1px solid #2d3245"}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={form.site} onChange={e=>setForm(p=>({...p,site:e.target.value}))} placeholder="현장명" style={{flex:1,background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#e8eaf2",fontSize:13,outline:"none"}}/>
          <input value={form.worker} onChange={e=>setForm(p=>({...p,worker:e.target.value}))} placeholder="담당자" style={{flex:1,background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#e8eaf2",fontSize:13,outline:"none"}}/>
        </div>
        <input value={form.work} onChange={e=>setForm(p=>({...p,work:e.target.value}))} placeholder="작업 내용" style={{width:"100%",background:"#13151c",border:"1px solid #2d3245",borderRadius:8,padding:"9px",color:"#e8eaf2",fontSize:13,marginBottom:8,boxSizing:"border-box",outline:"none"}}/>
        <button onClick={save} disabled={saving||!form.site||!form.work} style={{width:"100%",background:"#ff9a3c",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{saving?"저장 중...":"저장"}</button>
      </div>}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {loading&&<div style={{textAlign:"center",padding:"40px",color:"#5c6278"}}>⏳ 불러오는 중...</div>}
        {!loading&&!plans.length&&apiUrl&&<div style={{textAlign:"center",padding:"60px 20px",color:"#5c6278"}}><div style={{fontSize:40,marginBottom:12}}>📝</div><div style={{fontSize:13}}>오늘 계획이 없습니다</div></div>}
        {/* 요약 */}
        {plans.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
            {Object.entries(statusColor).map(([s,c])=>(
              <div key={s} style={{background:"#1d2029",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"monospace"}}>{plans.filter(p=>p["상태"]===s).length}</div>
                <div style={{fontSize:10,color:"#5c6278"}}>{s}</div>
              </div>
            ))}
          </div>
        )}
        {plans.map((p,i)=>(
          <div key={i} style={{background:"#1d2029",border:`1px solid ${statusColor[p["상태"]]||"#2d3245"}44`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#e8eaf2",marginBottom:2}}>{p["현장명"]}</div>
                <div style={{fontSize:12,color:"#8a8ea8"}}>{p["작업내용"]}</div>
                {p["담당자"]&&<div style={{fontSize:11,color:"#5c6278",marginTop:2}}>👤 {p["담당자"]}</div>}
              </div>
              <span style={{fontSize:11,background:`${statusColor[p["상태"]]}22`,color:statusColor[p["상태"]],borderRadius:6,padding:"3px 8px",fontWeight:700,flexShrink:0}}>{p["상태"]}</span>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["예정","진행중","완료","보류"].map(s=>(
                <button key={s} onClick={()=>updateStatus(p["ID"],s)}
                  style={{background:p["상태"]===s?statusColor[s]:"#13151c",border:`1px solid ${statusColor[s]}66`,borderRadius:6,padding:"4px 10px",color:p["상태"]===s?"#fff":statusColor[s],fontSize:11,cursor:"pointer",fontWeight:p["상태"]===s?700:400}}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 재단요청서 화면 ──────────────────────────────────────
function RequestScreen({reqs,setReqs,onBack}){
  const [selDate,setSelDate]=useState(null);
  const [detail,setDetail]=useState(null);
  const byDate={};
  for(const r of reqs){ if(!byDate[r.date]) byDate[r.date]=[]; byDate[r.date].push(r); }
  const dates=Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
  const deleteReq=(id)=>{
    if(!window.confirm("삭제할까요?")) return;
    const u=reqs.filter(r=>r.id!==id); setReqs(u); saveReqs(u);
    if(detail?.id===id) setDetail(null);
  };
  const pink="#ff4d88";
  const hdr=(title,sub,onB,right)=>(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 18px",borderBottom:"1px solid #1d2029",background:"#13151c"}}>
      <button onClick={onB} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:9,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:18}}>‹</button>
      <div><div style={{fontSize:15,fontWeight:800,color:"#e8eaf2"}}>{title}</div>{sub&&<div style={{fontSize:11,color:"#5c6278"}}>{sub}</div>}</div>
      {right&&<div style={{marginLeft:"auto"}}>{right}</div>}
    </div>
  );
  if(detail) return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      {hdr(`📄 ${detail.site||"재단요청서"}`,`${detail.date.replace(/-/g,".")} · ${detail.at?.replace("T"," ").slice(0,16)}`,()=>setDetail(null),
        <button onClick={()=>deleteReq(detail.id)} style={{background:"#e0454518",border:"1px solid #e0454544",borderRadius:8,padding:"6px 12px",color:"#e04545",fontSize:12,cursor:"pointer"}}>🗑 삭제</button>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[{l:"보드 수",v:`${detail.boards}장`,c:"#f56e1a"},{l:"면적",v:`${parseFloat(detail.m2||0).toFixed(4)}㎡`,c:"#3d8ef0"},{l:"효율",v:`${detail.eff}%`,c:"#3ec46d"}].map(s=>(
            <div key={s.l} style={{background:"#1d2029",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:900,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
              <div style={{fontSize:10,color:"#5c6278",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        {(detail.site||detail.note)&&<div style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12}}>
          {detail.site&&<div style={{color:"#e8eaf2",fontWeight:700,marginBottom:2}}>📍 {detail.site}</div>}
          {detail.note&&<div style={{color:"#5c6278"}}>{detail.note}</div>}
        </div>}
        <div style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #2d3245",fontSize:12,fontWeight:700,color:pink}}>✂ 재단 목록</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",padding:"6px 14px",fontSize:10,color:"#5c6278",fontWeight:700,borderBottom:"1px solid #2d324533"}}>
            <div>위치·면</div><div style={{textAlign:"right",paddingRight:14}}>치수(mm)</div><div style={{textAlign:"right"}}>수량</div>
          </div>
          {detail.cuts?.map((c,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",padding:"8px 14px",borderTop:i>0?"1px solid #2d324520":"none",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,color:"#e8eaf2",fontWeight:600}}>{c.label}</div>
                {c.faceLabel&&<div style={{fontSize:10,color:"#ff9a3c"}}>{c.faceLabel}</div>}
              </div>
              <div style={{fontSize:12,color:"#ff9a3c",fontFamily:"monospace",fontWeight:700,paddingRight:14,whiteSpace:"nowrap"}}>{c.w}×{c.h}mm</div>
              <div style={{fontSize:13,fontWeight:900,color:"#3ec46d",fontFamily:"monospace",whiteSpace:"nowrap"}}>{c.qty}장</div>
            </div>
          ))}
          <div style={{padding:"10px 14px",borderTop:"1px solid #2d3245",display:"flex",justifyContent:"space-between",background:"#161a22"}}>
            <span style={{fontSize:12,color:"#5c6278"}}>총 재단</span>
            <span style={{fontSize:14,fontWeight:900,color:pink,fontFamily:"monospace"}}>{detail.cuts?.reduce((s,c)=>s+c.qty,0)||0}장</span>
          </div>
        </div>
      </div>
    </div>
  );
  return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      {hdr("📄 재단요청서",null,onBack,
        <div style={{background:`${pink}22`,border:`1px solid ${pink}55`,borderRadius:16,padding:"3px 10px",fontSize:11,color:pink,fontWeight:700}}>{reqs.length}건</div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 32px"}}>
        {!reqs.length?(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#5c6278"}}>
            <div style={{fontSize:44,marginBottom:14}}>📄</div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:6,color:"#e8eaf2"}}>재단 요청이 없습니다</div>
            <div style={{fontSize:12}}>재단계산기 결과에서 요청하세요</div>
          </div>
        ):dates.map(date=>{
          const dayR=byDate[date], isOpen=selDate===date;
          return(
            <div key={date} style={{background:"#1d2029",border:`1px solid ${isOpen?pink:"#2d3245"}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
              <div onClick={()=>setSelDate(isOpen?null:date)} style={{display:"flex",alignItems:"center",padding:"13px 16px",cursor:"pointer"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:900,color:isOpen?pink:"#e8eaf2"}}>{date.replace(/-/g,".")}</div>
                  <div style={{fontSize:11,color:"#5c6278",marginTop:1}}>{dayR.length}건</div>
                </div>
                <div style={{textAlign:"right",marginRight:10}}>
                  <div style={{fontSize:10,color:"#5c6278"}}>총 보드</div>
                  <div style={{fontSize:16,fontWeight:900,color:pink,fontFamily:"monospace"}}>{dayR.reduce((s,r)=>s+(r.boards||0),0)}장</div>
                </div>
                <span style={{color:"#5c6278",fontSize:12}}>{isOpen?"▲":"▼"}</span>
              </div>
              {isOpen&&<div style={{borderTop:"1px solid #2d3245"}}>
                {dayR.map((req,i)=>(
                  <div key={req.id} style={{padding:"12px 16px",borderBottom:i<dayR.length-1?"1px solid #2d324533":"none",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>setDetail(req)}>
                      <div style={{fontSize:13,fontWeight:700,color:"#e8eaf2",marginBottom:4}}>{req.site||"현장명 없음"}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        <span style={{fontSize:10,color:"#5c6278"}}>{req.at?.replace("T"," ").slice(0,16)}</span>
                        <span style={{fontSize:10,background:"#f56e1a22",color:"#f56e1a",borderRadius:4,padding:"1px 6px"}}>보드 {req.boards}장</span>
                        <span style={{fontSize:10,background:"#3ec46d22",color:"#3ec46d",borderRadius:4,padding:"1px 6px"}}>효율 {req.eff}%</span>
                        <span style={{fontSize:10,background:`${pink}22`,color:pink,borderRadius:4,padding:"1px 6px"}}>재단 {req.cuts?.reduce((s,c)=>s+c.qty,0)||0}장</span>
                      </div>
                    </div>
                    <button onClick={()=>deleteReq(req.id)} style={{background:"transparent",border:"1px solid #2d3245",borderRadius:7,width:30,height:30,color:"#5c6278",fontSize:13,flexShrink:0}}>🗑</button>
                  </div>
                ))}
                <div style={{padding:"9px 16px",background:"#161a22",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"#5c6278"}}>{date.replace(/-/g,".")} 합계</span>
                  <span style={{fontSize:13,fontWeight:900,color:pink,fontFamily:"monospace"}}>{dayR.reduce((s,r)=>s+(r.boards||0),0)}장 · {dayR.reduce((s,r)=>s+(r.cuts?.reduce((a,c)=>a+c.qty,0)||0),0)}재단</span>
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComingSoon({title,icon,onBack}){
  return(
    <div style={{minHeight:"100vh",background:"#0f1015",fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1d2029"}}>
        <button onClick={onBack} style={{background:"#1d2029",border:"1px solid #2d3245",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",color:"#e8eaf2",fontSize:16}}>‹</button>
        <span style={{fontSize:16,fontWeight:800,color:"#e8eaf2"}}>{icon} {title}</span>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"40px 24px"}}>
        <div style={{fontSize:56}}>{icon}</div>
        <div style={{fontSize:20,fontWeight:900,color:"#e8eaf2"}}>{title}</div>
        <div style={{background:"#1d2029",border:"1px solid #f56e1a44",borderRadius:12,padding:"14px 24px",textAlign:"center"}}>
          <div style={{fontSize:13,color:"#f56e1a",fontWeight:700,marginBottom:4}}>🚧 준비 중입니다</div>
          <div style={{fontSize:12,color:"#5c6278"}}>곧 업데이트될 예정입니다</div>
        </div>
        <button onClick={onBack} style={{marginTop:8,background:"linear-gradient(135deg,#f56e1a,#ff9a3c)",border:"none",borderRadius:10,padding:"11px 32px",color:"#fff",fontSize:14,fontWeight:700}}>← 홈으로</button>
      </div>
    </div>
  );
}

// ── 로그인 화면 ──────────────────────────────────────────
function LoginScreen({onAuth}){
  const [input,setInput]=useState("");
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);
  const tryLogin=()=>{
    if(input===ACCESS_CODE){ localStorage.setItem(AUTH_KEY,"1"); onAuth(); }
    else{ setErr(true); setShake(true); setTimeout(()=>setShake(false),500); setTimeout(()=>setErr(false),2500); setInput(""); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Noto Sans KR',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{marginBottom:40,textAlign:"center"}}>
        <svg width="200" height="68" viewBox="0 0 200 68" style={{display:"block",margin:"0 auto 14px"}}>
          <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f56e1a"/><stop offset="100%" stopColor="#ff9a3c"/></linearGradient></defs>
          <rect width="200" height="68" rx="13" fill="url(#lg2)"/>
          <text x="100" y="26" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="3">SINCE 1984</text>
          <text x="100" y="55" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="3">Jaeam</text>
        </svg>
        <div style={{fontSize:14,color:"#555",fontWeight:700,letterSpacing:3}}>재암산업</div>
        <div style={{fontSize:12,color:"#aaa",marginTop:4}}>방화마감 통합 계산기</div>
      </div>
      <div style={{width:"100%",maxWidth:320,background:"#f8f9fa",borderRadius:16,padding:"28px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#222",marginBottom:6,textAlign:"center"}}>접속 코드 입력</div>
        <div style={{fontSize:12,color:"#999",textAlign:"center",marginBottom:20}}>허가된 사용자만 이용할 수 있습니다</div>
        <div style={{animation:shake?"shk 0.4s ease":"none"}}>
          <input type="password" value={input} onChange={e=>{setInput(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="접속 코드 입력" autoFocus
            style={{width:"100%",height:"48px",borderRadius:10,border:`2px solid ${err?"#e04545":"#e0e0e0"}`,padding:"0 16px",fontSize:15,fontFamily:"inherit",background:"#fff",color:"#222",outline:"none",textAlign:"center",letterSpacing:3,marginBottom:err?8:16,transition:"border-color .2s"}}/>
          {err&&<div style={{color:"#e04545",fontSize:12,textAlign:"center",marginBottom:12}}>❌ 코드가 올바르지 않습니다</div>}
        </div>
        <button onClick={tryLogin} style={{width:"100%",height:"48px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f56e1a,#ff9a3c)",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px rgba(245,110,26,0.4)"}}>입장하기</button>
      </div>
      <div style={{marginTop:24,fontSize:11,color:"#bbb",letterSpacing:1}}>JAEAM INDUSTRY Co., Ltd.</div>
    </div>
  );
}

function Splash({onDone}){
  const [show, setShow] = useState(false);
  const [bar,  setBar]  = useState(false);
  const [out,  setOut]  = useState(false);
  useEffect(()=>{
    document.body.style.cssText = "background:#fff;margin:0";
    const t0=setTimeout(()=>setShow(true), 80);
    const t1=setTimeout(()=>setBar(true),  260);
    const t2=setTimeout(()=>setOut(true),  2100);
    const t3=setTimeout(()=>{ document.body.style.cssText=""; onDone(); }, 2600);
    return ()=>{ [t0,t1,t2,t3].forEach(clearTimeout); document.body.style.cssText=""; };
  }, []);
  return (
    <div style={{position:"fixed",inset:0,zIndex:99999,background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",opacity:out?0:1,transition:out?"opacity 0.5s ease":"none",pointerEvents:out?"none":"auto"}}>
      <div style={{textAlign:"center",opacity:show?1:0,transform:show?"translateY(0)":"translateY(22px)",transition:show?"opacity 0.5s ease,transform 0.5s ease":"none"}}>
        <svg width="210" height="72" viewBox="0 0 210 72" style={{display:"block",margin:"0 auto"}}>
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f56e1a"/>
              <stop offset="100%" stopColor="#ff9a3c"/>
            </linearGradient>
          </defs>
          <rect width="210" height="72" rx="14" fill="url(#lg)"/>
          <text x="105" y="28" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="4">SINCE 1984</text>
          <text x="105" y="58" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="3">Jaeam</text>
        </svg>
        <div style={{marginTop:14,fontSize:14,color:"#444",fontWeight:700,letterSpacing:4}}>재암산업</div>
        <div style={{marginTop:5,fontSize:11,color:"#999",letterSpacing:1.5}}></div>
      </div>
      <div style={{position:"absolute",bottom:70,width:110,height:2,background:"#eee",borderRadius:2,overflow:"hidden",opacity:show?1:0,transition:"opacity 0.4s"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#f56e1a,#ff9a3c)",borderRadius:2,width:bar?"100%":"0%",transition:bar?"width 1.6s cubic-bezier(.25,.8,.25,1)":"none"}}/>
      </div>
      <div style={{position:"absolute",bottom:44,fontSize:10,color:"#bbb",letterSpacing:2.5,opacity:show?1:0,transition:"opacity 0.5s ease 0.3s"}}>JAEAM INDUSTRY Co., Ltd.</div>
    </div>
  );
}

// ── 메인 앱 ──────────────────────────────────────────────
export default function App(){
  const [authed,setAuthed]=useState(()=>{ try{ return localStorage.getItem(AUTH_KEY)==="1"; }catch{ return false; } });
  const [homeTab,setHomeTab]=useState("home");
  const [apiUrl,setApiUrl]=useState(()=>{ try{return localStorage.getItem(API_KEY)||"";}catch{return "";} });
  const [splash,   setSplash]   = useState(true);
  const [mainTab,  setMainTab]  = useState("board");
  const [logs,     setLogs]     = useState([]);
  const [specOpen, setSpecOpen] = useState(false);
  const [selDate,  setSelDate]  = useState(null);
  useEffect(()=>setLogs(loadLogs()),[]);

  // 방화보드 state
  const [BW, setBW] = useState("1220");
  const [BH, setBH] = useState("2440");
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
  const [reqSaved, setReqSaved] = useState(false);
  const [reqs,     setReqs]     = useState([]);
  useEffect(()=>setReqs(loadReqs()),[]);

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
    const entry={id:Date.now(),date:wDate,at:new Date().toISOString(),note:wNote,type:"board",boards:bResult.boards,m2:bResult.m2,eff:bResult.eff};
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
      boards:bResult.boards,
      m2:bResult.m2,
      eff:bResult.eff,
      cuts,
    };
    const u=[req,...reqs]; setReqs(u); saveReqs(u);
    setReqSaved(true); setTimeout(()=>setReqSaved(false),2500);
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

  if(!authed) return <LoginScreen onAuth={()=>setAuthed(true)}/>;
  if(homeTab==="home") return <HomeScreen onMenu={setHomeTab}/>;
  if(homeTab==="notice")   return <NoticeScreen   apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="connect")   return <ConnectScreen  apiUrl={apiUrl} setApiUrl={(u)=>{setApiUrl(u);localStorage.setItem(API_KEY,u);}} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="spec")     return <ComingSoon title="시방서"     icon="📋" onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="schedule") return <ScheduleScreen apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="plan")     return <PlanScreen     apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="request")  return <RequestScreen reqs={reqs} setReqs={setReqs} apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;
  if(homeTab==="photo")    return <PhotoScreen    apiUrl={apiUrl} onBack={()=>setHomeTab("home")}/>;

  return (
    <div style={{background:C.bg,minHeight:"100vh"}}>
      {splash && <Splash onDone={()=>setSplash(false)}/>}
      <div style={{visibility:hidden?"hidden":"visible",opacity:hidden?0:1,transition:"opacity 0.3s ease 0.1s",minHeight:"100vh",color:C.txt,fontFamily:"'Noto Sans KR',sans-serif",padding:"14px 12px 60px"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{-webkit-font-smoothing:antialiased}input,select,button{font-family:inherit}input:focus,select:focus{outline:none;border-color:#f56e1a!important;box-shadow:0 0 0 2px #f56e1a18}input::placeholder{color:#3a4055}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2d3245;border-radius:2px}button{cursor:pointer}button:active{opacity:.75}select{cursor:pointer}`}</style>
        <div style={{maxWidth:740,margin:"0 auto"}}>

          {/* 헤더 */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {/* 재암산업 로고 */}
                <svg width="130" height="38" viewBox="0 0 130 38">
                  <defs>
                    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f56e1a"/>
                      <stop offset="100%" stopColor="#ff9a3c"/>
                    </linearGradient>
                  </defs>
                  {/* 아이콘 박스 */}
                  <rect x="0" y="0" width="38" height="38" rx="9" fill="url(#hg)"/>
                  <path d="M19 6L9 12v10l10 6 10-6V12z" fill="white" fillOpacity=".18" stroke="white" strokeWidth="1.2"/>
                  <path d="M19 10l-7 4v8l7 4 7-4v-8z" fill="white" fillOpacity=".28"/>
                  <circle cx="19" cy="19" r="3" fill="white"/>
                  {/* 텍스트 */}
                  <text x="46" y="16" fill="#f56e1a" fontSize="9.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1.5">SINCE 1984</text>
                  <text x="46" y="33" fill="#e8eaf2" fontSize="18" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="1">Jaeam</text>
                </svg>
              </div>
              <button onClick={()=>setHomeTab("home")} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:"5px 14px",fontSize:11,color:C.mut,cursor:"pointer",fontFamily:"inherit"}}>⌂ 홈</button>
            </div>
            <div style={{height:"1px",background:`linear-gradient(90deg,${C.acc}66,${C.line}44,transparent)`,marginTop:14}}/>
          </div>

          {/* 메인 탭 */}
          <div style={{display:"flex",gap:6,marginBottom:20,background:C.sur,borderRadius:14,padding:5,border:`1px solid ${C.line}`}}>
            {[["board","🔥","방화보드"],["insul","🧱","차열재"],["history","📅","작업현황"]].map(([k,ic,lb])=>{
              const active=mainTab===k;
              return (
                <button key={k} onClick={()=>setMainTab(k)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:active?`linear-gradient(135deg,${C.acc},${C.acc2}cc)`:C.sur,border:`1px solid ${active?C.acc:"transparent"}`,borderRadius:10,padding:"10px 6px",color:active?"#fff":C.mut,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s",boxShadow:active?`0 3px 14px ${C.acc}44`:"none"}}>
                  <span style={{fontSize:16}}>{ic}</span>
                  <span>{lb}</span>
                </button>
              );
            })}
          </div>

          {/* ══ 방화보드 ══ */}
          {mainTab==="board" && (
            <div>
              {/* 보드 규격 */}
              <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:"14px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:3,height:16,background:C.acc,borderRadius:2}}/>
                  <span style={{fontSize:13,fontWeight:800,color:C.txt}}>방화보드 규격</span>
                  <div style={{marginLeft:"auto",display:"flex",gap:5}}>
                    {[["1220","2440"],["900","1800"],["600","1200"]].map(([w,h])=>(
                      <button key={w} onClick={()=>{setBW(w);setBH(h);}} style={{background:BW===w&&BH===h?C.acc:"transparent",border:`1px solid ${BW===w&&BH===h?C.acc:C.line}`,borderRadius:6,padding:"3px 8px",color:BW===w&&BH===h?"#fff":C.mut,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>{w}×{h}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1}}><Lbl c="가로 (mm)"/><input style={SI} type="number" value={BW} onChange={e=>setBW(e.target.value)}/></div>
                  <div style={{color:C.mut,fontSize:18,paddingTop:16}}>×</div>
                  <div style={{flex:1}}><Lbl c="세로 (mm)"/><input style={SI} type="number" value={BH} onChange={e=>setBH(e.target.value)}/></div>
                </div>
              </div>

              {/* 서브탭 */}
              <div style={{display:"flex",gap:5,marginBottom:14}}>
                {[["input","입력"],["result","결과"]].map(([k,lb])=>(
                  <button key={k} onClick={()=>setBTab(k)} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:`1px solid ${bTab===k?C.acc:C.line}`,background:bTab===k?C.acc:C.sur,color:bTab===k?"#fff":C.mut,transition:"all .15s"}}>
                    {lb}{k==="result"&&bErrs.length>0&&<span style={{marginLeft:5,background:C.err,color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:10}}>오류</span>}
                  </button>
                ))}
              </div>

              {/* 입력 */}
              {bTab==="input" && (
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    <button onClick={()=>setBItems(p=>[...p,mkDuct2()])} style={{flex:1,background:`${C.acc}11`,border:`1px solid ${C.acc}44`,borderRadius:12,padding:"13px",color:C.acc,cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 덕트</button>
                    <button onClick={()=>setBItems(p=>[...p,mkGroup()])}  style={{flex:1,background:`${C.blu}11`,border:`1px solid ${C.blu}44`,borderRadius:12,padding:"13px",color:C.blu,cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 배관</button>
                  </div>
                  {bItems.length===0&&(
                    <div style={{textAlign:"center",padding:"36px 20px",color:C.mut,background:C.sur,borderRadius:12,marginBottom:10,border:`1px dashed ${C.line}`}}>
                      <div style={{fontSize:28,marginBottom:8}}>👆</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:C.txt}}>덕트 또는 배관을 추가해주세요</div>
                      <div style={{fontSize:11}}>위 버튼을 눌러 항목을 추가하세요</div>
                    </div>
                  )}
                  {bItems.map((item,idx)=>{
                    const hasErr=bErrIds.has(item.id);
                    const errMsg=bErrs.find(e=>e.idx===idx)?.msg;
                    const updB = (patch) => setBItems(p=>p.map(it=>it.id===item.id?{...it,...patch}:it));
                    const updP = (pid,f,v) => setBItems(p=>p.map(it=>it.id!==item.id?it:{...it,pipes:it.pipes.map(pp=>pp.id===pid?{...pp,[f]:v}:pp)}));
                    return (
                      <div key={item.id} style={{background:C.card,border:`1px solid ${hasErr?C.err:item.type==="group"?C.blu+"44":C.bdr}`,borderRadius:14,padding:"14px",marginBottom:10}}>
                        {hasErr&&<div style={{background:C.err+"20",borderRadius:7,padding:"6px 10px",marginBottom:8,fontSize:12,color:C.err,borderLeft:`3px solid ${C.err}`}}>❌ {errMsg}</div>}
                        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
                          <span style={{background:hasErr?C.err:item.type==="group"?C.blu:C.acc,color:"#fff",borderRadius:5,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                          <span style={{fontSize:11,color:item.type==="group"?C.blu:C.acc,fontWeight:700,background:item.type==="group"?C.blu+"22":C.acc+"22",padding:"2px 6px",borderRadius:4}}>{item.type==="group"?"배관":"덕트"}</span>
                          <input style={{...SI,flex:1,height:"28px"}} value={item.label} placeholder="위치명" onChange={e=>updB({label:e.target.value})}/>
                          {bItems.length>1&&<button onClick={()=>setBItems(p=>p.filter(it=>it.id!==item.id))} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:5,width:24,height:24,cursor:"pointer",color:C.mut,fontSize:13}}>×</button>}
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
                                <div style={{background:C.sur,border:`1px solid ${C.acc}33`,borderRadius:8,padding:"10px 12px"}}>
                                  <div style={{fontSize:11,fontWeight:700,color:C.acc,marginBottom:8}}>📐 설치 단면 미리보기</div>
                                  <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                                    <svg width={svgW} height={svgH} style={{flexShrink:0}}>
                                      {/* 덕트 본체 */}
                                      <rect x={ox} y={oy} width={bw} height={bh} fill={cD} stroke="#4a5e72" strokeWidth="1.2"/>
                                      {/* 가로면-상 (덕트가로×폭) */}
                                      <rect x={ox} y={oy-fw} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5"/>
                                      {/* 가로면-하 (덕트가로×폭) */}
                                      <rect x={ox} y={oy+bh} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5"/>
                                      {/* 세로면-좌 ((덕트세로+폭×2)×폭) */}
                                      <rect x={ox-fw} y={oy-fw} width={fw} height={bh+fw*2} fill={cLR} stroke={C.acc} strokeWidth="1.5"/>
                                      {/* 세로면-우 ((덕트세로+폭×2)×폭) */}
                                      <rect x={ox+bw} y={oy-fw} width={fw} height={bh+fw*2} fill={cLR} stroke={C.acc} strokeWidth="1.5"/>
                                      {/* 덕트 중심선 */}
                                      <line x1={ox+bw/2} y1={oy} x2={ox+bw/2} y2={oy+bh} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="4,3"/>
                                      <line x1={ox} y1={oy+bh/2} x2={ox+bw} y2={oy+bh/2} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="4,3"/>
                                      {/* 가로 치수 (전체) */}
                                      <line x1={ox-fw} y1={svgH-6} x2={ox+bw+fw} y2={svgH-6} stroke={C.acc2} strokeWidth=".9"/>
                                      <line x1={ox-fw} y1={svgH-10} x2={ox-fw} y2={svgH-2} stroke={C.acc2} strokeWidth=".9"/>
                                      <line x1={ox+bw+fw} y1={svgH-10} x2={ox+bw+fw} y2={svgH-2} stroke={C.acc2} strokeWidth=".9"/>
                                      <text x={ox+bw/2} y={svgH} textAnchor="middle" fill={C.acc2} fontSize="8" fontFamily="monospace">{dW+fold*2}mm</text>
                                      {/* 세로 치수 (전체) */}
                                      <line x1={ox-fw-12} y1={oy-fw} x2={ox-fw-12} y2={oy+bh+fw} stroke={C.acc2} strokeWidth=".9"/>
                                      <line x1={ox-fw-16} y1={oy-fw} x2={ox-fw-8} y2={oy-fw} stroke={C.acc2} strokeWidth=".9"/>
                                      <line x1={ox-fw-16} y1={oy+bh+fw} x2={ox-fw-8} y2={oy+bh+fw} stroke={C.acc2} strokeWidth=".9"/>
                                      <text x={ox-fw-14} y={oy+bh/2+4} textAnchor="middle" fill={C.acc2} fontSize="8" fontFamily="monospace" transform={`rotate(-90,${ox-fw-14},${oy+bh/2})`}>{dH+fold*2}mm</text>
                                    </svg>
                                    <div style={{fontSize:11,lineHeight:2.1,color:C.mut}}>
                                      <div style={{marginBottom:6}}>
                                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                                          <span style={{width:12,height:10,background:cTB,border:`1px solid ${C.acc}`,borderRadius:1,display:"inline-block"}}/>
                                          <span style={{fontWeight:700,color:C.txt}}>가로면 (상/하)</span>
                                        </div>
                                        <span style={{color:C.acc2,fontWeight:700,fontFamily:"monospace"}}>{dW}×{fold}mm</span>
                                        <span style={{color:C.acc,marginLeft:6}}>×2장</span>
                                      </div>
                                      <div>
                                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                                          <span style={{width:12,height:10,background:cLR,border:`1px solid ${C.acc}`,borderRadius:1,display:"inline-block"}}/>
                                          <span style={{fontWeight:700,color:C.txt}}>세로면 (좌/우)</span>
                                        </div>
                                        <span style={{color:C.acc2,fontWeight:700,fontFamily:"monospace"}}>{vertW}×{fold}mm</span>
                                        <span style={{color:C.acc,marginLeft:6}}>×2장</span>
                                        <div style={{fontSize:10,color:C.mut}}>({dH}+{fold}×2={vertW})</div>
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
                            <div style={{display:"flex",gap:5,marginBottom:9,background:C.sur,borderRadius:8,padding:3}}>
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
                                <div style={{fontSize:11,color:C.mut,marginBottom:7,background:C.sur,borderRadius:6,padding:"6px 9px"}}>직경·간격·하단~배관끝(mm) 입력</div>
                                {item.pipes.map((pp,pi)=>(
                                  <div key={pp.id} style={{display:"flex",gap:6,marginBottom:6,alignItems:"flex-end"}}>
                                    <div style={{width:12,height:12,borderRadius:"50%",background:C.pipe[pi%C.pipe.length],flexShrink:0,marginBottom:10}}/>
                                    <div style={{flex:1}}><Lbl c="직경"/><input style={SI} type="number" value={pp.d} onChange={e=>updP(pp.id,"d",e.target.value)}/></div>
                                    <div style={{flex:1.2}}><Lbl c={pi===0?"좌끝~배관외면":"앞배관~배관외면"}/><input style={SI} type="number" value={pp.gap} onChange={e=>updP(pp.id,"gap",e.target.value)}/></div>
                                    <div style={{flex:1}}><Lbl c="하단~배관끝"/><input style={SI} type="number" value={pp.fromBottom} onChange={e=>updP(pp.id,"fromBottom",e.target.value)}/></div>
                                    {item.pipes.length>1&&<button onClick={()=>setBItems(p=>p.map(it=>it.id!==item.id?it:{...it,pipes:it.pipes.filter(x=>x.id!==pp.id)}))} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:5,width:24,height:24,cursor:"pointer",color:C.mut,fontSize:12,flexShrink:0}}>×</button>}
                                  </div>
                                ))}
                                <button onClick={()=>setBItems(p=>p.map(it=>it.id===item.id?{...it,pipes:[...it.pipes,mkPipe2()]}:it))} style={{background:"transparent",border:`1px dashed ${C.blu}55`,borderRadius:6,padding:"5px 10px",color:C.blu,cursor:"pointer",fontSize:11,width:"100%",marginTop:2}}>+ 배관 추가</button>
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

              {/* 결과 */}
              {bTab==="result" && (
                <div>
                  {bErrs.length>0&&(
                    <div style={{background:C.err+"18",border:`1.5px solid ${C.err}55`,borderRadius:12,padding:"13px",marginBottom:10}}>
                      <div style={{fontWeight:900,color:C.err,fontSize:14,marginBottom:8}}>🚫 계산 오류</div>
                      {bErrs.map((e,i)=><div key={i} style={{fontSize:12,color:C.err,marginBottom:4}}>❌ 항목{e.idx+1}{e.label&&` [${e.label}]`} — {e.msg}</div>)}
                      <button onClick={()=>setBTab("input")} style={{marginTop:8,width:"100%",background:"transparent",border:`1.5px solid ${C.acc}`,borderRadius:8,padding:"9px",color:C.acc,cursor:"pointer",fontSize:13,fontWeight:700}}>← 수정하러 가기</button>
                    </div>
                  )}
                  {bWarns.length>0&&<div style={{background:C.acc2+"20",border:`1px solid ${C.acc2}44`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>{bWarns.map((w,i)=><div key={i} style={{color:C.acc2,fontSize:12}}>⚡ {w}</div>)}</div>}
                  {bResult&&(
                    <div>
                      <button onClick={()=>setBTab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:C.mut,cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
                      {/* 요약 */}
                      <div style={{background:`linear-gradient(135deg,${C.acc}18,${C.card})`,border:`1px solid ${C.acc}55`,borderRadius:14,padding:"16px",marginBottom:12}}>
                        <SectionTitle icon="📊" title="계산 결과 요약" color={C.acc}/>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                          {[{l:"필요 보드 수",v:`${bResult.boards}장`,c:C.acc},{l:"작업 면적",v:`${bResult.m2.toFixed(4)}㎡`,c:C.blu},{l:"자재 효율",v:`${bResult.eff}%`,c:C.grn},{l:"총 재단 수",v:`${bResult.pieces.length}개`,c:C.acc2}].map(s=>(
                            <div key={s.l} style={{background:C.card,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                              <div style={{fontSize:20,fontWeight:900,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
                              <div style={{fontSize:10,color:C.mut,marginTop:2}}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:C.card,borderRadius:8,padding:"10px 12px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.mut,marginBottom:7}}>재단 목록</div>
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
                                <span style={{fontSize:11,color:C.mut,fontFamily:"monospace"}}>{Math.round(g.w)}×{Math.round(g.h)}mm</span>
                                <span style={{background:C.acc+"33",color:C.acc,borderRadius:4,padding:"1px 6px",fontSize:11,fontWeight:700}}>×{g.count}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                      {/* 도면 */}
                      <div style={{background:C.card,border:`1px solid ${C.blu}44`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                        <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.line}`,background:`linear-gradient(90deg,${C.blu}15,transparent)`}}>
                          <SectionTitle icon="📐" title="재단 도면" color={C.blu}/>
                        </div>
                        <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${C.bdr}`}}>
                          {bResult.diagrams.map((d,i)=>(
                            <button key={i} onClick={()=>setBDrawTab(i)} style={{padding:"7px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:bDrawTab===i?C.sur:"transparent",color:bDrawTab===i?C.txt:C.mut,borderBottom:bDrawTab===i?`2px solid ${C.blu}`:"2px solid transparent",border:"none",cursor:"pointer"}}>
                              {d.isGroup?"⊞":d.isFaceGroup?"◧":"■"} {d.label||`항목${i+1}`}
                              {d.isFaceGroup&&<span style={{marginLeft:3,fontSize:9,color:C.acc2}}>4면</span>}
                              {!d.isFaceGroup&&d.count>1&&<span style={{marginLeft:3,fontSize:9,color:C.acc}}>×{d.count}</span>}
                            </button>
                          ))}
                        </div>
                        {bResult.diagrams.map((d,i)=>i!==bDrawTab?null:(
                          <div key={i} style={{padding:"12px"}}>
                            <div style={{background:C.sur,borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:12,lineHeight:1.9}}>
                              {d.isFaceGroup?(
                                <>
                                  <div style={{fontWeight:700,color:C.acc,marginBottom:6}}>✂ 면별 재단</div>
                                  <div style={{color:C.txt}}>① 가로면(상/하): <span style={{color:C.acc2,fontWeight:700}}>{d.horzW}×{d.horzH}mm</span> <span style={{color:C.mut}}>× 2장</span></div>
                                  <div style={{color:C.txt}}>② 세로면(좌/우): <span style={{color:C.acc2,fontWeight:700}}>{d.vertW}×{d.vertH}mm</span> <span style={{color:C.mut}}>× 2장</span> <span style={{fontSize:10,color:C.mut}}>(세로{d.vertW-(d.horzH||0)*2}+폭{d.horzH}×2)</span></div>
                                  <div style={{marginTop:4,fontSize:11,color:C.mut}}>수량당 4장 · 총 {d.count}장</div>
                                </>
                              ):d.isGroup?(
                                <>
                                  <div style={{fontWeight:700,color:C.blu,marginBottom:4}}>✂ 재단 순서</div>
                                  <div style={{color:C.txt}}>① 보드 <span style={{color:C.acc2,fontWeight:700}}>{d.bw}×{d.bh}mm</span> 재단</div>
                                  {d.pipes?.map((p,pi)=>{const dX=Math.round(p.bx),dY=Math.round(p.cy!==undefined?p.cy:(d.bh-(d.mb||0)-p.by));return <div key={pi} style={{color:C.txt}}>② <span style={{color:C.pipe[pi%C.pipe.length],fontWeight:700}}>{pi+1}타공</span> X={dX} Y={dY} <span style={{color:C.pipe[pi%C.pipe.length],fontWeight:700}}>Ø{p.d}mm</span></div>;})}
                                </>
                              ):(
                                <>
                                  <div style={{fontWeight:700,color:C.blu,marginBottom:4}}>✂ 재단 방법</div>
                                  <div style={{color:C.txt}}>① 가로 <span style={{color:C.acc2,fontWeight:700}}>{Math.round(d.w)}mm</span></div>
                                  <div style={{color:C.txt}}>② 세로 <span style={{color:C.acc2,fontWeight:700}}>{Math.round(d.h)}mm</span></div>
                                  <div style={{color:C.txt}}>③ 직각 확인 후 절단{d.count>1&&<span style={{color:C.acc}}> ×{d.count}장</span>}</div>
                                </>
                              )}
                            </div>
                            <div style={{background:C.sur,borderRadius:8,padding:10,overflowX:"auto"}}>
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
                                const cD="#2e3d50", cTB="#f56e1a", cLR="#3d8ef0";
                                return (
                                  <svg width={W} height={H} style={{display:"block",margin:"0 auto",maxWidth:"100%"}}>

                                    {/* ── 덕트 본체 ── */}
                                    <rect x={ox+fw} y={oy+fw} width={bw} height={bh} fill={cD} stroke="#4a5e72" strokeWidth="1.2" rx="1"/>

                                    {/* ── 세로면(좌/우) 파란색 ── */}
                                    <rect x={ox}      y={oy} width={fw} height={bh+fw*2} fill={cLR} stroke="#5aaaf8" strokeWidth="1.5" rx="2"/>
                                    <rect x={ox+fw+bw} y={oy} width={fw} height={bh+fw*2} fill={cLR} stroke="#5aaaf8" strokeWidth="1.5" rx="2"/>

                                    {/* ── 가로면(상/하) 주황색 ── */}
                                    <rect x={ox+fw} y={oy}      width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5" rx="2"/>
                                    <rect x={ox+fw} y={oy+fw+bh} width={bw} height={fw} fill={cTB} stroke={C.acc} strokeWidth="1.5" rx="2"/>

                                    {/* 덕트 중심선 */}
                                    <line x1={ox+fw} y1={oy+fw+bh/2} x2={ox+fw+bw} y2={oy+fw+bh/2} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="5,4"/>
                                    <line x1={ox+fw+bw/2} y1={oy+fw} x2={ox+fw+bw/2} y2={oy+fw+bh} stroke="#ffffff18" strokeWidth=".8" strokeDasharray="5,4"/>

                                    {/* ── 치수: 전체 가로 (하단) ── */}
                                    <line x1={ox} y1={oy+bh+fw*2+10} x2={ox+bw+fw*2} y2={oy+bh+fw*2+10} stroke="#aaa" strokeWidth=".8"/>
                                    <line x1={ox} y1={oy+bh+fw*2+6} x2={ox} y2={oy+bh+fw*2+14} stroke="#aaa" strokeWidth=".8"/>
                                    <line x1={ox+bw+fw*2} y1={oy+bh+fw*2+6} x2={ox+bw+fw*2} y2={oy+bh+fw*2+14} stroke="#aaa" strokeWidth=".8"/>
                                    <text x={ox+(bw+fw*2)/2} y={oy+bh+fw*2+24} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace">{dW+fold*2}mm</text>

                                    {/* ── 치수: 전체 세로 (좌측) ── */}
                                    <line x1={ox-10} y1={oy} x2={ox-10} y2={oy+bh+fw*2} stroke="#aaa" strokeWidth=".8"/>
                                    <line x1={ox-14} y1={oy} x2={ox-6} y2={oy} stroke="#aaa" strokeWidth=".8"/>
                                    <line x1={ox-14} y1={oy+bh+fw*2} x2={ox-6} y2={oy+bh+fw*2} stroke="#aaa" strokeWidth=".8"/>
                                    <text x={ox-12} y={oy+(bh+fw*2)/2+4} textAnchor="middle" fill="#aaa" fontSize="9" fontFamily="monospace" transform={`rotate(-90,${ox-28},${oy+(bh+fw*2)/2})`}>{dH+fold*2}mm</text>

                                    {/* ── 치수: 덕트 가로 ── */}
                                    <line x1={ox+fw} y1={oy+bh+fw*2+34} x2={ox+fw+bw} y2={oy+bh+fw*2+34} stroke={cTB} strokeWidth=".8"/>
                                    <line x1={ox+fw} y1={oy+bh+fw*2+30} x2={ox+fw} y2={oy+bh+fw*2+38} stroke={cTB} strokeWidth=".8"/>
                                    <line x1={ox+fw+bw} y1={oy+bh+fw*2+30} x2={ox+fw+bw} y2={oy+bh+fw*2+38} stroke={cTB} strokeWidth=".8"/>
                                    <text x={ox+fw+bw/2} y={oy+bh+fw*2+48} textAnchor="middle" fill={cTB} fontSize="9" fontWeight="700" fontFamily="monospace">{dW}mm</text>

                                    {/* ── 범례 ── */}
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
                      {/* 배치 */}
                      <div style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:12,padding:"12px",marginBottom:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.mut,marginBottom:8}}>보드 배치 ({bResult.bw}×{bResult.bh}mm)</div>
                        <div style={{overflowX:"auto"}}>
                          {(()=>{
                            const PAD_L=44, PAD_B=28;
                            const svgW=bResult.bw*scale+PAD_L+8;
                            const svgH=Math.min(bResult.totalH,bResult.bh)*scale+PAD_B+8;
                            const ox=PAD_L, oy=4;
                            return (
                              <svg width={svgW} height={svgH} style={{display:"block",margin:"0 auto"}}>
                                {/* 보드 배경 */}
                                <rect x={ox} y={oy} width={bResult.bw*scale} height={Math.min(bResult.totalH,bResult.bh)*scale} fill={C.sur} stroke={C.bdr} strokeWidth={1.5} rx={3}/>
                                {/* 격자 */}
                                {[...Array(Math.floor(bResult.bw/200))].map((_,i)=><line key={`v${i}`} x1={ox+(i+1)*200*scale} y1={oy} x2={ox+(i+1)*200*scale} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.bdr} strokeWidth={.5} strokeDasharray="3,3"/>)}
                                {/* 재단 피스 */}
                                {bResult.rows.flatMap((row,ri)=>row.pieces.map((p,pi)=>{
                                  const hue=(ri*60+pi*40)%360;
                                  const px2=ox+p.x*scale, py2=oy+row.y*scale, pw=p.w*scale, ph=p.h*scale;
                                  return (
                                    <g key={`${ri}-${pi}`}>
                                      {p.shape==="group"||p.shape==="group_split"
                                        ?<><rect x={px2} y={py2} width={pw} height={ph} fill={C.blu+"20"} stroke={C.blu} strokeWidth={1.5} rx={2}/>{p.pipes?.map((pp,ppi)=><circle key={ppi} cx={px2+(pp.bx/p.bw)*pw} cy={py2+(pp.by/p.bh)*ph} r={Math.max((pp.d/2/p.bw)*pw,2)} fill={C.pipe[ppi%C.pipe.length]+"55"} stroke={C.pipe[ppi%C.pipe.length]} strokeWidth={1}/>)}</>
                                        :<rect x={px2} y={py2} width={pw} height={ph} fill={`hsla(${hue},55%,55%,.28)`} stroke={`hsla(${hue},65%,65%,.9)`} strokeWidth={1.2} rx={2}/>}
                                      {/* 피스 라벨 */}
                                      {pw>30&&ph>14&&<text x={px2+pw/2} y={py2+ph/2-3} textAnchor="middle" fill="#fff" fontSize={Math.min(pw/7,9)} fontWeight="700">{p.label}</text>}
                                      {/* 피스 치수 */}
                                      {pw>38&&ph>18&&<text x={px2+pw/2} y={py2+ph/2+7} textAnchor="middle" fill="#ffffff99" fontSize={Math.min(pw/9,8)} fontFamily="monospace">{Math.round(p.w)}×{Math.round(p.h)}</text>}
                                    </g>
                                  );
                                }))}
                                {/* 세로 치수선 (좌측) */}
                                <line x1={ox-6} y1={oy} x2={ox-6} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.acc2} strokeWidth={1}/>
                                <line x1={ox-11} y1={oy} x2={ox-1} y2={oy} stroke={C.acc2} strokeWidth={1}/>
                                <line x1={ox-11} y1={oy+Math.min(bResult.totalH,bResult.bh)*scale} x2={ox-1} y2={oy+Math.min(bResult.totalH,bResult.bh)*scale} stroke={C.acc2} strokeWidth={1}/>
                                <text x={ox-8} y={oy+Math.min(bResult.totalH,bResult.bh)*scale/2+4} textAnchor="end" fill={C.acc2} fontSize={9} fontWeight="700" fontFamily="monospace" transform={`rotate(-90,${ox-26},${oy+Math.min(bResult.totalH,bResult.bh)*scale/2})`}>{bResult.bh}mm</text>
                                {/* 가로 치수선 (하단) */}
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
                      {/* 저장 */}
                      <div style={{background:C.card,border:`1px solid ${C.grn}44`,borderRadius:12,padding:"12px 13px",marginBottom:12}}>
                        <SectionTitle icon="💾" title="작업 저장 · 재단 요청" color={C.grn}/>
                        <div style={{display:"flex",gap:7,marginBottom:7}}>
                          <div style={{flex:1}}><Lbl c="날짜"/><input style={SI} type="date" value={wDate} onChange={e=>setWDate(e.target.value)}/></div>
                          <div style={{flex:1}}><Lbl c="현장명"/><input style={SI} value={wSite} onChange={e=>setWSite(e.target.value)} placeholder="현장명 입력"/></div>
                          <div style={{flex:1}}><Lbl c="메모"/><input style={SI} value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="메모"/></div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={saveBoard} style={{flex:1,background:saved?C.grn:C.sur,border:`1.5px solid ${saved?C.grn:C.bdr}`,borderRadius:8,padding:"10px",color:saved?"#fff":C.txt,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .3s"}}>{saved?"✅ 저장됨":"💾 작업 저장"}</button>
                          <button onClick={saveRequest} style={{flex:1.4,background:reqSaved?"#ff4d88":C.sur,border:`1.5px solid ${reqSaved?"#ff4d88":"#ff4d8855"}`,borderRadius:8,padding:"10px",color:reqSaved?"#fff":"#ff4d88",cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .3s"}}>{reqSaved?"✅ 요청 완료!":"📄 재단 요청하기"}</button>
                        </div>
                      </div>
                      <button onClick={()=>setBTab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:C.mut,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ 차열재 ══ */}
          {mainTab==="insul" && (
            <div>
              {/* 규정표 */}
              <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
                <button onClick={()=>setSpecOpen(p=>!p)} style={{width:"100%",background:"transparent",border:"none",padding:"13px 14px",color:C.txt,cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:3,height:16,background:C.pur,borderRadius:2}}/>
                    <span>시공 규정표</span>
                  </div>
                  <span style={{color:C.mut,fontSize:12}}>{specOpen?"▲":"▼"}</span>
                </button>
                {specOpen&&(
                  <div style={{borderTop:`1px solid ${C.line}`}}>
                    {STYPES.map(type=>(
                      <div key={type} style={{borderBottom:`1px solid ${C.line}`}}>
                        <div style={{background:`${C.pur}22`,padding:"6px 14px",fontSize:11,fontWeight:700,color:C.pur}}>{type}</div>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <tbody>{SPEC[type].map((row,i)=>(
                            <tr key={i} style={{borderTop:`1px solid ${C.line}33`}}>
                              <td style={{padding:"7px 14px",fontSize:12,color:C.txt,width:"40%"}}>{row.range}</td>
                              <td style={{padding:"7px 14px",fontSize:12,color:C.acc2,fontWeight:700}}>{row.steps.length===0?"시공 없음":row.steps.map(s=>`${s.t} ${s.mm}mm`).join(" / ")}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 서브탭 */}
              <div style={{display:"flex",gap:5,marginBottom:14}}>
                {[["input","입력"],["result","결과"]].map(([k,lb])=>(
                  <button key={k} onClick={()=>k==="result"?calcInsul():setITab("input")} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:`1px solid ${iTab===k?C.pur:C.line}`,background:iTab===k?C.pur:C.sur,color:iTab===k?"#fff":C.mut,transition:"all .15s"}}>{lb}</button>
                ))}
              </div>

              {iTab==="input"&&(
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    <button onClick={()=>setIItems(p=>[...p,mkInsDuct()])} style={{flex:1,background:`${C.pur}11`,border:`1px solid ${C.pur}44`,borderRadius:12,padding:"13px",color:C.pur,cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 덕트</button>
                    <button onClick={()=>setIItems(p=>[...p,mkIns()])}     style={{flex:1,background:`${C.blu}11`,border:`1px solid ${C.blu}44`,borderRadius:12,padding:"13px",color:C.blu,cursor:"pointer",fontSize:14,fontWeight:800,letterSpacing:-.3}}>＋ 배관</button>
                  </div>
                  {iItems.length===0&&(
                    <div style={{textAlign:"center",padding:"36px 20px",color:C.mut,background:C.sur,borderRadius:12,marginBottom:10,border:`1px dashed ${C.line}`}}>
                      <div style={{fontSize:28,marginBottom:8}}>👆</div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:C.txt}}>덕트 또는 배관을 추가해주세요</div>
                      <div style={{fontSize:11}}>위 버튼을 눌러 항목을 추가하세요</div>
                    </div>
                  )}
                  {iItems.map((item,idx)=>{
                    const updI=(patch)=>setIItems(p=>p.map(it=>it.id===item.id?{...it,...patch}:it));
                    const hasE=!!iErrs[item.id];
                    return (
                      <div key={item.id} style={{background:C.card,border:`1px solid ${hasE?C.err:item.kind==="duct"?C.pur+"55":C.blu+"33"}`,borderRadius:14,padding:"14px",marginBottom:10}}>
                        {hasE&&<div style={{background:C.err+"18",borderRadius:8,padding:"7px 10px",marginBottom:10,fontSize:12,color:C.err,borderLeft:`3px solid ${C.err}`}}>❌ {iErrs[item.id]}</div>}
                        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:12}}>
                          <div style={{width:3,height:20,background:item.kind==="duct"?C.pur:C.blu,borderRadius:2,flexShrink:0}}/>
                          <span style={{fontSize:12,color:item.kind==="duct"?C.pur:C.blu,fontWeight:800}}>{item.kind==="duct"?"덕트":"배관"}</span>
                          <span style={{fontSize:11,color:C.mut,fontWeight:600}}>{idx+1}</span>
                          <input style={{...SI,flex:1,height:"32px"}} value={item.label} placeholder="위치명 입력" onChange={e=>updI({label:e.target.value})}/>
                          {iItems.length>1&&<button onClick={()=>setIItems(p=>p.filter(it=>it.id!==item.id))} style={{background:"transparent",border:`1px solid ${C.line}`,borderRadius:7,width:28,height:28,cursor:"pointer",color:C.mut,fontSize:14,flexShrink:0}}>×</button>}
                        </div>
                        {item.kind==="pipe"&&(
                          <div>
                            <div style={{display:"flex",gap:8,marginBottom:8}}>
                              <div style={{flex:2}}><Lbl c="시공 타입"/><select style={SI} value={item.specType} onChange={e=>updI({specType:e.target.value,specRange:""})}>{STYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                              <div style={{flex:1.5}}><Lbl c="배관 규격"/><select style={{...SI,borderColor:hasE?C.err:C.bdr}} value={item.specRange} onChange={e=>updI({specRange:e.target.value})}><option value="">선택</option>{SPEC[item.specType].map(r=><option key={r.range} value={r.range}>{r.range}</option>)}</select></div>
                              <div style={{width:62}}><Lbl c="수량"/><input style={SI} type="number" value={item.qty} onChange={e=>updI({qty:e.target.value})}/></div>
                            </div>
                            <div style={{display:"flex",gap:8,marginBottom:item.specRange?8:0}}>
                              <div style={{flex:1}}><Lbl c="외경 직접입력 (mm)"/><input style={SI} type="number" value={item.customOD} onChange={e=>updI({customOD:e.target.value})}/></div>
                              <div style={{flex:1}}><Lbl c="차열재 두께 (mm)"/><input style={SI} type="number" value={item.thickness??""} placeholder="25" onChange={e=>updI({thickness:e.target.value})}/></div>
                            </div>
                            {item.specRange&&(()=>{
                              const row=SPEC[item.specType].find(r=>r.range===item.specRange);
                              return row?.steps.length>0
                                ?<div style={{background:C.sur,border:`1px solid ${C.line}`,borderRadius:8,padding:"8px 12px",fontSize:12}}>
                                  <span style={{color:C.mut,fontSize:11}}>규정 차열재 </span>
                                  <span style={{color:C.acc2,fontWeight:700}}>{row.steps.map(s=>`${s.t} ${s.mm}mm`).join(" / ")}</span>
                                 </div>
                                :<div style={{background:C.err+"15",border:`1px solid ${C.err}33`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.err}}>❌ 이 규격은 차열재 시공 없음</div>;
                            })()}
                          </div>
                        )}
                        {item.kind==="duct"&&(
                          <div>
                            <div style={{display:"flex",gap:5,marginBottom:10,background:C.sur,borderRadius:10,padding:4,border:`1px solid ${C.line}`}}>
                              {[["circle","원형"],["rect","사각"]].map(([k,lb])=>(
                                <button key={k} onClick={()=>updI({shape:k})} style={{flex:1,padding:"7px 0",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:`1px solid ${item.shape===k?C.pur:"transparent"}`,background:item.shape===k?C.pur:C.sur,color:item.shape===k?"#fff":C.mut,transition:"all .15s"}}>{lb}</button>
                              ))}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              {item.shape==="circle"
                                ?<div style={{flex:1}}><Lbl c="직경 (mm)"/><input style={SI} type="number" value={item.diam} onChange={e=>updI({diam:e.target.value})}/></div>
                                :<><div style={{flex:1}}><Lbl c="가로 (mm)"/><input style={SI} type="number" value={item.dw} onChange={e=>updI({dw:e.target.value})}/></div><div style={{flex:1}}><Lbl c="세로 (mm)"/><input style={SI} type="number" value={item.dh} onChange={e=>updI({dh:e.target.value})}/></div></>}
                              <div style={{flex:1}}><Lbl c="차열재 폭 (mm)"/><input style={SI} type="number" value={item.insW} onChange={e=>updI({insW:e.target.value})}/></div>
                              <div style={{width:62}}><Lbl c="수량"/><input style={SI} type="number" value={item.qty} onChange={e=>updI({qty:e.target.value})}/></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={calcInsul} style={{width:"100%",background:`linear-gradient(135deg,${C.pur},#8a3fd1)`,border:"none",borderRadius:12,padding:"15px 0",color:"#fff",cursor:"pointer",fontSize:15,fontWeight:900,boxShadow:`0 6px 24px ${C.pur}55`,marginTop:8,letterSpacing:-.3}}>차열재 계산하기</button>
                </div>
              )}
              {iTab==="result"&&iResult&&(
                <div>
                  <button onClick={()=>setITab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:C.mut,cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
                  <div style={{background:`linear-gradient(135deg,${C.pur}20,${C.card})`,border:`1px solid ${C.pur}55`,borderRadius:14,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:C.mut,marginBottom:4}}>전체 총 재단 장수</div>
                      <div style={{fontSize:28,fontWeight:900,color:C.pur,fontFamily:"monospace"}}>{iResult.reduce((s,r)=>s+(r.cuts?.reduce((a,c)=>a+c.sheets,0)||0),0)}<span style={{fontSize:14,marginLeft:4}}>장</span></div>
                    </div>
                    <div style={{fontSize:32}}>🧱</div>
                  </div>
                  {iResult.map((item,idx)=>{
                    if(item.noWork) return <div key={idx} style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:10,padding:"12px",marginBottom:8}}><div style={{fontSize:13,fontWeight:700}}>{item.label||"배관"} — {item.specRange}</div><div style={{fontSize:12,color:C.err,marginTop:4}}>차열재 시공 없음</div></div>;
                    if(!item.cuts?.length) return null;
                    const totalSheets=item.cuts.reduce((s,c)=>s+c.sheets,0);
                    return (
                      <div key={idx} style={{background:C.card,border:`1px solid ${item.kind==="duct"?C.pur+"55":C.grn+"44"}`,borderRadius:14,padding:"14px",marginBottom:10}}>
                        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:700}}>{item.label||`항목${idx+1}`}</span>
                          {item.kind==="pipe"&&<span style={{fontSize:11,background:C.acc+"22",color:C.acc,borderRadius:4,padding:"2px 6px"}}>{item.specType}</span>}
                          {item.kind==="pipe"&&<span style={{fontSize:11,background:C.acc2+"22",color:C.acc2,borderRadius:4,padding:"2px 6px"}}>{item.specRange}</span>}
                          {item.kind==="duct"&&<span style={{fontSize:11,background:C.pur+"22",color:C.pur,borderRadius:4,padding:"2px 6px"}}>{item.shape==="circle"?"원형":"사각"} 덕트</span>}
                          <span style={{marginLeft:"auto",fontSize:11,color:C.mut}}>{item.kind==="pipe"?`외경 ${item.od}mm · 두께 ${item.t||25}mm`:`둘레 ${item.perim}mm`} · ×{item.qty}</span>
                        </div>
                        {item.kind==="pipe"&&<div style={{background:C.sur,borderRadius:7,padding:"6px 10px",marginBottom:8,fontSize:11,color:C.mut}}>π × {item.od}mm = <span style={{color:C.acc2,fontWeight:700}}>{item.perim}mm</span> (1단 둘레) · 두께 {item.t||25}mm 누적</div>}
                        {item.ductType==="rect"&&<div style={{background:C.sur,borderRadius:7,padding:"6px 10px",marginBottom:8,fontSize:11,color:C.mut,lineHeight:1.7}}><div>가로면(상/하): <span style={{color:C.acc2,fontWeight:700}}>{item.dw}×{item.insW}mm</span> × 2장</div><div>세로면(좌/우): <span style={{color:C.acc2,fontWeight:700}}>{item.dh+parseFloat(item.insW)*2}×{item.insW}mm</span> × 2장</div></div>}
                        <div style={{borderRadius:8,overflow:"hidden",border:`1px solid ${C.bdr}`,marginBottom:8}}>
                          <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 46px 58px",background:C.sur,borderBottom:`1px solid ${C.bdr}`}}>
                            {["단","가로(폭)","세로(길이)","장수","합계"].map(h=><div key={h} style={{padding:"5px 6px",fontSize:10,color:C.mut,fontWeight:700}}>{h}</div>)}
                          </div>
                          {item.cuts.map((c,i)=>(
                            <div key={i} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 46px 58px",background:i%2===0?C.card:"transparent",borderTop:i>0?`1px solid ${C.bdr}22`:"none",alignItems:"center"}}>
                              <div style={{padding:"7px 6px"}}>
                                <div style={{fontSize:11,fontWeight:900,color:item.kind==="duct"?C.pur:C.blu}}>{c.label}</div>
                                {c.layerOD&&<div style={{fontSize:9,color:C.mut}}>Ø{Math.round(c.layerOD)}</div>}
                                {c.note&&<div style={{fontSize:9,color:C.mut}}>{c.note}</div>}
                              </div>
                              <div style={{padding:"7px 6px",fontSize:13,fontWeight:700,color:C.acc2,fontFamily:"monospace"}}>{c.width}mm</div>
                              <div style={{padding:"7px 6px",fontSize:13,fontWeight:700,color:C.txt,fontFamily:"monospace"}}>{c.height}mm</div>
                              <div style={{padding:"7px 6px",fontSize:12,fontWeight:700,color:C.grn,textAlign:"center"}}>1장</div>
                              <div style={{padding:"7px 6px",fontSize:13,fontWeight:900,color:C.grn,fontFamily:"monospace",textAlign:"center"}}>{c.sheets}장</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:item.kind==="duct"?C.pur+"20":C.grn+"20",borderRadius:8}}>
                          <span style={{fontSize:12,color:C.mut}}>소계 ({item.qty}개)</span>
                          <span style={{fontSize:18,fontWeight:900,color:item.kind==="duct"?C.pur:C.grn,fontFamily:"monospace"}}>{totalSheets}장</span>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={()=>setITab("input")} style={{width:"100%",background:"transparent",border:`1px solid ${C.line}`,borderRadius:10,padding:"10px",color:C.mut,cursor:"pointer",fontSize:12,fontWeight:600,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>‹ 입력 수정하기</button>
                </div>
              )}
            </div>
          )}

          {/* ══ 작업 현황 ══ */}
          {mainTab==="history" && (
            <div>
              {!logs.length?(
                <div style={{textAlign:"center",padding:"60px 20px",color:C.mut}}>
                  <div style={{fontSize:32,marginBottom:12}}>📋</div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>저장된 작업이 없습니다</div>
                  <div style={{fontSize:12}}>방화보드 결과에서 저장해주세요.</div>
                </div>
              ):(()=>{
                const byDate={};
                for(const l of logs){ if(!byDate[l.date]) byDate[l.date]=[]; byDate[l.date].push(l); }
                const dates=Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
                const grand=logs.reduce((s,l)=>s+(l.m2||0),0);
                return (
                  <div>
                    <div style={{background:C.card,border:`1px solid ${C.blu}44`,borderRadius:12,padding:"12px 13px",marginBottom:12}}>
                      <SectionTitle icon="📊" title="전체 요약" color={C.blu}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                        {[{l:"작업일",v:dates.length+"일",c:C.acc},{l:"총 건수",v:logs.length+"건",c:C.acc2},{l:"누적 면적",v:fmt4(grand)+"㎡",c:C.blu}].map(s=>(
                          <div key={s.l} style={{background:C.sur,borderRadius:8,padding:"9px 6px",textAlign:"center"}}>
                            <div style={{fontSize:15,fontWeight:900,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
                            <div style={{fontSize:10,color:C.mut,marginTop:2}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {dates.map(date=>{
                      const dayLogs=byDate[date], dayM2=dayLogs.reduce((s,l)=>s+(l.m2||0),0), isOpen=selDate===date;
                      return (
                        <div key={date} style={{background:C.card,border:`1px solid ${isOpen?C.acc:C.bdr}`,borderRadius:12,marginBottom:9,overflow:"hidden"}}>
                          <div onClick={()=>setSelDate(isOpen?null:date)} style={{display:"flex",alignItems:"center",padding:"12px 13px",cursor:"pointer"}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:900,color:isOpen?C.acc:C.txt}}>{date.replace(/-/g,".")}</div>
                              <div style={{fontSize:11,color:C.mut,marginTop:1}}>{dayLogs.length}건</div>
                            </div>
                            <div style={{textAlign:"right",marginRight:9}}>
                              <div style={{fontSize:17,fontWeight:900,color:C.blu,fontFamily:"monospace"}}>{fmt4(dayM2)}</div>
                              <div style={{fontSize:10,color:C.mut}}>㎡</div>
                            </div>
                            <span style={{color:C.mut}}>{isOpen?"▲":"▼"}</span>
                          </div>
                          {isOpen&&(
                            <div style={{borderTop:`1px solid ${C.bdr}`}}>
                              {dayLogs.map((log,li)=>(
                                <div key={log.id} style={{padding:"10px 13px",borderBottom:li<dayLogs.length-1?`1px solid ${C.bdr}33`:"none",display:"flex",gap:8}}>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{log.note||"(메모 없음)"}</div>
                                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                      <span style={{fontSize:11,color:C.mut}}>{fmtDt(log.at)}</span>
                                      <span style={{fontSize:11,background:C.acc+"22",color:C.acc,borderRadius:4,padding:"1px 6px"}}>보드 {log.boards}장</span>
                                      <span style={{fontSize:11,background:C.grn+"22",color:C.grn,borderRadius:4,padding:"1px 6px"}}>효율 {log.eff}%</span>
                                      <span style={{fontSize:11,background:C.blu+"22",color:C.blu,borderRadius:4,padding:"1px 6px",fontWeight:700}}>{fmt4(log.m2)}㎡</span>
                                    </div>
                                  </div>
                                  <button onClick={()=>{if(window.confirm("삭제할까요?")){const u=logs.filter(l=>l.id!==log.id);setLogs(u);saveLogs(u);}}} style={{background:"transparent",border:`1px solid ${C.bdr}`,borderRadius:6,width:28,height:28,cursor:"pointer",color:C.mut,fontSize:13,flexShrink:0}}>🗑</button>
                                </div>
                              ))}
                              <div style={{padding:"9px 13px",background:C.sur,display:"flex",justifyContent:"space-between"}}>
                                <span style={{fontSize:11,color:C.mut}}>{date.replace(/-/g,".")} 합계</span>
                                <span style={{fontSize:14,fontWeight:900,color:C.blu,fontFamily:"monospace"}}>{fmt4(dayM2)} ㎡</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
