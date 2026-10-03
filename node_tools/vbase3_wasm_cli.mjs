#!/usr/bin/env node
/**
 * VBASE3 WebAssembly CLI Engine (Node.js)
 * =======================================
 * Runs DNAPLOT V(D)J antibody sequence alignment, synthesis boundary auditing,
 * sequence trimming, and gene lookups directly from the command line using the
 * zero-overhead WebAssembly build.
 *
 * Usage:
 *   node developer_scripts/vbase3_wasm_cli.mjs --seq "CAGGTACAGCTG..."
 *   node developer_scripts/vbase3_wasm_cli.mjs --sample musIGHV044
 *   node developer_scripts/vbase3_wasm_cli.mjs --lookup IGHV3-23 --species human
 *   node developer_scripts/vbase3_wasm_cli.mjs --audit-boundary "EVQL...TVSSGSA"
 *   node developer_scripts/vbase3_wasm_cli.mjs --trim-boundary "EVQL...TVSSGSA"
 *   node developer_scripts/vbase3_wasm_cli.mjs --biophysics "CSRWGGDGFYAMDYW"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Universal Module Resolution
const jsCandidates = [
  path.join(__dirname, '../web/static/pkg/dnaplot_wasm.js'),
  path.join(__dirname, '../gh_pages/pkg/dnaplot_wasm.js'),
  path.join(__dirname, '../../web/static/pkg/dnaplot_wasm.js'),
  path.join(__dirname, './pkg/dnaplot_wasm.js'),
  path.join(ROOT_DIR, 'web/static/pkg/dnaplot_wasm.js'),
  path.join(ROOT_DIR, 'gh_pages/pkg/dnaplot_wasm.js')
];

const jsPath = jsCandidates.find(p => fs.existsSync(p));
if (!jsPath) {
  process.stderr.write(`[VBASE3-CLI] Cannot locate dnaplot_wasm.js. Searched:\n${jsCandidates.map(c => ' - ' + c).join('\n')}\n`);
  process.exit(1);
}

const wasmCandidates = [
  path.join(path.dirname(jsPath), 'dnaplot_wasm_bg.wasm'),
  path.join(ROOT_DIR, 'web/static/pkg/dnaplot_wasm_bg.wasm'),
  path.join(ROOT_DIR, 'gh_pages/pkg/dnaplot_wasm_bg.wasm'),
  path.join(__dirname, './pkg/dnaplot_wasm_bg.wasm')
];
const wasmPath = wasmCandidates.find(p => fs.existsSync(p));
if (!wasmPath) {
  process.stderr.write(`[VBASE3-CLI] Cannot locate dnaplot_wasm_bg.wasm.\n`);
  process.exit(1);
}

const wasmModule = await import(pathToFileURL(jsPath).href);
const { initSync, analyze_sequence, analyze_sequence_universal, version } = wasmModule;

try {
  const wasmBuffer = fs.readFileSync(wasmPath);
  initSync({ module: wasmBuffer });
} catch (err) {
  process.stderr.write(`[VBASE3-CLI] Failed to initialize WASM engine: ${err.message}\n`);
  process.exit(1);
}

// 2. Catalog Path Resolution
const catalogCandidates = [
  path.join(ROOT_DIR, 'data/vbase3/export/vbase3_class1_master_catalog.tsv'),
  path.join(ROOT_DIR, 'datasets/vbase3_class1_master_catalog.tsv'),
  path.join(__dirname, '../datasets/vbase3_class1_master_catalog.tsv'),
  path.join(__dirname, '../../datasets/vbase3_class1_master_catalog.tsv'),
  path.join(__dirname, '../../data/vbase3/export/vbase3_class1_master_catalog.tsv')
];
const CATALOG_PATH = catalogCandidates.find(p => fs.existsSync(p)) || catalogCandidates[0];

const rosettaCandidates = [
  path.join(ROOT_DIR, 'data/vbase3/export/vbase3_crossreference_table.tsv'),
  path.join(ROOT_DIR, 'datasets/vbase3_crossreference_table.tsv'),
  path.join(__dirname, '../datasets/vbase3_crossreference_table.tsv'),
  path.join(__dirname, '../../datasets/vbase3_crossreference_table.tsv'),
  path.join(__dirname, '../../data/vbase3/export/vbase3_crossreference_table.tsv')
];
const ROSETTA_PATH = rosettaCandidates.find(p => fs.existsSync(p)) || rosettaCandidates[0];

const functionalCandidates = [
  path.join(ROOT_DIR, 'data/vbase3/functional'),
  path.join(__dirname, '../data/vbase3/functional'),
  path.join(__dirname, '../../data/vbase3/functional')
];
const FUNCTIONAL_DIR = functionalCandidates.find(p => fs.existsSync(p)) || null;

// 3. Synthesis Boundary Rules
const SYNTHESIS_RULES = {
  heavy: { motifs: ['TVSS', 'TVSA'], pos: 122, name: 'Heavy Chain' },
  kappa: { motifs: ['VEIK', 'LEIK', 'LELK', 'VDIK', 'LDIK'], pos: 117, name: 'Kappa Light Chain' },
  lambda: { motifs: ['TVL', 'TAL'], pos: 117, name: 'Lambda Light Chain' },
  tcr_beta: { motifs: ['NTIYF', 'SYEQYF', 'ETQYF', 'QPQHF', 'TQYF', 'YEQYF', 'GNTIYF', 'EQYF', 'PQHF'], pos: 117 },
  tcr_alpha: { motifs: ['GNLIF', 'NMLTF', 'RLMF', 'QGNLIF', 'LTF', 'LIF'], pos: 117 },
  tcr_gamma: { motifs: ['TTGW', 'SSWD', 'TGW'], pos: 117 },
  tcr_delta: { motifs: ['TDKL', 'TDQL', 'KLIF'], pos: 117 }
};

function verifyBoundary(seq, chainHint = 'auto') {
  const clean = seq.toUpperCase().replace(/[^A-Z]/g, '');
  let detectedType = chainHint;
  let matchingMotif = null;
  let isValid = false;
  let excess = '';

  const checkMotifs = (motifs) => {
    for (const m of motifs) {
      const idx = clean.lastIndexOf(m);
      if (idx !== -1) {
        if (idx + m.length === clean.length) {
          return { valid: true, motif: m, excess: '' };
        } else {
          return { valid: false, motif: m, excess: clean.substring(idx + m.length) };
        }
      }
    }
    return null;
  };

  if (chainHint === 'heavy' || chainHint === 'auto') {
    const res = checkMotifs(SYNTHESIS_RULES.heavy.motifs);
    if (res) { detectedType = 'heavy'; isValid = res.valid; matchingMotif = res.motif; excess = res.excess; }
  }
  if (!matchingMotif && (chainHint === 'kappa' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.kappa.motifs);
    if (res) { detectedType = 'kappa'; isValid = res.valid; matchingMotif = res.motif; excess = res.excess; }
  }
  if (!matchingMotif && (chainHint === 'lambda' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.lambda.motifs);
    if (res) { detectedType = 'lambda'; isValid = res.valid; matchingMotif = res.motif; excess = res.excess; }
  }
  if (!matchingMotif && (chainHint === 'tcr_beta' || chainHint === 'trb' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_beta.motifs);
    if (res) { detectedType = 'tcr_beta'; isValid = res.valid; matchingMotif = res.motif; excess = res.excess; }
  }
  if (!matchingMotif && (chainHint === 'tcr_alpha' || chainHint === 'tra' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_alpha.motifs);
    if (res) { detectedType = 'tcr_alpha'; isValid = res.valid; matchingMotif = res.motif; excess = res.excess; }
  }

  return {
    sequence_length: clean.length,
    detected_chain_type: detectedType,
    canonical_motif_found: matchingMotif,
    is_synthesis_compliant: isValid,
    trailing_constant_residues: excess,
    recommendation: isValid 
      ? "Sequence is 100% compliant for synthesis (zero constant region bleed-through)."
      : (matchingMotif 
          ? `Remove trailing constant region residues '${excess}' to terminate cleanly at '${matchingMotif}'.`
          : "No canonical IMGT/TCR synthesis boundary motif detected. Verify C-terminal junction.")
  };
}

function trimBoundary(seq, dna = '', chainHint = 'auto') {
  const clean = seq.toUpperCase().replace(/[^A-Z]/g, '');
  const audit = verifyBoundary(clean, chainHint);
  if (audit.is_synthesis_compliant) {
    return { is_trimmed: false, original_length: clean.length, trimmed_length: clean.length, trimmed_peptide: clean, trimmed_dna: dna, boundary_motif: audit.canonical_motif_found, removed_residues: '' };
  }
  if (audit.canonical_motif_found) {
    const idx = clean.lastIndexOf(audit.canonical_motif_found);
    const trimmed = clean.substring(0, idx + audit.canonical_motif_found.length);
    let trimmedDna = dna ? dna.trim() : '';
    if (trimmedDna && trimmedDna.length >= trimmed.length * 3) {
      trimmedDna = trimmedDna.substring(0, trimmed.length * 3);
    }
    return {
      is_trimmed: true,
      original_length: clean.length,
      trimmed_length: trimmed.length,
      trimmed_peptide: trimmed,
      trimmed_dna: trimmedDna,
      boundary_motif: audit.canonical_motif_found,
      removed_residues: audit.trailing_constant_residues
    };
  }
  return { is_trimmed: false, original_length: clean.length, trimmed_length: clean.length, trimmed_peptide: clean, trimmed_dna: dna, boundary_motif: null, removed_residues: '', warning: 'No canonical motif found.' };
}

// 4. Biophysics
const KYTE_DOOLITTLE = {
  A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
  H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
  T: -0.7, W: -0.9, Y: -1.3, V: 4.2
};

function calculateBiophysics(cdr3) {
  const clean = cdr3.toUpperCase().replace(/[^A-Z]/g, '');
  let hydroSum = 0;
  let charge = 0;
  for (const aa of clean) {
    if (KYTE_DOOLITTLE[aa] !== undefined) hydroSum += KYTE_DOOLITTLE[aa];
    if (aa === 'K' || aa === 'R') charge += 1;
    else if (aa === 'H') charge += 0.1;
    else if (aa === 'D' || aa === 'E') charge -= 1;
  }
  const meanHydro = clean.length > 0 ? (hydroSum / clean.length) : 0;
  return {
    cdr3_sequence: clean,
    length_amino_acids: clean.length,
    net_charge_ph74: Math.round(charge * 10) / 10,
    mean_kyte_doolittle_hydropathy: Math.round(meanHydro * 100) / 100,
    solubility_class: meanHydro > 0 ? "Hydrophobic (Risk of Aggregation)" : "Hydrophilic (Favorable Paratope Profile)",
    charge_class: charge > 1.5 ? "Polybasic (+)" : (charge < -1.5 ? "Polyanionic (-)" : "Neutral / Balanced")
  };
}

// 5. Multi-Tier Gene Resolver (Stratum 3 Master Catalog -> Rosetta Stone -> Stratum 2 Locus Germlines)
function normalizeKey(s) {
  return s ? s.toUpperCase().replace(/[-*_\/\s]/g, '') : '';
}

class GeneResolver {
  constructor() {
    this.masterIndex = new Map();
    this.rosettaIndex = new Map();
    this.functionalIndex = new Map();
    this.loadCatalogs();
  }

  loadCatalogs() {
    if (fs.existsSync(CATALOG_PATH)) {
      const lines = fs.readFileSync(CATALOG_PATH, 'utf-8').split('\n');
      const headers = lines[0].split('\t').map(h => h.trim());
      const idxGid = headers.indexOf('gene_id');
      const idxSp = headers.indexOf('species');
      const idxSeg = headers.indexOf('segment_type');
      const idxChain = headers.indexOf('chain_type');
      const idxSeq = headers.indexOf('aa_sequence');
      const idxRef = headers.indexOf('reference_or_accession');
      const idxPdb = headers.indexOf('pdb_id');
      const idxAf = headers.indexOf('alphafold_db_id');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('\t');
        const gid = parts[idxGid] || '';
        const rec = {
          gene_id: gid,
          systematic_id: gid,
          reference_or_accession: parts[idxRef] || gid,
          species: parts[idxSp] || '',
          chain: parts[idxChain] || 'Unknown',
          segment_type: parts[idxSeg] || 'V-GENE',
          class: 'Class I (Confirmed Functional)',
          reference_stratum: 'Stratum 3 (Class I Master Export)',
          mature_aa_sequence: parts[idxSeq] || '',
          cys104_anchor: (parts[idxSeq] || '').endsWith('C') ? 'Cys104 Present' : 'N/A',
          pdb_id: parts[idxPdb] || '',
          alphafold_db_id: parts[idxAf] || '',
          source_file: 'vbase3_class1_master_catalog.tsv'
        };
        const nGid = normalizeKey(gid);
        this.masterIndex.set(nGid, rec);
        if (parts[idxRef]) {
          this.masterIndex.set(normalizeKey(parts[idxRef]), rec);
        }
      }
    }

    if (fs.existsSync(ROSETTA_PATH)) {
      const lines = fs.readFileSync(ROSETTA_PATH, 'utf-8').split('\n');
      const headers = lines[0].split('\t').map(h => h.trim());
      const idxSys = headers.indexOf('systematic_id');
      const idxTom = headers.indexOf('vbase1_tomlinson_name');
      const idxV2 = headers.indexOf('vbase2_id');
      const idxV2All = headers.indexOf('vbase2_all_ids');
      const idxImgt = headers.indexOf('imgt_name');
      const idxImgtAll = headers.indexOf('imgt_all_names');
      const idxKabat = headers.indexOf('kabat_id');
      const idxKabatAll = headers.indexOf('kabat_all_ids');
      const idxEbi = headers.indexOf('ebi_accessions');
      const idxSp = headers.indexOf('species');
      const idxSeg = headers.indexOf('segment_type');
      const idxChain = headers.indexOf('chain_type');
      const idxClass = headers.indexOf('vbase3_class');
      const idxSeq = headers.indexOf('mature_aa_seq');
      const idxPdb = headers.indexOf('pdb_id');
      const idxAf = headers.indexOf('alphafold_db_id');

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('\t');
        const sysId = parts[idxSys] || '';
        const isInMaster = this.masterIndex.has(normalizeKey(sysId));
        const rec = {
          gene_id: sysId,
          systematic_id: sysId,
          vbase1_tomlinson_name: parts[idxTom] || '-',
          vbase2_id: parts[idxV2] || '-',
          imgt_name: parts[idxImgt] || '-',
          imgt_all_names: parts[idxImgtAll] || '-',
          kabat_id: parts[idxKabat] || '-',
          ebi_accessions: parts[idxEbi] || '-',
          species: parts[idxSp] || '',
          segment_type: parts[idxSeg] || 'V-GENE',
          chain: parts[idxChain] || 'Unknown',
          class: isInMaster ? 'Class I (Confirmed Functional)' : 'Class II (Germline Only)',
          reference_stratum: isInMaster ? 'Stratum 3 (Class I Master Export)' : 'Stratum 2 (Locus Germline - Internal Research Partition)',
          mature_aa_sequence: parts[idxSeq] || '',
          cys104_anchor: (parts[idxSeq] || '').endsWith('C') ? 'Cys104 Present' : 'N/A',
          pdb_id: parts[idxPdb] || '',
          alphafold_db_id: parts[idxAf] || '',
          source_file: 'vbase3_crossreference_table.tsv'
        };

        if (isInMaster) {
          const masterRec = this.masterIndex.get(normalizeKey(sysId));
          if (masterRec) {
            if (parts[idxImgt] && parts[idxImgt] !== '-') masterRec.imgt_name = parts[idxImgt];
            if (parts[idxTom] && parts[idxTom] !== '-') masterRec.vbase1_tomlinson_name = parts[idxTom];
            if (parts[idxV2] && parts[idxV2] !== '-') masterRec.vbase2_id = parts[idxV2];
            if (parts[idxV2All] && parts[idxV2All] !== '-') masterRec.vbase2_all_ids = parts[idxV2All];
            if (parts[idxImgtAll] && parts[idxImgtAll] !== '-') masterRec.imgt_all_names = parts[idxImgtAll];
          }
        }

        const keys = [sysId, parts[idxTom], parts[idxV2], parts[idxImgt], parts[idxKabat]];
        if (parts[idxImgtAll] && parts[idxImgtAll] !== '-') {
          parts[idxImgtAll].split(/[;,|]/).forEach(k => keys.push(k.trim()));
        }
        if (parts[idxV2All] && parts[idxV2All] !== '-') {
          parts[idxV2All].split(/[;,|]/).forEach(k => keys.push(k.trim()));
        }
        if (parts[idxKabatAll] && parts[idxKabatAll] !== '-') {
          parts[idxKabatAll].split(/[;,|]/).forEach(k => keys.push(k.trim()));
        }
        if (parts[idxEbi] && parts[idxEbi] !== '-') {
          parts[idxEbi].split(/[;,|]/).forEach(k => keys.push(k.trim()));
        }

        for (const k of keys) {
          if (k && k !== '-') {
            const nk = normalizeKey(k);
            if (!this.rosettaIndex.has(nk)) {
              this.rosettaIndex.set(nk, rec);
            }
          }
        }
      }
    }

    if (FUNCTIONAL_DIR && fs.existsSync(FUNCTIONAL_DIR)) {
      const files = fs.readdirSync(FUNCTIONAL_DIR).filter(f => f.endsWith('.tsv'));
      for (const f of files) {
        const p = path.join(FUNCTIONAL_DIR, f);
        const lines = fs.readFileSync(p, 'utf-8').split('\n');
        if (lines.length < 2) continue;
        const headers = lines[0].split('\t').map(h => h.trim());
        const idxGid = headers.indexOf('gene_id');
        const idxSp = headers.indexOf('species');
        const idxChain = headers.indexOf('chain_type');
        const idxClass = headers.indexOf('vbase3_class');
        const idxSeq = headers.indexOf('v_aa_seq');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split('\t');
          const gid = parts[idxGid] || '';
          if (!gid) continue;
          const rec = {
            gene_id: gid,
            systematic_id: gid,
            species: parts[idxSp] || '',
            chain: parts[idxChain] || 'Heavy',
            segment_type: 'V-GENE',
            class: parts[idxClass] || 'Class II (Germline Only)',
            reference_stratum: 'Stratum 2 (Locus Germline - Internal Research Partition)',
            mature_aa_sequence: parts[idxSeq] || '',
            cys104_anchor: (parts[idxSeq] || '').endsWith('C') ? 'Cys104 Present' : 'N/A',
            source_file: `data/vbase3/functional/${f}`
          };
          const nk = normalizeKey(gid);
          if (!this.functionalIndex.has(nk)) {
            this.functionalIndex.set(nk, rec);
          }
        }
      }
    }
  }

  resolve(query, speciesHint = 'auto') {
    if (!query) return null;
    const raw = query.trim().replace(/^\[|\]$/g, '').split(' ')[0];
    const nk = normalizeKey(raw);
    const normSp = speciesHint && speciesHint !== 'auto' ? speciesHint.toLowerCase().trim() : null;

    const isSpMatch = (rSp) => {
      if (!normSp) return true;
      const rsp = (rSp || '').toLowerCase();
      if (rsp.includes(normSp) || normSp.includes(rsp)) return true;
      if ((rsp.includes('human') || rsp.includes('homo')) && (normSp.includes('human') || normSp.includes('homo'))) return true;
      if ((rsp.includes('mouse') || rsp.includes('mus')) && (normSp.includes('mouse') || normSp.includes('mus'))) return true;
      return false;
    };

    // 1. Direct Master Catalog match (Stratum 3)
    if (this.masterIndex.has(nk)) {
      const r = this.masterIndex.get(nk);
      if (isSpMatch(r.species)) return r;
    }

    // 2. Rosetta Stone match (Stratum 3 cross-ref or Stratum 2)
    if (this.rosettaIndex.has(nk)) {
      const r = this.rosettaIndex.get(nk);
      if (isSpMatch(r.species)) return r;
    }

    // 3. Functional Locus match (Stratum 2)
    if (this.functionalIndex.has(nk)) {
      const r = this.functionalIndex.get(nk);
      if (isSpMatch(r.species)) return r;
    }

    // 4. Substring / Prefix match across Master Catalog
    for (const [key, r] of this.masterIndex.entries()) {
      if (key.includes(nk) || nk.includes(key)) {
        if (isSpMatch(r.species)) return r;
      }
    }

    // 5. Substring across Rosetta Stone
    for (const [key, r] of this.rosettaIndex.entries()) {
      if (key.includes(nk) || nk.includes(key)) {
        if (isSpMatch(r.species)) return r;
      }
    }

    // 6. Substring across Functional Locus
    for (const [key, r] of this.functionalIndex.entries()) {
      if (key.includes(nk) || nk.includes(key)) {
        if (isSpMatch(r.species)) return r;
      }
    }

    return null;
  }
}

const geneResolver = new GeneResolver();

function lookupGene(geneId, speciesHint = 'auto') {
  const match = geneResolver.resolve(geneId, speciesHint);
  if (match) {
    return match;
  }
  return { error: `Gene '${geneId}' not found for species '${speciesHint}'. Checked Stratum 3 Master Catalog, Rosetta Stone Cross-References, and Stratum 2 Locus Germlines.` };
}

// 6. Samples
const SAMPLES = {
  'musIGHV044': {
    name: 'mus_b1_8_anti_np_canonical',
    species: 'mouse',
    chain: 'heavy',
    seq: 'CAGGTCCAACTGCAGCAGCCTGGGGCTGAGCTTGTGAAGCCTGGGGCTTCAGTGAAGCTGTCCTGCAAGGCTTCTGGCTACACCTTCACCAGCTACTGGATGCACTGGGTGAAGCAGAGGCCTGGACGAGGCCTTGAGTGGATTGGAAGGATTGATCCTAATAGTGGTGGTACTAAGTACAATGAGAAGTTCAAGAGCAAGGCCACACTGACTGTAGACAAACCCTCCAGCACAGCCTACATGCAGCTCAGCAGCCTGACATCTGAGGACTCTGCGGTCTATTATTGTGCAAGATATTACTACGGTAGTAGCTACTTTGACTACTGGGGCCAAGGCACCACTCTCACAGTCTCCTCA'
  },
  'mus_b1_8': {
    name: 'mus_b1_8_anti_np_canonical',
    species: 'mouse',
    chain: 'heavy',
    seq: 'CAGGTCCAACTGCAGCAGCCTGGGGCTGAGCTTGTGAAGCCTGGGGCTTCAGTGAAGCTGTCCTGCAAGGCTTCTGGCTACACCTTCACCAGCTACTGGATGCACTGGGTGAAGCAGAGGCCTGGACGAGGCCTTGAGTGGATTGGAAGGATTGATCCTAATAGTGGTGGTACTAAGTACAATGAGAAGTTCAAGAGCAAGGCCACACTGACTGTAGACAAACCCTCCAGCACAGCCTACATGCAGCTCAGCAGCCTGACATCTGAGGACTCTGCGGTCTATTATTGTGCAAGATATTACTACGGTAGTAGCTACTTTGACTACTGGGGCCAAGGCACCACTCTCACAGTCTCCTCA'
  },
  'humIGHV3-23': {
    name: 'humIGHV3-23_DP47_Therapeutic',
    species: 'human',
    chain: 'heavy',
    seq: 'GAGGTGCAGCTGTTGGAGTCTGGGGGAGGCTTGGTACAGCCTGGGGGGTCCCTGAGACTCTCCTGTGCAGCCTCTGGATTCACCTTTAGCAGCTATGCCATGAGCTGGGTCCGCCAGGCTCCAGGGAAGGGGCTGGAGTGGGTCTCAGCTATTAGTGGTAGTGGTGGTAGCACATACTACGCAGACTCCGTGAAGGGCCGGTTCACCATCTCCAGAGACAATTCCAAGAACACGCTGTATCTGCAAATGAACAGCTTGAGAGCCGAGGACACGGCGGTATATTACTGTGCGAAA'
  },
  'humIGLV1-40': {
    name: 'humIGLV1-40_Human_Lambda',
    species: 'human',
    chain: 'lambda',
    seq: 'CAGTCTGTGCTGACGCAGCCGCCCTCAGTGTCTGGGGCCCCAGGGCAGAGGGTCACCATCTCCTGCACTGGGAGCAGCTCCAACATCGGGGCAGGTTATGATGTACACTGGTACCAGCAGCTTCCAGGAACAGCCCCCAAACTCCTCATCTATGGTAACAGCAATCGGCCCTCAGGGGTCCCTGACCGATTCTCTGGCTCCAAGTCTGGCACCTCAGCCTCCCTGGCCATCACTGGGCTCCAGGCTGAGGATGAGGCTGATTATTACTGCCAGTCCTATGACAGCAGCCTGAGTGGT'
  }
};

// 7. Parse CLI Arguments
const args = process.argv.slice(2);
let seqArg = '';
let fastaArg = '';
let sampleArg = '';
let speciesArg = 'auto';
let chainArg = 'auto';
let formatArg = 'pretty';
let lookupArg = '';
let auditArg = '';
let trimArg = '';
let biophysicsArg = '';
let structureArg = '';
let vlArg = '';
let pipelineArg = 'colabfold';
let identifierArg = 'antibody';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seq' && args[i + 1]) seqArg = args[++i];
  else if (args[i] === '--fasta' && args[i + 1]) fastaArg = args[++i];
  else if (args[i] === '--sample' && args[i + 1]) sampleArg = args[++i];
  else if (args[i] === '--species' && args[i + 1]) speciesArg = args[++i];
  else if (args[i] === '--chain' && args[i + 1]) chainArg = args[++i];
  else if (args[i] === '--format' && args[i + 1]) formatArg = args[++i];
  else if (args[i] === '--lookup' && args[i + 1]) lookupArg = args[++i];
  else if (args[i] === '--audit-boundary' && args[i + 1]) auditArg = args[++i];
  else if (args[i] === '--trim-boundary' && args[i + 1]) trimArg = args[++i];
  else if (args[i] === '--biophysics' && args[i + 1]) biophysicsArg = args[++i];
  else if (args[i] === '--structure' && args[i + 1]) structureArg = args[++i];
  else if (args[i] === '--vl' && args[i + 1]) vlArg = args[++i];
  else if (args[i] === '--pipeline' && args[i + 1]) pipelineArg = args[++i];
  else if (args[i] === '--identifier' && args[i + 1]) identifierArg = args[++i];
  else if (args[i] === '--help' || args[i] === '-h') {
    printHelp();
    process.exit(0);
  }
}

function printHelp() {
  console.log(`
================================================================================
  VBASE3 WebAssembly CLI Engine (Node.js) - Version ${version()}
  Comparative Immunogenomics Database • Zero External Dependencies
================================================================================
Usage:
  node vbase3_wasm_cli.mjs [options]

Sequence Analysis:
  --seq <dna>             Raw nucleotide sequence to align and annotate
  --fasta <path>          Path to FASTA file with antibody sequences
  --sample <id>           Run canonical benchmark: musIGHV044, humIGHV3-23, humIGLV1-40
  --species <name>        Species hint: human, mouse, camelid, auto (default: auto)
  --chain <name>          Chain hint: heavy, kappa, lambda, auto (default: auto)

Gene Catalog & Synthesis:
  --lookup <gene>         Sub-millisecond Class I gene lookup (e.g. IGHV3-23*01)
  --audit-boundary <aa>   Verify IMGT J-segment boundary compliance (TVSS/VEIK/TVL)
  --trim-boundary <aa>    Trim trailing constant residues to exact synthesis boundary
  --biophysics <cdr3>     Calculate loop length, charge at pH 7.4, and hydropathy

Structure Prediction:
  --structure <vh_aa>     Export formatted FASTA for 3D structure prediction
  --vl <vl_aa>            Optional paired VL sequence
  --pipeline <name>       colabfold, alphafold3, esmfold, boltz (default: colabfold)
  --identifier <id>       Name or construct ID (default: antibody)

Output:
  --format <type>         Output format: pretty, json, tsv (default: pretty)
  --help, -h              Show this help message
`);
}

// 8. Handle Dedicated Actions

// A. Gene Lookup
if (lookupArg) {
  const result = lookupGene(lookupArg, speciesArg);
  if (formatArg === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n🔎 [VBASE3 Gene Lookup] ${lookupArg}`);
    if (result.error) {
      console.log(`  ❌ ${result.error}`);
    } else {
      console.log(`  • Gene Identifier   : ${result.gene_id}`);
      if (result.systematic_id && result.systematic_id !== result.gene_id) {
        console.log(`  • Systematic ID     : ${result.systematic_id}`);
      }
      console.log(`  • Reference Stratum : ${result.reference_stratum}`);
      console.log(`  • Classification    : ${result.class}`);
      console.log(`  • Species / Chain   : ${result.species} (${result.chain} / ${result.segment_type})`);
      if (result.imgt_name && result.imgt_name !== '-') console.log(`  • IMGT Nomenclature : ${result.imgt_name}`);
      if (result.vbase1_tomlinson_name && result.vbase1_tomlinson_name !== '-') console.log(`  • Tomlinson (VBASE): ${result.vbase1_tomlinson_name}`);
      if (result.vbase2_id && result.vbase2_id !== '-') console.log(`  • VBASE2 Cross-Ref  : ${result.vbase2_id}`);
      console.log(`  • Cys104 Anchor     : ${result.cys104_anchor}`);
      console.log(`  • PDB / AlphaFold   : ${result.pdb_id || 'None'} / ${result.alphafold_db_id || 'None'}`);
      console.log(`  • Mature AA Seq     : ${result.mature_aa_sequence}`);
    }
    console.log();
  }
  process.exit(0);
}

// B. Boundary Audit
if (auditArg) {
  const result = verifyBoundary(auditArg, chainArg);
  if (formatArg === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n🛡️ [VBASE3 Synthesis Boundary Audit]`);
    console.log(`  • Input Length  : ${result.sequence_length} aa`);
    console.log(`  • Chain Type    : ${result.detected_chain_type}`);
    console.log(`  • Motif Found   : ${result.canonical_motif_found || 'None'}`);
    console.log(`  • Synthesis OK  : ${result.is_synthesis_compliant ? '✅ YES' : '❌ NO'}`);
    if (result.trailing_constant_residues) {
      console.log(`  • Trailing Residues: '${result.trailing_constant_residues}'`);
    }
    console.log(`  • Recommendation: ${result.recommendation}\n`);
  }
  process.exit(0);
}

// C. Boundary Trim
if (trimArg) {
  const result = trimBoundary(trimArg, '', chainArg);
  if (formatArg === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n✂️ [VBASE3 Synthesis Boundary Trimming]`);
    console.log(`  • Original Length: ${result.original_length} aa`);
    console.log(`  • Trimmed Length : ${result.trimmed_length} aa`);
    console.log(`  • Trimmed Status : ${result.is_trimmed ? '✂️ Constant tail removed' : '✅ Already compliant'}`);
    if (result.removed_residues) {
      console.log(`  • Removed Residues: '${result.removed_residues}'`);
    }
    console.log(`  • Boundary Motif : ${result.boundary_motif || 'None'}`);
    console.log(`  • Clean Sequence : ${result.trimmed_peptide}\n`);
  }
  process.exit(0);
}

// D. Biophysics
if (biophysicsArg) {
  const result = calculateBiophysics(biophysicsArg);
  if (formatArg === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n🧪 [VBASE3 CDR3 Biophysical Analysis]`);
    console.log(`  • CDR3 Sequence : ${result.cdr3_sequence} (${result.length_amino_acids} aa)`);
    console.log(`  • Net Charge 7.4: ${result.net_charge_ph74} (${result.charge_class})`);
    console.log(`  • Hydropathy    : ${result.mean_kyte_doolittle_hydropathy} (${result.solubility_class})\n`);
  }
  process.exit(0);
}

// E. Structure Prediction Export
if (structureArg) {
  const auditVh = verifyBoundary(structureArg, 'heavy');
  const cleanVh = auditVh.is_synthesis_compliant ? structureArg.trim() : (auditVh.canonical_motif_found ? structureArg.substring(0, structureArg.lastIndexOf(auditVh.canonical_motif_found) + auditVh.canonical_motif_found.length) : structureArg.trim());

  let cleanVl = (vlArg || '').trim();
  if (cleanVl) {
    const auditVl = verifyBoundary(cleanVl, 'auto');
    cleanVl = auditVl.is_synthesis_compliant ? cleanVl : (auditVl.canonical_motif_found ? cleanVl.substring(0, cleanVl.lastIndexOf(auditVl.canonical_motif_found) + auditVl.canonical_motif_found.length) : cleanVl);
  }

  const fmt = pipelineArg.toLowerCase().trim();
  let fasta = '';
  if (fmt === 'colabfold' || fmt === 'af_multimer' || fmt === 'alphafold' || fmt === 'alphafold3') {
    fasta = cleanVl ? `>${identifierArg}|paired\n${cleanVh}:${cleanVl}\n` : `>${identifierArg}\n${cleanVh}\n`;
  } else if (fmt === 'esmfold' || fmt === 'igfold') {
    fasta = cleanVl ? `>${identifierArg}_VH\n${cleanVh}\n>${identifierArg}_VL\n${cleanVl}\n` : `>${identifierArg}_VH\n${cleanVh}\n`;
  } else if (fmt === 'boltz' || fmt === 'chai') {
    fasta = cleanVl ? `>${identifierArg}|chain=H|entity=protein\n${cleanVh}\n>${identifierArg}|chain=L|entity=protein\n${cleanVl}\n` : `>${identifierArg}|chain=H|entity=protein\n${cleanVh}\n`;
  }

  if (formatArg === 'json') {
    console.log(JSON.stringify({
      identifier: identifierArg,
      target_pipeline: pipelineArg,
      vh_length: cleanVh.length,
      vl_length: cleanVl.length,
      formatted_fasta: fasta
    }, null, 2));
  } else {
    console.log(`\n🧬 [3D Structure Prediction FASTA (${pipelineArg})]`);
    process.stdout.write(fasta);
  }
  process.exit(0);
}

// 9. Standard Sequence Alignment
const records = [];
if (sampleArg) {
  const s = SAMPLES[sampleArg];
  if (!s) {
    console.error(`Unknown sample "${sampleArg}". Available samples: ${Object.keys(SAMPLES).join(', ')}`);
    process.exit(1);
  }
  records.push({ name: s.name, seq: s.seq, species: s.species, chain: s.chain });
} else if (seqArg) {
  records.push({ name: 'cli_query', seq: seqArg, species: speciesArg, chain: chainArg });
} else if (fastaArg) {
  const filePath = path.resolve(fastaArg);
  if (!fs.existsSync(filePath)) {
    console.error(`FASTA file not found: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  let curHeader = '';
  let curSeq = '';
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      if (curHeader && curSeq) records.push({ name: curHeader, seq: curSeq, species: speciesArg, chain: chainArg });
      curHeader = trimmed.substring(1).split(/\s+/)[0];
      curSeq = '';
    } else {
      curSeq += trimmed;
    }
  }
  if (curHeader && curSeq) records.push({ name: curHeader, seq: curSeq, species: speciesArg, chain: chainArg });
} else {
  // Default to musIGHV044 demo
  const s = SAMPLES['musIGHV044'];
  records.push({ name: s.name, seq: s.seq, species: s.species, chain: s.chain });
}

// 10. Run Analysis
const t0 = performance.now();
const results = [];
for (const r of records) {
  const cleanSeq = r.seq.replace(/[^A-Za-z]/g, '').toUpperCase();
  let res;
  if (typeof analyze_sequence_universal === 'function') {
    res = analyze_sequence_universal(cleanSeq, r.name);
    // Enrich with detected species/chain if needed
    if (r.species && (!res.species || res.species === 'Auto')) res.species = r.species;
    const rawChain = res.chain || r.chain || 'Heavy';
    if (rawChain.toLowerCase().startsWith('heavy') || rawChain === 'H') res.chain = 'H';
    else if (rawChain.toLowerCase().startsWith('kappa') || rawChain === 'K') res.chain = 'K';
    else if (rawChain.toLowerCase().startsWith('lambda') || rawChain === 'L') res.chain = 'L';
    else res.chain = rawChain;
  } else {
    res = analyze_sequence(cleanSeq, r.name, r.species, r.chain);
  }

  // Multi-tier Resolution: Map call ID -> Systematic ID -> Reference Stratum -> Class
  const vLookup = res.v_gene ? geneResolver.resolve(res.v_gene, res.species) : null;
  if (vLookup) {
    const rawCall = res.v_gene;
    res.v_systematic_id = vLookup.systematic_id;
    res.v_gene = vLookup.systematic_id; // Primary handle is VBASE3 Systematic ID!
    if (rawCall && rawCall !== vLookup.systematic_id) {
      res.v_alias = rawCall;
    }
    // Gating rule: Stratum 3 is strictly reserved for entries present in the deposited Class I master catalog
    const isInMaster = geneResolver.masterIndex.has(normalizeKey(vLookup.systematic_id)) ||
                       geneResolver.masterIndex.has(normalizeKey(vLookup.gene_id));
    if (isInMaster) {
      res.reference_stratum = 'Stratum 3 (Class I Master Export)';
      res.v_class = 'Class I (Confirmed Functional)';
    } else {
      res.reference_stratum = 'Stratum 2 (Locus Germline - Internal Research Partition)';
      res.v_class = 'Class II (Germline Only)';
    }
    if (vLookup.imgt_name && vLookup.imgt_name !== '-') res.imgt_name = vLookup.imgt_name;
    if (vLookup.vbase1_tomlinson_name && vLookup.vbase1_tomlinson_name !== '-') res.vbase1_tomlinson_name = vLookup.vbase1_tomlinson_name;
  } else {
    // Unresolved orphan call: explicitly Stratum 2, NEVER Stratum 3 / Class I!
    res.v_systematic_id = res.v_gene || 'unassigned';
    res.reference_stratum = 'Stratum 2 (Locus Germline - Internal Research Partition)';
    res.v_class = 'Class II (Germline Only)';
  }

  if (res.j_gene) {
    const jLookup = geneResolver.resolve(res.j_gene, res.species);
    if (jLookup) {
      const rawJ = res.j_gene;
      res.j_systematic_id = jLookup.systematic_id;
      res.j_gene = jLookup.systematic_id;
      if (rawJ && rawJ !== jLookup.systematic_id) {
        res.j_alias = rawJ;
      }
    }
  }

  results.push(res);
}
const elapsedMs = performance.now() - t0;

// 11. Format Output
if (formatArg === 'json') {
  console.log(JSON.stringify({
    metadata: {
      engine: 'VBASE3 WebAssembly (dnaplot_wasm)',
      wasm_version: version(),
      reference_stratum: 'Stratum 3 (Class I Master Export)',
      database: 'VBASE3 Class I Release (vbase3_class1_master_catalog.tsv)',
      total_analyzed: records.length,
      elapsed_ms: Number(elapsedMs.toFixed(3)),
      throughput_seq_per_sec: Math.round((records.length / Math.max(0.001, elapsedMs)) * 1000)
    },
    results: results
  }, null, 2));
} else if (formatArg === 'tsv') {
  console.log(['sequence_id', 'v_call', 'v_systematic_id', 'v_alias', 'v_identity', 'j_call', 'cdr3_aa', 'junction_aa', 'productive', 'reference_stratum'].join('\t'));
  for (const r of results) {
    console.log([
      r.sequence_name || 'unknown',
      r.v_gene || '',
      r.v_systematic_id || r.v_gene || '',
      r.v_alias || '',
      r.v_identity || '',
      r.j_gene || '',
      r.cdr3_aa || '',
      r.junction_aa || '',
      r.is_productive ? 'T' : 'F',
      r.reference_stratum || 'Stratum 3 (Class I Master Export)'
    ].join('\t'));
  }
} else {
  console.log(`================================================================================`);
  console.log(`  ⚡ VBASE3 WebAssembly SIMD Engine (Node.js Execution)`);
  console.log(`  • WASM Engine Version : ${version()}`);
  console.log(`  • Reference Stratum   : Stratum 3 (Class I Master Export)`);
  console.log(`  • Master Catalog      : vbase3_class1_master_catalog.tsv (2,857 non-redundant entries)`);
  console.log(`  • Execution Time      : ${elapsedMs.toFixed(2)} ms (${Math.round((records.length / Math.max(0.001, elapsedMs)) * 1000)} seq/s)`);
  console.log(`================================================================================\n`);
  for (const r of results) {
    console.log(`Query Sequence   : ${r.sequence_name || 'unnamed'}`);
    console.log(`Reference Stratum: ${r.reference_stratum || 'Stratum 3 (Class I Master Export)'}`);
    console.log(`Species / Chain  : ${r.species || 'Auto'} (${r.locus || 'IGH'} / ${r.chain || 'H'})`);
    let vDisplay = r.v_gene || 'N/A';
    if (r.v_alias) {
      vDisplay += ` [AIRR Alias: ${r.v_alias}]`;
    }
    console.log(`Closest V-Gene   : ${vDisplay} (Identity: ${r.v_identity ? r.v_identity.toFixed(1) + '%' : 'N/A'})`);
    if (r.imgt_name && r.imgt_name !== r.v_gene && r.imgt_name !== r.v_alias) console.log(`IMGT Symbol      : ${r.imgt_name}`);
    if (r.vbase1_tomlinson_name) console.log(`Tomlinson Alias  : ${r.vbase1_tomlinson_name}`);
    let jDisplay = r.j_gene || 'N/A';
    if (r.j_alias) {
      jDisplay += ` [AIRR Alias: ${r.j_alias}]`;
    }
    console.log(`Closest J-Gene   : ${jDisplay} ${r.j_identity ? '(' + r.j_identity.toFixed(1) + '%)' : ''}`);
    console.log(`CDR3 Loop        : ${r.cdr3_aa || 'N/A'} (Junction: ${r.junction_aa || 'N/A'})`);
    console.log(`Productive V(D)J : ${r.is_productive ? 'YES (In-frame, no stop codons)' : 'NO (Unproductive)'}`);
    if (r.quality_warning || (r.v_identity && r.v_identity < 75.0)) {
      console.log(`⚠️ Quality Floor  : Top identity (${r.v_identity ? r.v_identity.toFixed(1) + '%' : '<75%'}) is below 75% Class I confidence threshold.`);
      console.log(`                   Note: May represent somatic hypermutation, engineered CDR graft (e.g. humanized mAb), or divergent taxon.`);
    }
    console.log(`--------------------------------------------------------------------------------`);
  }
}
