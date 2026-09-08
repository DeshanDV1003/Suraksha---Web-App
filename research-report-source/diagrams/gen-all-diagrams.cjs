/* Suraksha — regenerate all Interim-2 diagrams as editable draw.io, from the ACTUAL built system.
   Output: d:/Suraksha - Web App/research-report-source/diagrams/  */
const fs = require('fs');
const path = require('path');
const OUT = 'd:/Suraksha - Web App/research-report-source/diagrams';
fs.mkdirSync(OUT, { recursive: true });

const esc0 = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// normalise then escape (lets authored strings use either bare chars or &lt;/&gt;/&amp;)
const esc = s => esc0(String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
const GL='«', GR='»';
let U = 0; const nid = p => (p||'c') + (++U);

function V(id,label,x,y,w,h,style){
  return `<mxCell id="${id}" value="${esc(label)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}
function E(id,s,t,label,style){
  return `<mxCell id="${id}" value="${esc(label||'')}" style="${style||'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;'}" edge="1" parent="1" source="${s}" target="${t}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}
function EP(id,x1,y1,x2,y2,label,style){ // free edge by points
  return `<mxCell id="${id}" value="${esc(label||'')}" style="${style||'endArrow=block;html=1;fontSize=10;'}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y1}" as="sourcePoint"/><mxPoint x="${x2}" y="${y2}" as="targetPoint"/></mxGeometry></mxCell>`;
}
function wrap(name,id,cells,w,h){
  return `<diagram name="${esc(name)}" id="${id}"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${w}" pageHeight="${h}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel></diagram>`;
}
function save(fname, name, id, cells, w, h){
  const xml = `<mxfile host="app.diagrams.net" version="24.7.5">${wrap(name,id,cells,w,h)}</mxfile>`;
  fs.writeFileSync(path.join(OUT, fname), xml, 'utf8');
  const lt=(xml.match(/</g)||[]).length, gt=(xml.match(/>/g)||[]).length;
  console.log((lt===gt?'ok  ':'BAD ') + fname + '  (' + cells.length + ' cells)');
}

/* ---------- shared styles ---------- */
const S = {
  band:   'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#999999;verticalAlign=top;align=left;fontStyle=1;spacingLeft=8;spacingTop=4;',
  web:    'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
  app:    'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
  data:   'shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;boundedLbl=1;',
  ml:     'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;',
  ext:    'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
  plain:  'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#666666;',
  proc:   'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
  term:   'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
  dec:    'rhombus;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;',
  io:     'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;',
  sub:    'shape=process;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
  note:   'shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;size=14;align=left;spacingLeft=4;',
  actor:  'shape=umlActor;html=1;verticalLabelPosition=bottom;verticalAlign=top;outlineConnect=0;',
  bar:    'rounded=0;fillColor=#000000;strokeColor=#000000;',
  lane:   'swimlane;html=1;startSize=26;horizontal=1;fillColor=none;strokeColor=#666666;fontStyle=1;',
  cls:    'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;align=left;verticalAlign=top;spacingLeft=4;spacingTop=2;overflow=hidden;',
  ent:    'rounded=0;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#333333;align=left;verticalAlign=top;spacingLeft=4;spacingTop=2;overflow=hidden;',
};
const EDGE = {
  flow:  'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;fontSize=10;',
  dep:   'endArrow=open;dashed=1;html=1;endFill=0;fontSize=10;',
  assoc: 'endArrow=none;html=1;fontSize=10;',
  incl:  'endArrow=open;dashed=1;html=1;endFill=0;strokeColor=#009900;fontSize=10;',
  gen:   'endArrow=block;endFill=0;html=1;strokeColor=#666666;',
  er:    'edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;fontSize=10;startArrow=ERone;endArrow=ERmany;startFill=0;endFill=0;',
  er11:  'edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;fontSize=10;startArrow=ERone;endArrow=ERone;startFill=0;endFill=0;',
  erM:   'edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;fontSize=10;startArrow=ERmany;endArrow=ERmany;startFill=0;endFill=0;',
};

/* ============================================================
   Figure 1.1 — Rich Picture: Four-Layer Sociotechnical System
   ============================================================ */
(function(){
  const c=[]; U=0;
  const W=1360;
  c.push(V('t','Figure 1.1 — Suraksha: Four-Layer Sociotechnical System (as built)',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  // stakeholders (left)
  const st=[['Citizen','stk_cit'],['Volunteer /\nField Responder','stk_vol'],['DMC Officer','stk_off'],['Administrator','stk_adm'],['Hospital Staff','stk_hos'],['Local Verifier','stk_ver']];
  st.forEach((s,i)=>c.push(V(s[1],s[0],40,70+i*95,44,70,S.actor)));
  // Layer bands
  c.push(V('L1','PRESENTATION LAYER (User Interface Tier)',180,60,900,150,S.band));
  c.push(V('l1a','Mobile App — Expo / React Native<br><font style="font-size:9px">citizen &amp; volunteer field client · offline-first (SQLite queue + FIFO sync + background task) · voice/photo/GPS capture · i18n Si/Ta/En</font>',200,95,430,95,S.web));
  c.push(V('l1b','Web Dashboard — React 19 + Vite<br><font style="font-size:9px">DMC command centre · RBAC routing · Leaflet map · charts · alert / incident / camp / resource management · Socket.IO live feed</font>',650,95,410,95,S.web));
  c.push(V('L2','APPLICATION LAYER (Coordination Tier)',180,230,900,140,S.band));
  c.push(V('l2a','Backend API — Node.js + Express + TypeScript (single service, :3001)<br><font style="font-size:9px">31 route groups → controllers → ~45 services · JWT auth + RBAC middleware · Socket.IO server · node-cron jobs (water, rainfall, backup, escalation) · multi-channel dispatch · geocoding + district-zone lookup</font>',200,265,860,90,S.app));
  c.push(V('L3','DATA LAYER',180,390,435,150,S.band));
  c.push(V('l3a','PostgreSQL 17<br><font style="font-size:9px">72 tables · 24 enums<br>Prisma ORM · daily pg_dump backup</font>',215,430,360,95,S.data));
  c.push(V('L4','INTELLIGENCE LAYER',645,390,435,150,S.band));
  c.push(V('l4a','ML Microservice — Python FastAPI (:8000)<br><font style="font-size:9px">22 endpoints · 16 AI components<br>5 trained models: severity XGBoost · LSTM river · spaCy NER · credibility XGBoost · spatiotemporal GB<br>+ analytical / rule-based components</font>',665,428,395,100,S.ml));
  // external strip
  c.push(V('L5','EXTERNAL SERVICES',180,560,900,90,S.band));
  ['Twilio SMS','Nodemailer e-mail','Expo Push','Telegram Bot','Open-Meteo rainfall','Nominatim geocoding','Google OAuth'].forEach((e,i)=>
    c.push(V(nid('ex'),e,200+i*126,595,116,44,S.ext)));
  // concerns note (right)
  c.push(V('cn','Key concerns driving the design:<br>• network fails exactly when a citizen needs to report<br>• DMC officers must read Si / Ta / En under time pressure<br>• every AI output requires human validation before action<br>• downstream districts need 1–2 h flood lead time',1100,70,240,220,S.note));
  // arrows
  c.push(E(nid('e'),'stk_cit','l1a','report / SOS / alerts',EDGE.assoc));
  c.push(E(nid('e'),'stk_vol','l1a','tasks / check-in',EDGE.assoc));
  c.push(E(nid('e'),'stk_off','l1b','triage / dispatch',EDGE.assoc));
  c.push(E(nid('e'),'stk_adm','l1b','users / RBAC',EDGE.assoc));
  c.push(E(nid('e'),'stk_hos','l1b','referrals / beds',EDGE.assoc));
  c.push(E(nid('e'),'stk_ver','l1b','verify in jurisdiction',EDGE.assoc));
  c.push(E(nid('e'),'l1a','l2a','REST (JWT, via ngrok) + Socket.IO',EDGE.flow));
  c.push(E(nid('e'),'l1b','l2a','REST (JWT) + Socket.IO',EDGE.flow));
  c.push(E(nid('e'),'l2a','l3a','Prisma ORM',EDGE.flow));
  c.push(E(nid('e'),'l2a','l4a','HTTP (JSON) — best-effort, non-blocking',EDGE.flow));
  c.push(E(nid('e'),'l2a','L5','push / SMS / e-mail / Telegram',EDGE.flow));
  c.push(E(nid('e'),'l4a','L5','Open-Meteo pull',EDGE.flow));
  save('Figure_1.1_Rich_Picture_Four_Layer_Sociotechnical_System.drawio','Fig 1.1 Rich Picture','fig11',c,W,700);
})();

/* ============================================================
   Figure 2.1 — Conceptual Map of the Literature
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1300,H=860;
  c.push(V('t','Figure 2.1 — Conceptual Map of the Literature',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  // axes
  c.push(EP('ax','120',430,1180,430,'',  'endArrow=classic;html=1;fontSize=10;strokeColor=#999999;'));
  c.push(EP('ay','650',780,650,70,'',    'endArrow=classic;html=1;fontSize=10;strokeColor=#999999;'));
  c.push(V('axl','Theoretical frameworks  →  Applied technical frameworks',120,438,1000,20,'text;html=1;fontSize=10;fontStyle=2;align=left;'));
  c.push(V('ayl','Sri Lankan operational context  ↑  Global context',300,60,700,20,'text;html=1;fontSize=10;fontStyle=2;align=center;'));
  // centre
  c.push(V('ctr','AI-enabled multi-stakeholder<br>disaster coordination<br><b>(Suraksha\'s contribution)</b>',520,380,260,100,'ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;'));
  const cl=[
    ['Disaster-risk theory &amp; DRR frameworks<br><font style="font-size:9px">Sendai Framework · NDMP 2023–2030 · Pressure-and-Release (PAR) · GIS vulnerability mapping</font>','th1',150,110],
    ['Sociotechnical &amp; DSR design<br><font style="font-size:9px">sociotechnical systems theory · Design Science Research · design-actuality gap</font>','th2',150,300],
    ['Crowdsourced disaster systems<br><font style="font-size:9px">Ushahidi (gov-integrated 3.4× impact) · ResQConnect (RAG, English-only) · DMC digital practice survey</font>','ap1',900,110],
    ['ML for disaster response<br><font style="font-size:9px">CNN/LSTM F1&gt;0.80 crisis tweets · RF/XGBoost top for structured DMC records · crowd-AI hybrids · XAI +20–35% trust</font>','ap2',900,290],
    ['NLP in crisis contexts<br><font style="font-size:9px">CrisisNLP / CrisisBench · RoBERTa macro-F1 0.79 · XLM-R low-resource · CRF location extraction</font>','ap3',900,470],
    ['Offline-first for developing regions<br><font style="font-size:9px">94% vs 31% task completion offline · active learning −35–50% noise · dashboards −28% decision latency</font>','ap4',520,650],
  ];
  cl.forEach(x=>c.push(V(x[1],x[0],x[2],x[3],260,110,S.web)));
  cl.forEach(x=>c.push(E(nid('e'),x[1],'ctr','',EDGE.assoc)));
  // gaps
  c.push(V('gaps','Research gaps that motivate Suraksha:<br>G1 no integrated multi-stakeholder architecture (SL)<br>G2 ML used post-event, not live uncertainty-aware triage<br>G3 no unified Sinhala–Tamil–English crisis NLP<br>G4 tools assume stable connectivity<br>G5 crowdsourcing not DMC-aligned',150,610,330,140,S.note));
  save('Figure_2.1_Conceptual_Map_of_Literature.drawio','Fig 2.1 Conceptual Map','fig21',c,W,H);
})();

/* ============================================================
   Figure 2.2 — Workflow Analysis: Data Flow Across System Layers
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1500,H=560;
  c.push(V('t','Figure 2.2 — Workflow Analysis: Data Flow Across the System Layers',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  const row=(y,label)=>c.push(V(nid('bl'),label,40,y,W-80,1,'text;html=1;'));
  const lane=(x,y,w,h,txt,st)=>{const id=nid('n');c.push(V(id,txt,x,y,w,h,st));return id;};
  // horizontal pipeline
  const y=110;
  const a=lane(60,y,150,90,'Citizen report<br><font style="font-size:9px">Si / Ta / En · text + photo + GPS</font>',S.web);
  const b=lane(240,y,160,90,'Mobile app<br><font style="font-size:9px">validate · offline queue on failure (SQLite FIFO)</font>',S.web);
  const d=lane(430,y,170,90,'Backend API<br><font style="font-size:9px">JWT auth · geocode · district zone · INSERT IncidentReport</font>',S.app);
  const e=lane(630,y,180,90,'ML microservice<br><font style="font-size:9px">detect language → translate → spaCy NER → feature vector → XGBoost severity + confidence</font>',S.ml);
  const f=lane(840,y,150,90,'PostgreSQL<br><font style="font-size:9px">write-back severity, entities, language; MLLog; duplicate links</font>',S.data);
  const g=lane(1020,y,160,90,'DMC dashboard<br><font style="font-size:9px">live queue (Socket.IO) · map · low-confidence flagged for review</font>',S.web);
  const h=lane(1210,y,150,90,'DMC officer<br><font style="font-size:9px">verify · set severity · assign task · author alert</font>',S.app);
  c.push(E(nid('e'),a,b,'submit',EDGE.flow));
  c.push(E(nid('e'),b,d,'POST /api/incidents (8 s timeout)',EDGE.flow));
  c.push(E(nid('e'),d,e,'POST /process-report',EDGE.flow));
  c.push(E(nid('e'),e,d,'{severity, confidence, entities, language}','endArrow=open;dashed=1;html=1;fontSize=10;'));
  c.push(E(nid('e'),d,f,'persist',EDGE.flow));
  c.push(E(nid('e'),f,g,'push new-incident',EDGE.flow));
  c.push(E(nid('e'),g,h,'',EDGE.assoc));
  // downstream: alert dispatch back to citizens
  const y2=320;
  const i=lane(430,y2,170,80,'Alert generator<br><font style="font-size:9px">translate Si/Ta · INSERT Alert · target districts</font>',S.app);
  const j=lane(630,y2,180,80,'Multi-channel dispatch<br><font style="font-size:9px">in-app · Expo push · Twilio SMS · e-mail · Telegram</font>',S.ext);
  const k=lane(840,y2,150,80,'Citizens (filtered)<br><font style="font-size:9px">receive only if isAlertNearby() or "All Island"</font>',S.web);
  c.push(E(nid('e'),h,i,'author / confirm alert',EDGE.flow));
  c.push(E(nid('e'),i,j,'fan out',EDGE.flow));
  c.push(E(nid('e'),j,k,'deliver',EDGE.flow));
  // scheduler branch
  const sc=lane(60,y2,150,80,'System scheduler<br><font style="font-size:9px">hourly cron: river + rainfall ingest → LSTM forecast</font>',S.app);
  c.push(E(nid('e'),sc,i,'threshold breach forecast (conf ≥ 0.75)',EDGE.flow));
  c.push(V('nn','Every input language converges to normalised English + structured entities before any human sees it — this removes the "read three languages under pressure" burden (addresses gaps G2 &amp; G3).',60,440,900,60,S.note));
  save('Figure_2.2_Workflow_Data_Flow_Across_System_Layers.drawio','Fig 2.2 Data Flow','fig22',c,W,H);
})();

/* ============================================================
   Figure 4.1 — Use-Case Diagram: Main System Overview
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1400,H=1000;
  c.push(V('t','Figure 4.1 — Use-Case Diagram: Main System Overview',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  c.push(V('bnd','Suraksha Platform',300,60,780,880,'rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fontStyle=1;fontSize=13;fillColor=none;strokeColor=#000000;'));
  const left=[['Citizen','a_cit'],['Volunteer','a_vol'],['Field Responder','a_fr'],['Local Verifier','a_lv'],['DMC Officer','a_off'],['Administrator','a_adm'],['Hospital Staff','a_hos']];
  left.forEach((a,i)=>c.push(V(a[1],a[0],40,90+i*115,44,70,S.actor)));
  const right=[['System Scheduler','a_sch'],['ML Service','a_ml'],['External Services','a_ext']];
  right.forEach((a,i)=>c.push(V(a[1],a[0],1300,140+i*180,44,70,S.actor)));
  // generalisations
  c.push(E(nid('e'),'a_vol','a_cit','',EDGE.gen));
  c.push(E(nid('e'),'a_fr','a_vol','',EDGE.gen));
  c.push(E(nid('e'),'a_lv','a_cit','',EDGE.gen));
  c.push(E(nid('e'),'a_adm','a_off','',EDGE.gen));
  const uc=[
    ['Report incident / trigger SOS','u1',['a_cit']],
    ['Receive &amp; acknowledge alerts','u2',['a_cit']],
    ['Request help (rescue)','u3',['a_cit']],
    ['Manage family safety &amp; check-ins','u4',['a_cit']],
    ['Report / track missing person','u5',['a_cit']],
    ['Claim relief token (offline-capable)','u6',['a_cit']],
    ['Manage volunteer profile, tasks &amp; check-ins','u7',['a_vol']],
    ['Verify incident in jurisdiction','u8',['a_lv']],
    ['Triage, verify &amp; update incidents','u9',['a_off']],
    ['Author &amp; manage alerts','u10',['a_off']],
    ['Manage relief camps, resources &amp; tokens','u11',['a_off']],
    ['Coordinate rescue vehicles &amp; missions','u12',['a_off']],
    ['Review damage assessments &amp; compensation','u13',['a_off']],
    ['Manage hospital beds &amp; referrals','u14',['a_hos']],
    ['Manage users, roles, RBAC &amp; system','u15',['a_adm']],
    ['View analytics &amp; operational intelligence','u16',['a_off']],
    ['Enrich incidents, forecast &amp; score (AI)','u17',['a_ml']],
    ['Run hourly ingest / forecast / alert pipeline','u18',['a_sch']],
    ['Dispatch alerts &amp; notifications (multi-channel)','u19',['a_ext']],
  ];
  uc.forEach((item,i)=>{
    const col=i%2, row=Math.floor(i/2);
    c.push(V('uc_'+item[1], item[0], (col?720:360), 100+row*88, 300, 56, 'ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;'));
  });
  uc.forEach(x=> x[2].forEach(a=> c.push(E(nid('e'),a,'uc_'+x[1],'',EDGE.assoc))));
  // a few cross links
  c.push(E(nid('e'),'a_off','uc_u9','',EDGE.assoc));
  c.push(E(nid('e'),'a_ml','uc_u17','',EDGE.assoc));
  c.push(E(nid('e'),'uc_u9','uc_u17',GL+'include'+GR,EDGE.incl));
  c.push(E(nid('e'),'uc_u1','uc_u17',GL+'include'+GR,EDGE.incl));
  c.push(E(nid('e'),'uc_u10','uc_u19',GL+'include'+GR,EDGE.incl));
  c.push(E(nid('e'),'uc_u18','uc_u19',GL+'include'+GR,EDGE.incl));
  c.push(V('note','Module-level use-case diagrams (Fig 4.3–4.5, Appendix B.1–B.5) decompose this overview per subsystem.',360,900,700,30,S.note));
  save('Figure_4.1_UseCase_Main_System_Overview.drawio','Fig 4.1 Use Case Overview','fig41',c,W,H);
})();

/* ============================================================
   Figure 4.13 — System Architecture (Four-Layer)
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1360,H=940;
  const L=210;                       // left edge of the layer bands
  c.push(V('t','Figure 4.1 — System Architecture: Four-Layer Service-Oriented Architecture with External Integrations',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  // actors (left margin)
  c.push(V('u_web','DMC Officer ·<br>Administrator ·<br>Hospital Staff',30,110,150,60,'text;html=1;fontSize=10;align=right;fontStyle=2;'));
  c.push(V('u_mob','Citizen ·<br>Volunteer ·<br>Field Responder',30,175,150,60,'text;html=1;fontSize=10;align=right;fontStyle=2;'));
  // PRESENTATION
  c.push(V('b1','PRESENTATION LAYER',L,60,1090,160,S.band));
  c.push(V('web','Web Dashboard — React 19 + Vite + Tailwind<br><font style="font-size:9px">DMC officers, administrators, hospital staff · Zustand · TanStack Query · React Router 7 · React Leaflet · i18next · Socket.IO client</font>',L+30,100,505,100,S.web));
  c.push(V('mob','Mobile App — Expo + React Native (offline-first)<br><font style="font-size:9px">citizens, volunteers, responders · local SQLite queue + FIFO background sync · expo-location/camera/notifications · AsyncStorage</font>',L+560,100,500,100,S.web));
  // APPLICATION
  c.push(V('b2','APPLICATION LAYER',L,250,1090,150,S.band));
  c.push(V('api','Backend API — Node.js + Express + TypeScript (single service, :3001)<br><font style="font-size:9px">user authentication + role-based access control · orchestrates ML-service API calls · scheduled jobs (hourly water &amp; rainfall ingestion, daily backup, escalation) · multi-channel alert dispatch · @turf district-zone lookup · Socket.IO server</font>',L+30,285,1030,95,S.app));
  // DATA + INTELLIGENCE
  c.push(V('b3','DATA LAYER',L,430,520,160,S.band));
  c.push(V('pg','PostgreSQL — single shared database<br><font style="font-size:9px">72 tables · 24 enums · UUID PKs · accessed via Prisma ORM · daily pg_dump backup</font>',L+30,470,460,100,S.data));
  c.push(V('b4','INTELLIGENCE LAYER',L+560,430,530,160,S.band));
  c.push(V('mlv','ML Microservice — Python FastAPI<br><font style="font-size:9px">22 API endpoints · 16 ML/AI components · 5 genuinely trained (severity XGBoost, LSTM river, spaCy NER, credibility XGBoost, spatiotemporal GB) · rest analytical / rule-based / pre-trained</font>',L+590,470,470,100,S.ml));
  // EXTERNAL
  c.push(V('b5','EXTERNAL INTEGRATIONS',L,620,1090,95,S.band));
  ['Twilio<br>(SMS)','Nodemailer<br>(e-mail)','Expo<br>(push)','Telegram<br>Bot','Open-Meteo<br>(rainfall)','Nominatim<br>(geocoding)','Google<br>OAuth'].forEach((e,i)=>c.push(V(nid('x'),e,L+30+i*150,655,140,48,S.ext)));
  // edges
  c.push(E(nid('e'),'u_web','web','',EDGE.assoc));
  c.push(E(nid('e'),'u_mob','mob','',EDGE.assoc));
  c.push(E(nid('e'),'web','api','REST (JWT) + Socket.IO',EDGE.flow));
  c.push(E(nid('e'),'mob','api','REST (JWT, via ngrok) + Socket.IO',EDGE.flow));
  c.push(E(nid('e'),'api','pg','Prisma ORM',EDGE.flow));
  c.push(E(nid('e'),'api','mlv','HTTP (JSON)',EDGE.flow));
  c.push(E(nid('e'),'api','b5','best-effort fan-out',EDGE.flow));
  c.push(E(nid('e'),'mlv','b5','Open-Meteo pull',EDGE.flow));
  c.push(V('deg','Graceful degradation: if the ML service is unavailable, AI-only endpoints return an explicit error (HTTP 503) rather than hanging, and GET /api/water/predictions keeps serving the most recently cached WaterLevelPrediction row — the command dashboard never goes dark.',210,745,1090,60,S.note));
  c.push(V('dep','Evaluated topology: all four tiers on one workstation (PostgreSQL :5432, backend :3001, web dev :5173, ML :8000); mobile reaches the backend + Socket.IO via two static ngrok tunnels. Production (future work): backend + ML behind a reverse proxy, managed PostgreSQL, web as CDN static assets.',210,815,1090,60,S.note));
  save('Figure_4.1_System_Architecture_Diagram.drawio','Fig 4.1 Architecture','fig41arch',c.slice(),W,H);
  // also keep the Interim-numbered copy
  const c2 = c.map(x=>x.replace('Figure 4.1 —','Figure 4.13 —'));
  save('Figure_4.13_System_Architecture_Four_Layer.drawio','Fig 4.13 Architecture','fig413',c2,W,H);
})();

/* ============================================================
   Figure 5.3 — Framework Workflow Block Diagram (end-to-end)
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1500,H=620;
  c.push(V('t','Figure 5.3 — Block Diagram of the Framework Workflow: End-to-End Data Flow',40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  const b=(x,y,w,txt,st)=>{const id=nid('n');c.push(V(id,txt,x,y,w,70,st||S.plain));return id;};
  const y1=90;
  const n1=b(60,y1,150,'Citizen submits report<br><font style="font-size:9px">Si/Ta/En + photo + GPS</font>',S.web);
  const n2=b(240,y1,150,'useOfflineSubmit hook<br><font style="font-size:9px">Promise.race vs 8 s timeout</font>',S.web);
  const n3=b(240,y1+120,150,'SQLite sync_queue<br><font style="font-size:9px">queue on 5xx / timeout / offline; FIFO; retry ≤ 5</font>',S.data);
  const n4=b(430,y1,170,'Backend /api/incidents<br><font style="font-size:9px">requireFields · geocode (Nominatim) · findZoneForCoordinates (turf)</font>',S.app);
  const n5=b(640,y1,150,'INSERT IncidentReport<br><font style="font-size:9px">severity = MEDIUM default</font>',S.data);
  const n6=b(830,y1,190,'ML /process-report<br><font style="font-size:9px">detect_language → translate → spaCy NER → build_feature_vector → XGBoost predict_proba → temperature scale</font>',S.ml);
  const n7=b(830,y1+130,190,'Duplicate detection<br><font style="font-size:9px">weighted score (loc 40 + cat 30 + time 20 + NLP 10) ≥ 50 → link</font>',S.app);
  const n8=b(1060,y1,150,'UPDATE IncidentReport<br><font style="font-size:9px">severity, confidence, entities, language; write MLLog</font>',S.data);
  const n9=b(1250,y1,180,'Uncertainty routing<br><font style="font-size:9px">conf ≥ ~0.73 → auto-accept; else → human-review queue + notify officers</font>',S.ml);
  const y2=360;
  const n10=b(1250,y2,180,'DMC officer review<br><font style="font-size:9px">confirm / correct severity → active-learning pool</font>',S.app);
  const n11=b(1030,y2,170,'Officer authors / confirms alert<br><font style="font-size:9px">INSERT Alert · translate Si/Ta · target downstream districts</font>',S.app);
  const n12=b(800,y2,170,'Multi-channel dispatch<br><font style="font-size:9px">Notification rows · Expo push · Twilio SMS · Nodemailer · Telegram · Socket.IO new-alert</font>',S.ext);
  const n13=b(590,y2,150,'Citizen device<br><font style="font-size:9px">isAlertNearby() filter → local notification</font>',S.web);
  const y3=360;
  const s1=b(60,y3,150,'System scheduler<br><font style="font-size:9px">cron 0 * * * *</font>',S.app);
  const s2=b(240,y3,160,'Ingest river + rainfall<br><font style="font-size:9px">RiverWaterLevel · Open-Meteo</font>',S.data);
  const s3=b(430,y3,170,'LSTM /predict-water-level<br><font style="font-size:9px">per gauge T+1h/T+2h + confidence + alert_level; UPSERT WaterLevelPrediction (cache)</font>',S.ml);
  c.push(E(nid('e'),n1,n2,'',EDGE.flow));
  c.push(E(nid('e'),n2,n4,'online: POST',EDGE.flow));
  c.push(E(nid('e'),n2,n3,'offline / fail: enqueue',EDGE.flow));
  c.push(E(nid('e'),n3,n4,'later: FIFO drain (X-Offline-Sync)',EDGE.flow));
  c.push(E(nid('e'),n4,n5,'',EDGE.flow));
  c.push(E(nid('e'),n5,n6,'async',EDGE.flow));
  c.push(E(nid('e'),n5,n7,'async',EDGE.flow));
  c.push(E(nid('e'),n6,n8,'',EDGE.flow));
  c.push(E(nid('e'),n8,n9,'',EDGE.flow));
  c.push(E(nid('e'),n9,n10,'low confidence',EDGE.flow));
  c.push(E(nid('e'),n10,n11,'',EDGE.flow));
  c.push(E(nid('e'),n11,n12,'',EDGE.flow));
  c.push(E(nid('e'),n12,n13,'',EDGE.flow));
  c.push(E(nid('e'),s1,s2,'',EDGE.flow));
  c.push(E(nid('e'),s2,s3,'',EDGE.flow));
  c.push(E(nid('e'),s3,n11,'confidence ≥ 0.75 &amp; threat ≤ 2 h → auto alert',EDGE.flow));
  save('Figure_5.3_Framework_Workflow_Block_Diagram.drawio','Fig 5.3 Framework Workflow','fig53',c,W,H);
})();

/* ============================================================
   Generic vertical flowchart builder
   ============================================================ */
function flowchart(fname,title,id, spine, branches){
  // spine: [{id,kind,text}]  kind: term|proc|dec|io|sub
  // branches: [{from, to, label, side:'right'|'left', bendX}]  OR extra nodes given as spine with x override {x,y}
  const c=[]; U=0;
  const W = 900, colX = 300, nodeW=280, decW=280, decH=90, gap=52, h=54;
  c.push(V('t',title,40,10,W-80,26,'text;html=1;fontStyle=1;fontSize=13;align=left;'));
  let y=60; const pos={};
  spine.forEach(s=>{
    const isDec = s.kind==='dec';
    const w = isDec?decW:nodeW, hh = isDec?decH:h;
    const st = s.kind==='term'?S.term : s.kind==='dec'?S.dec : s.kind==='io'?S.io : s.kind==='sub'?S.sub : S.proc;
    const x = s.x!=null? s.x : colX;
    c.push(V(s.id, esc(s.text), x, s.y!=null?s.y:y, w, hh, st));
    pos[s.id]={x, y:(s.y!=null?s.y:y), w, h:hh};
    if(s.y==null) y += hh + gap;
  });
  // sequential spine edges (skip where explicit branch overrides)
  const explicit = new Set((branches||[]).filter(b=>b.replace).map(b=>b.from+'>'+b.to));
  for(let i=0;i<spine.length-1;i++){
    const a=spine[i], b=spine[i+1];
    if(a.x!=null || b.x!=null) continue;
    if(explicit.has(a.id+'>'+b.id)) continue;
    if(a.noNext) continue;
    c.push(E(nid('e'),a.id,b.id,'',EDGE.flow));
  }
  (branches||[]).forEach(b=>{
    const st = b.style || EDGE.flow;
    c.push(E(nid('e'), b.from, b.to, b.label||'', st));
  });
  save(fname, title.split('—')[0].trim().slice(0,40), id, c, W, y+40);
}

/* ---- Figure 5.1 NLP Pipeline ---- */
flowchart('Figure_5.1_NLP_Pipeline_Flowchart.drawio',
  'Figure 5.1 — NLP Pipeline: Trilingual Intake Processing (/process-report)','fig51',
  [
    {id:'s',kind:'term',text:'START — raw citizen report text'},
    {id:'ld',kind:'proc',text:'detect_language()  — Unicode-script check → Sinhala/Tamil/English word-list → langdetect / langid cascade'},
    {id:'q1',kind:'dec',text:'language == English ?'},
    {id:'tr',kind:'proc',text:'translate_to_english()  — library NMT (Si/Ta → En)', x:620, y:250},
    {id:'ner',kind:'proc',text:'extract_entities()  — spaCy neural NER (trained v2.2) + regex/gazetteer fallback → {LOC, INCIDENT, COUNT, DATE, DAMAGE}'},
    {id:'fv',kind:'proc',text:'build_feature_vector()  — affected population, hazard type, has_children / has_elderly / has_disabled, … (12-dim)'},
    {id:'xgb',kind:'proc',text:'XGBoost.predict_proba()  → 4-class severity probabilities'},
    {id:'ts',kind:'proc',text:'temperature-scale probabilities → severity = argmax, confidence = max(p)'},
    {id:'o',kind:'io',text:'RETURN { severity, confidence, detected_language, translated_text, entities }'},
    {id:'e',kind:'term',text:'END — downstream works on normalised English + structured entities'},
  ],
  [
    {from:'q1',to:'ner',label:'yes',replace:true},
    {from:'q1',to:'tr',label:'no'},
    {from:'tr',to:'ner',label:''},
  ]);

/* ---- Figure 5.2 ML Classification + Uncertainty ---- */
flowchart('Figure_5.2_ML_Classification_and_Uncertainty_Flowchart.drawio',
  'Figure 5.2 — Severity Classification with Uncertainty-Aware Human-in-the-Loop Routing (ALG-3)','fig52',
  [
    {id:'s',kind:'term',text:'START — new incident inserted (severity = MEDIUM default)'},
    {id:'bf',kind:'proc',text:'Backend: build feature vector; POST ML /analyze-report'},
    {id:'q0',kind:'dec',text:'ML service reachable ?'},
    {id:'un',kind:'proc',text:'keep MEDIUM; needsManualTriage = true; MLLog(prediction = UNAVAILABLE)', x:600, y:210},
    {id:'pp',kind:'proc',text:'XGBoost predict_proba → temperature scaling (T tuned on calibration set)'},
    {id:'ar',kind:'proc',text:'severity = argmax(p); confidence = max(p)  (opt: SPE spread, conformal set)'},
    {id:'wb',kind:'proc',text:'UPDATE IncidentReport (severity, mlConfidence, nlpEntities); INSERT MLLog'},
    {id:'q1',kind:'dec',text:'confidence ≥ routing threshold (≈ 0.73) ?'},
    {id:'auto',kind:'proc',text:'auto-accept — incident enters normal officer queue', x:600, y:560},
    {id:'hr',kind:'proc',text:'flag awaitingReview = true; add to human-review queue; notify officers'},
    {id:'rev',kind:'proc',text:'DMC officer opens incident — reviews description + entities + map'},
    {id:'q2',kind:'dec',text:'officer agrees with ML severity ?'},
    {id:'corr',kind:'proc',text:'officer sets correct severity; add case to active-learning re-annotation pool', x:600, y:900},
    {id:'fin',kind:'proc',text:'UPDATE IncidentReport (final severity); INSERT IncidentHistory'},
    {id:'e',kind:'term',text:'END'},
  ],
  [
    {from:'q0',to:'pp',label:'yes',replace:true},
    {from:'q0',to:'un',label:'no'},
    {from:'un',to:'e',label:'',style:EDGE.flow},
    {from:'q1',to:'hr',label:'no',replace:true},
    {from:'q1',to:'auto',label:'yes'},
    {from:'auto',to:'e',label:''},
    {from:'q2',to:'fin',label:'yes',replace:true},
    {from:'q2',to:'corr',label:'no'},
    {from:'corr',to:'fin',label:''},
  ]);

/* ---- ALG-1 Prediction cache ---- */
flowchart('Flowchart_ALG-1_Prediction_Cache.drawio',
  'Flowchart ALG-1 — River-Forecast Prediction Cache &amp; Serve (GET /api/water/predictions)','algc1',
  [
    {id:'s',kind:'term',text:'START — GET /api/water/predictions'},
    {id:'q1',kind:'dec',text:'60 s response cache fresh ?'},
    {id:'rc',kind:'proc',text:'return cached body', x:600, y:120},
    {id:'q2',kind:'dec',text:'a build already in flight ?'},
    {id:'aw',kind:'proc',text:'await the in-flight promise → return', x:600, y:290},
    {id:'qg',kind:'proc',text:'query distinct gauges (≤ 50) + WaterLevelPrediction rows (2 DB queries, no ML calls)'},
    {id:'loop',kind:'proc',text:'for each gauge: cache row missing? → add to "compute inline"; stale (&gt; 90 min)? → add to "refresh async"'},
    {id:'ci',kind:'proc',text:'Promise.allSettled(missing → computeAndSave)  (bounded inline ML compute)'},
    {id:'bg',kind:'proc',text:'if stale set non-empty → void refreshPredictions(stale)  (single-flight lock, no alert dispatch)'},
    {id:'set',kind:'proc',text:'set 60 s response cache = results'},
    {id:'o',kind:'io',text:'return results array (one object per gauge + predictionStale flag)'},
    {id:'e',kind:'term',text:'END'},
  ],
  [
    {from:'q1',to:'q2',label:'no',replace:true},
    {from:'q1',to:'rc',label:'yes'},
    {from:'rc',to:'e',label:''},
    {from:'q2',to:'qg',label:'no',replace:true},
    {from:'q2',to:'aw',label:'yes'},
    {from:'aw',to:'e',label:''},
  ]);

/* ---- ALG-2 LSTM water forecast ---- */
flowchart('Flowchart_ALG-2_LSTM_Water_Forecast.drawio',
  'Flowchart ALG-2 — LSTM River-Level Forecast (per gauge)','algc2',
  [
    {id:'s',kind:'term',text:'START — gaugeId, thresholds {watch, warning, critical}, last ≤ 12 readings'},
    {id:'q1',kind:'dec',text:'readings ≥ 3 ?'},
    {id:'ret',kind:'proc',text:'return null (not forecastable)', x:600, y:120},
    {id:'bf',kind:'proc',text:'build feature matrix; add rate_of_change = level[i] − level[i−1]'},
    {id:'sc',kind:'proc',text:'pad / truncate to SEQUENCE_LENGTH = 12; MinMax-scale with fitted scaler'},
    {id:'q2',kind:'dec',text:'LSTM model file loaded ?'},
    {id:'rb',kind:'proc',text:'rule-based linear extrapolation → t1, t2, confidence (documented fallback)', x:600, y:430},
    {id:'pr',kind:'proc',text:'model.predict(seq) → y1, y2 (normalised); inverse-scale to metres; confidence = 1 − min(uncertainty, 0.25)/0.25'},
    {id:'cl',kind:'proc',text:'alert_level = classify(max(t1, t2) vs thresholds) → NONE / WATCH / WARNING / CRITICAL'},
    {id:'o',kind:'io',text:'return { predicted_t1_m, predicted_t2_m, confidence, alert_level, reason }'},
    {id:'e',kind:'term',text:'END  (orchestrator alerts only if confidence ≥ 0.75 AND alert_level ≠ NONE AND not de-duped 30 min)'},
  ],
  [
    {from:'q1',to:'bf',label:'yes',replace:true},
    {from:'q1',to:'ret',label:'no'},
    {from:'ret',to:'e',label:''},
    {from:'q2',to:'pr',label:'yes',replace:true},
    {from:'q2',to:'rb',label:'no'},
    {from:'rb',to:'cl',label:''},
  ]);

/* ---- ALG-4 duplicate detection ---- */
flowchart('Flowchart_ALG-4_Duplicate_Detection.drawio',
  'Flowchart ALG-4 — Incident Duplicate Detection (weighted additive scoring)','algc4',
  [
    {id:'s',kind:'term',text:'START — new incident created'},
    {id:'fc',kind:'proc',text:'fetch candidates: same category, &lt; 6 h old, not RESOLVED'},
    {id:'lp',kind:'proc',text:'for each candidate: score = 0'},
    {id:'q1',kind:'dec',text:'both have coordinates AND distance ≤ 1000 m ?'},
    {id:'loc',kind:'proc',text:'score += 40 × (1 − d/1000)   [LOCATION]', x:600, y:250},
    {id:'cat',kind:'proc',text:'score += 30   [CATEGORY — always, candidates already filtered]'},
    {id:'q2',kind:'dec',text:'|Δt| ≤ 6 h ?'},
    {id:'tim',kind:'proc',text:'score += 20 × (1 − Δt/6h)   [TIME]', x:600, y:470},
    {id:'q3',kind:'dec',text:'NLP entity-text overlap &gt; 0 ?'},
    {id:'nlp',kind:'proc',text:'score += 10 × overlap   [NLP]', x:600, y:620},
    {id:'q4',kind:'dec',text:'score ≥ 50 ?'},
    {id:'mk',kind:'proc',text:'create IncidentDuplicateLink (older = canonical, PENDING); officer confirms / dismisses', x:600, y:770},
    {id:'nx',kind:'proc',text:'next candidate'},
    {id:'e',kind:'term',text:'END  (fire-and-forget — never blocks the create response)'},
  ],
  [
    {from:'q1',to:'cat',label:'no',replace:true},
    {from:'q1',to:'loc',label:'yes'},
    {from:'loc',to:'cat',label:''},
    {from:'q2',to:'q3',label:'no',replace:true},
    {from:'q2',to:'tim',label:'yes'},
    {from:'tim',to:'q3',label:''},
    {from:'q3',to:'q4',label:'no',replace:true},
    {from:'q3',to:'nlp',label:'yes'},
    {from:'nlp',to:'q4',label:''},
    {from:'q4',to:'nx',label:'no',replace:true},
    {from:'q4',to:'mk',label:'yes'},
    {from:'mk',to:'nx',label:''},
  ]);

/* ---- ALG-5 geo-targeted alert relevance ---- */
flowchart('Flowchart_ALG-5_Geo_Targeted_Alert_Relevance.drawio',
  'Flowchart ALG-5 — Geo-Targeted Alert Relevance (isAlertNearby)','algc5',
  [
    {id:'s',kind:'term',text:'START — alert {latitudes[], longitudes[], locations[], broadcastRadiusKm?}, user (lat, lng)'},
    {id:'q1',kind:'dec',text:'alert.locations includes "All Island" ?'},
    {id:'t1',kind:'proc',text:'return true (show to everyone)', x:600, y:120},
    {id:'q2',kind:'dec',text:'alert has ≥ 1 coordinate ?'},
    {id:'f1',kind:'proc',text:'return false (untargeted — do not spam)', x:600, y:290},
    {id:'r',kind:'proc',text:'radius = broadcastRadiusKm ?? 10 km'},
    {id:'lp',kind:'proc',text:'for each alert coordinate i: compute haversineKm(user, coord[i])'},
    {id:'q3',kind:'dec',text:'any haversineKm ≤ radius ?'},
    {id:'t2',kind:'proc',text:'return true (relevant)', x:600, y:560},
    {id:'f2',kind:'proc',text:'return false (out of range)'},
    {id:'e',kind:'term',text:'END'},
  ],
  [
    {from:'q1',to:'q2',label:'no',replace:true},
    {from:'q1',to:'t1',label:'yes'},
    {from:'t1',to:'e',label:''},
    {from:'q2',to:'r',label:'yes',replace:true},
    {from:'q2',to:'f1',label:'no'},
    {from:'f1',to:'e',label:''},
    {from:'q3',to:'f2',label:'no',replace:true},
    {from:'q3',to:'t2',label:'yes'},
    {from:'t2',to:'e',label:''},
  ]);

/* ---- ALG-6 offline sync drain ---- */
flowchart('Flowchart_ALG-6_Offline_Sync_Queue_Drain.drawio',
  'Flowchart ALG-6 — Offline Sync Queue Drain (FIFO with bounded retry)','algc6',
  [
    {id:'s',kind:'term',text:'START / trigger — connectivity restored · 8 s poll · app foreground · background task'},
    {id:'q1',kind:'dec',text:'online AND not already syncing ?'},
    {id:'end0',kind:'proc',text:'return (skip)', x:600, y:120},
    {id:'sel',kind:'proc',text:"SELECT * FROM sync_queue WHERE status='pending' AND attempts &lt; max ORDER BY created_at ASC  (FIFO)"},
    {id:'lp',kind:'proc',text:'for each item: POST to SYNC_HANDLERS[type].endpoint  {X-Offline-Sync, X-Original-Timestamp}'},
    {id:'q2',kind:'dec',text:'response 2xx ?'},
    {id:'ms',kind:'proc',text:"markSynced(id)  (status='synced')", x:600, y:400},
    {id:'q3',kind:'dec',text:'response 4xx ?'},
    {id:'mf',kind:'proc',text:"markFailed(id)  — permanent (bad data, never retry)", x:600, y:560},
    {id:'rt',kind:'proc',text:"attempts++; status = attempts ≥ 5 ? 'failed' : 'pending'"},
    {id:'w',kind:'proc',text:'wait 300 ms (rate-limit) → next item'},
    {id:'e',kind:'term',text:'END — log remaining pending count  (known gap: retried-but-accepted item written twice — TC-M-030)'},
  ],
  [
    {from:'q1',to:'sel',label:'yes',replace:true},
    {from:'q1',to:'end0',label:'no'},
    {from:'end0',to:'e',label:''},
    {from:'q2',to:'q3',label:'no',replace:true},
    {from:'q2',to:'ms',label:'yes'},
    {from:'ms',to:'w',label:''},
    {from:'q3',to:'rt',label:'no',replace:true},
    {from:'q3',to:'mf',label:'yes'},
    {from:'mf',to:'w',label:''},
    {from:'rt',to:'w',label:''},
  ]);

/* ============================================================
   Activity diagrams (vertical swimlanes)
   ============================================================ */
function activity(fname,title,id, lanes, nodes, edges, H){
  const c=[]; U=0;
  const laneW=240, W = lanes.length*laneW + 80;
  c.push(V('t',title,40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=13;align=left;'));
  const laneX={};
  lanes.forEach((L,i)=>{ laneX[L]=40+i*laneW; c.push(V('lane'+i,esc(L),40+i*laneW,44,laneW,H,S.lane)); });
  const pos={};
  nodes.forEach(n=>{
    const x = laneX[n.lane] + (laneW-(n.w||180))/2;
    const st = n.kind==='start'?'ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;'
      : n.kind==='end'?'ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;'
      : n.kind==='dec'?S.dec : n.kind==='bar'?S.bar : S.proc;
    const w = n.w || (n.kind==='dec'?170:180), h = n.h || (n.kind==='start'||n.kind==='end'?30:(n.kind==='bar'?8:50));
    c.push(V(n.id, esc(n.text||''), x, n.y, w, h, st));
    pos[n.id]={x,y:n.y,w,h};
  });
  edges.forEach(e=> c.push(E(nid('e'), e.from, e.to, e.label||'', EDGE.flow)));
  save(fname, title.split('—')[0].trim().slice(0,40), id, c, W, H+70);
}

/* Figure 4.9 — Incident Lifecycle (end-to-end) */
activity('Figure_4.9_Activity_Incident_Lifecycle.drawio',
  'Figure 4.9 — Activity Diagram: Incident Lifecycle (citizen report → ML triage → officer validation → task → resolution)','fig49',
  ['Citizen','Backend','ML Service','DMC Officer','Volunteer','PostgreSQL'],
  [
    {id:'st',lane:'Citizen',kind:'start',y:70,w:24,h:24},
    {id:'a1',lane:'Citizen',kind:'proc',y:120,text:'Submit incident report (title, description, category, location, GPS, photos)'},
    {id:'a2',lane:'Backend',kind:'proc',y:120,text:'requireFields; geocode if no GPS; findZoneForCoordinates (turf)'},
    {id:'a3',lane:'PostgreSQL',kind:'proc',y:120,text:'INSERT IncidentReport (severity = MEDIUM, status = PENDING)'},
    {id:'fk',lane:'Backend',kind:'bar',y:200,w:170},
    {id:'a4',lane:'ML Service',kind:'proc',y:230,text:'detect language → translate → NER → feature vector → XGBoost severity + confidence'},
    {id:'a5',lane:'Backend',kind:'proc',y:230,text:'detectAndSaveDuplicates() — weighted score ≥ 50 → IncidentDuplicateLink'},
    {id:'jn',lane:'Backend',kind:'bar',y:320,w:170},
    {id:'a6',lane:'PostgreSQL',kind:'proc',y:230,text:'UPDATE IncidentReport (severity, confidence, entities, language); INSERT MLLog'},
    {id:'d1',lane:'Backend',kind:'dec',y:360,text:'confidence ≥ routing threshold (≈ 0.73) ?'},
    {id:'a7',lane:'DMC Officer',kind:'proc',y:460,text:'Review low-confidence incident (description + entities + map); verify; set correct severity'},
    {id:'a8',lane:'Backend',kind:'proc',y:460,text:'auto-accept — enters normal officer queue'},
    {id:'d2',lane:'DMC Officer',kind:'dec',y:560,text:'incident needs field response ?'},
    {id:'a9',lane:'DMC Officer',kind:'proc',y:670,text:'Assign task from incident; update status PENDING → ASSIGNED'},
    {id:'a10',lane:'Volunteer',kind:'proc',y:670,text:'Accept task; update status IN_PROGRESS → EN_ROUTE → ON_SITE'},
    {id:'a11',lane:'Volunteer',kind:'proc',y:760,text:'Complete task; accrue active hours'},
    {id:'a12',lane:'Backend',kind:'proc',y:760,text:'UPDATE status → RESOLVED; INSERT IncidentHistory; notify reporter'},
    {id:'a13',lane:'DMC Officer',kind:'proc',y:850,text:'File After-Action Report (timeline, resources, cost, lessons)'},
    {id:'en',lane:'Citizen',kind:'end',y:860,w:28,h:28},
  ],
  [
    {from:'st',to:'a1'},{from:'a1',to:'a2',label:'POST /api/incidents'},{from:'a2',to:'a3'},
    {from:'a3',to:'fk'},{from:'fk',to:'a4'},{from:'fk',to:'a5'},
    {from:'a4',to:'a6'},{from:'a4',to:'jn'},{from:'a5',to:'jn'},{from:'a6',to:'d1'},{from:'jn',to:'d1'},
    {from:'d1',to:'a7',label:'no (route to human)'},{from:'d1',to:'a8',label:'yes'},
    {from:'a7',to:'d2'},{from:'a8',to:'d2'},
    {from:'d2',to:'a9',label:'yes'},{from:'d2',to:'a12',label:'no (resolve directly)'},
    {from:'a9',to:'a10'},{from:'a10',to:'a11'},{from:'a11',to:'a12'},{from:'a12',to:'a13'},{from:'a13',to:'en'},
  ], 920);

/* AD-1 offline report + sync */
activity('Activity_AD-1_Offline_Report_and_Sync.drawio',
  'Activity Diagram AD-1 — Offline-First Citizen Incident Report &amp; Synchronisation','adc1',
  ['Citizen (UI)','Mobile App Logic','Local SQLite Queue','Backend API','PostgreSQL'],
  [
    {id:'st',lane:'Citizen (UI)',kind:'start',y:70,w:24,h:24},
    {id:'a1',lane:'Citizen (UI)',kind:'proc',y:110,text:'Tap "Submit report"'},
    {id:'a2',lane:'Mobile App Logic',kind:'proc',y:110,text:'status = submitting; read auth token; POST /api/incidents (8 s abort timeout)'},
    {id:'d1',lane:'Mobile App Logic',kind:'dec',y:190,text:'request returned ?'},
    {id:'d2',lane:'Mobile App Logic',kind:'dec',y:300,text:'HTTP class ?'},
    {id:'a3',lane:'Backend API',kind:'proc',y:300,text:'validate required fields'},
    {id:'d3',lane:'Backend API',kind:'dec',y:390,text:'fields valid ?'},
    {id:'fk',lane:'Backend API',kind:'bar',y:490,w:170},
    {id:'a4',lane:'Backend API',kind:'proc',y:520,text:'geocode / zone → INSERT IncidentReport'},
    {id:'a5',lane:'Backend API',kind:'proc',y:520,text:'async: ML /process-report → write-back; duplicate detection'},
    {id:'jn',lane:'Backend API',kind:'bar',y:600,w:170},
    {id:'a6',lane:'Backend API',kind:'proc',y:630,text:'emit new-incident (Socket.IO); return 201'},
    {id:'a7',lane:'Mobile App Logic',kind:'proc',y:630,text:'status = success'},
    {id:'e1',lane:'Citizen (UI)',kind:'end',y:640,w:26,h:26},
    {id:'a8',lane:'Mobile App Logic',kind:'proc',y:300,text:'status = error; show server message (NOT queued)'},
    {id:'e2',lane:'Citizen (UI)',kind:'end',y:300,w:26,h:26},
    {id:'a9',lane:'Local SQLite Queue',kind:'proc',y:730,text:"INSERT sync_queue (type='INCIDENT_REPORT', payload, status='pending', attempts=0)"},
    {id:'a10',lane:'Mobile App Logic',kind:'proc',y:730,text:'status = queued — "saved, will send when online"'},
    {id:'e3',lane:'Citizen (UI)',kind:'end',y:740,w:26,h:26},
    {id:'st2',lane:'Mobile App Logic',kind:'start',y:830,w:24,h:24},
    {id:'a11',lane:'Mobile App Logic',kind:'proc',y:870,text:'later trigger: connectivity restored / 8 s poll / background task / foreground → syncPendingItems() [online &amp; !isSyncing]'},
    {id:'a12',lane:'Local SQLite Queue',kind:'proc',y:870,text:"SELECT pending ORDER BY created_at ASC (FIFO)"},
    {id:'a13',lane:'Backend API',kind:'proc',y:960,text:'loop: POST each item to SYNC_HANDLERS[type] {X-Offline-Sync, X-Original-Timestamp}'},
    {id:'d4',lane:'Mobile App Logic',kind:'dec',y:1050,text:'per-item response ?'},
    {id:'a14',lane:'Local SQLite Queue',kind:'proc',y:1160,text:"2xx → markSynced; 4xx → markFailed (permanent); 5xx/err → attempts++, failed if ≥ 5 else pending; wait 300 ms"},
    {id:'en',lane:'Mobile App Logic',kind:'end',y:1160,w:28,h:28},
  ],
  [
    {from:'st',to:'a1'},{from:'a1',to:'a2'},{from:'a2',to:'d1'},
    {from:'d1',to:'d2',label:'yes'},{from:'d1',to:'a9',label:'no (timeout / network)'},
    {from:'d2',to:'a3',label:'2xx'},{from:'d2',to:'a8',label:'4xx'},{from:'d2',to:'a9',label:'5xx'},
    {from:'a3',to:'d3'},{from:'d3',to:'fk',label:'yes'},{from:'d3',to:'a8',label:'no (400)'},
    {from:'fk',to:'a4'},{from:'fk',to:'a5'},{from:'a4',to:'jn'},{from:'a5',to:'jn'},
    {from:'jn',to:'a6'},{from:'a6',to:'a7'},{from:'a7',to:'e1'},
    {from:'a8',to:'e2'},
    {from:'a9',to:'a10'},{from:'a10',to:'e3'},
    {from:'st2',to:'a11'},{from:'a11',to:'a12'},{from:'a12',to:'a13'},{from:'a13',to:'d4'},
    {from:'d4',to:'a14'},{from:'a14',to:'en'},
  ], 1230);

/* AD-3 river forecast → alert */
activity('Activity_AD-3_River_Forecast_to_Alert.drawio',
  'Activity Diagram AD-3 — Automated River Forecast → Threshold Alert Dispatch (hourly)','adc3',
  ['System Scheduler','Backend','ML Service','PostgreSQL','External Channels','Citizen'],
  [
    {id:'st',lane:'System Scheduler',kind:'start',y:70,w:24,h:24},
    {id:'a1',lane:'System Scheduler',kind:'proc',y:110,text:'cron 0 * * * * — begin hourly cycle'},
    {id:'a2',lane:'Backend',kind:'proc',y:110,text:'simulateDataFetch() → refresh gauge readings'},
    {id:'a3',lane:'PostgreSQL',kind:'proc',y:110,text:'INSERT RiverWaterLevel[]'},
    {id:'a4',lane:'Backend',kind:'proc',y:200,text:'evaluateThresholdsAndAlerts() — raw-reading breaches (rate-limited)'},
    {id:'a5',lane:'Backend',kind:'proc',y:290,text:'runPredictionsForAllGauges() — distinct active gauges; loop (500 ms stagger)'},
    {id:'d1',lane:'Backend',kind:'dec',y:380,text:'≥ 3 readings for gauge ?'},
    {id:'a6',lane:'ML Service',kind:'proc',y:490,text:'LSTM forward pass (or rule-based) → {t1_m, t2_m, confidence, alert_level, reason}'},
    {id:'a7',lane:'PostgreSQL',kind:'proc',y:490,text:'UPSERT WaterLevelPrediction (gaugeId unique — the cache row)'},
    {id:'d2',lane:'Backend',kind:'dec',y:580,text:'confidence ≥ 0.75 AND threat ≤ 2 h AND alert_level ≠ NONE ?'},
    {id:'d3',lane:'Backend',kind:'dec',y:690,text:'same (gauge, level) alerted in last 30 min ?'},
    {id:'a8',lane:'Backend',kind:'proc',y:800,text:'DownstreamMapping[gauge] → target districts (fallback [gauge.district]); fetch nearby PublicSafePlace; translate Si/Ta; INSERT Alert'},
    {id:'fk',lane:'Backend',kind:'bar',y:900,w:170},
    {id:'a9',lane:'PostgreSQL',kind:'proc',y:930,text:'INSERT Notification[] for affected users'},
    {id:'a10',lane:'External Channels',kind:'proc',y:930,text:'Expo push · Twilio SMS · Nodemailer · Telegram'},
    {id:'a11',lane:'Backend',kind:'proc',y:930,text:'Socket.IO emit new-alert (+ safe zones)'},
    {id:'jn',lane:'Backend',kind:'bar',y:1010,w:170},
    {id:'a12',lane:'Citizen',kind:'proc',y:1040,text:'receive alert only if isAlertNearby() OR "All Island"'},
    {id:'a13',lane:'Backend',kind:'proc',y:1040,text:'record notifiedCount; update 30-min de-dup key'},
    {id:'en',lane:'System Scheduler',kind:'end',y:1050,w:28,h:28},
  ],
  [
    {from:'st',to:'a1'},{from:'a1',to:'a2'},{from:'a2',to:'a3'},{from:'a3',to:'a4'},{from:'a4',to:'a5'},{from:'a5',to:'d1'},
    {from:'d1',to:'a6',label:'yes'},{from:'d1',to:'a5',label:'no (skip gauge)'},
    {from:'a6',to:'a7'},{from:'a7',to:'d2'},
    {from:'d2',to:'d3',label:'yes'},{from:'d2',to:'a5',label:'no (next gauge)'},
    {from:'d3',to:'a5',label:'yes (suppress)'},{from:'d3',to:'a8',label:'no'},
    {from:'a8',to:'fk'},{from:'fk',to:'a9'},{from:'fk',to:'a10'},{from:'fk',to:'a11'},
    {from:'a9',to:'jn'},{from:'a10',to:'jn'},{from:'a11',to:'jn'},
    {from:'jn',to:'a12'},{from:'jn',to:'a13'},{from:'a13',to:'en'},
  ], 1120);

/* ============================================================
   Sequence diagrams (free-point edges + umlFrame fragments)
   ============================================================ */
function sequence(fname,title,id, parts, rows, frames, H){
  const c=[]; U=0;
  const x0=40, dx=210, W = x0 + parts.length*dx + 40;
  c.push(V('t',title,40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=13;align=left;'));
  const cx={};
  parts.forEach((p,i)=>{
    const x=x0+i*dx; cx[p.id]=x+80;
    c.push(V('h_'+p.id, esc(p.label), x, 40, 160, 34, 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=11;'));
    c.push(`<mxCell id="ll_${p.id}" style="endArrow=none;dashed=1;html=1;strokeColor=#999999;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x+80}" y="74" as="sourcePoint"/><mxPoint x="${x+80}" y="${H-20}" as="targetPoint"/></mxGeometry></mxCell>`);
  });
  (frames||[]).forEach(f=>{
    c.push(V(nid('fr'), esc(f.label), cx[f.from]-20, f.y, (cx[f.to]-cx[f.from])+40, f.h, 'shape=umlFrame;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#999999;fontSize=10;align=left;verticalAlign=top;width=90;height=22;'));
  });
  rows.forEach(r=>{
    if(r.note){ c.push(V(nid('nt'), esc(r.note), cx[r.from]-90, r.y-12, 180, 26, 'shape=note;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=9;size=8;')); return; }
    const a=cx[r.from], b=cx[r.to];
    if(a===b){ // self
      c.push(`<mxCell id="${nid('m')}" value="${esc(r.text)}" style="endArrow=block;html=1;fontSize=9;align=left;spacingLeft=6;rounded=1;" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${a}" y="${r.y}" as="sourcePoint"/><mxPoint x="${a}" y="${r.y+22}" as="targetPoint"/><Array as="points"><mxPoint x="${a+70}" y="${r.y}"/><mxPoint x="${a+70}" y="${r.y+22}"/></Array></mxGeometry></mxCell>`);
    } else {
      const st = r.ret ? 'endArrow=open;dashed=1;html=1;fontSize=9;align=center;verticalAlign=bottom;'
                       : 'endArrow=block;html=1;fontSize=9;align=center;verticalAlign=bottom;';
      c.push(EP(nid('m'), a, r.y, b, r.y, esc(r.text), st));
    }
  });
  save(fname, title.split('—')[0].trim().slice(0,40), id, c, W, H+20);
}

/* Figure 4.10 — Incident submission + ML classification */
sequence('Figure_4.10_Sequence_Incident_Submission_and_ML.drawio',
  'Figure 4.10 — Sequence Diagram: Incident Submission and Automated ML Classification','fig410',
  [
    {id:'ci',label:'Citizen (Mobile)'},{id:'ml_',label:'Mobile App Logic'},
    {id:'api',label:'Backend API'},{id:'auth',label:'Auth Middleware'},
    {id:'db',label:'Prisma / PostgreSQL'},{id:'ml',label:'ML Service'},{id:'io',label:'Socket.IO'},
  ],
  [
    {from:'ci',to:'ml_',y:110,text:'submit(reportData)'},
    {from:'ml_',to:'ml_',y:140,text:'status = submitting; read token'},
    {from:'ml_',to:'api',y:185,text:'POST /api/incidents  {Bearer JWT}  (timeout 8 s)'},
    {from:'api',to:'auth',y:215,text:'verify JWT'},
    {from:'auth',to:'api',y:238,text:'{ userId, role }',ret:true},
    {from:'api',to:'api',y:265,text:'requireFields(title, description, location, category)'},
    {from:'api',to:'api',y:300,text:'geocode (opt) + findZoneForCoordinates()'},
    {from:'api',to:'db',y:340,text:'INSERT IncidentReport (severity = MEDIUM)'},
    {from:'db',to:'api',y:363,text:'incident { id }',ret:true},
    {from:'api',to:'ml',y:410,text:'POST /process-report { text, features }'},
    {from:'ml',to:'ml',y:440,text:'detect_language → translate → NER → feature vector'},
    {from:'ml',to:'ml',y:475,text:'xgb.predict_proba → temperature scale → conf = max(p)'},
    {from:'ml',to:'api',y:505,text:'{ severity, confidence, entities, language }',ret:true},
    {from:'api',to:'db',y:535,text:'UPDATE IncidentReport (ML fields); INSERT MLLog'},
    {from:'api',to:'api',y:575,text:'detectAndSaveDuplicates(incident)'},
    {from:'api',to:'db',y:605,text:'INSERT IncidentDuplicateLink (if score ≥ 50)'},
    {from:'api',to:'io',y:645,text:'emit "new-incident"'},
    {from:'api',to:'ml_',y:675,text:'201 { id, message }',ret:true},
    {from:'ml_',to:'ci',y:700,text:'status = success',ret:true},
  ],
  [
    {from:'ml',to:'db',y:395,h:230,label:'par  async enrichment ∥ duplicate detection'},
  ], 740);

/* Figure 4.11 — Officer validation + task assignment */
sequence('Figure_4.11_Sequence_Officer_Validation_and_Task_Assignment.drawio',
  'Figure 4.11 — Sequence Diagram: Officer Validation and Task Assignment','fig411',
  [
    {id:'api',label:'Backend API'},{id:'db',label:'Prisma / PostgreSQL'},
    {id:'io',label:'Socket.IO'},{id:'web',label:'Web (Officer)'},{id:'vol',label:'Volunteer (Mobile)'},
  ],
  [
    {from:'api',to:'api',y:110,text:'confidence < routingThreshold (≈ 0.73)'},
    {from:'api',to:'db',y:145,text:'UPDATE IncidentReport (awaitingReview = true)'},
    {from:'api',to:'io',y:175,text:'emit "review-required"'},
    {from:'io',to:'web',y:200,text:'review-required',ret:true},
    {from:'web',to:'api',y:235,text:'GET /api/incidents/:id'},
    {from:'api',to:'db',y:262,text:'SELECT incident + entities + duplicate links'},
    {from:'api',to:'web',y:290,text:'incident detail',ret:true},
    {from:'web',to:'api',y:330,text:'PATCH /api/incidents/:id/status { severity: corrected | confirm }'},
    {from:'api',to:'api',y:360,text:'if corrected → add to active-learning re-annotation pool'},
    {from:'api',to:'db',y:392,text:'UPDATE IncidentReport (final severity); INSERT IncidentHistory'},
    {from:'web',to:'api',y:435,text:'POST /api/tasks { incidentId, assigneeId, description }'},
    {from:'api',to:'db',y:462,text:'INSERT Task (status = ASSIGNED); UPDATE incident status = ASSIGNED'},
    {from:'api',to:'io',y:492,text:'emit "task-assigned" + Expo push'},
    {from:'io',to:'vol',y:517,text:'task-assigned',ret:true},
    {from:'vol',to:'api',y:552,text:'PATCH /api/tasks/:id { status: IN_PROGRESS → EN_ROUTE → ON_SITE → RESOLVED }'},
    {from:'api',to:'db',y:582,text:'UPDATE Task; accrue VolunteerProfile.totalHours; INSERT IncidentHistory'},
    {from:'api',to:'io',y:612,text:'emit "incident-updated"'},
    {from:'io',to:'web',y:637,text:'incident-updated (live dashboard sync)',ret:true},
  ],
  [
    {from:'web',to:'api',y:315,h:105,label:'alt  officer agrees  /  officer corrects'},
  ], 680);

/* Figure 4.12 — Offline sync mechanism */
sequence('Figure_4.12_Sequence_Offline_Sync_Mechanism.drawio',
  'Figure 4.12 — Sequence Diagram: Offline Sync Mechanism','fig412',
  [
    {id:'ci',label:'Citizen (Mobile)'},{id:'ml_',label:'Mobile App Logic'},
    {id:'q',label:'SQLite Queue'},{id:'net',label:'networkMonitor'},{id:'api',label:'Backend API'},
  ],
  [
    {from:'ci',to:'ml_',y:110,text:'submit(payload)'},
    {from:'ml_',to:'api',y:140,text:'POST endpoint (timeout 8 s)'},
    {from:'api',to:'ml_',y:168,text:'5xx / timeout / network error',ret:true},
    {from:'ml_',to:'q',y:200,text:"INSERT sync_queue { type, payload, status='pending', attempts=0 }"},
    {from:'q',to:'ml_',y:224,text:'queueId',ret:true},
    {from:'ml_',to:'ci',y:248,text:'status = queued',ret:true},
    {from:'net',to:'net',y:300,text:'poll every 8 s / on reconnect'},
    {from:'net',to:'ml_',y:330,text:'onOnline() → syncPendingItems()  [guard: online && !isSyncing]'},
    {from:'ml_',to:'q',y:360,text:"SELECT * WHERE status='pending' AND attempts<max ORDER BY created_at ASC"},
    {from:'q',to:'ml_',y:384,text:'[items]  (FIFO)',ret:true},
    {from:'ml_',to:'api',y:430,text:'POST SYNC_HANDLERS[type].endpoint  {X-Offline-Sync, X-Original-Timestamp}'},
    {from:'api',to:'ml_',y:458,text:'201 / 4xx / 5xx',ret:true},
    {from:'ml_',to:'q',y:486,text:'2xx → markSynced;  4xx → markFailed (permanent);  5xx → attempts++, failed if ≥ 5'},
    {from:'ml_',to:'ml_',y:520,text:'wait 300 ms → next item'},
  ],
  [
    {from:'net',to:'net',y:288,h:60,label:'triggers: reconnect · 8 s poll · foreground · background task'},
    {from:'ml_',to:'q',y:415,h:130,label:'loop  for each pending item'},
  ], 570);

/* SD-3 river forecast alert dispatch (extra) */
sequence('Sequence_SD-3_River_Forecast_Alert_Dispatch.drawio',
  'Sequence Diagram SD-3 — River Forecast → Threshold Alert Dispatch (hourly)','sdc3',
  [
    {id:'sch',label:'System Scheduler'},{id:'api',label:'Backend API'},
    {id:'db',label:'Prisma / PostgreSQL'},{id:'ml',label:'ML Service'},
    {id:'ext',label:'External Channels'},{id:'io',label:'Socket.IO'},{id:'ci',label:'Citizen (Mobile)'},
  ],
  [
    {from:'sch',to:'api',y:110,text:'cron tick (hourly)'},
    {from:'api',to:'api',y:138,text:'simulateDataFetch()'},
    {from:'api',to:'db',y:168,text:'INSERT RiverWaterLevel[]'},
    {from:'api',to:'api',y:196,text:'evaluateThresholdsAndAlerts() — raw breaches'},
    {from:'api',to:'db',y:226,text:'SELECT DISTINCT recent gauges'},
    {from:'db',to:'api',y:250,text:'[gauges]',ret:true},
    {from:'api',to:'db',y:295,text:'SELECT last 12 readings + rainfall'},
    {from:'api',to:'ml',y:325,text:'POST /predict-water-level { gauge_id, thresholds, readings[12] }'},
    {from:'ml',to:'ml',y:353,text:'scaler.transform; lstm.predict (or rule-based)'},
    {from:'ml',to:'api',y:381,text:'{ t1_m, t2_m, confidence, alert_level, reason }',ret:true},
    {from:'api',to:'db',y:409,text:'UPSERT WaterLevelPrediction (gaugeId unique)'},
    {from:'api',to:'db',y:455,text:'SELECT DownstreamMapping[gauge] (fallback [district]); nearby PublicSafePlace'},
    {from:'api',to:'api',y:485,text:'translate message → Si, Ta'},
    {from:'api',to:'db',y:513,text:'INSERT Alert (locations = target districts)'},
    {from:'api',to:'db',y:548,text:'INSERT Notification[]'},
    {from:'api',to:'ext',y:573,text:'Expo push / Twilio SMS / Nodemailer / Telegram'},
    {from:'api',to:'io',y:598,text:'emit "new-alert" (+ safeZones)'},
    {from:'io',to:'ci',y:623,text:'new-alert',ret:true},
    {from:'ci',to:'ci',y:651,text:'isAlertNearby(alert, userLat, userLng) ? → show local notification'},
    {from:'api',to:'api',y:685,text:'update 30-min de-dup key; notifiedCount++'},
    {from:'api',to:'sch',y:713,text:'cycle summary { gauges, alertsFired }',ret:true},
  ],
  [
    {from:'api',to:'db',y:280,h:460,label:'loop  for each gauge (500 ms stagger)'},
    {from:'api',to:'db',y:440,h:290,label:'alt  confidence ≥ 0.75 AND (t1|t2 ≥ watch) AND alert_level ≠ NONE AND not de-duped'},
    {from:'api',to:'io',y:540,h:75,label:'par  dispatch'},
  ], 745);

/* ============================================================
   Figure 4.14 — Core ER diagram (crow's foot)
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1680,H=1140;
  c.push(V('t','Figure 4.2 — Core Entity-Relationship Diagram (~19 of the 72 tables · crow\'s-foot · verified against schema.prisma)',40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  const EW=210;
  const ent=(id,name,attrs,x,y)=>{
    const label = `<b>${name}</b><hr size="1" noshade>` + attrs.map(a=>esc(a)).join('<br>');
    c.push(V(id,label,x,y,EW,34+attrs.length*16,S.ent));
  };
  const c0=40,c1=320,c2=610,c3=900,c4=1190,c5=1460;
  ent('IH','IncidentHistory',['PK id','FK incidentId','fromStatus, toStatus','changedById, note'],c0,60);
  ent('IDL','IncidentDuplicateLink',['PK id','FK reportId','FK canonicalId','score, distanceM, status'],c0,230);
  ent('MP','MissingPerson',['PK id','name, age?, description','lastSeenLocation, photo','status'],c0,420);
  ent('FM','FamilyMember',['PK id','FK primaryUserId','name, relation, age?','status, phone?'],c0,620);
  ent('Inc','IncidentReport',['PK id','FK reporterId','title, description, location','latitude?, longitude?','category, status, severity','mlConfidence?, nlpEntities (Json)'],c1,90);
  ent('Task','Task',['PK id','FK incidentId','FK createdById, FK assigneeId?','status, description'],c1,400);
  ent('DA','DamageAssessment',['PK id','FK reportedById','FK incidentId?','category, damage levels','estimatedLoss?, status','compensationEligible'],c1,600);
  ent('HR','HelpRequest',['PK id','FK userId?  (nullable — public)','type, description, location','priority, status','peopleCount?, phone?'],c1,860);
  ent('User','User',['PK id','email (U), password?','name, phone?, role','currentSectorId (FK, nullable)','hospitalId (FK, nullable)','twoFactorEnabled'],c2,360);
  ent('SCI','SafetyCheckIn',['PK id','FK userId','status, message?','latitude?, longitude?'],c2,720);
  ent('VP','VolunteerProfile',['PK id','FK userId (U)','incidentsJoined','readinessScore, totalHours'],c2,930);
  ent('Alert','Alert',['PK id','title, message, type','active, locations[]','broadcastRadiusKm?','notifiedCount'],c3,60);
  ent('Hos','Hospital',['PK id','name, location, email (U)','specialties[], totalBeds','availableBeds, isActive'],c3,320);
  ent('RC','ReliefCamp',['PK id','name, location, lat?, lng?','currentOccupancy ≤ totalCapacity','services[], status'],c3,560);
  ent('RWL','RiverWaterLevel',['PK id  (no FK — telemetry)','gaugeId, riverName, district','waterLevelMetres, trend','alertLevel, status, recordedAt'],c3,820);
  ent('Notif','Notification',['PK id','FK userId','FK alertId?  (SetNull)','title, body, read'],c4,60);
  ent('HRef','HospitalReferral',['PK id','FK campId','FK hospitalId?','patientName, conditionSeverity','status, admittedAt?'],c4,320);
  ent('RT','ReliefToken',['PK id','FK userId, FK campId?','code (U), qrCodeData','status, usageCount / maxUsage','categories[], fraudRiskScore'],c4,560);
  ent('WLP','WaterLevelPrediction',['PK id','gaugeId (U)','predictedT1M, predictedT2M','confidence, alertLevel','modelUsed, computedAt'],c4,820);
  ent('RTC','ReliefTokenClaim',['PK id','FK tokenId','claimedAt, claimedBy','itemType, quantity','locationLat?, locationLng?'],c5,580);
  const R=(s,t,card,style)=>c.push(E(nid('r'),s,t,card,style||EDGE.er));
  R('User','Inc','reports  1 : 0..*');
  R('Inc','IH','has history  1 : 0..*');
  R('Inc','IDL','duplicate-of (reportId)  1 : 0..*');
  R('Inc','IDL','canonical (canonicalId)  1 : 0..*');
  R('Inc','Task','spawns  1 : 0..*');
  R('User','Task','assigned  0..1 : 0..*');
  R('Alert','Notif','generates  1 : 0..*');
  R('User','Notif','receives  1 : 0..*');
  R('User','HR','submits  0..1 : 0..*');
  R('User','VP','has profile  1 : 0..1',EDGE.er11);
  R('RC','RT','issues at  0..1 : 0..*');
  R('User','RT','owns  1 : 0..*');
  R('RT','RTC','claimed via  1 : 0..*');
  R('User','DA','files  1 : 0..*');
  R('Inc','DA','assessed for  1 : 0..*');
  R('RWL','WLP','forecast cached (by gaugeId)  1 : 1',EDGE.er11);
  R('User','FM','lists  1 : 0..*');
  R('User','SCI','broadcasts  1 : 0..*');
  R('RC','HRef','refers  1 : 0..*');
  R('Hos','HRef','receives  0..1 : 0..*');
  R('User','Hos','staff-of  0..1 : 0..*');
  c.push(V('n1','User is the hub — nearly every record links back to its creator/owner.',c2-10,300,EW+20,26,S.note));
  c.push(V('n2','RiverWaterLevel &amp; RainfallReading (App. C) carry no FK — append-only telemetry, not relationship entities. nlpEntities is a JSON column (schema not committed to an evolving ML-output shape).',c3-10,1040,600,50,S.note));
  save('Figure_4.2_Core_ER_Diagram.drawio','Fig 4.2 Core ER','fig42er',c.slice(),W,H);
  const c2x=c.map(x=>x.replace('Figure 4.2 —','Figure 4.14 —'));
  save('Figure_4.14_ER_Diagram_Core.drawio','Fig 4.14 ER Core','fig414',c2x,W,H);
})();

/* ============================================================
   Figure 4.12 — Class Diagram: Incident, Alert & Water Subsystem
   Strict layered layout, edges routed in the column gaps only
   (no line crosses a box or another line).
   ============================================================ */
(function(){
  const c=[]; U=0; const W=1660,H=1010;
  c.push(V('t','Figure 4.12 — Class Diagram: Incident, Alert and Water Subsystem (layered boundary → control → service → entity)',40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=13;align=left;'));
  const box=(id,stereo,name,rows,x,y,w,h,fill)=>{
    const head=(stereo?('<i>«'+stereo+'»</i><br>'):'')+'<b>'+name+'</b>';
    const body=rows.length?rows.join('<br>'):'&nbsp;';
    c.push(V(id, head+'<hr size="1" noshade>'+body, x,y,w,h,
      'rounded=0;whiteSpace=wrap;html=1;fillColor='+(fill||'#ffffff')+';strokeColor=#333333;align=left;verticalAlign=top;spacingLeft=6;spacingTop=4;overflow=hidden;'));
  };
  const F={ctl:'#dae8fc', svc:'#d5e8d4', ent:'#f5f5f5', x:'#ffe6cc'};
  const ed=(s,t,label,style,ex,en)=>{
    let st='edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=9;'+style;
    if(ex) st+=`exitX=${ex[0]};exitY=${ex[1]};exitDx=0;exitDy=0;`;
    if(en) st+=`entryX=${en[0]};entryY=${en[1]};entryDx=0;entryDy=0;`;
    c.push(E(nid('e'),s,t,label||'',st));
  };
  const DEP='endArrow=open;dashed=1;endFill=0;';
  const ASC='endArrow=none;';
  const GRD='endArrow=open;dashed=1;endFill=0;strokeColor=#b85450;';

  // row 1 — cross-cutting middleware (top)
  box('auth','control','AuthMiddleware',['+ authMiddleware()','+ adminMiddleware()','+ officerMiddleware()','+ hospitalMiddleware()'],360,40,240,96,F.x);
  // row 2 — boundary / control
  box('ic','control','IncidentController',['+ createIncident(req,res)','+ getIncidents(req,res)','+ updateIncidentStatus()','+ deleteIncident()','+ triggerSOS()','+ resolveDuplicateLink()'],340,170,260,140,F.ctl);
  box('ac','control','AlertController',['+ createAlert()','+ getAlerts()','+ deactivateAlert()','+ deleteAlert()','+ acknowledgeAlert()','+ getDeliveryStats()'],960,170,250,140,F.ctl);
  box('wr','boundary','waterRoutes / water-cron',['route handlers + hourly job'],1290,190,240,60,F.ctl);
  // row 3 — service classes
  box('s_inc','service','IncidentService',['+ createIncident(data)','+ getAllIncidents(filter)','+ getIncidentById(id)','+ updateIncidentStatus(id,status)'],40,380,260,120,F.svc);
  box('s_dup','service','DuplicateDetectionService',['+ detectAndSaveDuplicates(incident)','+ getAllPendingDuplicateLinks()','+ updateDuplicateLinkStatus(id,st)','- haversineMetres()','- nlpEntityOverlap()'],350,380,280,140,F.svc);
  box('s_ml','service','MlService',['+ processReport(data)  [HTTP → ML]','+ scoreDamage(data)'],690,380,240,80,F.svc);
  box('s_alt','service','AlertGeneratorService',['+ createAndEmitAlert(t,m,type,locs,src)','+ evaluateThresholdsAndAlerts()','+ dispatch(alert)  [push/SMS/mail/TG]'],960,380,260,110,F.svc);
  box('s_wtr','service','WaterPredictorService',['+ getPrediction(gaugeId,thresholds)','+ runPredictionsForAllGauges(opts)','+ savePrediction(p)','+ refreshPredictions(gauges)','+ checkMLServiceOnline()'],1290,380,260,140,F.svc);
  // row 4 — entity classes (each under its owning service)
  box('e_inc','entity','IncidentReport',['id, reporterId','title, description, location','status : Status','severity : Severity','mlConfidence?, nlpEntities : Json'],40,580,260,120,F.ent);
  box('e_ih','entity','IncidentHistory',['id, incidentId','fromStatus, toStatus, note'],40,730,260,64,F.ent);
  box('e_idl','entity','IncidentDuplicateLink',['id, reportId, canonicalId','score, distanceM, status'],350,580,280,80,F.ent);
  box('e_ml','entity','MLLog',['id, incidentId','model, prediction, confidence'],690,580,240,72,F.ent);
  box('e_alt','entity','Alert',['id, title, message','type : AlertType, active','locations[], broadcastRadiusKm?','notifiedCount'],960,580,260,104,F.ent);
  box('e_notif','entity','Notification',['id, userId, alertId?','title, body, read'],960,720,260,64,F.ent);
  box('e_rwl','entity','RiverWaterLevel',['id, gaugeId, district','waterLevelMetres, trend','alertLevel, status'],1290,580,260,88,F.ent);
  box('e_wlp','entity','WaterLevelPrediction',['id, gaugeId (unique)','predictedT1M, predictedT2M','confidence, alertLevel, modelUsed'],1290,700,260,88,F.ent);
  // shared singleton (bottom)
  box('prisma','entity','PrismaClient  «singleton»',['utils/prisma.ts — one shared instance','$transaction(), model delegates'],360,872,360,72,F.x);
  c.push(V('pnote','Every service class holds a dependency on this one shared PrismaClient instance (one edge shown for clarity).',760,878,480,44,S.note));

  // --- guards (short vertical / one clean dogleg above the control row) ---
  ed('auth','ic','«guard» officer/admin ops',GRD,[0.5,1],[0.5,0]);
  ed('auth','ac','«guard» createAlert / deleteAlert',GRD,[1,0.5],[0.5,0]);
  // --- controller -> service (dependency; fan out in the row-2/row-3 gap) ---
  ed('ic','s_inc','',DEP,[0.12,1],[0.85,0]);
  ed('ic','s_dup','',DEP,[0.5,1],[0.5,0]);
  ed('ic','s_ml','',DEP,[0.88,1],[0.15,0]);
  ed('ac','s_alt','',DEP,[0.5,1],[0.5,0]);
  ed('wr','s_wtr','',DEP,[0.5,1],[0.5,0]);
  // --- service -> entity (association; straight down within the column) ---
  ed('s_inc','e_inc','acts on',ASC,[0.4,1],[0.4,0]);
  ed('s_dup','e_idl','writes',ASC,[0.4,1],[0.4,0]);
  ed('s_ml','e_ml','writes',ASC,[0.4,1],[0.4,0]);
  ed('s_alt','e_alt','creates',ASC,[0.35,1],[0.4,0]);
  ed('s_wtr','e_rwl','reads',ASC,[0.35,1],[0.4,0]);
  ed('s_wtr','e_wlp','upsert',ASC,[1,0.85],[1,0.3]);      // clean dogleg on the right margin
  // --- entity -> entity (association with multiplicity, straight down) ---
  ed('e_inc','e_ih','1        0..*',ASC,[0.7,1],[0.7,0]);
  ed('e_alt','e_notif','1        0..*',ASC,[0.7,1],[0.7,0]);
  ed('e_rwl','e_wlp','1        1  (gaugeId)',ASC,[0.7,1],[0.7,0]);
  // --- one representative shared dependency to PrismaClient (left margin) ---
  ed('s_inc','prisma','«use» (all services)',DEP,[0,0.5],[0,0.5]);

  save('Figure_4.12_Class_Diagram_Incident_Alert_Water.drawio','Fig 4.12 Class Diagram','fig412',c.slice(),W,H);
  const c8=c.map(x=>x.replace('Figure 4.12 —','Figure 4.8 —'));
  save('Figure_4.8_Class_Diagram_Incident_Alert_Water.drawio','Fig 4.8 Class Diagram','fig48',c8,W,H);
})();

/* ============================================================
   Figure 4.9 — Sequence Diagram: Offline-First Incident Report
   & Later Synchronisation  (SD-1, full)
   ============================================================ */
sequence('Figure_4.9_Sequence_Offline_First_Incident_Report.drawio',
  'Figure 4.9 — Sequence Diagram: Offline-First Incident Report and Later Synchronisation','fig49seq',
  [
    {id:'ci',label:'Citizen (Mobile)'},{id:'mob',label:'Mobile App Logic'},
    {id:'q',label:'SQLite Queue'},{id:'api',label:'Backend API'},
    {id:'auth',label:'Auth Middleware'},{id:'db',label:'Prisma / PostgreSQL'},
    {id:'ml',label:'ML Service'},{id:'io',label:'Socket.IO'},
  ],
  [
    {from:'ci',to:'mob',y:110,text:'submit(reportData)'},
    {from:'mob',to:'mob',y:140,text:'status = "submitting"; read token (AsyncStorage)'},
    {from:'mob',to:'api',y:185,text:'POST /api/incidents  { Authorization: Bearer JWT }   (timeout 8 s)'},

    {from:'api',to:'auth',y:250,text:'verify JWT'},
    {from:'auth',to:'api',y:274,text:'{ userId, role }',ret:true},
    {from:'api',to:'api',y:302,text:'requireFields(title, description, location, category)'},
    {from:'api',to:'api',y:336,text:'if no lat/lng: geocode via Nominatim; findZoneForCoordinates() (turf)'},
    {from:'api',to:'db',y:372,text:'INSERT IncidentReport  (status = PENDING, severity = MEDIUM)'},
    {from:'db',to:'api',y:396,text:'incident { id }',ret:true},

    {from:'api',to:'ml',y:452,text:'POST /process-report  { text, features }'},
    {from:'ml',to:'api',y:478,text:'{ severity, confidence, entities, detected_language }',ret:true},
    {from:'api',to:'db',y:504,text:'UPDATE IncidentReport (ML fields); INSERT MLLog'},
    {from:'api',to:'api',y:552,text:'detectAndSaveDuplicates(incident)'},
    {from:'api',to:'db',y:578,text:'INSERT IncidentDuplicateLink  (if score ≥ 50)'},

    {from:'api',to:'io',y:626,text:'emit "new-incident"'},
    {from:'api',to:'mob',y:652,text:'201 { id, message }',ret:true},
    {from:'mob',to:'ci',y:676,text:'status = "success"',ret:true},

    {from:'api',y:712,note:'[ 4xx — validation failed ]'},
    {from:'api',to:'mob',y:730,text:'400 { message }',ret:true},
    {from:'mob',to:'ci',y:754,text:'status = "error", show message   (NOT queued)',ret:true},

    {from:'mob',y:792,note:'[ 5xx OR timeout / network error ]'},
    {from:'mob',to:'q',y:810,text:"INSERT sync_queue { type:'INCIDENT_REPORT', payload, status:'pending' }"},
    {from:'q',to:'mob',y:834,text:'queueId',ret:true},
    {from:'mob',to:'ci',y:858,text:'status = "queued"',ret:true},

    {from:'ci',y:906,note:'— — later: connectivity restored / 8 s poll / background task / app foreground — —'},
    {from:'mob',to:'mob',y:930,text:'syncPendingItems()   [ guard: online && !isSyncing ]'},
    {from:'mob',to:'q',y:962,text:'SELECT * FROM sync_queue WHERE status=pending ORDER BY created_at ASC'},
    {from:'q',to:'mob',y:986,text:'[ items ]   (FIFO)',ret:true},

    {from:'mob',to:'api',y:1040,text:'POST SYNC_HANDLERS[type].endpoint  { X-Offline-Sync, X-Original-Timestamp }'},
    {from:'api',to:'db',y:1066,text:'create the record server-side'},
    {from:'api',to:'mob',y:1092,text:'201  /  4xx  /  5xx',ret:true},
    {from:'mob',to:'q',y:1118,text:'2xx → markSynced ·  4xx → markFailed (permanent) ·  5xx → attempts++, retry if < 5'},
    {from:'mob',to:'mob',y:1150,text:'wait 300 ms'},
  ],
  [
    {from:'mob',to:'io',y:210,h:670,label:'alt   [2xx]   /   [4xx validation]   /   [5xx or timeout / network error]'},
    {from:'api',to:'db',y:428,h:172,label:'par   async ML enrichment   ∥   duplicate detection'},
    {from:'mob',to:'db',y:1012,h:168,label:'loop   [ for each pending item ]'},
  ], 1210);

/* ============================================================
   Figure 4.10 — Sequence Diagram: Severity Triage with
   Human-in-the-Loop Routing  (SD-2, full)
   ============================================================ */
sequence('Figure_4.10_Sequence_Severity_Triage_Human_in_the_Loop.drawio',
  'Figure 4.10 — Sequence Diagram: Severity Triage with Human-in-the-Loop Routing','fig410seq',
  [
    {id:'api',label:'Backend API'},{id:'ml',label:'ML Service'},
    {id:'web',label:'Web (Officer)'},{id:'db',label:'Prisma / PostgreSQL'},
  ],
  [
    {from:'api',to:'db',y:110,text:'INSERT IncidentReport  (severity = MEDIUM default)'},
    {from:'api',to:'api',y:138,text:'buildFeatureVector(incident)'},
    {from:'api',to:'ml',y:172,text:'POST /analyze-report  { text, lat, lng }'},

    {from:'ml',to:'ml',y:230,text:'detect_language(text)'},
    {from:'ml',to:'ml',y:256,text:'translate_to_english(text)   [opt: language ≠ "en"]'},
    {from:'ml',to:'ml',y:282,text:'extract_entities(text)   (spaCy NER)'},
    {from:'ml',to:'ml',y:308,text:'build_feature_vector(features)'},
    {from:'ml',to:'ml',y:334,text:'xgb.predict_proba(x) → p'},
    {from:'ml',to:'ml',y:360,text:'temperature_scale(p);  conf = max(p)   (opt: SPE spread, conformal set)'},
    {from:'ml',to:'api',y:388,text:'{ severity, confidence, entities, detected_language, translated_text }',ret:true},
    {from:'api',to:'db',y:414,text:'UPDATE IncidentReport (severity, mlConfidence, nlpEntities); INSERT MLLog'},

    {from:'api',to:'api',y:470,text:'auto-accept — incident enters the normal officer queue'},

    {from:'api',y:508,note:'[ confidence < routing threshold ]'},
    {from:'api',to:'db',y:526,text:'UPDATE IncidentReport (awaitingReview = true)'},
    {from:'api',to:'web',y:552,text:'push "review-required"  (Socket.IO)'},
    {from:'web',to:'api',y:578,text:'GET /api/incidents/:id'},
    {from:'api',to:'web',y:604,text:'incident + NLP entities + duplicate links',ret:true},

    {from:'web',to:'api',y:660,text:'PATCH /api/incidents/:id/status  { confirm }'},

    {from:'web',y:698,note:'[ officer corrects ]'},
    {from:'web',to:'api',y:716,text:'PATCH /api/incidents/:id/status  { severity: <corrected> }'},
    {from:'api',to:'api',y:744,text:'add case to the active-learning re-annotation pool'},

    {from:'api',to:'db',y:786,text:'UPDATE IncidentReport (final severity); INSERT IncidentHistory'},

    {from:'ml',y:828,note:'[ ML service unreachable ]'},
    {from:'ml',to:'api',y:846,text:'timeout / connection refused',ret:true},
    {from:'api',to:'db',y:872,text:"UPDATE IncidentReport (needsManualTriage = true); INSERT MLLog(prediction='UNAVAILABLE')"},
  ],
  [
    {from:'api',to:'db',y:196,h:706,label:'alt   [ML service reachable]   /   [ML service unreachable]'},
    {from:'api',to:'web',y:440,h:366,label:'alt   [confidence ≥ routing threshold ≈ 0.73]   /   [confidence < threshold]'},
    {from:'api',to:'web',y:640,h:120,label:'alt   [officer agrees]   /   [officer corrects]'},
  ], 930);

/* ============================================================
   Figure 4.6 — Activity Diagram: Offline-First Incident Report
   & Synchronisation  (AD-1, hand-laid-out for clarity)
   ============================================================ */
(function(){
  const c=[]; U=0;
  const laneW=270, lanes=['Citizen (UI)','Mobile App Logic','Local SQLite Queue','Backend API','PostgreSQL'];
  const LX={}; lanes.forEach((L,i)=>LX[L]=40+i*laneW);
  const W = 40 + lanes.length*laneW + 40, H = 1780;
  c.push(V('t','Figure 4.6 — Activity Diagram: Offline-First Incident Report and Synchronisation',40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  lanes.forEach((L,i)=>c.push(V('ln'+i,L,40+i*laneW,44,laneW,H-60,'swimlane;html=1;startSize=28;horizontal=1;fillColor=none;strokeColor=#666666;fontStyle=1;')));
  // section divider
  c.push(V('div','DEFERRED SYNCHRONISATION  —  later trigger: connectivity restored · 8 s connectivity poll · Expo background-fetch task · app returns to foreground',48,1010,W-96,26,'text;html=1;fontStyle=1;fontSize=11;align=center;fillColor=#f0f0f0;strokeColor=#999999;'));
  const put=(id,lane,y,text,kind,w,h)=>{
    w=w|| (kind==='dec'?190:220); h=h|| (kind==='dec'?90: kind==='bar'?10 : (kind==='start'||kind==='end'?28:56));
    const x = LX[lane] + (laneW-w)/2;
    const st = kind==='start'?'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
      : kind==='end'?'ellipse;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=3;'
      : kind==='dec'?S.dec : kind==='bar'?S.bar : S.proc;
    c.push(V(id,text,x,y,w,h,st));
  };
  const go=(s,t,l)=>c.push(E(nid('e'),s,t,l||'',EDGE.flow));

  /* ---- online path ---- */
  put('st','Citizen (UI)',80,'','start');
  put('a1','Citizen (UI)',140,'Fill report form and tap "Submit report"');
  put('a2','Mobile App Logic',140,'Set status = "submitting"; read auth token (AsyncStorage)');
  put('a3','Mobile App Logic',235,'POST /api/incidents  { Authorization: Bearer JWT }  — 8 s abort timeout');
  put('d1','Mobile App Logic',330,'Request returned within 8 s?','dec');
  put('d2','Mobile App Logic',470,'HTTP response class?','dec');
  put('a4','Backend API',470,'Validate required fields: title, description, location, category');
  put('d3','Backend API',580,'Fields valid?','dec');
  put('fk','Backend API',710,'','bar',200);
  put('a5','Backend API',745,'Branch A: geocode if no GPS → district-zone lookup (turf point-in-polygon)');
  put('a5b','PostgreSQL',745,'INSERT IncidentReport  (status = PENDING, severity = MEDIUM)');
  put('a6','Backend API',835,'Branch B (async): POST ML /process-report; run duplicate detection');
  put('a6b','PostgreSQL',835,'UPDATE IncidentReport (ML fields); INSERT MLLog / IncidentDuplicateLink');
  put('jn','Backend API',930,'','bar',200);
  put('a7','Backend API',960,'Emit "new-incident" (Socket.IO); return 201 Created');
  put('a8','Mobile App Logic',960,'Set status = "success"; show confirmation');
  put('e1','Citizen (UI)',965,'','end');

  /* ---- client-error path (4xx) ---- */
  put('aerr','Mobile App Logic',600,'Set status = "error"; show server message  (NOT queued)');
  put('e2','Citizen (UI)',605,'','end');

  /* ---- offline / server-error path -> queue ---- */
  put('q1','Local SQLite Queue',470,"INSERT INTO sync_queue { type:'INCIDENT_REPORT', payload (JSON), status:'pending', attempts:0 }",'proc',230,64);
  put('q2','Mobile App Logic',700,'Set status = "queued" — "saved, will send when online"');
  put('e3','Citizen (UI)',705,'','end');

  go('st','a1'); go('a1','a2'); go('a2','a3'); go('a3','d1');
  go('d1','d2','yes'); go('d1','q1','no — timeout / network error');
  go('d2','a4','2xx'); go('d2','aerr','4xx'); go('d2','q1','5xx');
  go('a4','d3'); go('d3','fk','yes'); go('d3','aerr','no  →  return 400');
  go('fk','a5'); go('fk','a6'); go('a5','a5b'); go('a6','a6b');
  go('a5b','jn'); go('a6b','jn'); go('jn','a7'); go('a7','a8'); go('a8','e1');
  go('aerr','e2');
  go('q1','q2'); go('q2','e3');

  /* ---- deferred synchronisation ---- */
  put('st2','Mobile App Logic',1070,'','start');
  put('s1','Mobile App Logic',1120,'syncPendingItems()   [ guard: online AND not already syncing ]');
  put('s2','Local SQLite Queue',1120,"SELECT * FROM sync_queue WHERE status='pending' AND attempts < max_attempts ORDER BY created_at ASC   (FIFO)",'proc',230,72);
  // loop frame
  c.push(V('loop','loop  [ for each pending item ]',LX['Mobile App Logic']-10,1235,laneW*4+20,430,'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#9673a6;dashed=1;verticalAlign=top;align=left;fontStyle=2;fontSize=10;spacingLeft=6;spacingTop=4;'));
  put('s3','Backend API',1270,'POST item → SYNC_HANDLERS[type].endpoint   headers: X-Offline-Sync: true, X-Original-Timestamp','proc',230,64);
  put('s3b','PostgreSQL',1270,'Create the record server-side (idempotency: X-Original-Timestamp sent, not yet used for de-dup)','proc',230,64);
  put('d4','Mobile App Logic',1380,'Per-item response class?','dec');
  put('s4a','Local SQLite Queue',1500,"2xx  →  markSynced(id)   (status = 'synced')");
  put('s4b','Local SQLite Queue',1565,"4xx  →  markFailed(id)   (permanent — bad data, never retry)");
  put('s4c','Local SQLite Queue',1630,"5xx / network  →  attempts++; status = attempts ≥ 5 ? 'failed' : 'pending'",'proc',230,64);
  put('s5','Mobile App Logic',1560,'Wait 300 ms (rate-limit) → next item');
  put('e4','Mobile App Logic',1690,'Log remaining pending count','end',180,40);

  go('st2','s1'); go('s1','s2'); go('s2','s3'); go('s3','s3b'); go('s3b','d4');
  go('d4','s4a','2xx'); go('d4','s4b','4xx'); go('d4','s4c','5xx / error');
  go('s4a','s5'); go('s4b','s5'); go('s4c','s5');
  c.push(E(nid('e'),'s5','s3','next item','edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;fontSize=10;exitX=0;exitY=0.5;entryX=0;entryY=0.5;'));
  go('s5','e4','queue empty');

  save('Figure_4.6_Activity_Offline_First_Incident_Report_and_Sync.drawio','Fig 4.6 Activity AD-1','fig46',c,W,H);
})();

/* ============================================================
   Figure 4.7 — Activity Diagram: ML Severity Triage with
   Human-in-the-Loop Routing  (AD-2, hand-laid-out for clarity)
   ============================================================ */
(function(){
  const c=[]; U=0;
  const laneW=280, lanes=['Backend','ML Service','DMC Officer','PostgreSQL'];
  const LX={}; lanes.forEach((L,i)=>LX[L]=40+i*laneW);
  const W = 40 + lanes.length*laneW + 40, H = 1620;
  c.push(V('t','Figure 4.7 — Activity Diagram: Severity Triage with Human-in-the-Loop Routing',40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  lanes.forEach((L,i)=>c.push(V('ln'+i,L,40+i*laneW,44,laneW,H-70,'swimlane;html=1;startSize=28;horizontal=1;fillColor=none;strokeColor=#666666;fontStyle=1;')));
  const put=(id,lane,y,text,kind,w,h)=>{
    w=w|| (kind==='dec'?210:230); h=h|| (kind==='dec'?96 : kind==='bar'?10 : (kind==='start'||kind==='end'?28:58));
    const x = LX[lane] + (laneW-w)/2;
    const st = kind==='start'?'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
      : kind==='end'?'ellipse;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=3;'
      : kind==='dec'?S.dec : kind==='bar'?S.bar : S.proc;
    c.push(V(id,text,x,y,w,h,st));
  };
  const go=(s,t,l)=>c.push(E(nid('e'),s,t,l||'',EDGE.flow));

  put('st','Backend',80,'','start');
  c.push(V('n0','A new incident has just been inserted with severity = MEDIUM (the default).',LX['ML Service']+20,74,laneW*2,40,S.note));
  put('a1','Backend',150,'Build feature vector: affected population, hazard type, vulnerability flags (has_children / has_elderly / has_disabled)','proc',230,64);
  put('a2','Backend',255,'POST ML /process-report  { text, features }');
  put('d1','Backend',355,'ML service reachable?','dec');

  // unreachable branch
  put('u1','Backend',500,'Keep severity = MEDIUM; set needsManualTriage = true','proc',230,58);
  put('u2','PostgreSQL',500,"INSERT MLLog (prediction = 'UNAVAILABLE')");
  put('ue','Backend',600,'','end');

  // reachable -> ML service
  put('m1','ML Service',500,'Detect language → translate to English if needed → build feature vector','proc',230,64);
  put('m2','ML Service',585,'XGBoost predict_proba(x) → 4-class probability vector p');
  put('m3','ML Service',685,'Temperature-scale p (T tuned on calibration set); confidence = max(p)   (opt: SPE spread, conformal set)','proc',230,64);
  put('m4','ML Service',790,'Return { severity = argmax(p), confidence, entities, detected_language, translated_text }','proc',230,58);
  put('a3','PostgreSQL',790,'UPDATE IncidentReport (severity, mlConfidence, nlpEntities); INSERT MLLog','proc',230,58);
  put('d2','Backend',895,'confidence ≥ routing threshold (≈ 0.72–0.74, tuned on held-out calibration set)?','dec',220,104);

  // auto-accept branch
  put('auto','DMC Officer',900,'Auto-accepted — incident enters the normal officer queue at its ML-assigned severity','proc',230,64);
  put('autoe','DMC Officer',1000,'','end');

  // human-review branch (main spine)
  put('a4','Backend',1030,'Flag awaitingReview = true; add incident to the human-review queue; notify officers','proc',230,64);
  put('a5','DMC Officer',1135,'Open incident; review description + NLP entities + map');
  put('d3','DMC Officer',1235,'Officer agrees with the ML severity?','dec');
  put('conf','DMC Officer',1370,'Confirm severity  (reviewOutcomeAgree = true)','proc',230,58);
  put('corr','ML Service',1370,'Officer sets the correct severity; add the corrected case to the active-learning re-annotation pool  (reviewOutcomeAgree = false)','proc',230,72);
  put('j','Backend',1480,'','bar',180);
  put('a6','PostgreSQL',1500,'UPDATE IncidentReport (final severity); INSERT IncidentHistory','proc',230,58);
  put('e','Backend',1520,'','end');

  go('st','a1'); go('a1','a2'); go('a2','d1');
  go('d1','u1','no'); go('u1','u2'); go('u2','ue');
  go('d1','m1','yes'); go('m1','m2'); go('m2','m3'); go('m3','m4');
  go('m4','a3'); go('a3','d2');
  go('d2','auto','yes'); go('auto','autoe');
  go('d2','a4','no'); go('a4','a5'); go('a5','d3');
  go('d3','conf','yes'); go('d3','corr','no');
  go('conf','j'); go('corr','j'); go('j','a6'); go('a6','e');

  c.push(V('note1','Design rationale: a classifier at ~80% accuracy cannot be trusted unconditionally for disaster triage. Routing only the least-confident ~15–26% of cases to a human captures a disproportionate share of the dangerous errors while still automating the majority.',LX['DMC Officer']-10,120,laneW*2,80,S.note));
  c.push(V('note2','Under-triage (predicting a lower tier than the truth) is weighted as more costly than over-triage. Process metrics reported in Chapter 5: auto-coverage, error-capture rate, accepted accuracy, under-triage rate before vs after routing.',LX['DMC Officer']-10,225,laneW*2,80,S.note));
  save('Figure_4.7_Activity_Severity_Triage_Human_in_the_Loop.drawio','Fig 4.7 Activity AD-2','fig47',c,W,H);
})();

/* ============================================================
   Figure 4.8 — Activity Diagram: Automated River Forecast →
   Threshold Alert Dispatch  (AD-3, hand-laid-out for clarity)
   ============================================================ */
(function(){
  const c=[]; U=0;
  const laneW=245, lanes=['System Scheduler','Backend','ML Service','PostgreSQL','External Channels','Citizen'];
  const LX={}; lanes.forEach((L,i)=>LX[L]=40+i*laneW);
  const W = 40 + lanes.length*laneW + 40, H = 1680;
  c.push(V('t','Figure 4.8 — Activity Diagram: Automated River Forecast → Threshold Alert Dispatch (hourly)',40,10,W-80,24,'text;html=1;fontStyle=1;fontSize=14;align=left;'));
  lanes.forEach((L,i)=>c.push(V('ln'+i,L,40+i*laneW,44,laneW,H-70,'swimlane;html=1;startSize=28;horizontal=1;fillColor=none;strokeColor=#666666;fontStyle=1;')));
  const put=(id,lane,y,text,kind,w,h)=>{
    w=w|| (kind==='dec'?205:210); h=h|| (kind==='dec'?92 : kind==='bar'?10 : (kind==='start'||kind==='end'?28:56));
    const x = LX[lane] + (laneW-w)/2;
    const st = kind==='start'?'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
      : kind==='end'?'ellipse;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=3;'
      : kind==='dec'?S.dec : kind==='bar'?S.bar : S.proc;
    c.push(V(id,text,x,y,w,h,st));
  };
  const go=(s,t,l,extra)=>c.push(E(nid('e'),s,t,l||'',(extra||'')+EDGE.flow));

  put('st','System Scheduler',80,'','start');
  put('a1','System Scheduler',135,'cron  0 * * * *  — begin hourly cycle');
  put('a2','Backend',135,'simulateDataFetch() — pull / refresh river-gauge readings');
  put('a3','PostgreSQL',135,'INSERT RiverWaterLevel[]  (latest readings)');
  put('a4','Backend',235,'evaluateThresholdsAndAlerts() — raw-reading breaches (rate-limited via RainfallAlertLog)','proc',210,60);
  put('a5','Backend',330,'runPredictionsForAllGauges() — SELECT DISTINCT active gauges');

  // loop frame
  c.push(V('loop','loop  [ for each gauge · 500 ms stagger ]',LX['Backend']-12,430,laneW*5+24,1080,'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#9673a6;dashed=1;verticalAlign=top;align=left;fontStyle=2;fontSize=10;spacingLeft=6;spacingTop=4;'));

  put('g1','Backend',470,'Fetch last ≤ 12 readings + matching rainfall; build the 7-feature sequence','proc',210,58);
  put('d1','Backend',560,'≥ 3 readings for this gauge?','dec');
  put('g2','Backend',690,'POST ML /predict-water-level  { sequence, gauge thresholds }','proc',210,56);
  put('g3','ML Service',690,'LSTM forward pass (or rule-based fallback) → { predicted_t1_m, predicted_t2_m, confidence, alert_level, reason }','proc',210,80);
  put('g4','PostgreSQL',700,'UPSERT WaterLevelPrediction (gaugeId unique — the cache row served to GET /api/water/predictions)','proc',210,72);
  put('d2','Backend',805,'confidence ≥ 0.75  AND  threat within 2 h  AND  alert_level ≠ NONE ?','dec',205,104);
  put('d3','Backend',945,'Same (gauge, alert_level) already alerted in the last 30 min?','dec',205,100);
  put('a6','Backend',1085,'DownstreamMapping[gauge] → target districts (fallback [gauge.district]); fetch nearby PublicSafePlace safe zones','proc',210,64);
  put('a7','Backend',1190,'INSERT Alert (WARNING / EMERGENCY, locations = target districts); translate message → Si, Ta','proc',210,60);
  put('fk','Backend',1280,'','bar',180);
  put('p1','PostgreSQL',1310,'INSERT Notification[] for affected users');
  put('p2','External Channels',1310,'Expo push · Twilio SMS · Nodemailer e-mail · Telegram','proc',210,56);
  put('p3','Backend',1310,'Socket.IO: emit "new-alert" (+ safe-zone payload)');
  put('jn','Backend',1400,'','bar',180);
  put('cc','Citizen',1420,'Receive alert only if isAlertNearby() is true (inside broadcast radius, or "All Island")','proc',210,64);
  put('a8','Backend',1430,'Record notifiedCount; update the 30-min de-dup key');
  put('e','System Scheduler',1560,'','end');
  c.push(V('ee','log cycle summary: N gauges processed, M alerts fired',LX['System Scheduler']-2,1595,laneW,26,'text;html=1;fontSize=9;align=center;'));

  go('st','a1'); go('a1','a2'); go('a2','a3'); go('a3','a4'); go('a4','a5'); go('a5','g1');
  go('g1','d1');
  go('d1','g2','yes'); go('d1','g1','no — skip gauge','exitX=1;exitY=0.5;entryX=1;entryY=0.5;');
  go('g2','g3'); go('g3','g4'); go('g4','d2');
  go('d2','d3','yes'); go('d2','g1','no — next gauge','exitX=0;exitY=0.5;entryX=0;entryY=0.5;');
  go('d3','a6','no'); go('d3','g1','yes — suppress','exitX=0;exitY=0.5;entryX=0;entryY=0.5;');
  go('a6','a7'); go('a7','fk'); go('fk','p1'); go('fk','p2'); go('fk','p3');
  go('p1','jn'); go('p2','jn'); go('p3','jn'); go('jn','cc'); go('jn','a8');
  go('a8','g1','next gauge','exitX=0;exitY=0.5;entryX=0;entryY=0.5;');
  go('a8','e','loop: no more gauges');

  c.push(V('note','Rationale: automating this path removes the officer from the time-critical loop and gives downstream districts 1–2 h of lead time. The confidence gate (≥ 0.75) and the 30-min per-(gauge, alert_level) de-duplication window keep alert fatigue low.',LX['ML Service']+10,120,laneW*3-20,72,S.note));
  save('Figure_4.8_Activity_River_Forecast_to_Threshold_Alert_Dispatch.drawio','Fig 4.8 Activity AD-3','fig48ad',c,W,H);
})();

console.log('\nAll diagrams written to', OUT);
