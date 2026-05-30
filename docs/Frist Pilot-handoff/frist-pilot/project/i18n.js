/* ============================================================
   WRENFIELD WORKS — bilingual engine (EN ⇄ ไทย)
   Mono/technical labels (kickers, tags, section numbers) stay
   English by design — that's the brand's "voice of systems".
   Human-readable prose toggles fully.
   ============================================================ */
(function(){
  'use strict';
  const DICT = {
    nav_cap:{en:'Capabilities', th:'บริการ'},
    nav_platform:{en:'Platform', th:'แพลตฟอร์ม'},
    nav_work:{en:'Work', th:'ผลงาน'},
    nav_process:{en:'Process', th:'กระบวนการ'},
    nav_cta:{en:'Get in touch <span class="arr">→</span>', th:'ติดต่อเรา <span class="arr">→</span>'},

    hero_h1:{
      en:"Production systems for teams that <em>can't afford to break.</em>",
      th:"ระบบ production สำหรับทีมที่ <em>ผิดพลาดไม่ได้</em>"
    },
    hero_sub:{
      en:"We design, build, and ship the automation, internal tools, and workflow platforms that run real businesses — <b>from idea to deployed, end to end.</b>",
      th:"เราออกแบบ สร้าง และส่งมอบระบบอัตโนมัติ เครื่องมือภายใน และแพลตฟอร์มเวิร์กโฟลว์ที่ขับเคลื่อนธุรกิจจริง — <b>ตั้งแต่ไอเดียจนถึงการ deploy ครบวงจร</b>"
    },
    hero_trust:{
      en:"Trusted across CRM · automation · internal tooling · data platforms",
      th:"ไว้วางใจในงาน CRM · ระบบอัตโนมัติ · เครื่องมือภายใน · แพลตฟอร์มข้อมูล"
    },

    stat1_k:{en:'Systems shipped to production', th:'ระบบที่ส่งขึ้น production'},
    stat2_k:{en:'Average review cycles cut', th:'ลดรอบรีวิวโดยเฉลี่ย'},
    stat3_k:{en:'Ship velocity vs. team size', th:'ความเร็วการส่งงานเทียบขนาดทีม'},
    stat4_k:{en:'Direct line to the builder', th:'คุยกับคนสร้างโดยตรง'},

    sec1_h2:{en:'What we build', th:'สิ่งที่เราสร้าง'},
    sec1_sub:{en:'Systems designed around how your team actually works', th:'ระบบที่ออกแบบรอบวิธีทำงานจริงของทีมคุณ'},
    sec2_h2:{en:'One practice, three surfaces', th:'หนึ่งทีม สามด้านงาน'},
    sec2_sub:{en:'Switch between them — tap to see a real example', th:'เลือกดูแต่ละด้าน — กดสลับเพื่อดูตัวอย่างจริง'},
    sec3_h2:{en:'Selected work', th:'ผลงานที่คัดมา'},
    sec3_sub:{en:'Each started as a rough idea and became something a team uses daily', th:'ทุกชิ้นเริ่มจากไอเดียคร่าว ๆ จนเป็นระบบที่ทีมใช้ทุกวัน'},
    sec4_h2:{en:'How we work', th:'วิธีการทำงาน'},
    sec4_sub:{en:'Clear, transparent, handed over clean', th:'ชัดเจน โปร่งใส ส่งมอบสะอาด'},

    cap1_h3:{en:'Automation &amp; workflows', th:'ระบบอัตโนมัติ &amp; เวิร์กโฟลว์'},
    cap1_p:{en:'Pipelines and integrations that remove manual, repetitive work — data flows, reporting, and the glue between the tools a team already runs on.', th:'ไปป์ไลน์และการเชื่อมต่อที่ขจัดงานซ้ำ ๆ ที่ต้องทำมือ — การไหลของข้อมูล รายงาน และตัวเชื่อมระหว่างเครื่องมือที่ทีมใช้อยู่แล้ว'},
    cap2_h3:{en:'Internal tools &amp; dashboards', th:'เครื่องมือภายใน &amp; แดชบอร์ด'},
    cap2_p:{en:'Admin panels and operational tools built around how a team actually works — not generic templates bent to fit. Every control where it belongs.', th:'แผงควบคุมและเครื่องมือปฏิบัติการที่สร้างรอบวิธีทำงานจริงของทีม — ไม่ใช่เทมเพลตสำเร็จรูปที่ดัดให้พอใช้ ทุกการควบคุมอยู่ตรงที่ควรอยู่'},
    cap3_h3:{en:'Custom platforms', th:'แพลตฟอร์มเฉพาะทาง'},
    cap3_p:{en:'CRMs, booking systems, client portals, and data tools — designed, built, and deployed end to end, hardened for real users from day one.', th:'CRM ระบบจอง พอร์ทัลลูกค้า และเครื่องมือข้อมูล — ออกแบบ สร้าง และ deploy ครบวงจร แข็งแรงพร้อมผู้ใช้จริงตั้งแต่วันแรก'},
    cap4_h3:{en:'AI-assisted delivery', th:'ส่งมอบด้วยพลัง AI'},
    cap4_p:{en:'AI does the heavy lifting; human judgment does the rest. The result is a small operation that ships at the pace of a team ten times its size.', th:'AI รับงานหนัก ส่วนวิจารณญาณคนทำที่เหลือ ผลคือทีมเล็กที่ส่งงานได้เร็วเท่าทีมที่ใหญ่กว่าสิบเท่า'},

    sc1_h4:{en:'Hands-off pipelines', th:'ไปป์ไลน์ที่ไม่ต้องแตะ'},
    sc1_p:{en:'Email-to-data, reporting, sync', th:'อีเมลเป็นข้อมูล รายงาน ซิงก์'},
    sc2_h4:{en:'Operational dashboards', th:'แดชบอร์ดปฏิบัติการ'},
    sc2_p:{en:'The right answer, one click away', th:'คำตอบที่ใช่ ห่างแค่คลิกเดียว'},
    sc3_h4:{en:'Deployed &amp; hardened', th:'Deploy แล้ว แข็งแรงพร้อมใช้'},
    sc3_p:{en:'Shipped clean, built to last', th:'ส่งมอบสะอาด สร้างให้อยู่ทน'},

    case1_h4:{en:'Enterprise CRM &amp; portal', th:'CRM &amp; พอร์ทัลระดับองค์กร'},
    case1_p:{en:'End-to-end CRM with client portal and automated workflows, built for a team that had outgrown spreadsheets.', th:'CRM ครบวงจรพร้อมพอร์ทัลลูกค้าและเวิร์กโฟลว์อัตโนมัติ สร้างให้ทีมที่โตเกินกว่าจะใช้สเปรดชีต'},
    case2_h4:{en:'Ops automation suite', th:'ชุดระบบอัตโนมัติงานปฏิบัติการ'},
    case2_p:{en:'Email-to-data pipelines and reporting bots that turned hours of manual processing into a hands-off routine.', th:'ไปป์ไลน์แปลงอีเมลเป็นข้อมูลและบอทรายงาน ที่เปลี่ยนงานมือหลายชั่วโมงให้เป็นงานอัตโนมัติ'},
    case3_h4:{en:'Internal tooling layer', th:'เลเยอร์เครื่องมือภายใน'},
    case3_p:{en:'Estimate calculators, internal chatbots, and dashboards that put the right answer one click away for the whole team.', th:'เครื่องคิดราคา แชทบอทภายใน และแดชบอร์ด ที่ทำให้คำตอบที่ใช่อยู่ห่างทั้งทีมแค่คลิกเดียว'},

    p1_h4:{en:'Define what "shipped" means', th:'นิยามว่า "เสร็จ" คืออะไร'},
    p1_p:{en:'Understand the real problem and the constraints before a line of code. We agree on exactly what success looks like — measurable, dated, and owned.', th:'เข้าใจปัญหาจริงและข้อจำกัดก่อนเขียนโค้ดสักบรรทัด เราตกลงกันชัดว่าความสำเร็จหน้าตาเป็นอย่างไร — วัดได้ มีกำหนด และมีเจ้าของ'},
    p2_h4:{en:'AI-leveraged, production-grade', th:'ใช้ AI เป็นพลัง ระดับ production'},
    p2_p:{en:'Fast iterations with you in the loop throughout. AI carries the volume; judgment carries the quality. You see progress in days, not quarters.', th:'ทำซ้ำเร็วโดยมีคุณอยู่ในลูปตลอด AI รับปริมาณงาน วิจารณญาณคุมคุณภาพ คุณเห็นความคืบหน้าเป็นวัน ไม่ใช่ไตรมาส'},
    p3_h4:{en:'Ship it, hand it over clean', th:'ส่ง deploy แล้วส่งมอบสะอาด'},
    p3_p:{en:'Deploy to production, document it, and build it to last past the first real users. Your team owns the system — no lock-in, no mystery.', th:'Deploy ขึ้น production ทำเอกสาร และสร้างให้อยู่ทนเกินกว่าผู้ใช้จริงกลุ่มแรก ทีมคุณเป็นเจ้าของระบบ — ไม่ผูกขาด ไม่มีอะไรลึกลับ'},

    quote:{en:'"We talked to the person actually doing the work. It shipped in <em>weeks</em>, survived our busiest quarter, and the handover was so clean our own team owns it now."', th:'"เราได้คุยกับคนที่ลงมือทำจริง มันส่งมอบใน <em>ไม่กี่สัปดาห์</em> รอดผ่านไตรมาสที่ยุ่งที่สุดของเรา และการส่งมอบสะอาดจนทีมเราเป็นเจ้าของเองได้เลย"'},
    quote_by:{en:'— Operations Director · <b>Meridian Freight</b>', th:'— ผู้อำนวยการฝ่ายปฏิบัติการ · <b>Meridian Freight</b>'},

    cta_h2:{en:'Have something <em>worth building?</em>', th:'มีอะไรที่ <em>ควรค่าแก่การสร้าง?</em>'},
    cta_p:{en:"Tell us what you're trying to ship. If it's a system, a tool, or an automation — it's probably in scope.", th:'บอกเราว่าคุณกำลังจะส่งอะไร — ถ้าเป็นระบบ เครื่องมือ หรือ automation มันมักจะอยู่ในขอบเขตของเรา'},
    cta_book:{en:'Book a call', th:'นัดคุย'},

    foot_p:{en:'AI-assisted systems, built right. The independent practice that ships like a team ten times its size.', th:'ระบบที่ใช้ AI สร้าง ทำมาอย่างถูกต้อง ทีมอิสระที่ส่งงานได้เหมือนทีมที่ใหญ่กว่าสิบเท่า'},
    foot_studio:{en:'Studio', th:'สตูดิโอ'},
    foot_connect:{en:'Connect', th:'ติดต่อ'}
  };

  function getLang(){
    try{ return localStorage.getItem('wf-lang') || 'en'; }catch(e){ return 'en'; }
  }
  function applyLang(lang){
    lang = (lang === 'th') ? 'th' : 'en';
    window.__lang = lang;
    document.documentElement.lang = lang;
    document.body && document.body.classList.toggle('lang-th', lang === 'th');
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const t = DICT[el.dataset.i18n];
      if(t && t[lang] != null) el.innerHTML = t[lang];
    });
    document.querySelectorAll('.lang-tog [data-lang]').forEach(s=>{
      s.classList.toggle('on', s.dataset.lang === lang);
    });
    try{ localStorage.setItem('wf-lang', lang); }catch(e){}
    // let the engine re-wrap the headline & refresh the sticky in the new language
    if(window.__wf){
      window.__wf.wrapHeroH1 && window.__wf.wrapHeroH1();
      window.__wf.refreshProcess && window.__wf.refreshProcess();
    }
  }
  window.__applyLang = applyLang;

  // apply saved language as early as possible (scripts sit at end of <body>)
  applyLang(getLang());

  // wire the pill
  document.querySelectorAll('.lang-tog [data-lang]').forEach(s=>{
    s.addEventListener('click', ()=>applyLang(s.dataset.lang));
  });
})();
