/**
 * VBASE3 Universal Sequence Dropzone & Smart Router (smart_router.js)
 * ===================================================================
 * Client-side deductive classifier that ingests any dropped or pasted
 * sequence file (.fasta, .tsv, .csv, .txt), deduces receptor type (BCR vs TCR),
 * species (Human, Mouse, Camelid VHH, Rabbit, Dog, Chicken, Xenopus), locus,
 * and CDR3 boundaries, and presents an instant 1-click launch to the ideal analyzer.
 */

(function() {
  'use strict';

  // Benchmark signature heuristics
  const TCR_J_MOTIFS = [
    { motif: 'EQYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'TGELFF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'NTIYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'SYEQYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'ETQYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'QPQHF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'TQYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'YEQYF', locus: 'TRB', name: 'TCR Beta J-Segment' },
    { motif: 'GNLIF', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'NMLTF', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'RLMF', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'QGNLIF', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'LTFG', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'LIFG', locus: 'TRA', name: 'TCR Alpha J-Segment' },
    { motif: 'TTGW', locus: 'TRG', name: 'TCR Gamma J-Segment' },
    { motif: 'SSWD', locus: 'TRG', name: 'TCR Gamma J-Segment' },
    { motif: 'TGW', locus: 'TRG', name: 'TCR Gamma J-Segment' },
    { motif: 'TDKL', locus: 'TRD', name: 'TCR Delta J-Segment' },
    { motif: 'TDQL', locus: 'TRD', name: 'TCR Delta J-Segment' },
    { motif: 'KLIF', locus: 'TRD', name: 'TCR Delta J-Segment' }
  ];

  function cleanString(str) {
    return (str || '').trim();
  }

  function isDnaSequence(seq) {
    const clean = seq.toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean) return false;
    const dnaCount = clean.replace(/[^ACGTN]/g, '').length;
    return (dnaCount / clean.length) > 0.85;
  }

  function basicTranslate(dna) {
    if (window.VBASE3 && typeof window.VBASE3.pickBestReadingFrame === 'function') {
      const best = window.VBASE3.pickBestReadingFrame(dna);
      return best.matureProtein || best.protein;
    }
    // Fallback translation
    const codonMap = {
      'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M', 'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
      'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K', 'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
      'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L', 'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
      'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q', 'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
      'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V', 'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
      'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E', 'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
      'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S', 'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
      'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W'
    };
    let clean = dna.toUpperCase().replace(/U/g, 'T').replace(/[^ACGT]/g, '');
    let bestAa = '';
    let bestScore = -9999;
    for (let f = 0; f < 3; f++) {
      let aa = '';
      let stops = 0;
      for (let i = f; i <= clean.length - 3; i += 3) {
        let c = codonMap[clean.slice(i, i + 3)] || 'X';
        if (c === '*') stops++;
        aa += c;
      }
      let score = -stops * 100 + aa.length * 0.1;
      if (/TVSS|TVSA|VEIK|TVL|[FW]G[A-Z]G/.test(aa)) score += 50;
      if (score > bestScore) {
        bestScore = score;
        bestAa = aa;
      }
    }
    return bestAa;
  }

  function parseInput(text) {
    text = cleanString(text);
    if (!text) return null;

    // Check for TSV/CSV paired table (AIRR or 10x single-cell)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 1 && (lines[0].includes('\t') || lines[0].includes(','))) {
      const header = lines[0].toLowerCase();
      if ((header.includes('v_call') && header.includes('j_call')) || 
          (header.includes('heavy') && header.includes('light')) ||
          header.includes('barcode') || header.includes('cdr3')) {
        return {
          type: 'paired_repertoire_table',
          rowCount: lines.length - 1,
          rawText: text
        };
      }
    }

    // Check for Multi-FASTA
    const fastaHeaders = lines.filter(l => l.startsWith('>'));
    if (fastaHeaders.length > 3) {
      return {
        type: 'multi_fasta',
        count: fastaHeaders.length,
        rawText: text
      };
    }

    // Single sequence (extract first sequence if FASTA header exists)
    let headerName = 'Query_Sequence';
    let seqLines = [];
    lines.forEach(l => {
      if (l.startsWith('>')) {
        headerName = l.substring(1).trim();
      } else {
        seqLines.push(l);
      }
    });

    const combined = seqLines.join('').replace(/\s+/g, '');
    let isDna = isDnaSequence(combined);
    let aaSeq = isDna ? basicTranslate(combined) : combined.toUpperCase().replace(/[^A-Z]/g, '');

    return {
      type: 'single_sequence',
      name: headerName,
      isDna: isDna,
      rawSeq: combined,
      aaSeq: aaSeq
    };
  }

  function classifySequence(parsed) {
    if (parsed.type === 'paired_repertoire_table') {
      return {
        category: 'scRNA-seq Paired Repertoire (10x / AIRR)',
        organism: 'Single-Cell Immune Response',
        receptor: 'Paired BCR / TCR Repertoire',
        primaryDest: 'single_cell_repertoire_studio.html',
        primaryTitle: 'Launch Single-Cell Paired Studio',
        icon: '📊',
        description: `Detected tabular dataset with ${parsed.rowCount} single-cell antibody/TCR clonotypes.`,
        altDest: 'repertoire_diversity.html',
        altTitle: 'Open Repertoire Diversity'
      };
    }

    if (parsed.type === 'multi_fasta') {
      return {
        category: 'Bulk Multi-Sequence FASTA Repertoire',
        organism: 'Vertebrate Repertoire',
        receptor: 'Polyclonal Collection',
        primaryDest: 'repertoire_diversity.html',
        primaryTitle: 'Launch Repertoire Diversity Studio',
        icon: '📈',
        description: `Detected multi-sequence FASTA with ${parsed.count} sequences.`,
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on Universe Manifold'
      };
    }

    const aa = parsed.aaSeq;

    // Check TCR first
    let isTcr = false;
    let tcrLocus = 'TRB';
    for (let jm of TCR_J_MOTIFS) {
      if (aa.includes(jm.motif)) {
        isTcr = true;
        tcrLocus = jm.locus;
        break;
      }
    }
    if (!isTcr && /[FW]G[A-Z]G/.test(aa) && !/TVSS|TVSA|VEIK|LEIK|TVL/.test(aa)) {
      if (/CASS|CSAR|CATB|CAMS/.test(aa)) {
        isTcr = true;
        tcrLocus = 'TRB';
      } else if (/CAV|CAM|CAG|CAE/.test(aa)) {
        isTcr = true;
        tcrLocus = 'TRA';
      }
    }

    if (isTcr) {
      // Differentiate Human vs Mouse TCR
      let isMouse = /AQSVTQ|EAAVTQ|EAEVTQ|EDQVTQ|C57BL|BALB|musculus/i.test(aa + parsed.name);
      let organism = isMouse ? 'Mouse (Mus musculus)' : 'Human (Homo sapiens)';
      let dest = isMouse ? 'mouse_tcr_analyzer.html' : 'human_tcr_analyzer.html';
      let title = isMouse ? 'Launch Mouse TCR Analyzer' : 'Launch Human TCR Analyzer';
      let icon = isMouse ? '🐁' : '👤';

      return {
        category: `T-Cell Receptor (${tcrLocus})`,
        organism: organism,
        receptor: `TCR ${tcrLocus} Chain`,
        primaryDest: dest,
        primaryTitle: title,
        icon: icon,
        description: `Detected mature ${organism} TCR ${tcrLocus} sequence with canonical TCR J-anchor motif.`,
        altDest: 'tcr_universe.html',
        altTitle: 'Explore in TCRbase Universe'
      };
    }

    // Antibody / BCR Detection
    // 1. Check Camelid VHH Nanobody hallmark
    // Hallmark: WFRQ.PGK[EQ][RE][EF] or hydrophilic FR2 residues
    if (/WFRQ[AP]PGK[EQ][RE][EF]|WFRQ[AP]PG|VHH|nanobody/i.test(aa + parsed.name)) {
      return {
        category: 'Camelid Autonomous Single-Domain VHH (Nanobody)',
        organism: 'Camelid (Alpaca / Llama / Camel)',
        receptor: 'Heavy-Chain Only Antibody (HCAb / VHH)',
        primaryDest: 'camelid_vbase3_analyzer.html',
        primaryTitle: 'Launch Camelid VHH Nanobody Analyzer',
        icon: '🦙',
        description: 'Detected autonomous single-domain Nanobody (VHH) harboring signature hydrophilic Framework 2 substitutions.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 2. Check Rabbit Antibody (C21 in FR1, C79 in FR3)
    if (aa.length > 85 && aa[20] === 'C' && (aa[78] === 'C' || aa[79] === 'C' || /rabbit|cuniculus|Rab_/i.test(parsed.name))) {
      return {
        category: 'Rabbit Monoclonal Antibody (RabMAb)',
        organism: 'European Rabbit (Oryctolagus cuniculus)',
        receptor: 'Heavy or Light Chain',
        primaryDest: 'rabbit_vbase3_analyzer.html',
        primaryTitle: 'Launch Rabbit Antibody Analyzer',
        icon: '🐇',
        description: 'Detected rabbit variable domain displaying signature inter-CDR Cys21–Cys79 disulfide bridge.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 3. Check Chicken (OmniChicken / DT40)
    if (/AVTLDESGGGL|AVTLD|chicken|gallus/i.test(aa + parsed.name)) {
      return {
        category: 'Chicken IgY / Transgenic Antibody',
        organism: 'Domestic Chicken (Gallus gallus)',
        receptor: 'Avian VH1 / VL1 Variable Domain',
        primaryDest: 'chicken_vbase3_analyzer.html',
        primaryTitle: 'Launch Chicken Repertoire Analyzer',
        icon: '🐓',
        description: 'Detected avian variable domain sequence derived from bursal somatic gene conversion.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 4. Check Canine (Dog)
    if (/dog|canis|canine|lokivetmab|bedinvetmab/i.test(parsed.name) || /EVQLVESGGGLVKPGGSLRLSC/i.test(aa)) {
      return {
        category: 'Canine Veterinary Monoclonal Antibody',
        organism: 'Dog (Canis lupus familiaris)',
        receptor: 'Canine Heavy or Lambda Chain',
        primaryDest: 'dog_vbase3_analyzer.html',
        primaryTitle: 'Launch Canine Antibody Analyzer',
        icon: '🐕',
        description: 'Detected canine-adapted antibody variable domain targeting veterinary therapeutics.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 5. Check Xenopus (Allotetraploid Frog)
    if (/xenopus|du_pasquier|tropicalis|laevis/i.test(parsed.name) || /QVQLQESGPGLVKPSQTLSLTCTVS/i.test(aa)) {
      return {
        category: 'Xenopus Amphibian Variable Domain',
        organism: 'Clawed Frog (Xenopus laevis / tropicalis)',
        receptor: 'Amphibian VH / Light Chain (L vs S Subgenome)',
        primaryDest: 'xenopus_du_pasquier_hsu.html',
        primaryTitle: 'Launch Xenopus Pioneer Studio',
        icon: '🐸',
        description: 'Detected allotetraploid Xenopus variable domain with subgenome chromosome hallmarks.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 6. Check Mouse Antibody (B1-8, 17.2.25, OKT3, TEPC-15)
    if (/QVQLQQPGAEL|EVQLQQSGAEL|QIQLVQSGPEL|musculus|mouse|b1-8|17.2.25/i.test(aa + parsed.name)) {
      return {
        category: 'Murine Hybridoma / Antibody Domain',
        organism: 'Mouse (Mus musculus)',
        receptor: 'Murine Heavy (IGH) or Light (IGK)',
        primaryDest: 'mouse_vbase3_analyzer.html',
        primaryTitle: 'Launch Mouse Antibody Analyzer',
        icon: '🐭',
        description: 'Detected murine antibody domain matching Renate Dildrop VH framework clans.',
        altDest: 'vgene_pacmap_universe.html',
        altTitle: 'Project on PaCMAP Universe'
      };
    }

    // 7. Default to Flagship Human Analyzer
    return {
      category: 'Human Antibody Variable Domain',
      organism: 'Human (Homo sapiens)',
      receptor: 'Heavy (IGH), Kappa (IGK), or Lambda (IGL)',
      primaryDest: 'human_vbase3_analyzer.html',
      primaryTitle: 'Launch Human Antibody Analyzer',
      icon: '👤',
      description: 'Detected human antibody variable domain ready for V(D)J alignment, SHM audit, and synthesis boundary verification.',
      altDest: 'dnaplot.html',
      altTitle: 'Open in DNAPLOT SIMD Studio'
    };
  }

  function routeAndLaunch(destUrl, rawSequence, title) {
    try {
      const payload = {
        sequence: rawSequence,
        title: title || 'Dropzone_Sequence',
        timestamp: Date.now()
      };
      sessionStorage.setItem('vbase3_pending_query', JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not cache sequence in sessionStorage:', e);
    }
    window.location.href = destUrl;
  }

  function renderResultCard(parsed, classification) {
    const modal = document.getElementById('routerResultModal');
    if (!modal) return;

    let snippet = parsed.aaSeq ? (parsed.aaSeq.substring(0, 45) + '...') : (parsed.type);

    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(8, 28, 36, 0.95), rgba(4, 16, 24, 0.95)); border: 1px solid #10b981; border-radius: 14px; padding: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); position: relative; animation: fadeIn 0.3s ease;">
        <button id="btnCloseRouterModal" style="position:absolute; top:14px; right:16px; background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer;" title="Close">✕</button>
        
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <div style="font-size:32px; background:rgba(16,185,129,0.15); border:1px solid #10b981; border-radius:10px; width:52px; height:52px; display:flex; align-items:center; justify-content:center;">${classification.icon}</div>
          <div>
            <div style="font-size:11px; color:#34d399; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;">Deductive Immunogenomic Routing</div>
            <div style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:700; color:#ffffff;">${classification.category}</div>
            <div style="font-size:12px; color:#94a3b8;">${classification.organism} • ${classification.receptor}</div>
          </div>
        </div>

        <p style="font-size:12.5px; color:#cbd5e1; line-height:1.5; margin-bottom:14px;">
          ${classification.description}
        </p>

        <div style="background:#020b0e; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 12px; font-family:'Fira Code', monospace; font-size:11.5px; color:#38bdf8; word-break:break-all; margin-bottom:16px;">
          <span style="color:#64748b; font-size:10.5px;">Input sequence preview:</span><br>
          ${snippet}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button id="btnLaunchPrimary" style="background:linear-gradient(135deg, #059669, #0284c7); border:none; color:#ffffff; font-weight:700; padding:9px 18px; border-radius:8px; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(5,150,105,0.4);">
              <span>⚡ ${classification.primaryTitle}</span>
              <span>&rarr;</span>
            </button>
            <button id="btnLaunchAlt" style="background:rgba(15, 23, 42, 0.7); border:1px solid rgba(255,255,255,0.15); color:#cbd5e1; font-weight:600; padding:9px 14px; border-radius:8px; cursor:pointer; font-size:12.5px;">
              ${classification.altTitle} ↗
            </button>
          </div>
          <span style="font-size:11px; color:#64748b;">Sequence pre-loaded automatically on destination</span>
        </div>
      </div>
    `;

    document.getElementById('btnCloseRouterModal').onclick = () => {
      modal.style.display = 'none';
    };

    const rawSeqToForward = parsed.rawSeq || parsed.rawText;
    document.getElementById('btnLaunchPrimary').onclick = () => {
      routeAndLaunch(classification.primaryDest, rawSeqToForward, parsed.name);
    };

    document.getElementById('btnLaunchAlt').onclick = () => {
      routeAndLaunch(classification.altDest, rawSeqToForward, parsed.name);
    };
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseInput(text);
      if (parsed) {
        if (!parsed.name || parsed.name === 'Query_Sequence') {
          parsed.name = file.name;
        }
        const classification = classifySequence(parsed);
        renderResultCard(parsed, classification);
      }
    };
    reader.readAsText(file);
  }

  // Window-wide drag & drop overlay
  function setupDragOverlay() {
    let overlay = document.getElementById('globalDragOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalDragOverlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(4, 16, 20, 0.88); backdrop-filter: blur(12px);
        z-index: 99999; display: none; align-items: center; justify-content: center;
        border: 3px dashed #10b981; pointer-events: none;
      `;
      overlay.innerHTML = `
        <div style="text-align:center; color:#ffffff; font-family:'Outfit', sans-serif;">
          <div style="font-size:64px; margin-bottom:12px; animation: bounce 1s infinite alternate;">📥</div>
          <div style="font-size:26px; font-weight:700; color:#34d399; margin-bottom:8px;">Drop Sequence File Here</div>
          <div style="font-size:14px; color:#cbd5e1; max-width:480px; line-height:1.5;">VBASE3 will automatically detect receptor (BCR / TCR), species, and launch the ideal analyzer.</div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      overlay.style.display = 'flex';
    });

    window.addEventListener('dragleave', (e) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        overlay.style.display = 'none';
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      overlay.style.display = 'none';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Setup DOM elements when page ready
  window.addEventListener('DOMContentLoaded', () => {
    setupDragOverlay();

    const fileInput = document.getElementById('dropzoneFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });
    }

    const btnToggle = document.getElementById('btnTogglePaste');
    const pasteArea = document.getElementById('dropzonePasteArea');
    if (btnToggle && pasteArea) {
      btnToggle.onclick = () => {
        pasteArea.style.display = (pasteArea.style.display === 'none' ? 'block' : 'none');
      };
    }

    const btnCancel = document.getElementById('btnCancelPaste');
    if (btnCancel && pasteArea) {
      btnCancel.onclick = () => {
        pasteArea.style.display = 'none';
      };
    }

    const btnAnalyze = document.getElementById('btnAnalyzePasted');
    const pasteInput = document.getElementById('routerPasteInput');
    if (btnAnalyze && pasteInput) {
      btnAnalyze.onclick = () => {
        const text = pasteInput.value.trim();
        if (text) {
          const parsed = parseInput(text);
          if (parsed) {
            const classification = classifySequence(parsed);
            renderResultCard(parsed, classification);
          }
        }
      };
    }
  });

  // Export functions globally
  window.VBASE3_ROUTER = {
    handleFile: handleFile,
    parseInput: parseInput,
    classifySequence: classifySequence,
    routeAndLaunch: routeAndLaunch
  };
})();
