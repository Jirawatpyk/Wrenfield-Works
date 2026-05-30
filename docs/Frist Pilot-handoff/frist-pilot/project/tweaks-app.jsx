/* ============================================================
   Tweaks app — drives the vanilla Wrenfield site via DOM/CSS vars
   ============================================================ */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "Ink",
  "motion": "Full",
  "texture": 100,
  "accent": "#B5894A",
  "showcaseAuto": true
}/*EDITMODE-END*/;

function applyAccent(hex){
  // derive a lifted tone for dark backgrounds
  const lift = (h, amt) => {
    const n = parseInt(h.slice(1),16);
    let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    r=Math.min(255,r+amt); g=Math.min(255,g+amt); b=Math.min(255,b+amt);
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  };
  const root = document.documentElement;
  root.style.setProperty('--brass', hex);
  root.style.setProperty('--brass-lt', lift(hex, 22));
}

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // theme
  useEffect(()=>{
    document.body.classList.toggle('paper', t.theme === 'Paper');
  }, [t.theme]);

  // motion
  useEffect(()=>{
    const b = document.body;
    b.classList.toggle('motion-off', t.motion === 'Off');
    b.classList.toggle('motion-calm', t.motion === 'Calm');
  }, [t.motion]);

  // texture (grain + lattice)
  useEffect(()=>{
    const f = t.texture/100;
    document.documentElement.style.setProperty('--tx-grain', (0.05*f).toFixed(3));
    document.documentElement.style.setProperty('--tx-lattice', f.toFixed(2));
  }, [t.texture]);

  // accent
  useEffect(()=>{ applyAccent(t.accent); }, [t.accent]);

  // showcase auto-cycle
  useEffect(()=>{
    if(!t.showcaseAuto) return;
    const tabs = [...document.querySelectorAll('.sc-tab')];
    if(!tabs.length) return;
    let i = 0, paused = false;
    const stage = document.querySelector('#platform');
    const onOver = ()=>{ paused = true; };
    const onOut = ()=>{ paused = false; };
    stage && stage.addEventListener('mouseenter', onOver);
    stage && stage.addEventListener('mouseleave', onOut);
    const id = setInterval(()=>{
      if(paused || document.body.classList.contains('motion-off')) return;
      i = (i+1) % tabs.length;
      tabs[i].click();
    }, 3600);
    return ()=>{ clearInterval(id); stage && stage.removeEventListener('mouseenter', onOver); stage && stage.removeEventListener('mouseleave', onOut); };
  }, [t.showcaseAuto]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio label="Surface" value={t.theme}
        options={['Ink','Paper']}
        onChange={(v)=>setTweak('theme', v)} />
      <TweakColor label="Accent" value={t.accent}
        options={['#B5894A','#9A6B3A','#7C8A6B','#6E747C']}
        onChange={(v)=>setTweak('accent', v)} />

      <TweakSection label="Motion" />
      <TweakRadio label="Animation" value={t.motion}
        options={['Full','Calm','Off']}
        onChange={(v)=>setTweak('motion', v)} />
      <TweakToggle label="Auto-cycle showcase" value={t.showcaseAuto}
        onChange={(v)=>setTweak('showcaseAuto', v)} />

      <TweakSection label="Texture" />
      <TweakSlider label="Grain & lattice" value={t.texture} min={0} max={100} unit="%"
        onChange={(v)=>setTweak('texture', v)} />

      <TweakButton label="Replay mark" onClick={()=>window.__wf && window.__wf.replayDraw()} />
    </TweaksPanel>
  );
}

const mount = document.createElement('div');
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(<App />);
