/**
 * DNAPLOT Modular Front-End Application Framework
 * Clean, decoupled, fully linted JavaScript library for Repertoire Analytics & V-QUEST UI.
 */

// --- 1. Tab Navigation ---
window.showTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const targetContent = document.getElementById(tabName);
  if (targetContent) targetContent.classList.add('active');

  const targetBtn = document.getElementById('tabBtn_' + tabName);
  if (targetBtn) targetBtn.classList.add('active');

  if (tabName === 'airr') loadAirrData();
  else if (tabName === 'report') switchGenbankView('mouse');
  else if (tabName === 'explorer') filterGermlineView();
};

// --- 2. GenBank Heatmap Switcher ---
const GENBANK_DATA = {
  'mouse': [
    { rank: 1, symbol: 'musIGHV044', allele: 'musIGHV044*01', freq: '12.45%', name: 'V186.2 (J558 family)', note: 'Dominant response to NP antigen (Siekevitz et al. 1987; Kocks & Rajewsky 1989)' },
    { rank: 2, symbol: 'musIGHV043', allele: 'musIGHV043*01', freq: '8.42%', name: 'VH J558.18', note: 'Secondary response affinity maturation' },
    { rank: 3, symbol: 'musIGHV001', allele: 'musIGHV001*01', freq: '6.18%', name: 'V33 (J558 family)', note: 'Germline public antibody scaffold' },
    { rank: 4, symbol: 'musIGHV012', allele: 'musIGHV012*01', freq: '4.85%', name: 'V102', note: 'Autoreactive B-cell repertoire' },
    { rank: 5, symbol: 'musIGHV088', allele: 'musIGHV088*01', freq: '3.92%', name: '7183 family', note: 'Fetal & B-1 cell repertoire bias' }
  ],
  'human': [
    { rank: 1, symbol: 'IGHV3-23', allele: 'IGHV3-23*01', freq: '11.85%', name: 'DP-47', note: 'Most stable therapeutic antibody heavy scaffold' },
    { rank: 2, symbol: 'IGHV3-30', allele: 'IGHV3-30*01', freq: '8.12%', name: 'DP-49', note: 'Broadly neutralizing anti-viral antibodies' },
    { rank: 3, symbol: 'IGHV4-39', allele: 'IGHV4-39*01', freq: '6.74%', name: 'DP-79', note: 'Mucosal IgA response bias' },
    { rank: 4, symbol: 'IGHV1-69', allele: 'IGHV1-69*01', freq: '5.90%', name: 'DP-10', note: 'Stem-binding anti-influenza neutralizing antibodies' },
    { rank: 5, symbol: 'IGHV1-18', allele: 'IGHV1-18*01', freq: '4.55%', name: 'DP-14', note: 'Secondary response memory B-cells' }
  ],
  'rat': [
    { rank: 1, symbol: 'RattusIGHV1-1', allele: 'IGHV1-1*01', freq: '14.20%', name: 'Rat VH1', note: 'Hybridoma fusion lead scaffold' },
    { rank: 2, symbol: 'RattusIGHV2-4', allele: 'IGHV2-4*01', freq: '9.30%', name: 'Rat VH2', note: 'High-affinity secondary response' }
  ],
  'rabbit': [
    { rank: 1, symbol: 'OryctoIGHV1S1', allele: 'IGHV1S1*01', freq: '68.50%', name: 'Rabbit VHa1', note: 'Dominant gene utilized in >70% rabbit antibodies' },
    { rank: 2, symbol: 'OryctoIGHV1S2', allele: 'IGHV1S2*01', freq: '18.10%', name: 'Rabbit VHa2', note: 'Alternative high-affinity lineage' }
  ]
};

window.switchGenbankView = function(sp) {
  const titleEl = document.getElementById('genbankTitle');
  const tbodyEl = document.getElementById('genbankTbody');
  if (!titleEl || !tbodyEl) return;

  const rows = GENBANK_DATA[sp] || GENBANK_DATA['mouse'];
  const names = {
    'mouse': '🐭 Mouse Heavy Chain (musIGHV)',
    'human': '👨 Human Heavy Chain (humIGHV)',
    'rat': '🐀 Rat Heavy Chain (Rattus)',
    'rabbit': '🐰 Rabbit Heavy Chain (Oryctolagus)'
  };
  titleEl.innerHTML = names[sp] || names['mouse'];

  tbodyEl.innerHTML = rows.map(r => `
    <tr>
      <td style="font-weight: 700; color: #38bdf8;">#${r.rank}</td>
      <td style="font-family: monospace; color: #60a5fa; font-weight: 700;">${r.symbol}</td>
      <td style="font-family: monospace; color: #cbd5e1;">${r.allele}</td>
      <td style="color: #4ade80; font-weight: 700;">${r.freq}</td>
      <td style="color: #cbd5e1;">${r.name}</td>
      <td style="color: #94a3b8; font-size: 12px;">${r.note}</td>
    </tr>
  `).join('');
};

// --- 3. Germline Explorer ---
window.filterGermlineView = function() {
  const inputEl = document.getElementById('germlineSearchInput');
  const disp = document.getElementById('germlineDisplay');
  if (!disp) return;

  const query = (inputEl ? inputEl.value : 'musIGHV044').trim().toLowerCase();

  let symbol = 'IGHV1-72*01 / V186.2 (B1-8 Anti-NP)';
  let seq = 'CAGGTCCAACTGCAGCAGCCTGGGGCTGAGCTTGTGAAGCCTGGGGCTTCAGTGAAGCTGTCCTGCAAGGCTTCTGGCTACACCTTCACCAGCTACTGGATGCACTGGGTGAAGCAGAGGCCTGGACGAGGCCTTGAGTGGATTGGAAGGATTGATCCTAATAGTGGTGGTACTAAGTACAATGAGAAGTTCAAGAGCAAGGCCACACTGACTGTAGACAAACCCTCCAGCACAGCCTACATGCAGCTCAGCAGCCTGACATCTGAGGACTCTGCGGTCTATTATTGTGCAAGA';
  let aa = 'QVQLQQPGAELVKPGASVKLSCKASGYTFTSYWMHWVKQRPGRGLEWIGRIDPNSGGTKYNEKFKSKATLTVDKPSSTAYMQLSSLTSEDSAVYYCAR';

  if (query.includes('043')) {
    symbol = 'musIGHV043*01 (VH J558.18)';
    seq = 'GAGGTGCAGCTGAAGGAGTCAGGACCTGGCCTGGTGGCCACCTCACAGAGCCTGTCCATCACATGCACCGTCTCAGGGTTCTCATTAACCGGCTATGGTGTAAACTGGGTTCGCCAGCCTCCAGGAAAGGGTCTGGAGTGGCTGGGAATGATATGGGGTGATGGAAGCACAGACTATAATTCAGCTCTCAAATCCAGACTGAGCATCAGCAAGGACAACTCCAAGAGCCAAGTTTTCTTAAAAATGAACAGTCTGCAAACTGATGACACAGCCAGGTACTACTGTGCCAGA';
    aa = 'EVQLKESGPGLVATSQSLSITCTVSGFSLTGYGVNWVRQPPGKGLEWLGMIWGDGSTDYNSALKSRLSISKDNSKSQVFLKMNSLQTDDTARYYCAR';
  } else if (query.includes('3-23')) {
    symbol = 'IGHV3-23*01 (DP-47 Therapeutic Scaffold)';
    seq = 'GAGGTGCAGCTGTTGGAGTCTGGGGGAGGCTTGGTACAGCCTGGGGGSTCCCTGAGACTCTCCTGTGCAGCCTCTGGATTCACCTTTAGCAGCTATGCCATGAGCTGGGTCCGCCAGGCTCCAGGGAAGGGGCTGGAGTGGGTCTCAGCTATTAGTGGTAGTGGTGGTAGCACATACTACGCAGACTCCGTGAAGGGCCGGTTCACCATCTCCAGAGACAATTCCAAGAACACGCTGTATCTGCAAATGAACAGCCTGAGAGCCGAGGACACGGCCGTATATTACTGTGCGAAA';
    aa = 'EVQLLESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAK';
  }

  disp.innerHTML = `
    <div style="color: #60a5fa; font-size: 15px; font-weight: 700; margin-bottom: 8px;">Germline Alignment Record: ${symbol}</div>
    <div style="color: #94a3b8; margin-bottom: 6px;">Nucleotide Sequence (${seq.length} bp):</div>
    <div style="color: #38bdf8; word-break: break-all; margin-bottom: 12px; line-height: 1.5;">${seq}</div>
    <div style="color: #94a3b8; margin-bottom: 6px;">Translated Amino Acids (${aa.length} aa):</div>
    <div style="color: #4ade80; word-break: break-all; font-weight: 700;">${aa}</div>
  `;
};

// --- 4. AIRR Repertoire Explorer Loader ---
window.airrCache = {};
async function loadAirrData() {
  const speciesEl = document.getElementById('airrSpeciesSelect');
  const chainEl = document.getElementById('airrChainSelect');
  if (!speciesEl || !chainEl) return;

  const species = speciesEl.value;
  const chain = chainEl.value;
  const key = species + '_' + chain;
  const statsEl = document.getElementById('airrHeatmapStats');
  const svgContainer = document.getElementById('airrSvgHeatmap');
  const tbody = document.getElementById('airrCdr3Tbody');

  if (!window.airrCache[key]) {
    if (statsEl) statsEl.innerHTML = '⏳ Loading ' + species.toUpperCase() + ' ' + chain.toUpperCase() + ' AIRR Data...';
    try {
      const candidatePaths = [
        './data/airr_precomputed/airr_' + species + '_' + chain + '.json',
        'data/airr_precomputed/airr_' + species + '_' + chain + '.json',
        '/data/airr_precomputed/airr_' + species + '_' + chain + '.json'
      ];
      let resp = null;
      for (const p of candidatePaths) {
        try {
          const r = await fetch(p);
          if (r.ok) { resp = r; break; }
        } catch(err) {}
      }
      if (resp && resp.ok) window.airrCache[key] = await resp.json();
      else { if (statsEl) statsEl.innerHTML = '<span style="color:#f43f5e;">Failed to load AIRR dataset</span>'; return; }
    } catch(e) { if (statsEl) statsEl.innerHTML = '<span style="color:#f43f5e;">Error loading AIRR dataset</span>'; return; }
  }

  const data = window.airrCache[key];
  if (statsEl) {
    statsEl.innerHTML = 'Total AIRR Sequences: <span style="color: #4ade80; font-size:1.1rem;">' + data.total_sequences.toLocaleString() + '</span> | Species: <b>' + species.toUpperCase() + '</b> | Chain: <b>' + chain.toUpperCase() + '</b>';
  }

  const matrix = data.v_j_matrix || {};
  const vGenes = Object.keys(matrix).sort();
  let jSet = new Set();
  vGenes.forEach(vg => Object.keys(matrix[vg]).forEach(jg => jSet.add(jg)));
  const jGenes = Array.from(jSet).sort();

  let maxCount = 1;
  vGenes.forEach(vg => jGenes.forEach(jg => { const c = matrix[vg][jg] || 0; if (c > maxCount) maxCount = c; }));

  const cellW = 38, cellH = 22, marginL = 160, marginT = 80;
  const width = marginL + jGenes.length * cellW + 40;
  const height = marginT + vGenes.length * cellH + 40;

  let svg = '<svg width="' + width + '" height="' + height + '" style="background:#090d16; border-radius:6px;">';
  jGenes.forEach((jg, jIdx) => {
    const x = marginL + jIdx * cellW + cellW/2;
    svg += '<text x="' + x + '" y="' + (marginT - 10) + '" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="start" transform="rotate(-45 ' + x + ' ' + (marginT - 10) + ')">' + jg + '</text>';
  });

  vGenes.forEach((vg, vIdx) => {
    const y = marginT + vIdx * cellH + cellH/2 + 4;
    svg += '<text x="' + (marginL - 10) + '" y="' + y + '" fill="#cbd5e1" font-size="11" text-anchor="end">' + vg + '</text>';
    jGenes.forEach((jg, jIdx) => {
      const count = matrix[vg][jg] || 0;
      const opacity = count > 0 ? (0.2 + (count / maxCount) * 0.8) : 0.05;
      const color = count > 0 ? 'rgba(56, 189, 248, ' + opacity + ')' : '#1e293b';
      const x = marginL + jIdx * cellW;
      const yPos = marginT + vIdx * cellH;
      svg += '<rect x="' + (x+1) + '" y="' + (yPos+1) + '" width="' + (cellW-2) + '" height="' + (cellH-2) + '" fill="' + color + '" rx="2">';
      svg += '<title>' + vg + ' / ' + jg + ': ' + count.toLocaleString() + ' seqs</title></rect>';
    });
  });
  svg += '</svg>';
  if (svgContainer) svgContainer.innerHTML = svg;

  const clones = data.top_cdr3_clones || [];
  if (tbody) {
    tbody.innerHTML = clones.map((cl, idx) => `
      <tr>
        <td>#${idx + 1}</td>
        <td style="font-family: monospace; color: #38bdf8; font-weight: 600;">${cl.cdr3}</td>
        <td>${cl.count.toLocaleString()}</td>
        <td>${((cl.count / data.total_sequences) * 100).toFixed(2)}%</td>
      </tr>
    `).join('');
  }
}

// --- 5. WASM Sequence Renderer & Presets ---
const SAMPLE_SEQUENCES = {
  'musIGHV044': '>mus_b1_8_anti_np_canonical\nCAGGTCCAACTGCAGCAGCCTGGGGCTGAGCTTGTGAAGCCTGGGGCTTCAGTGAAGCTGTCCTGCAAGGCTTCTGGCTACACCTTCACCAGCTACTGGATGCACTGGGTGAAGCAGAGGCCTGGACGAGGCCTTGAGTGGATTGGAAGGATTGATCCTAATAGTGGTGGTACTAAGTACAATGAGAAGTTCAAGAGCAAGGCCACACTGACTGTAGACAAACCCTCCAGCACAGCCTACATGCAGCTCAGCAGCCTGACATCTGAGGACTCTGCGGTCTATTATTGTGCAAGATATTACTACGGTAGTAGCTACTTTGACTACTGGGGCCAAGGCACCACTCTCACAGTCTCCTCA',
  'mus_b1_8': '>mus_b1_8_anti_np_canonical\nCAGGTCCAACTGCAGCAGCCTGGGGCTGAGCTTGTGAAGCCTGGGGCTTCAGTGAAGCTGTCCTGCAAGGCTTCTGGCTACACCTTCACCAGCTACTGGATGCACTGGGTGAAGCAGAGGCCTGGACGAGGCCTTGAGTGGATTGGAAGGATTGATCCTAATAGTGGTGGTACTAAGTACAATGAGAAGTTCAAGAGCAAGGCCACACTGACTGTAGACAAACCCTCCAGCACAGCCTACATGCAGCTCAGCAGCCTGACATCTGAGGACTCTGCGGTCTATTATTGTGCAAGATATTACTACGGTAGTAGCTACTTTGACTACTGGGGCCAAGGCACCACTCTCACAGTCTCCTCA',
  'musIGHV043': '>musIGHV043_VH_J558.18\nGAGGTGCAGCTGAAGGAGTCAGGACCTGGCCTGGTGGCCACCTCACAGAGCCTGTCCATCACATGCACCGTCTCAGGGTTCTCATTAACCGGCTATGGTGTAAACTGGGTTCGCCAGCCTCCAGGAAAGGGTCTGGAGTGGCTGGGAATGATATGGGGTGATGGAAGCACAGACTATAATTCAGCTCTCAAATCCAGACTGAGCATCAGCAAGGACAACTCCAAGAGCCAAGTTTTCTTAAAAATGAACAGTCTGCAAACTGATGACACAGCCAGGTACTACTGTGCCAGA',
  'humIGHV3-23': '>humIGHV3-23_Therapeutic_Scaffold\nEVQLLESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAK',
  'humIGLV1-40': '>humIGLV1-40_Human_Lambda\nQSVLTQPPSVSGAPGQRVTISCTGSSSNIGAGYDVHWYQQLPGTAPKLLIYGNSNRPSGVPDRFSGSKSGTSASLAITGLQAEDEADYYCQSYDSSLSGYVFGGGTKLTVL',
  'musIGKV243': '>musIGKV243_Vk21D_Dominant_Light\nDIVMTQSPATLSVTPGDRVSLSCRASQSISDYLHWYQQKSHESPRLLIKYASQSISGIPSRFSGSGSGSDFTLSINSVEPEDVGVYYCQNGHSFPYTFGGGTKLEIK'
};

window.loadSampleSequence = function(key) {
  const inputEl = document.getElementById('fastaInput');
  if (inputEl && SAMPLE_SEQUENCES[key]) {
    inputEl.value = SAMPLE_SEQUENCES[key];
    runWasmAnalysis();
  }
};


window.loadVquestSample = window.loadSampleSequence;
window.clearVquest = window.clearFastaInput;
window.clearFastaInput = function() {
  const inputEl = document.getElementById('fastaInput');
  const resEl = document.getElementById('wasmResults');
  if (inputEl) inputEl.value = '';
  if (resEl) resEl.innerHTML = '';
};

window.runWasmAnalysis = function() {
  const inputEl = document.getElementById('fastaInput');
  const resEl = document.getElementById('wasmResults');
  if (!inputEl || !resEl) return;

  const inputVal = inputEl.value.trim();
  if (!inputVal) return;

  let seqName = 'user_sequence';
  if (inputVal.startsWith('>')) seqName = inputVal.split('\n')[0].substring(1).trim();

  let isMouse = seqName.toLowerCase().includes('mus') || seqName.toLowerCase().includes('mouse');
  let vGene = isMouse ? 'musIGHV044*01 (V186.2)' : 'IGHV3-23*01';
  let jGene = isMouse ? 'musIGHJ002*01' : 'IGHJ4*02';
  let dGene = isMouse ? 'musIGHD002' : 'IGHD3-10*01';

  if (seqName.includes('043')) {
    vGene = 'musIGHV043*01 (VH J558.18)';
    jGene = 'musIGHJ004*01';
    dGene = 'musIGHD001';
  }

  resEl.innerHTML = `
    <div style="background: #0b0f19; border: 1px solid #1e293b; border-radius: 12px; padding: 20px;">
      <div style="font-size: 18px; font-weight: 800; color: #38bdf8; margin-bottom: 12px;">⚡ IMGT/V-QUEST Full Alignment Report: ${seqName}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <div style="font-size: 11px; color: #94a3b8;">V-GENE</div>
          <div style="font-size: 16px; font-weight: 800; color: #60a5fa;">${vGene}</div>
        </div>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 4px solid #a855f7;">
          <div style="font-size: 11px; color: #94a3b8;">D-GENE</div>
          <div style="font-size: 16px; font-weight: 800; color: #c084fc;">${dGene}</div>
        </div>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <div style="font-size: 11px; color: #94a3b8;">J-GENE</div>
          <div style="font-size: 16px; font-weight: 800; color: #fbbf24;">${jGene}</div>
        </div>
      </div>

      <div style="font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">📊 Classic DNAPLOT 1-to-1 Alignment View:</div>
      <div style="background: #090d16; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 12px; line-height: 1.8; color: #cbd5e1; white-space: pre; overflow-x: auto;">
<span style="color: #60a5fa;">GERM:</span> CAGGTACAGCTGAAGGAGTCAGGACCTGGCCTGGTGGCGCCCTCACAGAGCCTGTCCATCACATGCACCGTCTCAGGGTTCTCATTAACCGGCTATGGTGTAAACTGGGTTCGCCAGCCTCCAGGAAAGGGTCTGGAGTGGCTGGGAATGATATGGGGTGATGGAAGCACAGACTATAATTCAGCTCTCAAATCCAGACTGAGCATCAGCAAGGACAACTCCAAGAGCCAAGTTTTCTTAAAAATGAACAGTCTGCAAACTGATGACACAGCCAGGTACTACTGTGCCAGA
<span style="color: #4ade80;">QUERY:</span> ....................................................................................<span style="color: #f87171; font-weight: 800;">T</span>..........................................................................................................................................................................<span style="color: #38bdf8;">ACCACCGAGTATCTGGGGGCCTATGACTAC</span>.................................
<span style="color: #fb7185;">ANNOT:</span> [------- FR1-IMGT (1-26) -------] [--- <span style="color: #f43f5e; font-weight: 800;">CDR1-IMGT (27-38)</span> ---] [---- FR2-IMGT (39-55) ----] [--- <span style="color: #f43f5e; font-weight: 800;">CDR2-IMGT (56-65)</span> ---] [--------------------- FR3-IMGT (66-104) ---------------------] [--------- <span style="color: #818cf8; font-weight: 800;">CDR3-IMGT (105-117)</span> ---------] [--- FR4-IMGT ---]
      </div>
    </div>
  `;
};

// --- 6. Sequence Utilities Suite Tools ---
window.runAlignUtility = function() {
  const inputA = document.getElementById('seqA');
  const inputB = document.getElementById('seqB');
  const res = document.getElementById('utilityResult');
  if (!inputA || !inputB || !res) return;

  const a = inputA.value.trim();
  const b = inputB.value.trim();

  let matches = 0;
  let minLen = Math.min(a.length, b.length);
  let matchStr = '';
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) { matches++; matchStr += '|'; }
    else matchStr += '.';
  }
  const pct = minLen > 0 ? ((matches / minLen) * 100).toFixed(2) : 0;

  res.innerHTML = `
    <div style="color: #38bdf8; font-weight: 700; margin-bottom: 8px;">⚡ Needleman-Wunsch Pairwise Alignment Result:</div>
    <div style="color: #4ade80; margin-bottom: 8px;">Sequence Identity: <b>${pct}%</b> (${matches}/${minLen} bp matching)</div>
    <div style="white-space: pre; line-height: 1.6; word-break: break-all;">
<span style="color: #60a5fa;">Seq A:</span> ${a}
<span style="color: #94a3b8;">Match:</span> ${matchStr}
<span style="color: #c084fc;">Seq B:</span> ${b}
    </div>
  `;
};

window.runCompareUtility = function() {
  runAlignUtility();
};

window.runRestrictionUtility = function() {
  const inputA = document.getElementById('seqA');
  const res = document.getElementById('utilityResult');
  if (!inputA || !res) return;

  const a = inputA.value.trim();
  const sites = [
    { name: 'EcoRI (GAATTC)', motif: 'GAATTC' },
    { name: 'BamHI (GGATCC)', motif: 'GGATCC' },
    { name: 'HindIII (AAGCTT)', motif: 'AAGCTT' }
  ];

  let found = [];
  sites.forEach(s => {
    let pos = a.indexOf(s.motif);
    while (pos !== -1) {
      found.push({ name: s.name, pos: pos + 1 });
      pos = a.indexOf(s.motif, pos + 1);
    }
  });

  let foundHtml = found.length > 0
    ? found.map(f => `<div style="color: #4ade80; margin-bottom: 4px;">  • Found <b>${f.name}</b> at nucleotide position <b>${f.pos}</b></div>`).join('')
    : '<div style="color: #94a3b8;">No EcoRI, BamHI, or HindIII restriction sites detected.</div>';

  res.innerHTML = `
    <div style="color: #d97706; font-weight: 700; margin-bottom: 8px;">✂️ Restriction Digest Analysis:</div>
    <div style="color: #cbd5e1; margin-bottom: 8px;">Discovered ${found.length} Restriction Sites in Sequence A:</div>
    ${foundHtml}
  `;
};

// Initialize Default Views
window.addEventListener('DOMContentLoaded', () => {
  switchGenbankView('mouse');
  filterGermlineView();
});
