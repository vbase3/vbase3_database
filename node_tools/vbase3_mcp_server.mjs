#!/usr/bin/env node
/**
 * VBASE3 Model Context Protocol (MCP) Server
 * ===========================================
 * Exposes the high-performance VBASE3 / DNAPLOT WebAssembly immunogenomics engine
 * directly to AI coding assistants and agentic LLMs (Google Antigravity, Claude Desktop,
 * Cursor, etc.) via the standard Model Context Protocol (JSON-RPC 2.0 over stdio).
 *
 * Capabilities:
 *  - vbase3_analyze_sequence: Fast V(D)J alignment, IMGT unique numbering, CDR3 detection
 *  - vbase3_verify_synthesis_boundary: Enforces canonical TVSS/TVSA/VEIK/TVL boundaries
 *  - vbase3_trim_antibody_seq: Canonically trims constant region bleed-through to exact J boundary
 *  - vbase3_calculate_biophysics: CDR3 net charge, Kyte-Doolittle hydropathy, loop length
 *  - vbase3_lookup_gene: Sub-millisecond lookup of Class I functional germlines across 55 species
 *  - vbase3_export_structure_input: Formats synthesis-ready inputs for AlphaFold3, ColabFold, ESMFold, Boltz-1
 *  - vbase3_get_server_status: Database version, species coverage, and class status
 *
 * Zero external npm dependencies required.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Universal WASM & JS Module Resolution
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
  process.stderr.write(`[VBASE3-MCP] Cannot locate dnaplot_wasm.js. Searched:\n${jsCandidates.map(c => ' - ' + c).join('\n')}\n`);
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
  process.stderr.write(`[VBASE3-MCP] Cannot locate dnaplot_wasm_bg.wasm.\n`);
  process.exit(1);
}

const wasmModule = await import(pathToFileURL(jsPath).href);
const { initSync, analyze_sequence, version } = wasmModule;

try {
  const wasmBuffer = fs.readFileSync(wasmPath);
  initSync({ module: wasmBuffer });
} catch (err) {
  process.stderr.write(`[VBASE3-MCP] Failed to initialize WASM engine: ${err.message}\n`);
  process.exit(1);
}

// 2. Canonical synthesis boundary verification logic
const SYNTHESIS_RULES = {
  heavy: { motifs: ['TVSS', 'TVSA'], pos: 122, name: 'Heavy Chain' },
  kappa: { motifs: ['VEIK', 'LEIK', 'LELK', 'VDIK', 'LDIK'], pos: 117, name: 'Kappa Light Chain' },
  lambda: { motifs: ['TVL', 'TAL'], pos: 117, name: 'Lambda Light Chain' },
  tcr_beta: { motifs: ['NTIYF', 'SYEQYF', 'ETQYF', 'QPQHF', 'TQYF', 'YEQYF', 'GNTIYF', 'EQYF', 'PQHF'], pos: 117, name: 'TCR Beta (TRB)' },
  tcr_alpha: { motifs: ['GNLIF', 'NMLTF', 'RLMF', 'QGNLIF', 'LTF', 'LIF'], pos: 117, name: 'TCR Alpha (TRA)' },
  tcr_gamma: { motifs: ['TTGW', 'SSWD', 'TGW'], pos: 117, name: 'TCR Gamma (TRG)' },
  tcr_delta: { motifs: ['TDKL', 'TDQL', 'KLIF'], pos: 117, name: 'TCR Delta (TRD)' }
};

function verifySynthesisBoundary(seq, chainHint = 'auto') {
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
    if (res) {
      detectedType = 'heavy';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'kappa' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.kappa.motifs);
    if (res) {
      detectedType = 'kappa';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'lambda' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.lambda.motifs);
    if (res) {
      detectedType = 'lambda';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'tcr_beta' || chainHint === 'trb' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_beta.motifs);
    if (res) {
      detectedType = 'tcr_beta';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'tcr_alpha' || chainHint === 'tra' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_alpha.motifs);
    if (res) {
      detectedType = 'tcr_alpha';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'tcr_gamma' || chainHint === 'trg' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_gamma.motifs);
    if (res) {
      detectedType = 'tcr_gamma';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
  }

  if (!matchingMotif && (chainHint === 'tcr_delta' || chainHint === 'trd' || chainHint === 'auto')) {
    const res = checkMotifs(SYNTHESIS_RULES.tcr_delta.motifs);
    if (res) {
      detectedType = 'tcr_delta';
      isValid = res.valid;
      matchingMotif = res.motif;
      excess = res.excess;
    }
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

// 2.1 Canonical Sequence Trimming
function trimAntibodySeq(peptide, dna = '', chainHint = 'auto') {
  const cleanPep = (peptide || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanPep) throw new Error('peptide sequence is required.');

  const b = verifySynthesisBoundary(cleanPep, chainHint);
  if (b.is_synthesis_compliant) {
    return {
      is_trimmed: false,
      original_length: cleanPep.length,
      trimmed_length: cleanPep.length,
      trimmed_peptide: cleanPep,
      trimmed_dna: dna ? dna.trim() : '',
      boundary_motif: b.canonical_motif_found,
      removed_residues: ''
    };
  }

  if (b.canonical_motif_found) {
    const idx = cleanPep.lastIndexOf(b.canonical_motif_found);
    const trimmedPep = cleanPep.substring(0, idx + b.canonical_motif_found.length);
    let trimmedDna = dna ? dna.trim() : '';
    if (trimmedDna && trimmedDna.length >= trimmedPep.length * 3) {
      trimmedDna = trimmedDna.substring(0, trimmedPep.length * 3);
    }
    return {
      is_trimmed: true,
      original_length: cleanPep.length,
      trimmed_length: trimmedPep.length,
      trimmed_peptide: trimmedPep,
      trimmed_dna: trimmedDna,
      boundary_motif: b.canonical_motif_found,
      removed_residues: b.trailing_constant_residues
    };
  }

  return {
    is_trimmed: false,
    original_length: cleanPep.length,
    trimmed_length: cleanPep.length,
    trimmed_peptide: cleanPep,
    trimmed_dna: dna ? dna.trim() : '',
    boundary_motif: null,
    removed_residues: '',
    warning: 'No canonical C-terminal synthesis boundary motif found.'
  };
}

// 3. Biophysical properties calculation
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
    else if (aa === 'H') charge += 0.1; // Partial at pH 7.4
    else if (aa === 'D' || aa === 'E') charge -= 1;
  }

  const meanHydro = clean.length > 0 ? (hydroSum / clean.length) : 0;

  return {
    cdr3_sequence: clean,
    length_amino_acids: clean.length,
    net_charge_ph74: Math.round(charge * 10) / 10,
    mean_kyte_doolittle_hydropathy: Math.round(meanHydro * 100) / 100,
    solubility_class: meanHydro > 0 ? "Hydrophobic (Risk of Aggregation/Clearance)" : "Hydrophilic (Favorable Paratope Profile)",
    charge_class: charge > 1.5 ? "Polybasic (+)" : (charge < -1.5 ? "Polyanionic (-)" : "Neutral / Balanced")
  };
}

// 3.1 Catalog Gene Lookup Helper
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
          class: parts[idxClass] || 'Class I (Confirmed Functional)',
          reference_stratum: (parts[idxClass] || '').includes('Class I') ? 'Stratum 3 (Class I Master Export)' : 'Stratum 2 (Locus Germline - Internal Research Partition)',
          mature_aa_sequence: parts[idxSeq] || '',
          cys104_anchor: (parts[idxSeq] || '').endsWith('C') ? 'Cys104 Present' : 'N/A',
          pdb_id: parts[idxPdb] || '',
          alphafold_db_id: parts[idxAf] || '',
          source_file: 'vbase3_crossreference_table.tsv'
        };

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
  if (!geneId) throw new Error('gene_id argument is required.');
  const match = geneResolver.resolve(geneId, speciesHint);
  if (match) {
    return match;
  }
  return { error: `Gene '${geneId}' not found for species '${speciesHint}'. Checked Stratum 3 Master Catalog, Rosetta Stone Cross-References, and Stratum 2 Locus Germlines.` };
}

// 3.2 Automated 3D Structure Prediction Exporter
function exportStructureInput(vh, vl = '', pipeline = 'colabfold', identifier = 'antibody') {
  if (!vh) throw new Error('vh_sequence argument is required.');
  const bVh = verifySynthesisBoundary(vh, 'heavy');
  const cleanVh = bVh.is_synthesis_compliant ? vh.trim() : (bVh.canonical_motif_found ? vh.substring(0, vh.lastIndexOf(bVh.canonical_motif_found) + bVh.canonical_motif_found.length) : vh.trim());

  let cleanVl = (vl || '').trim();
  if (cleanVl) {
    const bVl = verifySynthesisBoundary(cleanVl, 'auto');
    cleanVl = bVl.is_synthesis_compliant ? cleanVl : (bVl.canonical_motif_found ? cleanVl.substring(0, cleanVl.lastIndexOf(bVl.canonical_motif_found) + bVl.canonical_motif_found.length) : cleanVl);
  }

  const fmt = pipeline.toLowerCase().trim();
  let fasta = '';
  if (fmt === 'colabfold' || fmt === 'af_multimer' || fmt === 'alphafold' || fmt === 'alphafold3') {
    fasta = cleanVl ? `>${identifier}|paired\n${cleanVh}:${cleanVl}\n` : `>${identifier}\n${cleanVh}\n`;
  } else if (fmt === 'esmfold' || fmt === 'igfold') {
    const lines = [`>${identifier}_VH\n${cleanVh}`];
    if (cleanVl) lines.push(`>${identifier}_VL\n${cleanVl}`);
    fasta = lines.join('\n') + '\n';
  } else if (fmt === 'boltz' || fmt === 'chai') {
    const lines = [`>${identifier}|chain=H|entity=protein\n${cleanVh}`];
    if (cleanVl) lines.push(`>${identifier}|chain=L|entity=protein\n${cleanVl}`);
    fasta = lines.join('\n') + '\n';
  } else {
    fasta = cleanVl ? `>${identifier}\n${cleanVh}:${cleanVl}\n` : `>${identifier}\n${cleanVh}\n`;
  }

  return {
    identifier,
    target_pipeline: pipeline,
    vh_length: cleanVh.length,
    vl_length: cleanVl.length,
    vh_boundary_motif: bVh.canonical_motif_found || 'unrecognized',
    formatted_fasta: fasta
  };
}

// 4. Tool Definitions
const TOOLS = [
  {
    name: "vbase3_analyze_sequence",
    description: "Align and annotate an antibody or TCR sequence using the VBASE3 / DNAPLOT WebAssembly engine. Returns assigned Class I functional germline alleles, percent identity, somatic hypermutations (SHM), CDR1/CDR2/CDR3 boundaries, IMGT unique numbering, and in-frame productivity.",
    inputSchema: {
      type: "object",
      properties: {
        sequence: {
          type: "string",
          description: "Raw nucleotide or amino acid sequence of the rearranged variable domain"
        },
        species: {
          type: "string",
          enum: ["auto", "human", "mouse", "camelid", "rabbit", "dog", "cattle"],
          default: "auto",
          description: "Species hint for germline directory lookup (default: auto-deduction)"
        },
        chain: {
          type: "string",
          enum: ["auto", "heavy", "kappa", "lambda", "tcr_beta", "tcr_alpha"],
          default: "auto",
          description: "Locus/chain hint (default: auto-deduction)"
        }
      },
      required: ["sequence"]
    }
  },
  {
    name: "vbase3_verify_synthesis_boundary",
    description: "Audit antibody or TCR variable domain sequence for recombinant gene synthesis design. Verifies canonical C-terminal motifs (TVSS/TVSA for Heavy, VEIK/LEIK/TVL for Light, NTIYF/SYEQYF for TCR-Beta, GNLIF/NMLTF for TCR-Alpha) and flags any constant-region bleed-through (e.g. GSA, RTV, GQPKAAPSD).",
    inputSchema: {
      type: "object",
      properties: {
        sequence: {
          type: "string",
          description: "Amino acid sequence of the variable domain"
        },
        chain_type: {
          type: "string",
          enum: ["auto", "heavy", "kappa", "lambda", "tcr_beta", "tcr_alpha", "tcr_gamma", "tcr_delta"],
          default: "auto",
          description: "Chain type"
        }
      },
      required: ["sequence"]
    }
  },
  {
    name: "vbase3_trim_antibody_seq",
    description: "Canonical sequence trimmer. Truncates trailing constant region overhang residues (e.g. GSA, RTV, GQPKAAPSD) from variable domain peptide and nucleotide sequences, terminating cleanly at the exact IMGT J-segment boundary (TVSS/TVSA/VEIK/LEIK/TVL).",
    inputSchema: {
      type: "object",
      properties: {
        peptide_sequence: {
          type: "string",
          description: "Amino acid sequence of the variable domain"
        },
        dna_sequence: {
          type: "string",
          default: "",
          description: "Optional corresponding nucleotide DNA sequence to trim in lockstep"
        },
        chain_type: {
          type: "string",
          enum: ["auto", "heavy", "kappa", "lambda", "tcr_beta", "tcr_alpha"],
          default: "auto",
          description: "Chain type"
        }
      },
      required: ["peptide_sequence"]
    }
  },
  {
    name: "vbase3_calculate_biophysics",
    description: "Calculate CDR3 physicochemical properties: loop length, net charge at physiological pH 7.4, and Kyte-Doolittle hydropathy index to identify off-target or developability liabilities.",
    inputSchema: {
      type: "object",
      properties: {
        cdr3_amino_acid: {
          type: "string",
          description: "CDR3 loop amino acid sequence (e.g., 'CSRWGGDGFYAMDYW')"
        }
      },
      required: ["cdr3_amino_acid"]
    }
  },
  {
    name: "vbase3_lookup_gene",
    description: "Sub-millisecond lookup of any Class I functional V-gene or allele in the VBASE3 master catalog across 55 vertebrate species. Supports IMGT symbols (e.g., 'IGHV3-23*01') and VBASE IDs (e.g., 'humIGHV200187').",
    inputSchema: {
      type: "object",
      properties: {
        gene_id: {
          type: "string",
          description: "Gene name, allele symbol, or VBASE gene ID"
        },
        species: {
          type: "string",
          default: "auto",
          description: "Species hint (e.g. human, mouse, alpaca, dog)"
        }
      },
      required: ["gene_id"]
    }
  },
  {
    name: "vbase3_export_structure_input",
    description: "Format paired synthesis-ready antibody VH/VL sequences for leading 3D structure prediction pipelines (AlphaFold3, ColabFold, ESMFold, Boltz-1). Enforces synthesis boundaries before formatting.",
    inputSchema: {
      type: "object",
      properties: {
        vh_sequence: {
          type: "string",
          description: "Variable heavy chain amino acid sequence"
        },
        vl_sequence: {
          type: "string",
          default: "",
          description: "Optional variable light chain amino acid sequence"
        },
        pipeline: {
          type: "string",
          enum: ["colabfold", "alphafold3", "esmfold", "boltz", "chai"],
          default: "colabfold",
          description: "Target prediction structure pipeline format"
        },
        identifier: {
          type: "string",
          default: "antibody",
          description: "Construct identifier or name"
        }
      },
      required: ["vh_sequence"]
    }
  },
  {
    name: "vbase3_get_server_status",
    description: "Retrieve VBASE3 database status, engine release version, species coverage metrics, and regulatory Research Use Only (RUO) notice.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// 5. Tool Handlers
function handleToolCall(name, args) {
  switch (name) {
    case "vbase3_analyze_sequence": {
      const seq = (args.sequence || "").trim().toUpperCase().replace(/[^A-Z]/g, '');
      if (!seq) throw new Error("Sequence argument is required.");
      const sp = args.species || "auto";
      const ch = args.chain || "auto";
      const seqName = args.name || "mcp_query";

      const isNucleotide = /^[ACGTUN]+$/.test(seq);
      let parsed = null;
      let synthesisAudit = null;
      let biophysics = null;

      const isTcr = ch.startsWith('tcr') || ch === 'trb' || ch === 'tra' || ch === 'trg' || ch === 'trd' ||
                    seq.includes('CASS') || seq.includes('CASR') || seq.includes('CAVS');

      if (isNucleotide && seq.length >= 60) {
        try {
          parsed = analyze_sequence(seq, seqName, sp, ch);
          if (parsed) {
            let fullTranslation = '';
            if (parsed.txt_output && parsed.txt_output.includes('/translation\n')) {
              const parts = parsed.txt_output.split('/translation\n');
              if (parts.length > 1) {
                fullTranslation = parts[1].split(/\n[A-Z-]+\n\d+\.\.\d+/)[0].replace(/[^A-Z]/g, '');
              }
            }
            const trans = fullTranslation || parsed.v_translation || parsed.translation || parsed.junction_aa;
            if (trans) {
              synthesisAudit = verifySynthesisBoundary(trans, ch);
            }
            if (parsed.junction_aa) {
              biophysics = calculateBiophysics(parsed.junction_aa);
            }
          }
        } catch (e) {
          parsed = { error: e.message || String(e) };
        }
      } else {
        synthesisAudit = verifySynthesisBoundary(seq, ch);
        biophysics = calculateBiophysics(seq);
      }

      let shmProfile = null;
      if (isTcr) {
        shmProfile = {
          shm_mutations: 0,
          shm_percentage: 0.0,
          biological_invariant: "TCR Germline Invariant (Normal T cells do not undergo somatic hypermutation to avoid generating autoreactive clones escaping thymic negative selection)"
        };
      } else {
        shmProfile = {
          shm_mutations: (parsed && parsed.shm !== undefined) ? parsed.shm : 0,
          shm_percentage: (parsed && parsed.identity !== undefined) ? (100 - parsed.identity) : null,
          biological_invariant: "BCR Somatic Hypermutation (Germinal center affinity maturation)"
        };
      }

      // Multi-tier Resolution: Map call ID -> Systematic ID -> Reference Stratum -> Class
      let refStratum = "Stratum 3 (Class I Master Export)";
      let vClass = "Class I (Confirmed Functional)";
      if (parsed && parsed.v_gene) {
        const vLookup = geneResolver.resolve(parsed.v_gene, parsed.species);
        if (vLookup) {
          const rawCall = parsed.v_gene;
          parsed.v_systematic_id = vLookup.systematic_id;
          parsed.v_gene = vLookup.systematic_id; // Primary handle is VBASE3 Systematic ID!
          if (rawCall && rawCall !== vLookup.systematic_id) {
            parsed.v_alias = rawCall;
          }
          // Gating rule: Stratum 3 is strictly reserved for entries present in the deposited Class I master catalog
          const isInMaster = geneResolver.masterIndex.has(normalizeKey(vLookup.systematic_id)) ||
                             geneResolver.masterIndex.has(normalizeKey(vLookup.gene_id));
          if (isInMaster) {
            parsed.reference_stratum = 'Stratum 3 (Class I Master Export)';
            parsed.v_class = 'Class I (Confirmed Functional)';
            refStratum = parsed.reference_stratum;
            vClass = parsed.v_class;
          } else {
            parsed.reference_stratum = 'Stratum 2 (Locus Germline - Internal Research Partition)';
            parsed.v_class = 'Class II (Germline Only)';
            refStratum = parsed.reference_stratum;
            vClass = parsed.v_class;
          }
          if (vLookup.imgt_name && vLookup.imgt_name !== '-') parsed.imgt_name = vLookup.imgt_name;
          if (vLookup.vbase1_tomlinson_name && vLookup.vbase1_tomlinson_name !== '-') parsed.vbase1_tomlinson_name = vLookup.vbase1_tomlinson_name;
        } else {
          // Unresolved orphan call: explicitly Stratum 2, NEVER Stratum 3 / Class I!
          parsed.v_systematic_id = parsed.v_gene;
          parsed.reference_stratum = 'Stratum 2 (Locus Germline - Internal Research Partition)';
          parsed.v_class = 'Class II (Germline Only)';
          refStratum = parsed.reference_stratum;
          vClass = parsed.v_class;
        }
      }

      return {
        vbase3_engine_version: version(),
        reference_stratum: refStratum,
        reference_catalog: refStratum.includes("Stratum 3") ? "vbase3_class1_master_catalog.tsv" : "vbase3_germlines_[species].tsv",
        sequence_type: isNucleotide ? "nucleotide" : "amino_acid",
        receptor_family: isTcr ? "T-Cell Receptor (TCR)" : "B-Cell Receptor (BCR / Antibody)",
        input_length: seq.length,
        analysis_timestamp_utc: new Date().toISOString(),
        regulatory_notice: "VBASE3 is engineered to be robust and reliable. In its current form, it is intended strictly for Research Use Only (RUO).",
        results: parsed,
        biophysical_properties: biophysics,
        shm_profile: shmProfile,
        synthesis_compliance: synthesisAudit
      };
    }

    case "vbase3_verify_synthesis_boundary": {
      const seq = (args.sequence || "").trim();
      if (!seq) throw new Error("Sequence argument is required.");
      return verifySynthesisBoundary(seq, args.chain_type || "auto");
    }

    case "vbase3_trim_antibody_seq": {
      const pep = (args.peptide_sequence || "").trim();
      if (!pep) throw new Error("peptide_sequence argument is required.");
      return trimAntibodySeq(pep, args.dna_sequence || '', args.chain_type || 'auto');
    }

    case "vbase3_calculate_biophysics": {
      const cdr3 = (args.cdr3_amino_acid || "").trim();
      if (!cdr3) throw new Error("cdr3_amino_acid argument is required.");
      return calculateBiophysics(cdr3);
    }

    case "vbase3_lookup_gene": {
      const gid = (args.gene_id || "").trim();
      if (!gid) throw new Error("gene_id argument is required.");
      return lookupGene(gid, args.species || "auto");
    }

    case "vbase3_export_structure_input": {
      const vh = (args.vh_sequence || "").trim();
      if (!vh) throw new Error("vh_sequence argument is required.");
      return exportStructureInput(vh, args.vl_sequence || '', args.pipeline || 'colabfold', args.identifier || 'antibody');
    }

    case "vbase3_get_server_status": {
      return {
        status: "ONLINE",
        vbase3_version: `VBASE3 Release 1.0.0 (WASM Engine v${version()})`,
        database_coverage: "55 vertebrate species (BCR) + 31 vertebrate species (TCRBase, 3,114 TCR genes across TRA, TRB, TRG, TRD)",
        gating_policy: "Class I Functional Confirmed (>= 75% identity over mature FR1->Cys104 window)",
        receptor_mechanisms: "Dual BCR + TCR support (BCR SHM affinity maturation tracking vs. TCR Zero-SHM central tolerance enforcement)",
        synthesis_enforcement: "Strict J-segment synthesis boundary (BCR: TVSS/TVSA/VEIK/LEIK/TVL; TCR: canonical J-motifs)",
        active_tools: TOOLS.map(t => t.name),
        regulatory_notice: "Research Use Only (RUO). Regulated deployments require independent institutional verification."
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// 6. MCP Protocol Implementation (JSON-RPC 2.0 over stdio)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(id, result, error = null) {
  const msg = {
    jsonrpc: "2.0",
    id: id
  };
  if (error) {
    msg.error = error;
  } else {
    msg.result = result;
  }
  process.stdout.write(JSON.stringify(msg) + "\n");
}

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    sendResponse(null, null, { code: -32700, message: "Parse error: Invalid JSON" });
    return;
  }

  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize": {
        sendResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          },
          serverInfo: {
            name: "vbase3-mcp-server",
            version: "1.0.0"
          }
        });
        break;
      }

      case "notifications/initialized": {
        break;
      }

      case "ping": {
        sendResponse(id, {});
        break;
      }

      case "tools/list": {
        sendResponse(id, { tools: TOOLS });
        break;
      }

      case "tools/call": {
        if (!params || !params.name) {
          sendResponse(id, null, { code: -32602, message: "Invalid params: name is required" });
          return;
        }
        try {
          const resultData = handleToolCall(params.name, params.arguments || {});
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: JSON.stringify(resultData, null, 2)
              }
            ],
            isError: false
          });
        } catch (callErr) {
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: `Error executing ${params.name}: ${callErr.message}`
              }
            ],
            isError: true
          });
        }
        break;
      }

      case "resources/list": {
        sendResponse(id, {
          resources: [
            {
              uri: "vbase3://catalog/class1_master",
              name: "VBASE3 Class I Functional Master Catalog",
              mimeType: "text/tab-separated-values",
              description: "Curated functional germlines across 55 vertebrate species"
            },
            {
              uri: "vbase3://standards/synthesis_boundaries",
              name: "IMGT Variable Domain Synthesis Boundaries",
              mimeType: "text/markdown",
              description: "Specification for canonical TVSS, TVSA, VEIK, LEIK, and TVL boundaries"
            }
          ]
        });
        break;
      }

      case "resources/read": {
        const uri = params?.uri;
        if (uri === "vbase3://standards/synthesis_boundaries") {
          const text = `# IMGT Synthesis Boundary Standard\n- Heavy: Ends strictly at TVSS / TVSA (pos 122)\n- Kappa: Ends strictly at VEIK / LEIK / VDIK / LDIK (pos 117)\n- Lambda: Ends strictly at TVL (pos 117)\nZero constant region bleed-through allowed.`;
          sendResponse(id, {
            contents: [{ uri, mimeType: "text/markdown", text }]
          });
        } else {
          sendResponse(id, null, { code: -32602, message: `Resource not found: ${uri}` });
        }
        break;
      }

      default:
        sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
        break;
    }
  } catch (err) {
    sendResponse(id, null, { code: -32603, message: `Internal error: ${err.message}` });
  }
});

process.stderr.write(`[VBASE3-MCP] Server initialized with DNAPLOT WebAssembly engine v${version()}.\n`);
