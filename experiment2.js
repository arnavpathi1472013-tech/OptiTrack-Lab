(()=>{'use strict';
const SURF=[['pad','Mouse pad'],['paper','White paper'],['gloss','Glossy surface']];
const CONS=['Smooth','Mostly smooth','Interrupted'];
const KEY='optitrack-exp2',TABKEY='optitrack-tab';
const $=s=>document.querySelector(s),sname=id=>(SURF.find(s=>s[0]===id)||[0,id])[1];
const st={trials:[],nextId:1};let editId=null;
const valid=t=>t&&SURF.some(s=>s[0]===t.surface)&&Number.isInteger(t.n)&&t.n>=1&&t.n<=999&&CONS.includes(t.c)&&Number.isInteger(t.i)&&t.i>=0&&t.i<=999&&typeof t.no==='string'&&Number.isInteger(t.id);
try{const o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&Array.isArray(o.trials)){st.trials=o.trials.filter(valid);st.nextId=st.trials.reduce((m,t)=>Math.max(m,t.id),0)+1}}catch(e){}
const root=$('#exp2');
root.innerHTML=
'<h2 class="ex-h">Experiment 2 — Surface Tracking Test</h2><p class="sub">Does the same optical mouse track consistently on a mouse pad, white paper and a glossy surface?</p>'+
'<details class="ex-card" open><summary><b>Procedure</b></summary><ol><li>Connect the same optical mouse for all trials.</li><li>Place it on the selected test surface.</li><li>Mark or measure a straight test path of 100 mm.</li><li>Move the mouse along that path at a reasonably consistent speed.</li><li>Observe whether tracking stays smooth and whether interruptions occur.</li><li>Record the observations below.</li><li>Repeat for the other two surfaces, keeping conditions as similar as possible.</li></ol><p class="ex-note"><b>100 mm is the physical test distance on the surface</b>, not a measurement of screen pixels.</p></details>'+
'<section class="ex-card"><h3>Live pointer view (optional)</h3><div class="ex-cv"><canvas id="e2cv" aria-label="Live pointer trail" role="img"></canvas></div><div class="row"><button id="e2live">Start Live View</button><button id="e2clr">Clear Trail</button></div><p id="e2st" class="small" role="status"></p><p class="disc">Browser pointer events show cursor positions reported by the operating system, not raw sensor images or direct optical-sensor measurements. Missing events are not proof of a tracking failure, so count interruptions yourself by watching the cursor. Trail units are screen pixels, not millimetres. If no mouse events arrive, use the manual form below.</p></section>'+
'<section class="ex-card"><h3 id="e2ft">Record a trial</h3><div class="e2form"><fieldset class="seg"><legend>Surface</legend>'+
SURF.map((s,k)=>'<label><input type="radio" name="e2s" value="'+s[0]+'"'+(k?'':' checked')+'>'+s[1]+'</label>').join('')+
'</fieldset><label>Trial number<input id="e2n" type="number" min="1" max="999" step="1" inputmode="numeric"></label>'+
'<label>Target distance (physical)<input value="100 mm" readonly aria-readonly="true"></label>'+
'<label>Tracking consistency<select id="e2c"><option value="">Select…</option>'+CONS.map(c=>'<option>'+c+'</option>').join('')+'</select></label>'+
'<label>Interruptions you observed<input id="e2i" type="number" min="0" max="999" step="1" inputmode="numeric" value="0"></label>'+
'<label class="wide">Notes (optional)<textarea id="e2no" maxlength="300" rows="2"></textarea></label></div>'+
'<div class="row"><button id="e2save" class="pri">Save Trial</button><button id="e2cancel" hidden>Cancel Edit</button></div><p id="e2msg" class="msg" role="status"></p></section>'+
'<section class="ex-card"><h3>Recorded trials</h3><div class="scroll"><table id="e2tr"></table></div></section>'+
'<section class="ex-card"><h3>Comparison (your entries only)</h3><div class="scroll"><table id="e2cmp"></table></div><p id="e2sum" class="small"></p><p class="disc">No ranking is calculated. Results describe this particular mouse and these particular surfaces, not all optical mice; a glossy surface does not always perform worse. Counts are entered by you, not measured from sensor data.</p></section>'+
'<div class="row"><button id="e2csv">Export Experiment 2 CSV</button><button id="e2all">Clear All Experiment 2 Data</button></div>';

const say=t=>{$('#e2msg').textContent=t||''};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({trials:st.trials}))}catch(e){say('Could not save to this browser; data will be lost on reload. Export the CSV.')}};
const surf=()=>document.querySelector('input[name=e2s]:checked').value;
function nextN(){return st.trials.filter(t=>t.surface===surf()).reduce((m,t)=>Math.max(m,t.n),0)+1}
function resetForm(){editId=null;$('#e2n').value=Math.min(nextN(),999);$('#e2c').value='';$('#e2i').value='0';$('#e2no').value='';
 $('#e2ft').textContent='Record a trial';$('#e2save').textContent='Save Trial';$('#e2cancel').hidden=true}
function td(tr,txt,cls){const c=document.createElement('td');c.textContent=txt;if(cls)c.className=cls;tr.appendChild(c);return c}
function head(tbl,cols){tbl.textContent='';const tr=tbl.createTHead().insertRow();cols.forEach(x=>{const h=document.createElement('th');h.textContent=x;tr.appendChild(h)});return tbl.createTBody()}
function render(){
 const sorted=[...st.trials].sort((a,b)=>SURF.findIndex(s=>s[0]===a.surface)-SURF.findIndex(s=>s[0]===b.surface)||a.n-b.n);
 const tb=head($('#e2tr'),['Surface','Trial','Distance','Consistency','Interruptions','Notes','']);
 if(!sorted.length){const r=tb.insertRow(),c=td(r,'No trials recorded yet.','empty');c.colSpan=7}
 sorted.forEach(t=>{const r=tb.insertRow();td(r,sname(t.surface));td(r,t.n,'num');td(r,'100 mm');td(r,t.c);td(r,t.i,'num');td(r,t.no||'—');
  const a=td(r,'');const e=document.createElement('button');e.textContent='Edit';e.setAttribute('aria-label','Edit trial '+t.n+' on '+sname(t.surface));e.onclick=()=>edit(t.id);
  const d=document.createElement('button');d.textContent='Delete';d.setAttribute('aria-label','Delete trial '+t.n+' on '+sname(t.surface));d.onclick=()=>del(t.id);a.append(e,d)});
 const cb=head($('#e2cmp'),['Surface','Trials','Smooth','Mostly smooth','Interrupted','Total interruptions','Notes']);const missing=[];
 SURF.forEach(([id,nm])=>{const T=st.trials.filter(t=>t.surface===id).sort((a,b)=>a.n-b.n);if(!T.length)missing.push(nm);
  const r=cb.insertRow();td(r,nm);td(r,T.length,'num');CONS.forEach(c=>td(r,T.filter(t=>t.c===c).length,'num'));
  td(r,T.reduce((s,t)=>s+t.i,0),'num');td(r,T.filter(t=>t.no).map(t=>'T'+t.n+': '+t.no).join(' • ')||'—')});
 $('#e2sum').textContent=missing.length?'Record at least one trial on each surface before comparing. Missing: '+missing.join(', ')+'.':'All three surfaces have recorded trials. Compare the rows above yourself; trial counts may differ between surfaces.';
}
function edit(id){const t=st.trials.find(x=>x.id===id);if(!t)return;editId=id;
 document.querySelector('input[name=e2s][value='+t.surface+']').checked=true;
 $('#e2n').value=t.n;$('#e2c').value=t.c;$('#e2i').value=t.i;$('#e2no').value=t.no;
 $('#e2ft').textContent='Edit trial';$('#e2save').textContent='Update Trial';$('#e2cancel').hidden=false;say('');$('#e2ft').scrollIntoView({block:'start'})}
function del(id){const t=st.trials.find(x=>x.id===id);if(!t||!confirm('Delete trial '+t.n+' on '+sname(t.surface)+'?'))return;
 st.trials=st.trials.filter(x=>x.id!==id);if(editId===id)resetForm();persist();render();say('Trial deleted.')}
$('#e2save').onclick=()=>{
 const s=surf(),nv=$('#e2n').value,iv=$('#e2i').value,c=$('#e2c').value,no=$('#e2no').value.trim().slice(0,300),n=Number(nv),i=Number(iv);
 if(nv===''||!Number.isInteger(n)||n<1||n>999)return say('Trial number must be a whole number from 1 to 999.');
 if(!CONS.includes(c))return say('Choose a tracking consistency.');
 if(iv===''||!Number.isInteger(i)||i<0||i>999)return say('Enter interruptions as a whole number from 0 to 999 (0 if none).');
 if(st.trials.some(t=>t.surface===s&&t.n===n&&t.id!==editId))return say('Trial '+n+' already exists for '+sname(s)+'. Edit it or choose another number.');
 if(editId!==null){const t=st.trials.find(x=>x.id===editId);if(t)Object.assign(t,{surface:s,n,c,i,no})}
 else st.trials.push({id:st.nextId++,surface:s,n,c,i,no});
 const was=editId!==null;persist();render();resetForm();say(was?'Trial updated.':'Trial saved.')};
$('#e2cancel').onclick=()=>{resetForm();say('')};
document.querySelectorAll('input[name=e2s]').forEach(r=>r.onchange=()=>{if(editId===null)$('#e2n').value=Math.min(nextN(),999)});
const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
const q=v=>{let s=String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
$('#e2csv').onclick=()=>{
 if(!st.trials.length)return say('No Experiment 2 trials to export yet.');
 const rows=['experiment,surface,trial,target_distance_mm,tracking_consistency,observed_interruptions_user_entered,notes'];
 [...st.trials].sort((a,b)=>SURF.findIndex(s=>s[0]===a.surface)-SURF.findIndex(s=>s[0]===b.surface)||a.n-b.n)
  .forEach(t=>rows.push(['surface_tracking_test',q(sname(t.surface)),t.n,100,q(t.c),t.i,q(t.no)].join(',')));
 dl(new Blob([rows.join('\n')],{type:'text/csv'}),'optitrack-experiment2.csv');say('CSV exported (manual observations).')};
$('#e2all').onclick=()=>{if(!st.trials.length)return say('Nothing to clear.');if(!confirm('Delete ALL Experiment 2 trials? This cannot be undone.'))return;
 st.trials=[];persist();render();resetForm();say('All Experiment 2 data cleared.')};

/* live pointer view (separate from Experiment 1; real mouse events only) */
const cv=$('#e2cv'),ctx=cv.getContext('2d');let live=false,pts=[],lastMouse=0,startT=0,W=300,H=220,dirty=true,evs=0;
function size(){const r=cv.parentElement.getBoundingClientRect(),d=devicePixelRatio||1;W=Math.max(50,r.width);H=Math.max(50,r.height);cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);dirty=true}
new ResizeObserver(size).observe(cv.parentElement);
addEventListener('pointermove',e=>{
 if(!live||root.hidden||(e.pointerType&&e.pointerType!=='mouse'))return;
 lastMouse=performance.now();const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if(x<0||y<0||x>r.width||y>r.height){if(pts.length&&pts[pts.length-1])pts.push(null);return}
 pts.push({x,y});evs++;if(pts.length>800)pts.splice(0,pts.length-800);dirty=true},{passive:true});
$('#e2live').onclick=()=>{live=!live;startT=performance.now();$('#e2live').textContent=live?'Stop Live View':'Start Live View';dirty=true;status()};
$('#e2clr').onclick=()=>{pts=[];evs=0;dirty=true};
function status(){const t=$('#e2st');
 if(!live)t.textContent='Live view is off. Manual recording below works without it.';
 else if(performance.now()-lastMouse<2000)t.textContent='Mouse input detected. Reported cursor positions: '+evs+' (screen pixels).';
 else if(performance.now()-startT>4000)t.textContent='No mouse events received. This may be a device/browser compatibility limit and is not proof of a tracking failure. Record observations manually.';
 else t.textContent='Waiting for mouse movement over the graph…'}
setInterval(status,500);
function draw(){ctx.fillStyle='#0d1a33';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(120,160,220,.15)';ctx.lineWidth=1;ctx.beginPath();
 for(let x=0;x<W;x+=40){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let y=0;y<H;y+=40){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
 if(!pts.length){ctx.fillStyle='#8fa3c7';ctx.font='18px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(live?'Move a mouse over this area':'Live view off',W/2,H/2);ctx.textAlign='left';return}
 ctx.strokeStyle='#22d3ee';ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();let pen=false,l=null;
 pts.forEach(p=>{if(!p){pen=false;return}if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;l=p});ctx.stroke();
 if(l){ctx.fillStyle='#ff4d4d';ctx.beginPath();ctx.arc(l.x,l.y,10,0,Math.PI*2);ctx.fill()}}
(function loop(){if(dirty&&!root.hidden){draw();dirty=false}requestAnimationFrame(loop)})();

/* tabs */
function show(n){const two=n===2;$('#exp1').style.display=two?'none':'';root.hidden=!two;
 $('#tab1').setAttribute('aria-selected',!two);$('#tab2').setAttribute('aria-selected',two);
 try{localStorage.setItem(TABKEY,two?'2':'1')}catch(e){}
 dispatchEvent(new Event('resize'));if(two){size();dirty=true}}
$('#tab1').onclick=()=>show(1);$('#tab2').onclick=()=>show(2);
resetForm();render();status();
let t0='1';try{t0=localStorage.getItem(TABKEY)||'1'}catch(e){}
show(t0==='2'?2:1);
})();
