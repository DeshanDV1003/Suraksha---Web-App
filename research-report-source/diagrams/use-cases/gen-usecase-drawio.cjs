/* Generate 8 draw.io use-case diagrams for Suraksha (Figures 4.3-4.5 + Appendix B.1-B.5). */
const fs = require('fs');
const path = require('path');
const OUT = 'd:/Suraksha - Web App/research-report-source/diagrams/use-cases';
fs.mkdirSync(OUT, { recursive: true });

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const GUILL = t => '&#171;' + t + '&#187;';

// ---- layout constants ----
const ACT_W = 40, ACT_H = 80;
const UC_W = 250, UC_H = 54;
const SUB_W = 220, SUB_H = 46;
const BX = 260;                 // boundary x
const BY = 40;                  // boundary y
const BW = 900;                 // boundary width
const COL1 = BX + 60;
const COL2 = BX + 60 + UC_W + 110;
const ROW0 = BY + 60;
const ROWDY = 78;
const LEFT_X = 40;
const RIGHT_GAP = 70;

function build(spec) {
  const cells = [];
  let auto = 0;
  const nid = () => 'n' + (++auto);
  const idOf = {};

  // ---- place use cases in two columns ----
  const ucs = spec.useCases;
  const nRows = Math.ceil(ucs.length / 2);
  ucs.forEach((uc, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? COL1 : COL2;
    const y = ROW0 + row * ROWDY;
    idOf[uc.id] = 'uc_' + uc.id;
    cells.push(
      `<mxCell id="uc_${uc.id}" value="${esc(uc.name)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${UC_W}" height="${UC_H}" as="geometry"/></mxCell>`
    );
  });

  // ---- sub use cases (include/extend targets), stacked below in a third block ----
  const subStartY = ROW0 + nRows * ROWDY + 24;
  (spec.subCases || []).forEach((sc, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? COL1 + 15 : COL2 + 15;
    const y = subStartY + row * (SUB_H + 22);
    idOf[sc.id] = 'uc_' + sc.id;
    cells.push(
      `<mxCell id="uc_${sc.id}" value="${esc(sc.name)}" style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;dashed=1;fontSize=10;" vertex="1" parent="1">` +
      `<mxGeometry x="${x}" y="${y}" width="${SUB_W}" height="${SUB_H}" as="geometry"/></mxCell>`
    );
  });

  const subRows = Math.ceil((spec.subCases || []).length / 2);
  const boundaryH = Math.max(
    subStartY + subRows * (SUB_H + 22) + 24 - BY,
    ROW0 + nRows * ROWDY + 24 - BY,
    260
  );

  // ---- boundary (behind everything) ----
  cells.unshift(
    `<mxCell id="boundary" value="${esc(spec.boundary)}" style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;fontStyle=1;fontSize=14;fillColor=none;strokeColor=#000000;" vertex="1" parent="1">` +
    `<mxGeometry x="${BX}" y="${BY}" width="${BW}" height="${boundaryH}" as="geometry"/></mxCell>`
  );

  // ---- left actors ----
  const leftY0 = BY + 40;
  const leftStep = Math.max(120, (boundaryH - 80) / Math.max(spec.actorsLeft.length, 1));
  spec.actorsLeft.forEach((a, i) => {
    idOf['A:' + a] = 'a_' + a.replace(/\W+/g, '');
    cells.push(
      `<mxCell id="${idOf['A:' + a]}" value="${esc(a)}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=11;" vertex="1" parent="1">` +
      `<mxGeometry x="${LEFT_X}" y="${leftY0 + i * leftStep}" width="${ACT_W}" height="${ACT_H}" as="geometry"/></mxCell>`
    );
  });

  // ---- right actors ----
  const rightX = BX + BW + RIGHT_GAP;
  const rightY0 = BY + 40;
  const rightStep = Math.max(130, (boundaryH - 80) / Math.max((spec.actorsRight || []).length, 1));
  (spec.actorsRight || []).forEach((a, i) => {
    idOf['A:' + a] = 'a_' + a.replace(/\W+/g, '');
    cells.push(
      `<mxCell id="${idOf['A:' + a]}" value="${esc(a)}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=11;" vertex="1" parent="1">` +
      `<mxGeometry x="${rightX}" y="${rightY0 + i * rightStep}" width="${ACT_W}" height="${ACT_H}" as="geometry"/></mxCell>`
    );
  });

  // ---- actor generalisations ----
  (spec.generalisations || []).forEach(([child, parent]) => {
    if (!idOf['A:' + child] || !idOf['A:' + parent]) return;
    cells.push(
      `<mxCell id="${nid()}" value="" style="endArrow=block;endFill=0;html=1;strokeColor=#666666;" edge="1" parent="1" source="${idOf['A:' + child]}" target="${idOf['A:' + parent]}"><mxGeometry relative="1" as="geometry"/></mxCell>`
    );
  });

  // ---- associations actor <-> use case ----
  ucs.forEach(uc => {
    (uc.actors || []).forEach(a => {
      const aid = idOf['A:' + a];
      if (!aid) return;
      cells.push(
        `<mxCell id="${nid()}" value="" style="endArrow=none;html=1;strokeColor=#333333;" edge="1" parent="1" source="${aid}" target="${idOf[uc.id]}"><mxGeometry relative="1" as="geometry"/></mxCell>`
      );
    });
  });

  // ---- include / extend ----
  (spec.includes || []).forEach(([base, inc]) => {
    if (!idOf[base] || !idOf[inc]) return;
    cells.push(
      `<mxCell id="${nid()}" value="${GUILL('include')}" style="endArrow=open;endFill=0;html=1;dashed=1;fontSize=10;strokeColor=#009900;" edge="1" parent="1" source="${idOf[base]}" target="${idOf[inc]}"><mxGeometry relative="1" as="geometry"/></mxCell>`
    );
  });
  (spec.extends || []).forEach(([ext, base]) => {
    if (!idOf[ext] || !idOf[base]) return;
    cells.push(
      `<mxCell id="${nid()}" value="${GUILL('extend')}" style="endArrow=open;endFill=0;html=1;dashed=1;fontSize=10;strokeColor=#cc6600;" edge="1" parent="1" source="${idOf[ext]}" target="${idOf[base]}"><mxGeometry relative="1" as="geometry"/></mxCell>`
    );
  });

  const model =
    `<mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="${boundaryH + 200}" math="0" shadow="0">` +
    `<root><mxCell id="0"/><mxCell id="1" parent="0"/>` + cells.join('') + `</root></mxGraphModel>`;

  return `<mxfile host="app.diagrams.net" version="24.7.5">` +
    `<diagram name="${esc(spec.diagram)}" id="${spec.id}">${model}</diagram></mxfile>`;
}

// ============================ SPECS ============================
const specs = [
  // ---------- Figure 4.3 ----------
  {
    file: 'Figure_4.3_UseCase_Authentication_and_User_Management.drawio',
    id: 'uc-m1', diagram: 'Fig 4.3 Authentication & User Management',
    boundary: 'Authentication and User Management',
    actorsLeft: ['Citizen', 'Volunteer', 'Administrator'],
    actorsRight: [],
    generalisations: [['Volunteer', 'Citizen']],
    useCases: [
      { id: 'm1_register', name: 'Register account', actors: ['Citizen'] },
      { id: 'm1_login', name: 'Log in (email + password)', actors: ['Citizen', 'Volunteer', 'Administrator'] },
      { id: 'm1_google', name: 'Log in with Google', actors: ['Citizen', 'Volunteer'] },
      { id: 'm1_2fa', name: 'Verify 2FA code', actors: ['Administrator'] },
      { id: 'm1_profile', name: 'View / edit own profile', actors: ['Citizen', 'Volunteer', 'Administrator'] },
      { id: 'm1_pwd', name: 'Change password', actors: ['Citizen', 'Volunteer', 'Administrator'] },
      { id: 'm1_listusers', name: 'List all users', actors: ['Administrator'] },
      { id: 'm1_role', name: 'Change user role', actors: ['Administrator'] },
      { id: 'm1_deact', name: 'Deactivate / delete user', actors: ['Administrator'] },
      { id: 'm1_rbac', name: 'Configure RBAC permissions', actors: ['Administrator'] },
      { id: 'm1_logs', name: 'View session & audit logs', actors: ['Administrator'] },
    ],
    subCases: [
      { id: 'm1_hash', name: 'Hash password' },
      { id: 'm1_verifypwd', name: 'Verify current password' },
    ],
    includes: [['m1_register', 'm1_hash'], ['m1_pwd', 'm1_verifypwd']],
    extends: [['m1_2fa', 'm1_login']],
  },

  // ---------- Figure 4.4 ----------
  {
    file: 'Figure_4.4_UseCase_Incident_Management.drawio',
    id: 'uc-m2', diagram: 'Fig 4.4 Incident Management',
    boundary: 'Incident Management',
    actorsLeft: ['Citizen', 'Local Verifier', 'DMC Officer', 'Administrator'],
    actorsRight: ['ML Service', 'System Scheduler'],
    generalisations: [['Administrator', 'DMC Officer']],
    useCases: [
      { id: 'm2_report', name: 'Report incident', actors: ['Citizen'] },
      { id: 'm2_sos', name: 'Trigger SOS', actors: ['Citizen'] },
      { id: 'm2_enrich', name: 'Enrich incident with ML', actors: ['ML Service', 'System Scheduler'] },
      { id: 'm2_dedup', name: 'Detect duplicate incidents', actors: ['System Scheduler'] },
      { id: 'm2_list', name: 'View incident list / detail', actors: ['DMC Officer', 'Administrator'] },
      { id: 'm2_mine', name: 'View my incidents', actors: ['Citizen'] },
      { id: 'm2_verify', name: 'Verify incident', actors: ['Local Verifier'] },
      { id: 'm2_status', name: 'Update incident status', actors: ['DMC Officer'] },
      { id: 'm2_task', name: 'Assign task from incident', actors: ['DMC Officer'] },
      { id: 'm2_reviewdup', name: 'Review duplicate links', actors: ['DMC Officer'] },
      { id: 'm2_delete', name: 'Delete incident', actors: ['Administrator'] },
      { id: 'm2_aar', name: 'File After-Action Report', actors: ['DMC Officer'] },
    ],
    subCases: [
      { id: 'm2_geocode', name: 'Geocode location' },
      { id: 'm2_zone', name: 'Tag district zone' },
      { id: 'm2_hist', name: 'Log status history' },
      { id: 'm2_notify', name: 'Notify reporter' },
    ],
    includes: [
      ['m2_report', 'm2_geocode'], ['m2_report', 'm2_zone'],
      ['m2_enrich', 'm2_dedup'],
      ['m2_status', 'm2_hist'], ['m2_status', 'm2_notify'],
    ],
    extends: [['m2_sos', 'm2_report']],
  },

  // ---------- Figure 4.5 ----------
  {
    file: 'Figure_4.5_UseCase_River_and_Alert_Management.drawio',
    id: 'uc-m4', diagram: 'Fig 4.5 River & Alert Management',
    boundary: 'River and Alert Management',
    actorsLeft: ['Citizen', 'DMC Officer', 'Administrator'],
    actorsRight: ['System Scheduler', 'ML Service', 'External Services'],
    generalisations: [['Administrator', 'DMC Officer']],
    useCases: [
      { id: 'm4_ingest', name: 'Ingest river / rainfall data', actors: ['System Scheduler'] },
      { id: 'm4_forecast', name: 'Forecast gauge level (T+1h / T+2h)', actors: ['ML Service'] },
      { id: 'm4_eval', name: 'Evaluate thresholds & generate alert', actors: ['System Scheduler'] },
      { id: 'm4_view', name: 'View river levels / rainfall / predictions', actors: ['Citizen', 'DMC Officer'] },
      { id: 'm4_create', name: 'Create alert manually', actors: ['Administrator'] },
      { id: 'm4_dispatch', name: 'Dispatch alert (multi-channel)', actors: ['External Services'] },
      { id: 'm4_receive', name: 'Receive relevant alert', actors: ['Citizen'] },
      { id: 'm4_ack', name: 'Acknowledge alert', actors: ['Citizen'] },
      { id: 'm4_deact', name: 'Deactivate / delete alert', actors: ['Administrator'] },
      { id: 'm4_map', name: 'Edit gauge -> downstream-district mapping', actors: ['DMC Officer'] },
      { id: 'm4_stats', name: 'View alert delivery statistics', actors: ['DMC Officer'] },
    ],
    subCases: [
      { id: 'm4_cache', name: 'Cache prediction' },
      { id: 'm4_downstream', name: 'Map downstream districts' },
      { id: 'm4_translate', name: 'Translate to Si / Ta' },
    ],
    includes: [
      ['m4_forecast', 'm4_cache'],
      ['m4_eval', 'm4_downstream'], ['m4_eval', 'm4_dispatch'],
      ['m4_create', 'm4_translate'], ['m4_create', 'm4_dispatch'],
    ],
    extends: [],
  },

  // ---------- Appendix B.1 ----------
  {
    file: 'Appendix_B.1_UseCase_Help_Requests_and_Rescue_Coordination.drawio',
    id: 'uc-m3', diagram: 'App B.1 Help Requests & Rescue Coordination',
    boundary: 'Help Requests and Rescue Coordination',
    actorsLeft: ['Citizen', 'Member of the Public', 'DMC Officer'],
    actorsRight: ['System Scheduler'],
    generalisations: [],
    useCases: [
      { id: 'm3_auth', name: 'Submit help request (authenticated)', actors: ['Citizen'] },
      { id: 'm3_public', name: 'Submit public help request', actors: ['Member of the Public'] },
      { id: 'm3_list', name: 'List / filter help requests', actors: ['DMC Officer'] },
      { id: 'm3_cluster', name: 'Cluster help requests', actors: ['DMC Officer'] },
      { id: 'm3_assign', name: 'Assign responder & update status', actors: ['DMC Officer'] },
      { id: 'm3_escalate', name: 'Escalate unattended request', actors: ['System Scheduler'] },
      { id: 'm3_vehicles', name: 'Manage rescue vehicles', actors: ['DMC Officer'] },
      { id: 'm3_mission', name: 'Create & track rescue mission', actors: ['DMC Officer'] },
      { id: 'm3_checkin', name: 'Check in at safe zone', actors: ['Citizen'] },
    ],
    subCases: [{ id: 'm3_notifyoff', name: 'Notify officers' }],
    includes: [['m3_escalate', 'm3_notifyoff']],
    extends: [],
  },

  // ---------- Appendix B.2 ----------
  {
    file: 'Appendix_B.2_UseCase_Relief_Camps_Resources_Tokens_and_Donations.drawio',
    id: 'uc-m5', diagram: 'App B.2 Relief Camps, Resources, Tokens & Donations',
    boundary: 'Relief Camps, Resources, Tokens and Donations',
    actorsLeft: ['Citizen', 'DMC Officer', 'Administrator'],
    actorsRight: ['ML Service'],
    generalisations: [['Administrator', 'DMC Officer']],
    useCases: [
      { id: 'm5_camp', name: 'Create / manage relief camp', actors: ['DMC Officer'] },
      { id: 'm5_occ', name: 'Update camp occupancy', actors: ['DMC Officer'] },
      { id: 'm5_res', name: 'Manage residents / inventory / schedule', actors: ['DMC Officer'] },
      { id: 'm5_supply', name: 'Request & fulfil camp supplies', actors: ['DMC Officer'] },
      { id: 'm5_transfer', name: 'Request inter-camp transfer', actors: ['DMC Officer'] },
      { id: 'm5_optimise', name: 'Optimise resource allocation', actors: ['DMC Officer', 'ML Service'] },
      { id: 'm5_issue', name: 'Issue relief token', actors: ['DMC Officer'] },
      { id: 'm5_claim', name: 'Claim relief token', actors: ['Citizen'] },
      { id: 'm5_mytokens', name: 'View my relief tokens (offline)', actors: ['Citizen'] },
      { id: 'm5_donate', name: 'Submit donation', actors: ['Citizen'] },
      { id: 'm5_donhist', name: 'View donation history', actors: ['DMC Officer'] },
      { id: 'm5_campaign', name: 'Manage donor campaign', actors: ['Administrator'] },
    ],
    subCases: [
      { id: 'm5_validate', name: 'Validate token (active / not expired / under limit)' },
      { id: 'm5_record', name: 'Record claim + fraud score' },
      { id: 'm5_guard', name: 'Enforce occupancy <= capacity' },
    ],
    includes: [
      ['m5_claim', 'm5_validate'], ['m5_claim', 'm5_record'],
      ['m5_occ', 'm5_guard'],
    ],
    extends: [],
  },

  // ---------- Appendix B.3 ----------
  {
    file: 'Appendix_B.3_UseCase_Missing_Persons_Damage_and_Hospital_Referral.drawio',
    id: 'uc-m6', diagram: 'App B.3 Missing Persons, Damage & Hospital Referral',
    boundary: 'Missing Persons, Damage Assessment and Hospital Referral',
    actorsLeft: ['Citizen', 'Member of the Public', 'DMC Officer', 'Hospital Staff'],
    actorsRight: ['ML Service'],
    generalisations: [],
    useCases: [
      { id: 'm6_report', name: 'Report missing person', actors: ['Citizen'] },
      { id: 'm6_browse', name: 'Browse public missing-persons list', actors: ['Member of the Public'] },
      { id: 'm6_found', name: 'Mark person found / reunified', actors: ['DMC Officer'] },
      { id: 'm6_face', name: 'Match face against missing persons', actors: ['DMC Officer', 'ML Service'] },
      { id: 'm6_damage', name: 'Submit damage assessment', actors: ['Citizen'] },
      { id: 'm6_score', name: 'Score damage & estimate cost', actors: ['ML Service'] },
      { id: 'm6_review', name: 'Review damage assessment', actors: ['DMC Officer'] },
      { id: 'm6_comp', name: 'Determine compensation eligibility', actors: ['DMC Officer'] },
      { id: 'm6_beds', name: 'Manage hospital bed capacity', actors: ['Hospital Staff'] },
      { id: 'm6_refer', name: 'Create patient referral from camp', actors: ['DMC Officer'] },
      { id: 'm6_accept', name: 'Accept / update referral status', actors: ['Hospital Staff'] },
    ],
    subCases: [],
    includes: [['m6_damage', 'm6_score']],
    extends: [],
  },

  // ---------- Appendix B.4 ----------
  {
    file: 'Appendix_B.4_UseCase_Family_Safety_and_Volunteers.drawio',
    id: 'uc-m7', diagram: 'App B.4 Family Safety & Volunteers',
    boundary: 'Family Safety and Volunteer Coordination',
    actorsLeft: ['Citizen', 'Volunteer', 'DMC Officer'],
    actorsRight: ['ML Service'],
    generalisations: [['Volunteer', 'Citizen']],
    useCases: [
      { id: 'm7_addfam', name: 'Add / edit family member', actors: ['Citizen'] },
      { id: 'm7_viewfam', name: 'View family safety status', actors: ['Citizen'] },
      { id: 'm7_broadcast', name: 'Broadcast "I am SAFE / NEEDS HELP"', actors: ['Citizen'] },
      { id: 'm7_profile', name: 'Maintain volunteer profile', actors: ['Volunteer'] },
      { id: 'm7_zone', name: 'Check in / out of a zone', actors: ['Volunteer'] },
      { id: 'm7_wellbeing', name: 'Log wellbeing (physical / mental)', actors: ['Volunteer'] },
      { id: 'm7_recommend', name: 'View recommended incidents', actors: ['Volunteer'] },
      { id: 'm7_createtask', name: 'Create task', actors: ['DMC Officer'] },
      { id: 'm7_updatetask', name: 'Update own task status', actors: ['Volunteer'] },
      { id: 'm7_team', name: 'Compose response team', actors: ['DMC Officer', 'ML Service'] },
    ],
    subCases: [],
    includes: [],
    extends: [],
  },

  // ---------- Appendix B.5 ----------
  {
    file: 'Appendix_B.5_UseCase_Analytics_Notifications_and_System_Administration.drawio',
    id: 'uc-m8', diagram: 'App B.5 Analytics, Notifications & System Administration',
    boundary: 'Analytics, Notifications and System Administration',
    actorsLeft: ['Citizen', 'DMC Officer', 'Administrator'],
    actorsRight: ['ML Service', 'System Scheduler'],
    generalisations: [['Administrator', 'DMC Officer']],
    useCases: [
      { id: 'm8_stats', name: 'View dashboard statistics', actors: ['DMC Officer'] },
      { id: 'm8_analytics', name: 'View operational-intelligence analytics', actors: ['DMC Officer'] },
      { id: 'm8_summary', name: 'Generate situation summary', actors: ['DMC Officer', 'ML Service'] },
      { id: 'm8_hotspot', name: 'Forecast district hotspots', actors: ['DMC Officer', 'ML Service'] },
      { id: 'm8_drift', name: 'Detect data drift', actors: ['ML Service'] },
      { id: 'm8_inbox', name: 'View notification inbox / mark read', actors: ['Citizen', 'DMC Officer', 'Administrator'] },
      { id: 'm8_audit', name: 'View audit log', actors: ['Administrator'] },
      { id: 'm8_backup', name: 'Trigger manual DB backup', actors: ['Administrator'] },
      { id: 'm8_backupauto', name: 'Run scheduled DB backup', actors: ['System Scheduler'] },
      { id: 'm8_lang', name: 'Switch UI language (Si / Ta / En)', actors: ['Citizen', 'DMC Officer', 'Administrator'] },
    ],
    subCases: [],
    includes: [],
    extends: [],
  },
];

for (const s of specs) {
  fs.writeFileSync(path.join(OUT, s.file), build(s), 'utf8');
  console.log('wrote', s.file);
}
console.log('\nAll 8 use-case .drawio files ->', OUT);
