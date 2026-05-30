/* ============================================================
   WRENFIELD WORKS — Enterprise site engine (vanilla)
   ============================================================ */
(function(){
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(max-width:900px)').matches;
  const motionOff = () => document.body.classList.contains('motion-off');
  const BRASS = '#CBA265';

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- custom cursor ---------- */
  if(!isTouch){
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;});
    (function loop(){rx+=(mx-rx)*.16;ry+=(my-ry)*.16;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop);})();
    const hot='a,button,.sc-tab,.logo-item,.cap,.case';
    document.addEventListener('mouseover',e=>{ if(e.target.closest(hot)) ring.classList.add('hot'); });
    document.addEventListener('mouseout',e=>{ if(e.target.closest(hot)) ring.classList.remove('hot'); });
  }

  /* ---------- magnetic buttons ---------- */
  if(!isTouch){
    document.querySelectorAll('[data-magnetic]').forEach(el=>{
      el.addEventListener('mousemove',e=>{
        if(motionOff())return;
        const r=el.getBoundingClientRect();
        const x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
        el.style.transform=`translate(${x*.28}px,${y*.34}px)`;
      });
      el.addEventListener('mouseleave',()=>{ el.style.transform=''; });
    });
  }

  /* ---------- scroll reveal (stagger) ---------- */
  const reveals=[...document.querySelectorAll('.reveal')];
  const io=new IntersectionObserver((es)=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
  }),{threshold:.16,rootMargin:'0px 0px -8% 0px'});
  reveals.forEach(el=>{
    const grp=el.closest('[data-stagger]');
    if(grp){const sibs=[...grp.querySelectorAll('.reveal')];el.style.transitionDelay=(sibs.indexOf(el)*70)+'ms';}
    io.observe(el);
  });
  // Fallback: some embedded/iframe viewports size AFTER load, so the IO's first
  // callback can mis-report above-the-fold elements as off-screen and never re-fire.
  // Manually reveal anything already in view; keep the IO for later scroll-ins.
  function kickReveal(){
    const vh=innerHeight||document.documentElement.clientHeight;
    reveals.forEach(el=>{
      if(el.classList.contains('in'))return;
      const r=el.getBoundingClientRect();
      if(r.top < vh*0.92 && r.bottom > 0){el.classList.add('in');io.unobserve(el);}
    });
  }
  addEventListener('load',()=>requestAnimationFrame(kickReveal));
  addEventListener('resize',kickReveal,{passive:true});
  [120,400,900].forEach(ms=>setTimeout(kickReveal,ms));

  /* ---------- hairline dividers draw themselves in ---------- */
  const rules=[...document.querySelectorAll('section.blk:not(.no-rule)')];
  const rio=new IntersectionObserver((es)=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('rule-in');rio.unobserve(e.target);}
  }),{threshold:0,rootMargin:'0px 0px -12% 0px'});
  function kickRule(){
    const vh=innerHeight||document.documentElement.clientHeight;
    rules.forEach(el=>{
      if(el.classList.contains('rule-in'))return;
      const r=el.getBoundingClientRect();
      if(r.top < vh*0.88 && r.bottom > 0){el.classList.add('rule-in');rio.unobserve(el);}
    });
  }
  rules.forEach(el=>rio.observe(el));
  addEventListener('load',()=>requestAnimationFrame(kickRule));
  addEventListener('resize',kickRule,{passive:true});
  [160,500,1000].forEach(ms=>setTimeout(kickRule,ms));

  /* ---------- animated counters ---------- */
  const fmt=(n,dec)=> dec? n.toFixed(dec) : Math.round(n).toLocaleString();
  const cio=new IntersectionObserver((es)=>es.forEach(e=>{
    if(!e.isIntersecting)return; cio.unobserve(e.target);
    const el=e.target, to=parseFloat(el.dataset.count), dec=parseInt(el.dataset.dec||'0',10), dur=1400;
    if(motionOff()){el.firstChild.textContent=fmt(to,dec);return;}
    const t0=performance.now();
    (function tick(t){
      const p=Math.min(1,(t-t0)/dur), e2=1-Math.pow(1-p,3);
      el.firstChild.textContent=fmt(to*e2,dec);
      if(p<1)requestAnimationFrame(tick);
    })(t0);
  }),{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

  /* ---------- showcase tabs ---------- */
  const tabs=[...document.querySelectorAll('.sc-tab')];
  const panels=[...document.querySelectorAll('.sc-panel')];
  function selTab(i){
    tabs.forEach((t,k)=>t.classList.toggle('active',k===i));
    panels.forEach((p,k)=>p.classList.toggle('show',k===i));
    // animate bars if present
    const bars=panels[i].querySelectorAll('.mock-bar');
    bars.forEach(b=>{const h=b.dataset.h||'50%';b.style.height='0';requestAnimationFrame(()=>requestAnimationFrame(()=>b.style.height=h));});
  }
  tabs.forEach((t,i)=>t.addEventListener('click',()=>selTab(i)));
  if(tabs.length)selTab(0);

  /* ---------- process sticky highlight (language-aware) ---------- */
  const psteps=[...document.querySelectorAll('.pstep')];
  const bigN=document.querySelector('.process-sticky .big-n');
  const bigT=document.querySelector('.process-sticky h3');
  const bigTh=document.querySelector('.process-sticky .pth');
  function setSticky(step){
    if(!step||!bigN)return;
    const th = (window.__lang==='th');
    bigN.textContent=step.dataset.n;
    // primary = current language; sub-line = the other language (always bilingual)
    bigT.textContent = th ? step.dataset.th : step.dataset.t;
    bigTh.textContent = th ? step.dataset.t : step.dataset.th;
  }
  if(psteps.length && bigN){
    const pio=new IntersectionObserver((es)=>{
      es.forEach(e=>{
        if(e.isIntersecting && e.intersectionRatio>.5){
          psteps.forEach(s=>s.classList.remove('on'));
          e.target.classList.add('on');
          setSticky(e.target);
        }
      });
    },{threshold:.55});
    psteps.forEach(s=>pio.observe(s));
  }

  /* ============================================================
     GENERATIVE LATTICE CANVAS  (the brand motif, alive)
     node-and-line geometry, drifting, mouse-reactive
     ============================================================ */
  function latticeField(canvas, opts){
    const ctx=canvas.getContext('2d');
    opts=Object.assign({density:90,linkDist:150,speed:.18,mouse:true,react:120,pulses:false,maxPulses:6},opts);
    let W,H,DPR,nodes=[],mouse={x:-999,y:-999},raf,running=true,pulses=[];
    function size(){
      DPR=Math.min(2,devicePixelRatio||1);
      const r=canvas.getBoundingClientRect();
      W=r.width;H=r.height;
      canvas.width=W*DPR;canvas.height=H*DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
      const count=Math.round((W*H)/(opts.density*opts.density));
      nodes=[];
      for(let i=0;i<count;i++){
        nodes.push({
          x:Math.random()*W,y:Math.random()*H,
          vx:(Math.random()-.5)*opts.speed,vy:(Math.random()-.5)*opts.speed,
          r:Math.random()*1.4+1.1,
          ring:Math.random()<.14
        });
      }
    }
    function frame(){
      if(!running)return;
      ctx.clearRect(0,0,W,H);
      const slow = motionOff()?0:1;
      for(const n of nodes){
        n.x+=n.vx*slow;n.y+=n.vy*slow;
        if(n.x<-20)n.x=W+20;if(n.x>W+20)n.x=-20;
        if(n.y<-20)n.y=H+20;if(n.y>H+20)n.y=-20;
        if(opts.mouse && slow){
          const dx=n.x-mouse.x,dy=n.y-mouse.y,d=Math.hypot(dx,dy);
          if(d<opts.react && d>0.1){const f=(opts.react-d)/opts.react*.8;n.x+=dx/d*f;n.y+=dy/d*f;}
        }
      }
      // links
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
          if(d<opts.linkDist){
            const o=(1-d/opts.linkDist)*.32;
            ctx.strokeStyle=`rgba(181,137,74,${o})`;
            ctx.lineWidth=1;
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          }
        }
      }
      // nodes
      for(const n of nodes){
        ctx.beginPath();
        if(n.ring){
          ctx.arc(n.x,n.y,n.r+2.4,0,7);ctx.strokeStyle='rgba(203,162,101,.7)';ctx.lineWidth=1.3;ctx.stroke();
        }else{
          ctx.arc(n.x,n.y,n.r,0,7);ctx.fillStyle='rgba(203,162,101,.85)';ctx.fill();
        }
      }
      // data pulses — bright charges travelling along edges (the system, alive)
      if(opts.pulses){
        if(slow && pulses.length<opts.maxPulses && Math.random()<.05){
          const a=nodes[(Math.random()*nodes.length)|0];
          let b=null,bd=1e9;
          for(const c of nodes){ if(c===a)continue; const d=Math.hypot(a.x-c.x,a.y-c.y); if(d<opts.linkDist && d<bd){bd=d;b=c;} }
          if(b) pulses.push({a,b,t:0,sp:.012+Math.random()*.014});
        }
        for(let p=pulses.length-1;p>=0;p--){
          const pu=pulses[p]; pu.t+=pu.sp*slow;
          if(pu.t>=1){pulses.splice(p,1);continue;}
          const x=pu.a.x+(pu.b.x-pu.a.x)*pu.t, y=pu.a.y+(pu.b.y-pu.a.y)*pu.t;
          const fade=Math.sin(pu.t*Math.PI);
          ctx.beginPath();ctx.arc(x,y,5.5,0,7);ctx.fillStyle=`rgba(203,162,101,${.10*fade})`;ctx.fill();
          ctx.beginPath();ctx.arc(x,y,2.1,0,7);ctx.fillStyle=`rgba(232,205,150,${.95*fade})`;ctx.fill();
        }
      }
      raf=requestAnimationFrame(frame);
    }
    if(opts.mouse){
      addEventListener('mousemove',e=>{
        const r=canvas.getBoundingClientRect();
        mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;
      });
    }
    addEventListener('resize',()=>{cancelAnimationFrame(raf);size();frame();});
    size();frame();
    // pause when offscreen
    new IntersectionObserver(es=>es.forEach(e=>{
      running=e.isIntersecting;
      if(running){frame();}else{cancelAnimationFrame(raf);}
    }),{threshold:0}).observe(canvas);
    return {resize:size};
  }

  const heroC=document.getElementById('hero-canvas');
  if(heroC) latticeField(heroC,{density:78,linkDist:165,speed:.2,react:140,pulses:true,maxPulses:7});
  const ctaC=document.getElementById('cta-canvas');
  if(ctaC) latticeField(ctaC,{density:96,linkDist:140,speed:.14,react:90,pulses:true,maxPulses:4});

  /* case study thumb lattices (static-ish, light) */
  document.querySelectorAll('.case .thumb canvas').forEach(c=>{
    latticeField(c,{density:62,linkDist:96,speed:.1,mouse:false,react:0});
  });

  /* ---------- hero headline: line-by-line word-mask reveal ---------- */
  function wrapHeroH1(){
    const h1=document.querySelector('.hero h1'); if(!h1) return;
    let i=0;
    const out=document.createElement('div');
    (function walk(src,dst){
      src.childNodes.forEach(ch=>{
        if(ch.nodeType===3){
          ch.textContent.split(/(\s+)/).forEach(tok=>{
            if(tok==='')return;
            if(/^\s+$/.test(tok)){ dst.appendChild(document.createTextNode(tok)); return; }
            const w=document.createElement('span'); w.className='word';
            const wi=document.createElement('span'); wi.className='w-in'; wi.textContent=tok;
            wi.style.transitionDelay=(i*52)+'ms'; i++;
            w.appendChild(wi); dst.appendChild(w);
          });
        } else if(ch.nodeType===1){
          const el=document.createElement(ch.tagName.toLowerCase());
          if(ch.className) el.className=ch.className;
          walk(ch,el); dst.appendChild(el);
        }
      });
    })(h1,out);
    h1.innerHTML=out.innerHTML;
    h1.classList.remove('in');
    requestAnimationFrame(()=>requestAnimationFrame(()=>h1.classList.add('in')));
    setTimeout(()=>h1.classList.add('in'),260);
  }

  /* expose for tweaks app + i18n */
  window.__wf = {
    replayDraw(){
      document.querySelectorAll('.draw').forEach(el=>{
        el.classList.remove('draw');void el.offsetWidth;el.classList.add('draw');
      });
    },
    wrapHeroH1,
    refreshProcess(){ const on=document.querySelector('.pstep.on'); if(on) setSticky(on); }
  };
  // if i18n hasn't run yet, wrap once so the headline still animates in
  if(!window.__lang) wrapHeroH1();

  /* ---------- hero parallax (subtle) ---------- */
  const heroGlow=document.querySelector('.hero-glow');
  if(heroGlow && !isTouch){
    addEventListener('scroll',()=>{
      if(motionOff())return;
      const y=scrollY*.12;heroGlow.style.transform=`translateY(${y}px)`;
    },{passive:true});
  }
})();
