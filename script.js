/* ════════════════════════════════════════════════
   FONTS
   ════════════════════════════════════════════════ */
const sl=document.createElement('link');sl.rel='stylesheet';sl.href='https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap';document.head.appendChild(sl);

const FONTS={
  latin:[
    {name:'Caveat',          label:'Handwritten', family:"'Caveat',cursive",          prev:'Aa Bb', gfont:'Caveat'},
    {name:'Dancing Script',  label:'Elegant',     family:"'Dancing Script',cursive",   prev:'Aa Bb', gfont:'Dancing Script'},
    {name:'Indie Flower',    label:'Playful',     family:"'Indie Flower',cursive",     prev:'Aa Bb', gfont:'Indie Flower'},
    {name:'Patrick Hand',    label:'Casual',      family:"'Patrick Hand',cursive",     prev:'Aa Bb', gfont:'Patrick Hand'},
    {name:'Pacifico',        label:'Retro',       family:"'Pacifico',cursive",         prev:'Aa Bb', gfont:'Pacifico'},
    {name:'Satisfy',         label:'Classy',      family:"'Satisfy',cursive",          prev:'Aa Bb', gfont:'Satisfy'},
    {name:'Kalam',           label:'Natural',     family:"'Kalam',cursive",            prev:'Aa یہ', gfont:'Kalam'},
    {name:'Permanent Marker',label:'Bold',        family:"'Permanent Marker',cursive", prev:'Aa Bb', gfont:'Permanent Marker'},
    {name:'Georgia',         label:'Serif',       family:'Georgia,serif',              prev:'Aa Bb', gfont:null},
    {name:'Courier New',     label:'Typewriter',  family:"'Courier New',monospace",    prev:'Aa Bb', gfont:null},
  ],
  urdu:[
    {name:'Noto Nastaliq',  label:'نستعلیق',  family:"'Noto Nastaliq Urdu',serif",  prev:'اردو', gfont:'Noto Nastaliq Urdu'},
    {name:'Noto Naskh',     label:'نسخ',      family:"'Noto Naskh Arabic',serif",   prev:'اردو', gfont:'Noto Naskh Arabic'},
    {name:'Scheherazade',   label:'شہرزاد',   family:"'Scheherazade New',serif",    prev:'اردو', gfont:'Scheherazade New'},
    {name:'Kalam Urdu',     label:'کلام',     family:"'Kalam',cursive",             prev:'اردو', gfont:'Kalam'},
  ]
};
let curTab='latin',selFont=FONTS.latin[0],cfamily=null,customFontFile=null,customFontBase64=null,isRTL=false;

function switchTab(tab,btn){
  curTab=tab;
  document.querySelectorAll('.ftab').forEach(t=>{t.classList.remove('on');t.setAttribute('aria-selected','false')});
  btn.classList.add('on');btn.setAttribute('aria-selected','true');
  renderFgrid();
}
function getFL(t){return t==='latin'?FONTS.latin:t==='urdu'?FONTS.urdu:[...FONTS.latin,...FONTS.urdu]}
function renderFgrid(){
  const g=document.getElementById('fgrid');g.innerHTML='';
  getFL(curTab).forEach(f=>{
    const iu=FONTS.urdu.find(u=>u.name===f.name);
    const c=document.createElement('div');
    c.className='fcard'+(selFont.name===f.name&&!cfamily?(iu?' urdon':' on'):'');
    c.setAttribute('role','option');c.setAttribute('tabindex','0');
    c.setAttribute('aria-label','Font: '+f.name);
    c.innerHTML=`<div class="fprev" style="font-family:${f.family};direction:${iu?'rtl':'ltr'}">${f.prev}</div><div class="fname">${f.label}</div>`;
    c.onclick=()=>selF(f,c);
    c.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selF(f,c)}};
    g.appendChild(c);
  });
}
function selF(f,card){
  selFont=f;cfamily=null;customFontFile=null;customFontBase64=null;
  document.getElementById('cfname').textContent='';
  document.querySelectorAll('.fcard').forEach(c=>c.classList.remove('on','urdon'));
  card.classList.add(FONTS.urdu.find(u=>u.name===f.name)?'urdon':'on');
  applyTStyle(true);
  document.getElementById('fontlbl').textContent='Font: '+f.name;
  toast('Font: '+f.name);
  saveDraft();
}
function getFont(){return cfamily||selFont.family}

/* ════════════════════════════════════════════════
   FORMATTING TOOLBAR — Bold/Italic/Underline, alignment,
   text color, highlight color, clear formatting, and tables.
   Uses the browser's built-in execCommand on the focused
   contentEditable page, then re-checks overflow afterward
   since formatting can change how much text fits.
   ════════════════════════════════════════════════ */
function getActivePageEl(){
  // Prefer the page that currently has focus/selection; fall back to the last page.
  const sel=window.getSelection();
  if(sel && sel.rangeCount){
    const node=sel.getRangeAt(0).startContainer;
    const found=pages.find(p=>p.textEl.contains(node));
    if(found)return found.textEl;
  }
  return pages.length?pages[pages.length-1].textEl:null;
}

function fmtExec(cmd,value){
  const el=getActivePageEl();
  if(!el)return;
  el.focus();
  try{
    document.execCommand('styleWithCSS',false,true);
    document.execCommand(cmd,false,value);
  }catch(err){ /* execCommand is legacy but still broadly supported for contentEditable */ }
  updateFmtButtonStates();
  saveDraftDebounced();
  // formatting (especially size-changing ones) can overflow the page
  clearTimeout(fmtExec._t);
  fmtExec._t=setTimeout(()=>{ if(!paginating) flowOverflow(el); },300);
}

/* Reflects the current selection's formatting state on the toolbar buttons
   (e.g. the Bold button looks "pressed" when the cursor is inside bold text). */
function updateFmtButtonStates(){
  const tb=document.getElementById('fmtTb');
  if(!tb)return;
  const checks=[
    ['bold','bold'],['italic','italic'],['underline','underline'],
    ['justifyLeft','justifyLeft'],['justifyCenter','justifyCenter'],['justifyRight','justifyRight']
  ];
  checks.forEach(([cmd,attr])=>{
    const btn=tb.querySelector(`[data-cmd="${attr}"]`);
    if(!btn)return;
    let isActive=false;
    try{ isActive=document.queryCommandState(cmd); }catch(e){}
    btn.classList.toggle('active',isActive);
  });
}
document.addEventListener('selectionchange',()=>{
  if(document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('paper-text')){
    updateFmtButtonStates();
  }
});

/* Inserts a simple editable table (default 3x3) at the cursor position
   inside the currently active page. */
function insertTable(){
  const el=getActivePageEl();
  if(!el)return;
  el.focus();
  const rows=3, cols=3;
  let html='<table class="doc-table" contenteditable="true">';
  for(let r=0;r<rows;r++){
    html+='<tr>';
    for(let c=0;c<cols;c++){
      html+='<td>&nbsp;</td>';
    }
    html+='</tr>';
  }
  html+='</table><br>';
  try{
    document.execCommand('insertHTML',false,html);
  }catch(err){
    // Fallback: append to end if insertHTML isn't available
    el.insertAdjacentHTML('beforeend',html);
  }
  saveDraftDebounced();
  clearTimeout(fmtExec._t);
  fmtExec._t=setTimeout(()=>{ if(!paginating) flowOverflow(el); },300);
}

/* Keyboard shortcuts: Ctrl/Cmd+B, +I, +U inside any page */
document.addEventListener('keydown',(e)=>{
  const isMod=e.ctrlKey||e.metaKey;
  if(!isMod)return;
  const active=document.activeElement;
  if(!active||!active.classList||!active.classList.contains('paper-text'))return;
  const key=e.key.toLowerCase();
  if(key==='b'){e.preventDefault();fmtExec('bold')}
  else if(key==='i'){e.preventDefault();fmtExec('italic')}
  else if(key==='u'){e.preventDefault();fmtExec('underline')}
});

/* Custom font upload — now tracked properly for DOCX/exports */
document.getElementById('cfi').addEventListener('change',function(e){
  const file=e.target.files[0];if(!file)return;
  if(file.size>5*1024*1024){toast('⚠️ Font file is too large (max 5MB)');this.value='';return}
  const r=new FileReader();
  r.onload=function(ev){
    const nm='CustomFont_'+Date.now();
    new FontFace(nm,ev.target.result).load().then(f=>{
      document.fonts.add(f);
      cfamily=`'${nm}',cursive`;
      customFontFile=file.name;
      // Save base64 for DOCX embedding reference / re-use
      const b64=arrayBufferToBase64(ev.target.result);
      customFontBase64=b64;
      document.querySelectorAll('.fcard').forEach(c=>c.classList.remove('on','urdon'));
      document.getElementById('cfname').textContent=file.name.replace(/\.[^.]+$/,'');
      applyTStyle(true);
      document.getElementById('fontlbl').textContent='Font: '+file.name+' (custom)';
      toast('✅ Custom font ready — will be used in exports too');
      saveDraft();
    }).catch(()=>toast('❌ Font file failed to load — it may be corrupted'));
  };
  r.onerror=()=>toast('❌ Could not read the font file');
  r.readAsArrayBuffer(file);
});
function arrayBufferToBase64(buf){
  let binary='';const bytes=new Uint8Array(buf);
  for(let i=0;i<bytes.byteLength;i++)binary+=String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/* Helper: name to use when exporting (DOCX font name field, etc.) */
function getExportFontName(){
  if(cfamily) return customFontFile ? customFontFile.replace(/\.[^.]+$/,'') : 'Custom Font';
  return selFont.name;
}

/* ════════════════════════════════════════════════
   PAGE / PAPER STATE  +  PAGINATION (the big fix)
   ════════════════════════════════════════════════ */
let lineStyle='none',pageW=794,pageH=1123,textSize=18,textColor='#1a1a1a',pageBg='#ffffff';
let pages=[]; // {el, canvas, textEl}
let zoomLevel=1;
let paginating=false;

function setPaper(btn){
  document.querySelectorAll('.szbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  pageW=parseInt(btn.dataset.w);pageH=parseInt(btn.dataset.h);
  reflowAllPagesPreservingFormat();
  saveDraft();
}
function setLS(btn){
  document.querySelectorAll('.lbtn').forEach(b=>{b.classList.remove('on');b.setAttribute('aria-pressed','false')});
  btn.classList.add('on');btn.setAttribute('aria-pressed','true');
  lineStyle=btn.dataset.style;
  redrawLines();
  saveDraft();
}
function redrawLines(){pages.forEach(p=>drawLines(p.canvas,p.textEl))}

function drawLines(canvas,textEl){
  if(!canvas)return;
  canvas.width=pageW;canvas.height=pageH;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,pageW,pageH);
  if(lineStyle==='none'){textEl.style.padding='20px';textEl.style.lineHeight='1.9';return}

  const gap=parseInt(document.getElementById('lgap').value);
  const lc=document.getElementById('lcolor').value;
  const margin=80;
  ctx.strokeStyle=lc;ctx.lineWidth=1;

  if(lineStyle==='ruled'){
    for(let y=gap;y<pageH;y+=gap){ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(pageW-10,y);ctx.stroke()}
    textEl.style.padding=`${Math.round(gap*0.15)}px 20px 20px 20px`;
    textEl.style.lineHeight=gap+'px';
  } else if(lineStyle==='margin'){
    for(let y=gap;y<pageH;y+=gap){ctx.beginPath();ctx.moveTo(margin+10,y);ctx.lineTo(pageW-10,y);ctx.stroke()}
    ctx.strokeStyle='#e08080';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(margin,10);ctx.lineTo(margin,pageH-10);ctx.stroke();
    textEl.style.padding=`${Math.round(gap*0.15)}px 20px 20px ${margin+12}px`;
    textEl.style.lineHeight=gap+'px';
  } else if(lineStyle==='grid'){
    for(let y=gap;y<pageH;y+=gap){ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(pageW-10,y);ctx.stroke()}
    for(let x=gap;x<pageW;x+=gap){ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x,pageH-10);ctx.stroke()}
    textEl.style.padding=`${Math.round(gap*0.15)}px 20px 20px 20px`;
    textEl.style.lineHeight=gap+'px';
  } else if(lineStyle==='dots'){
    ctx.fillStyle=lc;
    for(let y=gap;y<pageH;y+=gap){for(let x=gap;x<pageW;x+=gap){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill()}}
    textEl.style.padding=`${Math.round(gap*0.15)}px 20px 20px 20px`;
    textEl.style.lineHeight=gap+'px';
  } else if(lineStyle==='college'){
    const g2=Math.round(gap*0.7);
    for(let y=g2;y<pageH;y+=g2){ctx.beginPath();ctx.moveTo(margin+10,y);ctx.lineTo(pageW-10,y);ctx.stroke()}
    ctx.strokeStyle='#e08080';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(margin,10);ctx.lineTo(margin,pageH-10);ctx.stroke();
    textEl.style.padding=`${Math.round(g2*0.15)}px 20px 20px ${margin+12}px`;
    textEl.style.lineHeight=g2+'px';
  }
}

/* ── Build a single (empty) page shell, returns {el,canvas,textEl} ── */
function buildPageShell(){
  const wrap=document.createElement('div');
  wrap.className='paper-page';
  wrap.style.width=pageW+'px';wrap.style.height=pageH+'px';
  wrap.style.background=pageBg;

  const cvs=document.createElement('canvas');
  cvs.className='paper-lines';

  const txt=document.createElement('div');
  txt.className='paper-text'+(isRTL?' rtl-mode':'');
  txt.contentEditable='true';txt.spellcheck=false;
  txt.setAttribute('role','textbox');
  txt.setAttribute('aria-multiline','true');
  txt.setAttribute('aria-label','Document text content');
  txt.dataset.ph='Type here or upload a file...';
  txt.style.fontFamily=getFont();
  txt.style.fontSize=textSize+'px';
  txt.style.color=textColor;
  txt.style.width=pageW+'px';
  txt.style.height=pageH+'px';

  const pnum=document.createElement('div');
  pnum.className='page-num';

  wrap.appendChild(cvs);wrap.appendChild(txt);wrap.appendChild(pnum);
  drawLines(cvs,txt);
  return {el:wrap,canvas:cvs,textEl:txt,pnumEl:pnum};
}

/* ── Measure how much plain text fits in one page height using an offscreen probe ── */
function measureFit(fullText, startIndex){
  // Build hidden probe matching exact box width/font/padding/line-height as the real page
  const probe=document.createElement('div');
  probe.style.position='absolute';
  probe.style.visibility='hidden';
  probe.style.left='-9999px';
  probe.style.top='0';
  probe.style.width=pageW+'px';
  probe.style.whiteSpace='pre-wrap';
  probe.style.wordBreak='break-word';
  probe.style.fontFamily=getFont();
  probe.style.fontSize=textSize+'px';
  probe.style.boxSizing='border-box';

  // match padding/line-height used by drawLines for current lineStyle
  const gap=parseInt(document.getElementById('lgap').value);
  if(lineStyle==='none'){
    probe.style.padding='20px';probe.style.lineHeight='1.9';
  } else if(lineStyle==='margin'||lineStyle==='college'){
    const g=lineStyle==='college'?Math.round(gap*0.7):gap;
    probe.style.padding=`${Math.round(g*0.15)}px 20px 20px ${80+12}px`;
    probe.style.lineHeight=g+'px';
  } else {
    probe.style.padding=`${Math.round(gap*0.15)}px 20px 20px 20px`;
    probe.style.lineHeight=gap+'px';
  }
  probe.style.height=pageH+'px';
  probe.style.overflow='hidden';
  document.body.appendChild(probe);

  // Binary search the largest substring (from startIndex) that fits without overflow
  const remaining=fullText.slice(startIndex);
  if(!remaining.length){document.body.removeChild(probe);return startIndex}

  let lo=1, hi=remaining.length, best=0;
  // quick exit: does everything fit?
  probe.textContent=remaining;
  if(probe.scrollHeight<=probe.clientHeight){
    document.body.removeChild(probe);
    return fullText.length;
  }
  while(lo<=hi){
    const mid=(lo+hi)>>1;
    probe.textContent=remaining.slice(0,mid);
    if(probe.scrollHeight<=probe.clientHeight){best=mid;lo=mid+1}
    else hi=mid-1;
  }
  document.body.removeChild(probe);

  if(best===0)best=1; // avoid infinite loop on pathological single huge "word"

  // Prefer breaking at a newline or space near the cut point, looking backward
  let cut=startIndex+best;
  const slice=fullText.slice(startIndex,cut);
  const lastNL=slice.lastIndexOf('\n');
  const lastSP=slice.lastIndexOf(' ');
  const breakAt=Math.max(lastNL,lastSP);
  if(breakAt>0 && breakAt>slice.length*0.5){
    cut=startIndex+breakAt+1;
  }
  return cut;
}

/* ── Rebuild everything from a full text string, paginating as needed ── */
function rebuildFromScratch(fullText){
  paginating=true;
  const wrapEl=document.getElementById('paperZoomWrap');
  wrapEl.innerHTML='';
  pages=[];

  if(!fullText || !fullText.trim()){
    const pg=buildPageShell();
    pg.textEl.addEventListener('input',onAnyTextInput);
    wrapEl.appendChild(pg.el);
    pages.push(pg);
    updateFooter();
    paginating=false;
    return;
  }

  let idx=0;
  let safety=0;
  while(idx<fullText.length && safety<500){ // safety cap: 500 pages max
    const cut=measureFit(fullText, idx);
    const chunk=fullText.slice(idx,cut);
    const pg=buildPageShell();
    pg.textEl.textContent=chunk;
    pg.textEl.addEventListener('input',onAnyTextInput);
    wrapEl.appendChild(pg.el);
    pages.push(pg);
    idx=cut;
    safety++;
  }
  if(safety>=500)toast('⚠️ Document is very large — showing only the first 500 pages');

  numberPages();
  updateFooter();
  paginating=false;
}

function numberPages(){
  pages.forEach((p,i)=>{p.pnumEl.textContent=`Page ${i+1} / ${pages.length}`});
}

/* Lightweight overflow check + flow: instead of destroying and rebuilding
   every page from plain text on every keystroke (which loses formatting and
   jumps the cursor to the last page), we now only check whether the page the
   user is currently typing in has overflowed its height. If so, we move the
   trailing overflow content (preserving its HTML/formatting) into the next
   page, creating a new page only if needed. The user's cursor stays exactly
   where they were typing. */
let inputDebounce=null;
function onAnyTextInput(e){
  updateFooter();
  saveDraftDebounced();
  clearTimeout(inputDebounce);
  const sourceEl=e&&e.target;
  inputDebounce=setTimeout(()=>{
    if(paginating)return;
    if(sourceEl) flowOverflow(sourceEl);
  },350);
}

/* Walks forward from the page where the user is typing, pushing any
   overflow content into the next page (creating one if needed), and pulling
   content back from the next page if this page now has room (e.g. after
   deleting text). Cursor position within the active page is preserved. */
function flowOverflow(startEl){
  paginating=true;
  const pageIndex=pages.findIndex(p=>p.textEl===startEl);
  if(pageIndex===-1){paginating=false;return}

  // Save cursor position (as a character offset within this page's plain text)
  const saved=saveCaretOffset(startEl);

  let i=pageIndex;
  let safety=0;
  while(i<pages.length && safety<500){
    const page=pages[i];
    const el=page.textEl;

    // Push overflow forward
    while(el.scrollHeight>el.clientHeight+1 && el.lastChild){
      let nextPage=pages[i+1];
      if(!nextPage){
        nextPage=buildPageShell();
        nextPage.textEl.addEventListener('input',onAnyTextInput);
        document.getElementById('paperZoomWrap').appendChild(nextPage.el);
        pages.splice(i+1,0,nextPage);
      }
      moveLastUnitToNextPage(el,nextPage.textEl);
      safety++;
      if(safety>=500)break;
    }

    // Pull content back from the next page if there's room and a next page exists
    const nextPage=pages[i+1];
    if(nextPage){
      let pulledSomething=false;
      while(nextPage.textEl.firstChild){
        const moved=tryPullFirstUnitBack(el,nextPage.textEl);
        if(!moved)break;
        pulledSomething=true;
        safety++;
        if(safety>=500)break;
      }
      // if we emptied the next page and it's not the only page, remove it later
      if(pulledSomething) i=i; // stay on same index to re-check overflow after pulling
    }

    i++;
  }

  // Remove any now-empty trailing pages (but always keep at least 1 page)
  for(let k=pages.length-1;k>0;k--){
    if(pages[k].textEl.innerHTML.trim()===''){
      pages[k].el.remove();
      pages.splice(k,1);
    } else break;
  }

  numberPages();
  updateFooter();
  restoreCaretOffset(startEl,saved);
  paginating=false;
}

/* Moves the last "unit" (last text node chunk or last child element) from
   the end of `fromEl` to the beginning of `toEl`, preserving formatting. */
function moveLastUnitToNextPage(fromEl,toEl){
  const last=fromEl.lastChild;
  if(!last)return;
  if(last.nodeType===Node.TEXT_NODE){
    const text=last.textContent;
    if(text.length<=1){
      fromEl.removeChild(last);
      toEl.insertBefore(last,toEl.firstChild);
      return;
    }
    // split off the last word (or last character if no space) to move
    const lastSpace=text.lastIndexOf(' ',text.length-2);
    const splitAt=lastSpace>0?lastSpace+1:text.length-1;
    const keep=text.slice(0,splitAt);
    const move=text.slice(splitAt);
    last.textContent=keep;
    const moveNode=document.createTextNode(move);
    toEl.insertBefore(moveNode,toEl.firstChild);
  }else{
    fromEl.removeChild(last);
    toEl.insertBefore(last,toEl.firstChild);
  }
}

/* Pulls the first unit from `fromEl` (next page) back to the end of `toEl`
   (current page), but only if it still fits — otherwise leaves it alone. */
function tryPullFirstUnitBack(toEl,fromEl){
  const first=fromEl.firstChild;
  if(!first)return false;
  const clone=first.cloneNode(true);
  toEl.appendChild(clone);
  if(toEl.scrollHeight>toEl.clientHeight+1){
    toEl.removeChild(clone);
    return false;
  }
  fromEl.removeChild(first);
  return true;
}

/* Save/restore caret position as a plain-text character offset within an element,
   so formatting-aware DOM changes don't lose the user's typing position. */
function saveCaretOffset(el){
  const sel=window.getSelection();
  if(!sel.rangeCount)return null;
  const range=sel.getRangeAt(0);
  if(!el.contains(range.startContainer))return null;
  const preRange=document.createRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer,range.startOffset);
  return preRange.toString().length;
}
function restoreCaretOffset(el,offset){
  if(offset==null)return;
  try{
    const sel=window.getSelection();
    const range=document.createRange();
    let remaining=offset, node=null, foundNode=null, foundOffset=0;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null);
    while((node=walker.nextNode())){
      if(remaining<=node.textContent.length){foundNode=node;foundOffset=remaining;break}
      remaining-=node.textContent.length;
    }
    if(foundNode){
      range.setStart(foundNode,foundOffset);
    }else{
      range.selectNodeContents(el);range.collapse(false);
    }
    range.collapse(true);
    sel.removeAllRanges();sel.addRange(range);
    el.focus();
  }catch(e){
    el.focus();
  }
}

function placeCaretAtEnd(el){
  try{
    const range=document.createRange();
    range.selectNodeContents(el);range.collapse(false);
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
  }catch(e){}
}

function applyTStyle(immediate){
  pages.forEach(p=>{
    p.textEl.style.fontFamily=getFont();
    p.textEl.style.fontSize=textSize+'px';
    p.textEl.style.color=textColor;
    p.textEl.classList.toggle('rtl-mode',isRTL);
  });
  redrawLines();
  // font/size changes affect how much text fits per page -> re-flow pages.
  // Debounced so dragging the size slider stays smooth instead of
  // rebuilding the whole DOM on every single tick.
  clearTimeout(applyTStyle._t);
  const run=()=>{ reflowAllPagesPreservingFormat(); };
  if(immediate){run()}else{applyTStyle._t=setTimeout(run,250)}
}

/* Re-paginates after a font/size/paper change WITHOUT discarding bold,
   color, alignment, or tables the user has applied — by flowing the
   combined HTML content through the (newly sized) pages instead of
   rebuilding from plain text. */
function reflowAllPagesPreservingFormat(){
  if(!pages.length)return;
  paginating=true;
  const combinedHTML=pages.map(p=>p.textEl.innerHTML).join('<br>');
  const wrapEl=document.getElementById('paperZoomWrap');
  wrapEl.innerHTML='';
  const firstPage=buildPageShell();
  firstPage.textEl.innerHTML=combinedHTML;
  firstPage.textEl.addEventListener('input',onAnyTextInput);
  wrapEl.appendChild(firstPage.el);
  pages=[firstPage];
  paginating=false;
  flowOverflow(firstPage.textEl);
}
function updateTSize(v){textSize=parseInt(v);document.getElementById('tsizev').textContent=v+'px';applyTStyle();saveDraft()}
function updateTColor(){textColor=document.getElementById('tcolor').value;pages.forEach(p=>p.textEl.style.color=textColor);saveDraft()}
function updatePgBg(){pageBg=document.getElementById('pgbg').value;pages.forEach(p=>p.el.style.background=pageBg);saveDraft()}
function toggleRTL(){
  isRTL=!isRTL;
  document.getElementById('rtlbtn').textContent=isRTL?'RTL ←':'LTR →';
  document.getElementById('rtlbtn').setAttribute('aria-pressed',isRTL);
  applyTStyle(true);saveDraft();
}

/* ════════════════════════════════════════════════
   ZOOM
   ════════════════════════════════════════════════ */
function applyZoom(){
  const wrap=document.getElementById('paperZoomWrap');
  wrap.style.transform=`scale(${zoomLevel})`;
  document.getElementById('zoomval').textContent=Math.round(zoomLevel*100)+'%';
  // transform:scale() doesn't affect layout flow, so when zoomed out the
  // scroll container keeps the original (larger) height. Compensate with a
  // negative margin so the visible scroll area matches the scaled content.
  requestAnimationFrame(()=>{
    const rect=wrap.getBoundingClientRect();
    const naturalH=rect.height/zoomLevel;
    const scaledH=rect.height;
    const diff=naturalH-scaledH;
    wrap.style.marginBottom = diff>0 ? `-${diff}px` : '0px';
  });
}
function zoomIn(){zoomLevel=Math.min(2,zoomLevel+0.1);applyZoom()}
function zoomOut(){zoomLevel=Math.max(0.3,zoomLevel-0.1);applyZoom()}
function zoomFit(){
  const scrollEl=document.getElementById('paperScroll');
  const cs=getComputedStyle(scrollEl);
  const padX=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
  const avail=scrollEl.clientWidth-padX-8; // small buffer so shadow isn't clipped
  zoomLevel=Math.min(1,Math.max(0.25,avail/pageW));
  applyZoom();
}

/* html2canvas captures each .paper-page element at its CSS pixel size, but
   the paper-zoom-wrap has a scale() transform applied for on-screen zoom
   (e.g. 70% to fit the screen). That transform was throwing off the
   captured pixel positions just enough that text drifted away from the
   ruled lines in PDF/PNG exports, even though it looked correct on screen.
   Fix: temporarily reset to 100% zoom (no transform) before capturing,
   then restore whatever zoom level the user had. */
function withExportZoom(workFn){
  return new Promise((resolve,reject)=>{
    const wrap=document.getElementById('paperZoomWrap');
    const savedZoom=zoomLevel;
    const savedTransform=wrap.style.transform;
    const savedMargin=wrap.style.marginBottom;

    zoomLevel=1;
    wrap.style.transform='scale(1)';
    wrap.style.marginBottom='0px';

    // Give the browser a frame to apply the un-zoomed layout before capturing
    requestAnimationFrame(()=>{
      requestAnimationFrame(async ()=>{
        try{
          const result=await workFn();
          resolve(result);
        }catch(err){
          reject(err);
        }finally{
          zoomLevel=savedZoom;
          wrap.style.transform=savedTransform;
          wrap.style.marginBottom=savedMargin;
          document.getElementById('zoomval').textContent=Math.round(zoomLevel*100)+'%';
        }
      });
    });
  });
}

/* ════════════════════════════════════════════════
   FILE READING (with size limit + friendly errors)
   ════════════════════════════════════════════════ */
const MAX_FILE_MB=15;

function friendlyError(err, context){
  const msg=(err && err.message) ? err.message : String(err);
  if(/password|encrypt/i.test(msg)) return 'This file is password-protected — unlock it first.';
  if(/corrupt|invalid pdf|invalid header/i.test(msg)) return 'The file appears to be corrupted or was downloaded incorrectly.';
  if(/network|fetch/i.test(msg)) return 'Check your internet connection — a font or resource failed to load.';
  if(context==='pdf') return 'Could not read the PDF — please check the file format.';
  if(context==='docx') return 'Could not read the Word file — please use .docx format (.doc is not supported).';
  return 'Something went wrong — please try again.';
}

async function handleFile(file){
  if(file.size>MAX_FILE_MB*1024*1024){
    toast(`⚠️ File must be smaller than ${MAX_FILE_MB}MB (this is ${(file.size/1024/1024).toFixed(1)}MB)`);
    return;
  }
  showProg();
  document.getElementById('badge').innerHTML=`<span class="badge">📎 ${escH(file.name)}</span>`;
  try{
    let text='';const ext=file.name.split('.').pop().toLowerCase();
    if(ext==='txt')text=await file.text();
    else if(ext==='pdf')text=await exPDF(file);
    else if(ext==='docx')text=await exDOCX(file);
    else if(ext==='doc'){toast('⚠️ Old .doc format not supported — try .docx instead');hideProg();return}
    else text=await file.text();
    if(!text.trim()){toast('⚠️ No text found in file (it may be a scanned image)');hideProg();return}
    await document.fonts.ready;
    rebuildFromScratch(text.trim());
    toast('✅ '+cWords(text)+' words, '+pages.length+' page(s) created!');
    saveDraft();
  }catch(e){
    toast('❌ '+friendlyError(e, file.name.split('.').pop().toLowerCase()));
  }
  hideProg();
}
async function exPDF(file){
  const lib=window['pdfjs-dist/build/pdf'];
  lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;
  let all='';
  for(let i=1;i<=pdf.numPages;i++){const tc=await(await pdf.getPage(i)).getTextContent();all+=tc.items.map(s=>s.str).join(' ')+'\n'}
  return all;
}
async function exDOCX(file){return(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value}

document.getElementById('fi').addEventListener('change',e=>{if(e.target.files[0])handleFile(e.target.files[0])});

/* Dropzone-local drag/drop */
const dz=document.getElementById('dz');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragover')});
dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragover');if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])});

/* ── FIX: window-level drag/drop safety so dropping outside the zone
   never navigates the browser away from the app ── */
['dragover','drop'].forEach(evt=>{
  window.addEventListener(evt, e=>{
    e.preventDefault();
    e.stopPropagation();
  }, false);
});
// Re-allow the explicit dropzone to still receive its own drop (already bound above);
// the window-level guard above simply stops the browser's default "open file" behavior
// everywhere else on the page.

/* ════════════════════════════════════════════════
   DOWNLOADS
   ════════════════════════════════════════════════ */
function toggleDl(){
  const open=document.getElementById('dlmenu').classList.toggle('open');
  document.getElementById('dlbtnEl').setAttribute('aria-expanded',open);
}
document.addEventListener('click',e=>{if(!document.getElementById('dlwrap').contains(e.target)){document.getElementById('dlmenu').classList.remove('open');document.getElementById('dlbtnEl').setAttribute('aria-expanded','false')}});
function closeDl(){document.getElementById('dlmenu').classList.remove('open');document.getElementById('dlbtnEl').setAttribute('aria-expanded','false')}
function getTxt(){return pages.map(p=>p.textEl.innerText).join('\n').trim()}
function getHTML(){return pages.map(p=>p.textEl.innerHTML).join('<br>')}

/* Wait for the currently selected font (Google or custom) to actually be ready
   before any canvas-based export (PDF/PNG), fixing the font race condition. */
async function ensureFontReady(){
  try{
    const famRaw=getFont(); // e.g. "'Caveat',cursive" or "'CustomFont_123',cursive"
    const famName=famRaw.split(',')[0].replace(/['"]/g,'');
    await document.fonts.load(`${textSize}px "${famName}"`);
    await document.fonts.ready;
  }catch(e){ /* non-fatal — proceed with best effort */ }
}

async function dlDOCX(){
  closeDl();const text=getTxt();if(!text){toast('⚠️ No text to export');return}
  showOv('Preparing Word file...');
  try{
    const {Document,Packer,Paragraph,TextRun,AlignmentType}=docx;
    // FIX: use custom font name when active, not always selFont.name
    const exportFontName=cfamily
      ? (customFontFile ? customFontFile.replace(/\.[^.]+$/,'') : 'Custom Font')
      : selFont.name.replace(/(Urdu|Naskh|Nastaliq)/gi,'').trim();

    const pars=text.split('\n').map(l=>new Paragraph({
      alignment:isRTL?AlignmentType.RIGHT:AlignmentType.LEFT,
      children:[new TextRun({text:l||' ',font:exportFontName,size:textSize*2,color:textColor.replace('#','')})]
    }));

    // Note about line style, since ruled/grid paper can't be replicated as real DOCX ruling
    if(lineStyle!=='none'){
      pars.unshift(new Paragraph({
        children:[new TextRun({text:`Note: "${lineStyle}" paper lines only appear in the preview/PDF/PNG exports — Word format does not support adding these lines.`,italics:true,color:'999999',size:18})]
      }));
      pars.splice(1,0,new Paragraph({children:[new TextRun({text:''})]}));
    }
    if(cfamily){
      pars.unshift(new Paragraph({
        children:[new TextRun({text:`Note: This document uses the custom font "${exportFontName}" — if it is not installed in Word, a default font will be shown instead. Install the font file separately to see it correctly.`,italics:true,color:'999999',size:18})]
      }));
      pars.splice(1,0,new Paragraph({children:[new TextRun({text:''})]}));
    }

    const doc=new Document({sections:[{properties:{},children:pars}]});
    triggerDl(await Packer.toBlob(doc),'harfnama_output.docx');
    toast('📘 Word file downloaded! Font: '+exportFontName);
  }catch(e){toast('❌ '+friendlyError(e,'docx'))}
  hideOv();
}

async function dlPDF(){
  closeDl();if(!getTxt()){toast('⚠️ No text to export');return}
  showOv('Loading font...');
  try{
    await ensureFontReady(); // FIX: race condition
    showOv('Preparing PDF — '+pages.length+' page(s)...');
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:pageW>pageH?'landscape':'portrait',unit:'px',format:[pageW,pageH]});
    await withExportZoom(async ()=>{
      for(let i=0;i<pages.length;i++){
        if(i>0)pdf.addPage([pageW,pageH]);
        const c=await html2canvas(pages[i].el,{scale:2,useCORS:true,backgroundColor:pageBg,width:pageW,height:pageH});
        pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pageW,pageH);
      }
    });
    pdf.save('harfnama_output.pdf');
    toast('📕 PDF downloaded! ('+pages.length+' page(s))');
  }catch(e){toast('❌ '+friendlyError(e,'pdf'))}
  hideOv();
}

async function dlPNG(){
  closeDl();if(!getTxt()){toast('⚠️ No text to export');return}
  showOv('Loading font...');
  try{
    await ensureFontReady(); // FIX: race condition
    showOv('Preparing PNG — '+pages.length+' page(s)...');
    const cvs=await withExportZoom(()=>Promise.all(pages.map(p=>html2canvas(p.el,{scale:2,useCORS:true,backgroundColor:pageBg,width:pageW,height:pageH}))));
    const totalH=cvs.reduce((s,c)=>s+c.height,0);
    const merged=document.createElement('canvas');merged.width=cvs[0].width;merged.height=totalH;
    const ctx=merged.getContext('2d');let y=0;cvs.forEach(c=>{ctx.drawImage(c,0,y);y+=c.height});
    merged.toBlob(b=>triggerDl(b,'harfnama_output.png'));
    toast('🖼️ PNG downloaded! ('+pages.length+' page(s) stacked)');
  }catch(e){toast('❌ '+friendlyError(e,'png'))}
  hideOv();
}

function dlHTML(){
  closeDl();
  const text=getTxt();if(!text){toast('⚠️ No text to export');return}
  const gap=document.getElementById('lgap').value;
  const lc=document.getElementById('lcolor').value;
  const fn=getFont();const fnName=cfamily?(customFontFile||'Custom Font'):selFont.name;
  let bgImg='';
  if(lineStyle==='ruled')bgImg=`background-image:repeating-linear-gradient(transparent,transparent ${gap-1}px,${lc} ${gap}px)`;
  const fontLinkTag=cfamily?'':`<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fnName.replace(/ /g,'+'))}&display=swap" rel="stylesheet">`;
  const html=`<!DOCTYPE html><html lang="ur" dir="${isRTL?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>Harfnama Export</title>
${fontLinkTag}
<style>body{margin:0;background:#d1cdc7;display:flex;flex-direction:column;align-items:center;gap:16px;padding:2rem}
.page{background:${pageBg};width:${pageW}px;min-height:${pageH}px;box-shadow:0 4px 20px rgba(0,0,0,.2);
${bgImg};padding:20px ${lineStyle==='margin'?'20px 20px 88px':'20px'};
font-family:${fn};font-size:${textSize}px;line-height:${gap}px;color:${textColor};
white-space:pre-wrap;word-break:break-word;direction:${isRTL?'rtl':'ltr'}}
${cfamily?'<!-- Note: custom font is not embedded in this export; install the font file locally to see it correctly. -->':''}
</style></head><body>${pages.map(p=>`<div class="page">${escH(p.textEl.innerText)}</div>`).join('\n')}</body></html>`;
  triggerDl(new Blob([html],{type:'text/html'}),'harfnama_output.html');
  toast('🌐 HTML downloaded! ('+pages.length+' page(s))');
}

function dlTXT(){closeDl();const t=getTxt();if(!t){toast('⚠️ No text to export');return}
  triggerDl(new Blob([t],{type:'text/plain'}),'harfnama_output.txt');toast('📄 TXT downloaded!')}

function copyTxt(){const t=getTxt();if(!t){toast('⚠️ Load some text first');return}navigator.clipboard.writeText(t).then(()=>toast('📋 Copied to clipboard!')).catch(()=>toast('❌ Copy failed — check browser permissions'))}

function clearAll(){
  if(getTxt() && !confirm('All content will be cleared. Are you sure?')) return;
  rebuildFromScratch('');
  document.getElementById('badge').innerHTML='';
  cfamily=null;customFontFile=null;customFontBase64=null;
  document.getElementById('cfname').textContent='';
  clearDraft();
  toast('🗑️ Cleared');
}

/* ════════════════════════════════════════════════
   AUTOSAVE / DRAFT PERSISTENCE  (FIX: no persistence before)
   ════════════════════════════════════════════════ */
const DRAFT_KEY='harfnama_draft_v1';
let saveDebounce=null;
function saveDraftDebounced(){clearTimeout(saveDebounce);saveDebounce=setTimeout(saveDraft,900)}
function saveDraft(){
  try{
    const draft={
      text:getTxt(),
      html:getHTML(),
      fontName:selFont.name,
      curTab,isRTL,lineStyle,pageW,pageH,textSize,textColor,pageBg,
      lgap:document.getElementById('lgap').value,
      lcolor:document.getElementById('lcolor').value,
      savedAt:Date.now()
    };
    localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
    flashSaveIndicator();
  }catch(e){ /* storage full or unavailable — fail silently, not critical */ }
}
function clearDraft(){try{localStorage.removeItem(DRAFT_KEY)}catch(e){}}
function flashSaveIndicator(){
  const el=document.getElementById('saveIndicator');
  el.classList.add('show');
  clearTimeout(flashSaveIndicator._t);
  flashSaveIndicator._t=setTimeout(()=>el.classList.remove('show'),1200);
}
function loadDraft(){
  try{
    const raw=localStorage.getItem(DRAFT_KEY);
    if(!raw)return false;
    const d=JSON.parse(raw);
    if(!d || !d.text)return false;
    // restore simple settings first
    isRTL=!!d.isRTL;
    textSize=d.textSize||18;textColor=d.textColor||'#1a1a1a';pageBg=d.pageBg||'#ffffff';
    pageW=d.pageW||794;pageH=d.pageH||1123;
    lineStyle=d.lineStyle||'none';
    document.getElementById('tsize').value=textSize;document.getElementById('tsizev').textContent=textSize+'px';
    document.getElementById('tcolor').value=textColor;
    document.getElementById('pgbg').value=pageBg;
    if(d.lgap)document.getElementById('lgap').value=d.lgap;
    if(d.lcolor)document.getElementById('lcolor').value=d.lcolor;
    document.getElementById('lval').textContent=document.getElementById('lgap').value+'px';
    document.getElementById('rtlbtn').textContent=isRTL?'RTL ←':'LTR →';

    // restore font selection (best-effort match by name)
    const all=[...FONTS.latin,...FONTS.urdu];
    const found=all.find(f=>f.name===d.fontName);
    if(found)selFont=found;

    // restore paper size button state
    document.querySelectorAll('.szbtn').forEach(b=>{
      b.classList.toggle('on', parseInt(b.dataset.w)===pageW && parseInt(b.dataset.h)===pageH);
    });
    // restore line style button state
    document.querySelectorAll('.lbtn').forEach(b=>{
      const on=b.dataset.style===lineStyle;
      b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);
    });

    if(d.html && d.html.trim()){
      restoreFromHTML(d.html);
    }else{
      rebuildFromScratch(d.text);
    }
    document.getElementById('fontlbl').textContent='Font: '+selFont.name;
    toast('📂 Previous draft restored');
    return true;
  }catch(e){return false}
}

/* Restores a saved multi-page document from combined HTML (preserving bold,
   color, alignment, tables) by flowing it through fresh pages. */
function restoreFromHTML(html){
  paginating=true;
  const wrapEl=document.getElementById('paperZoomWrap');
  wrapEl.innerHTML='';
  const firstPage=buildPageShell();
  firstPage.textEl.innerHTML=html;
  firstPage.textEl.addEventListener('input',onAnyTextInput);
  wrapEl.appendChild(firstPage.el);
  pages=[firstPage];
  paginating=false;
  flowOverflow(firstPage.textEl);
}

/* Warn before leaving if there's unsaved-feeling content (draft is already autosaved,
   this is just a gentle nudge in case localStorage is disabled in this browser) */
window.addEventListener('beforeunload',(e)=>{
  try{ if(localStorage.getItem(DRAFT_KEY)) return; }catch(err){}
  if(getTxt()){
    e.preventDefault();e.returnValue='';
  }
});

/* ════════════════════════════════════════════════
   UTILS
   ════════════════════════════════════════════════ */
function cWords(t){return t.trim()?t.trim().split(/\s+/).length:0}
function updateFooter(){
  const t=getTxt();
  document.getElementById('charcnt').textContent=t.length+' chars';
  document.getElementById('wordcnt').textContent=cWords(t)+' words';
  document.getElementById('pagelbl').textContent=pages.length+' page'+(pages.length>1?'s':'');
  numberPages();
}
function triggerDl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function escH(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
let toastT;
function toast(m){const el=document.getElementById('toast');el.textContent=m;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3200)}
function showOv(m){document.getElementById('ovmsg').textContent=m;document.getElementById('ov').classList.add('show')}
function hideOv(){document.getElementById('ov').classList.remove('show')}
function showProg(){document.getElementById('prog').style.display='block'}
function hideProg(){document.getElementById('prog').style.display='none'}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
renderFgrid();
window.addEventListener('resize',()=>{ if(zoomLevel) zoomFit(); });
const restored=loadDraft();
if(!restored){
  rebuildFromScratch('');
}
zoomFit();
