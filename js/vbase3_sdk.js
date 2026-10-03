/**
 * VBASE3 Canonical Client SDK (vbase3_sdk.js)
 * ============================================
 * Official client-side JavaScript SDK for VBASE3 and the DNAPLOT WebAssembly engine.
 * 
 * ARCHITECTURAL RULE:
 * This module is the Single Source of Truth (SSOT) for all web-based immunogenomics,
 * sequence alignment, boundary verification, and biophysical calculations.
 * 
 * AI Coding Agents: NEVER copy-paste or reimplement these functions into HTML pages.
 * Always import this module or invoke via the global `window.VBASE3` object.
 *
 * @version 3.0.0
 * @license MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['../pkg/dnaplot_wasm.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    let wasm = null;
    try {
      wasm = require('../pkg/dnaplot_wasm.js');
    } catch (e) {
      // In Node or bundle environments where pkg is separate
    }
    module.exports = factory(wasm);
  } else {
    root.VBASE3 = factory(root.__wbg_dnaplot_wasm);
  }
}(typeof self !== 'undefined' ? self : this, function (wasmModule) {
  'use strict';

  let wasmInitialized = false;
  let wasmInitPromise = null;
  let wasmExports = wasmModule || null;

  // Canonical Synthesis Boundary Definitions
  const SYNTHESIS_RULES = {
    heavy: { motifs: ['TVSS', 'TVSA'], pos: 122, name: 'Heavy Chain' },
    kappa: { motifs: ['VEIK', 'LEIK', 'LELK', 'VDIK', 'LDIK'], pos: 117, name: 'Kappa Light Chain' },
    lambda: { motifs: ['TVL'], pos: 117, name: 'Lambda Light Chain' },
    tcr_beta: { motifs: ['NTIYF', 'SYEQYF', 'ETQYF', 'QPQHF', 'TQYF', 'YEQYF', 'GNTIYF', 'EQYF', 'PQHF'], pos: 117, name: 'TCR Beta (TRB)' },
    tcr_alpha: { motifs: ['GNLIF', 'NMLTF', 'RLMF', 'QGNLIF', 'LTF', 'LIF'], pos: 117, name: 'TCR Alpha (TRA)' },
    tcr_gamma: { motifs: ['TTGW', 'SSWD', 'TGW'], pos: 117, name: 'TCR Gamma (TRG)' },
    tcr_delta: { motifs: ['TDKL', 'TDQL', 'KLIF'], pos: 117, name: 'TCR Delta (TRD)' }
  };

  // Canonical Kyte-Doolittle Hydropathy Scale
  const HYDROPATHY_SCALE = {
    A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8,
    G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8,
    M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5,
    S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3
  };

  // Universal Genetic Code Codon Table
  const CODON_TABLE = {
    'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M', 'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
    'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K', 'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
    'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L', 'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
    'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q', 'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
    'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V', 'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
    'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E', 'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
    'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S', 'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
    'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W'
  };

  /**
   * Translates nucleotide DNA/RNA into amino acid sequence for a specific frame (0, 1, or 2).
   * @param {string} dna Nucleotide sequence
   * @param {number} [frame=0] Reading frame offset (0, 1, or 2)
   * @returns {string} Translated amino acid sequence
   */
  function translateDna(dna, frame = 0) {
    if (!dna || typeof dna !== 'string') return '';
    const clean = dna.toUpperCase().replace(/U/g, 'T').replace(/[^A-Z]/g, '');
    const offset = Math.max(0, Math.min(2, parseInt(frame, 10) || 0));
    const sub = clean.slice(offset);
    let aa = '';
    for (let i = 0; i <= sub.length - 3; i += 3) {
      const codon = sub.substring(i, i + 3);
      aa += CODON_TABLE[codon] || 'X';
    }
    return aa;
  }

  /**
   * Authoritative check whether a sequence is nucleotide DNA/RNA vs amino acid protein.
   * @param {string} seq Input sequence
   * @returns {boolean} True if nucleotide
   */
  function isDna(seq) {
    if (!seq || typeof seq !== 'string') return false;
    const clean = seq.replace(/[\s\r\n0-9>]/g, '').toUpperCase();
    if (clean.length === 0) return false;
    const dnaMatches = clean.match(/[ACGTUN]/g);
    return dnaMatches ? (dnaMatches.length / clean.length) > 0.85 : false;
  }

  /**
   * Generates reverse complement of a nucleotide string.
   * @param {string} dna Nucleotide sequence
   * @returns {string} Reverse complement
   */
  function reverseComplement(dna) {
    if (!dna || typeof dna !== 'string') return '';
    const clean = dna.toUpperCase().replace(/U/g, 'T').replace(/[^A-Z]/g, '');
    const compMap = { 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'N':'N' };
    let rc = '';
    for (let i = clean.length - 1; i >= 0; i--) {
      rc += compMap[clean[i]] || 'N';
    }
    return rc;
  }

  /**
   * Evaluates all 3 forward reading frames (and reverse-complement) to pick
   * the productive translation and identify the mature FR1 anchor boundary.
   *
   * @param {string} dna Nucleotide DNA sequence
   * @param {string} [chainHint='auto'] Target chain hint
   * @returns {Object} Frame evaluation details
   */
  function pickBestReadingFrame(dna, chainHint = 'auto') {
    if (!dna || typeof dna !== 'string') {
      return { frame: 0, isReverseComplement: false, protein: '', matureProtein: '', stops: 0, isProductive: false, score: -999 };
    }
    const cleanFwd = dna.toUpperCase().replace(/U/g, 'T').replace(/[^A-Z]/g, '');
    const cleanRev = reverseComplement(cleanFwd);

    const fr1Patterns = [
      /[QE][VIQL][QL][VLEQ]/, // EVQL, QVQL, QIQL, EVKL, DVQL
      /DI[QV]M/,             // DIQM, DIQL, DIVM
      /EIV[LM]/,             // EIVL, EIVM
      /QS[VA][LT]/,          // QSVL, QSAL, QSVT
      /Q[IT][VTL]L/          // QITL, QTVL, QVTL
    ];

    let bestRes = null;
    let bestScore = -99999;

    const candidates = [
      { seq: cleanFwd, isRc: false },
      { seq: cleanRev, isRc: true }
    ];

    for (const cand of candidates) {
      for (let f = 0; f < 3; f++) {
        if (cand.seq.length < f + 30) continue;
        const aa = translateDna(cand.seq, f);
        const stops = (aa.match(/\*/g) || []).length;

        let score = 0;
        // Severe penalty for stop codons
        score -= stops * 100;
        // Moderate sequence length preference
        score += Math.min(aa.length, 150) * 0.2;

        // Disulfide bond loop check: two Cysteines separated by 55-90 residues
        const cysIdxs = [];
        for (let i = 0; i < aa.length; i++) {
          if (aa[i] === 'C') cysIdxs.push(i);
        }
        let hasDomainCys = false;
        for (let i = 0; i < cysIdxs.length; i++) {
          for (let j = i + 1; j < cysIdxs.length; j++) {
            const span = cysIdxs[j] - cysIdxs[i];
            if (span >= 55 && span <= 90) {
              hasDomainCys = true;
              break;
            }
          }
          if (hasDomainCys) break;
        }
        if (hasDomainCys) score += 60;

        // Conserved FR2 Trp hallmark
        if (/WVR|WVK|WYQ|WFR|WIR|WLR/.test(aa)) score += 30;

        // Canonical mature FR1 N-terminal anchor
        let fr1Anchor = null;
        let fr1StartIdx = 0;
        const windowFr1 = aa.substring(0, 40);
        for (const pat of fr1Patterns) {
          const m = pat.exec(windowFr1);
          if (m) {
            fr1Anchor = m[0];
            fr1StartIdx = m.index;
            score += 50;
            break;
          }
        }

        // Canonical IMGT J-segment boundary
        if (/TVSS|TVSA|VEIK|LEIK|VDIK|LDIK|TVL|TKLTVL/.test(aa)) score += 40;

        if (stops === 0) score += 50;

        const matureAa = (fr1StartIdx > 0 && fr1StartIdx < aa.length - 30)
          ? aa.substring(fr1StartIdx)
          : aa;

        if (score > bestScore) {
          bestScore = score;
          bestRes = {
            frame: f,
            isReverseComplement: cand.isRc,
            protein: aa,
            matureProtein: matureAa,
            stops: stops,
            isProductive: (stops === 0),
            score: Math.round(score * 100) / 100,
            fr1Anchor: fr1Anchor,
            fr1StartAa: fr1StartIdx
          };
        }
      }
    }

    return bestRes || {
      frame: 0,
      isReverseComplement: false,
      protein: translateDna(cleanFwd, 0),
      matureProtein: translateDna(cleanFwd, 0),
      stops: (translateDna(cleanFwd, 0).match(/\*/g) || []).length,
      isProductive: false,
      score: 0,
      fr1Anchor: null,
      fr1StartAa: 0
    };
  }

  /**
   * Translates DNA and returns productive peptide and frame metadata.
   * @param {string} dna Nucleotide DNA
   * @param {string} [chainHint='auto'] Target chain hint
   * @returns {{ aaSeq: string, frame: number, isProductive: boolean, stops: number }}
   */
  function translateDnaBestFrame(dna, chainHint = 'auto') {
    const res = pickBestReadingFrame(dna, chainHint);
    return {
      aaSeq: res.matureProtein || res.protein,
      frame: res.frame,
      isProductive: res.isProductive,
      stops: res.stops
    };
  }

  /**
   * Initializes the compiled WebAssembly engine.
   * @param {string} [wasmPath] Optional path to dnaplot_wasm_bg.wasm
   * @returns {Promise<boolean>}
   */
  async function init(wasmPath) {
    if (wasmInitialized) return true;
    if (wasmInitPromise) return wasmInitPromise;

    wasmInitPromise = (async () => {
      try {
        if (!wasmExports && typeof window !== 'undefined') {
          // Dynamic import in browser environment
          let mod;
          try {
            mod = await import('../pkg/dnaplot_wasm.js');
          } catch (e1) {
            try {
              mod = await import('./pkg/dnaplot_wasm.js');
            } catch (e2) {
              mod = await import('/pkg/dnaplot_wasm.js');
            }
          }
          if (wasmPath) {
            await mod.default(wasmPath);
          } else {
            await mod.default();
          }
          wasmExports = mod;
        } else if (wasmExports && typeof wasmExports.default === 'function') {
          if (wasmPath) {
            await wasmExports.default(wasmPath);
          } else {
            await wasmExports.default();
          }
        }
        wasmInitialized = true;
        return true;
      } catch (err) {
        console.warn('[VBASE3 SDK] WebAssembly initialization fallback:', err.message);
        // SDK functions will operate with JavaScript fallbacks where applicable
        return false;
      }
    })();

    return wasmInitPromise;
  }

  /**
   * Evaluates synthesis boundary compliance for synthesis orders.
   * Enforces zero constant region bleed-through.
   *
   * @param {string} sequence Amino acid sequence
   * @param {string} [chainHint='auto'] 'heavy', 'kappa', 'lambda', 'tcr_beta', 'tcr_alpha', or 'auto'
   * @returns {Object} Boundary audit result
   */
  function verifySynthesisBoundary(sequence, chainHint = 'auto') {
    if (!sequence || typeof sequence !== 'string') {
      return { valid: false, error: 'Empty sequence provided' };
    }
    const clean = sequence.toUpperCase().replace(/[^A-Z]/g, '');
    let detectedChain = chainHint;
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

    const searchOrder = (chainHint === 'auto') 
      ? ['heavy', 'kappa', 'lambda', 'tcr_beta', 'tcr_alpha', 'tcr_gamma', 'tcr_delta']
      : [chainHint];

    for (const ch of searchOrder) {
      const rule = SYNTHESIS_RULES[ch];
      if (!rule) continue;
      const res = checkMotifs(rule.motifs);
      if (res) {
        detectedChain = ch;
        isValid = res.valid;
        matchingMotif = res.motif;
        excess = res.excess;
        break;
      }
    }

    return {
      valid: isValid,
      chain: detectedChain,
      terminalMotif: matchingMotif,
      excessConstantResidues: excess,
      excessCount: excess.length,
      recommendation: isValid 
        ? 'Sequence synthesis-ready. C-terminus matches canonical IMGT J-boundary exactly.' 
        : (matchingMotif 
            ? `Remove trailing constant residues '${excess}' following boundary motif '${matchingMotif}'.`
            : 'No canonical IMGT synthesis boundary motif detected. Verify sequence completeness.')
    };
  }

  /**
   * Fast hardware SIMD-accelerated vector Hamming distance.
   * Compares 16 amino acids per instruction using WebAssembly SIMD128.
   *
   * @param {string} seqA First sequence
   * @param {string} seqB Second sequence
   * @returns {number} Mismatch count over overlap
   */
  function vectorHammingDistance(seqA, seqB) {
    if (!seqA || !seqB) return 0;
    if (wasmExports && typeof wasmExports.vector_hamming_distance === 'function') {
      try {
        return wasmExports.vector_hamming_distance(seqA, seqB);
      } catch (e) {
        // Fallback
      }
    }
    const len = Math.min(seqA.length, seqB.length);
    let mismatches = 0;
    for (let i = 0; i < len; i++) {
      if (seqA[i] !== seqB[i]) mismatches++;
    }
    return mismatches;
  }

  /**
   * High-throughput SIMD sequence alignment returning percentage identity (0 - 100%).
   * Uses WebAssembly SIMD128 hardware acceleration when available.
   *
   * @param {string} q Query amino acid sequence
   * @param {string} ref Reference amino acid sequence
   * @returns {number} Percent identity (0 - 100)
   */
  function alignHamming(q, ref) {
    if (!q || !ref) return 0;
    const len = Math.min(q.length, ref.length);
    if (len === 0) return 0;
    if (wasmExports && typeof wasmExports.vector_hamming_distance === 'function') {
      try {
        const mismatches = wasmExports.vector_hamming_distance(q.slice(0, len), ref.slice(0, len));
        const matches = Math.max(0, len - mismatches);
        return (matches / len) * 100;
      } catch (e) {
        // Fallback
      }
    }
    let matches = 0;
    for (let i = 0; i < len; i++) {
      if (q[i] === ref[i]) matches++;
    }
    return (matches / len) * 100;
  }

  /**
   * Evaluates species-specific immunogenetic and structural exceptions
   * (Camelid VHH FR2 hallmarks, Rabbit Cys21-Cys79 inter-CDR disulfides,
   * Bovine ultralong loops, Canine lambda dominance, Avian gene conversion).
   *
   * @param {string} aaSeq Query amino acid sequence
   * @param {string} [speciesHint='auto'] Species hint
   * @returns {Object} Structured exception metadata
   */
  function detectSpeciesExceptions(aaSeq, speciesHint = 'auto') {
    if (!aaSeq) return null;
    const clean = aaSeq.trim().toUpperCase();
    if (wasmExports && typeof wasmExports.detect_species_exceptions === 'function') {
      try {
        const raw = wasmExports.detect_species_exceptions(clean, speciesHint);
        return (typeof raw === 'string') ? JSON.parse(raw) : raw;
      } catch (e) {
        console.warn('[VBASE3 SDK] WASM detect_species_exceptions error:', e);
      }
    }

    // JS Fallback
    const sp = (speciesHint || 'auto').toLowerCase();
    const isCamelid = clean.includes('WFRQ') || clean.includes('KERE') || clean.includes('GREL') || clean.includes('KERF');
    const totalCys = (clean.match(/C/g) || []).length;
    const isRabbit = totalCys >= 4 && (sp.includes('rabbit') || clean.length >= 100);
    const isBovine = clean.length > 140 && (clean.slice(-60).match(/C/g) || []).length >= 2;
    const isDogLambda = sp.includes('dog') || clean.includes('TVL');
    const isAvian = clean.startsWith('AVTLD') || clean.includes('GALSLV');

    return {
      species: sp,
      is_camelid_vhh: isCamelid && clean.length < 140,
      camelid_hallmarks: isCamelid ? ['Hydrophilic FR2 substitutions (WFRQ/KERE)'] : [],
      is_rabbit_cys_pair: isRabbit,
      rabbit_cys_count: totalCys,
      is_bovine_ultralong: isBovine,
      bovine_cdr3_len: isBovine ? 50 : 0,
      bovine_cys_count: isBovine ? 4 : 0,
      is_canine_lambda_dominant: isDogLambda,
      is_avian_gene_conversion: isAvian,
      summary_html: isCamelid 
        ? '<div class="species-hallmark-box"><strong>Camelid VHH Hallmark:</strong> Autonomous single-domain architecture detected.</div>'
        : (isRabbit ? `<div class="species-hallmark-box"><strong>Rabbit RabMAb Hallmark:</strong> Inter-CDR disulfide tether active (${totalCys} cysteines).</div>` : '<div class="species-hallmark-box">Canonical domain.</div>'),
      badge_text: isCamelid ? '🎯 Autonomous Single-Domain VHH (Nanobody)' : (isRabbit ? '✨ Inter-CDR Disulfide Active (Cys21-Cys79)' : 'Standard Immunoglobulin Domain')
    };
  }

  /**
   * Classifies TCR rearrangements with Gamma/Delta (γδ) and Alpha/Beta (αβ) lineage resolution,
   * cross-locus rearrangements (TRAV-TRDJ), and TRD tandem D-segment incorporation.
   *
   * @param {string} vGene Variable gene call
   * @param {string} jGene Joining gene call
   * @param {string} [cGene=null] Constant gene call
   * @returns {Object} Structured TCR classification
   */
  function classifyTcrRearrangement(vGene, jGene, cGene = null) {
    if (wasmExports && typeof wasmExports.classify_tcr_rearrangement_wasm === 'function') {
      try {
        const raw = wasmExports.classify_tcr_rearrangement_wasm(vGene || '', jGene || '', cGene);
        return (typeof raw === 'string') ? JSON.parse(raw) : raw;
      } catch (e) {
        console.warn('[VBASE3 SDK] WASM classify_tcr_rearrangement error:', e);
      }
    }
    return classifyRearrangementByJ(jGene, vGene, cGene);
  }

  /**
   * Calculates biophysical metrics for a CDR3 loop or variable domain.
   * @param {string} seq Amino acid sequence
   * @returns {Object} Biophysical properties
   */
  function calculateBiophysics(seq) {
    if (!seq || typeof seq !== 'string') return null;
    const clean = seq.toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean.length) return null;

    let netCharge = 0;
    let totalHydro = 0;
    for (let i = 0; i < clean.length; i++) {
      const aa = clean[i];
      if (aa === 'K' || aa === 'R') netCharge += 1.0;
      else if (aa === 'D' || aa === 'E') netCharge -= 1.0;
      else if (aa === 'H') netCharge += 0.1;

      totalHydro += (HYDROPATHY_SCALE[aa] || 0.0);
    }

    const meanHydro = totalHydro / clean.length;
    return {
      length: clean.length,
      netCharge: Math.round(netCharge * 100) / 100,
      meanHydropathy: Math.round(meanHydro * 100) / 100,
      gravy: Math.round(meanHydro * 100) / 100,
      isPositive: netCharge > 0.5,
      isNegative: netCharge < -0.5,
      isHydrophobic: meanHydro > 0.0
    };
  }

  /**
   * High-level analysis of an antibody or TCR sequence.
   * Uses the SIMD-accelerated WASM engine when initialized.
   *
   * @param {string} sequence DNA or Amino Acid sequence
   * @param {string} [name='Query'] Clone identifier
   * @param {string} [speciesHint='auto'] Target species
   * @param {string} [chainHint='auto'] Target chain
   * @returns {Promise<Object>} Structured alignment and annotation
   */
  async function analyzeSequence(sequence, name = 'Query', speciesHint = 'auto', chainHint = 'auto') {
    await init();

    if (wasmExports && typeof wasmExports.analyze_sequence === 'function') {
      try {
        const raw = wasmExports.analyze_sequence(sequence, name, speciesHint, chainHint);
        const result = (typeof raw === 'string') ? JSON.parse(raw) : raw;
        
        // Enrich with canonical synthesis boundary verification
        if (result.aa_seq || sequence) {
          result.synthesis_boundary = verifySynthesisBoundary(result.aa_seq || sequence, chainHint);
        }
        if (result.cdr3_aa) {
          result.cdr3_biophysics = calculateBiophysics(result.cdr3_aa);
        }
        // Species and TCR exception annotations
        const querySeqForAnnot = result.aa_seq || sequence;
        result.species_exceptions = detectSpeciesExceptions(querySeqForAnnot, speciesHint);
        if (result.locus && (result.locus.startsWith('TR') || ['A', 'B', 'G', 'D'].includes(result.chain))) {
          result.tcr_rearrangement = classifyTcrRearrangement(result.v_gene, result.j_gene);
        }
        if (typeof window !== 'undefined' && window.VBASE3_XREF && result.v_gene) {
          const rawV = result.v_gene;
          const xref = window.VBASE3_XREF[rawV] || window.VBASE3_XREF[rawV.toLowerCase()] || null;
          if (xref) {
            result.v_systematic_id = xref.systematic_id || rawV;
            result.v_gene = xref.systematic_id || rawV;
            if (rawV && rawV !== result.v_gene) {
              result.v_alias = rawV;
            }
            if (xref.imgt_name && xref.imgt_name !== '-') {
              result.imgt_name = xref.imgt_name;
            }
            result.reference_stratum = (xref.vbase3_class || '').includes('Class I')
              ? 'Stratum 3 (Class I Master Export)'
              : 'Stratum 2 (Locus Germline - Internal Research Partition)';
          }
        }
        result.reference_stratum = result.reference_stratum || 'Stratum 3 (Class I Master Export)';
        // Match quality floor (< 75% Class I threshold)
        if (result.v_identity !== undefined && result.v_identity < 75.0) {
          result.quality_warning = result.quality_warning || 
            `Top V-gene match identity (${result.v_identity.toFixed(1)}%) is below the 75% Class I empirical threshold. Sequence may be non-canonical, heavily somatic-mutated, or an engineered chimeric graft.`;
        }
        return result;
      } catch (err) {
        console.warn('[VBASE3 SDK] WASM analyze_sequence error:', err);
      }
    }

    // Fallback response if WASM is unavailable
    return {
      name,
      query_length: sequence.length,
      synthesis_boundary: verifySynthesisBoundary(sequence, chainHint),
      cdr3_biophysics: calculateBiophysics(sequence),
      warning: 'WASM engine offline. Synthesis boundaries verified via SDK fallback.',
      reference_stratum: 'Stratum 3 (Class I Master Export)'
    };
  }

  /**
   * Universal Single-Pass Multi-Species Antibody Analysis directly backed by Stratum 3 master catalog.
   * @param {string} sequence
   * @param {string} [name='UniversalQuery']
   * @returns {Promise<Object>}
   */
  async function analyzeSequenceUniversal(sequence, name = 'UniversalQuery') {
    await init();
    if (wasmExports && typeof wasmExports.analyze_sequence_universal === 'function') {
      try {
        const raw = wasmExports.analyze_sequence_universal(sequence, name);
        const result = (typeof raw === 'string') ? JSON.parse(raw) : raw;
        result.reference_stratum = result.reference_stratum || 'Stratum 3 (Class I Master Export)';
        if (result.aa_seq || sequence) {
          result.synthesis_boundary = verifySynthesisBoundary(result.aa_seq || sequence, 'auto');
        }
        if (result.cdr3_aa) {
          result.cdr3_biophysics = calculateBiophysics(result.cdr3_aa);
        }
        return result;
      } catch (err) {
        console.warn('[VBASE3 SDK] WASM analyze_sequence_universal error:', err);
      }
    }
    return analyzeSequence(sequence, name);
  }

  /**
   * Returns curated public reference benchmark clones.
   * @param {string} [species='human']
   * @returns {Array<Object>}
   */
  function getPresets(species = 'human') {
    const sp = species.toLowerCase();
    if (sp === 'human') {
      return [
        {
          name: 'Trastuzumab (Herceptin) VH',
          type: 'protein',
          chain: 'heavy',
          vGene: 'IGHV3-66*01',
          jGene: 'IGHJ4*01',
          sequence: 'EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS'
        },
        {
          name: 'Trastuzumab (Herceptin) VL',
          type: 'protein',
          chain: 'kappa',
          vGene: 'IGKV1-39*01',
          jGene: 'IGKJ1*01',
          sequence: 'DIQMTQSPSSLSASVGDRVTITCRASQDVNTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSRSGTDFTLTISSLQPEDFATYYCQQHYTTPPTFGQGTKVEIK'
        },
        {
          name: 'Adalimumab (Humira) VH',
          type: 'protein',
          chain: 'heavy',
          vGene: 'IGHV3-9*01',
          jGene: 'IGHJ4*01',
          sequence: 'EVQLVESGGGLVQPGRSLRLSCAASGFTFDDYAMHWVRQAPGKGLEWVSAITWNSGHIDYADSVEGRFTISRDNAKNSLYLQMNSLRAEDTAVYYCAKVSYLSTASSLDYWGQGTLVTVSS'
        },
        {
          name: 'OAS Human Naive Lambda (SRR11937587)',
          type: 'protein',
          chain: 'lambda',
          vGene: 'IGLV1-40*01',
          jGene: 'IGLJ2*01',
          sequence: 'QSVLTQPPSASGTPGQRVTISCSGSSSNIGSNTVNWYQQLPGTAPKLLIYSNNQRPSGVPDRFSGSKSGTSASLAISGLQSEDEADYYCAAWDDSLNGWVFGGGTKLTVL'
        }
      ];
    } else if (sp === 'mouse') {
      return [
        {
          name: 'B1-8 Anti-NP VH (J00528)',
          type: 'dna',
          chain: 'heavy',
          vGene: 'musIGHV057*01',
          sequence: 'GAGGTCCAGCTGCAACAGTCTGGACCTGAGCTGGTGAAGCCTGGGACTTCAGTGAAGATATCCTGCAAGACTTCTGGATACACATTCACTGAATACACCATACACTGGGTGAAGCAGAGCCATGGAAAGAGCCTTGAGTGGATTGGACACATTAGTCCTAACAATGGTGATACTTTCTACAACCAGAAGTTCAAGGGCAAGGCCACATTGACTGTAGACAAGTCCTCCAGCACAGCCTACATGGAGCTCCGCAGCCTGACATCTGAGGACTCTGCAGTCTATTACTGTGCAAGA'
        }
      ];
    }
    return [];
  }

  /**
   * Formats antibody chains for external AI structure prediction pipelines
   * (AlphaFold-Multimer, ColabFold, ESMFold, Boltz-1, IgFold).
   * @param {string} vh Heavy chain variable domain
   * @param {string} [vl] Optional light chain variable domain
   * @param {string} [format='colabfold'] Target format
   * @param {string} [identifier='antibody'] Sequence name
   * @returns {string} Formatted FASTA string
   */
  function exportStructureInput(vh, vl = '', format = 'colabfold', identifier = 'antibody') {
    const bVh = verifySynthesisBoundary(vh, 'heavy');
    const cleanVh = bVh.valid ? vh : (bVh.terminalMotif ? vh.substring(0, vh.lastIndexOf(bVh.terminalMotif) + bVh.terminalMotif.length) : vh);
    let cleanVl = vl || '';
    if (vl) {
      const bVl = verifySynthesisBoundary(vl, 'auto');
      cleanVl = bVl.valid ? vl : (bVl.terminalMotif ? vl.substring(0, vl.lastIndexOf(bVl.terminalMotif) + bVl.terminalMotif.length) : vl);
    }

    const fmt = (format || 'colabfold').toLowerCase().trim();
    if (fmt === 'colabfold' || fmt === 'af_multimer' || fmt === 'alphafold') {
      return cleanVl ? `>${identifier}|paired\n${cleanVh}:${cleanVl}\n` : `>${identifier}\n${cleanVh}\n`;
    } else if (fmt === 'esmfold' || fmt === 'igfold') {
      const lines = [`>${identifier}_VH\n${cleanVh}`];
      if (cleanVl) lines.push(`>${identifier}_VL\n${cleanVl}`);
      return lines.join('\n') + '\n';
    } else if (fmt === 'boltz' || fmt === 'chai') {
      const lines = [`>${identifier}|chain=H|entity=protein\n${cleanVh}`];
      if (cleanVl) lines.push(`>${identifier}|chain=L|entity=protein\n${cleanVl}`);
      return lines.join('\n') + '\n';
    }
    return cleanVl ? `>${identifier}\n${cleanVh}:${cleanVl}\n` : `>${identifier}\n${cleanVh}\n`;
  }

  /**
   * Classifies an antigen receptor rearrangement as Alpha-Beta (αβ), Gamma-Delta (γδ), or BCR/Antibody
   * based decisively on the J-segment (and/or C-gene).
   *
   * Biological Rationale:
   * In the TCR alpha/delta composite locus (TRA/TRD), upstream TRAV genes frequently rearrange to TRDJ,
   * forming bona fide TCR delta chains that pair with TRG. The J-segment chosen dictates downstream
   * RNA splicing to TRDC (forming TCR-γδ) vs TRAC (forming TCR-αβ).
   *
   * @param {string} [jGene] J-gene name (e.g. 'TRDJ1', 'TRAJ42', 'IGHJ4')
   * @param {string} [vGene] V-gene name (e.g. 'TRAV14', 'TRDV2', 'IGHV3-23')
   * @param {string} [cGene] Constant gene name (e.g. 'TRDC', 'TRAC')
   * @param {string} [sequence] Peptide sequence to scan for C-terminal motifs
   * @returns {Object} { locus, chainType, receptorFamily, tcrLineage, isGammaDelta, isAlphaBeta, isTcr, isBcr, isCrossLocus, formula, description }
   */
  function classifyRearrangementByJ(jGene, vGene, cGene, sequence) {
    const jUpper = (jGene || '').toUpperCase().trim();
    const vUpper = (vGene || '').toUpperCase().trim();
    const cUpper = (cGene || '').toUpperCase().trim();
    const seqClean = (sequence || '').toUpperCase().replace(/[^A-Z]/g, '');

    // 1. Constant gene check (highest priority if present)
    if (cUpper) {
      if (cUpper.includes('TRDC') || cUpper.includes('TCRDC') || cUpper.includes('TCRD')) {
        const isCross = !!(vUpper && (vUpper.includes('TRAV') || vUpper.includes('TCRA') || vUpper.includes('TRA_')));
        return {
          locus: 'TRD', chainType: 'TCR Delta', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: isCross,
          formula: `${vGene || 'V'}-${jGene || 'J'}-${cGene} (TCR-γδ${isCross ? ' cross-locus' : ''})`,
          description: 'TCR Delta chain (γδ) confirmed by TRDC constant region expression.'
        };
      }
      if (cUpper.includes('TRAC') || cUpper.includes('TCRAC') || cUpper.includes('TCRA')) {
        const isCross = !!(vUpper && (vUpper.includes('TRDV') || vUpper.includes('TCRD') || vUpper.includes('TRD_')));
        return {
          locus: 'TRA', chainType: 'TCR Alpha', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: isCross,
          formula: `${vGene || 'V'}-${jGene || 'J'}-${cGene} (TCR-αβ${isCross ? ' cross-locus' : ''})`,
          description: 'TCR Alpha chain (αβ) confirmed by TRAC constant region expression.'
        };
      }
      if (cUpper.includes('TRBC') || cUpper.includes('TCRBC') || cUpper.includes('TCRB')) {
        return {
          locus: 'TRB', chainType: 'TCR Beta', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'TRBV'}-${jGene || 'TRBJ'} (TCR-αβ)`,
          description: 'TCR Beta chain (αβ) confirmed by TRBC constant region.'
        };
      }
      if (cUpper.includes('TRGC') || cUpper.includes('TCRGC') || cUpper.includes('TCRG')) {
        return {
          locus: 'TRG', chainType: 'TCR Gamma', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'TRGV'}-${jGene || 'TRGJ'} (TCR-γδ)`,
          description: 'TCR Gamma chain (γδ) confirmed by TRGC constant region.'
        };
      }
    }

    // 2. J-Gene classification (decisive for rearranged V-J / V-D-J)
    if (jUpper) {
      if (jUpper.includes('TRDJ') || jUpper.includes('TCRD') || jUpper.includes('TRD_J') || /\bDJ\d+/.test(jUpper)) {
        const isCross = !!(vUpper && (vUpper.includes('TRAV') || vUpper.includes('TCRA') || vUpper.includes('TRA_')));
        return {
          locus: 'TRD', chainType: 'TCR Delta', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: isCross,
          formula: `${vGene || 'TRAV/TRDV'}-${jGene} (TCR-γδ${isCross ? ' cross-locus' : ''})`,
          description: isCross
            ? 'Gamma-Delta (γδ) TCR delta chain formed via cross-locus rearrangement of an upstream TRAV gene to a TRDJ segment.'
            : 'Canonical Gamma-Delta (γδ) TCR delta chain rearrangement.'
        };
      }
      if (jUpper.includes('TRAJ') || jUpper.includes('TCRA') || jUpper.includes('TRA_J') || /\bAJ\d+/.test(jUpper)) {
        const isCross = !!(vUpper && (vUpper.includes('TRDV') || vUpper.includes('TCRD') || vUpper.includes('TRD_')));
        return {
          locus: 'TRA', chainType: 'TCR Alpha', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: isCross,
          formula: `${vGene || 'TRAV'}-${jGene} (TCR-αβ${isCross ? ' cross-locus' : ''})`,
          description: isCross
            ? 'Alpha-Beta (αβ) TCR alpha chain formed via cross-locus rearrangement of an internal TRDV gene to a TRAJ segment, splicing to TRAC.'
            : 'Canonical Alpha-Beta (αβ) TCR alpha chain rearrangement.'
        };
      }
      if (jUpper.includes('TRBJ') || jUpper.includes('TCRB') || jUpper.includes('TRB_J') || /\bBJ\d+/.test(jUpper)) {
        return {
          locus: 'TRB', chainType: 'TCR Beta', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'TRBV'}-${jGene} (TCR-αβ)`,
          description: 'Canonical Alpha-Beta (αβ) TCR beta chain rearrangement.'
        };
      }
      if (jUpper.includes('TRGJ') || jUpper.includes('TCRG') || jUpper.includes('TRG_J') || /\bGJ\d+/.test(jUpper)) {
        return {
          locus: 'TRG', chainType: 'TCR Gamma', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'TRGV'}-${jGene} (TCR-γδ)`,
          description: 'Canonical Gamma-Delta (γδ) TCR gamma chain rearrangement.'
        };
      }
      if (jUpper.includes('IGHJ') || jUpper.includes('HEAVY') || /\bJH\d+/.test(jUpper)) {
        return {
          locus: 'IGH', chainType: 'Heavy', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'IGHV'}-${jGene}`,
          description: 'Antibody heavy chain rearrangement.'
        };
      }
      if (jUpper.includes('IGKJ') || jUpper.includes('KAPPA') || /\bJK\d+/.test(jUpper)) {
        return {
          locus: 'IGK', chainType: 'Kappa', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'IGKV'}-${jGene}`,
          description: 'Antibody kappa light chain rearrangement.'
        };
      }
      if (jUpper.includes('IGLJ') || jUpper.includes('LAMBDA') || /\bJL\d+/.test(jUpper)) {
        return {
          locus: 'IGL', chainType: 'Lambda', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'IGLV'}-${jGene}`,
          description: 'Antibody lambda light chain rearrangement.'
        };
      }
    }

    // 3. Sequence C-terminal J-motif evaluation (when J-gene name is unannotated)
    if (seqClean) {
      const win = seqClean.slice(-30);
      if (['TDKL', 'TDQL', 'KLIF'].some(m => win.includes(m))) {
        const isCross = !!(vUpper && (vUpper.includes('TRAV') || vUpper.includes('TCRA')));
        return {
          locus: 'TRD', chainType: 'TCR Delta', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: isCross, formula: `${vGene || 'V'}-TRDJ (TCR-γδ by motif)`,
          description: 'Gamma-Delta (γδ) TCR delta chain identified via canonical TRDJ C-terminal motif.'
        };
      }
      if (['QGNLIF', 'GNLIF', 'NMLTF', 'RLMF'].some(m => win.includes(m))) {
        const isCross = !!(vUpper && (vUpper.includes('TRDV') || vUpper.includes('TCRD')));
        return {
          locus: 'TRA', chainType: 'TCR Alpha', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: isCross, formula: `${vGene || 'V'}-TRAJ (TCR-αβ by motif)`,
          description: 'Alpha-Beta (αβ) TCR alpha chain identified via canonical TRAJ C-terminal motif.'
        };
      }
      if (['SYEQYF', 'ETQYF', 'NTIYF', 'QPQHF'].some(m => win.includes(m))) {
        return {
          locus: 'TRB', chainType: 'TCR Beta', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'V'}-TRBJ (TCR-αβ by motif)`,
          description: 'Alpha-Beta (αβ) TCR beta chain identified via canonical TRBJ motif.'
        };
      }
      if (['TTGW', 'SSWD', 'YYGW', 'TGW'].some(m => win.includes(m))) {
        return {
          locus: 'TRG', chainType: 'TCR Gamma', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene || 'V'}-TRGJ (TCR-γδ by motif)`,
          description: 'Gamma-Delta (γδ) TCR gamma chain identified via canonical TRGJ motif.'
        };
      }
      if (['TVSS', 'TVSA'].some(m => win.includes(m))) {
        return {
          locus: 'IGH', chainType: 'Heavy', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'V'}-IGHJ`,
          description: 'Antibody heavy chain identified via canonical TVSS/TVSA motif.'
        };
      }
      if (['VEIK', 'LEIK', 'VDIK', 'LDIK', 'LELK'].some(m => win.includes(m))) {
        return {
          locus: 'IGK', chainType: 'Kappa', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'V'}-IGKJ`,
          description: 'Antibody kappa light chain identified via canonical VEIK motif.'
        };
      }
      if (win.includes('TVL')) {
        return {
          locus: 'IGL', chainType: 'Lambda', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene || 'V'}-IGLJ`,
          description: 'Antibody lambda light chain identified via canonical TVL motif.'
        };
      }
    }

    // 4. Fallback to V-gene (with explicit provisional notice)
    if (vUpper) {
      if (vUpper.includes('TRDV') || vUpper.includes('TCRD')) {
        return {
          locus: 'TRD', chainType: 'TCR Delta', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene}-UnknownJ (TCR-γδ provisional)`,
          description: 'Provisional TCR delta chain deduced from TRDV gene. Final classification requires J-gene confirmation.'
        };
      }
      if (vUpper.includes('TRAV') || vUpper.includes('TCRA')) {
        return {
          locus: 'TRA', chainType: 'TCR Alpha', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene}-UnknownJ (TCR-αβ provisional)`,
          description: 'Provisional TCR alpha chain deduced from TRAV gene. (Note: If joined to TRDJ, this rearrangement functions as TCR-γδ).'
        };
      }
      if (vUpper.includes('TRBV') || vUpper.includes('TCRB')) {
        return {
          locus: 'TRB', chainType: 'TCR Beta', receptorFamily: 'Alpha-Beta TCR (αβ)',
          tcrLineage: 'alpha_beta', isGammaDelta: false, isAlphaBeta: true, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene}-TRBJ (TCR-αβ)`,
          description: 'Provisional TCR beta chain deduced from TRBV gene.'
        };
      }
      if (vUpper.includes('TRGV') || vUpper.includes('TCRG')) {
        return {
          locus: 'TRG', chainType: 'TCR Gamma', receptorFamily: 'Gamma-Delta TCR (γδ)',
          tcrLineage: 'gamma_delta', isGammaDelta: true, isAlphaBeta: false, isTcr: true, isBcr: false,
          isCrossLocus: false, formula: `${vGene}-TRGJ (TCR-γδ)`,
          description: 'Provisional TCR gamma chain deduced from TRGV gene.'
        };
      }
      if (vUpper.includes('IGHV') || vUpper.includes('VH')) {
        return {
          locus: 'IGH', chainType: 'Heavy', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene}-IGHJ`,
          description: 'Antibody heavy chain deduced from IGHV gene.'
        };
      }
      if (vUpper.includes('IGKV') || vUpper.includes('VK')) {
        return {
          locus: 'IGK', chainType: 'Kappa', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene}-IGKJ`,
          description: 'Antibody kappa light chain deduced from IGKV gene.'
        };
      }
      if (vUpper.includes('IGLV') || vUpper.includes('VL')) {
        return {
          locus: 'IGL', chainType: 'Lambda', receptorFamily: 'B-Cell Receptor (BCR/Antibody)',
          tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: true,
          isCrossLocus: false, formula: `${vGene}-IGLJ`,
          description: 'Antibody lambda light chain deduced from IGLV gene.'
        };
      }
    }

    return {
      locus: 'Unknown', chainType: 'Unknown', receptorFamily: 'Unknown',
      tcrLineage: null, isGammaDelta: false, isAlphaBeta: false, isTcr: false, isBcr: false,
      isCrossLocus: false, formula: 'Unknown',
      description: 'Could not classify antigen receptor rearrangement.'
    };
  }

  const AGENT_SPEC = {
    name: 'VBASE3 WebAssembly & Immunogenomics Client Engine',
    version: '1.0.0',
    description: 'High-performance WebAssembly immunogenomics engine and boundary auditor.',
    methods: {
      'VBASE3.analyze(sequence, name, speciesHint, chainHint)': 'Runs V(D)J alignment, IMGT numbering, and boundary verification. Returns JSON.',
      'VBASE3.translateDna(dna, frame)': 'Translates nucleotide sequence for frame 0, 1, or 2.',
      'VBASE3.pickBestReadingFrame(dna, chainHint)': 'Evaluates all 3 reading frames to select productive frame and mature FR1 boundary.',
      'VBASE3.translateDnaBestFrame(dna, chainHint)': 'Convenience method returning { aaSeq, frame, isProductive, stops } in optimal frame.',
      'VBASE3.verifySynthesisBoundary(sequence, chainHint)': 'Checks TVSS/TVSA/VEIK/TVL boundaries. Returns {valid, terminalMotif, excessConstantResidues}.',
      'VBASE3.calculateBiophysics(cdr3Seq)': 'Calculates net charge, hydropathy (GRAVY), and length.',
      'VBASE3.vectorHammingDistance(seqA, seqB)': 'Zero-overhead WebAssembly SIMD128 vector Hamming distance.',
      'VBASE3.alignHamming(q, ref)': 'SIMD-accelerated percent identity alignment (0-100%).',
      'VBASE3.detectSpeciesExceptions(aaSeq, speciesHint)': 'Detects Camelid VHH, Rabbit Cys21-Cys79, Bovine ultralong, etc.',
      'VBASE3.classifyTcrRearrangement(vGene, jGene, cGene)': 'TCR rearrangement classifier (Gamma/Delta vs Alpha/Beta, tandem D-segments).',
      'VBASE3.classifyRearrangement(jGene, vGene, cGene, sequence)': 'Classifies rearrangement into Alpha-Beta (αβ) vs Gamma-Delta (γδ) vs BCR decisively using the J-segment.',
      'VBASE3.exportStructureInput(vh, vl, format, id)': 'Formats synthesis-trimmed paired FASTA for AlphaFold3, ColabFold, ESMFold, Boltz-1.',
      'VBASE3.getPresets(species)': 'Returns list of verified public benchmark clones.',
      'VBASE3.isReady()': 'Returns boolean indicating whether WebAssembly is initialized.'
    },
    zeroDissectionNotice: 'AI Agents: Use these methods directly. Do not dissect DOM or copy-paste algorithms.'
  };

  const sdk = {
    SPEC: AGENT_SPEC,
    init,
    isReady: () => wasmInitialized,
    analyze: analyzeSequence,
    analyzeSequence,
    analyzeSequenceUniversal,
    isDna,
    translateDna,
    pickBestReadingFrame,
    translateDnaBestFrame,
    verifySynthesisBoundary,
    calculateBiophysics,
    vectorHammingDistance,
    alignHamming,
    detectSpeciesExceptions,
    classifyTcrRearrangement,
    classifyRearrangement: classifyRearrangementByJ,
    classifyRearrangementByJ,
    exportStructureInput,
    getPresets,
    RULES: SYNTHESIS_RULES
  };

  // Automatic Smart Router / Dropzone Query Ingestion Hook
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        try {
          const raw = sessionStorage.getItem('vbase3_pending_query');
          if (raw) {
            const payload = JSON.parse(raw);
            if (payload && payload.sequence) {
              const input = document.getElementById('seqInput') ||
                            document.getElementById('sequenceInput') ||
                            document.getElementById('seqTextarea') ||
                            document.getElementById('batchInput');
              if (input) {
                input.value = payload.sequence;
                console.log('⚡ [VBASE3 SDK] Ingested sequence from Smart Router:', payload.title || 'Sequence');
                
                if (typeof window.analyzeCurrentSequence === 'function') {
                  window.analyzeCurrentSequence();
                } else if (typeof window.runAnalysis === 'function') {
                  window.runAnalysis();
                } else if (typeof window.runAlignment === 'function') {
                  window.runAlignment();
                } else if (typeof window.runUniversalAnalysisAndProjection === 'function') {
                  window.runUniversalAnalysisAndProjection();
                }

                const banner = document.createElement('div');
                banner.style.cssText = `
                  position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                  background: rgba(8, 28, 36, 0.95); border: 1px solid #10b981;
                  color: #34d399; padding: 10px 16px; border-radius: 8px;
                  font-size: 12px; font-weight: 600; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                  display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif;
                `;
                banner.innerHTML = `<span>⚡ Pre-loaded sequence routed from VBASE3 Smart Router: <strong>${payload.title || 'Query'}</strong></span>`;
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 4500);
              }
            }
            sessionStorage.removeItem('vbase3_pending_query');
          }
        } catch (e) {
          console.warn('[VBASE3 SDK] Router auto-ingest note:', e);
        }
      }, 150);
    });
  }

  return sdk;
}));
