(()=>{'use strict';
const $=s=>document.querySelector(s),cv=$('#cv'),ctx=cv.getContext('2d'),TAU=Math.PI*2;
const KEYS=['coord','grid','vec','lab','max'];
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon.svg'];
const S={mode:'idle',was:'live',demo:null,coord:'cart',grid:true,vec:true,lab:true,max:2000,pts:[],prev:null,origin:null,lastMouse:0,path:0,w:300,h:300,dirty:true,drag:false,t:0};
try{const o=JSON.parse(localStorage.getItem('optitrack')||'{}');KEYS.forEach(k=>{if(k in o)S[k]=o[k]})}catch(e){}
if(![500,1000,2000,5000].includes(S.max))S.max=2000;
const save=()=>{try{localStorage.setItem('optitrack',JSON.stringify(Object.fromEntries(KEYS.map(k=>[k,S[k]]))))}catch(e){}};
const msg=t=>{$('#msg').textContent=t||''};
const ori=()=>S.origin||(S.coord==='cart'?{x:S.w/2,y:S.h/2}:{x:0,y:0});
const gx=p=>p.px-ori().x,gy=p=>S.coord==='cart'?ori().y-p.py:p.py-ori().y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const col=()=>S.mode==='demo'||(S.mode==='paused'&&S.was==='demo')?{t:'#a78bfa',m:'#fbbf24'}:{t:'#22d3ee',m:'#ff4d4d'};

function add(px,py,sx,sy,src){
 const q=S.prev;if(q&&q.px===px&&q.py===py)return;
 const p={t:performance.now(),px,py,sx,sy,src,brk:!q};
 if(q)S.path+=Math.hypot(px-q.px,py-q.py);
 S.pts.push(p);S.prev=p;
 if(S.pts.length>S.max)S.pts.splice(0,S.pts.length-S.max);
 S.dirty=true;
}
function clearAll(){S.pts=[];S.prev=null;S.path=0;S.t=0;S.dirty=true}
function resize(){
 const r=cv.parentElement.getBoundingClientRect(),d=window.devicePixelRatio||1;
 S.w=Math.max(100,r.width);S.h=Math.max(100,r.height);
 cv.width=Math.round(S.w*d);cv.height=Math.round(S.h*d);ctx.setTransform(d,0,0,d,0,0);
 S.prev=null;S.dirty=true;
}
new ResizeObserver(resize).observe(cv.parentElement);
addEventListener('orientationchange',()=>setTimeout(resize,200));
addEventListener('resize',resize);

/* ---- input ---- */
addEventListener('pointermove',e=>{
 if(S.mode!=='live')return;
 if(e.pointerType&&e.pointerType!=='mouse')return;
 S.lastMouse=performance.now();
 const r=cv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
 if(px<0||py<0||px>r.width||py>r.height){S.prev=null;return}
 add(px,py,e.screenX,e.screenY,'live');
},{passive:true});
document.addEventListener('pointerleave',()=>{S.prev=null});
document.documentElement.addEventListener('mouseleave',()=>{S.prev=null});
addEventListener('blur',()=>{S.prev=null;S.drag=false});
document.addEventListener('visibilitychange',()=>{S.prev=null});
cv.addEventListener('pointerdown',e=>{
 if(S.mode==='demo'&&S.demo==='drag'){S.drag=true;S.prev=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}
  const r=cv.getBoundingClientRect();add(e.clientX-r.left,e.clientY-r.top,null,null,'demo')}
});
cv.addEventListener('pointermove',e=>{
 if(S.mode==='demo'&&S.demo==='drag'&&S.drag){const r=cv.getBoundingClientRect();
  add(clamp(e.clientX-r.left,0,r.width),clamp(e.clientY-r.top,0,r.height),null,null,'demo')}
});
const endDrag=()=>{S.drag=false;S.prev=null};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);

/* ---- controls ---- */
const setMode=(m,d)=>{S.mode=m;if(d!==undefined)S.demo=d;S.prev=null;S.dirty=true;refresh()};
$('#start').onclick=()=>{clearAll();msg('Move a mouse over the graph. If nothing appears, use DEMO MODE.');setMode('live',null)};
$('#pause').onclick=()=>{if(S.mode==='live'||S.mode==='demo'){S.was=S.mode;setMode('paused')}};
$('#resume').onclick=()=>{if(S.mode==='paused')setMode(S.was)};
$('#clear').onclick=()=>{clearAll();msg('')};
$('#origin').onclick=()=>{const l=S.pts[S.pts.length-1];S.origin=l?{x:l.px,y:l.py}:null;S.dirty=true;msg(l?'Origin set to last pointer position.':'Origin reset to default.')};
$('#grid').onclick=()=>{S.grid=!S.grid;save();refresh()};
$('#vec').onclick=()=>{S.vec=!S.vec;save();refresh()};
$('#lab').onclick=()=>{S.lab=!S.lab;save();refresh()};
$('#coord').onclick=()=>{S.coord=S.coord==='cart'?'scr':'cart';S.origin=null;save();refresh()};
$('#max').onchange=e=>{S.max=+e.target.value;if(S.pts.length>S.max)S.pts.splice(0,S.pts.length-S.max);save();S.dirty=true};
$('#full').onclick=()=>{
 const f=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
 if(f&&f.catch)f.catch(()=>msg('Full screen is not available here.'));
};
document.addEventListener('fullscreenchange',()=>setTimeout(resize,100));
$('#ddrag').onclick=()=>{clearAll();msg('DEMO: drag a finger or mouse on the graph. Data is simulated.');setMode('demo','drag')};
$('#dsample').onclick=()=>{clearAll();msg('DEMO: built-in sample path. Data is simulated.');setMode('demo','sample')};
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('#csv').onclick=()=>{
 if(!S.pts.length){msg('Nothing to export yet.');return}
 const t0=S.pts[0].t,rows=['index,time_ms,source,coord_mode,graph_x,graph_y,delta_x,delta_y,browser_screen_x,browser_screen_y'];
 S.pts.forEach((p,i)=>{const q=i&&!p.brk?S.pts[i-1]:null;
  const dx=q?p.px-q.px:0,dy=q?(S.coord==='cart'?-(p.py-q.py):p.py-q.py):0;
  rows.push([i,Math.round(p.t-t0),p.src==='live'?'LIVE_POINTER':'DEMO_SIMULATED',S.coord==='cart'?'cartesian':'screen',gx(p).toFixed(1),gy(p).toFixed(1),dx.toFixed(1),dy.toFixed(1),p.sx==null?'':p.sx,p.sy==null?'':p.sy].join(','))});
 dl(new Blob([rows.join('\n')],{type:'text/csv'}),'optitrack-session.csv');msg('CSV exported.');
};
$('#png').onclick=()=>{draw();cv.toBlob(b=>{if(b){dl(b,'optitrack-graph.png');msg('PNG exported.')}else msg('PNG export failed.')},'image/png')};

function refresh(){
 const live=S.mode==='live',dm=S.mode==='demo'||(S.mode==='paused'&&S.was==='demo');
 $('#grid').setAttribute('aria-pressed',S.grid);$('#vec').setAttribute('aria-pressed',S.vec);$('#lab').setAttribute('aria-pressed',S.lab);
 $('#pause').disabled=!(live||S.mode==='demo');$('#resume').disabled=S.mode!=='paused';$('#max').value=S.max;
 $('#coordlbl').textContent=S.coord==='cart'?'Cartesian (origin centre, Y up)':'Screen (origin top-left, Y down)';
 const b=$('#badge');b.className='badge'+(dm?' demo':'');
 let t='READY — PRESS START';
 if(S.mode==='live'){const ok=performance.now()-S.lastMouse<2000;t=ok?'LIVE':'WAITING FOR MOUSE';if(ok)b.className='badge live'}
 else if(S.mode==='paused')t='PAUSED';else if(S.mode==='demo')t='DEMO MODE';
 b.textContent=t;
 const ok=performance.now()-S.lastMouse<2000,m=$('#mouse');
 m.textContent=ok?'● Mouse input detected (pointerType: mouse)':'○ No mouse input yet';m.className='small mouse'+(ok?' on':'');
}
setInterval(refresh,400);

/* ---- drawing ---- */
function draw(){
 const W=S.w,H=S.h,o=ori(),c=col(),st=50;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#0d1a33';ctx.fillRect(0,0,W,H);
 ctx.font='11px ui-monospace,Menlo,Consolas,monospace';
 if(S.grid){ctx.lineWidth=1;ctx.strokeStyle='rgba(120,160,220,.15)';ctx.beginPath();
  for(let x=((o.x%st)+st)%st;x<=W;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,H)}
  for(let y=((o.y%st)+st)%st;y<=H;y+=st){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke()}
 ctx.strokeStyle='rgba(143,163,199,.7)';ctx.lineWidth=1.5;ctx.beginPath();
 ctx.moveTo(0,o.y);ctx.lineTo(W,o.y);ctx.moveTo(o.x,0);ctx.lineTo(o.x,H);ctx.stroke();
 if(S.lab){ctx.fillStyle='#8fa3c7';
  const ly=clamp(o.y+13,13,H-4),lx=clamp(o.x+4,2,W-34);
  for(let k=-Math.ceil(o.x/st);k<=Math.ceil((W-o.x)/st);k++){if(k&&k%2===0){const x=o.x+k*st;if(x>0&&x<W-24)ctx.fillText(k*st,x+2,ly)}}
  for(let j=-Math.ceil(o.y/st);j<=Math.ceil((H-o.y)/st);j++){if(j&&j%2===0){const y=o.y+j*st;if(y>12&&y<H)ctx.fillText(S.coord==='cart'?-j*st:j*st,lx,y-3)}}
  ctx.fillStyle='#e8f0ff';ctx.fillText('+X →',W-40,clamp(o.y-6,12,H-4));
  ctx.fillText(S.coord==='cart'?'+Y ↑':'+Y ↓',clamp(o.x+6,2,W-40),S.coord==='cart'?12:H-6);
  ctx.fillText('(0,0)',clamp(o.x+4,2,W-40),clamp(o.y-6,12,H-4))}
 const P=S.pts,n=P.length;
 if(!n){ctx.fillStyle='#8fa3c7';ctx.font='14px system-ui,sans-serif';ctx.textAlign='center';
  ctx.fillText(S.mode==='demo'&&S.demo==='drag'?'Drag here (simulated)':S.mode==='live'?'Move a mouse over this graph':'Press Start Tracking or choose a Demo',W/2,H/2);ctx.textAlign='left'}
 ctx.lineWidth=2;ctx.lineJoin='round';ctx.strokeStyle=c.t;ctx.beginPath();
 for(let i=0;i<n;i++){const p=P[i];if(i===0||p.brk)ctx.moveTo(p.px,p.py);else ctx.lineTo(p.px,p.py)}ctx.stroke();
 if(S.vec){ctx.fillStyle=c.t;ctx.strokeStyle=c.t;ctx.lineWidth=1;
  for(let i=Math.max(1,n-150);i<n;i++){const p=P[i],q=P[i-1];if(p.brk)continue;
   const dx=p.px-q.px,dy=p.py-q.py,L=Math.hypot(dx,dy);if(L<5)continue;
   const a=Math.atan2(dy,dx),mx=(p.px+q.px)/2,my=(p.py+q.py)/2,s=7;
   ctx.beginPath();ctx.moveTo(mx+Math.cos(a)*s,my+Math.sin(a)*s);
   ctx.lineTo(mx+Math.cos(a+2.5)*s,my+Math.sin(a+2.5)*s);ctx.lineTo(mx+Math.cos(a-2.5)*s,my+Math.sin(a-2.5)*s);ctx.closePath();ctx.fill()}}
 if(n){const l=P[n-1];ctx.fillStyle=c.m;ctx.beginPath();ctx.arc(l.px,l.py,6,0,TAU);ctx.fill();
  ctx.strokeStyle=c.m;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(l.px,l.py,11,0,TAU);ctx.stroke();
  if(S.lab){ctx.fillStyle='#e8f0ff';ctx.font='12px ui-monospace,Menlo,Consolas,monospace';
   ctx.fillText('('+Math.round(gx(l))+', '+Math.round(gy(l))+')',clamp(l.px+14,2,W-80),clamp(l.py-12,14,H-4))}}
 if(S.mode==='demo'||(S.mode==='paused'&&S.was==='demo')){
  ctx.setLineDash([8,6]);ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,W-3,H-3);ctx.setLineDash([]);
  ctx.fillStyle='#fbbf24';ctx.font='bold 12px system-ui,sans-serif';ctx.fillText('DEMO — SIMULATED DATA, NOT LIVE MOUSE',8,H-10)}
}
const DIRS=['→ East','↗ North-East','↑ North','↖ North-West','← West','↙ South-West','↓ South','↘ South-East'];
function readouts(){
 const P=S.pts,n=P.length,l=P[n-1];
 $('#rn').textContent=n;$('#rp').textContent=S.path.toFixed(0);
 if(!l){['#rx','#ry','#rdx','#rdy','#rdir'].forEach(i=>$(i).textContent='—');$('#rs').textContent='—';return}
 $('#rx').textContent=Math.round(gx(l));$('#ry').textContent=Math.round(gy(l));
 $('#rs').textContent=l.sx==null?'n/a (demo)':l.sx+', '+l.sy;
 const q=!l.brk&&n>1?P[n-2]:null;
 if(!q){$('#rdx').textContent='0';$('#rdy').textContent='0';$('#rdir').textContent='—';return}
 const dx=l.px-q.px,dy=l.py-q.py;
 $('#rdx').textContent=Math.round(dx);$('#rdy').textContent=Math.round(S.coord==='cart'?-dy:dy);
 const a=Math.atan2(-dy,dx)*180/Math.PI;$('#rdir').textContent=DIRS[((Math.round(a/45)%8)+8)%8];
}
let last=performance.now(),acc=0;
function frame(now){
 const dt=Math.min(100,now-last);last=now;
 if(S.mode==='demo'&&S.demo==='sample'){acc+=dt;
  while(acc>=30&&S.t<=TAU){acc-=30;const t=S.t;
   add(S.w/2+S.w*.38*Math.cos(3*t),S.h/2+S.h*.34*Math.sin(2*t),null,null,'demo');S.t+=.03;
   if(S.t>TAU)msg('Sample path complete. Tap "Demo: Sample Path" to replay.')}}
 if(S.dirty){draw();readouts();S.dirty=false}
 requestAnimationFrame(frame);
}

/* ---- offline readiness ---- */
const off=(cls,t)=>{const e=$('#off');e.className='badge off '+cls;e.textContent=t};
async function checkOffline(tries){
 if(!window.isSecureContext||!('serviceWorker' in navigator)||!window.caches){off('bad','OFFLINE: NOT AVAILABLE (needs HTTPS)');return}
 try{const miss=[];for(const u of ASSETS){if(!(await caches.match(u)))miss.push(u)}
  if(!miss.length&&navigator.serviceWorker.controller!==null){off('ok','OFFLINE READY ✓');return}
  if(!miss.length){off('','OFFLINE: CACHED — RELOAD ONCE');return}
  if(tries>0)setTimeout(()=>checkOffline(tries-1),1500);else off('bad','OFFLINE: NOT READY ('+miss.length+' missing)');
 }catch(e){off('bad','OFFLINE: CHECK FAILED')}
}
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.register('sw.js').then(()=>checkOffline(8)).catch(()=>off('bad','OFFLINE: REGISTRATION FAILED'));
 navigator.serviceWorker.addEventListener('controllerchange',()=>checkOffline(3));
}else off('bad','OFFLINE: NOT AVAILABLE (needs HTTPS)');
window.addEventListener('error',e=>msg('Error: '+e.message+' — press Clear Trail or reload.'));
refresh();resize();requestAnimationFrame(frame);
})();
