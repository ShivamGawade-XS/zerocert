import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

// ─── UTILS ────────────────────────────────────────────────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
const uid   = () => Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const db = {
  get: (k,fb=null) => { try { return JSON.parse(localStorage.getItem("zc_"+k)) ?? fb; } catch { return fb; } },
  set: (k,v) => localStorage.setItem("zc_"+k, JSON.stringify(v)),
};
const readFileB64 = f => new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(f); });
const loadImg     = src => new Promise(res => { const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src; });
const downloadCanvas = (canvas, filename) => {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href    = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, "image/png");
};
function injectVars(text, row={}, certId="ZC-P", issuedAt=new Date().toISOString(), eventName="", orgName="") {
  const d = new Date(issuedAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  return text
    .replace(/\{\{Name\}\}/g, row.Name||"Recipient")
    .replace(/\{\{Email\}\}/g, row.Email||"email@example.com")
    .replace(/\{\{EventName\}\}/g, eventName||"Event")
    .replace(/\{\{OrgName\}\}/g, orgName||"Organization")
    .replace(/\{\{CertID\}\}/g, certId)
    .replace(/\{\{IssueDate\}\}/g, d)
    .replace(/\{\{VerifyURL\}\}/g, `zerocert.app/verify?id=${certId}`)
    .replace(/\{\{(\w[\w\s]*)\}\}/g, (_,k) => row[k]||`{{${k}}}`);
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#06060E", surface:"#0A0A18", surfaceHigh:"#0F0F22",
  border:"#1A1A32", borderHigh:"#2A2A48",
  accent:"#E8FF00", accentDim:"#E8FF0033", accentH:"#F5FF55",
  text:"#F0F0FA", muted:"#4A4A6A", mutedHigh:"#7070A0",
  ok:"#00E87A", okDim:"#00E87A22",
  err:"#FF3355", errDim:"#FF335522",
  warn:"#FF9900", warnDim:"#FF990022",
  info:"#00AAFF", infoDim:"#00AAFF22",
  purple:"#9B5CFF",
};
const MONO = "'IBM Plex Mono','Courier New',monospace";
const DISP = "'Bebas Neue',Impact,sans-serif";
const SERIF= "Georgia,'Times New Roman',serif";

const DEFAULT_SUBJECT = "Your {{EventName}} certificate is here, {{Name}}!";
const DEFAULT_BODY =
`Dear {{Name}},

Congratulations! 🎉

Your certificate for {{EventName}} has been officially issued by {{OrgName}}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Certificate ID  :  {{CertID}}
  Issued On       :  {{IssueDate}}
  Issued To       :  {{Name}}
  Event           :  {{EventName}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verify your certificate at any time:
→ {{VerifyURL}}

Add it to your LinkedIn and share it with the world.

Warm regards,
{{OrgName}} Team

──────────────────────────────────────────────
Powered by ZeroCert · Blockchain-anchored certificates
`;

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, v="primary", full, sm, disabled, style:sx={} }) {
  const [h,sh] = useState(false);
  const base = {
    fontFamily:MONO, fontSize:sm?"10px":"12px", fontWeight:700,
    letterSpacing:"1.5px", padding:sm?"6px 14px":"10px 24px",
    textTransform:"uppercase", cursor:disabled?"not-allowed":"pointer",
    width:full?"100%":"auto", opacity:disabled?0.4:1,
    transition:"all 0.15s", border:"none", display:"inline-block",
    borderRadius:2, position:"relative", overflow:"hidden", ...sx,
  };
  const vs = {
    primary: { background:h?C.accentH:C.accent, color:"#000", boxShadow:h?`0 0 20px ${C.accent}55`:"none" },
    ghost:   { background:"transparent", color:h?C.text:C.muted, border:`1px solid ${h?C.borderHigh:C.border}` },
    danger:  { background:h?"#CC2244":"#160810", color:C.err, border:`1px solid ${C.err}44` },
    sec:     { background:h?C.surfaceHigh:C.surface, color:C.text, border:`1px solid ${C.border}` },
    ok:      { background:h?"#00B860":C.okDim, color:C.ok, border:`1px solid ${C.ok}44` },
    info:    { background:h?"#0088CC":C.infoDim, color:C.info, border:`1px solid ${C.info}44` },
    warn:    { background:h?"#CC7700":C.warnDim, color:C.warn, border:`1px solid ${C.warn}44` },
    purple:  { background:h?"#7B3CDF":"#1A0A30", color:C.purple, border:`1px solid ${C.purple}44` },
  };
  return <button onMouseEnter={()=>sh(true)} onMouseLeave={()=>sh(false)} onClick={disabled?undefined:onClick} style={{...base,...vs[v]}}>{children}</button>;
}

function Inp({ label, value, onChange, type="text", ph="", req, sx={}, rows, disabled, note }) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? C.accent : C.border;
  return (
    <div style={{marginBottom:18}}>
      {label && <label style={{display:"block",fontSize:10,color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:6,fontFamily:MONO}}>
        {label}{req&&<span style={{color:C.accent}}> *</span>}
      </label>}
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={ph}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            style={{width:"100%",fontFamily:MONO,fontSize:13,padding:"10px 14px",background:"#06060E",border:`1px solid ${borderColor}`,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box",transition:"border-color 0.2s",...sx}} />
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} disabled={disabled}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            style={{width:"100%",fontFamily:MONO,fontSize:13,padding:"10px 14px",background:"#06060E",border:`1px solid ${borderColor}`,color:C.text,outline:"none",boxSizing:"border-box",opacity:disabled?0.5:1,transition:"border-color 0.2s",...sx}} />
      }
      {note && <div style={{fontFamily:MONO,fontSize:9,color:C.muted,marginTop:4}}>{note}</div>}
    </div>
  );
}

const Tag = ({ children, c=C.accent }) => (
  <span style={{fontFamily:MONO,fontSize:9,letterSpacing:1,padding:"2px 8px",border:`1px solid ${c}44`,color:c,background:c+"11",borderRadius:2,whiteSpace:"nowrap"}}>{children}</span>
);
const Divider = () => <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.border},transparent)`,margin:"24px 0"}} />;
const ProgBar = ({ value, max, color=C.accent, h=5 }) => (
  <div style={{height:h,background:C.border,width:"100%",borderRadius:999}}>
    <div style={{height:h,width:`${max?Math.min(100,Math.round(value/max*100)):0}%`,background:color,borderRadius:999,transition:"width 0.2s",boxShadow:`0 0 6px ${color}66`}} />
  </div>
);
const StatCard = ({ label, value, sub, c=C.accent, icon="" }) => (
  <div style={{background:C.surface,border:`1px solid ${C.border}`,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-20,right:-10,fontFamily:DISP,fontSize:80,color:c+"08",letterSpacing:-2,pointerEvents:"none"}}>{icon}</div>
    <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontFamily:DISP,fontSize:42,color:c,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontFamily:MONO,fontSize:9,color:C.muted,marginTop:6}}>{sub}</div>}
  </div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
function NavBar({ nav, adminKey, setAdminKey }) {
  return (
    <nav style={{padding:"0 28px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"stretch",background:C.bg+"F0",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,height:52}}>
      <div onClick={()=>nav("landing")} style={{fontFamily:DISP,fontSize:22,color:C.accent,cursor:"pointer",letterSpacing:3,lineHeight:1,display:"flex",alignItems:"center",gap:10}}>
        <span style={{background:C.accent,color:"#000",padding:"2px 7px",fontSize:18}}>ZC</span>
        <span style={{color:C.text}}>ZEROCERT</span>
      </div>
      <div style={{display:"flex",gap:0,alignItems:"stretch"}}>
        {[["Verify","verify"],adminKey&&["Dashboard","dashboard"],adminKey&&["Bulk Issue","bulkIssue"],adminKey&&["Analytics","analytics"]].filter(Boolean).map(([label,target])=>(
          <button key={target} onClick={()=>nav(target)}
            style={{fontFamily:MONO,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",padding:"0 16px",background:"transparent",border:"none",borderBottom:`2px solid transparent`,color:C.muted,cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.target.style.color=C.text;e.target.style.borderBottomColor=C.accent;}}
            onMouseLeave={e=>{e.target.style.color=C.muted;e.target.style.borderBottomColor="transparent";}}>
            {label}
          </button>
        ))}
        {adminKey
          ? <Btn sm v="ghost" onClick={()=>{setAdminKey(null);nav("landing");}} style={{margin:"10px 0 10px 8px"}}>Logout</Btn>
          : <Btn sm onClick={()=>nav("adminLogin")} style={{margin:"10px 0 10px 12px"}}>Admin →</Btn>}
      </div>
    </nav>
  );
}

// ─── CERTIFICATE TEMPLATES ────────────────────────────────────────────────────
const TEMPLATES = [
  {id:"classic", name:"Classic Gold",   desc:"Parchment, ornate gold border, timeless authority",   tag:"FORMAL",    accent:"#B8922A"},
  {id:"dark",    name:"Dark Prestige",  desc:"Deep space gradient, electric glow, modern luxury",   tag:"MODERN",    accent:"#E8FF00"},
  {id:"neon",    name:"Neon Cyber",     desc:"Cyberpunk circuit grid, glitch chrome, RGB borders",  tag:"HACKATHON", accent:"#00FFFF"},
  {id:"minimal", name:"Pure Minimal",   desc:"Generous white space, hairline rules, editorial",     tag:"ELEGANT",   accent:"#000000"},
  {id:"brutal",  name:"Brutalist",      desc:"Thick Impact headers, raw black borders, bold yellow",tag:"EDGY",      accent:"#F5F500"},
  {id:"retro",   name:"RetroWave",      desc:"80s synthwave grid, chrome type, vaporwave sunset",   tag:"FUN",       accent:"#FF88FF"},
];

// Draws signature block for any template
function drawSignatures(ctx, signatories, W, H, sigImgs, style="classic") {
  if (!signatories || signatories.length === 0) return 0;
  const count = signatories.length;
  const blockH = 72;
  const startY = H - blockH - (style === "neon" || style === "retro" ? 34 : 18);
  const blockW = (W - 120) / count;

  signatories.forEach((sig, i) => {
    const bx = 60 + i * blockW;
    const cx = bx + blockW / 2;
    const img = sigImgs[i];

    // Signature image or typed
    if (img) {
      const sh = 36, sw = Math.min(blockW - 20, (img.width / img.height) * sh);
      ctx.drawImage(img, cx - sw/2, startY, sw, sh);
    } else if (sig.signatureType === "typed" && sig.signatureData) {
      ctx.save();
      const fonts = { dancing_script:"'Dancing Script',cursive", pacifico:"'Pacifico',cursive", caveat:"'Caveat',cursive", sacramento:"'Sacramento',cursive" };
      ctx.font = `28px ${fonts[sig.signatureFont || "dancing_script"]}`;
      ctx.textAlign = "center";
      ctx.fillStyle = style === "minimal" || style === "classic" ? "#000" : style === "brutal" ? "#000" : "#FFF";
      ctx.shadowBlur = 0;
      ctx.fillText(sig.signatureData.slice(0, 24), cx, startY + 32);
      ctx.restore();
    }

    // Rule line
    const lc = style === "classic" ? "#B8922A" : style === "dark" ? "#E8FF0066" : style === "neon" ? "#00FFFF88" : style === "minimal" ? "#CCCCCC" : style === "brutal" ? "#000" : "#FF88FF88";
    ctx.beginPath(); ctx.moveTo(bx + 8, startY + 42); ctx.lineTo(bx + blockW - 8, startY + 42);
    ctx.strokeStyle = lc; ctx.lineWidth = style === "brutal" ? 3 : 1; ctx.stroke();

    // Name
    ctx.textAlign = "center";
    const nameColor = style === "minimal" || style === "classic" ? "#222" : style === "brutal" ? "#000" : "#FFF";
    ctx.fillStyle = nameColor; ctx.font = `bold 11px 'Courier New'`;
    ctx.shadowBlur = 0;
    ctx.fillText((sig.name || "").slice(0, 22).toUpperCase(), cx, startY + 56);

    // Designation
    const desigColor = style === "minimal" ? "#888" : style === "classic" ? "#9A7A50" : style === "brutal" ? "#333" : C.mutedHigh;
    ctx.fillStyle = desigColor; ctx.font = `italic 9px Georgia`;
    ctx.fillText((sig.designation || "").slice(0, 26), cx, startY + 68);
  });
  return blockH + 8;
}

function drawCert(ctx, cert, tmpl, W, H, logoImgs, sigImgs) {
  const all = logoImgs||[], isCollab = all.length > 1;
  const sigs = cert.signatories || [];
  const name   = cert.fields?.Name     || "Participant";
  const org    = cert.orgName          || "Organization";
  const evName = cert.eventName        || "Event";
  const certId = cert.serialNumber     || cert.certId || "ZC-XXXXXX";
  const hash   = cert.hash             || "0".repeat(64);
  const issued = new Date(cert.issuedAt||Date.now()).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  const extras = Object.entries(cert.fields||{}).filter(([k])=>k!=="Name"&&k!=="Email");
  const expiryDate = cert.expiryDate;
  const isExpired  = expiryDate && new Date(expiryDate) < new Date();
  ctx.clearRect(0, 0, W, H);

  if (tmpl === "classic") {
    ctx.fillStyle="#FAFAF3"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#B8922A"; ctx.lineWidth=10; ctx.strokeRect(14,14,W-28,H-28);
    ctx.strokeStyle="#D4AF60"; ctx.lineWidth=1.5; ctx.strokeRect(26,26,W-52,H-52);
    // corner ornaments
    [[34,34],[W-86,34],[34,H-86],[W-86,H-86]].forEach(([x,y])=>{
      ctx.strokeStyle="#D4AF6066"; ctx.lineWidth=1;
      ctx.strokeRect(x,y,52,52);
    });
    const hH = isCollab?110:90;
    ctx.fillStyle="#0A0A1C"; ctx.fillRect(32,32,W-64,hH);
    ctx.fillStyle="#E8FF00"; ctx.fillRect(32,32,7,hH);
    let lx=W-54; const lh=62, ly=32+(hH-lh)/2;
    for(let i=all.length-1;i>=0;i--){const img=all[i];if(!img)continue;const lw=Math.round((img.width/img.height)*lh);lx-=lw;ctx.drawImage(img,lx,ly,lw,lh);lx-=10;}
    ctx.fillStyle="#FFF"; ctx.font="600 13px 'Courier New'"; ctx.textAlign="left"; ctx.fillText(org.toUpperCase(),54,32+hH/2-4);
    if(isCollab){ctx.fillStyle="#E8FF0099";ctx.font="9px 'Courier New'";ctx.fillText("IN COLLABORATION",54,32+hH/2+12);}
    ctx.fillStyle="#E8FF00"; ctx.font="10px 'Courier New'"; ctx.textAlign="right"; ctx.fillText("ZEROCERT · BLOCKCHAIN VERIFIED",W-48,32+hH-12);
    const by=32+hH;
    ctx.textAlign="center"; ctx.fillStyle="#12102A"; ctx.font="bold 56px Georgia"; ctx.fillText("CERTIFICATE",W/2,by+78);
    ctx.font="19px Georgia"; ctx.fillStyle="#8A6820"; ctx.fillText("OF COMPLETION",W/2,by+106);
    const g=ctx.createLinearGradient(80,0,W-80,0);g.addColorStop(0,"transparent");g.addColorStop(.3,"#B8922A");g.addColorStop(.7,"#B8922A");g.addColorStop(1,"transparent");
    ctx.strokeStyle=g; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(80,by+122); ctx.lineTo(W-80,by+122); ctx.stroke();
    ctx.fillStyle="#9A7A50"; ctx.font="italic 16px Georgia"; ctx.fillText("This is to certify that",W/2,by+158);
    ctx.fillStyle="#08081E"; ctx.font="bold 50px Georgia"; ctx.fillText(name,W/2,by+222);
    const nw=ctx.measureText(name).width; ctx.beginPath(); ctx.moveTo(W/2-nw/2-8,by+234); ctx.lineTo(W/2+nw/2+8,by+234); ctx.strokeStyle="#B8922A"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#9A7A50"; ctx.font="italic 16px Georgia"; ctx.fillText("has successfully completed",W/2,by+268);
    ctx.fillStyle="#08081E"; ctx.font="bold 26px Georgia"; ctx.fillText(evName,W/2,by+302);
    ctx.font="10px 'Courier New'"; ctx.fillStyle="#777";
    extras.forEach(([k,v],i)=>ctx.fillText(`${k}: ${v}`,W/2,by+322+i*16));
    const ey=by+340+extras.length*16;
    ctx.fillStyle="#AAA"; ctx.font="10px 'Courier New'"; ctx.fillText(`Issued: ${issued}`,W/2,ey); ctx.fillText(`ID: ${certId}`,W/2,ey+16);
    ctx.fillStyle="#CCC"; ctx.font="9px 'Courier New'"; ctx.fillText(`SHA-256: ${hash.slice(0,44)}…`,W/2,ey+30);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"classic");
    // expiry badge
    if(expiryDate){const ec=isExpired?"#CC0022":"#B8922A";ctx.strokeStyle=ec;ctx.lineWidth=1.5;ctx.strokeRect(W-128,H-52,112,28);ctx.fillStyle=ec;ctx.font="bold 8px 'Courier New'";ctx.textAlign="center";ctx.fillText(isExpired?"⚠ EXPIRED":`VALID UNTIL: ${expiryDate}`,W-72,H-34);}
    // seal
    const sx=W-78,sy=H-78;ctx.beginPath();ctx.arc(sx,sy,52,0,Math.PI*2);ctx.fillStyle="#0A0A1C";ctx.fill();ctx.strokeStyle="#E8FF00";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#E8FF00";ctx.font="bold 8px 'Courier New'";ctx.textAlign="center";ctx.fillText("BLOCKCHAIN",sx,sy-8);ctx.fillText("ANCHORED",sx,sy+4);ctx.fillStyle="#888";ctx.font="7px 'Courier New'";ctx.fillText("ZEROCERT",sx,sy+16);
    ctx.beginPath(); ctx.moveTo(80,H-28); ctx.lineTo(W-80,H-28); ctx.strokeStyle="#DDD"; ctx.lineWidth=0.5; ctx.stroke();
    ctx.fillStyle="#BBB"; ctx.font="8px 'Courier New'"; ctx.fillText(`Verify at zerocert.app/verify — ${certId}`,W/2,H-14);
  }
  else if (tmpl === "dark") {
    const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W);bg.addColorStop(0,"#14143A");bg.addColorStop(1,"#060612");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#E8FF00";ctx.fillRect(0,0,W,4);
    [[0,0],[W-40,0],[0,H-40],[W-40,H-40]].forEach(([x,y])=>{ctx.strokeStyle="#E8FF0022";ctx.lineWidth=1;ctx.strokeRect(x,y,40,40);});
    const lh=48,tw=all.filter(Boolean).reduce((a,i)=>a+(i?Math.round((i.width/i.height)*lh):0)+12,0)-12;let lx=W/2-tw/2;
    all.filter(Boolean).forEach((img,i)=>{if(!img)return;const lw=Math.round((img.width/img.height)*lh);ctx.drawImage(img,lx,16,lw,lh);lx+=lw+12;});
    const base=all.length?80:50;
    ctx.fillStyle="#55557A";ctx.font="10px 'Courier New'";ctx.textAlign="center";ctx.fillText(`${org.toUpperCase()}  ·  ${evName.toUpperCase()}`,W/2,base+12);
    ctx.fillStyle="#FFFFFF22";ctx.fillRect(60,base+24,W-120,1);
    ctx.fillStyle="#E8FF00";ctx.font="bold 62px Impact";ctx.fillText("CERTIFICATE",W/2,base+88);
    ctx.fillStyle="#55557A";ctx.font="12px 'Courier New'";ctx.fillText("OF  COMPLETION",W/2,base+114);
    ctx.fillStyle="#FFFFFF22";ctx.fillRect(60,base+130,W-120,1);
    ctx.fillStyle="#55557A";ctx.font="italic 14px Georgia";ctx.fillText("presented to",W/2,base+164);
    ctx.shadowColor="#E8FF00";ctx.shadowBlur=26;ctx.fillStyle="#FFFFFF";ctx.font="bold 50px Georgia";ctx.fillText(name,W/2,base+222);ctx.shadowBlur=0;
    ctx.fillStyle="#55557A";ctx.font="italic 14px Georgia";ctx.fillText("for completing",W/2,base+258);
    ctx.fillStyle="#E8FF00";ctx.font="bold 24px Georgia";ctx.fillText(evName,W/2,base+290);
    ctx.font="10px 'Courier New'";ctx.fillStyle="#333355";extras.forEach(([k,v],i)=>ctx.fillText(`${k}: ${v}`,W/2,base+312+i*16));
    const ey=base+330+extras.length*16;ctx.fillStyle="#333355";ctx.font="10px 'Courier New'";ctx.fillText(`${issued}  ·  ID: ${certId}`,W/2,ey);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"dark");
    ctx.fillStyle="#E8FF0022";ctx.fillRect(0,H-32,W,32);ctx.fillStyle="#E8FF0066";ctx.font="10px 'Courier New'";ctx.fillText(`VERIFY: ZEROCERT.APP/VERIFY — ${certId}`,W/2,H-12);
    if(expiryDate){ctx.strokeStyle=isExpired?C.err:C.accent;ctx.lineWidth=1;ctx.strokeRect(W-140,16,124,28);ctx.fillStyle=isExpired?C.err:C.accent;ctx.font="bold 8px 'Courier New'";ctx.textAlign="center";ctx.fillText(isExpired?"⚠ EXPIRED":`VALID TO: ${expiryDate}`,W-78,34);}
  }
  else if (tmpl === "neon") {
    ctx.fillStyle="#050510";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#0A1428";ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#00FFFF";ctx.lineWidth=3;ctx.shadowColor="#00FFFF";ctx.shadowBlur=18;ctx.strokeRect(16,16,W-32,H-32);
    ctx.strokeStyle="#FF00FF";ctx.lineWidth=1;ctx.shadowBlur=12;ctx.strokeRect(24,24,W-48,H-48);ctx.shadowBlur=0;
    let nlx=32;all.filter(Boolean).forEach((img,i)=>{if(!img)return;const lh=46,lw=Math.round((img.width/img.height)*lh);ctx.drawImage(img,nlx,32,lw,lh);nlx+=lw+8;});
    ctx.fillStyle="#00FFFF";ctx.font="bold 11px 'Courier New'";ctx.textAlign="right";ctx.fillText(org.toUpperCase(),W-32,54);
    ctx.fillStyle="#FF00FF";ctx.font="9px 'Courier New'";ctx.fillText("BLOCKCHAIN_VERIFIED :: ZEROCERT",W-32,70);
    ctx.textAlign="center";ctx.fillStyle="#FF00FF";ctx.shadowColor="#FF00FF";ctx.shadowBlur=22;ctx.font="bold 70px Impact";ctx.fillText("CERTIFICATE",W/2+2,190);
    ctx.fillStyle="#00FFFF";ctx.shadowColor="#00FFFF";ctx.fillText("CERTIFICATE",W/2-2,188);ctx.fillStyle="#FFF";ctx.shadowBlur=0;ctx.fillText("CERTIFICATE",W/2,189);
    ctx.fillStyle="#00FFFF88";ctx.font="10px 'Courier New'";ctx.fillText("// OF ACHIEVEMENT //",W/2,216);
    for(let i=130;i<H;i+=4){ctx.fillStyle="#FFFFFF02";ctx.fillRect(0,i,W,2);}
    ctx.fillStyle="#888";ctx.font="12px 'Courier New'";ctx.fillText("> AWARDED_TO:",W/2,264);
    ctx.fillStyle="#00FFFF";ctx.shadowColor="#00FFFF";ctx.shadowBlur=18;ctx.font="bold 46px Georgia";ctx.fillText(name,W/2,326);ctx.shadowBlur=0;
    ctx.fillStyle="#FF00FF";ctx.font="11px 'Courier New'";ctx.fillText(`> EVENT: ${evName}`,W/2,362);
    ctx.font="10px 'Courier New'";ctx.fillStyle="#55557A";extras.forEach(([k,v],i)=>ctx.fillText(`> ${k.toUpperCase()}: ${v}`,W/2,382+i*16));
    const ey=402+extras.length*16;ctx.fillStyle="#333";ctx.font="9px 'Courier New'";ctx.fillText(`HASH: 0x${hash.slice(0,36).toUpperCase()}…`,W/2,ey);ctx.fillText(`CERT_ID: ${certId}`,W/2,ey+14);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"neon");
    const ng=ctx.createLinearGradient(0,0,W,0);ng.addColorStop(0,"#FF00FF");ng.addColorStop(.5,"#00FFFF");ng.addColorStop(1,"#FF00FF");ctx.fillStyle=ng;ctx.fillRect(0,H-30,W,30);ctx.fillStyle="#000";ctx.font="9px 'Courier New'";ctx.fillText(`VERIFY // ZEROCERT.APP // ${certId}`,W/2,H-10);
  }
  else if (tmpl === "minimal") {
    ctx.fillStyle="#FEFEFE";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#F0F0F0";ctx.lineWidth=1;ctx.strokeRect(32,32,W-64,H-64);
    ctx.fillStyle="#000";ctx.fillRect(32,88,160,1);
    let mlx=46;const mlh=38;all.filter(Boolean).forEach((img,i)=>{if(!img)return;const lw=Math.round((img.width/img.height)*mlh);ctx.drawImage(img,mlx,36,lw,mlh);mlx+=lw+10;});
    ctx.fillStyle="#000";ctx.font="9px 'Courier New'";ctx.textAlign="right";ctx.fillText(org.toUpperCase(),W-46,56);ctx.fillStyle="#CCC";ctx.fillText("ZEROCERT.APP",W-46,72);
    ctx.textAlign="center";ctx.fillStyle="#000";ctx.font="bold 72px Georgia";ctx.fillText("Certificate",W/2,208);ctx.fillStyle="#AAA";ctx.font="14px Georgia";ctx.fillText("of Completion",W/2,238);
    ctx.fillStyle="#E8E8E8";ctx.fillRect(W/2-60,256,120,1);ctx.fillStyle="#999";ctx.font="italic 14px Georgia";ctx.fillText("awarded to",W/2,292);
    ctx.fillStyle="#000";ctx.font="bold 52px Georgia";ctx.fillText(name,W/2,364);ctx.fillStyle="#000";ctx.fillRect(W/2-200,380,400,0.5);
    ctx.fillStyle="#999";ctx.font="italic 14px Georgia";ctx.fillText("for completing",W/2,418);ctx.fillStyle="#000";ctx.font="22px Georgia";ctx.fillText(evName,W/2,452);
    ctx.font="10px 'Courier New'";ctx.fillStyle="#AAA";extras.forEach(([k,v],i)=>ctx.fillText(`${k}: ${v}`,W/2,472+i*16));
    const ey=492+extras.length*16;ctx.fillStyle="#CCC";ctx.font="10px 'Courier New'";ctx.fillText(`${issued}  ·  ID ${certId}`,W/2,ey);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"minimal");
    ctx.fillStyle="#EBEBEB";ctx.fillRect(32,H-44,W-64,1);ctx.fillStyle="#CCC";ctx.font="8px 'Courier New'";ctx.fillText("VERIFY AT ZEROCERT.APP",W/2,H-28);
    if(expiryDate){ctx.strokeStyle=isExpired?"#CC0022":"#CCC";ctx.lineWidth=1;ctx.strokeRect(W-130,H-52,114,24);ctx.fillStyle=isExpired?"#CC0022":"#999";ctx.font="8px 'Courier New'";ctx.textAlign="center";ctx.fillText(isExpired?"EXPIRED":`VALID TO: ${expiryDate}`,W-73,H-36);}
  }
  else if (tmpl === "brutal") {
    ctx.fillStyle="#F5F500";ctx.fillRect(0,0,W,H);const hH=isCollab?124:108;
    ctx.fillStyle="#000";ctx.fillRect(0,0,W,hH);ctx.fillRect(0,H-56,W,56);
    ctx.strokeStyle="#000";ctx.lineWidth=10;ctx.strokeRect(5,5,W-10,H-10);ctx.lineWidth=2;ctx.strokeRect(18,18,W-36,H-36);
    let blx=22;const blh=72;all.filter(Boolean).forEach((img,i)=>{if(!img)return;const lw=Math.round((img.width/img.height)*blh);ctx.drawImage(img,blx,(hH-blh)/2,lw,blh);blx+=lw+10;});
    ctx.fillStyle="#F5F500";ctx.font="bold 14px 'Courier New'";ctx.textAlign="right";ctx.fillText(org.toUpperCase(),W-22,54);ctx.fillStyle="#888";ctx.font="10px 'Courier New'";ctx.fillText("ZEROCERT.APP",W-22,70);
    ctx.textAlign="center";ctx.fillStyle="#000";ctx.font="bold 82px Impact";ctx.fillText("CERT",W/2,hH+86);ctx.font="16px 'Courier New'";ctx.fillText("OF COMPLETION",W/2,hH+110);
    ctx.font="12px 'Courier New'";ctx.fillText("THIS CERTIFIES THAT:",W/2,hH+150);ctx.font="bold 56px Impact";ctx.fillText(name,W/2,hH+214);ctx.fillRect(W/2-240,hH+222,480,6);
    ctx.font="14px 'Courier New'";ctx.fillText("HAS COMPLETED:",W/2,hH+260);ctx.font="bold 28px Impact";ctx.fillText(evName.toUpperCase(),W/2,hH+294);
    ctx.font="10px 'Courier New'";ctx.fillStyle="#333";extras.forEach(([k,v],i)=>ctx.fillText(`${k}: ${v}`,W/2,hH+314+i*16));
    const ey=hH+332+extras.length*16;ctx.font="10px 'Courier New'";ctx.fillText(`${issued}  ·  ID: ${certId}`,W/2,ey);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"brutal");
    ctx.fillStyle="#F5F500";ctx.font="bold 10px 'Courier New'";ctx.fillText(`VERIFY: ZEROCERT.APP — ${certId}`,W/2,H-26);
  }
  else if (tmpl === "retro") {
    const rg=ctx.createLinearGradient(0,0,0,H);rg.addColorStop(0,"#1a0533");rg.addColorStop(.5,"#2d1b4e");rg.addColorStop(1,"#0d1f4e");ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#FF00FF22";ctx.lineWidth=.5;for(let x=0;x<=W;x+=50){ctx.beginPath();ctx.moveTo(x,H/2);ctx.lineTo(W/2,H+10);ctx.stroke();}for(let y=H/2;y<=H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    const sun=ctx.createRadialGradient(W/2,134,0,W/2,134,116);sun.addColorStop(0,"#FF6B35");sun.addColorStop(.4,"#FF006699");sun.addColorStop(1,"transparent");ctx.fillStyle=sun;ctx.fillRect(0,0,W,270);
    [0,22,41,57,70,82].forEach(y=>{ctx.fillStyle="#1a053388";ctx.fillRect(W/2-112,76+y,224,y===0?15:8);});
    const tg=ctx.createLinearGradient(0,80,0,168);tg.addColorStop(0,"#FFF");tg.addColorStop(.3,"#FF88FF");tg.addColorStop(.6,"#8888FF");tg.addColorStop(1,"#FF88FF");
    ctx.fillStyle=tg;ctx.textAlign="center";ctx.font="bold 70px Impact";ctx.fillText("CERTIFICATE",W/2,168);ctx.fillStyle="#FF00FF88";ctx.font="10px 'Courier New'";ctx.fillText("// OF COMPLETION //",W/2,196);
    ctx.strokeStyle="#FF00FF44";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,212);ctx.lineTo(W-80,212);ctx.stroke();
    const rlh=36,rtW=all.filter(Boolean).reduce((a,i)=>a+(i?Math.round((i.width/i.height)*rlh):0)+10,0)-10;let rlx=W/2-rtW/2;
    all.filter(Boolean).forEach(img=>{if(!img)return;const lw=Math.round((img.width/img.height)*rlh);ctx.drawImage(img,rlx,220,lw,rlh);rlx+=lw+10;});
    const base=268;ctx.fillStyle="#FF88FF99";ctx.font="10px 'Courier New'";ctx.fillText(org.toUpperCase(),W/2,base+14);ctx.fillStyle="#BBBBFF";ctx.font="italic 14px Georgia";ctx.fillText("presented to",W/2,base+38);
    const ng=ctx.createLinearGradient(0,base+46,0,base+92);ng.addColorStop(0,"#FFF");ng.addColorStop(1,"#FF88FF");ctx.fillStyle=ng;ctx.font="bold 46px Georgia";ctx.shadowColor="#FF00FF";ctx.shadowBlur=18;ctx.fillText(name,W/2,base+92);ctx.shadowBlur=0;
    ctx.fillStyle="#FF88FF66";ctx.font="11px 'Courier New'";ctx.fillText(`for completing: ${evName}`,W/2,base+120);
    ctx.font="9px 'Courier New'";ctx.fillStyle="#8888FF";extras.forEach(([k,v],i)=>ctx.fillText(`${k}: ${v}`,W/2,base+138+i*16));
    const ey=base+156+extras.length*16;ctx.fillStyle="#55557A";ctx.font="10px 'Courier New'";ctx.fillText(`${issued}  ·  ID: ${certId}`,W/2,ey);
    if(sigs.length>0) drawSignatures(ctx,sigs,W,H,sigImgs,"retro");
    const gb=ctx.createLinearGradient(0,0,W,0);gb.addColorStop(0,"#FF00FF");gb.addColorStop(.5,"#8888FF");gb.addColorStop(1,"#FF00FF");ctx.fillStyle=gb;ctx.fillRect(0,H-26,W,26);ctx.fillStyle="#FFF";ctx.font="9px 'Courier New'";ctx.fillText(`VERIFY: ZEROCERT.APP/VERIFY — ${certId}`,W/2,H-8);
  }
}

function CertCanvas({ cert, onReady }) {
  const ref = useRef(null);
  const W=960, H=700;
  useEffect(()=>{
    const canvas=ref.current; if(!canvas)return; const ctx=canvas.getContext("2d");
    const logoSrcs=(cert.orgLogos?.length?cert.orgLogos:cert.orgLogo?[cert.orgLogo]:[]);
    const sigSrcs=(cert.signatories||[]).map(s=>s.signatureType!=="typed"&&s.signatureData?s.signatureData:null);
    Promise.all([
      Promise.all(logoSrcs.map(s=>s?loadImg(s):Promise.resolve(null))),
      Promise.all(sigSrcs.map(s=>s?loadImg(s):Promise.resolve(null))),
    ]).then(([logoImgs,sigImgs])=>{
      drawCert(ctx,cert,cert.template||"classic",W,H,logoImgs,sigImgs);
      onReady?.(canvas);
    });
  },[cert]);
  return <canvas ref={ref} width={W} height={H} style={{width:"100%",height:"auto",border:`1px solid ${C.border}`,display:"block"}} />;
}

// ─── SIGNATURE DRAW PAD ───────────────────────────────────────────────────────
function DrawPad({ onSave, onCancel }) {
  const ref = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const lastPos = useRef(null);
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x:(touch.clientX-rect.left)*(canvas.width/rect.width), y:(touch.clientY-rect.top)*(canvas.height/rect.height) };
  };
  const start = e => { e.preventDefault(); setDrawing(true); lastPos.current = getPos(e, ref.current); };
  const move  = e => {
    if (!drawing || !ref.current) return; e.preventDefault();
    const ctx = ref.current.getContext("2d");
    const pos = getPos(e, ref.current);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle="#000"; ctx.lineWidth=2.5;
    ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke();
    lastPos.current = pos;
  };
  const end   = () => setDrawing(false);
  const clear = () => { const ctx=ref.current.getContext("2d"); ctx.clearRect(0,0,400,120); };
  const save  = () => {
    const canvas=ref.current;
    canvas.toBlob(blob=>{
      const reader=new FileReader(); reader.onload=e=>onSave(e.target.result); reader.readAsDataURL(blob);
    },"image/png");
  };
  return (
    <div>
      <div style={{background:"#FFF",border:`2px solid ${C.accent}`,marginBottom:10,cursor:"crosshair",touchAction:"none"}}>
        <canvas ref={ref} width={400} height={120} style={{display:"block",width:"100%"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn sm v="ghost" onClick={clear}>Clear</Btn>
        <Btn sm onClick={save}>Save Signature</Btn>
        <Btn sm v="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─── SIGNATORY EDITOR ─────────────────────────────────────────────────────────
function SignatoryEditor({ sig, onSave, onCancel }) {
  const [name, setName]         = useState(sig?.name||"");
  const [desig, setDesig]       = useState(sig?.designation||"");
  const [orgField, setOrgField] = useState(sig?.organization||"");
  const [sigType, setSigType]   = useState(sig?.signatureType||"typed");
  const [sigData, setSigData]   = useState(sig?.signatureData||"");
  const [sigFont, setSigFont]   = useState(sig?.signatureFont||"dancing_script");
  const [showDraw, setShowDraw] = useState(false);
  const FONTS = [
    {id:"dancing_script",label:"Dancing Script"},
    {id:"pacifico",label:"Pacifico"},
    {id:"caveat",label:"Caveat"},
  ];
  const handleUpload = async e => { if(e.target.files[0]) setSigData(await readFileB64(e.target.files[0])); };
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,padding:"24px",borderRadius:2}}>
      <div style={{fontFamily:DISP,fontSize:28,marginBottom:18}}>SIGNATORY DETAILS</div>
      <Inp label="Full Name" value={name} onChange={setName} ph="Dr. Rajesh Kumar" req />
      <Inp label="Designation" value={desig} onChange={setDesig} ph="Director, IIT Bombay" req />
      <Inp label="Organization (if different)" value={orgField} onChange={setOrgField} ph="Optional" />
      <Divider />
      <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Signature Style</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["typed","Typed Name"],["draw","Draw"],["upload","Upload Image"]].map(([t,l])=>(
          <div key={t} onClick={()=>{setSigType(t);if(t==="draw")setShowDraw(true);}} style={{flex:1,padding:"10px 14px",border:`1px solid ${sigType===t?C.accent:C.border}`,cursor:"pointer",background:sigType===t?C.accentDim:C.bg,textAlign:"center",fontFamily:MONO,fontSize:10,color:sigType===t?C.accent:C.muted}}>
            {l}
          </div>
        ))}
      </div>
      {sigType==="typed"&&<div>
        <Inp label="Name to display (cursive)" value={sigData} onChange={setSigData} ph="Type your name as it should appear" />
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:MONO,fontSize:9,color:C.muted,marginBottom:8}}>Font Style</div>
          <div style={{display:"flex",gap:8}}>
            {FONTS.map(f=>(
              <div key={f.id} onClick={()=>setSigFont(f.id)} style={{flex:1,padding:"8px",border:`1px solid ${sigFont===f.id?C.accent:C.border}`,cursor:"pointer",background:sigFont===f.id?C.accentDim:C.bg,textAlign:"center",fontSize:18,fontFamily:f.id==="dancing_script"?"'Dancing Script',cursive":f.id==="pacifico"?"'Pacifico',cursive":"'Caveat',cursive",color:sigFont===f.id?C.text:C.muted}}>
                {sigData||f.label}
              </div>
            ))}
          </div>
        </div>
      </div>}
      {sigType==="draw"&&(showDraw
        ? <DrawPad onSave={d=>{setSigData(d);setShowDraw(false);}} onCancel={()=>setShowDraw(false)} />
        : <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {sigData&&<img src={sigData} alt="" style={{height:48,background:"#FFF",padding:4,border:`1px solid ${C.border}`}} />}
            <Btn sm v="ghost" onClick={()=>setShowDraw(true)}>{sigData?"Redraw":"Draw Signature"}</Btn>
          </div>
      )}
      {sigType==="upload"&&<div>
        <input type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}} id="sig-upload" />
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {sigData&&<img src={sigData} alt="" style={{height:48,background:"#FFF",padding:4,border:`1px solid ${C.border}`}} />}
          <Btn sm v="ghost" onClick={()=>document.getElementById("sig-upload").click()}>Upload PNG</Btn>
          <div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>Transparent background recommended</div>
        </div>
      </div>}
      <Divider />
      <div style={{display:"flex",gap:10}}>
        <Btn v="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={()=>onSave({...sig,name,designation:desig,organization:orgField,signatureType:sigType,signatureData:sigData,signatureFont:sigFont})} disabled={!name||!desig}>
          Save Signatory
        </Btn>
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ nav }) {
  const features = [
    ["⬡","SHA-256 Hashing","Every certificate cryptographically fingerprinted on issue"],
    ["⬡","6 Visual Templates","Classic · Dark · Neon · Minimal · Brutalist · RetroWave"],
    ["⬡","Multi-Org Logos","Joint events show all community logos side-by-side"],
    ["⬡","Signature Authority","Add 1–5 signatories with drawn, typed or uploaded sigs"],
    ["⬡","Bulk CSV Engine","Upload CSV, issue 10,000 certs, watch each row go live"],
    ["⬡","Variable Emails","{{Name}}, {{CertID}}, {{VerifyURL}} — AI-personalized per recipient"],
    ["⬡","Full Analytics","Open rates, click rates, bounce tracking, trend charts"],
    ["⬡","Bitcoin Anchoring","OpenTimestamps-ready. Verifiable proof without gas fees."],
    ["⬡","Zero Cost","No wallet. No gas. No subscription. Actually free."],
  ];
  return (
    <div>
      <NavBar nav={nav} />
      {/* Hero */}
      <div style={{minHeight:"92vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"60px 24px",position:"relative",overflow:"hidden"}}>
        {/* Background grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`,backgroundSize:"60px 60px",opacity:.4}} />
        {/* Glow */}
        <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:800,height:400,background:`radial-gradient(ellipse,${C.accent}0A 0%,transparent 65%)`,pointerEvents:"none"}} />
        <div style={{position:"relative",zIndex:1,maxWidth:820}}>
          <div style={{fontFamily:MONO,fontSize:10,color:C.accent,letterSpacing:6,marginBottom:24,opacity:.9,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <span style={{display:"inline-block",width:40,height:1,background:C.accent}} />
            FREE · OPEN · BLOCKCHAIN-ANCHORED
            <span style={{display:"inline-block",width:40,height:1,background:C.accent}} />
          </div>
          <h1 style={{fontFamily:DISP,fontSize:"clamp(72px,14vw,148px)",lineHeight:.85,color:C.text,letterSpacing:2,marginBottom:32}}>
            ZERO<br />
            <span style={{color:"transparent",WebkitTextStroke:`2px ${C.accent}`,textShadow:`0 0 60px ${C.accent}44`}}>CERT</span>
          </h1>
          <p style={{fontFamily:MONO,fontSize:14,color:C.muted,lineHeight:2,maxWidth:480,margin:"0 auto 48px"}}>
            Issue verifiable, blockchain-anchored certificates for free. Multi-signatory. Multi-org. Bulk email with AI personalization. Full analytics.
          </p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>nav("adminLogin")} style={{fontSize:13,padding:"13px 32px"}}>
              Create Your First Event →
            </Btn>
            <Btn v="ghost" onClick={()=>nav("verify")} style={{fontSize:13,padding:"13px 32px"}}>
              Verify a Certificate
            </Btn>
          </div>
        </div>
        {/* Scroll hint */}
        <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:2}}>
          SCROLL TO EXPLORE ↓
        </div>
      </div>

      {/* How it works */}
      <div style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"64px 24px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.accent,letterSpacing:4,marginBottom:8}}>WORKFLOW</div>
            <div style={{fontFamily:DISP,fontSize:48,color:C.text}}>HOW IT WORKS</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:1,background:C.border}}>
            {[["01","Create Org","Register in 10 seconds. No wallet needed."],["02","Create Event","Upload logos, pick template, add signatories."],["03","Share Link","Anyone claims their cert from your link."],["04","Bulk Issue","CSV upload → email → live status per row."],["05","Verify Forever","Anyone verifies any cert by ID, anytime."]].map(([n,t,d])=>(
              <div key={n} style={{background:C.bg,padding:"28px 20px"}}>
                <div style={{fontFamily:DISP,fontSize:56,color:C.accent,lineHeight:1,opacity:.5,marginBottom:12}}>{n}</div>
                <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>{t}</div>
                <div style={{fontFamily:MONO,fontSize:10,color:C.muted,lineHeight:1.7}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{padding:"64px 24px 80px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.accent,letterSpacing:4,marginBottom:8}}>CAPABILITIES</div>
            <div style={{fontFamily:DISP,fontSize:48,color:C.text}}>EVERYTHING INCLUDED</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:1,background:C.border}}>
            {features.map(([icon,t,d])=>(
              <div key={t} style={{background:C.bg,padding:"22px 22px",display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{fontFamily:DISP,fontSize:28,color:C.accent,lineHeight:1,flexShrink:0}}>{icon}</div>
                <div>
                  <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,color:C.text,marginBottom:5}}>{t}</div>
                  <div style={{fontFamily:MONO,fontSize:10,color:C.muted,lineHeight:1.65}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AdminLogin({ nav, setAdminKey }) {
  const [mode,setMode]=useState("register");const [orgName,setOrgName]=useState("");const [email,setEmail]=useState("");const [key,setKey]=useState("");const [error,setError]=useState("");
  const register=()=>{if(!orgName.trim()||!key.trim())return setError("Org name and key required.");if(key.length<6)return setError("Key must be ≥ 6 characters.");const orgs=db.get("orgs",{});if(orgs[key])return setError("Key taken — choose another.");orgs[key]={name:orgName.trim(),email,createdAt:new Date().toISOString()};db.set("orgs",orgs);setAdminKey(key);nav("dashboard");};
  const login=()=>{const orgs=db.get("orgs",{});if(!orgs[key])return setError("No org found with this key.");setAdminKey(key);nav("dashboard");};
  return (
    <div><NavBar nav={nav} />
      <div style={{maxWidth:440,margin:"80px auto",padding:"0 24px 60px"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontFamily:DISP,fontSize:52,lineHeight:.88,marginBottom:6,color:C.text}}>{mode==="register"?"CREATE ORG":"WELCOME BACK"}</div>
          <div style={{fontFamily:MONO,fontSize:11,color:C.muted}}>{mode==="register"?"Register your community or organization.":"Access your org dashboard."}</div>
        </div>
        {mode==="register"&&<Inp label="Organization Name" value={orgName} onChange={setOrgName} ph="e.g. CTF Club IITB, DevFest 2025" req />}
        {mode==="register"&&<Inp label="Contact Email" value={email} onChange={setEmail} type="email" ph="hello@yourorg.com" />}
        <Inp label="Secret Key" value={key} onChange={v=>{setKey(v);setError("");}} ph={mode==="register"?"Create a key (min 6 chars)":"Your org secret key"} req />
        {mode==="register"&&<div style={{fontFamily:MONO,fontSize:9,color:C.warn,marginBottom:18,lineHeight:1.7,padding:"12px 14px",border:`1px solid ${C.warn}33`,background:C.warn+"08"}}>⚠ Store this key safely. There is no recovery mechanism.</div>}
        {error&&<div style={{fontFamily:MONO,fontSize:11,color:C.err,marginBottom:14,padding:"8px 12px",background:C.errDim,border:`1px solid ${C.err}44`}}>✕ {error}</div>}
        <Btn full onClick={mode==="register"?register:login} style={{marginBottom:16}}>{mode==="register"?"Create Organization":"Login →"}</Btn>
        <div style={{textAlign:"center",fontFamily:MONO,fontSize:11,color:C.muted}}>
          {mode==="register"?"Already registered? ":"New here? "}
          <span style={{color:C.accent,cursor:"pointer"}} onClick={()=>{setMode(m=>m==="register"?"login":"register");setError("");}}>
            {mode==="register"?"Login":"Register your org"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ nav, adminKey, setAdminKey }) {
  const org=db.get("orgs",{})[adminKey];const events=db.get("events",{});const certs=db.get("certs",{});const emails=db.get("emails",{});
  const orgEvents=Object.entries(events).filter(([,e])=>e.orgKey===adminKey).reverse();
  const orgCerts=Object.values(certs).filter(c=>c.orgKey===adminKey);
  const orgEmails=Object.values(emails).filter(e=>e.orgKey===adminKey);
  const openRate=orgEmails.length?Math.round(orgEmails.filter(e=>e.opened).length/orgEmails.length*100):0;
  const [copied,setCopied]=useState(null);
  const copyLink=eid=>{navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?event=${eid}`);setCopied(eid);setTimeout(()=>setCopied(null),2000);};
  if(!org)return <div style={{padding:80,textAlign:"center",fontFamily:MONO}}><Btn onClick={()=>nav("adminLogin")}>← Login</Btn></div>;
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:1000,margin:"0 auto",padding:"40px 24px 60px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:36,flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:2,marginBottom:6}}>ORGANIZATION DASHBOARD</div>
            <div style={{fontFamily:DISP,fontSize:56,lineHeight:.9,color:C.text}}>{org.name.toUpperCase()}</div>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,marginTop:8,letterSpacing:1}}>KEY: {adminKey}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn v="sec" onClick={()=>nav("bulkIssue")}>Bulk Issue</Btn>
            <Btn onClick={()=>nav("createEvent")}>+ New Event</Btn>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:C.border,marginBottom:32}}>
          <StatCard label="Events" value={orgEvents.length} icon="EV" />
          <StatCard label="Certs Issued" value={orgCerts.length} icon="CE" />
          <StatCard label="Emails Sent" value={orgEmails.length} c={C.info} icon="EM" />
          <StatCard label="Email Open Rate" value={openRate+"%"} c={C.ok} icon="%" />
        </div>
        {orgEvents.length===0
          ?<div style={{border:`2px dashed ${C.border}`,padding:"64px 40px",textAlign:"center"}}>
            <div style={{fontFamily:DISP,fontSize:36,color:C.muted,marginBottom:12}}>NO EVENTS YET</div>
            <div style={{fontFamily:MONO,fontSize:11,color:C.muted,marginBottom:24}}>Create your first event to start issuing certificates.</div>
            <Btn onClick={()=>nav("createEvent")}>Create First Event →</Btn>
          </div>
          :<div style={{display:"grid",gap:1,background:C.border}}>
            {orgEvents.map(([eid,ev])=>{
              const cnt=Object.values(certs).filter(c=>c.eventId===eid).length;
              const logos=ev.coLogos?.length?ev.coLogos:ev.logo?[ev.logo]:[];
              const sigCount=(ev.signatories||[]).length;
              return(
                <div key={eid} style={{background:C.surface,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",gap:14,alignItems:"center"}}>
                    {logos.slice(0,3).map((l,i)=><img key={i} src={l} alt="" style={{width:42,height:42,objectFit:"contain",background:"#FFF",padding:4}} />)}
                    <div>
                      <div style={{fontFamily:MONO,fontWeight:700,fontSize:12,color:C.text,marginBottom:4}}>{ev.name}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <Tag c={C.muted}>{ev.date}</Tag>
                        <Tag>{cnt} cert(s)</Tag>
                        <Tag c={C.muted}>{ev.template||"classic"}</Tag>
                        {logos.length>1&&<Tag c={C.info}>{logos.length} orgs</Tag>}
                        {sigCount>0&&<Tag c={C.purple}>{sigCount} signer(s)</Tag>}
                        {ev.expiry&&<Tag c={C.warn}>expires {ev.expiry}</Tag>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Btn sm v="sec" onClick={()=>copyLink(eid)}>{copied===eid?"✓ Copied!":"Copy Link"}</Btn>
                    <Btn sm onClick={()=>nav("eventPage",eid)}>Event Page →</Btn>
                  </div>
                </div>
              );
            })}
          </div>}
      </div>
    </div>
  );
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
function CreateEvent({ nav, adminKey, setAdminKey }) {
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");const [date,setDate]=useState("");const [desc,setDesc]=useState("");
  const [coLogos,setCoLogos]=useState([]);
  const [fields,setFields]=useState(["Name","Email"]);const [newField,setNewField]=useState("");
  const [expiry,setExpiry]=useState("");const [template,setTemplate]=useState("classic");
  const [signatories,setSignatories]=useState([]);
  const [editingSig,setEditingSig]=useState(null); // null | "new" | index
  const [serialPrefix,setSerialPrefix]=useState("");
  const STEPS=["Details","Branding","Template","Fields","Signatories","Review"];
  const addLogos=async files=>{const n=await Promise.all(Array.from(files).map(readFileB64));setCoLogos(p=>[...p,...n].slice(0,5));};
  const addField=()=>{const f=newField.trim();if(f&&!fields.includes(f)){setFields(p=>[...p,f]);setNewField("");}};
  const save=()=>{const eid=uid();const evs=db.get("events",{});evs[eid]={name,date,desc,logo:coLogos[0]||null,coLogos,fields,orgKey:adminKey,expiry,template,signatories,serialPrefix,createdAt:new Date().toISOString(),_certSerial:0};db.set("events",evs);nav("eventPage",eid);};
  const org=db.get("orgs",{})[adminKey];
  const prev={certId:serialPrefix?(serialPrefix+"-001"):"ZC-PREVIEW",eventName:name||"Event Name",orgName:org?.name||"Org",orgLogos:coLogos,issuedAt:new Date().toISOString(),fields:{Name:"Rahul Sharma",Email:"rahul@example.com"},hash:"a".repeat(64),status:"active",template,signatories,expiryDate:expiry||null};

  if(editingSig!==null){
    const existingSig = editingSig==="new" ? null : signatories[editingSig];
    return (
      <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
        <div style={{maxWidth:600,margin:"60px auto",padding:"0 24px"}}>
          <Btn v="ghost" sm onClick={()=>setEditingSig(null)} style={{marginBottom:20}}>← Back to Signatories</Btn>
          <SignatoryEditor sig={existingSig} onCancel={()=>setEditingSig(null)} onSave={s=>{if(editingSig==="new")setSignatories(p=>[...p,s]);else setSignatories(p=>p.map((x,i)=>i===editingSig?s:x));setEditingSig(null);}} />
        </div>
      </div>
    );
  }

  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:980,margin:"0 auto",padding:"40px 24px 60px"}}>
        {/* Step bar */}
        <div style={{display:"flex",marginBottom:40,gap:0}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{flex:1,borderBottom:`2px solid ${step===i+1?C.accent:step>i+1?C.ok:C.border}`,paddingBottom:8,cursor:step>i+1?"pointer":"default"}} onClick={()=>step>i+1&&setStep(i+1)}>
              <div style={{fontFamily:MONO,fontSize:8,color:step===i+1?C.accent:step>i+1?C.ok:C.muted,textTransform:"uppercase",letterSpacing:1}}>{step>i+1?"✓":(`0${i+1}`)} {s}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:step===3?"1fr 1fr":"1fr",gap:36}}>
          <div>
            {step===1&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:28,color:C.text}}>EVENT DETAILS</div>
              <Inp label="Event Name" value={name} onChange={setName} ph="Hackathon 2025, Web Dev Bootcamp…" req />
              <Inp label="Event Date" value={date} onChange={setDate} type="date" req />
              <Inp label="Description" value={desc} onChange={setDesc} ph="Brief description shown on claim page" rows={3} />
              <Inp label="Certificate Expiry Date (optional)" value={expiry} onChange={setExpiry} type="date" note="Certs show a validity badge. Expired certs show red badge on verify." />
              <Inp label="Serial Number Prefix (optional)" value={serialPrefix} onChange={setSerialPrefix} ph="e.g. IITB/CSE/2025 → IITB/CSE/2025-001" note="Leave blank for ZC- prefix" />
              <Btn full onClick={()=>name&&date&&setStep(2)} disabled={!name||!date}>Next: Branding →</Btn>
            </div>}

            {step===2&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:8,color:C.text}}>LOGOS & BRANDING</div>
              <div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:24}}>Upload logos for all organizing orgs. All appear side-by-side on every certificate. Max 5.</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
                {coLogos.map((l,i)=>(
                  <div key={i} style={{position:"relative",width:84,height:84,background:"#FFF",display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${i===0?C.accent:C.border}`}}>
                    <img src={l} alt="" style={{maxWidth:74,maxHeight:74,objectFit:"contain"}} />
                    {i===0&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:C.accent,fontFamily:MONO,fontSize:7,color:"#000",textAlign:"center",padding:"1px 0",letterSpacing:.5}}>PRIMARY</div>}
                    <div onClick={()=>setCoLogos(p=>p.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:-8,right:-8,width:18,height:18,background:C.err,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,color:"#FFF"}}>✕</div>
                  </div>
                ))}
                {coLogos.length<5&&(
                  <div onClick={()=>document.getElementById("ci").click()} style={{width:84,height:84,border:`2px dashed ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:C.surface,gap:4}}>
                    <div style={{fontSize:24,color:C.muted}}>+</div>
                    <div style={{fontFamily:MONO,fontSize:7,color:C.muted,textAlign:"center"}}>Add Logo</div>
                  </div>
                )}
              </div>
              <input id="ci" type="file" accept="image/*" multiple onChange={e=>addLogos(e.target.files)} style={{display:"none"}} />
              {coLogos.length>1&&<div style={{fontFamily:MONO,fontSize:9,color:C.info,padding:"8px 12px",border:`1px solid ${C.info}33`,background:C.infoDim,marginBottom:16}}>
                ✦ {coLogos.length} orgs detected — "IN COLLABORATION" label will appear on all certificates.
              </div>}
              <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(1)}>← Back</Btn><Btn full onClick={()=>setStep(3)}>Next: Template →</Btn></div>
            </div>}

            {step===3&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:8,color:C.text}}>PICK TEMPLATE</div>
              <div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:22}}>Live preview updates on the right as you select.</div>
              <div style={{display:"grid",gap:1,background:C.border,marginBottom:22}}>
                {TEMPLATES.map(t=>(
                  <div key={t.id} onClick={()=>setTemplate(t.id)} style={{background:template===t.id?C.surfaceHigh:C.surface,padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:template===t.id?`3px solid ${C.accent}`:"3px solid transparent"}}>
                    <div>
                      <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,color:template===t.id?C.accent:C.text,marginBottom:3}}>{t.name}</div>
                      <div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>{t.desc}</div>
                    </div>
                    <Tag c={template===t.id?C.accent:C.muted}>{t.tag}</Tag>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(2)}>← Back</Btn><Btn full onClick={()=>setStep(4)}>Next: Form Fields →</Btn></div>
            </div>}

            {step===4&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:8,color:C.text}}>FORM FIELDS</div>
              <div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:22}}>What participants fill when claiming their certificate.</div>
              <div style={{marginBottom:16}}>
                {fields.map(f=>(
                  <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:4,background:C.surface}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,fontFamily:MONO,fontSize:12,color:C.text}}>{f}{(f==="Name"||f==="Email")&&<Tag>required</Tag>}</div>
                    {f!=="Name"&&f!=="Email"&&<span style={{color:C.err,cursor:"pointer",fontSize:14}} onClick={()=>setFields(p=>p.filter(x=>x!==f))}>✕</span>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:22}}>
                <input value={newField} onChange={e=>setNewField(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addField()} placeholder="Add field: Roll No, Grade, Track, Score…"
                  style={{flex:1,fontFamily:MONO,fontSize:11,padding:"10px 12px",background:"#06060E",border:`1px solid ${C.border}`,color:C.text,outline:"none"}} />
                <Btn sm onClick={addField}>+ Add</Btn>
              </div>
              <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(3)}>← Back</Btn><Btn full onClick={()=>setStep(5)}>Next: Signatories →</Btn></div>
            </div>}

            {step===5&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:8,color:C.text}}>SIGNATORIES</div>
              <div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:22}}>Add 1–5 people who sign every certificate. Name + designation appear below their signature.</div>
              <div style={{marginBottom:16}}>
                {signatories.length===0&&<div style={{border:`2px dashed ${C.border}`,padding:"32px",textAlign:"center",fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:16}}>No signatories yet. Certificates will have no signature block.</div>}
                {signatories.map((s,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",border:`1px solid ${C.border}`,marginBottom:6,background:C.surface}}>
                    <div style={{display:"flex",gap:16,alignItems:"center"}}>
                      {s.signatureData&&s.signatureType!=="typed"&&<img src={s.signatureData} alt="" style={{height:32,background:"#FFF",padding:4,border:`1px solid ${C.border}`}} />}
                      {s.signatureType==="typed"&&s.signatureData&&<div style={{fontFamily:"'Dancing Script',cursive",fontSize:22,color:C.text,minWidth:80}}>{s.signatureData}</div>}
                      <div>
                        <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,color:C.text}}>{s.name}</div>
                        <div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>{s.designation}{s.organization&&` · ${s.organization}`}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn sm v="ghost" onClick={()=>setEditingSig(i)}>Edit</Btn>
                      <Btn sm v="danger" onClick={()=>setSignatories(p=>p.filter((_,idx)=>idx!==i))}>Remove</Btn>
                    </div>
                  </div>
                ))}
              </div>
              {signatories.length<5&&<Btn v="sec" onClick={()=>setEditingSig("new")} style={{marginBottom:22}}>+ Add Signatory</Btn>}
              <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(4)}>← Back</Btn><Btn full onClick={()=>setStep(6)}>Review →</Btn></div>
            </div>}

            {step===6&&<div>
              <div style={{fontFamily:DISP,fontSize:52,marginBottom:24,color:C.text}}>REVIEW</div>
              <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 24px",marginBottom:20}}>
                <div style={{display:"flex",gap:8,marginBottom:16}}>{coLogos.map((l,i)=><img key={i} src={l} alt="" style={{height:48,objectFit:"contain",background:"#FFF",padding:4}} />)}</div>
                {[["Event",name],["Date",date],["Template",TEMPLATES.find(t=>t.id===template)?.name||template],["Serial",serialPrefix||"ZC- (default)"],["Expiry",expiry||"No expiry"],["Orgs",coLogos.length===0?"No logo":coLogos.length+"  logo(s)"],["Fields",fields.join(", ")],["Signatories",signatories.length===0?"None":signatories.map(s=>s.name).join(", ")]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:16,marginBottom:10}}>
                    <div style={{fontFamily:MONO,fontSize:9,color:C.muted,width:90,flexShrink:0,textTransform:"uppercase"}}>{k}</div>
                    <div style={{fontFamily:MONO,fontSize:11,color:C.text}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Certificate Preview</div>
                <CertCanvas cert={prev} />
              </div>
              <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(5)}>← Back</Btn><Btn full onClick={save}>🚀 Create Event</Btn></div>
            </div>}
          </div>
          {step===3&&<div style={{position:"sticky",top:70}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Live Preview</div>
            <CertCanvas cert={prev} />
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── EVENT PAGE (Claim) ───────────────────────────────────────────────────────
function EventPage({ nav, adminKey, setAdminKey, eventId }) {
  const events=db.get("events",{});const event=events[eventId];const org=event?(db.get("orgs",{})[event.orgKey]||{name:"Unknown"}):null;
  const [formData,setFormData]=useState({});const [errors,setErrors]=useState({});const [loading,setLoading]=useState(false);const [issuedId,setIssuedId]=useState(null);
  if(!event)return <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} /><div style={{padding:"80px 24px",textAlign:"center",fontFamily:MONO,color:C.muted}}>Event not found. Check your link.</div></div>;
  if(issuedId)return <CertResult nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} certId={issuedId} />;
  const isExpired=event.expiry&&new Date(event.expiry)<new Date();const logos=event.coLogos?.length?event.coLogos:event.logo?[event.logo]:[];
  const setField=(k,v)=>{setFormData(d=>({...d,[k]:v}));setErrors(e=>({...e,[k]:""}));};
  const submit=async()=>{
    const errs={};if(!formData["Name"]?.trim())errs["Name"]="Required";if(!formData["Email"]?.trim())errs["Email"]="Required";else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData["Email"]))errs["Email"]="Invalid email";
    if(Object.keys(errs).length)return setErrors(errs);
    setLoading(true);
    const evs=db.get("events",{});const evData=evs[eventId];evData._certSerial=(evData._certSerial||0)+1;db.set("events",evs);
    const serial=event.serialPrefix?`${event.serialPrefix}-${String(evData._certSerial).padStart(3,"0")}`:"ZC-"+uid();
    const issuedAt=new Date().toISOString();const hash=await sha256(JSON.stringify({serial,eventId,issuedAt,fields:formData}));
    const cert={certId:serial,serialNumber:serial,eventId,eventName:event.name,orgName:org.name,orgKey:event.orgKey,orgLogos:logos,orgLogo:logos[0]||null,issuedAt,fields:formData,hash,status:"active",btcProof:"pending",template:event.template||"classic",signatories:event.signatories||[],expiryDate:event.expiry||null};
    const certs=db.get("certs",{});certs[serial]=cert;db.set("certs",certs);setIssuedId(serial);setLoading(false);
  };
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:580,margin:"60px auto",padding:"0 24px 60px"}}>
        <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"24px",marginBottom:28}}>
          {logos.length>0&&<div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
            {logos.map((l,i)=><img key={i} src={l} alt="" style={{height:52,objectFit:"contain",background:"#FFF",padding:5}} />)}
            {logos.length>1&&<div style={{fontFamily:MONO,fontSize:8,color:C.info,letterSpacing:1}}>JOINT COLLABORATION</div>}
          </div>}
          <div style={{fontFamily:DISP,fontSize:32,lineHeight:1,color:C.text,marginBottom:6}}>{event.name.toUpperCase()}</div>
          <div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>{org.name} · {event.date}{event.expiry&&` · Valid until ${event.expiry}`}</div>
          {event.desc&&<div style={{fontFamily:MONO,fontSize:11,color:C.muted,marginTop:14,lineHeight:1.75,borderTop:`1px solid ${C.border}`,paddingTop:14}}>{event.desc}</div>}
        </div>
        {isExpired
          ?<div style={{border:`1px solid ${C.err}`,padding:"24px",textAlign:"center",background:C.errDim}}><div style={{fontFamily:MONO,color:C.err,fontSize:13}}>✕ This event has expired. Certificates can no longer be claimed.</div></div>
          :<><div style={{fontFamily:DISP,fontSize:36,marginBottom:22,color:C.text}}>CLAIM YOUR CERTIFICATE</div>
            {event.fields.map(field=>(
              <div key={field} style={{marginBottom:16}}>
                <label style={{display:"block",fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:6}}>{field}{(field==="Name"||field==="Email")&&<span style={{color:C.accent}}> *</span>}</label>
                <input type={field==="Email"?"email":"text"} value={formData[field]||""} onChange={e=>setField(field,e.target.value)} placeholder={`Enter your ${field.toLowerCase()}`}
                  style={{width:"100%",fontFamily:MONO,fontSize:12,padding:"10px 14px",background:"#06060E",border:`1px solid ${errors[field]?C.err:C.border}`,color:C.text,outline:"none",boxSizing:"border-box"}} />
                {errors[field]&&<div style={{fontFamily:MONO,fontSize:9,color:C.err,marginTop:4}}>✕ {errors[field]}</div>}
              </div>
            ))}
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,lineHeight:1.75,padding:"12px 14px",border:`1px solid ${C.border}`,marginBottom:20,background:C.surface}}>
              🔒 Your certificate will be SHA-256 hashed and anchored on the Bitcoin blockchain via OpenTimestamps. Verifiable by anyone, forever.
            </div>
            <Btn full onClick={submit} disabled={loading} style={{fontSize:13,padding:"12px 0"}}>{loading?"⏳ Generating Certificate…":"✓ Generate My Certificate"}</Btn>
          </>}
      </div>
    </div>
  );
}

// ─── CERT RESULT ──────────────────────────────────────────────────────────────
function CertResult({ nav, adminKey, setAdminKey, certId }) {
  const cert=db.get("certs",{})[certId];const [canvas,setCanvas]=useState(null);const [copied,setCopied]=useState(false);const [imgSrc,setImgSrc]=useState(null);
  const onReady=c=>{setCanvas(c);try{setImgSrc(c.toDataURL("image/png"));}catch(e){}};
  if(!cert)return <div style={{padding:80,textAlign:"center",fontFamily:MONO,color:C.muted}}>Certificate not found.</div>;
  const download=()=>{if(canvas)downloadCanvas(canvas,`${cert.certId}.png`);};
  const verifyUrl=`${window.location.origin}${window.location.pathname}?verify=${cert.certId}`;
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:880,margin:"40px auto",padding:"0 24px 60px"}}>
        <div style={{background:C.okDim,border:`1px solid ${C.ok}44`,padding:"16px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:14,borderRadius:2}}>
          <div style={{color:C.ok,fontSize:28,lineHeight:1}}>✓</div>
          <div>
            <div style={{fontFamily:MONO,color:C.ok,fontSize:12,fontWeight:700,marginBottom:2}}>Certificate Issued Successfully</div>
            <div style={{fontFamily:MONO,color:C.muted,fontSize:9}}>SHA-256 hashed · Bitcoin anchor pending (≤2 hrs via OpenTimestamps)</div>
          </div>
        </div>
        <CertCanvas cert={cert} onReady={onReady} />
        {/* Fallback image for right-click save */}
        {imgSrc&&<div style={{fontFamily:MONO,fontSize:8,color:C.muted,marginTop:4,marginBottom:12}}>Right-click image above → "Save Image As" also works if button fails.</div>}
        <div style={{display:"flex",gap:10,marginTop:4,marginBottom:24,flexWrap:"wrap"}}>
          <Btn onClick={download} style={{fontSize:13}}>⬇ Download PNG</Btn>
          <Btn v="sec" onClick={()=>{navigator.clipboard.writeText(verifyUrl);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{copied?"✓ Copied!":"Copy Verify Link"}</Btn>
          <Btn v="ghost" onClick={()=>nav("verify")}>Open Verify Page</Btn>
        </div>
        <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 24px"}}>
          <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:16,textTransform:"uppercase"}}>Certificate Proof</div>
          {[["Certificate ID",cert.certId],["Issued To",cert.fields?.Name],["Event",cert.eventName],["Organization",cert.orgName],["Template",cert.template||"classic"],["Signatories",(cert.signatories||[]).map(s=>s.name).join(", ")||"None"],["Issued At",new Date(cert.issuedAt).toLocaleString("en-IN")],["Expiry",cert.expiryDate||"No expiry"],["SHA-256",cert.hash],["Bitcoin Anchor","⏳ Pending — OpenTimestamps batch"],["Status","VALID ✓"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:18,marginBottom:10,flexWrap:"wrap"}}>
              <div style={{fontFamily:MONO,fontSize:8,color:C.muted,width:110,flexShrink:0,textTransform:"uppercase",paddingTop:2}}>{k}</div>
              <div style={{fontFamily:MONO,fontSize:10,wordBreak:"break-all",flex:1,color:k==="Status"?C.ok:k==="SHA-256"?C.accent:C.text}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VERIFY PAGE ──────────────────────────────────────────────────────────────
function VerifyPage({ nav, adminKey, setAdminKey, initId="" }) {
  const [input,setInput]=useState(initId);const [cert,setCert]=useState(null);const [searched,setSearched]=useState(false);const events=db.get("events",{});
  useEffect(()=>{if(initId){setCert(db.get("certs",{})[initId.trim().toUpperCase()]||null);setSearched(true);}}, [initId]);
  const verify=()=>{setCert(db.get("certs",{})[input.trim().toUpperCase()]||null);setSearched(true);};
  const getExpiry=c=>c&&events[c.eventId]?.expiry;const isExpired=c=>{const ex=getExpiry(c);return ex&&new Date(ex)<new Date();};const statusColor=c=>!c?C.err:c.status==="revoked"?C.err:isExpired(c)?C.warn:C.ok;const statusLabel=c=>!c?"NOT FOUND":c.status==="revoked"?`REVOKED${c.revokeReason?": "+c.revokeReason:""}`:isExpired(c)?"EXPIRED":"VALID ✓";
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:760,margin:"72px auto",padding:"0 24px 60px"}}>
        <div style={{marginBottom:40}}>
          <div style={{fontFamily:MONO,fontSize:9,color:C.accent,letterSpacing:4,marginBottom:8}}>CERTIFICATE VERIFICATION</div>
          <div style={{fontFamily:DISP,fontSize:64,lineHeight:.88,marginBottom:8,color:C.text}}>VERIFY</div>
          <div style={{fontFamily:MONO,fontSize:12,color:C.muted}}>Enter a Certificate ID to verify authenticity and see blockchain proof.</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:32}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verify()} placeholder="Enter Certificate ID (e.g. ZC-ABC123DEF)"
            style={{flex:1,fontFamily:MONO,fontSize:13,padding:"13px 16px",background:"#06060E",border:`1px solid ${C.border}`,color:C.text,outline:"none"}} />
          <Btn onClick={verify} style={{fontSize:12,padding:"13px 28px"}}>Verify →</Btn>
        </div>
        {searched&&<div>
          <div style={{border:`1px solid ${statusColor(cert)}44`,background:statusColor(cert)+"0C",padding:"18px 22px",marginBottom:24,display:"flex",alignItems:"flex-start",gap:16,borderRadius:2}}>
            <div style={{color:statusColor(cert),fontSize:28,lineHeight:1,flexShrink:0}}>{cert&&cert.status!=="revoked"&&!isExpired(cert)?"✓":"✕"}</div>
            <div>
              <div style={{fontFamily:MONO,color:statusColor(cert),fontSize:14,fontWeight:700,marginBottom:4}}>{statusLabel(cert)}</div>
              <div style={{fontFamily:MONO,color:C.muted,fontSize:10}}>{cert?`Issued by ${cert.orgName} · ${cert.eventName}`:"No certificate found with this ID. Check for typos."}</div>
            </div>
          </div>
          {cert&&<>
            <CertCanvas cert={cert} />
            <div style={{marginTop:20,border:`1px solid ${C.border}`,background:C.surface,padding:"20px 24px"}}>
              <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1.5,marginBottom:16,textTransform:"uppercase"}}>Verification Details</div>
              {[["Status",statusLabel(cert)],["Cert ID",cert.certId],["Issued To",cert.fields?.Name],["Email",cert.fields?.Email],["Event",cert.eventName],["Organization",cert.orgName],["Signatories",(cert.signatories||[]).map(s=>`${s.name} (${s.designation})`).join(", ")||"None"],["Issued",new Date(cert.issuedAt).toLocaleString("en-IN")],...(getExpiry(cert)?[["Expiry",getExpiry(cert)]]:[]),...Object.entries(cert.fields||{}).filter(([k])=>k!=="Name"&&k!=="Email"),["SHA-256",cert.hash],["BTC Anchor",cert.btcProof==="pending"?"⏳ Pending — OpenTimestamps batch submission":cert.btcProof]].map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:18,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{fontFamily:MONO,fontSize:8,color:C.muted,width:110,flexShrink:0,textTransform:"uppercase",paddingTop:2}}>{k}</div>
                  <div style={{fontFamily:MONO,fontSize:10,wordBreak:"break-all",flex:1,color:k==="Status"?statusColor(cert):k==="SHA-256"?C.accent:C.text}}>{v}</div>
                </div>
              ))}
            </div>
          </>}
        </div>}
      </div>
    </div>
  );
}

// ─── BULK ISSUE ───────────────────────────────────────────────────────────────
function BulkIssue({ nav, adminKey, setAdminKey }) {
  const [step,setStep]=useState(1);const [selEvent,setSelEvent]=useState(null);const [rows,setRows]=useState([]);const [checked,setChecked]=useState({});const [editCell,setEditCell]=useState(null);const [editVal,setEditVal]=useState("");const [subject,setSubject]=useState(DEFAULT_SUBJECT);const [body,setBody]=useState(DEFAULT_BODY);const [previewRow,setPreviewRow]=useState(0);const [aiLoading,setAiLoading]=useState(false);const [aiSugs,setAiSugs]=useState([]);const [sending,setSending]=useState(false);const [sent,setSent]=useState(0);const [done,setDone]=useState(false);const [paused,setPaused]=useState(false);const pauseRef=useRef(false);const fileRef=useRef(null);const bodyRef=useRef(null);const subjRef=useRef(null);
  const orgEvents=Object.entries(db.get("events",{})).filter(([,e])=>e.orgKey===adminKey).reverse();
  const event=selEvent?db.get("events",{})[selEvent]:null;const org=adminKey?db.get("orgs",{})[adminKey]:null;
  const ALL_VARS=["Name","Email","EventName","OrgName","CertID","IssueDate","VerifyURL",...(event?.fields?.filter(f=>f!=="Name"&&f!=="Email")||[])];
  const revalidate=useCallback(r=>{const seen={};return r.map(row=>{const errs=[];if(!row.data["Name"]?.trim())errs.push("Name required");if(!row.data["Email"]?.trim())errs.push("Email required");else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.data["Email"].trim()))errs.push("Invalid email");const ek=row.data["Email"]?.toLowerCase().trim();if(ek&&seen[ek])errs.push("Duplicate");if(ek)seen[ek]=true;return{...row,errors:errs,valid:errs.length===0};});},[]);
  const handleFile=f=>{if(!f||!event)return;const r=new FileReader();r.onload=e=>{const lines=e.target.result.split("\n").filter(l=>!l.startsWith("#")&&l.trim());if(!lines.length)return;const hdrs=lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));const parsed=lines.slice(1).filter(l=>l.trim()).map((line,idx)=>{const vals=[];let cur="",inQ=false;for(const ch of line){if(ch==='"')inQ=!inQ;else if(ch===","&&!inQ){vals.push(cur.trim());cur="";}else cur+=ch;}vals.push(cur.trim());const row={};hdrs.forEach((h,i)=>{row[h]=(vals[i]||"").replace(/^"|"$/g,"");});return row;});const v=revalidate(parsed.map((d,idx)=>({idx,data:d,errors:[],valid:true,status:"pending",certId:null})));setRows(v);const chk={};v.forEach(r=>{chk[r.idx]=r.valid;});setChecked(chk);};r.readAsText(f);};
  const downloadSample=()=>{if(!event)return;const cols=[...event.fields,"Custom Message"];const s=[[...event.fields.map((f,i)=>i===0?"Rahul Sharma":i===1?"rahul@example.com":"sample"),"Congrats!"],[...event.fields.map((f,i)=>i===0?"Priya Verma":i===1?"priya@example.com":"sample"),""]];const lines=[`# ZeroCert CSV Template — ${event.name}`,`# Required: Name, Email`,`# Custom Message (optional): overrides default email body for this row`,"#",cols.join(","),...s.map(r=>r.map(v=>v.includes(",")?`"${v}"`:v).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines],{type:"text/csv"}));a.download=`zerocert_${event.name.replace(/\s+/g,"_")}.csv`;a.click();};
  const insertVar=(v,t="body")=>{const el=t==="body"?bodyRef.current:subjRef.current;const setter=t==="body"?setBody:setSubject;const cur=t==="body"?body:subject;if(!el){setter(p=>p+`{{${v}}}`);return;}const s=el.selectionStart,e=el.selectionEnd;setter(cur.slice(0,s)+`{{${v}}}`+cur.slice(e));setTimeout(()=>{el.selectionStart=el.selectionEnd=s+v.length+4;el.focus();},0);};
  const aiSuggest=async()=>{setAiLoading(true);setAiSugs([]);try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Generate 4 compelling email subject lines for a certificate email. Event: "${event?.name}". Org: "${org?.name}". Use {{Name}} and {{EventName}} as variables. Under 60 chars each. Return ONLY a JSON array of 4 strings, no markdown.`}]})});const d=await res.json();const txt=d.content?.find(b=>b.type==="text")?.text||"[]";setAiSugs(JSON.parse(txt.replace(/```json|```/g,"").trim()));}catch{setAiSugs(["Could not reach AI — check connection."]);}setAiLoading(false);};
  const startSend=async()=>{const toSend=rows.filter(r=>checked[r.idx]&&r.valid);if(!toSend.length)return;setSending(true);setSent(0);setDone(false);pauseRef.current=false;
    for(const row of toSend){while(pauseRef.current)await sleep(200);await sleep(80+Math.random()*60);
      const evs=db.get("events",{});const evData=evs[selEvent];evData._certSerial=(evData._certSerial||0)+1;db.set("events",evs);
      const serial=event.serialPrefix?`${event.serialPrefix}-${String(evData._certSerial).padStart(3,"0")}`:"ZC-"+uid();
      const issuedAt=new Date().toISOString();const hash=await sha256(JSON.stringify({serial,selEvent,issuedAt,fields:row.data}));
      const logos=event?.coLogos?.length?event.coLogos:event?.logo?[event.logo]:[];
      const cert={certId:serial,serialNumber:serial,eventId:selEvent,eventName:event.name,orgName:org.name,orgKey:adminKey,orgLogos:logos,orgLogo:logos[0]||null,issuedAt,fields:row.data,hash,status:"active",btcProof:"pending",template:event.template||"classic",signatories:event.signatories||[],expiryDate:event.expiry||null};
      const certs=db.get("certs",{});certs[serial]=cert;db.set("certs",certs);
      const isBounced=Math.random()<0.05;const emailRec={certId:serial,to:row.data.Email?.trim(),name:row.data.Name?.trim(),subject:injectVars(subject,row.data,serial,issuedAt,event.name,org.name),sentAt:issuedAt,status:isBounced?"bounced":"sent",opened:!isBounced&&Math.random()>0.5,clicked:!isBounced&&Math.random()>0.74,eventId:selEvent,orgKey:adminKey};
      const emails=db.get("emails",{});emails[serial]=emailRec;db.set("emails",emails);
      setRows(prev=>prev.map(r=>r.idx===row.idx?{...r,status:isBounced?"bounced":"sent",certId:serial}:r));setSent(p=>p+1);}setSending(false);setDone(true);};
  const validRows=rows.filter(r=>r.valid);const errRows=rows.filter(r=>!r.valid);const checkedCount=rows.filter(r=>checked[r.idx]).length;const sentCount=rows.filter(r=>r.status==="sent").length;const bouncedCount=rows.filter(r=>r.status==="bounced").length;
  const toggleAll=()=>{const vi=rows.filter(r=>r.valid).map(r=>r.idx);const allOn=vi.every(i=>checked[i]);setChecked(p=>{const n={...p};vi.forEach(i=>n[i]=!allOn);return n;});};
  const commitEdit=()=>{if(!editCell)return;setRows(prev=>revalidate(prev.map(r=>r.idx===editCell.rowIdx?{...r,data:{...r.data,[editCell.field]:editVal}}:r)));setEditCell(null);};
  const pvRow=validRows[Math.min(previewRow,validRows.length-1)];
  if(!adminKey)return null;
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:1120,margin:"0 auto",padding:"36px 24px 80px"}}>
        <div style={{display:"flex",gap:1,background:C.border,marginBottom:36}}>
          {["Select Event","Upload & Validate CSV","Email Composer","Review & Send"].map((s,i)=>(
            <div key={s} style={{flex:1,background:step===i+1?C.surfaceHigh:C.surface,padding:"12px 16px",borderBottom:`2px solid ${step===i+1?C.accent:step>i+1?C.ok:"transparent"}`}}>
              <div style={{fontFamily:MONO,fontSize:8,color:step===i+1?C.accent:step>i+1?C.ok:C.muted,textTransform:"uppercase",letterSpacing:1}}>{step>i+1?"✓ ":`0${i+1} `}{s}</div>
            </div>
          ))}
        </div>

        {step===1&&<div>
          <div style={{fontFamily:DISP,fontSize:52,marginBottom:28,color:C.text}}>SELECT EVENT</div>
          {orgEvents.length===0?<div style={{border:`2px dashed ${C.border}`,padding:60,textAlign:"center"}}><div style={{fontFamily:MONO,color:C.muted,marginBottom:16}}>No events yet.</div><Btn onClick={()=>nav("createEvent")}>Create First Event →</Btn></div>
            :<div style={{display:"grid",gap:1,background:C.border,marginBottom:22}}>
              {orgEvents.map(([eid,ev])=>{const logos=ev.coLogos?.length?ev.coLogos:ev.logo?[ev.logo]:[];return(
                <div key={eid} onClick={()=>setSelEvent(eid)} style={{background:selEvent===eid?C.surfaceHigh:C.surface,padding:"16px 22px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:selEvent===eid?`3px solid ${C.accent}`:"3px solid transparent"}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    {logos.slice(0,3).map((l,i)=><img key={i} src={l} alt="" style={{width:38,height:38,objectFit:"contain",background:"#FFF",padding:3}} />)}
                    <div><div style={{fontFamily:MONO,fontWeight:700,fontSize:12,color:C.text,marginBottom:4}}>{ev.name}</div><div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>{ev.date} · {ev.fields.join(", ")}{(ev.signatories||[]).length>0&&<span style={{color:C.purple}}> · {ev.signatories.length} signer(s)</span>}</div></div>
                  </div>
                  {selEvent===eid&&<Tag>Selected ✓</Tag>}
                </div>
              );})}
            </div>}
          {selEvent&&<Btn onClick={()=>setStep(2)}>Next: Upload CSV →</Btn>}
        </div>}

        {step===2&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
            <div><div style={{fontFamily:DISP,fontSize:52,lineHeight:.9,color:C.text}}>UPLOAD CSV</div><div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginTop:8}}>Event: <span style={{color:C.accent}}>{event?.name}</span></div></div>
            <Btn v="sec" onClick={downloadSample}>⬇ Sample CSV</Btn>
          </div>
          <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"14px 18px",marginBottom:18,overflowX:"auto"}}>
            <div style={{fontFamily:MONO,fontSize:8,color:C.muted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Expected Format — * = required</div>
            <table style={{borderCollapse:"collapse"}}><thead><tr>{[...event.fields,"Custom Message (optional)"].map(f=><th key={f} style={{fontFamily:MONO,fontSize:9,color:C.accent,textAlign:"left",padding:"4px 14px",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{f}{(f==="Name"||f==="Email")?" *":""}</th>)}</tr></thead>
              <tbody>{[["Rahul Sharma","rahul@example.com"],["Priya Verma","priya@example.com"]].map((r,ri)=><tr key={ri}>{event.fields.map((f,fi)=><td key={f} style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"4px 14px",whiteSpace:"nowrap"}}>{fi===0?r[0]:fi===1?r[1]:"sample_value"}</td>)}<td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"4px 14px",fontStyle:"italic"}}>{ri===0?"Optional":"leave blank"}</td></tr>)}</tbody>
            </table>
          </div>
          {rows.length===0&&<div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${C.border}`,padding:"52px 40px",textAlign:"center",cursor:"pointer",background:C.surface,marginBottom:18}}>
            <div style={{fontSize:40,marginBottom:12}}>↑</div>
            <div style={{fontFamily:MONO,fontSize:12,marginBottom:5,color:C.text}}>Drop CSV here or click to browse</div>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted}}>UTF-8 encoded · .csv only · Max 10,000 rows</div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}} />
          </div>}
          {rows.length>0&&<div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:C.border,marginBottom:14}}>
              {[["Total",rows.length,C.text],["Valid",validRows.length,C.ok],["Errors",errRows.length,C.err],["Selected",checkedCount,C.accent]].map(([l,v,c])=><div key={l} style={{background:C.surface,padding:"12px 18px"}}><div style={{fontFamily:MONO,fontSize:8,color:C.muted,textTransform:"uppercase"}}>{l}</div><div style={{fontFamily:DISP,fontSize:30,color:c}}>{v}</div></div>)}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <Btn sm v="sec" onClick={toggleAll}>{validRows.every(r=>checked[r.idx])?"Deselect All":"Select All Valid"}</Btn>
              <Btn sm v="ghost" onClick={()=>{setRows([]);setChecked({});}}>Clear</Btn>
              <Btn sm v="sec" onClick={downloadSample}>⬇ Sample</Btn>
            </div>
            <div style={{overflowX:"auto",border:`1px solid ${C.border}`,maxHeight:400,overflowY:"auto",marginBottom:14}}>
              <table style={{borderCollapse:"collapse",width:"100%",minWidth:520}}>
                <thead style={{position:"sticky",top:0,background:C.bg,zIndex:2}}><tr>
                  <th style={{width:36,padding:"8px 12px",borderBottom:`1px solid ${C.border}`}}><input type="checkbox" checked={validRows.length>0&&validRows.every(r=>checked[r.idx])} onChange={toggleAll} style={{accentColor:C.accent}} /></th>
                  {["#","Status",...event.fields,"Custom Msg"].map(h=><th key={h} style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"8px 14px",textAlign:"left",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>{rows.map(row=><tr key={row.idx} style={{background:!row.valid?C.errDim:checked[row.idx]?C.accentDim:"transparent"}}>
                  <td style={{padding:"6px 12px",borderBottom:`1px solid ${C.border}11`,textAlign:"center"}}><input type="checkbox" checked={!!checked[row.idx]} disabled={!row.valid} onChange={()=>setChecked(p=>({...p,[row.idx]:!p[row.idx]}))} style={{accentColor:C.accent}} /></td>
                  <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"6px 14px",borderBottom:`1px solid ${C.border}11`}}>{row.idx+1}</td>
                  <td style={{padding:"6px 14px",borderBottom:`1px solid ${C.border}11`}}>{row.status==="sent"?<Tag c={C.ok}>✓ sent</Tag>:row.status==="bounced"?<Tag c={C.err}>bounced</Tag>:row.valid?<Tag c={C.muted}>valid</Tag>:<div>{row.errors.map(e=><div key={e} style={{fontFamily:MONO,fontSize:8,color:C.err}}>✕ {e}</div>)}</div>}</td>
                  {event.fields.map(f=><td key={f} style={{padding:"6px 14px",borderBottom:`1px solid ${C.border}11`}} onDoubleClick={()=>{setEditCell({rowIdx:row.idx,field:f});setEditVal(row.data[f]||"");}}>
                    {editCell?.rowIdx===row.idx&&editCell?.field===f
                      ?<input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={commitEdit} onKeyDown={e=>e.key==="Enter"&&commitEdit()} style={{fontFamily:MONO,fontSize:10,padding:"2px 6px",background:"#060E06",border:`1px solid ${C.accent}`,color:C.text,outline:"none",width:"100%",minWidth:80}} />
                      :<span style={{fontFamily:MONO,fontSize:10,color:row.data[f]?C.text:C.muted,cursor:"text"}}>{row.data[f]||"—"}</span>}
                  </td>)}
                  <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"6px 14px",borderBottom:`1px solid ${C.border}11`,fontStyle:"italic"}}>{row.data["Custom Message"]||"—"}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <div style={{fontFamily:MONO,fontSize:8,color:C.muted,marginBottom:16}}>Double-click any cell to edit inline. Auto-revalidates after edit.</div>
          </div>}
          <div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setStep(1)}>← Back</Btn>{checkedCount>0&&<Btn onClick={()=>setStep(3)}>Next: Email Composer ({checkedCount}) →</Btn>}</div>
        </div>}

        {step===3&&<div>
          <div style={{fontFamily:DISP,fontSize:52,marginBottom:6,color:C.text}}>EMAIL COMPOSER</div>
          <div style={{fontFamily:MONO,fontSize:10,color:C.muted,marginBottom:24}}>Click variable chips to insert at cursor. Live preview on the right.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,alignItems:"start"}}>
            <div>
              <div style={{marginBottom:18}}>
                <div style={{fontFamily:MONO,fontSize:8,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>→ Body Variables (click to insert)</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{ALL_VARS.map(v=><div key={v} onClick={()=>insertVar(v,"body")} style={{fontFamily:MONO,fontSize:9,padding:"3px 9px",border:`1px solid ${C.accent}44`,color:C.accent,background:C.accentDim,cursor:"pointer",userSelect:"none",borderRadius:2}}>{`{{${v}}}`}</div>)}</div>
                <div style={{fontFamily:MONO,fontSize:8,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>→ Subject Variables</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{ALL_VARS.slice(0,5).map(v=><div key={v} onClick={()=>insertVar(v,"subject")} style={{fontFamily:MONO,fontSize:8,padding:"2px 7px",border:`1px solid ${C.info}44`,color:C.info,background:C.infoDim,cursor:"pointer",userSelect:"none",borderRadius:2}}>{`{{${v}}}`}</div>)}</div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <label style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Subject Line</label>
                  <Btn sm v="info" onClick={aiSuggest} disabled={aiLoading}>{aiLoading?"⏳ Generating…":"✦ AI Suggest"}</Btn>
                </div>
                <input ref={subjRef} value={subject} onChange={e=>setSubject(e.target.value)} style={{width:"100%",fontFamily:MONO,fontSize:12,padding:"10px 14px",background:"#06060E",border:`1px solid ${C.border}`,color:C.text,outline:"none",boxSizing:"border-box"}} />
              </div>
              {aiSugs.length>0&&<div style={{border:`1px solid ${C.info}33`,background:C.infoDim,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontFamily:MONO,fontSize:8,color:C.info,marginBottom:10,letterSpacing:1}}>✦ AI SUGGESTIONS — click to apply</div>
                {aiSugs.map((s,i)=><div key={i} onClick={()=>{setSubject(s);setAiSugs([]);}} style={{fontFamily:MONO,fontSize:11,color:C.text,padding:"7px 10px",cursor:"pointer",marginBottom:4,border:`1px solid ${C.border}`,background:C.surface}}>{s}</div>)}
                <div style={{textAlign:"right",marginTop:6}}><Btn sm v="ghost" onClick={()=>setAiSugs([])}>Dismiss</Btn></div>
              </div>}
              <div>
                <label style={{display:"block",fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Email Body</label>
                <textarea ref={bodyRef} value={body} onChange={e=>setBody(e.target.value)} rows={22} style={{width:"100%",fontFamily:MONO,fontSize:11,lineHeight:1.75,padding:"10px 14px",background:"#06060E",border:`1px solid ${C.border}`,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box"}} />
                <div style={{fontFamily:MONO,fontSize:8,color:C.muted,marginTop:4}}>Tip: Add "Custom Message" column in CSV to override body per recipient.</div>
              </div>
            </div>
            <div style={{position:"sticky",top:60}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontFamily:MONO,fontSize:8,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>PREVIEW — Row {previewRow+1}/{validRows.length||1}</div>
                <div style={{display:"flex",gap:6}}><Btn sm v="ghost" onClick={()=>setPreviewRow(p=>Math.max(0,p-1))}>←</Btn><Btn sm v="ghost" onClick={()=>setPreviewRow(p=>Math.min(validRows.length-1,p+1))}>→</Btn></div>
              </div>
              <div style={{background:"#FFF",overflow:"hidden",border:"1px solid #DDD",display:"flex",flexDirection:"column",height:520}}>
                <div style={{background:"#F5F5F5",padding:"10px 14px",borderBottom:"1px solid #DDD",flexShrink:0}}>
                  <div style={{fontFamily:"system-ui",fontSize:10,color:"#666",marginBottom:3}}><strong>From:</strong> {org?.name||"Org"} &lt;noreply@zerocert.app&gt;</div>
                  <div style={{fontFamily:"system-ui",fontSize:10,color:"#666",marginBottom:3}}><strong>To:</strong> {pvRow?.data?.Email||"recipient@email.com"}</div>
                  <div style={{fontFamily:"system-ui",fontSize:12,color:"#000",fontWeight:600}}>{injectVars(subject,pvRow?.data||{},pvRow?.certId||"ZC-P",new Date().toISOString(),event?.name,org?.name)}</div>
                </div>
                <div style={{padding:"14px 16px",overflowY:"auto",flex:1,background:"#FAFAFA"}}>
                  <pre style={{fontFamily:"system-ui",fontSize:11,color:"#333",lineHeight:1.75,whiteSpace:"pre-wrap",margin:0}}>{injectVars(pvRow?.data?.["Custom Message"]||body,pvRow?.data||{},pvRow?.certId||"ZC-P",new Date().toISOString(),event?.name,org?.name)}</pre>
                  <div style={{marginTop:14,padding:"10px 14px",background:"#0C0C1C",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:10,color:"#E8FF00",fontWeight:700,marginBottom:3}}>ZEROCERT · BLOCKCHAIN VERIFIED</div>
                    <div style={{fontFamily:"monospace",fontSize:9,color:"#55557A"}}>zerocert.app/verify</div>
                  </div>
                </div>
              </div>
              {pvRow&&<div style={{marginTop:8,fontFamily:MONO,fontSize:9,color:C.muted,padding:"6px 10px",border:`1px solid ${C.border}`,background:C.surface}}>Previewing: <span style={{color:C.text}}>{pvRow.data.Name}</span> · {pvRow.data.Email}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24}}><Btn v="ghost" onClick={()=>setStep(2)}>← Back</Btn><Btn onClick={()=>setStep(4)}>Next: Review & Send ({checkedCount}) →</Btn></div>
        </div>}

        {step===4&&<div>
          <div style={{fontFamily:DISP,fontSize:52,marginBottom:24,color:done?C.ok:C.text}}>{done?"SEND COMPLETE ✓":sending?"SENDING…":"REVIEW & SEND"}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:1,background:C.border,marginBottom:22}}>
            {[["To Send",checkedCount,C.accent],["Sent",sentCount,C.ok],["Bounced",bouncedCount,C.err],["Pending",sending?checkedCount-sentCount-bouncedCount:0,C.warn],["Skipped",errRows.length,C.muted]].map(([l,v,c])=><div key={l} style={{background:C.surface,padding:"14px 18px"}}><div style={{fontFamily:MONO,fontSize:8,color:C.muted,textTransform:"uppercase"}}>{l}</div><div style={{fontFamily:DISP,fontSize:32,color:c}}>{v}</div></div>)}
          </div>
          {(sending||done)&&<div style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:MONO,fontSize:9,color:C.muted,marginBottom:7}}><span>{sent}/{checkedCount} processed</span><span>{checkedCount?Math.round(sent/checkedCount*100):0}%</span></div>
            <ProgBar value={sent} max={checkedCount} color={done?C.ok:paused?C.warn:C.accent} h={8} />
          </div>}
          {!sending&&!done&&<div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"18px 24px",marginBottom:20}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:14,textTransform:"uppercase"}}>What will happen</div>
            {[[`Issue ${checkedCount} SHA-256 hashed certificates with serial numbers`,C.ok],[`Send personalized emails to ${checkedCount} recipients`,C.info],[`Signatories: ${(event?.signatories||[]).map(s=>s.name).join(", ")||"None"}`,C.purple],[`Bitcoin anchor via OpenTimestamps (batched, ≤2 hrs)`,C.muted],[`Skip ${errRows.length} invalid/unchecked rows`,C.muted]].map(([t,c])=><div key={t} style={{fontFamily:MONO,fontSize:11,color:c,marginBottom:8,display:"flex",gap:10}}><span style={{flexShrink:0}}>›</span><span>{t}</span></div>)}
          </div>}
          {rows.some(r=>r.status!=="pending")&&<div style={{overflowX:"auto",border:`1px solid ${C.border}`,maxHeight:360,overflowY:"auto",marginBottom:20}}>
            <table style={{borderCollapse:"collapse",width:"100%",minWidth:600}}>
              <thead style={{position:"sticky",top:0,background:C.bg}}><tr>{["#","Name","Email","Cert ID","Status","Hash"].map(h=><th key={h} style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"8px 14px",textAlign:"left",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{rows.filter(r=>checked[r.idx]).map(row=>{const cert=row.certId?db.get("certs",{})[row.certId]:null;return(
                <tr key={row.idx} style={{borderBottom:`1px solid ${C.border}08`}}>
                  <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"6px 14px"}}>{row.idx+1}</td>
                  <td style={{fontFamily:MONO,fontSize:10,padding:"6px 14px",color:C.text}}>{row.data.Name}</td>
                  <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"6px 14px"}}>{row.data.Email}</td>
                  <td style={{fontFamily:MONO,fontSize:9,color:C.accent,padding:"6px 14px"}}>{row.certId||"—"}</td>
                  <td style={{padding:"6px 14px"}}>{row.status==="pending"?<Tag c={C.muted}>⏳</Tag>:row.status==="sent"?<Tag c={C.ok}>✓ sent</Tag>:<Tag c={C.err}>✕ bounced</Tag>}</td>
                  <td style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"6px 14px"}}>{cert?.hash?.slice(0,14)||"—"}…</td>
                </tr>);})}</tbody>
            </table>
          </div>}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {!sending&&!done&&<Btn v="ghost" onClick={()=>setStep(3)}>← Back</Btn>}
            {!sending&&!done&&<Btn onClick={startSend}>🚀 Issue {checkedCount} Certs + Send Emails</Btn>}
            {sending&&!done&&<Btn v="warn" onClick={()=>{pauseRef.current=!pauseRef.current;setPaused(p=>!p);}}>{paused?"▶ Resume":"⏸ Pause"}</Btn>}
            {done&&<><Btn v="ok" onClick={()=>{const certs=db.get("certs",{});const lines=["Name,Email,CertID,Status,Hash"];rows.filter(r=>checked[r.idx]).forEach(r=>{const c=r.certId?certs[r.certId]:null;lines.push(`"${r.data.Name||""}","${r.data.Email||""}","${r.certId||""}","${r.status}","${c?.hash?.slice(0,20)||""}…"`);});const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"}));a.download="zerocert_results.csv";a.click();}}>⬇ Results CSV</Btn>
              <Btn v="sec" onClick={()=>nav("analytics")}>View Analytics →</Btn>
              <Btn v="ghost" onClick={()=>nav("dashboard")}>Dashboard</Btn></>}
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ nav, adminKey, setAdminKey }) {
  const org=db.get("orgs",{})[adminKey];const events=db.get("events",{});
  const allCerts=Object.values(db.get("certs",{})).filter(c=>c.orgKey===adminKey);
  const allEmails=Object.values(db.get("emails",{})).filter(e=>e.orgKey===adminKey);
  const orgEvents=Object.entries(events).filter(([,e])=>e.orgKey===adminKey);
  const [range,setRange]=useState(14);const [eventFilter,setEventFilter]=useState("all");const [tab,setTab]=useState("overview");
  const fC=eventFilter==="all"?allCerts:allCerts.filter(c=>c.eventId===eventFilter);
  const fE=eventFilter==="all"?allEmails:allEmails.filter(e=>e.eventId===eventFilter);
  const tot=fE.length,opened=fE.filter(e=>e.opened).length,clicked=fE.filter(e=>e.clicked).length,bounced=fE.filter(e=>e.status==="bounced").length;
  const openRate=tot?Math.round(opened/tot*100):0,clickRate=tot?Math.round(clicked/tot*100):0,bounceRate=tot?Math.round(bounced/tot*100):0;
  const trend=Array.from({length:range},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(range-1-i));const label=d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});const issued=fC.filter(c=>new Date(c.issuedAt).toDateString()===d.toDateString()).length;return{label,issued};});
  const perEvent=orgEvents.map(([eid,ev])=>{const ec=fC.filter(c=>c.eventId===eid);const em=fE.filter(e=>e.eventId===eid);const op=em.filter(e=>e.opened).length,cl=em.filter(e=>e.clicked).length,bo=em.filter(e=>e.status==="bounced").length;return{eid,name:ev.name.length>16?ev.name.slice(0,16)+"…":ev.name,fullName:ev.name,date:ev.date,certs:ec.length,emails:em.length,opened:op,clicked:cl,bounced:bo,openRate:em.length?Math.round(op/em.length*100):0,clickRate:em.length?Math.round(cl/em.length*100):0,bounceRate:em.length?Math.round(bo/em.length*100):0};}).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const pieData=[{name:"Opened & Clicked",value:clicked,color:C.ok},{name:"Opened Only",value:opened-clicked,color:C.accent},{name:"Delivered, Unopened",value:tot-opened-bounced,color:C.border},{name:"Bounced",value:bounced,color:C.err}].filter(d=>d.value>0);
  const TK={fontFamily:MONO,fontSize:8,fill:C.muted};
  const CT=({active,payload,label})=>active&&payload?.length?<div style={{background:C.surface,border:`1px solid ${C.border}`,padding:"8px 12px",fontFamily:MONO,fontSize:10}}><div style={{color:C.muted,marginBottom:4}}>{label}</div>{payload.map(p=><div key={p.dataKey} style={{color:p.color}}>{p.name}: <strong>{p.value}</strong></div>)}</div>:null;
  const exportAll=()=>{const lines=["Name,Email,CertID,Event,Status,Opened,Clicked,SentAt"];fE.forEach(e=>{lines.push(`"${e.name||""}","${e.to||""}","${e.certId||""}","${events[e.eventId]?.name||""}","${e.status}","${e.opened?"yes":"no"}","${e.clicked?"yes":"no"}","${e.sentAt||""}"`)});const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"}));a.download="zerocert_analytics.csv";a.click();};
  const seedDemo=()=>{if(!org||!adminKey)return;const eid="DEMO-"+uid();const evs=db.get("events",{});evs[eid]={name:"Demo Hackathon 2025",date:"2025-03-15",desc:"Seeded demo",logo:null,coLogos:[],fields:["Name","Email","Track"],orgKey:adminKey,expiry:"",template:"dark",signatories:[{name:"Dr. Rajesh Kumar",designation:"Director",signatureType:"typed",signatureData:"Rajesh Kumar",signatureFont:"dancing_script"}],serialPrefix:"DEMO/2025",createdAt:new Date(Date.now()-14*86400000).toISOString(),_certSerial:0};db.set("events",evs);const names=["Rahul Sharma","Priya Verma","Aditya Nair","Sneha Patel","Karan Mehta","Divya Rao","Arjun Singh","Neha Gupta","Rohan Das","Ananya Iyer","Vikram Bose","Pooja Nair","Siddharth Kumar","Riya Joshi","Manish Tiwari"];const certs=db.get("certs",{});const emails=db.get("emails",{});const now=Date.now();names.forEach((nm,i)=>{const da=Math.floor(Math.random()*12);const issuedAt=new Date(now-da*86400000-Math.random()*43200000).toISOString();const cid=`DEMO/2025-${String(i+1).padStart(3,"0")}`;const isBounced=i===3||i===11;const isOpened=!isBounced&&Math.random()>0.38;const isClicked=isOpened&&Math.random()>0.55;certs[cid]={certId:cid,eventId:eid,eventName:"Demo Hackathon 2025",orgName:org.name,orgKey:adminKey,issuedAt,fields:{Name:nm,Email:`${nm.toLowerCase().replace(/\s/g,".")}@example.com`},hash:"ab"+Math.random().toString(16).slice(2,62),status:"active",template:"dark"};emails[cid]={certId:cid,to:`${nm.toLowerCase().replace(/\s/g,".")}@example.com`,name:nm,sentAt:issuedAt,status:isBounced?"bounced":"sent",opened:isOpened,clicked:isClicked,eventId:eid,orgKey:adminKey};});db.set("certs",certs);db.set("emails",emails);window.location.reload();};
  if(!org)return <div style={{padding:80,textAlign:"center",fontFamily:MONO}}><Btn onClick={()=>nav("adminLogin")}>← Login</Btn></div>;
  const tabStyle=t=>({fontFamily:MONO,fontSize:9,padding:"10px 20px",cursor:"pointer",letterSpacing:1,textTransform:"uppercase",color:tab===t?C.accent:C.muted,background:"transparent",border:"none",borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,transition:"all 0.15s"});
  return (
    <div><NavBar nav={nav} adminKey={adminKey} setAdminKey={setAdminKey} />
      <div style={{maxWidth:1060,margin:"0 auto",padding:"36px 24px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:14}}>
          <div>
            <div style={{fontFamily:MONO,fontSize:9,color:C.accent,letterSpacing:4,marginBottom:6}}>ORGANIZATION ANALYTICS</div>
            <div style={{fontFamily:DISP,fontSize:52,lineHeight:.9,color:C.text}}>ANALYTICS</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {tot===0&&<Btn v="warn" onClick={seedDemo}>Seed Demo Data</Btn>}
            <Btn v="sec" onClick={exportAll} disabled={tot===0}>⬇ Export CSV</Btn>
            <Btn onClick={()=>nav("bulkIssue")}>New Bulk Send</Btn>
          </div>
        </div>
        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap",alignItems:"center"}}>
          <select value={eventFilter} onChange={e=>setEventFilter(e.target.value)} style={{fontFamily:MONO,fontSize:10,padding:"7px 12px",background:"#06060E",border:`1px solid ${C.border}`,color:C.text,outline:"none"}}>
            <option value="all">All Events</option>
            {orgEvents.map(([eid,ev])=><option key={eid} value={eid}>{ev.name}</option>)}
          </select>
          <div style={{marginLeft:"auto",display:"flex",gap:4}}>
            {[7,14,30].map(d=><button key={d} onClick={()=>setRange(d)} style={{fontFamily:MONO,fontSize:9,padding:"5px 12px",background:range===d?C.accentDim:"transparent",border:`1px solid ${range===d?C.accent:C.border}`,color:range===d?C.accent:C.muted,cursor:"pointer"}}>{d}D</button>)}
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:28}}>
          {["overview","delivery","events","activity"].map(t=><button key={t} onClick={()=>setTab(t)} style={tabStyle(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
        </div>

        {tab==="overview"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:1,background:C.border,marginBottom:28}}>
            <StatCard label="Certs Issued" value={fC.length} icon="⬡" />
            <StatCard label="Emails Sent" value={tot} c={C.info} icon="@" />
            <StatCard label="Open Rate" value={tot?openRate+"%":"—"} c={C.ok} icon="%" />
            <StatCard label="Click Rate" value={tot?clickRate+"%":"—"} c={C.accent} icon="↗" />
            <StatCard label="Bounce Rate" value={tot?bounceRate+"%":"—"} c={C.err} icon="✕" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
            <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 18px"}}>
              <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>Certs Issued — Last {range} Days</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trend}>
                  <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.25}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={TK} tickLine={false} axisLine={false} interval={range>14?3:1} />
                  <YAxis tick={TK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CT />} />
                  <Area type="monotone" dataKey="issued" name="Certs" stroke={C.accent} strokeWidth={2} fill="url(#ag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 18px"}}>
              <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Email Engagement Breakdown</div>
              {pieData.length>0?<div style={{display:"flex",gap:14,alignItems:"center"}}>
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={74} dataKey="value" paddingAngle={2}>{pieData.map((d,i)=><Cell key={i} fill={d.color} />)}</Pie><Tooltip content={<CT />} /></PieChart>
                </ResponsiveContainer>
                <div style={{flex:1}}>
                  {pieData.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <div style={{width:8,height:8,background:d.color,borderRadius:"50%",flexShrink:0}} />
                    <div><div style={{fontFamily:MONO,fontSize:9,color:C.text}}>{d.name}</div><div style={{fontFamily:MONO,fontSize:8,color:C.muted}}>{d.value} ({tot?Math.round(d.value/tot*100):0}%)</div></div>
                  </div>)}
                </div>
              </div>:<div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:MONO,fontSize:10,color:C.muted}}>No email data yet</div>}
            </div>
          </div>
        </div>}

        {tab==="delivery"&&<div>
          <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 18px",marginBottom:20}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:18,textTransform:"uppercase"}}>Open Rate vs Click Rate — per Event</div>
            {perEvent.filter(e=>e.emails>0).length>0?<ResponsiveContainer width="100%" height={220}>
              <BarChart data={perEvent.filter(e=>e.emails>0)} barSize={14}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={TK} tickLine={false} axisLine={false} />
                <YAxis tick={TK} tickLine={false} axisLine={false} domain={[0,100]} unit="%" />
                <Tooltip content={<CT />} formatter={v=>v+"%"} />
                <Legend wrapperStyle={{fontFamily:MONO,fontSize:9,color:C.muted}} />
                <Bar dataKey="openRate" name="Open Rate" fill={C.ok} radius={[2,2,0,0]} />
                <Bar dataKey="clickRate" name="Click Rate" fill={C.accent} radius={[2,2,0,0]} />
                <Bar dataKey="bounceRate" name="Bounce Rate" fill={C.err} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>:<div style={{height:220,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:MONO,fontSize:10,color:C.muted}}>No email data yet.</div>}
          </div>
          <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 24px"}}>
            <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,marginBottom:18,textTransform:"uppercase"}}>Delivery Funnel</div>
            {[["Sent",tot,tot,C.info],["Delivered",tot-bounced,tot,C.ok],["Opened",opened,tot,C.accent],["Clicked",clicked,tot,C.accent],["Bounced",bounced,tot,C.err]].map(([l,v,m,c])=><div key={l} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",fontFamily:MONO,fontSize:9,color:C.muted,marginBottom:5}}><span>{l}</span><span style={{color:C.text}}>{v} ({m?Math.round(v/m*100):0}%)</span></div><ProgBar value={v} max={m} color={c} h={6} /></div>)}
          </div>
        </div>}

        {tab==="events"&&<div>
          <div style={{border:`1px solid ${C.border}`,overflowX:"auto",marginBottom:20}}>
            <table style={{borderCollapse:"collapse",width:"100%",minWidth:800}}>
              <thead><tr style={{background:C.surface}}>{["Event","Date","Certs","Emails","Opened","Clicked","Bounced","Open %","Click %","Bounce %"].map(h=><th key={h} style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"12px 16px",textAlign:"left",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
              <tbody>{perEvent.length===0?<tr><td colSpan={10} style={{fontFamily:MONO,fontSize:10,color:C.muted,padding:"40px 16px",textAlign:"center"}}>No events yet.</td></tr>:perEvent.map(e=>(
                <tr key={e.eid} style={{borderBottom:`1px solid ${C.border}11`}}>
                  <td style={{fontFamily:MONO,fontSize:11,fontWeight:700,padding:"12px 16px",color:C.text,whiteSpace:"nowrap"}}>{e.fullName}</td>
                  <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"12px 16px"}}>{e.date}</td>
                  <td style={{fontFamily:MONO,fontSize:11,color:C.accent,padding:"12px 16px"}}>{e.certs}</td>
                  <td style={{fontFamily:MONO,fontSize:11,padding:"12px 16px"}}>{e.emails}</td>
                  <td style={{fontFamily:MONO,fontSize:11,color:C.ok,padding:"12px 16px"}}>{e.opened}</td>
                  <td style={{fontFamily:MONO,fontSize:11,color:C.accent,padding:"12px 16px"}}>{e.clicked}</td>
                  <td style={{fontFamily:MONO,fontSize:11,color:C.err,padding:"12px 16px"}}>{e.bounced}</td>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><ProgBar value={e.openRate} max={100} color={e.openRate>40?C.ok:C.warn} h={4} /><span style={{fontFamily:MONO,fontSize:9,color:C.text,whiteSpace:"nowrap"}}>{e.openRate}%</span></div></td>
                  <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><ProgBar value={e.clickRate} max={100} color={e.clickRate>20?C.ok:C.muted} h={4} /><span style={{fontFamily:MONO,fontSize:9,color:C.text,whiteSpace:"nowrap"}}>{e.clickRate}%</span></div></td>
                  <td style={{padding:"12px 16px"}}><Tag c={e.bounceRate>10?C.err:C.ok}>{e.bounceRate}%</Tag></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>}

        {tab==="activity"&&<div>
          <div style={{border:`1px solid ${C.border}`,background:C.surface,padding:"20px 18px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:MONO,fontSize:9,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Recent Email Activity</div>
              <Btn sm v="sec" onClick={exportAll} disabled={tot===0}>⬇ Export Full Log</Btn>
            </div>
            {fE.length===0?<div style={{fontFamily:MONO,fontSize:10,color:C.muted,padding:"40px 0",textAlign:"center"}}>No emails sent yet.</div>
              :<div style={{maxHeight:440,overflowY:"auto"}}>
                <table style={{borderCollapse:"collapse",width:"100%",minWidth:600}}>
                  <thead style={{position:"sticky",top:0,background:C.surface}}><tr>{["Name","Email","Event","Date","Status","Opened","Clicked"].map(h=><th key={h} style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"8px 14px",textAlign:"left",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>{[...fE].sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt)).slice(0,100).map((e,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.border}08`}}>
                      <td style={{fontFamily:MONO,fontSize:10,padding:"7px 14px",color:C.text}}>{e.name}</td>
                      <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"7px 14px",whiteSpace:"nowrap"}}>{e.to}</td>
                      <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"7px 14px",whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}}>{events[e.eventId]?.name||"—"}</td>
                      <td style={{fontFamily:MONO,fontSize:9,color:C.muted,padding:"7px 14px",whiteSpace:"nowrap"}}>{e.sentAt?new Date(e.sentAt).toLocaleDateString("en-IN"):"—"}</td>
                      <td style={{padding:"7px 14px"}}>{e.status==="sent"?<Tag c={C.ok}>sent</Tag>:<Tag c={C.err}>bounced</Tag>}</td>
                      <td style={{padding:"7px 14px"}}>{e.opened?<Tag c={C.ok}>✓</Tag>:<Tag c={C.muted}>—</Tag>}</td>
                      <td style={{padding:"7px 14px"}}>{e.clicked?<Tag c={C.accent}>✓</Tag>:<Tag c={C.muted}>—</Tag>}</td>
                    </tr>
                  ))}</tbody>
                </table>
                {fE.length>100&&<div style={{fontFamily:MONO,fontSize:8,color:C.muted,padding:"10px 14px"}}>Showing 100 of {fE.length}. Export for full data.</div>}
              </div>}
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function ZeroCert() {
  const [view,setView]         = useState("landing");
  const [adminKey,setAdminKey] = useState(null);
  const [eventId,setEventId]   = useState(null);
  const [verifyId,setVerifyId] = useState("");
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    if(p.get("event")){setEventId(p.get("event"));setView("eventPage");}
    if(p.get("verify")){setVerifyId(p.get("verify"));setView("verify");}
  },[]);
  const nav=useCallback((v,extraId=null)=>{
    setView(v);
    if(v==="eventPage"&&extraId)setEventId(extraId);
    if(v==="verify"&&extraId)setVerifyId(extraId);
  },[]);
  const shared={nav,adminKey,setAdminKey};
  const views={
    landing:     <Landing     {...shared} />,
    adminLogin:  <AdminLogin  {...shared} />,
    dashboard:   <Dashboard  {...shared} />,
    createEvent: <CreateEvent {...shared} />,
    eventPage:   <EventPage  {...shared} eventId={eventId} />,
    verify:      <VerifyPage  {...shared} initId={verifyId} />,
    bulkIssue:   <BulkIssue  {...shared} />,
    analytics:   <Analytics  {...shared} />,
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Bebas+Neue&family=Dancing+Script:wght@600&family=Pacifico&family=Caveat:wght@600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        ::-webkit-scrollbar-thumb:hover{background:${C.borderHigh};}
        ::selection{background:${C.accent};color:#000;}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(0.3);cursor:pointer;}
        input::placeholder,textarea::placeholder{color:${C.muted};opacity:.7;}
        button:focus{outline:none;}
        select option{background:${C.bg};}
      `}</style>
      {/* Subtle grid bg */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${C.border}60 1px,transparent 1px),linear-gradient(90deg,${C.border}60 1px,transparent 1px)`,backgroundSize:"52px 52px",pointerEvents:"none",zIndex:0,opacity:.6}} />
      {/* Top accent glow */}
      <div style={{position:"fixed",top:-300,left:"50%",transform:"translateX(-50%)",width:900,height:600,background:`radial-gradient(ellipse,${C.accent}06 0%,transparent 65%)`,pointerEvents:"none",zIndex:0}} />
      <div style={{position:"relative",zIndex:1,minHeight:"100vh",color:C.text,fontFamily:MONO}}>
        {views[view]||views.landing}
      </div>
    </>
  );
}
