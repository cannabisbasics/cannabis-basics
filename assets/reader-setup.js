(()=>{const home=false;
 if(!home&&document.body.dataset.reader==='true'){
  const bar=document.createElement('aside');bar.id='page-tools';bar.setAttribute('aria-label','i.e. Reading Bar');
  bar.innerHTML='<button class="light-toggle" type="button"></button><div class="reader-utilities"></div><div class="reader-right"></div>';
  document.body.append(bar);
  const footer=document.querySelector('footer');let queued=false;
  function place(){queued=false;const top=footer?footer.getBoundingClientRect().top:innerHeight;bar.style.setProperty('--tools-footer-offset',Math.max(0,innerHeight-top)+'px');bar.hidden=top<=0;document.documentElement.style.setProperty('--reader-bottom',Math.max(0,innerHeight-top)+(bar.hidden?0:bar.getBoundingClientRect().height)+8+'px')}
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(place)}},{passive:true});window.addEventListener('resize',place);place();
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(place);[footer,document.querySelector('main'),bar].filter(Boolean).forEach(n=>observer.observe(n))}
 }

})();
(()=>{
const tooltip=document.createElement('div');tooltip.className='ie-tooltip';tooltip.id='ie-control-tip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;document.body.append(tooltip);let owner=null;
function candidate(target){return target.closest?.('[data-tooltip],header button[aria-label],header summary[aria-label],footer a[aria-label],footer button[aria-label]')}
function show(n){if(!n)return;if(n.title){n.dataset.tooltip=n.title;n.removeAttribute('title')}owner=n;tooltip.textContent=n.dataset.tooltip||n.getAttribute('aria-label');tooltip.hidden=false;const r=n.getBoundingClientRect(),t=tooltip.getBoundingClientRect();tooltip.style.left=Math.max(6,Math.min(innerWidth-t.width-6,r.left+r.width/2-t.width/2))+'px';tooltip.style.top=Math.max(2,r.top-t.height-8)+'px';n.setAttribute('aria-describedby',tooltip.id)}
function hide(){owner?.removeAttribute('aria-describedby');owner=null;tooltip.hidden=true}
document.querySelectorAll('header [title],footer [title]').forEach(n=>{if(!n.dataset.tooltip)n.dataset.tooltip=n.title;n.removeAttribute('title')});
document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'){const n=candidate(e.target);if(n&&n!==owner)show(n)}});document.addEventListener('pointerout',e=>{if(owner&&!owner.contains(e.relatedTarget))hide()});document.addEventListener('focusin',e=>show(candidate(e.target)));document.addEventListener('focusout',hide);document.addEventListener('pointerdown',hide);window.addEventListener('scroll',hide,{passive:true});document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
})();
