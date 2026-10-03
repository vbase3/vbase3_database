// VBASE3 Vertebrate Antibody Universe with Dual Execution (WASM + Server Native Rust)
import initWasm, { analyze_sequence, embed_sequences_pacmap, embed_matrix_pacmap } from '../pkg/dnaplot_wasm.js';

let wasmReady = false;
let currentEngine = 'wasm'; // 'wasm' (Client WebAssembly) or 'native' (Server Native Rust on Apple M4 Pro)

// Initialize WebAssembly (WASM) Engine
async function initWasmEngine() {
  try {
    await initWasm();
    wasmReady = true;
    const badge = document.getElementById("wasmBadge");
    const badgeText = document.getElementById("engineBadgeText");
    if (badge && currentEngine === 'wasm') {
      badge.className = "wasm-badge wasm-active";
      if (badgeText) badgeText.innerText = "⚡ Client WASM: Active (In-Browser)";
    }
    console.log("✅ VBASE3 Universe WebAssembly (WASM) Engine Initialized Successfully.");
  } catch (err) {
    console.warn("⚠️ WASM initialization warning (falling back to JS heuristics):", err);
    const badgeText = document.getElementById("engineBadgeText");
    if (badgeText) badgeText.innerText = "⚠️ WASM: Fallback Mode";
  }
}
initWasmEngine();

// Dual Engine Execution Switcher
function switchExecutionEngine(engine) {
  currentEngine = engine;
  const btnWasm = document.getElementById("btnEngineWasm");
  const btnNative = document.getElementById("btnEngineNative");
  const badge = document.getElementById("wasmBadge");
  const badgeText = document.getElementById("engineBadgeText");

  if (engine === 'wasm') {
    if (btnWasm) btnWasm.className = "engine-btn active wasm";
    if (btnNative) btnNative.className = "engine-btn";
    if (badge) {
      badge.className = "wasm-badge wasm-active";
      badge.title = "100% Private — sequences are analyzed in your browser CPU via WebAssembly; zero network data transfer.";
    }
    if (badgeText) badgeText.innerText = "⚡ Client WASM: Active (In-Browser)";
    console.log("⚡ Switched Execution Engine: Client WebAssembly (In-Browser)");
  } else {
    if (btnWasm) btnWasm.className = "engine-btn";
    if (btnNative) btnNative.className = "engine-btn active native";
    if (badge) {
      badge.className = "wasm-badge native-active";
      badge.title = "Accelerated via Native Rust compiled for Apple M4 Pro (16-Core Rayon SIMD).";
    }
    if (badgeText) badgeText.innerText = "🚀 Server Native Rust: Active (Apple M4 Pro)";
    console.log("🚀 Switched Execution Engine: Server Native Rust (Apple M4 Pro)");
  }
}

function openBenchmarkModal() {
  const modal = document.getElementById("benchmarkModal");
  if (modal) modal.style.display = "flex";
}

function closeBenchmarkModal() {
  const modal = document.getElementById("benchmarkModal");
  if (modal) modal.style.display = "none";
}

// Side-by-Side Live Benchmark Runner
async function runSideBySideBenchmark() {
  const runBtn = document.getElementById("runLiveBenchmarkBtn");
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerText = "⏳ Running Live Benchmark (Client WASM & Server Native Rust)...";
  }

  const trastuzumab = "EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS";
  const benchmarkSeqs = [
    trastuzumab,
    "QVQLVESGGGLARPGGSLRLSCAASGRTNSLGWFRQVPGKEREFVARASGRNKPIFYGDFVNNRFTLSRDYDKHTLTLQMDNLEPADTAVYICAAGPGGKLPSQWAFWGQGIQVTVSS",
    "EVQLQQSGAELVKPGASVKLSCTASGFNIKDTYMHWVKQRPEQGLEWIGRIDPANGNTKYDPKFQGKATITADTSSNTAYLQLSSLTSEDTAVYYCARSYGNYWFAYWGQGTLVTVSA",
    "QVQLVESGGGVVQPGRSLRLSCAASGFTFSSYGMHWVRQAPGKGLEWVAVIWYDGSNKYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCASWGQGTLVTVSS",
    "DIQMTQSPSSLSASVGDRVTITCRASQDVNTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSRSGTDFTLTISSLQPEDFATYYCQQHYTTPPTFGQGTKVEIK"
  ];

  // 1. Benchmark Client WASM (Alignment & Annotation)
  const wasmAlignCount = 30;
  const t0_wasm_align = performance.now();
  for (let i = 0; i < wasmAlignCount; i++) {
    const s = benchmarkSeqs[i % benchmarkSeqs.length];
    if (wasmReady) {
      try {
        analyze_sequence(s, "Bench_" + i, "human", "H");
      } catch (e) {}
    }
  }
  const t1_wasm_align = performance.now();
  const wasmAlignDur = t1_wasm_align - t0_wasm_align;
  const wasmAlignRate = Math.max(1, (wasmAlignCount / (wasmAlignDur / 1000.0))).toFixed(1);
  const wasmLatency = (wasmAlignDur / wasmAlignCount).toFixed(2);

  // 2. Benchmark Client WASM (PaCMAP Embedding on 100 sequences)
  const pacmapInputs = [];
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < benchmarkSeqs.length; j++) {
      pacmapInputs.push({ id: `seq_${i}_${j}`, vh: benchmarkSeqs[j], cdr3: "WGGDGFYAMDY" });
    }
  }
  const t0_wasm_pacmap = performance.now();
  if (wasmReady) {
    try {
      embed_sequences_pacmap(JSON.stringify(pacmapInputs), 10, 50, 1.0, 50);
    } catch (e) {}
  }
  const t1_wasm_pacmap = performance.now();
  const wasmPacmapDur = (t1_wasm_pacmap - t0_wasm_pacmap).toFixed(1);

  // Populate WASM metrics
  const wasmAlignThEl = document.getElementById("benchWasmAlignThroughput");
  const wasmAlignLatEl = document.getElementById("benchWasmAlignLatency");
  const wasmPacmapEl = document.getElementById("benchWasmPacmapTime");
  if (wasmAlignThEl) wasmAlignThEl.innerText = `${wasmAlignRate} seqs / sec`;
  if (wasmAlignLatEl) wasmAlignLatEl.innerText = `${wasmLatency} ms / seq`;
  if (wasmPacmapEl) wasmPacmapEl.innerText = `${wasmPacmapDur} ms (Single-Core)`;

  // 3. Query Server Native Rust Benchmark Endpoint (with WASM-only fallback)
  const refNativeThroughput = 9064;
  const refNativeLatency = "110.33 µs";
  const refNativePacmap = "153.75 ms (650.4 seqs/s)";
  const refNativePairwise = "19.1 M comparisons/sec";

  try {
    const serverResp = await fetch("/api/benchmark");
    if (!serverResp.ok) throw new Error(`HTTP error ${serverResp.status}`);
    const serverData = await serverResp.json();

    if (serverData && serverData.alignment) {
      const align = serverData.alignment;
      const pacmap = serverData.pacmap || {};

      const coresEl = document.getElementById("benchNativeCores");
      const alignThEl = document.getElementById("benchNativeAlignThroughput");
      const alignLatEl = document.getElementById("benchNativeAlignLatency");
      const pacmapEl = document.getElementById("benchNativePacmapTime");
      const pairwiseEl = document.getElementById("benchNativePairwiseRate");

      if (coresEl) coresEl.innerText = `${serverData.cores || 16} Cores (Rayon Work-Stealing)`;
      if (alignThEl) alignThEl.innerText = `${Math.round(align.matching_throughput_queries_sec).toLocaleString()} queries / sec`;
      if (alignLatEl) alignLatEl.innerText = `${align.latency_per_query_us} µs / query`;
      if (pacmapEl) pacmapEl.innerText = `${pacmap.duration_ms} ms (${pacmap.throughput_seqs_sec.toLocaleString()} seqs/s)`;
      if (pairwiseEl) pairwiseEl.innerText = `${(align.pairwise_comparisons_sec / 1e6).toFixed(1)} M comparisons/sec`;

      const speedup = Math.round(align.matching_throughput_queries_sec / Math.max(0.1, parseFloat(wasmAlignRate)));
      const summaryTextEl = document.getElementById("benchSpeedupText");
      if (summaryTextEl) {
        summaryTextEl.innerHTML = `Server Native Rust on Apple M4 Pro achieves <span style="color:#38bdf8; font-weight:700;">${speedup}x higher throughput</span> with 16-core parallel Rayon PaCMAP dimensionality reduction.`;
      }
      const badge = document.getElementById("benchSpeedupBadge");
      const factorEl = document.getElementById("benchSpeedupFactor");
      if (badge && factorEl) {
        badge.style.display = "inline-flex";
        factorEl.innerText = `${speedup}x FASTER (M4 Pro)`;
      }
    }
  } catch (err) {
    // In WASM-only version without local server daemon, populate canonical reference metrics and display release note
    const coresEl = document.getElementById("benchNativeCores");
    const alignThEl = document.getElementById("benchNativeAlignThroughput");
    const alignLatEl = document.getElementById("benchNativeAlignLatency");
    const pacmapEl = document.getElementById("benchNativePacmapTime");
    const pairwiseEl = document.getElementById("benchNativePairwiseRate");

    if (coresEl) coresEl.innerText = "16 Cores (Apple M4 Pro • Rayon)";
    if (alignThEl) alignThEl.innerText = `${refNativeThroughput.toLocaleString()} queries / sec`;
    if (alignLatEl) alignLatEl.innerText = `${refNativeLatency} / query`;
    if (pacmapEl) pacmapEl.innerText = refNativePacmap;
    if (pairwiseEl) pairwiseEl.innerText = refNativePairwise;

    const speedup = Math.round(refNativeThroughput / Math.max(0.1, parseFloat(wasmAlignRate)));
    const summaryTextEl = document.getElementById("benchSpeedupText");
    if (summaryTextEl) {
      summaryTextEl.innerHTML = `<strong>Release Note: Benchmark disabled in the WASM only version.</strong> Showing canonical reference metrics: Server Native Rust on Apple M4 Pro achieves <span style="color:#38bdf8; font-weight:700;">${speedup}x higher throughput</span> (19.1M pairwise comparisons/sec).`;
    }
    const badge = document.getElementById("benchSpeedupBadge");
    const factorEl = document.getElementById("benchSpeedupFactor");
    if (badge && factorEl) {
      badge.style.display = "inline-flex";
      factorEl.innerText = `${speedup}x FASTER (M4 Pro Ref)`;
    }
  }

  if (runBtn) {
    runBtn.disabled = false;
    runBtn.innerText = "⚡ Re-Test In-Browser Client WASM Speed";
  }
}

window.switchExecutionEngine = switchExecutionEngine;
window.openBenchmarkModal = openBenchmarkModal;
window.closeBenchmarkModal = closeBenchmarkModal;
window.runSideBySideBenchmark = runSideBySideBenchmark;


// 1. D/J Segment Reference Database (Embedded)
    const DJ_DATABASE = {"d_genes": [{"gene_id": "Xen-IGHD1-01", "species": "xenopus", "dna_seq": "ATTACTATGGTG", "rev_dna_seq": "CACCATAGTAAT", "aa_rf1": "ITMV", "aa_rf2": "LLW", "aa_rf3": "YYG", "aa_inv_rf1": "HHSN", "aa_inv_rf2": "TIV", "aa_inv_rf3": "P**"}, {"gene_id": "Xen-IGHD2-01", "species": "xenopus", "dna_seq": "GATCGGGGGTTTGAC", "rev_dna_seq": "GTCAAACCCCCGATC", "aa_rf1": "DRGFD", "aa_rf2": "IGGL", "aa_rf3": "SGV*", "aa_inv_rf1": "VKPPI", "aa_inv_rf2": "SNPR", "aa_inv_rf3": "QTPD"}, {"gene_id": "Xen-IGHD3-01", "species": "xenopus", "dna_seq": "TACTATGATTAC", "rev_dna_seq": "GTAATCATAGTA", "aa_rf1": "YYDY", "aa_rf2": "TMI", "aa_rf3": "L*L", "aa_inv_rf1": "VIIV", "aa_inv_rf2": "*S*", "aa_inv_rf3": "NHS"}, {"gene_id": "Xen-IGHD4-01", "species": "xenopus", "dna_seq": "GTTACTATGGTG", "rev_dna_seq": "CACCATAGTAAC", "aa_rf1": "VTMV", "aa_rf2": "LLW", "aa_rf3": "YYG", "aa_inv_rf1": "HHSN", "aa_inv_rf2": "TIV", "aa_inv_rf3": "P**"}, {"gene_id": "Xen-IGHD5-01", "species": "xenopus", "dna_seq": "ATTGTAGTAGTTACT", "rev_dna_seq": "AGTAACTACTACAAT", "aa_rf1": "IVVVT", "aa_rf2": "L**L", "aa_rf3": "CSSY", "aa_inv_rf1": "SNYYN", "aa_inv_rf2": "VTTT", "aa_inv_rf3": "*LLQ"}, {"gene_id": "Xen-IGHD6-01", "species": "xenopus", "dna_seq": "TACTACGGTAGT", "rev_dna_seq": "ACTACCGTAGTA", "aa_rf1": "YYGS", "aa_rf2": "TTV", "aa_rf3": "LR*", "aa_inv_rf1": "TTVV", "aa_inv_rf2": "LP*", "aa_inv_rf3": "YRS"}, {"gene_id": "Xen-IGHD7-01", "species": "xenopus", "dna_seq": "GGGGACTACGTT", "rev_dna_seq": "AACGTAGTCCCC", "aa_rf1": "GDYV", "aa_rf2": "GTT", "aa_rf3": "GLR", "aa_inv_rf1": "NVVP", "aa_inv_rf2": "T*S", "aa_inv_rf3": "RSP"}, {"gene_id": "Xen-IGHD1-02", "species": "xenopus", "dna_seq": "ATTACTACTGTG", "rev_dna_seq": "CACAGTAGTAAT", "aa_rf1": "ITTV", "aa_rf2": "LLL", "aa_rf3": "YYC", "aa_inv_rf1": "HSSN", "aa_inv_rf2": "TVV", "aa_inv_rf3": "Q**"}, {"gene_id": "Xen-IGHD2-02", "species": "xenopus", "dna_seq": "GATCGGGGCTTTGAC", "rev_dna_seq": "GTCAAAGCCCCGATC", "aa_rf1": "DRGFD", "aa_rf2": "IGAL", "aa_rf3": "SGL*", "aa_inv_rf1": "VKAPI", "aa_inv_rf2": "SKPR", "aa_inv_rf3": "QSPD"}, {"gene_id": "Xen-IGHD3-02", "species": "xenopus", "dna_seq": "TACTATGATTACTAC", "rev_dna_seq": "GTAGTAATCATAGTA", "aa_rf1": "YYDYY", "aa_rf2": "TMIT", "aa_rf3": "L*LL", "aa_inv_rf1": "VVIIV", "aa_inv_rf2": "**S*", "aa_inv_rf3": "SNHS"}, {"gene_id": "Xen-IGHD4-02", "species": "xenopus", "dna_seq": "GTTACTACTGTG", "rev_dna_seq": "CACAGTAGTAAC", "aa_rf1": "VTTV", "aa_rf2": "LLL", "aa_rf3": "YYC", "aa_inv_rf1": "HSSN", "aa_inv_rf2": "TVV", "aa_inv_rf3": "Q**"}, {"gene_id": "Xen-IGHD5-02", "species": "xenopus", "dna_seq": "ATTGTAGTAGTT", "rev_dna_seq": "AACTACTACAAT", "aa_rf1": "IVVV", "aa_rf2": "L**", "aa_rf3": "CSS", "aa_inv_rf1": "NYYN", "aa_inv_rf2": "TTT", "aa_inv_rf3": "LLQ"}, {"gene_id": "Xen-IGHD6-02", "species": "xenopus", "dna_seq": "TACTACGGTAGCTAC", "rev_dna_seq": "GTAGCTACCGTAGTA", "aa_rf1": "YYGSY", "aa_rf2": "TTVA", "aa_rf3": "LR*L", "aa_inv_rf1": "VATVV", "aa_inv_rf2": "*LP*", "aa_inv_rf3": "SYRS"}, {"gene_id": "Xen-IGHD7-02", "species": "xenopus", "dna_seq": "GGGGACTACTAT", "rev_dna_seq": "ATAGTAGTCCCC", "aa_rf1": "GDYY", "aa_rf2": "GTT", "aa_rf3": "GLL", "aa_inv_rf1": "IVVP", "aa_inv_rf2": "**S", "aa_inv_rf3": "SSP"}, {"gene_id": "Xen-IGHD1-03", "species": "xenopus", "dna_seq": "ACTATGGTG", "rev_dna_seq": "CACCATAGT", "aa_rf1": "TMV", "aa_rf2": "LW", "aa_rf3": "YG", "aa_inv_rf1": "HHS", "aa_inv_rf2": "TI", "aa_inv_rf3": "P*"}, {"gene_id": "Xen-IGHD2-03", "species": "xenopus", "dna_seq": "GATAGGGGTTTTGAC", "rev_dna_seq": "GTCAAAACCCCTATC", "aa_rf1": "DRGFD", "aa_rf2": "IGVL", "aa_rf3": "*GF*", "aa_inv_rf1": "VKTPI", "aa_inv_rf2": "SKPL", "aa_inv_rf3": "QNPY"}, {"gene_id": "Xen-IGHD3-03", "species": "xenopus", "dna_seq": "TACTATGATTACTAC", "rev_dna_seq": "GTAGTAATCATAGTA", "aa_rf1": "YYDYY", "aa_rf2": "TMIT", "aa_rf3": "L*LL", "aa_inv_rf1": "VVIIV", "aa_inv_rf2": "**S*", "aa_inv_rf3": "SNHS"}, {"gene_id": "Xen-IGHD4-03", "species": "xenopus", "dna_seq": "GTTACTACT", "rev_dna_seq": "AGTAGTAAC", "aa_rf1": "VTT", "aa_rf2": "LL", "aa_rf3": "YY", "aa_inv_rf1": "SSN", "aa_inv_rf2": "VV", "aa_inv_rf3": "**"}, {"gene_id": "Xen-IGHD8-01", "species": "xenopus", "dna_seq": "TACTATGGTGTT", "rev_dna_seq": "AACACCATAGTA", "aa_rf1": "YYGV", "aa_rf2": "TMV", "aa_rf3": "LWC", "aa_inv_rf1": "NTIV", "aa_inv_rf2": "TP*", "aa_inv_rf3": "HHS"}, {"gene_id": "Xen-IGHD9-01", "species": "xenopus", "dna_seq": "TATGATTACTAC", "rev_dna_seq": "GTAGTAATCATA", "aa_rf1": "YDYY", "aa_rf2": "MIT", "aa_rf3": "*LL", "aa_inv_rf1": "VVII", "aa_inv_rf2": "**S", "aa_inv_rf3": "SNH"}, {"gene_id": "vic_IGHD1-01", "species": "alpaca", "dna_seq": "GTATTACTATGGTGGTAGCTAC", "rev_dna_seq": "GTAGCTACCACCATAGTAATAC", "aa_rf1": "VLLWW*L", "aa_rf2": "YYYGGSY", "aa_rf3": "ITMVVA", "aa_inv_rf1": "VATTIVI", "aa_inv_rf2": "*LPP**Y", "aa_inv_rf3": "SYHHSN"}, {"gene_id": "vic_IGHD2-01", "species": "alpaca", "dna_seq": "GTAGTACTATGGTGGTAGTAGCTACTAC", "rev_dna_seq": "GTAGTAGCTACTACCACCATAGTACTAC", "aa_rf1": "VVLWW**LL", "aa_rf2": "*YYGGSSYY", "aa_rf3": "STMVVVAT", "aa_inv_rf1": "VVATTTIVL", "aa_inv_rf2": "**LLPP*YY", "aa_inv_rf3": "SSYYHHST"}, {"gene_id": "vic_IGHD3-01", "species": "alpaca", "dna_seq": "TTACTATGGTGGTAGCTACTACTAC", "rev_dna_seq": "GTAGTAGTAGCTACCACCATAGTAA", "aa_rf1": "LLWW*LLL", "aa_rf2": "YYGGSYYY", "aa_rf3": "TMVVATT", "aa_inv_rf1": "VVVATTIV", "aa_inv_rf2": "***LPP**", "aa_inv_rf3": "SSSYHHS"}, {"gene_id": "vic_IGHD4-01", "species": "alpaca", "dna_seq": "CTAACTGGGGA", "rev_dna_seq": "TCCCCAGTTAG", "aa_rf1": "LTG", "aa_rf2": "*LG", "aa_rf3": "NWG", "aa_inv_rf1": "SPV", "aa_inv_rf2": "PQL", "aa_inv_rf3": "PS*"}, {"gene_id": "gga_IGHD1*01", "species": "chicken", "dna_seq": "GGTAGTGGTTACTGTGGTAGTGGTGCTTAT", "rev_dna_seq": "ATAAGCACCACTACCACAGTAACCACTACC", "aa_rf1": "GSGYCGSGAY", "aa_rf2": "VVVTVVVVL", "aa_rf3": "*WLLW*WCL", "aa_inv_rf1": "ISTTTTVTTT", "aa_inv_rf2": "*APLPQ*PL", "aa_inv_rf3": "KHHYHSNHY"}, {"gene_id": "gga_IGHD2*01", "species": "chicken", "dna_seq": "GGTAGTGCTTGTTGTGGTCCTTAT", "rev_dna_seq": "ATAAGGACCACAACAAGCACTACC", "aa_rf1": "GSACCGPY", "aa_rf2": "VVLVVVL", "aa_rf3": "*CLLWSL", "aa_inv_rf1": "IRTTTSTT", "aa_inv_rf2": "*GPQQAL", "aa_inv_rf3": "KDHNKHY"}, {"gene_id": "gga_IGHD3*01", "species": "chicken", "dna_seq": "GGTACTTCTGGTGCCTGCACCTTTTTCTATCCTTCCTGCCCTTAT", "rev_dna_seq": "ATAAGGGCAGGAAGGATAGAAAAAGGTGCAGGCACCAGAAGTACC", "aa_rf1": "GTSGACTFFYPSCPY", "aa_rf2": "VLLVPAPFSILPAL", "aa_rf3": "YFWCLHLFLSFLPL", "aa_inv_rf1": "IRAGRIEKGAGTRST", "aa_inv_rf2": "*GQEG*KKVQAPEV", "aa_inv_rf3": "KGRKDRKRCRHQKY"}, {"gene_id": "gga_IGHD4*01", "species": "chicken", "dna_seq": "GGTCGTAGTGCTTACAGTTGTGGTGCTTAT", "rev_dna_seq": "ATAAGCACCACAACTGTAAGCACTACGACC", "aa_rf1": "GRSAYSCGAY", "aa_rf2": "VVVLTVVVL", "aa_rf3": "S*CLQLWCL", "aa_inv_rf1": "ISTTTVSTTT", "aa_inv_rf2": "*APQL*ALR", "aa_inv_rf3": "KHHNCKHYD"}, {"gene_id": "bos_IGHD1-01", "species": "cow", "dna_seq": "GTATTACTATGGTGGTAGCTAC", "rev_dna_seq": "GTAGCTACCACCATAGTAATAC", "aa_rf1": "VLLWW*L", "aa_rf2": "YYYGGSY", "aa_rf3": "ITMVVA", "aa_inv_rf1": "VATTIVI", "aa_inv_rf2": "*LPP**Y", "aa_inv_rf3": "SYHHSN"}, {"gene_id": "bos_IGHD2-01", "species": "cow", "dna_seq": "TTACTATGGTGGTAGTTGCTACTAC", "rev_dna_seq": "GTAGTAGCAACTACCACCATAGTAA", "aa_rf1": "LLWW*LLL", "aa_rf2": "YYGGSCYY", "aa_rf3": "TMVVVAT", "aa_inv_rf1": "VVATTTIV", "aa_inv_rf2": "**QLPP**", "aa_inv_rf3": "SSNYHHS"}, {"gene_id": "bos_IGHD3-01", "species": "cow", "dna_seq": "TTACTACTGTGGTAGTTGCTACTAC", "rev_dna_seq": "GTAGTAGCAACTACCACAGTAGTAA", "aa_rf1": "LLLW*LLL", "aa_rf2": "YYCGSCYY", "aa_rf3": "TTVVVAT", "aa_inv_rf1": "VVATTTVV", "aa_inv_rf2": "**QLPQ**", "aa_inv_rf3": "SSNYHSS"}, {"gene_id": "can_IGHD1-01", "species": "dog", "dna_seq": "GTTATTATGGTACTAGCTAC", "rev_dna_seq": "GTAGCTAGTACCATAATAAC", "aa_rf1": "VIMVLA", "aa_rf2": "LLWY*L", "aa_rf3": "YYGTSY", "aa_inv_rf1": "VASTII", "aa_inv_rf2": "*LVP**", "aa_inv_rf3": "S*YHNN"}, {"gene_id": "can_IGHD2-01", "species": "dog", "dna_seq": "GTATTACTATGATGGTAGTAGTTACTAC", "rev_dna_seq": "GTAGTAACTACTACCATCATAGTAATAC", "aa_rf1": "VLL*W**LL", "aa_rf2": "YYYDGSSYY", "aa_rf3": "ITMMVVVT", "aa_inv_rf1": "VVTTTIIVI", "aa_inv_rf2": "**LLPS**Y", "aa_inv_rf3": "SNYYHHSN"}, {"gene_id": "can_IGHD3-01", "species": "dog", "dna_seq": "GTAGTATTACTACGGTAGTAGCTAC", "rev_dna_seq": "GTAGCTACTACCGTAGTAATACTAC", "aa_rf1": "VVLLR**L", "aa_rf2": "*YYYGSSY", "aa_rf3": "SITTVVA", "aa_inv_rf1": "VATTVVIL", "aa_inv_rf2": "*LLP**YY", "aa_inv_rf3": "SYYRSNT"}, {"gene_id": "can_IGHD4-01", "species": "dog", "dna_seq": "TGACTACGGTGACTAC", "rev_dna_seq": "GTAGTCACCGTAGTCA", "aa_rf1": "*LR*L", "aa_rf2": "DYGDY", "aa_rf3": "TTVT", "aa_inv_rf1": "VVTVV", "aa_inv_rf2": "*SP*S", "aa_inv_rf3": "SHRS"}, {"gene_id": "can_IGHD5-01", "species": "dog", "dna_seq": "CTAACTGGGGA", "rev_dna_seq": "TCCCCAGTTAG", "aa_rf1": "LTG", "aa_rf2": "*LG", "aa_rf3": "NWG", "aa_inv_rf1": "SPV", "aa_inv_rf2": "PQL", "aa_inv_rf3": "PS*"}, {"gene_id": "IGHD1-1*01", "species": "human", "dna_seq": "GGTACAACTGGAACGAC", "rev_dna_seq": "GTCGTTCCAGTTGTACC", "aa_rf1": "GTTGT", "aa_rf2": "VQLER", "aa_rf3": "YNWND", "aa_inv_rf1": "VVPVV", "aa_inv_rf2": "SFQLY", "aa_inv_rf3": "RSSCT"}, {"gene_id": "IGHD1-20*01", "species": "human", "dna_seq": "GGTATAACCGGAACCAC", "rev_dna_seq": "GTGGTTCCGGTTATACC", "aa_rf1": "GITGT", "aa_rf2": "V*PEP", "aa_rf3": "YNRNH", "aa_inv_rf1": "VVPVI", "aa_inv_rf2": "WFRLY", "aa_inv_rf3": "GSGYT"}, {"gene_id": "IGHD1-20*01", "species": "human", "dna_seq": "GGTATAACTGGAACGAC", "rev_dna_seq": "GTCGTTCCAGTTATACC", "aa_rf1": "GITGT", "aa_rf2": "V*LER", "aa_rf3": "YNWND", "aa_inv_rf1": "VVPVI", "aa_inv_rf2": "SFQLY", "aa_inv_rf3": "RSSYT"}, {"gene_id": "IGHD1-26*01", "species": "human", "dna_seq": "GGTATAGTGGGAGCTACTAC", "rev_dna_seq": "GTAGTAGCTCCCACTATACC", "aa_rf1": "GIVGAT", "aa_rf2": "V*WELL", "aa_rf3": "YSGSYY", "aa_inv_rf1": "VVAPTI", "aa_inv_rf2": "**LPLY", "aa_inv_rf3": "SSSHYT"}, {"gene_id": "IGHD1-20*01", "species": "human", "dna_seq": "GGTATAACTGGAACTAC", "rev_dna_seq": "GTAGTTCCAGTTATACC", "aa_rf1": "GITGT", "aa_rf2": "V*LEL", "aa_rf3": "YNWNY", "aa_inv_rf1": "VVPVI", "aa_inv_rf2": "*FQLY", "aa_inv_rf3": "SSSYT"}, {"gene_id": "IGHD2-15*01", "species": "human", "dna_seq": "AGGATATTGTAGTGGTGGTAGCTGCTACTCC", "rev_dna_seq": "GGAGTAGCAGCTACCACCACTACAATATCCT", "aa_rf1": "RIL*WW*LLL", "aa_rf2": "GYCSGGSCYS", "aa_rf3": "DIVVVVAAT", "aa_inv_rf1": "GVAATTTTIS", "aa_inv_rf2": "E*QLPPLQYP", "aa_inv_rf3": "SSSYHHYNI"}, {"gene_id": "IGHD2-2*01", "species": "human", "dna_seq": "AGGATATTGTAGTAGTACCAGCTGCTATGCC", "rev_dna_seq": "GGCATAGCAGCTGGTACTACTACAATATCCT", "aa_rf1": "RIL**YQLLC", "aa_rf2": "GYCSSTSCYA", "aa_rf3": "DIVVVPAAM", "aa_inv_rf1": "GIAAGTTTIS", "aa_inv_rf2": "A*QLVLLQYP", "aa_inv_rf3": "HSSWYYYNI"}, {"gene_id": "IGHD2-2*02", "species": "human", "dna_seq": "AGGATATTGTAGTAGTACCAGCTGCTATACC", "rev_dna_seq": "GGTATAGCAGCTGGTACTACTACAATATCCT", "aa_rf1": "RIL**YQLLY", "aa_rf2": "GYCSSTSCYT", "aa_rf3": "DIVVVPAAI", "aa_inv_rf1": "GIAAGTTTIS", "aa_inv_rf2": "V*QLVLLQYP", "aa_inv_rf3": "YSSWYYYNI"}, {"gene_id": "IGHD2-21*02", "species": "human", "dna_seq": "AGCATATTGTGGTGGTGATTGCTATTCC", "rev_dna_seq": "GGAATAGCAATCACCACCACAATATGCT", "aa_rf1": "SILWW*LLF", "aa_rf2": "AYCGGDCYS", "aa_rf3": "HIVVVIAI", "aa_inv_rf1": "GIAITTTIC", "aa_inv_rf2": "E*QSPPQYA", "aa_inv_rf3": "NSNHHHNM"}, {"gene_id": "IGHD2-21*02", "species": "human", "dna_seq": "AGCATATTGTGGTGGTGACTGCTATTCC", "rev_dna_seq": "GGAATAGCAGTCACCACCACAATATGCT", "aa_rf1": "SILWW*LLF", "aa_rf2": "AYCGGDCYS", "aa_rf3": "HIVVVTAI", "aa_inv_rf1": "GIAVTTTIC", "aa_inv_rf2": "E*QSPPQYA", "aa_inv_rf3": "NSSHHHNM"}, {"gene_id": "IGHD2-8*01", "species": "human", "dna_seq": "AGGATATTGTACTAATGGTGTATGCTATACC", "rev_dna_seq": "GGTATAGCATACACCATTAGTACAATATCCT", "aa_rf1": "RILY*WCMLY", "aa_rf2": "GYCTNGVCYT", "aa_rf3": "DIVLMVYAI", "aa_inv_rf1": "GIAYTISTIS", "aa_inv_rf2": "V*HTPLVQYP", "aa_inv_rf3": "YSIHH*YNI"}, {"gene_id": "IGHD2-8*02", "species": "human", "dna_seq": "AGGATATTGTACTGGTGGTGTATGCTATACC", "rev_dna_seq": "GGTATAGCATACACCACCAGTACAATATCCT", "aa_rf1": "RILYWWCMLY", "aa_rf2": "GYCTGGVCYT", "aa_rf3": "DIVLVVYAI", "aa_inv_rf1": "GIAYTTSTIS", "aa_inv_rf2": "V*HTPPVQYP", "aa_inv_rf3": "YSIHHQYNI"}, {"gene_id": "IGHD3-10*01", "species": "human", "dna_seq": "GTATTACTATGGTTCGGGGAGTTATTATAAC", "rev_dna_seq": "GTTATAATAACTCCCCGAACCATAGTAATAC", "aa_rf1": "VLLWFGELL*", "aa_rf2": "YYYGSGSYYN", "aa_rf3": "ITMVRGVII", "aa_inv_rf1": "VIITPRTIVI", "aa_inv_rf2": "L**LPEP**Y", "aa_inv_rf3": "YNNSPNHSN"}, {"gene_id": "IGHD3-10*02", "species": "human", "dna_seq": "GTATTACTATGGTTCCGGGAGTTATTATAAC", "rev_dna_seq": "GTTATAATAACTCCCGGAACCATAGTAATAC", "aa_rf1": "VLLWFRELL*", "aa_rf2": "YYYGSGSYYN", "aa_rf3": "ITMVPGVII", "aa_inv_rf1": "VIITPGTIVI", "aa_inv_rf2": "L**LPEP**Y", "aa_inv_rf3": "YNNSRNHSN"}, {"gene_id": "IGHD3-16*01", "species": "human", "dna_seq": "GTATTATGATTACGTTTGGGGGAGTTATGCTTATACC", "rev_dna_seq": "GGTATAAGCATAACTCCCCCAAACGTAATCATAATAC", "aa_rf1": "VL*LRLGELCLY", "aa_rf2": "YYDYVWGSYAYT", "aa_rf3": "IMITFGGVMLI", "aa_inv_rf1": "GISITPPNVIII", "aa_inv_rf2": "V*A*LPQT*S*Y", "aa_inv_rf3": "YKHNSPKRNHN"}, {"gene_id": "IGHD3-16*02", "species": "human", "dna_seq": "GTATTATGATTACGTTGGGGGGAGTTATGCTTATACC", "rev_dna_seq": "GGTATAAGCATAACTCCCCCCAACGTAATCATAATAC", "aa_rf1": "VL*LRWGELCLY", "aa_rf2": "YYDYVGGSYAYT", "aa_rf3": "IMITLGGVMLI", "aa_inv_rf1": "GISITPPNVIII", "aa_inv_rf2": "V*A*LPPT*S*Y", "aa_inv_rf3": "YKHNSPQRNHN"}, {"gene_id": "IGHD3-22*01", "species": "human", "dna_seq": "GTATTACTATGATAGTAGTGGTTATTACTAC", "rev_dna_seq": "GTAGTAATAACCACTACTATCATAGTAATAC", "aa_rf1": "VLL***WLLL", "aa_rf2": "YYYDSSGYYY", "aa_rf3": "ITMIVVVIT", "aa_inv_rf1": "VVITTTIIVI", "aa_inv_rf2": "***PLLS**Y", "aa_inv_rf3": "SNNHYYHSN"}, {"gene_id": "IGHD3-3*01", "species": "human", "dna_seq": "GTATTACGATTTTTGGAGTGGTTATTATACC", "rev_dna_seq": "GGTATAATAACCACTCCAAAAATCGTAATAC", "aa_rf1": "VLRFLEWLLY", "aa_rf2": "YYDFWSGYYT", "aa_rf3": "ITIFGVVII", "aa_inv_rf1": "GIITTPKIVI", "aa_inv_rf2": "V**PLQKS*Y", "aa_inv_rf3": "YNNHSKNRN"}, {"gene_id": "IGHD3-9*01", "species": "human", "dna_seq": "GTATTACGATATTTTGACTGGTTATTATAAC", "rev_dna_seq": "GTTATAATAACCAGTCAAAATATCGTAATAC", "aa_rf1": "VLRYFDWLL*", "aa_rf2": "YYDILTGYYN", "aa_rf3": "ITIF*LVII", "aa_inv_rf1": "VIITSQNIVI", "aa_inv_rf2": "L**PVKIS*Y", "aa_inv_rf3": "YNNQSKYRN"}, {"gene_id": "IGHD4-11*01", "species": "human", "dna_seq": "TGACTACAGTAACTAC", "rev_dna_seq": "GTAGTTACTGTAGTCA", "aa_rf1": "*LQ*L", "aa_rf2": "DYSNY", "aa_rf3": "TTVT", "aa_inv_rf1": "VVTVV", "aa_inv_rf2": "*LL*S", "aa_inv_rf3": "SYCS"}, {"gene_id": "IGHD4-17*01", "species": "human", "dna_seq": "TGACTACGGTGACTAC", "rev_dna_seq": "GTAGTCACCGTAGTCA", "aa_rf1": "*LR*L", "aa_rf2": "DYGDY", "aa_rf3": "TTVT", "aa_inv_rf1": "VVTVV", "aa_inv_rf2": "*SP*S", "aa_inv_rf3": "SHRS"}, {"gene_id": "IGHD4-23*01", "species": "human", "dna_seq": "TGACTACGGTGGTAACTAC", "rev_dna_seq": "GTAGTTACCACCGTAGTCA", "aa_rf1": "*LRW*L", "aa_rf2": "DYGGNY", "aa_rf3": "TTVVT", "aa_inv_rf1": "VVTTVV", "aa_inv_rf2": "*LPP*S", "aa_inv_rf3": "SYHRS"}, {"gene_id": "IGHD4-11*01", "species": "human", "dna_seq": "TGACTACAGTAACTAC", "rev_dna_seq": "GTAGTTACTGTAGTCA", "aa_rf1": "*LQ*L", "aa_rf2": "DYSNY", "aa_rf3": "TTVT", "aa_inv_rf1": "VVTVV", "aa_inv_rf2": "*LL*S", "aa_inv_rf3": "SYCS"}, {"gene_id": "IGHD5-12*01", "species": "human", "dna_seq": "GTGGATATAGTGGCTACGATTAC", "rev_dna_seq": "GTAATCGTAGCCACTATATCCAC", "aa_rf1": "VDIVATI", "aa_rf2": "WI*WLRL", "aa_rf3": "GYSGYDY", "aa_inv_rf1": "VIVATIS", "aa_inv_rf2": "*S*PLYP", "aa_inv_rf3": "NRSHYIH"}, {"gene_id": "IGHD5-18*01", "species": "human", "dna_seq": "GTGGATACAGCTATGGTTAC", "rev_dna_seq": "GTAACCATAGCTGTATCCAC", "aa_rf1": "VDTAMV", "aa_rf2": "WIQLWL", "aa_rf3": "GYSYGY", "aa_inv_rf1": "VTIAVS", "aa_inv_rf2": "*P*LYP", "aa_inv_rf3": "NHSCIH"}, {"gene_id": "IGHD5-24*01", "species": "human", "dna_seq": "GTAGAGATGGCTACAATTAC", "rev_dna_seq": "GTAATTGTAGCCATCTCTAC", "aa_rf1": "VEMATI", "aa_rf2": "*RWLQL", "aa_rf3": "RDGYNY", "aa_inv_rf1": "VIVAIS", "aa_inv_rf2": "*L*PSL", "aa_inv_rf3": "NCSHLY"}, {"gene_id": "IGHD5-18*01", "species": "human", "dna_seq": "GTGGATACAGCTATGGTTAC", "rev_dna_seq": "GTAACCATAGCTGTATCCAC", "aa_rf1": "VDTAMV", "aa_rf2": "WIQLWL", "aa_rf3": "GYSYGY", "aa_inv_rf1": "VTIAVS", "aa_inv_rf2": "*P*LYP", "aa_inv_rf3": "NHSCIH"}, {"gene_id": "IGHD6-13*01", "species": "human", "dna_seq": "GGGTATAGCAGCAGCTGGTACTAC", "rev_dna_seq": "GTAGTACCAGCTGCTGCTATACCC", "aa_rf1": "GYSSSWYY", "aa_rf2": "GIAAAGT", "aa_rf3": "V*QQLVL", "aa_inv_rf1": "VVPAAAIP", "aa_inv_rf2": "*YQLLLY", "aa_inv_rf3": "STSCCYT"}, {"gene_id": "IGHD6-25*01", "species": "human", "dna_seq": "GGGTATAGCAGTGGCTGGTAC", "rev_dna_seq": "GTACCAGCCACTGCTATACCC", "aa_rf1": "GYSSGWY", "aa_rf2": "GIAVAG", "aa_rf3": "V*QWLV", "aa_inv_rf1": "VPATAIP", "aa_inv_rf2": "YQPLLY", "aa_inv_rf3": "TSHCYT"}, {"gene_id": "IGHD6-25*01", "species": "human", "dna_seq": "GGGTATAGCAGTGGCTGGTAC", "rev_dna_seq": "GTACCAGCCACTGCTATACCC", "aa_rf1": "GYSSGWY", "aa_rf2": "GIAVAG", "aa_rf3": "V*QWLV", "aa_inv_rf1": "VPATAIP", "aa_inv_rf2": "YQPLLY", "aa_inv_rf3": "TSHCYT"}, {"gene_id": "IGHD6-6*01", "species": "human", "dna_seq": "GAGTATAGCAGCTCGTCC", "rev_dna_seq": "GGACGAGCTGCTATACTC", "aa_rf1": "EYSSSS", "aa_rf2": "SIAAR", "aa_rf3": "V*QLV", "aa_inv_rf1": "GRAAIL", "aa_inv_rf2": "DELLY", "aa_inv_rf3": "TSCYT"}, {"gene_id": "IGHD7-27*01", "species": "human", "dna_seq": "CTAACTGGGGA", "rev_dna_seq": "TCCCCAGTTAG", "aa_rf1": "LTG", "aa_rf2": "*LG", "aa_rf3": "NWG", "aa_inv_rf1": "SPV", "aa_inv_rf2": "PQL", "aa_inv_rf3": "PS*"}, {"gene_id": "mus_DFL16.1", "species": "mouse", "dna_seq": "TTTATTACTACGGTAGTAGCTAC", "rev_dna_seq": "GTAGCTACTACCGTAGTAATAAA", "aa_rf1": "FITTVVA", "aa_rf2": "LLLR**L", "aa_rf3": "YYYGSSY", "aa_inv_rf1": "VATTVVI", "aa_inv_rf2": "*LLP***", "aa_inv_rf3": "SYYRSNK"}, {"gene_id": "mus_DFL16.2", "species": "mouse", "dna_seq": "TTCATTACTACGGCTAC", "rev_dna_seq": "GTAGCCGTAGTAATGAA", "aa_rf1": "FITTA", "aa_rf2": "SLLRL", "aa_rf3": "HYYGY", "aa_inv_rf1": "VAVVM", "aa_inv_rf2": "*P***", "aa_inv_rf3": "SRSNE"}, {"gene_id": "mus_DFL16.3", "species": "mouse", "dna_seq": "TATATAACTAAAGTGGTAGCTCA", "rev_dna_seq": "TGAGCTACCACTTTAGTTATATA", "aa_rf1": "YITKVVA", "aa_rf2": "I*LKW*L", "aa_rf3": "YN*SGSS", "aa_inv_rf1": "*ATTLVI", "aa_inv_rf2": "ELPL*LY", "aa_inv_rf3": "SYHFSYI"}, {"gene_id": "mus_DQ52a.1", "species": "mouse", "dna_seq": "CTAACTGGGAC", "rev_dna_seq": "GTCCCAGTTAG", "aa_rf1": "LTG", "aa_rf2": "*LG", "aa_rf3": "NWD", "aa_inv_rf1": "VPV", "aa_inv_rf2": "SQL", "aa_inv_rf3": "PS*"}, {"gene_id": "mus_DQ52a.2", "species": "mouse", "dna_seq": "CAACTGGGAC", "rev_dna_seq": "GTCCCAGTTG", "aa_rf1": "QLG", "aa_rf2": "NWD", "aa_rf3": "TG", "aa_inv_rf1": "VPV", "aa_inv_rf2": "SQL", "aa_inv_rf3": "PS"}, {"gene_id": "mus_DSP2.1", "species": "mouse", "dna_seq": "CTACTATGGTAACTAC", "rev_dna_seq": "GTAGTTACCATAGTAG", "aa_rf1": "LLW*L", "aa_rf2": "YYGNY", "aa_rf3": "TMVT", "aa_inv_rf1": "VVTIV", "aa_inv_rf2": "*LP**", "aa_inv_rf3": "SYHS"}, {"gene_id": "mus_DSP2.2", "species": "mouse", "dna_seq": "CTACTATGGTTACGAC", "rev_dna_seq": "GTCGTAACCATAGTAG", "aa_rf1": "LLWLR", "aa_rf2": "YYGYD", "aa_rf3": "TMVT", "aa_inv_rf1": "VVTIV", "aa_inv_rf2": "S*P**", "aa_inv_rf3": "RNHS"}, {"gene_id": "mus_DSP2.3", "species": "mouse", "dna_seq": "CCTACTATAGTAACTAC", "rev_dna_seq": "GTAGTTACTATAGTAGG", "aa_rf1": "PTIVT", "aa_rf2": "LL**L", "aa_rf3": "YYSNY", "aa_inv_rf1": "VVTIV", "aa_inv_rf2": "*LL**", "aa_inv_rf3": "SYYSR"}, {"gene_id": "mus_DSP2.4", "species": "mouse", "dna_seq": "TCTACTATGATTACGAC", "rev_dna_seq": "GTCGTAATCATAGTAGA", "aa_rf1": "STMIT", "aa_rf2": "LL*LR", "aa_rf3": "YYDYD", "aa_inv_rf1": "VVIIV", "aa_inv_rf2": "S*S**", "aa_inv_rf3": "RNHSR"}, {"gene_id": "mus_DSP2.5", "species": "mouse", "dna_seq": "TCTATGATGGTTACTAC", "rev_dna_seq": "GTAGTAACCATCATAGA", "aa_rf1": "SMMVT", "aa_rf2": "L*WLL", "aa_rf3": "YDGYY", "aa_inv_rf1": "VVTII", "aa_inv_rf2": "**PS*", "aa_inv_rf3": "SNHHR"}, {"gene_id": "mus_DSP2.6", "species": "mouse", "dna_seq": "GTAGTACTACGGTAGTAGCTAC", "rev_dna_seq": "GTAGCTACTACCGTAGTACTAC", "aa_rf1": "VVLR**L", "aa_rf2": "*YYGSSY", "aa_rf3": "STTVVA", "aa_inv_rf1": "VATTVVL", "aa_inv_rf2": "*LLP*YY", "aa_inv_rf3": "SYYRST"}, {"gene_id": "mus_DSP2.7", "species": "mouse", "dna_seq": "ATTACTACGGTAGTAGCTAC", "rev_dna_seq": "GTAGCTACTACCGTAGTAAT", "aa_rf1": "ITTVVA", "aa_rf2": "LLR**L", "aa_rf3": "YYGSSY", "aa_inv_rf1": "VATTVV", "aa_inv_rf2": "*LLP**", "aa_inv_rf3": "SYYRSN"}, {"gene_id": "mus_DSP2.8", "species": "mouse", "dna_seq": "CTACTATAGTAACTAC", "rev_dna_seq": "GTAGTTACTATAGTAG", "aa_rf1": "LL**L", "aa_rf2": "YYSNY", "aa_rf3": "TIVT", "aa_inv_rf1": "VVTIV", "aa_inv_rf2": "*LL**", "aa_inv_rf3": "SYYS"}, {"gene_id": "mus_DSP2.9", "species": "mouse", "dna_seq": "CTACTATGATTACGAC", "rev_dna_seq": "GTCGTAATCATAGTAG", "aa_rf1": "LL*LR", "aa_rf2": "YYDYD", "aa_rf3": "TMIT", "aa_inv_rf1": "VVIIV", "aa_inv_rf2": "S*S**", "aa_inv_rf3": "RNHS"}, {"gene_id": "rab_DH1-01", "species": "rabbit", "dna_seq": "GCATATACTAGTAGTAGTGGTTATTATATAC", "rev_dna_seq": "GTATATAATAACCACTACTACTAGTATATGC", "aa_rf1": "AYTSSSGYYI", "aa_rf2": "HILVVVVIIY", "aa_rf3": "IY***WLLY", "aa_inv_rf1": "VYNNHYY*YM", "aa_inv_rf2": "YIITTTTSIC", "aa_inv_rf3": "I**PLLLVY"}, {"gene_id": "rab_DH2-02", "species": "rabbit", "dna_seq": "TAGCTACGATGACTATGGTGATTAC", "rev_dna_seq": "GTAATCACCATAGTCATCGTAGCTA", "aa_rf1": "*LR*LW*L", "aa_rf2": "SYDDYGDY", "aa_rf3": "ATMTMVI", "aa_inv_rf1": "VITIVIVA", "aa_inv_rf2": "*SP*SS*L", "aa_inv_rf3": "NHHSHRS"}, {"gene_id": "rab_DH3-04", "species": "rabbit", "dna_seq": "CCTATGGGGTCCTGGTTCCCATGGCTATGGGGTT", "rev_dna_seq": "AACCCCATAGCCATGGGAACCAGGACCCCATAGG", "aa_rf1": "PMGSWFPWLWG", "aa_rf2": "LWGPGSHGYGV", "aa_rf3": "YGVLVPMAMG", "aa_inv_rf1": "NPIAMGTRTP*", "aa_inv_rf2": "TP*PWEPGPHR", "aa_inv_rf3": "PHSHGNQDPI"}, {"gene_id": "rab_DH3-04", "species": "rabbit", "dna_seq": "CCTATGGGGTCCTGGTTCCCATGGCTATGGGGTT", "rev_dna_seq": "AACCCCATAGCCATGGGAACCAGGACCCCATAGG", "aa_rf1": "PMGSWFPWLWG", "aa_rf2": "LWGPGSHGYGV", "aa_rf3": "YGVLVPMAMG", "aa_inv_rf1": "NPIAMGTRTP*", "aa_inv_rf2": "TP*PWEPGPHR", "aa_inv_rf3": "PHSHGNQDPI"}, {"gene_id": "rab_DH3-05", "species": "rabbit", "dna_seq": "CCTATGGGGTCCTTGTTCCCATGGCTATGCAGTC", "rev_dna_seq": "GACTGCATAGCCATGGGAACAAGGACCCCATAGG", "aa_rf1": "PMGSLFPWLCS", "aa_rf2": "LWGPCSHGYAV", "aa_rf3": "YGVLVPMAMQ", "aa_inv_rf1": "DCIAMGTRTP*", "aa_inv_rf2": "TA*PWEQGPHR", "aa_inv_rf3": "LHSHGNKDPI"}, {"gene_id": "rab_DH4-06", "species": "rabbit", "dna_seq": "GTTACTATAGTAGTGGCTGGGGTG", "rev_dna_seq": "CACCCCAGCCACTACTATAGTAAC", "aa_rf1": "VTIVVAGV", "aa_rf2": "LL**WLG", "aa_rf3": "YYSSGWG", "aa_inv_rf1": "HPSHYYSN", "aa_inv_rf2": "TPATTIV", "aa_inv_rf3": "PQPLL**"}, {"gene_id": "rab_DH4-07", "species": "rabbit", "dna_seq": "GTTATGCTGGTAGTAGCTGGGATG", "rev_dna_seq": "CATCCCAGCTACTACCAGCATAAC", "aa_rf1": "VMLVVAGM", "aa_rf2": "LCW**LG", "aa_rf3": "YAGSSWD", "aa_inv_rf1": "HPSYYQHN", "aa_inv_rf2": "IPATTSI", "aa_inv_rf3": "SQLLPA*"}, {"gene_id": "rab_DH5-08", "species": "rabbit", "dna_seq": "ATTTGGTGAAGGGCCGACCCACCATGTAGCTATGGTAGTTAC", "rev_dna_seq": "GTAACTACCATAGCTACATGGTGGGTCGGCCCTTCACCAAAT", "aa_rf1": "IW*RADPPCSYGSY", "aa_rf2": "FGEGPTHHVAMVV", "aa_rf3": "LVKGRPTM*LW*L", "aa_inv_rf1": "VTTIATWWVGPSPN", "aa_inv_rf2": "*LP*LHGGSALHQ", "aa_inv_rf3": "NYHSYMVGRPFTK"}, {"gene_id": "rab_DH6-09", "species": "rabbit", "dna_seq": "GTTACTATAGTTATGGTTATGCTTATGCTACC", "rev_dna_seq": "GGTAGCATAAGCATAACCATAACTATAGTAAC", "aa_rf1": "VTIVMVMLML", "aa_rf2": "LL*LWLCLCY", "aa_rf3": "YYSYGYAYAT", "aa_inv_rf1": "GSISITITIV", "aa_inv_rf2": "VA*A*P*L**", "aa_inv_rf3": "*HKHNHNYSN"}, {"gene_id": "rab_DH7-10", "species": "rabbit", "dna_seq": "GTTATCCTGGTTATAGTACTGGTACC", "rev_dna_seq": "GGTACCAGTACTATAACCAGGATAAC", "aa_rf1": "VILVIVLV", "aa_rf2": "LSWL*YWY", "aa_rf3": "YPGYSTGT", "aa_inv_rf1": "GTSTITRI", "aa_inv_rf2": "VPVL*PG*", "aa_inv_rf3": "YQYYNQDN"}, {"gene_id": "rab_DH8-11", "species": "rabbit", "dna_seq": "GTTATGCTGGTAGTAGTTATTATACC", "rev_dna_seq": "GGTATAATAACTACTACCAGCATAAC", "aa_rf1": "VMLVVVII", "aa_rf2": "LCW**LLY", "aa_rf3": "YAGSSYYT", "aa_inv_rf1": "GIITTTSI", "aa_inv_rf2": "V**LLPA*", "aa_inv_rf3": "YNNYYQHN"}, {"gene_id": "TRBD1*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GGGACAGGGGGC", "rev_dna_seq": "GCCCCCTGTCCC", "aa_rf1": "GTGG", "aa_rf2": "GQG", "aa_rf3": "DRG", "aa_inv_rf1": "APCP", "aa_inv_rf2": "PPV", "aa_inv_rf3": "PLS", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}, {"gene_id": "TRBD2*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GGGACTGGGGGGGC", "rev_dna_seq": "GCCCCCCCAGTCCC", "aa_rf1": "GTGG", "aa_rf2": "GLGG", "aa_rf3": "DWGG", "aa_inv_rf1": "APPV", "aa_inv_rf2": "PPQS", "aa_inv_rf3": "PPSP", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}, {"gene_id": "TRDD1*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "GAAATAGT", "rev_dna_seq": "ACTATTTC", "aa_rf1": "EI", "aa_rf2": "K*", "aa_rf3": "NS", "aa_inv_rf1": "TI", "aa_inv_rf2": "LF", "aa_inv_rf3": "YF", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-12-CACTGTG"}, {"gene_id": "TRDD2*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "CCTTCCTAC", "rev_dna_seq": "GTAGGAAGG", "aa_rf1": "PSY", "aa_rf2": "LP", "aa_rf3": "FL", "aa_inv_rf1": "VGR", "aa_inv_rf2": "*E", "aa_inv_rf3": "RK", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-12-CACTGTG"}, {"gene_id": "TRDD3*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ACTGGGGGATACG", "rev_dna_seq": "CGTATCCCCCAGT", "aa_rf1": "TGGY", "aa_rf2": "LGDT", "aa_rf3": "WGI", "aa_inv_rf1": "RIPQ", "aa_inv_rf2": "VSPS", "aa_inv_rf3": "YPP", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}, {"gene_id": "mus_TRBD1*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GGGACAGGGGGC", "rev_dna_seq": "GCCCCCTGTCCC", "aa_rf1": "GTGG", "aa_rf2": "GQG", "aa_rf3": "DRG", "aa_inv_rf1": "APCP", "aa_inv_rf2": "PPV", "aa_inv_rf3": "PLS", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}, {"gene_id": "mus_TRBD2*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GGGACTGGGGGGGC", "rev_dna_seq": "GCCCCCCCAGTCCC", "aa_rf1": "GTGG", "aa_rf2": "GLGG", "aa_rf3": "DWGG", "aa_inv_rf1": "APPV", "aa_inv_rf2": "PPQS", "aa_inv_rf3": "PPSP", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}, {"gene_id": "mus_TRDD1*01", "species": "mouse", "chain_type": "TRD", "locus": "TRD", "dna_seq": "GAAATAG", "rev_dna_seq": "CTATTTC", "aa_rf1": "EI", "aa_rf2": "K*", "aa_rf3": "N", "aa_inv_rf1": "LF", "aa_inv_rf2": "YF", "aa_inv_rf3": "I", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-12-CACTGTG"}, {"gene_id": "mus_TRDD2*01", "species": "mouse", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ATCGGAGGGATAC", "rev_dna_seq": "GTATCCCTCCGAT", "aa_rf1": "IGGI", "aa_rf2": "SEGY", "aa_rf3": "RRD", "aa_inv_rf1": "VSLR", "aa_inv_rf2": "YPSD", "aa_inv_rf3": "IPP", "rss_5": "CACAGTG-12-ACAAAAACC", "rss_3": "GGTTTTTGT-23-CACTGTG"}], "j_genes": [{"gene_id": "Xen-IGKJ1-02", "species": "xenopus", "chain_type": "Light-Kappa", "dna_seq": "TACACGTTCGGAGGGGGGACCAAGGTGGAGATCAAA", "aa_seq": "YTFGGGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "Xen-IGLJ1-01", "species": "xenopus", "chain_type": "Light-Lambda", "dna_seq": "GTCACGTTCGGAGGAGGAACCAAGCTGACCGTCCTA", "aa_seq": "VTFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "Xen-IGLJ1-02", "species": "xenopus", "chain_type": "Light-Lambda", "dna_seq": "GTCACGTTCGGAGGAGGAACCAAGCTGACCGTCCTA", "aa_seq": "VTFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "Xen-IGRJ1-01", "species": "xenopus", "chain_type": "Light-Rho", "dna_seq": "TGGACGTTCGGTGGAGGCACCAAGCTGACCGTCCTA", "aa_seq": "WTFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "Xen-IGRJ1-02", "species": "xenopus", "chain_type": "Light-Rho", "dna_seq": "TGGACGTTCGGTGGAGGCACCAAGCTGACCGTCCTA", "aa_seq": "WTFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "Xen-IGSJ1-01", "species": "xenopus", "chain_type": "Light-Sigma", "dna_seq": "CTCACGTTCGGTGCTGGGACCAAGGTGGAGATCAAA", "aa_seq": "LTFGAGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "Xen-IGSJ1-02", "species": "xenopus", "chain_type": "Light-Sigma", "dna_seq": "CTCACGTTCGGTGCTGGGACCAAGGTGGAGATCAAA", "aa_seq": "LTFGAGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "Xen-IGHJ1-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "ACTACTTGGGGCCAGGGCACTCTGGTCACCGTCTCCTCA", "aa_seq": "TTWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ2-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "ATTTACTACTGGGGCCAGGGCACCCTGGTGACCGTGTCCGCA", "aa_seq": "IYYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "Xen-IGHJ3-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "TTTGACTACTGGGGCCAGGGCACTCTGGTCACCGTCTCCTCA", "aa_seq": "FDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ6-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "TACTACTGGGGCCAGGGCACTCTGGTCACCGTCTCCTCA", "aa_seq": "YYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ1-02", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "ACTACTTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "TTWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ2-02", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "ATTTACTACTGGGGCCAGGGCACCCTGGTGACCGTGTCTGCA", "aa_seq": "IYYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "Xen-IGHJ3-02", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "TTTGACTACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "FDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ7-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "GACTACTGGGGCCAGGGCACTCTGGTCACCGTCTCCTCA", "aa_seq": "DYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ4-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "GCTTACTGGGGCCAGGGTACTCTGGTCACCGTCTCCTCA", "aa_seq": "AYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ5-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "TTTGACCACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "FDHWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "Xen-IGHJ8-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "GCTTACTGGGGCCAGGGCACCCTGGTGACCGTGTCCGCA", "aa_seq": "AYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "Xen-IGHJ9-01", "species": "xenopus", "chain_type": "Heavy", "dna_seq": "TTTGACTACTGGGGCCAGGGCACCCTGGTGACCGTGTCCGCA", "aa_seq": "FDYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "Xen-IGKJ1-01", "species": "xenopus", "chain_type": "Light-Kappa", "dna_seq": "TACACGTTCGGAGGGGGGACCAAGCTGGAAATAAAA", "aa_seq": "YTFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "vic_IGKJ1", "species": "alpaca", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "vic_IGLJ1", "species": "alpaca", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "vic_IGHJ1", "species": "alpaca", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "vic_IGHJ2", "species": "alpaca", "chain_type": "Heavy", "dna_seq": "GCTGAATACTTCCAGCACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "AEYFQHWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "gga_IGHJ1", "species": "chicken", "chain_type": "Heavy", "dna_seq": "TACTATGCTATGGACTACTGGGGTCAAGGAACCTCAGTCACCGTCTCCTCA", "aa_seq": "YYAMDYWGQGTSVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "gga_IGLJ1", "species": "chicken", "chain_type": "Lambda", "dna_seq": "TTTATTTTCGGCAGTGGAACCAAGGTCACTGTCCTA", "aa_seq": "FIFGSGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "bos_IGLJ1", "species": "cow", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "bos_IGLJ2", "species": "cow", "chain_type": "Lambda", "dna_seq": "TGGGTGTTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "WVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "bos_IGLJ3", "species": "cow", "chain_type": "Lambda", "dna_seq": "TATGTCTTCGGAACTGGGACCAAGGTCACCGTCCTA", "aa_seq": "YVFGTGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "bos_IGHJ1", "species": "cow", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "bos_IGHJ2", "species": "cow", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "can_IGKJ1", "species": "dog", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "can_IGKJ2", "species": "dog", "chain_type": "Kappa", "dna_seq": "TACACTTTTGGCCAGGGGACCAAGCTGGAGATCAAA", "aa_seq": "YTFGQGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "can_IGLJ1", "species": "dog", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "can_IGHJ1", "species": "dog", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "can_IGHJ2", "species": "dog", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "eca_IGKJ1", "species": "horse", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "eca_IGLJ1", "species": "horse", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "eca_IGHJ1", "species": "horse", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "eca_IGHJ2", "species": "horse", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ1*01", "species": "human", "chain_type": "Heavy", "dna_seq": "GCTGAATACTTCCAGCACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "AEYFQHWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ2*01", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ3*02", "species": "human", "chain_type": "Heavy", "dna_seq": "GATGCTTTTGATATCTGGGGCCAAGGGACAATGGTCACCGTCTCTTCA", "aa_seq": "DAFDIWGQGTMVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ3*02", "species": "human", "chain_type": "Heavy", "dna_seq": "GATGCTTTTGATATCTGGGGCCAAGGGACAATGGTCACCGTCTCTTCA", "aa_seq": "DAFDIWGQGTMVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ4*03", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ4*03", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ4*03", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAAGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ5*02", "species": "human", "chain_type": "Heavy", "dna_seq": "AACTGGTTCGACCCCTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "NWFDPWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ5*02", "species": "human", "chain_type": "Heavy", "dna_seq": "AACTGGTTCGACCCCTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "NWFDPWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ6*04", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACGGTATGGACGTCTGGGGCCAAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YYYYYGMDVWGQGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ6*04", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACGGTATGGACGTCTGGGGCCAAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YYYYYGMDVWGQGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ6*03", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACTACATGGACGTCTGGGGCAAAGGGACCACGATCACCGTCTCCTCA", "aa_seq": "YYYYYYMDVWGKGTTITVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGHJ6*04", "species": "human", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACGGTATGGACGTCTGGGGCCAAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YYYYYGMDVWGQGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "hum_IGLJ1*01", "species": "human", "chain_type": "Lambda", "dna_seq": "TATGTCTTCGGAACTGGGACCAAGGTCACCGTCCTA", "aa_seq": "YVFGTGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ3*01", "species": "human", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ3*01", "species": "human", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ3*02", "species": "human", "chain_type": "Lambda", "dna_seq": "TGGGTGTTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "WVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ6*01", "species": "human", "chain_type": "Lambda", "dna_seq": "AATGTGTTCGGCAGTGGCACCAAGGTGACCGTCCTC", "aa_seq": "NVFGSGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ7*01", "species": "human", "chain_type": "Lambda", "dna_seq": "GCTGTGTTCGGAGGAGGCACCCAGCTGACCGTCCTC", "aa_seq": "AVFGGGTQLTVL", "boundary_motif": "TVL"}, {"gene_id": "hum_IGLJ7*02", "species": "human", "chain_type": "Lambda", "dna_seq": "GCTGTGTTCGGAGGAGGCACCCAGCTGACCGCCCTC", "aa_seq": "AVFGGGTQLTAL", "boundary_motif": ""}, {"gene_id": "hum_IGKJ1*01", "species": "human", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "hum_IGKJ2*02", "species": "human", "chain_type": "Kappa", "dna_seq": "TACACTTTTGGCCAGGGGACCAAGCTGGAGATCAAA", "aa_seq": "YTFGQGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "hum_IGKJ2*02", "species": "human", "chain_type": "Kappa", "dna_seq": "TACACTTTTGGCCAGGGGACCAAGCTGGAGATCAAA", "aa_seq": "YTFGQGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "hum_IGKJ2*03", "species": "human", "chain_type": "Kappa", "dna_seq": "TACAGTTTTGGCCAGGGGACCAAGCTGGAGATCAAA", "aa_seq": "YSFGQGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "hum_IGKJ2*04", "species": "human", "chain_type": "Kappa", "dna_seq": "TGCAGTTTTGGCCAGGGGACCAAGCTGGAGATCAAA", "aa_seq": "CSFGQGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "hum_IGKJ3*01", "species": "human", "chain_type": "Kappa", "dna_seq": "TTCACTTTCGGCCCTGGGACCAAAGTGGATATCAAA", "aa_seq": "FTFGPGTKVDIK", "boundary_motif": "VDIK"}, {"gene_id": "hum_IGKJ4*01", "species": "human", "chain_type": "Kappa", "dna_seq": "CTCACTTTCGGCGGAGGGACCAAGGTGGAGATCAAA", "aa_seq": "LTFGGGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "hum_IGKJ5*01", "species": "human", "chain_type": "Kappa", "dna_seq": "ATCACCTTCGGCCAAGGGACACGACTGGAGATTAAA", "aa_seq": "ITFGQGTRLEIK", "boundary_motif": "LEIK"}, {"gene_id": "mus_JH1B6", "species": "mouse", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATGTCTGGGGCGCAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YWYFDVWGAGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mus_JH1B6", "species": "mouse", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATGTCTGGGGCACAGGGACCACGGTCACCGTGTCCTCA", "aa_seq": "YWYFDVWGAGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mus_JH2", "species": "mouse", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAAGGCACCACTCTCACAGTCTCCTCA", "aa_seq": "YFDYWGQGTTLTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mus_JH3", "species": "mouse", "chain_type": "Heavy", "dna_seq": "TGGTTTGCTTACTGGGGCCAAGGGACTCTGGTCACTGTCTCTGCA", "aa_seq": "WFAYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "mus_JH4", "species": "mouse", "chain_type": "Heavy", "dna_seq": "TACTATGCTATGGACTACTGGGGTCAAGGAACCTCAGTCACCGTCTCCTCA", "aa_seq": "YYAMDYWGQGTSVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mus_J00583", "species": "mouse", "chain_type": "Lambda", "dna_seq": "TTTATTTTCGGCAGTGGAACCAAGGTCACTGTCCTA", "aa_seq": "FIFGSGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "mus_J00593", "species": "mouse", "chain_type": "Lambda", "dna_seq": "TATGTCTTCGGCGGTGGAACCAAGGTCACTGTCCTA", "aa_seq": "YVFGGGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "mus_J00596", "species": "mouse", "chain_type": "Lambda", "dna_seq": "TGGGTGTTCGGAGGTGGAACCAGATTGACTGTCCTA", "aa_seq": "WVFGGGTRLTVL", "boundary_motif": "TVL"}, {"gene_id": "mus_V00813", "species": "mouse", "chain_type": "Lambda", "dna_seq": "TGGGTGTTCGGTGGAGGAACCAAACTGACTGTCCTA", "aa_seq": "WVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "mus_jk1", "species": "mouse", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGTGGAGGCACCAAGCTGGAAATCAAA", "aa_seq": "WTFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "mus_jk2", "species": "mouse", "chain_type": "Kappa", "dna_seq": "TACACGTTCGGAGGGGGGACCAAGCTGGAAATAAAA", "aa_seq": "YTFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "mus_jk3", "species": "mouse", "chain_type": "Kappa", "dna_seq": "ATCACATTCAGTGATGGGACCAGACTGGAAATAAAA", "aa_seq": "ITFSDGTRLEIK", "boundary_motif": "LEIK"}, {"gene_id": "mus_jk4", "species": "mouse", "chain_type": "Kappa", "dna_seq": "TTCACGTTCGGCTCGGGGACAAAGTTGGAAATAAAA", "aa_seq": "FTFGSGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "mus_jk5", "species": "mouse", "chain_type": "Kappa", "dna_seq": "CTCACGTTCGGTGCTGGGACCAAGCTGGAGCTGAAA", "aa_seq": "LTFGAGTKLELK", "boundary_motif": ""}, {"gene_id": "ssc_IGLJ1", "species": "pig", "chain_type": "Lambda", "dna_seq": "TATGTCTTCGGAACTGGGACCAAGGTCACCGTCCTA", "aa_seq": "YVFGTGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "ssc_IGKJ1", "species": "pig", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "ssc_IGHJ1", "species": "pig", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ssc_IGHJ2", "species": "pig", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ssc_IGHJ3", "species": "pig", "chain_type": "Heavy", "dna_seq": "GCTGAATACTTCCAGCACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "AEYFQHWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ssc_IGHJ4", "species": "pig", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ocu_IGKJ1", "species": "rabbit", "chain_type": "Kappa", "dna_seq": "TTCGACGTTCGGCGGAGGGACCAAGCTGGAGATCAAA", "aa_seq": "FDFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "ocu_IGKJ2", "species": "rabbit", "chain_type": "Kappa", "dna_seq": "TACACATTCGGCGGAGGGACCAAGCTGGAGATCAAA", "aa_seq": "YTFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "ocu_IGLJ1", "species": "rabbit", "chain_type": "Lambda", "dna_seq": "TACTATGTCTTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "YYVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "ocu_IGHJ2", "species": "rabbit", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTTGTGGGGCCCAGGCACCCTCGTCACCGTCTCCTCA", "aa_seq": "YYFDLWGPGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ocu_IGHJ2", "species": "rabbit", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTTGTGGGGCCCAGGCACCCTCGTCACCGTCTCCTCA", "aa_seq": "YYFDLWGPGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ocu_IGHJ4", "species": "rabbit", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACTTCGATCTCTGGGGCCCAGGCACCCTCGTCACCGTCTCCTCA", "aa_seq": "YYYYYFDLWGPGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "ocu_IGHJ6", "species": "rabbit", "chain_type": "Heavy", "dna_seq": "TACTATATGGATCTCTGGGGCCCAGGCACCCTCGTCACCGTCTCCTCA", "aa_seq": "YYMDLWGPGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "rno_IGKJ1", "species": "rat", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGTGGAGGCACCAAGCTGGAATTGAAA", "aa_seq": "WTFGGGTKLELK", "boundary_motif": ""}, {"gene_id": "rno_IGKJ2", "species": "rat", "chain_type": "Kappa", "dna_seq": "TACACGTTCGGAGGGGGGACCAAGCTGGAAATAAAA", "aa_seq": "YTFGGGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "rno_IGKJ4", "species": "rat", "chain_type": "Kappa", "dna_seq": "TTCACGTTCGGCTCGGGGACAAAGTTGGAAATAAAA", "aa_seq": "FTFGSGTKLEIK", "boundary_motif": "LEIK"}, {"gene_id": "rno_IGHJ1", "species": "rat", "chain_type": "Heavy", "dna_seq": "TACTATTACTTCGATGTCTGGGGCGCAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YYYFDVWGAGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "rno_IGHJ2", "species": "rat", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAAGGAGTCATGGTCACAGTCTCCTCA", "aa_seq": "YFDYWGQGVMVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "rno_IGHJ3", "species": "rat", "chain_type": "Heavy", "dna_seq": "TGGTTTGCTTACTGGGGCCAAGGGACTCTGGTCACTGTCTCTGCA", "aa_seq": "WFAYWGQGTLVTVSA", "boundary_motif": "TVSA"}, {"gene_id": "rno_IGHJ4", "species": "rat", "chain_type": "Heavy", "dna_seq": "TACTATGCTATGGACTACTGGGGTCAAGGAACCTCAGTCACCGTCTCCTCA", "aa_seq": "YYAMDYWGQGTSVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGLJ1", "species": "rhesus", "chain_type": "Lambda", "dna_seq": "TATGTCTTCGGAACTGGGACCAAGGTCACCGTCCTA", "aa_seq": "YVFGTGTKVTVL", "boundary_motif": "TVL"}, {"gene_id": "mmu_IGKJ1", "species": "rhesus", "chain_type": "Kappa", "dna_seq": "TGGACGTTCGGCCAAGGGACCAAGGTGGAAATCAAA", "aa_seq": "WTFGQGTKVEIK", "boundary_motif": "VEIK"}, {"gene_id": "mmu_IGHJ1", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "GCTGAATACTTCCAGCACTGGGGCCAGGGCACCCTGGTCACCGTCTCCTCA", "aa_seq": "AEYFQHWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGHJ2", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGHJ3", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "GATGCTTTTGATGTCTGGGGCCAAGGGACAATGGTCACCGTCTCTTCA", "aa_seq": "DAFDVWGQGTMVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGHJ4", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "TACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGHJ5", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "AACTGGTTCGACCCCTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "NWFDPWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "mmu_IGHJ6", "species": "rhesus", "chain_type": "Heavy", "dna_seq": "TACTACTACTACTACGGTATGGACGTCTGGGGCCAAGGGACCACGGTCACCGTCTCCTCA", "aa_seq": "YYYYYGMDVWGQGTTVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "oar_IGLJ1", "species": "sheep", "chain_type": "Lambda", "dna_seq": "GTGGTATTCGGCGGAGGGACCAAGCTGACCGTCCTA", "aa_seq": "VVFGGGTKLTVL", "boundary_motif": "TVL"}, {"gene_id": "oar_IGHJ1", "species": "sheep", "chain_type": "Heavy", "dna_seq": "TACTACTTTGACTACTGGGGCCAGGGAACCCTGGTCACCGTCTCCTCA", "aa_seq": "YYFDYWGQGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "oar_IGHJ2", "species": "sheep", "chain_type": "Heavy", "dna_seq": "TACTGGTACTTCGATCTCTGGGGCCGTGGCACCCTGGTCACTGTCTCCTCA", "aa_seq": "YWYFDLWGRGTLVTVSS", "boundary_motif": "TVSS"}, {"gene_id": "TRBJ1-1*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACAACAGTTTCTTTGGGAAGGGGACCAAACTCACCGTCCTA", "aa_seq": "NNSFFGKGTKLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRBJ1-2*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AATTACTATGGTTACTACTTTGGGAGTGGCACCAAACTCTCTGTGCTG", "aa_seq": "NYGYTFGSGTRLTVV", "boundary_motif": "LTVV"}, {"gene_id": "TRBJ1-3*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCTGGAAACACCATATATTTTGGAGAGGGAAGTTGGCTCACTGTTGTA", "aa_seq": "SGNTIYFGEGSWLTVV", "boundary_motif": "LTVV"}, {"gene_id": "TRBJ1-4*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AATGAAAAACTGTTTTTTGGCAGTGGAACCCAGCTCTCTGTGTTG", "aa_seq": "NEKLFFGSGTQLSVL", "boundary_motif": "LSVL"}, {"gene_id": "TRBJ1-5*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACCAGCCCCAGCATTTTGGTGATGGGACTCGACTCTCCATCCTA", "aa_seq": "NQPQHFGDGTRLSIL", "boundary_motif": "LSIL"}, {"gene_id": "TRBJ1-6*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCTATAATTCACCCCTCCACTTTGGGAACGGGACCAGGCTCACTGTGTTT", "aa_seq": "SYNSPLHFGNGTRLTVF", "boundary_motif": "LTVF"}, {"gene_id": "TRBJ2-1*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACGAGCAGTTCTTCGGGCCAGGGACACGGCTCACCGTGCTA", "aa_seq": "NEQFFGPGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRBJ2-2*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACACCGGGGAGCTGTTTTTTGGAGAGGGCTCTAGGCTGACCGTACTG", "aa_seq": "NTGELFFGEGSRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRBJ2-3*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCACAGATACGCAGTATTTTGGCCCAGGCACCCGGCTGACAGTGCTC", "aa_seq": "STDTQYFGPGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRBJ2-4*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GCCAAGAACATCCAGTACTTCGGAGCCGGCACCCGGCTCTCTGTGCTG", "aa_seq": "AKNIQYFGAGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "TRBJ2-5*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GAGACCCAGTACTTCGGGCCAGGCACGCGGCTCCTGGTGCTC", "aa_seq": "ETQYFGPGTRLLVL", "boundary_motif": "LLVL"}, {"gene_id": "TRBJ2-6*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCTACGGTGCCAACGTCCTGACTTTCGGGGCCGGCAGCAGGCTGACCGTGCTG", "aa_seq": "SYGANVLTFGAGSRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRBJ2-7*01", "species": "human", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TACTACGAGCAGTACTTCGGGCCGGGCACCAGGCTCACGGTCACA", "aa_seq": "YEQYFGPGTRLTVT", "boundary_motif": "LTVT"}, {"gene_id": "mus_TRBJ1-1*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACACAGAAGTCTTCTTTGGTAAAGGAACCAGACTCACAGTTGTA", "aa_seq": "NTEVFFGKGTRLTVV", "boundary_motif": "LTVV"}, {"gene_id": "mus_TRBJ1-2*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AATTACTATGGTTACTACTTTGGCAGTGGAACTAGACTTACCGTTGTA", "aa_seq": "NYGYTFGSGTRLTVV", "boundary_motif": "LTVV"}, {"gene_id": "mus_TRBJ1-3*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCTGGAAACACACTATATTTTGGAGAAGGAAGCCGACTCACAGTTGTA", "aa_seq": "SGNTLYFGEGSRLTVV", "boundary_motif": "LTVV"}, {"gene_id": "mus_TRBJ1-4*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AGCAATGAAAGACTTTTTTTTGGCCATGGCACCAAACTCTCTGTGCTA", "aa_seq": "SNERLFFGHGTKLSVL", "boundary_motif": "LSVL"}, {"gene_id": "mus_TRBJ1-5*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACCAGGCACCACTTTTTGGAGAAGGAACCAGGCTCTCCGTGCTA", "aa_seq": "NQAPLFGEGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "mus_TRBJ1-6*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCTATAATTCACCCCTCTACTTTGCTGCAGGAACCAGACTCACCGTTACA", "aa_seq": "SYNSPLYFAAGTRLTVT", "boundary_motif": "LTVT"}, {"gene_id": "mus_TRBJ2-1*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AATTACTACGCAGAGCAGTTCTTCGGGCCAGGGACACGGCTCACCGTGCTA", "aa_seq": "NYAEQFFGPGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "mus_TRBJ2-2*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "AACACCGGGCAGCTCTACTTTGGAGAAGGCTCCAAGCTGACCGTGCTG", "aa_seq": "NTGQLYFGEGSKLTVL", "boundary_motif": "LTVL"}, {"gene_id": "mus_TRBJ2-3*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCGCGGAGACACTGTACTTTGGCTCAGGCACCCGGCTCACCGTGCTG", "aa_seq": "SAETLYFGSGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "mus_TRBJ2-4*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCCAGAACACCCTCTACTTTGGAGCTGGCACTCGACTCTCTGTGCTA", "aa_seq": "SQNTLYFGAGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "mus_TRBJ2-5*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "GACACCCAGTACTTCGGGCCAGGCACCCGACTCCTGGTGCTC", "aa_seq": "DTQYFGPGTRLLVL", "boundary_motif": "LLVL"}, {"gene_id": "mus_TRBJ2-7*01", "species": "mouse", "chain_type": "TRB", "locus": "TRB", "dna_seq": "TCCTACGAGCAGTACTTCGGCCCAGGCACCAGGCTCACGGTCACA", "aa_seq": "SYEQYFGPGTRLTVT", "boundary_motif": "LTVT"}, {"gene_id": "TRAJ1*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACTGGAGCCAACACAGGCAAACTAACCTTTGGCAAAGGGACTAAGCTCACCGTTAAA", "aa_seq": "TGANTGKLTFGKGTKLTVK", "boundary_motif": "LTVK"}, {"gene_id": "TRAJ2*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TATACTGGAGCCAACAGCAAACTAACCTTTGGCAAAGGCACTCACCTCACTGTTAAA", "aa_seq": "YTGANSKLTFGKGTHLTVK", "boundary_motif": "LTVK"}, {"gene_id": "TRAJ3*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TATGACAAAGTCATCTTTGGAAAAGGGACCCAACTTCAGGTCTTT", "aa_seq": "YDKVIFGKGTRLQVF", "boundary_motif": "LQVF"}, {"gene_id": "TRAJ4*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TTCAGTGGAGGCTACAATAAGCTCATCTTTGGAGCAGGGACCAGACTACAAGTAACT", "aa_seq": "FSGGYNKLIFGAGTRLQVT", "boundary_motif": "LQVT"}, {"gene_id": "TRAJ5*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATACTGGAAGGAGAGCGCTCACATTTGGATCTGGAACACGACTACAAGTCAAC", "aa_seq": "DTGRRALTFGSGTRLQVN", "boundary_motif": "LQVN"}, {"gene_id": "TRAJ6*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACTGACAAGGGAGGCTCCTACATACCCACCTTCGGCAGAGGCACCAGCCTCATTGTGCAT", "aa_seq": "TDKGGSYIPTFGRGTSLIVH", "boundary_motif": "LIVH"}, {"gene_id": "TRAJ7*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATTATGGTAACAACCGTCTTGCCTTTGGAAAAGGAACTCAAGTTGTAGTCACT", "aa_seq": "DYGNNRLAFGKGTQVVVT", "boundary_motif": "VVVT"}, {"gene_id": "TRAJ8*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACAATGGTTTTCAGAAACTTGTATTTGGAACTGGCACGAAACTCACAGTAAAG", "aa_seq": "NNGFQKLVFGAGTKLTVK", "boundary_motif": "LTVK"}, {"gene_id": "TRAJ9*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATAATGGGGGCAATGACAAGCTCACTTTTGGGACTGGAACCAAAGTCATTGTTAAA", "aa_seq": "DNGGNDYKLSFGAGTKVIVK", "boundary_motif": "VIVK"}, {"gene_id": "TRAJ10*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACAGGGAATGACAAACTCACTTTTGGGACTGGAACCAAAGTCATTGTTAAA", "aa_seq": "TGNDYKLSFGAGTKVIVK", "boundary_motif": "VIVK"}, {"gene_id": "TRAJ11*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GGCTATTCTACCTTGACTTTTGGGAAAGGAACCGTGCTTCTCGTGTCT", "aa_seq": "GYSTLTFGKGTVLLVS", "boundary_motif": "LLVS"}, {"gene_id": "TRAJ12*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ATGGATTCATCTTACAAACTCATCTTTGGATCAGGGACCAGACTTCTGGTCAGA", "aa_seq": "MDSSYKLIFGSGTRLLVR", "boundary_motif": "LLVR"}, {"gene_id": "TRAJ13*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AATACTGGAGGCTACAATAAGCTCATCTTTGGAGCAGGGACCAGACTACAAGTAACT", "aa_seq": "NTGGYNKLIFGAGTRLQVT", "boundary_motif": "LQVT"}, {"gene_id": "TRAJ14*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACACTGACAAACTCATCTTTGGTACTGGGACCAGATTACAGGTCTTC", "aa_seq": "NTDKLIFGTGTRLQVF", "boundary_motif": "LQVF"}, {"gene_id": "TRAJ15*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "CAGGGAACCTACAAATACATCTTTGGAACAGGCACCAGGCTGAAGGTTTTG", "aa_seq": "QGTYKYIFGTGTRLKVL", "boundary_motif": "LKVL"}, {"gene_id": "TRAJ16*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACTGCAGGAACCTACAAATACATCTTTGGAACAGGCACCAGGCTGAAGGTTTTG", "aa_seq": "TAGTYKYIFGTGTRLKVL", "boundary_motif": "LKVL"}, {"gene_id": "TRAJ17*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACTGGAGGCTCCTACATACCCACCTTCGGCAGAGGCACCAGCCTCATTGTGCAT", "aa_seq": "TGGSYIPTFGRGTSLIVH", "boundary_motif": "LIVH"}, {"gene_id": "TRAJ18*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACCTCAGGTGGCTCCTACATACCCACCTTCGGCAGAGGCACCAGCCTCATTGTGCAT", "aa_seq": "TSGGSYIPTFGRGTSLIVH", "boundary_motif": "LIVH"}, {"gene_id": "TRAJ19*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATAACACTGACAAACTCATCTTTGGCCAAGGAACCACTCTACAAGTGAAG", "aa_seq": "DNTGKLIFGQGTTLQVK", "boundary_motif": "LQVK"}, {"gene_id": "TRAJ20*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AATGACAAACTCACTTTTGGGACTGGAACCAAAGTCATTGTTAAA", "aa_seq": "NDYKLSFGAGTKVIVK", "boundary_motif": "VIVK"}, {"gene_id": "TRAJ21*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TACAACTTCAACAAATTTTACTTTGGATCTGGGACCAAACTCAATGTAAAA", "aa_seq": "YNFNKFYFGSGTKLNVK", "boundary_motif": "LNVK"}, {"gene_id": "TRAJ22*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCTAGCTCCTGGCAGCTCATCTTTGGATCAGGGACTCAACTCACTGTTCTA", "aa_seq": "SSSWQLIFGSGTQLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRAJ23*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TACAACCAAGGGGGCAAGTTGATCTTTGGACAAGGCACTGAACTCTCTGTGAAA", "aa_seq": "YNQGGKLIFGQGTELSVK", "boundary_motif": "LSVK"}, {"gene_id": "TRAJ24*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACCACTGACTCCTGGGGAAAACTGCAGTTTGGCGCAGGGACTCAGGTGGTGGTCACT", "aa_seq": "TTDSWGKLQFGAGTQVVVT", "boundary_motif": "VVVT"}, {"gene_id": "TRAJ25*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "CAGGGAGGATCTGAAAAGCTTGTCTTTGGAAAAGGAACTAAACTCTCTGTGAAT", "aa_seq": "QGGSEKLVFGKGTKLTVN", "boundary_motif": "LTVN"}, {"gene_id": "TRAJ26*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATAACTATGGTCAGAATTTTGTCTTTGGTCCCGGAACCAGATTGTCCGTGCTG", "aa_seq": "DNYGQNFVFGPGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "TRAJ27*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACACTAATGCAGGCAAATCAACCTTTGGAGATGGAACAACACTCACTGTCAAA", "aa_seq": "NTNAGKSTFGDGTTLTVK", "boundary_motif": "LTVK"}, {"gene_id": "TRAJ28*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GGAGCTGGGACAGCTCTTATTTTTGGCAAAGGAACCACACTATCTGTGTCT", "aa_seq": "GAGTALIFGKGTTLSVS", "boundary_motif": "LSVS"}, {"gene_id": "TRAJ29*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACTCTGGGAACACCCCACTCGTGTTTGGCAAAGGAACCCGACTCTCCGTCATA", "aa_seq": "NSGNTPLVFGKGTRLSVI", "boundary_motif": "LSVI"}, {"gene_id": "TRAJ30*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATGACAAGATCATCTTTGGGAAAGGAACCCGTCTTCATATCCTT", "aa_seq": "DDKIIFGKGTRLHIL", "boundary_motif": "LHIL"}, {"gene_id": "TRAJ31*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACAATAATGCCAGACTCATGTTTGGAGATGGAACTCAGCTGGTGGTGAAG", "aa_seq": "NNNARLMFGDGTQLVVK", "boundary_motif": "LVVK"}, {"gene_id": "TRAJ32*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCCAATTACAAACTCACTTTTGGGACTGGAACCAAAGTCATTGTTAAA", "aa_seq": "SNYKLSFGAGTKVIVK", "boundary_motif": "VIVK"}, {"gene_id": "TRAJ33*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GACTCCAACTATCAGTTGATCTGGGGAGCTGGGACCAAACTAATAATCAAA", "aa_seq": "DSNYQLIWGAGTKLIIK", "boundary_motif": "LIIK"}, {"gene_id": "TRAJ34*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TATAACACCGACAAACTCATCTTTGGTACTGGGACCAGATTACAGGTCTTC", "aa_seq": "YNTDKLIFGTGTRLQVF", "boundary_motif": "LQVF"}, {"gene_id": "TRAJ35*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATGGTCAGAATTTTGTCTTTGGTCCCGGAACCAGATTGTCCGTGCTG", "aa_seq": "DGQNFVFGPGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "TRAJ36*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GCTAACAATCTCTTCTTTGGTACTGGAACCAGACTCACAGTTGTA", "aa_seq": "ANNLFFGTGTRLTVV", "boundary_motif": "LTVV"}, {"gene_id": "TRAJ37*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCAGGCAACACTGACAAACTCATCTTTGGCCAAGGAACCACTCTACAAGTGAAG", "aa_seq": "SGNTGKLIFGQGTTLQVK", "boundary_motif": "LQVK"}, {"gene_id": "TRAJ38*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AATGCTGGCATGCTCACTTTTGGAGGAGGAACCAGGCTTATGGTCAAA", "aa_seq": "NAGMLTFGGGTRLMVK", "boundary_motif": "LMVK"}, {"gene_id": "TRAJ39*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACAACAACCTCACTTTTGGAGGAGGAACCAGGCTTATGGTCAAA", "aa_seq": "NNNLTFGGGTRLMVK", "boundary_motif": "LMVK"}, {"gene_id": "TRAJ40*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCTGGAACCTACAAATACATCTTTGGAACAGGCACCAGGCTGAAGGTTTTG", "aa_seq": "SGTYKYIFGTGTRLKVL", "boundary_motif": "LKVL"}, {"gene_id": "TRAJ41*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GATCAAGCTGGGACAGCTCTTATTTTTGGCAAAGGAACCACACTATCTGTGTCT", "aa_seq": "DQAGTALIFGKGTTLSVS", "boundary_motif": "LSVS"}, {"gene_id": "TRAJ42*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GGAGGTAGCCAAGGCAATCTCATCTTTGGAAAAGGCACTAAACTCTCTGTGAAA", "aa_seq": "GGSQGNLIFGKGTKLSVK", "boundary_motif": "LSVK"}, {"gene_id": "TRAJ43*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACAACAATGACATGCGCTTTGGAGCAGGGACCAGACTCACAGTTAAA", "aa_seq": "NNNDMRFGAGTRLTVK", "boundary_motif": "LTVK"}, {"gene_id": "TRAJ44*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACTGGCACAGCCTCAAAACTTACTTTTGGAACAGGAACAAGGCTCCAAGTCACC", "aa_seq": "TGTASKLTFGTGTRLQVT", "boundary_motif": "LQVT"}, {"gene_id": "TRAJ45*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GGAGGCACCTCTTATGGCAAGTTGACTTTCGGCCAGGGCACTACCCTCACTGTGCAT", "aa_seq": "GGTSYGKLTFGQGTILTVH", "boundary_motif": "LTVH"}, {"gene_id": "TRAJ46*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCTAGTGGTCAGAATTTTGTCTTTGGTCCCGGAACCAGATTGTCCGTGCTG", "aa_seq": "SSGQNFVFGPGTRLSVL", "boundary_motif": "LSVL"}, {"gene_id": "TRAJ47*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GAGTATGGAGGTAGCCAAGGCAATCTCATCTTTGGAAAAGGCACTAAACTCTCTGTGAAA", "aa_seq": "EYGGSQGNLIFGKGTKLSVK", "boundary_motif": "LSVK"}, {"gene_id": "TRAJ48*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "TCCAACTATGGAGGTAGCCAAGGCAATCTCATCTTTGGAAAAGGCACTAAACTCTCTGTGAAA", "aa_seq": "SNYGGSQGNLIFGKGTKLSVK", "boundary_motif": "LSVK"}, {"gene_id": "TRAJ49*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "AACACTGGGAACCAATTCTTCTTTGGAACAGGAACCAGTCTCACTGTGATCCCA", "aa_seq": "NTGNQFYFGTGTSLTVIP", "boundary_motif": "LTVI"}, {"gene_id": "TRAJ50*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ACCAGTGGAACCTACAAATACATCTTTGGAACAGGCACCAGGCTGAAGGTTTTG", "aa_seq": "TSGTYKYIFGTGTRLKVL", "boundary_motif": "LKVL"}, {"gene_id": "TRAJ52*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GCAGGCGGCACCTCTTATGGCAAGTTGACTTTCGGCCAGGGCACTACCCTCACTGTGCAT", "aa_seq": "AGGTSYGKLTFGQGTILTVH", "boundary_motif": "LTVH"}, {"gene_id": "TRAJ53*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "GGAGGAAGCAACTACAAACTGACCTTTGGGAAGGGGACACTTCTCACTGTGAAT", "aa_seq": "GGSNYKLTFGKGTLLTVN", "boundary_motif": "LTVN"}, {"gene_id": "TRAJ54*01", "species": "human", "chain_type": "TRA", "locus": "TRA", "dna_seq": "ATACAAGGAGCCCAGAAGCTGGTATTTGGCCAAGGAACCAGGCTGACTATCAAC", "aa_seq": "IQGAQKLVFGQGTRLTIN", "boundary_motif": "LTIN"}, {"gene_id": "TRDJ1*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ACCGACAAACTCATCTTTGGAAAAGGAACCCGTGTGACTGTGGAACCA", "aa_seq": "TDKLIFGKGTRVTVE", "boundary_motif": "VTVE"}, {"gene_id": "TRDJ2*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ACCGCCCAGCTCTTCTTTGGAAAAGGAACTCGACTGACTGTGTTG", "aa_seq": "TAQLFFGKGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRDJ3*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "TCCTACACCGACAAACTCATCTTTGGAAAAGGAACCCGTGTGACTGTGGAACCA", "aa_seq": "SYTDKLIFGKGTRVTVE", "boundary_motif": "VTVE"}, {"gene_id": "TRDJ4*01", "species": "human", "chain_type": "TRD", "locus": "TRD", "dna_seq": "TCCTGGGGAAAACTGCAGTTTGGCGCAGGGACTCAGGTGGTGGTCACC", "aa_seq": "SWGKLQFGAGTQVVVT", "boundary_motif": "VVVT"}, {"gene_id": "mus_TRDJ1*01", "species": "mouse", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ACCGACAAACTCATCTTTGGAAAAGGAACCCGTGTGACTGTGGAACCA", "aa_seq": "TDKLIFGKGTRVTVE", "boundary_motif": "VTVE"}, {"gene_id": "mus_TRDJ2*01", "species": "mouse", "chain_type": "TRD", "locus": "TRD", "dna_seq": "ACCGCCCAGCTCTTCTTTGGAAAAGGAACTCGACTGACTGTGTTG", "aa_seq": "TAQLFFGKGTRLTVL", "boundary_motif": "LTVL"}, {"gene_id": "TRGJ1*01", "species": "human", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AATTACTATAAGAAACTCTTTGGCAGTGGAACAACACTTGTTGTCATA", "aa_seq": "NYYKKLFGSGTTLVVI", "boundary_motif": "LVVI"}, {"gene_id": "TRGJ2*01", "species": "human", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AATTACTATAAGAAACTCTTTGGCAGTGGAACAACACTTGTTGTCATA", "aa_seq": "NYYKKLFGSGTTLVVI", "boundary_motif": "LVVI"}, {"gene_id": "TRGJP*01", "species": "human", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AATATTAACACATTTGGCAGTGGGACAACACTTGTTGTCGAA", "aa_seq": "NINTFGSGTTLVVE", "boundary_motif": "LVVE"}, {"gene_id": "TRGJP1*01", "species": "human", "chain_type": "TRG", "locus": "TRG", "dna_seq": "TCCTCGTGGATTAAGACATTTGGCAGTGGGACACGACTCCAGGTGACA", "aa_seq": "SSWIKTFGSGTRLQVT", "boundary_motif": "LQVT"}, {"gene_id": "TRGJP2*01", "species": "human", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AACACATGGATTAAGACATTTGGCAGTGGGACACGACTCCAGGTGACA", "aa_seq": "NTWIKTFGSGTRLQVT", "boundary_motif": "LQVT"}, {"gene_id": "mus_TRGJ1*01", "species": "mouse", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AATTACTATAAGAAACTCTTTGGCAGTGGAACAACACTTGTTGTCATA", "aa_seq": "NYYKKLFGSGTTLVVI", "boundary_motif": "LVVI"}, {"gene_id": "mus_TRGJ2*01", "species": "mouse", "chain_type": "TRG", "locus": "TRG", "dna_seq": "AATTACTATAAGAAACTCTTTGGCAGTGGAACAACACTTGTTGTCATA", "aa_seq": "NYYKKLFGSGTTLVVI", "boundary_motif": "LVVI"}]};

    // 2. Preset Sequences
    const SAMPLES = {
      trastuzumab: "EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS",
      pertuzumab: "DIQMTQSPSSLSASVGDRVTITCKASQDVSIGVAWYQQKPGKAPKLLIYSASYRYTGVPSRFSGSGSGTDFTLTISSLQPEDFATYYCQQYYIYPYTFGQGTKVEIK",
      vhh: "QVQLVESGGALVQPGGSLRLSCAASGFPVNRYSMRWYRQAPGKEREWVAGMSSAGDRSSYEDSVKGRFTISRDDARNTVYLQMNSLKPEDTAVYYCNVNVGFEYWGQGTQVTVSS",
      mouse_186: "QVQLQQPGAELVKPGASVKLSCKASGYTFTSYWMHWVKQRPGRGLEWIGRIDPNSGGTKYNEKFKSKATLTVDKPSSTAYMQLSSLTSEDSAVYYCARWDYDGDYWGQGTSVTVSS",
      mouse_186_w33l: "QVQLQQPGAELVKPGASVKLSCKASGYTFTSYLMHWVKQRPGRGLEWIGRIDPNSGGTKYNEKFKSKATLTVDKPSSTAYMQLSSLTSEDSAVYYCARWDYDGDYWGQGTSVTVSS",
      mouse_qm_17225: "EVQLQQSGAELVRPGASVKLSCTASGFNIKDTYMHWVKQRPEQGLEWIGRIDPANGNTKYDPKFQGKATITADTSTNTAYLQLSSLTSEDTAVYYCARYYRYPYYAMDYWGQGTSVTVSS",
      xenopus: "QVQLQESGPGLVKPSQTLSLTCTVSGFSLTSYGVSWVRQPPGKGLEWLGVIWSGGNTNYNADFRSRLTITKDTSKNQVSLKLSNVTARDTATYYCAKDVGWFDVWGAGTLVTVSS",
      shark: "ARVDQTPQTITKETGESLTINCVLRDASFSSLGSTYWFRKNPGTTEEQLLIRSNSEDRYTVRNGYDKSVRISSLRREDTDTYYCRAMVLSGNDYWGQGTQVTVSS",
      duck: "AVTLDESGGGLQTPGGRTLSLVCKASGFTFSSYDMGWVRQAPGKGLEWVSTISTGGGSTYYADSVKGRFTISRDSSKNTLYLQMNNLRAEDTATYYCAKAGSGWYAYWGQGTLVTVSS",
      tcr_1g4_tra: "KQEVTQIPAALSVPEGENLVLNCSFTDSAIYNLQWFRQDPGKGLTSLLLIQSSQREQTSGRLNASLDKSSGRSTLYIAASQPGDSATYLCAVRPTSGGSYIPTFGRGTSLIVH",
      tcr_1g4_trb: "NAGVTQTPKFQVLKTGQSMTLQCAQDMNHEYMSWYRQDPGMGLRLIHYSVGAGITDQGEVPNGYNVSRSTTEDFPLRLLSAAPSQTSVYFCASSYVGNTGELFFGEGSRLTVL",
      tcr_mouse_2b4: "EDQVTQTEGPVTLSEKAVLTLDCTYDTSESNYYFFWYKQPPGGELVFLIYKRSYEKQNEISGRFSWNFQKSSSSFLFTITASQLGDSAMYFCAMRDNTGNQFYFGTGTSLTVIP",
      tcr_human_trgv9: "AQKVTQAQTEISVVEKEDVTLDCVYETRDTTYYLFWYKQPPSGELVFLIRRNSFDEQNEISGRYSWNFQKSTSSFNFTITASQVVDSAVYFCALSELNNINTFGSGTTLVVE",
      tcr_bovine_trdv: "AVTQAPTPVSVQEGGSVKLSCSYDSNRYSSISWYRQRPGEAPQLLFYVSYDTSGTLDEGSVTTTRFTVQRSSSYFSLELRDLQSDDTATYYCALRTDKLIFGKGTRVTVE",
      tcr_zebrafish_trav: "AKITQSPSSLVVREGESIILNCSYDTSNYAYLFWYKQPPGQVPQLLFHLSTSTDEKTTEGLFEAKFDKTETSSLEISAVQPEDTATYFCAATLTFGKGTKLTVK",
      tcr_chicken_tra: "AQVQQEPSAETSEGTGINITCSHPNVQLGDYIQWYRQLPGRAPTFLVTAVKGTKNVPDPAGQLSVSADRRSSVLCLTRPGLADAAVYYCTVNTGKLTFGKGTKLTVK",
      tcr_shark_nar: "ARVDQSPQTITKETGESLTINCVLRDASFSSLGSTYWFRKNPGTTEEQLLIRSNSEDRYTVRNGYDKSVRISSLRREDTDTYYCRAMVTDKLIFGKGTRVTVE"
    };

    function loadSample(key) {
      if (SAMPLES[key]) {
        const ta = document.getElementById("seqTextarea");
        if (ta) ta.value = SAMPLES[key];
        runUniversalAnalysisAndProjection();
      }
    }
    window.loadSample = loadSample;

    // D3 Canvas Setup
    const width = window.innerWidth;
    const height = window.innerHeight;
    const svg = d3.select("#canvas").attr("width", width).attr("height", height);
    const g = svg.append("g");
    const beaconG = g.append("g").attr("id", "beaconGroup");
    const circlesG = g.append("g").attr("id", "circlesGroup");

    var circles = null;

    function resetMapView() {
      svg.transition().duration(850).call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.85));
    }
    d3.select("#resetZoom").on("click", resetMapView);

    // Keyboard shortcut: 'f' or 'F' to reset view and center the map
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') {
        resetMapView();
      }
    });

    let lastZoomK = 0.85;
    const zoom = d3.zoom().scaleExtent([0.1, 80]).on("zoom", (e) => {
      g.attr("transform", e.transform);
      const k = e.transform.k;
      // High-performance dynamic radius scaling: only update circle DOM attributes when scale actually shifts by >6%
      // During panning (k === lastZoomK), SVG transform handles translation on GPU with 0 DOM writes.
      if (circles && Math.abs(k - lastZoomK) / lastZoomK > 0.06) {
        lastZoomK = k;
        const radiusFactor = Math.max(0.22, 1.0 / Math.pow(k, 0.32));
        const strokeW = Math.max(0.2, 0.5 * radiusFactor);
        const hasFilters = selectedFilters.size > 0;
        const isHier = (currentMode === "hierarchical" || currentMode === "family");

        circles.each(function(d) {
          let baseR = 3.5;
          if (hasFilters) {
            const isMatch = isHier
              ? (selectedFilters.has(d.family) || selectedFilters.has(d.chain_group))
              : selectedFilters.has(d[currentMode]);
            baseR = isMatch ? 6.0 : 2.0;
          }
          this.setAttribute("r", (baseR * radiusFactor).toFixed(2));
          this.setAttribute("stroke-width", strokeW.toFixed(2));
        });
      }
    });
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.85));

    // Universal Inspector Panel State & Restoration
    const inspectorPanel = document.getElementById("inspectorPanel");
    const restoreInspectorBtn = document.getElementById("restoreInspectorBtn");
    function setInspectorCollapsed(col) {
      if (!inspectorPanel) return;
      if (col) {
        inspectorPanel.classList.add("collapsed");
        if (restoreInspectorBtn) restoreInspectorBtn.style.display = "inline-flex";
      } else {
        inspectorPanel.classList.remove("collapsed");
        if (restoreInspectorBtn) restoreInspectorBtn.style.display = "none";
      }
    }
    const toggleInspectorBtn = document.getElementById("toggleInspectorBtn");
    if (toggleInspectorBtn && inspectorPanel) {
      toggleInspectorBtn.onclick = () => {
        const isCol = inspectorPanel.classList.contains("collapsed");
        setInspectorCollapsed(!isCol);
      };
    }
    const closeInspectorBtn = document.getElementById("closeInspectorBtn");
    if (closeInspectorBtn) closeInspectorBtn.onclick = () => setInspectorCollapsed(true);
    if (restoreInspectorBtn) restoreInspectorBtn.onclick = () => setInspectorCollapsed(false);

    // Top-Left Header Panel Minimize & Restore
    const headerPanel = document.getElementById("header");
    const restoreHeaderBtn = document.getElementById("restoreHeaderBtn");
    const floatingHomeBtn = document.getElementById("floatingHomeBtn");
    const closeHeaderBtn = document.getElementById("closeHeaderBtn");
    if (closeHeaderBtn && headerPanel) {
      closeHeaderBtn.onclick = () => {
        headerPanel.classList.add("collapsed");
        if (restoreHeaderBtn) restoreHeaderBtn.style.display = "inline-flex";
        if (floatingHomeBtn) floatingHomeBtn.style.display = "inline-flex";
      };
    }
    if (restoreHeaderBtn && headerPanel) {
      restoreHeaderBtn.onclick = () => {
        headerPanel.classList.remove("collapsed");
        restoreHeaderBtn.style.display = "none";
        if (floatingHomeBtn) floatingHomeBtn.style.display = "none";
      };
    }

    // Helper: Dynamic Positioning for Legend & Evo Bar
    function updateEvoPosition() {
      const legendCol = d3.select("#legend").classed("collapsed");
      const leftPos = legendCol ? "135px" : "395px";
      d3.select("#evoBar").style("left", leftPos);
      d3.select("#restoreEvoBtn").style("left", leftPos);
    }

    // EvoBar Minimize & Restore
    const evoBar = document.getElementById("evoBar");
    const restoreEvoBtn = document.getElementById("restoreEvoBtn");
    const closeEvoBtn = document.getElementById("closeEvoBtn");
    if (closeEvoBtn && evoBar && restoreEvoBtn) {
      closeEvoBtn.onclick = () => {
        evoBar.classList.add("collapsed");
        restoreEvoBtn.style.display = "inline-flex";
        updateEvoPosition();
      };
    }
    if (restoreEvoBtn && evoBar) {
      restoreEvoBtn.onclick = () => {
        evoBar.classList.remove("collapsed");
        restoreEvoBtn.style.display = "none";
        updateEvoPosition();
      };
    }

    // Legend Restore Button
    const restoreLegendBtn = document.getElementById("restoreLegendBtn");
    if (restoreLegendBtn) {
      restoreLegendBtn.onclick = () => {
        d3.select("#legend").classed("collapsed", false);
        restoreLegendBtn.style.display = "none";
        updateEvoPosition();
      };
    }

    // Sequence Alignment Drawer State & Controls
    const alignmentDrawer = document.getElementById("alignmentDrawer");
    const restoreAlignmentBtn = document.getElementById("restoreAlignmentBtn");
    let selectedGeneIds = new Set();
    let displayedGenes = [];

    function openAlignmentDrawer() {
      alignmentDrawer.classList.remove("collapsed");
      restoreAlignmentBtn.style.display = "none";
    }

    function closeAlignmentDrawer() {
      alignmentDrawer.classList.add("collapsed");
      if (displayedGenes && displayedGenes.length > 0) {
        restoreAlignmentBtn.style.display = "inline-flex";
      }
    }

    const closeAlignBtn = document.getElementById("closeAlignmentBtn");
    if (closeAlignBtn) closeAlignBtn.onclick = closeAlignmentDrawer;
    if (restoreAlignmentBtn) restoreAlignmentBtn.onclick = openAlignmentDrawer;

    const btnOpenAlign = document.getElementById("btnOpenAlignmentDrawer");
    if (btnOpenAlign) {
      btnOpenAlign.onclick = () => {
        renderAlignmentView();
        openAlignmentDrawer();
      };
    }

    const clearSelBtn = document.getElementById("clearSelectionBtn");
    if (clearSelBtn) clearSelBtn.onclick = () => {
      selectedGeneIds.clear();
      updateCircleSelectionVisual();
      renderAlignmentView();
      closeAlignmentDrawer();
    };

    const copyFastaBtn = document.getElementById("copyAlignmentFastaBtn");
    if (copyFastaBtn) copyFastaBtn.onclick = () => {
      if (!displayedGenes || displayedGenes.length === 0) return;
      let fasta = "";
      if (displayedGenes.length === 1) {
        const g = displayedGenes[0];
        const clean = (g.ungapped_seq || g.aa_seq || g.sequence || "").replace(/[\.\-]/g, "");
        const label = g.systematic_id || g.gene_id;
        const legacy = g.legacy_name && g.legacy_name !== label ? `[${g.legacy_name}] ` : '';
        fasta = `>${label} ${legacy}${g.species} ${g.chain_group || g.chain} ${g.clan || g.family} mature_len=${clean.length}aa\n${clean}\n`;
      } else {
        displayedGenes.forEach(g => {
          const s = g.aa_seq || g.ungapped_seq || g.sequence || "";
          const label = g.systematic_id || g.gene_id;
          const legacy = g.legacy_name && g.legacy_name !== label ? `[${g.legacy_name}] ` : '';
          fasta += `>${label} ${legacy}${g.species} ${g.chain_group || g.chain} ${g.clan || g.family} imgt_aligned\n${s}\n`;
        });
      }
      navigator.clipboard.writeText(fasta).then(() => {
        const btn = document.getElementById("copyAlignmentFastaBtn");
        const orig = btn.innerText;
        btn.innerText = "✅ Copied!";
        setTimeout(() => btn.innerText = orig, 1800);
      });
    };

    // TCR D & J Elements Drawer Controller
    function initTcrDjDrawer() {
      const tcrDjDrawer = document.getElementById("tcrDjDrawer");
      if (!tcrDjDrawer) return;

      const restoreTcrDjBtn = document.getElementById("restoreTcrDjBtn");
      const closeTcrDjBtn = document.getElementById("closeTcrDjBtn");
      const btnOpenTcrDj = document.getElementById("btnOpenTcrDjDrawer");
      const tabDjD = document.getElementById("tabDjD");
      const tabDjJ = document.getElementById("tabDjJ");
      const tcrDjSearch = document.getElementById("tcrDjSearch");
      const tcrDjSpeciesFilter = document.getElementById("tcrDjSpeciesFilter");
      const tcrDjLocusFilter = document.getElementById("tcrDjLocusFilter");
      const copyTcrDjFastaBtn = document.getElementById("copyTcrDjFastaBtn");
      const tcrDjBody = document.getElementById("tcrDjBody");

      let activeTab = "D"; // "D" or "J"

      function openTcrDjDrawer() {
        tcrDjDrawer.classList.remove("collapsed");
        if (restoreTcrDjBtn) restoreTcrDjBtn.style.display = "none";
        renderTcrDjContent();
      }

      function closeTcrDjDrawer() {
        tcrDjDrawer.classList.add("collapsed");
        if (restoreTcrDjBtn) restoreTcrDjBtn.style.display = "inline-flex";
      }

      if (btnOpenTcrDj) btnOpenTcrDj.onclick = openTcrDjDrawer;
      if (closeTcrDjBtn) closeTcrDjBtn.onclick = closeTcrDjDrawer;
      if (restoreTcrDjBtn) restoreTcrDjBtn.onclick = openTcrDjDrawer;

      if (tabDjD) {
        tabDjD.onclick = () => {
          activeTab = "D";
          tabDjD.classList.add("active");
          if (tabDjJ) tabDjJ.classList.remove("active");
          renderTcrDjContent();
        };
      }
      if (tabDjJ) {
        tabDjJ.onclick = () => {
          activeTab = "J";
          tabDjJ.classList.add("active");
          if (tabDjD) tabDjD.classList.remove("active");
          renderTcrDjContent();
        };
      }

      if (tcrDjSearch) tcrDjSearch.oninput = () => renderTcrDjContent();
      if (tcrDjSpeciesFilter) tcrDjSpeciesFilter.onchange = () => renderTcrDjContent();
      if (tcrDjLocusFilter) tcrDjLocusFilter.onchange = () => renderTcrDjContent();

      function getTcrDGenes() {
        return (DJ_DATABASE.d_genes || []).filter(d => {
          return (d.locus && d.locus.startsWith("TR")) || (d.chain_type && d.chain_type.startsWith("TR")) || d.gene_id.includes("TR");
        });
      }

      function getTcrJGenes() {
        return (DJ_DATABASE.j_genes || []).filter(j => {
          return (j.locus && j.locus.startsWith("TR")) || (j.chain_type && j.chain_type.startsWith("TR")) || j.gene_id.includes("TR");
        });
      }

      // Update KPI & badge counts
      const dGenesList = getTcrDGenes();
      const jGenesList = getTcrJGenes();
      const countDEl = document.getElementById("countDGenes");
      const countJEl = document.getElementById("countJGenes");
      const badgeEl = document.getElementById("tcrDjCountBadge");
      const pillBadgeEl = document.getElementById("pillDjCountBadge");
      const kpiDj = document.getElementById("kpiDj");
      if (countDEl) countDEl.innerText = dGenesList.length;
      if (countJEl) countJEl.innerText = jGenesList.length;
      if (badgeEl) badgeEl.innerText = `${dGenesList.length} D / ${jGenesList.length} J`;
      if (pillBadgeEl) pillBadgeEl.innerText = `${dGenesList.length} D / ${jGenesList.length} J`;
      if (kpiDj) kpiDj.innerText = `${dGenesList.length} D / ${jGenesList.length} J`;

      function renderTcrDjContent() {
        if (!tcrDjBody) return;
        const query = (tcrDjSearch ? tcrDjSearch.value : "").trim().toUpperCase();
        const spFilter = tcrDjSpeciesFilter ? tcrDjSpeciesFilter.value : "all";
        const locFilter = tcrDjLocusFilter ? tcrDjLocusFilter.value : "all";

        if (activeTab === "D") {
          let filtered = getTcrDGenes().filter(d => {
            if (spFilter !== "all" && d.species.toLowerCase() !== spFilter.toLowerCase()) return false;
            if (locFilter !== "all" && d.locus !== locFilter && d.chain_type !== locFilter) return false;
            if (query) {
              const matchId = d.gene_id.toUpperCase().includes(query);
              const matchDna = (d.dna_seq || "").toUpperCase().includes(query);
              const matchRf = [d.aa_rf1, d.aa_rf2, d.aa_rf3, d.aa_inv_rf1, d.aa_inv_rf2, d.aa_inv_rf3].some(rf => (rf || "").toUpperCase().includes(query));
              if (!matchId && !matchDna && !matchRf) return false;
            }
            return true;
          });

          if (filtered.length === 0) {
            tcrDjBody.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No TCR D-elements matching your search criteria.</div>`;
            return;
          }

          let html = `<div class="tcr-d-grid">`;
          for (let d of filtered) {
            html += `
              <div class="tcr-d-card">
                <div class="tcr-d-card-header">
                  <span class="tcr-d-card-title">
                    <span style="color:#c084fc;">🧬</span> ${d.gene_id}
                    <span class="badge" style="background:rgba(124,58,237,0.2); color:#d8b4fe; border:1px solid #7c3aed; font-size:10px;">${(d.locus || d.chain_type || 'TRB').toUpperCase()}</span>
                    <span class="badge" style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #0284c7; font-size:10px;">${(d.species || 'human').toUpperCase()}</span>
                  </span>
                  <span style="font-size:11px; color:#94a3b8; font-family:'Fira Code', monospace;">${(d.dna_seq || '').length} bp</span>
                </div>
                <div style="font-size:11px; color:#94a3b8; display:flex; justify-content:space-between; align-items:center;">
                  <span>5' RSS: <span style="font-family:'Fira Code', monospace; color:#34d399;">${d.rss_5 || 'CACAGTG-12-ACAAAAACC'}</span></span>
                  <span>3' RSS: <span style="font-family:'Fira Code', monospace; color:#34d399;">${d.rss_3 || 'GGTTTTTGT-23-CACTGTG'}</span></span>
                </div>
                <div style="background:#020617; padding:6px 10px; border-radius:6px; font-family:'Fira Code', monospace; font-size:12px; color:#e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <span>${d.dna_seq}</span>
                  <button onclick="navigator.clipboard.writeText('${d.dna_seq}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy', 1500);" style="font-size:10px; padding:2px 6px; background:#1e293b; color:#38bdf8; border:1px solid #334155; border-radius:4px; cursor:pointer;">Copy</button>
                </div>
                <div style="font-size:10.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-top:2px;">6 Reading Frames (Direct & Inverted Rearrangements):</div>
                <div class="rf-matrix-grid">
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>RF1 (Direct)</span></div>
                    <div class="rf-subbox-seq">${d.aa_rf1 || '-'}</div>
                  </div>
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>Inv-RF1 (Inverted)</span></div>
                    <div class="rf-subbox-seq inv">${d.aa_inv_rf1 || '-'}</div>
                  </div>
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>RF2 (Direct)</span></div>
                    <div class="rf-subbox-seq">${d.aa_rf2 || '-'}</div>
                  </div>
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>Inv-RF2 (Inverted)</span></div>
                    <div class="rf-subbox-seq inv">${d.aa_inv_rf2 || '-'}</div>
                  </div>
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>RF3 (Direct)</span></div>
                    <div class="rf-subbox-seq">${d.aa_rf3 || '-'}</div>
                  </div>
                  <div class="rf-subbox">
                    <div class="rf-subbox-title"><span>Inv-RF3 (Inverted)</span></div>
                    <div class="rf-subbox-seq inv">${d.aa_inv_rf3 || '-'}</div>
                  </div>
                </div>
              </div>
            `;
          }
          html += `</div>`;
          tcrDjBody.innerHTML = html;
        } else {
          // J-genes Tab
          let filtered = getTcrJGenes().filter(j => {
            if (spFilter !== "all" && j.species.toLowerCase() !== spFilter.toLowerCase()) return false;
            if (locFilter !== "all" && j.locus !== locFilter && j.chain_type !== locFilter) return false;
            if (query) {
              const matchId = j.gene_id.toUpperCase().includes(query);
              const matchAa = (j.aa_seq || "").toUpperCase().includes(query);
              const matchB = (j.boundary_motif || "").toUpperCase().includes(query);
              if (!matchId && !matchAa && !matchB) return false;
            }
            return true;
          });

          if (filtered.length === 0) {
            tcrDjBody.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No TCR J-elements matching your search criteria.</div>`;
            return;
          }

          let html = `
            <div class="tcr-j-table-container">
              <table class="tcr-j-table">
                <thead>
                  <tr>
                    <th>Gene ID</th>
                    <th>Locus</th>
                    <th>Species</th>
                    <th>Amino Acid Sequence</th>
                    <th>Boundary Motif</th>
                    <th>IMGT Synthesis Boundary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
          `;
          for (let j of filtered) {
            const b = j.boundary_motif || "LTVT";
            html += `
              <tr>
                <td style="font-family:'Fira Code', monospace; font-weight:700; color:#c084fc;">${j.gene_id}</td>
                <td><span class="badge" style="background:rgba(124,58,237,0.2); color:#d8b4fe; border:1px solid #7c3aed; font-size:10px;">${(j.locus || j.chain_type).toUpperCase()}</span></td>
                <td><span class="badge" style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #0284c7; font-size:10px;">${(j.species || 'human').toUpperCase()}</span></td>
                <td style="font-family:'Fira Code', monospace; font-size:12px; color:#38bdf8;">${j.aa_seq || '-'}</td>
                <td><span class="j-boundary-tag">${b}</span></td>
                <td><span style="color:#34d399; font-weight:600; font-size:11px;">✅ 0 Constant Bleed</span></td>
                <td>
                  <button onclick="navigator.clipboard.writeText('${j.aa_seq}'); this.innerText='Copied!'; setTimeout(()=>this.innerText='Copy AA', 1500);" style="font-size:10.5px; padding:2px 8px; background:#1e293b; color:#38bdf8; border:1px solid #334155; border-radius:4px; cursor:pointer;">Copy AA</button>
                </td>
              </tr>
            `;
          }
          html += `
                </tbody>
              </table>
            </div>
          `;
          tcrDjBody.innerHTML = html;
        }
      }

      // Copy visible items as FASTA
      if (copyTcrDjFastaBtn) {
        copyTcrDjFastaBtn.onclick = () => {
          const spFilter = tcrDjSpeciesFilter ? tcrDjSpeciesFilter.value : "all";
          const locFilter = tcrDjLocusFilter ? tcrDjLocusFilter.value : "all";
          let fasta = "";
          if (activeTab === "D") {
            const items = getTcrDGenes().filter(d => {
              if (spFilter !== "all" && d.species.toLowerCase() !== spFilter.toLowerCase()) return false;
              if (locFilter !== "all" && d.locus !== locFilter && d.chain_type !== locFilter) return false;
              return true;
            });
            items.forEach(d => {
              fasta += `>${d.gene_id} [${d.species}] ${d.locus || d.chain_type} D-element len=${(d.dna_seq||'').length}bp\n${d.dna_seq}\n`;
            });
          } else {
            const items = getTcrJGenes().filter(j => {
              if (spFilter !== "all" && j.species.toLowerCase() !== spFilter.toLowerCase()) return false;
              if (locFilter !== "all" && j.locus !== locFilter && j.chain_type !== locFilter) return false;
              return true;
            });
            items.forEach(j => {
              fasta += `>${j.gene_id} [${j.species}] ${j.locus || j.chain_type} J-element boundary=${j.boundary_motif}\n${j.aa_seq}\n`;
            });
          }
          navigator.clipboard.writeText(fasta).then(() => {
            const orig = copyTcrDjFastaBtn.innerText;
            copyTcrDjFastaBtn.innerText = "✅ Copied FASTA!";
            setTimeout(() => copyTcrDjFastaBtn.innerText = orig, 1800);
          });
        };
      }

      // Initial render
      renderTcrDjContent();
    }

    // Initialize TCR D & J Drawer
    initTcrDjDrawer();

    var getColor = function(d, mode) { return "#8b949e"; };

    function updateCircleSelectionVisual() {
      if (!circles) return;
      const hasSelections = selectedGeneIds.size > 0;
      const hasFilters = selectedFilters.size > 0;

      circles.each(function(d) {
        const isSelected = selectedGeneIds.has(d.gene_id);
        const isFiltered = (currentMode === "hierarchical" || currentMode === "family")
          ? (selectedFilters.has(d.family) || selectedFilters.has(d.chain_group))
          : selectedFilters.has(d[currentMode]);

        this.setAttribute("fill", getColor(d, currentMode));

        if (isSelected) {
          d3.select(this).raise();
          this.setAttribute("r", "8.5");
          this.setAttribute("stroke", "#38bdf8");
          this.setAttribute("stroke-width", "2.5");
          this.setAttribute("opacity", "1.0");
        } else if (hasSelections) {
          this.setAttribute("r", isFiltered ? "5.0" : "2.5");
          this.setAttribute("stroke", isFiltered ? "#ffffff" : "none");
          this.setAttribute("stroke-width", isFiltered ? "1.2" : "0");
          this.setAttribute("opacity", isFiltered ? "0.35" : "0.12");
        } else if (hasFilters) {
          this.setAttribute("r", isFiltered ? "5.5" : "2.0");
          this.setAttribute("stroke", isFiltered ? "#ffffff" : "none");
          this.setAttribute("stroke-width", isFiltered ? "1.5" : "0");
          this.setAttribute("opacity", isFiltered ? "1.0" : "0.04");
        } else {
          this.setAttribute("r", "3.5");
          this.setAttribute("stroke", "#0d1117");
          this.setAttribute("stroke-width", "0.5");
          this.setAttribute("opacity", "0.85");
        }
      });
    }

    function flyToGene(geneId) {
      const target = globalData.find(d => d.gene_id === geneId);
      if (!target) return;
      const currentWidth = window.innerWidth || width;
      const currentHeight = window.innerHeight || height;

      // When alignment drawer is open, center in visible canvas area above drawer
      const drawer = document.getElementById("alignmentDrawer");
      let centerY = currentHeight / 2;
      if (drawer && !drawer.classList.contains("collapsed")) {
        const drawerRect = drawer.getBoundingClientRect();
        if (drawerRect.top > 150) {
          centerY = drawerRect.top / 2;
        }
      }

      const scale = 5.5;
      svg.transition()
        .duration(450)
        .ease(d3.easeCubicOut)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(currentWidth / 2 - target.x * scale, centerY - target.y * scale).scale(scale)
        );

      // Highlight target circle on map with radiant prominence
      circles.each(function(d) {
        if (d.gene_id === geneId) {
          d3.select(this).raise();
          this.setAttribute("r", "9.0");
          this.setAttribute("stroke", "#ffffff");
          this.setAttribute("stroke-width", "3.0");
          this.setAttribute("opacity", "1.0");
        }
      });

      // Highlight row in alignment drawer if present
      document.querySelectorAll(".align-row").forEach(r => {
        if (r.dataset && r.dataset.geneId === geneId) {
          r.classList.add("active-align-row");
          if (typeof r.scrollIntoView === "function") {
            r.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        } else {
          r.classList.remove("active-align-row");
        }
      });

      // Radar beacon ring pulse
      if (typeof beaconG !== 'undefined') {
        beaconG.selectAll("*").remove();

        const ring = beaconG.append("circle")
          .attr("cx", target.x)
          .attr("cy", target.y)
          .attr("r", 6)
          .attr("fill", "none")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 3)
          .attr("opacity", 1);

        ring.transition()
          .duration(1300)
          .ease(d3.easeCubicOut)
          .attr("r", 50)
          .attr("opacity", 0)
          .remove();

        const core = beaconG.append("circle")
          .attr("cx", target.x)
          .attr("cy", target.y)
          .attr("r", 3.5)
          .attr("fill", "#ffffff")
          .style("filter", "drop-shadow(0 0 8px #38bdf8)");

        core.transition()
          .duration(2000)
          .attr("opacity", 0.7);
      }
    }
    window.flyToGene = flyToGene;

    function compareCoincidentCluster(geneId) {
      const root = globalData.find(d => d.gene_id === geneId);
      if (!root) return;
      const coincident = globalData.filter(d => Math.abs(d.x - root.x) < 0.25 && Math.abs(d.y - root.y) < 0.25);
      selectedGeneIds = new Set(coincident.map(d => d.gene_id));
      updateCircleSelectionVisual();
      renderAlignmentView(coincident);
      openAlignmentDrawer();
    }
    window.compareCoincidentCluster = compareCoincidentCluster;

    function formatAlignedSequenceHtml(seq) {
      if (!seq) return '<span style="color:#64748b;">(no sequence available)</span>';

      function colorize(str, isCdr, cdrClass) {
        let out = "";
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (ch === "." || ch === "-") {
            out += '<span class="seq-gap">.</span>';
          } else if (isCdr) {
            out += `<span class="${cdrClass}">${ch}</span>`;
          } else {
            out += ch;
          }
        }
        return out;
      }

      if (seq.includes(".") || seq.length >= 70) {
        const fr1 = seq.slice(0, Math.min(26, seq.length));
        const cdr1 = seq.slice(26, Math.min(38, seq.length));
        const fr2 = seq.slice(38, Math.min(55, seq.length));
        const cdr2 = seq.slice(55, Math.min(65, seq.length));
        const fr3 = seq.slice(65, Math.min(104, seq.length));
        const tail = seq.length > 104 ? seq.slice(104) : "";

        const fr1Html = `<span class="align-region-fr1">${colorize(fr1, false, '')}</span>`;
        const cdr1Html = cdr1 ? `<span class="align-region-cdr1">${colorize(cdr1, true, 'seq-cdr1')}</span>` : '';
        const fr2Html = fr2 ? `<span class="align-region-fr2">${colorize(fr2, false, '')}</span>` : '';
        const cdr2Html = cdr2 ? `<span class="align-region-cdr2">${colorize(cdr2, true, 'seq-cdr2')}</span>` : '';
        const fr3Html = fr3 ? `<span class="align-region-fr3">${colorize(fr3, false, '')}</span>` : '';
        const tailHtml = tail ? `<span class="align-region-tail" style="color:#f59e0b; font-weight:600;">${colorize(tail, false, '')}</span>` : '';

        return `${fr1Html}${cdr1Html}${fr2Html}${cdr2Html}${fr3Html}${tailHtml}`;
      }

      return (seq || "").replace(/\./g, '<span class="seq-gap">.</span>');
    }

    function renderAlignmentView(customGenes = null) {
      let genes = [];
      if (customGenes && customGenes.length > 0) {
        genes = customGenes;
      } else if (selectedGeneIds.size > 0) {
        genes = globalData.filter(d => selectedGeneIds.has(d.gene_id));
      } else if (selectedFilters.size > 0) {
        genes = globalData.filter(d => (currentMode === "hierarchical" || currentMode === "family") ? (selectedFilters.has(d.family) || selectedFilters.has(d.chain_group)) : selectedFilters.has(d[currentMode]));
      } else if (globalData && globalData.length > 0) {
        genes = [globalData[0]];
      }

      displayedGenes = genes;
      const count = genes.length;
      document.getElementById("alignSelectionCount").innerText = `${count.toLocaleString()} of ${globalData.length.toLocaleString()} genes`;
      document.getElementById("alignCountBadge").innerText = count;

      const body = document.getElementById("alignmentBody");
      const badge = document.getElementById("alignModeBadge");

      if (count === 1) {
        // SINGLE SEQUENCE DISPLAY MODE
        badge.className = "align-mode-badge single";
        badge.innerText = "Single Sequence";

        const g = genes[0];
        const cleanSeq = (g.ungapped_seq || g.aa_seq || g.sequence || "").replace(/[\.\-]/g, "");
        const coincidentPeers = globalData.filter(item => Math.abs(item.x - g.x) < 0.25 && Math.abs(item.y - g.y) < 0.25);
        const hasPeers = coincidentPeers.length > 1;

        body.innerHTML = `
          <div class="single-seq-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #1e293b; padding-bottom:8px; flex-wrap:wrap; gap:8px;">
              <div>
                <span style="font-size:16px; font-weight:700; color:#58a6ff;">${g.systematic_id || g.gene_id}</span>
                ${g.legacy_name && g.legacy_name !== (g.systematic_id || g.gene_id) ? `<span style="font-size:14px; color:#f59e0b; font-weight:700; margin-left:8px;">[${g.legacy_name}]</span>` : ''}
                <span style="font-size:12px; color:#94a3b8; margin-left:8px;">${g.species === 'dogfish' ? '🦈 Dogshark (Spiny Dogfish)' : (g.species === 'dog' ? '🐕 Dog (Canine)' : g.species.toUpperCase())}</span>
                <span style="font-size:12px; color:#34d399; margin-left:8px; font-weight:600;">${g.family || g.clan || '-'}</span>
                <span style="font-size:12px; color:#e2e8f0; margin-left:8px;">${g.chain_group || (g.species + " " + g.chain)}</span>
                <span style="font-size:11px; color:#64748b; margin-left:8px;">(${g.clan})</span>
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:#38bdf8; font-weight:600;">
                  Mature Length: ${cleanSeq.length} AA
                </span>
                <button class="drawer-action-btn" data-action="fly-to-gene" data-gene-id="${g.gene_id}" onclick="flyToGene('${g.gene_id}')" title="Center camera on map">🎯 Center on Map</button>
              </div>
            </div>

            ${(g.vbase1_tomlinson_name || g.vbase1_name || g.imgt_name || g.official_imgt_name || g.vbase2_id || g.kabat_id || g.kabat_ids || g.ebi_accessions) ? `
              <div style="margin-bottom:12px; background:rgba(30,41,59,0.5); border:1px solid #334155; border-radius:6px; padding:8px 12px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; font-size:11.5px;">
                <span style="color:#94a3b8; font-weight:600;">Cross-References:</span>
                ${(g.imgt_name || g.official_imgt_name) && (g.imgt_name || g.official_imgt_name) !== '-' ? `<span style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:2px 8px; border-radius:4px;">🏷️ IMGT: <strong>${g.imgt_name || g.official_imgt_name}</strong></span>` : ''}
                ${(g.vbase1_tomlinson_name || g.vbase1_name) ? `<span style="background:rgba(236,72,153,0.12); color:#f472b6; border:1px solid rgba(236,72,153,0.3); padding:2px 8px; border-radius:4px;" title="VBASE (Ian Tomlinson MRC Nomenclature)">🏛️ VBASE (Tomlinson): <strong>${g.vbase1_tomlinson_name || g.vbase1_name}</strong></span>` : ''}
                ${g.vbase2_id ? `<span style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.3); padding:2px 8px; border-radius:4px;">🏛️ VBASE2: <strong>${g.vbase2_id}</strong></span>` : ''}
                ${(g.kabat_id || g.kabat_ids) ? `<span style="background:rgba(167,139,250,0.12); color:#c084fc; border:1px solid rgba(167,139,250,0.3); padding:2px 8px; border-radius:4px;" title="${g.kabat_ids || g.kabat_id}">📜 Kabat: <strong>${g.kabat_id || g.kabat_ids.split(';')[0].trim()}</strong></span>` : ''}
                ${g.ebi_accessions ? `<span style="background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.3); padding:2px 8px; border-radius:4px; max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${g.ebi_accessions}">🔗 EBI/EMBL: <strong>${g.ebi_accessions.length > 35 ? g.ebi_accessions.slice(0, 32) + '...' : g.ebi_accessions}</strong></span>` : ''}
              </div>
            ` : ''}

            <div style="font-size:11px; color:#94a3b8; margin-bottom:6px; display:flex; justify-content:space-between;">
              <span>Continuous Mature Variable Domain Sequence:</span>
              <span style="color:#64748b; font-size:10.5px;">IMGT Positions 1 → 104</span>
            </div>
            <div style="font-family:'Fira Code', monospace; font-size:13px; letter-spacing:1px; background:#060a12; padding:12px 14px; border-radius:6px; border:1px solid #1e293b; color:#f1f5f9; word-break:break-all; user-select:all; line-height:1.6;">
              ${cleanSeq}
            </div>

            ${hasPeers ? `
              <div style="margin-top:10px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#f59e0b; font-size:11.5px; font-weight:600;">
                  👥 Coincident Cluster: ${coincidentPeers.length} genes map to this coordinate (${g.gene_id}, ${coincidentPeers.map(p => p.gene_id).filter(id => id !== g.gene_id).slice(0, 3).join(', ')}${coincidentPeers.length > 4 ? '...' : ''})
                </span>
                <button class="drawer-action-btn" data-action="compare-cluster" data-gene-id="${g.gene_id}" style="border-color:#f59e0b; color:#f59e0b;" onclick="compareCoincidentCluster('${g.gene_id}')">
                  🧬 Compare All ${coincidentPeers.length} Alleles (Preserve IMGT Gaps)
                </button>
              </div>
            ` : ''}

            <div style="margin-top:10px; font-size:11px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
              <span>ℹ️ Single sequence display mode.</span>
              <span>💡 Shift-click spots on the map or filter by family to display multiple sequences with IMGT gaps kept</span>
            </div>
          </div>
        `;
      } else {
        // MULTIPLE SEQUENCE DISPLAY MODE: Keep alignment gaps (canonical 104 columns)
        badge.className = "align-mode-badge multi";
        badge.innerText = `${count} Sequences • IMGT Gaps Kept`;

        let html = `
          <div class="imgt-ruler-container">
            <div class="ruler-region-row">
              <span style="display:inline-block; width:270px; min-width:270px; color:#94a3b8;">Gene Identifier & Species</span>
              <span class="align-region-fr1" style="color:#60a5fa;">FR1 (1-26)</span>
              <span class="align-region-cdr1" style="color:#fbbf24; background:rgba(251,191,36,0.15); text-align:center; border-radius:3px;">CDR1 (27-38)</span>
              <span class="align-region-fr2" style="color:#60a5fa;">FR2 (39-55)</span>
              <span class="align-region-cdr2" style="color:#34d399; background:rgba(52,211,153,0.15); text-align:center; border-radius:3px;">CDR2 (56-65)</span>
              <span class="align-region-fr3" style="color:#60a5fa;">FR3 (66-104)</span>
            </div>
            <div class="ruler-ticks-row">
              <span style="display:inline-block; width:270px; min-width:270px; color:#64748b;">IMGT Unique Coordinates</span>
              <span class="align-region-fr1">1......:....23(C)..26</span>
              <span class="align-region-cdr1" style="text-align:center;">27........38</span>
              <span class="align-region-fr2">39..41(W).....55</span>
              <span class="align-region-cdr2" style="text-align:center;">56......65</span>
              <span class="align-region-fr3">66.....:.....:....:........104(C)</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:2px;">
        `;

        const maxRender = Math.min(genes.length, 250);
        for (let i = 0; i < maxRender; i++) {
          const g = genes[i];
          const isRowSelected = selectedGeneIds.has(g.gene_id);
          const spIcon = g.species === 'dogfish' ? '🦈' : (g.species === 'dog' ? '🐕' : (g.species === 'mouse' ? '🐁' : (g.species === 'human' ? '👤' : (g.species === 'alpaca' ? '🦙' : '🧬'))));
          const rawSeq = g.aa_seq || "";
          const hasLetters = /[A-Za-z]/.test(rawSeq);
          const seq = hasLetters ? rawSeq : (g.ungapped_seq || g.sequence || rawSeq || "");
          html += `
            <div class="align-row ${isRowSelected ? 'selected-align-row' : ''}" data-gene-id="${g.gene_id}" onclick="flyToGene('${g.gene_id}')" title="Click to center camera on ${g.gene_id}">
              <span class="align-gene-tag">
                ${spIcon} <strong style="color:#58a6ff;">${g.systematic_id || g.gene_id}</strong> ${g.legacy_name && g.legacy_name !== (g.systematic_id || g.gene_id) ? `<span style="color:#f59e0b; font-size:11px; font-weight:600;">[${g.legacy_name}]</span>` : ''} <span style="color:#64748b; font-size:10.5px; font-weight:normal;">(${g.clan || g.family || g.species})</span>
              </span>
              <span class="align-seq-chars">
                ${formatAlignedSequenceHtml(seq)}
              </span>
            </div>
          `;
        }

        if (genes.length > maxRender) {
          html += `<div style="font-size:11px; color:#94a3b8; padding:8px; text-align:center;">... and ${genes.length - maxRender} more sequences (Click "Copy FASTA" to export all ${genes.length})</div>`;
        }

        html += `
          </div>
          <div style="margin-top:10px; font-size:11px; color:#64748b; padding-top:6px; border-top:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center;">
            <span>ℹ️ Multiple sequence display mode: IMGT alignment gaps preserved (exact 104 columns).</span>
            <span>Click any row to fly to gene on map • Click "Copy FASTA" to export full alignment</span>
          </div>
        `;

        body.innerHTML = html;

        // Attach event delegation for alignment rows and action buttons
        if (!body._hasDelegatedClickListener) {
          body._hasDelegatedClickListener = true;
          body.addEventListener("click", (e) => {
            const row = e.target.closest(".align-row");
            if (row && row.dataset && row.dataset.geneId) {
              const clickedGeneId = row.dataset.geneId;
              const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;

              if (isMulti) {
                // If adding with shift, ensure displayed genes are part of selectedGeneIds
                if (selectedGeneIds.size === 0 && displayedGenes && displayedGenes.length > 0) {
                  selectedGeneIds = new Set(displayedGenes.map(g => g.gene_id));
                }
                if (selectedGeneIds.has(clickedGeneId)) {
                  selectedGeneIds.delete(clickedGeneId);
                  row.classList.remove("selected-align-row");
                  row.classList.remove("active-align-row");
                } else {
                  selectedGeneIds.add(clickedGeneId);
                  row.classList.add("selected-align-row");
                  row.classList.add("active-align-row");
                }
                updateCircleSelectionVisual();
                const selCountElem = document.getElementById("alignSelectionCount");
                if (selCountElem) selCountElem.innerText = `${selectedGeneIds.size.toLocaleString()} of ${globalData.length.toLocaleString()} genes`;
                const selBadge = document.getElementById("alignCountBadge");
                if (selBadge) selBadge.innerText = selectedGeneIds.size;
              } else {
                document.querySelectorAll(".align-row").forEach(r => r.classList.remove("active-align-row"));
                row.classList.add("active-align-row");
              }

              flyToGene(clickedGeneId);
              return;
            }
            const flyBtn = e.target.closest("[data-action='fly-to-gene']");
            if (flyBtn && flyBtn.dataset && flyBtn.dataset.geneId) {
              flyToGene(flyBtn.dataset.geneId);
              return;
            }
            const clusterBtn = e.target.closest("[data-action='compare-cluster']");
            if (clusterBtn && clusterBtn.dataset && clusterBtn.dataset.geneId) {
              compareCoincidentCluster(clusterBtn.dataset.geneId);
              return;
            }
          });
        }
      }
    }

    const clearInputBtn = document.getElementById("clearBtn");
    if (clearInputBtn) clearInputBtn.onclick = () => {
      const ta = document.getElementById("seqTextarea");
      if (ta) ta.value = "";
      const hud = document.getElementById("analysisHUD");
      if (hud) hud.style.display = "none";
      beaconG.selectAll("*").remove();
    };

    const tooltip = d3.select("#tooltip");
    const banner = d3.select("#selectionBanner");

    const clanColors = {
      "Clan III (Universal Ancestral)": "#58a6ff",
      "Clan I (Expanded Tetrapod)": "#3fb950",
      "Clan II (Divergent Framework)": "#d29922",
      "Clan III (Camelid VHH)": "#f0883e",
      "Light Chain (Kappa - IGK)": "#bc8cff",
      "Light Chain (Lambda - IGL)": "#f778ba",
      "Light Chain (Sigma - Ancient Amphibian)": "#2ea043",
      "Light Chain (Rho - Ancient Amphibian)": "#1f6feb",
      "Cartilaginous Fish (VNAR Single-Domain)": "#ff7b72"
    };

    const cladeColors = {
      "Primates": "#38bdf8",         // Sky Blue
      "Rodentia": "#ec4899",         // Pink
      "Artiodactyla": "#f59e0b",     // Amber (High γδ TCR clade)
      "Carnivora": "#a855f7",        // Purple
      "Lagomorpha": "#fbbf24",       // Gold
      "Actinopterygii": "#06b6d4",   // Teal (Teleost Fish)
      "Aves": "#10b981",             // Emerald (Birds)
      "Amphibia": "#84cc16",         // Lime Green (Amphibians)
      "Chondrichthyes": "#ef4444"    // Red (Sharks / NAR-TCR)
    };

    const chainColors = {
      "Heavy": "#58a6ff",
      "Heavy (VHH Single-Domain)": "#f0883e",
      "Light (Kappa - IGK)": "#bc8cff",
      "Light (Lambda - IGL)": "#f778ba",
      "Light (Sigma - Ancient Amphibian)": "#2ea043",
      "Light (Rho - Ancient Amphibian)": "#1f6feb",
      "VNAR Single-Domain (Shark)": "#ff7b72",
      "TRAV": "#10b981",
      "TRBV": "#06b6d4",
      "TRGV": "#8b5cf6",
      "TRDV": "#f59e0b",
      "TRA": "#10b981",
      "TRB": "#06b6d4",
      "TRG": "#8b5cf6",
      "TRD": "#f59e0b"
    };

    // Dedicated Curated Palette for Renate Dildrop Murine & IMGT Families
    const dildropFamilyColors = {
      "Mouse VH1 (J558)": "#38bdf8",     // Vibrant Cyan
      "Mouse VH2 (Q52)": "#f59e0b",      // Amber
      "Mouse VH3 (36-60)": "#fbbf24",    // Gold
      "Mouse VH4 (X24)": "#34d399",      // Emerald
      "Mouse VH5 (7183)": "#a855f7",     // Purple
      "Mouse VH6 (J606)": "#ec4899",     // Pink
      "Mouse VH7 (S107)": "#06b6d4",     // Deep Teal
      "Mouse VH8 (3609)": "#60a5fa",     // Sky Blue
      "Mouse VH9 (VGAM3.8)": "#4ade80", // Light Green
      "Mouse VH10 (1210.7)": "#f43f5e",  // Rose
      "Mouse VH11 (V10)": "#e879f9",     // Fuchsia
      "Mouse VH12 (CH27/PtC)": "#14b8a6", // Teal
      "Mouse VH13 (3609N)": "#84cc16",    // Lime
      "Mouse VH14 (SM7)": "#f97316",      // Coral/Orange
      "Human IGHV1": "#3b82f6",
      "Human IGHV2": "#d97706",
      "Human IGHV3": "#0284c7",
      "Human IGHV4": "#b45309",
      "Human IGHV5": "#10b981",
      "Human IGHV6": "#8b5cf6",
      "Human IGHV7": "#059669",
      "Dogshark Heavy": "#0ea5e9",
      "Dogshark Light": "#38bdf8",
      "Dogshark VNAR": "#f43f5e",
      "Dog VH (Clan III)": "#3b82f6",
      "Dog VH (Clan I)": "#10b981",
      "Camelid VHH": "#f0883e",
      "Shark VNAR": "#ff7b72",
      "Ancient Amphibian V-Sigma": "#2ea043",
      "Ancient Amphibian V-Rho": "#1f6feb",
      "Mouse IGLV1": "#f472b6",
      "Mouse IGLV2": "#db2777",
      "Mouse IGLV3": "#fda4af"
    };

    const ordinalPalette = d3.scaleOrdinal(d3.schemeTableau10);
    let selectedFilters = new Set();
    let currentMode = "family";
    let globalData = [];

    // Translation Table
    const CODON_TABLE_JS = {
      'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M', 'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
      'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K', 'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
      'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L', 'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
      'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q', 'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
      'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V', 'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
      'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E', 'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
      'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S', 'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
      'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W',
    };

    function translateDnaJs(dna) {
      dna = dna.toUpperCase().replace(/U/g, 'T').replace(/[^ACGT]/g, '');
      let aa = '';
      for (let i = 0; i < dna.length - 2; i += 3) {
        aa += CODON_TABLE_JS[dna.slice(i, i+3)] || 'X';
      }
      return aa;
    }

    // Load Universe Data (Supports dynamic switching between VBASE3 2,048 points and legacy datasets)
    const datasetToLoad = window.DATASET_FILE || (document.getElementById("universeDatasetSelect") ? document.getElementById("universeDatasetSelect").value : "vgene_pacmap_data.json");
    d3.json(datasetToLoad).then(data => {
      // Normalize data fields for both Antibody and TCR datasets
      data.forEach(d => {
        d.gene_id = d.systematic_id || d.gene_id || d.id;
        d.systematic_id = d.systematic_id || d.gene_id;
        d.gene_name = d.systematic_id;
        d.crossreferences = d.crossreferences || (d.legacy_name && d.legacy_name !== d.systematic_id ? d.legacy_name : "");
        d.legacy_name = d.crossreferences || d.legacy_name || d.systematic_id;
        d.vbase1_tomlinson_name = d.vbase1_tomlinson_name || d.vbase1_name || "";
        d.vbase1_name = d.vbase1_tomlinson_name;
        d.kabat_id = d.kabat_id || "";
        d.kabat_ids = d.kabat_ids || d.kabat_id || "";
        d.ebi_accessions = d.ebi_accessions || "";
        d.imgt_name = d.imgt_name || d.official_imgt_name || "";
        d.official_imgt_name = d.official_imgt_name || d.imgt_name || "";
        d.vbase2_id = d.vbase2_id || "";
        d.ungapped_seq = (d.ungapped_seq || d.sequence || (d.aa_seq ? d.aa_seq.replace(/[\.\-]/g, "") : "")).trim();
        d.aa_seq = (d.aa_seq || d.ungapped_seq || d.sequence || "").trim();
        d.sequence = d.ungapped_seq;
        d.family = d.family || d.clan || "-";
        d.chain_group = d.chain_group || (d.species + " " + d.chain);
      });
      globalData = data;

      const dsSelect = document.getElementById("universeDatasetSelect");
      if (dsSelect) {
        dsSelect.value = datasetToLoad;
        dsSelect.addEventListener("change", function() {
          if (this.value === "tcrbase_pacmap_data.json" && !window.location.href.includes("tcr_universe.html")) {
            window.location.href = "tcr_universe.html";
          } else if (this.value === "vbase2_pacmap_data.json" && !window.location.href.includes("vbase2_universe.html")) {
            window.location.href = "vbase2_universe.html";
          } else if (this.value === "vgene_pacmap_data.json" && (window.location.href.includes("vbase2_universe.html") || window.location.href.includes("tcr_universe.html"))) {
            window.location.href = "vgene_pacmap_universe.html";
          }
        });
      }

      // Update KPI
      const sps = Array.from(new Set(data.map(d => d.species)));
      const clades = Array.from(new Set(data.map(d => d.clade).filter(Boolean)));
      const fams = Array.from(new Set(data.map(d => d.family || d.clan)));
      if (document.getElementById("kpiGenes")) document.getElementById("kpiGenes").innerText = data.length.toLocaleString();
      if (document.getElementById("kpiSpecies")) document.getElementById("kpiSpecies").innerText = sps.length.toLocaleString();
      if (document.getElementById("kpiClades")) document.getElementById("kpiClades").innerText = `${clades.length} Clades`;
      if (document.getElementById("kpiFamilies")) document.getElementById("kpiFamilies").innerText = fams.length.toLocaleString();

      getColor = function(d, mode) {
        if (mode === "hierarchical" || mode === "family") return dildropFamilyColors[d.family] || ordinalPalette(d.family);
        if (mode === "clan") return clanColors[d.clan] || ordinalPalette(d.clan);
        if (mode === "orthogroup") return ordinalPalette(d.orthogroup);
        if (mode === "species") return ordinalPalette(d.species);
        if (mode === "chain") return chainColors[d.chain] || "#8b949e";
        if (mode === "vbase2_class") {
          if (d.vbase2_class && d.vbase2_class.includes("Class I")) return "#10b981"; // Emerald
          if (d.vbase2_class && d.vbase2_class.includes("Class II")) return "#3b82f6"; // Blue
          if (d.vbase2_class && d.vbase2_class.includes("Class III")) return "#f59e0b"; // Amber
          return "#8b949e";
        }
        if (mode === "clade") return cladeColors[d.clade] || ordinalPalette(d.clade);
        if (mode === "functionality") {
          const f = (d.functionality || "").trim();
          if (f === "F" || f === "[F]" || f === "(F)") return "#10b981";
          if (f.includes("ORF")) return "#f59e0b";
          if (f === "P" || f.includes("P")) return "#ef4444";
          return "#8b949e";
        }
        return "#8b949e";
      }

      // Multi-Select Filter Evaluator
      function updateHighlights() {
        const count = selectedFilters.size;
        const countEl = document.getElementById("legendSelectedCount");
        if (countEl) countEl.innerText = `${count} selected`;

        if (count === 0) {
          banner.style("display", "none");
          document.querySelectorAll(".legend-item, .legend-child-item").forEach(el => el.classList.remove("checked-item"));
          document.querySelectorAll(".legend-cb, .legend-child-cb, .legend-group-cb").forEach(cb => {
            cb.checked = false;
            cb.indeterminate = false;
          });
          circles.each(function() {
            this.setAttribute("opacity", "0.85");
            this.setAttribute("r", "3.5");
            this.setAttribute("stroke", "#0d1117");
            this.setAttribute("stroke-width", "0.5");
          });
        } else {
          // Update child and item classes
          document.querySelectorAll(".legend-child-item, .legend-item").forEach(el => {
            const key = el.getAttribute("data-key");
            if (selectedFilters.has(key)) el.classList.add("checked-item");
            else el.classList.remove("checked-item");
          });
          document.querySelectorAll(".legend-child-cb, .legend-cb").forEach(cb => {
            const key = cb.getAttribute("data-key");
            cb.checked = selectedFilters.has(key);
          });

          // Update parent group checkboxes (checked, unchecked, or indeterminate)
          document.querySelectorAll(".legend-group").forEach(grp => {
            const parentCb = grp.querySelector(".legend-group-cb");
            if (!parentCb) return;
            const childCbs = grp.querySelectorAll(".legend-child-cb");
            let checkedCount = 0;
            for (let i = 0; i < childCbs.length; i++) {
              if (childCbs[i].checked) checkedCount++;
            }
            if (checkedCount === 0) {
              parentCb.checked = false;
              parentCb.indeterminate = false;
            } else if (checkedCount === childCbs.length) {
              parentCb.checked = true;
              parentCb.indeterminate = false;
            } else {
              parentCb.checked = false;
              parentCb.indeterminate = true;
            }
          });

          let matchCount = 0;
          circles.each(function(d) {
            let isMatch = false;
            if (currentMode === "hierarchical" || currentMode === "family") {
              isMatch = selectedFilters.has(d.family) || selectedFilters.has(d.chain_group);
            } else {
              isMatch = selectedFilters.has(d[currentMode]);
            }
            if (isMatch) {
              matchCount++;
              this.setAttribute("opacity", "1.0");
              this.setAttribute("r", "5.5");
              this.setAttribute("stroke", "#ffffff");
              this.setAttribute("stroke-width", "1.6");
            } else {
              this.setAttribute("opacity", "0.04");
              this.setAttribute("r", "2.0");
              this.setAttribute("stroke", "none");
            }
          });

          const labelList = Array.from(selectedFilters).slice(0, 4).join(", ") + (selectedFilters.size > 4 ? ` (+${selectedFilters.size - 4} more)` : "");
          banner.style("display", "block")
            .html(`
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                <div>✨ <strong>Comparison [${labelList}]:</strong> <strong>${matchCount.toLocaleString()}</strong> of ${data.length.toLocaleString()} genes (${((matchCount/data.length)*100).toFixed(1)}%)</div>
                <button id="btnViewBannerAlign" class="drawer-action-btn" style="background:#1e3a5f; color:#38bdf8; border-color:#38bdf8;">🧬 View Sequence Alignment (${matchCount})</button>
              </div>
            `);
          d3.select("#btnViewBannerAlign").on("click", () => {
            const matched = globalData.filter(d => (currentMode === "hierarchical" || currentMode === "family") ? (selectedFilters.has(d.family) || selectedFilters.has(d.chain_group)) : selectedFilters.has(d[currentMode]));
            selectedGeneIds = new Set(matched.map(m => m.gene_id));
            updateCircleSelectionVisual();
            renderAlignmentView(matched);
            openAlignmentDrawer();
          });
        }
      }

      function updateLegend(mode) {
        currentMode = mode;
        const modeTitle = mode === "hierarchical" ? "SPECIES & CHAIN → V-GENE FAMILY" : (mode === "family" ? "V-GENE FAMILY" : mode.toUpperCase());
        document.getElementById("legendTitleText").innerText = `Legend: ${modeTitle}`;

        const legList = d3.select("#legendContent");
        legList.selectAll("*").remove();

        if (mode === "hierarchical") {
          // Build 2-level hierarchical tree
          const hierarchy = {};
          data.forEach(d => {
            const grp = d.chain_group || (d.species.charAt(0).toUpperCase() + d.species.slice(1) + " " + d.chain);
            const fam = d.family;
            if (!hierarchy[grp]) hierarchy[grp] = { count: 0, families: {}, species: d.species, chain: d.chain };
            hierarchy[grp].count++;
            hierarchy[grp].families[fam] = (hierarchy[grp].families[fam] || 0) + 1;
          });

          // Sort groups: Mouse and Human first, then by count descending
          const sortedGroups = Object.keys(hierarchy).sort((a, b) => {
            const aMus = a.includes("Mouse") ? 100000 : 0;
            const bMus = b.includes("Mouse") ? 100000 : 0;
            const aHum = a.includes("Human") ? 50000 : 0;
            const bHum = b.includes("Human") ? 50000 : 0;
            return (bMus + bHum + hierarchy[b].count) - (aMus + aHum + hierarchy[a].count);
          });

          sortedGroups.forEach(grp => {
            const gData = hierarchy[grp];
            const grpElem = legList.append("div").attr("class", "legend-group");

            // Header
            const header = grpElem.append("div").attr("class", "legend-group-header");
            
            const arrow = header.append("span")
              .attr("class", "legend-arrow")
              .text("▼");

            const grpCb = header.append("input")
              .attr("type", "checkbox")
              .attr("class", "legend-group-cb")
              .attr("data-group", grp);

            // Emoji for species
            let emoji = "🧬";
            const lowGrp = grp.toLowerCase();
            if (lowGrp.includes("mouse")) emoji = "🐭";
            else if (lowGrp.includes("human")) emoji = "👤";
            else if (lowGrp.includes("alpaca") || lowGrp.includes("camel") || lowGrp.includes("llama")) emoji = "🦙";
            else if (lowGrp.includes("shark") || lowGrp.includes("dogfish") || lowGrp.includes("dogshark")) emoji = "🦈";
            else if (lowGrp.includes("dog")) emoji = "🐕";
            else if (lowGrp.includes("cat")) emoji = "🐈";
            else if (lowGrp.includes("xenopus") || lowGrp.includes("axolotl")) emoji = "🐸";
            else if (lowGrp.includes("rabbit")) emoji = "🐇";
            else if (lowGrp.includes("pig")) emoji = "🐖";
            else if (lowGrp.includes("horse")) emoji = "🐎";
            else if (lowGrp.includes("chicken") || lowGrp.includes("duck") || lowGrp.includes("zebrafinch")) emoji = "🦆";
            else if (lowGrp.includes("zebrafish") || lowGrp.includes("salmon") || lowGrp.includes("trout") || lowGrp.includes("cod") || lowGrp.includes("gar")) emoji = "🐟";
            else if (lowGrp.includes("cow") || lowGrp.includes("bovine") || lowGrp.includes("sheep") || lowGrp.includes("goat") || lowGrp.includes("buffalo")) emoji = "🐄";
            else if (lowGrp.includes("bat")) emoji = "🦇";
            else if (lowGrp.includes("elephant")) emoji = "🐘";
            else if (lowGrp.includes("marmoset") || lowGrp.includes("baboon") || lowGrp.includes("rhesus") || lowGrp.includes("cynomolgus")) emoji = "🐒";
            else if (lowGrp.includes("gorilla") || lowGrp.includes("chimpanzee")) emoji = "🦍";

            header.append("span")
              .attr("class", "legend-group-title")
              .html(`${emoji} ${grp}`);

            const famCount = Object.keys(gData.families).length;
            header.append("span")
              .attr("class", "legend-group-badge")
              .text(`${gData.count} genes • ${famCount} fam`);

            // Children list
            const children = grpElem.append("div").attr("class", "legend-children");
            
            // Toggle collapse
            header.on("click", function(event) {
              if (event.target.classList.contains("legend-group-cb")) return;
              const isCol = children.classed("collapsed");
              children.classed("collapsed", !isCol);
              arrow.classed("collapsed", !isCol).text(!isCol ? "▶" : "▼");
            });

            // Parent checkbox toggle
            grpCb.on("change", function(event) {
              event.stopPropagation();
              const isChecked = this.checked;
              Object.keys(gData.families).forEach(fam => {
                if (isChecked) selectedFilters.add(fam);
                else selectedFilters.delete(fam);
              });
              updateHighlights();
            });

            // Populate child families
            const sortedFams = Object.keys(gData.families).sort((a, b) => gData.families[b] - gData.families[a]);
            sortedFams.forEach(fam => {
              const fCount = gData.families[fam];
              const fColor = dildropFamilyColors[fam] || ordinalPalette(fam);
              const isChecked = selectedFilters.has(fam);

              const childRow = children.append("label")
                .attr("class", "legend-child-item" + (isChecked ? " checked-item" : ""))
                .attr("data-key", fam);

              childRow.append("input")
                .attr("type", "checkbox")
                .attr("class", "legend-child-cb")
                .attr("data-key", fam)
                .attr("data-group", grp)
                .property("checked", isChecked)
                .on("change", function(event) {
                  event.stopPropagation();
                  if (this.checked) selectedFilters.add(fam);
                  else selectedFilters.delete(fam);
                  updateHighlights();
                });

              childRow.append("div")
                .attr("class", "legend-color")
                .style("background", fColor);

              childRow.append("span")
                .attr("class", "legend-label")
                .attr("title", fam)
                .text(fam);

              childRow.append("span")
                .attr("class", "legend-count")
                .text(`(${fCount})`);
            });
          });
        } else {
          // Flat mode
          const countMap = {};
          data.forEach(d => {
            const k = d[mode];
            countMap[k] = (countMap[k] || 0) + 1;
          });

          const sortedKeys = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);

          sortedKeys.forEach(k => {
            const count = countMap[k];
            let color = "#8b949e";
            if (mode === "clan") color = clanColors[k] || ordinalPalette(k);
            else if (mode === "orthogroup") color = ordinalPalette(k);
            else if (mode === "family") color = dildropFamilyColors[k] || ordinalPalette(k);
            else if (mode === "species") color = ordinalPalette(k);
            else if (mode === "chain") color = chainColors[k] || ordinalPalette(k);
            else if (mode === "vbase2_class") {
              if (k && k.includes("Class I")) color = "#10b981";
              else if (k && k.includes("Class II")) color = "#3b82f6";
              else if (k && k.includes("Class III")) color = "#f59e0b";
              else color = "#8b949e";
            }
            else if (mode === "clade") color = cladeColors[k] || ordinalPalette(k);
            else if (mode === "functionality") {
              const kTrim = (k || "").trim();
              if (kTrim === "F" || kTrim === "[F]" || kTrim === "(F)") color = "#10b981";
              else if (kTrim.includes("ORF")) color = "#f59e0b";
              else if (kTrim === "P" || kTrim.includes("P")) color = "#ef4444";
              else color = "#8b949e";
            }

            const isChecked = selectedFilters.has(k);

            const row = legList.append("label")
              .attr("class", "legend-item" + (isChecked ? " checked-item" : ""))
              .attr("data-key", k);

            row.append("input")
              .attr("type", "checkbox")
              .attr("class", "legend-cb")
              .attr("data-key", k)
              .property("checked", isChecked)
              .on("change", function(event) {
                event.stopPropagation();
                if (this.checked) selectedFilters.add(k);
                else selectedFilters.delete(k);
                updateHighlights();
              });

            row.append("div")
              .attr("class", "legend-color")
              .style("background", color);

            row.append("span")
              .attr("class", "legend-label")
              .attr("title", k)
              .text(k);

            row.append("span")
              .attr("class", "legend-count")
              .text(`(${count.toLocaleString()})`);
          });
        }

        updateHighlights();
      }

      // Build Legend Skeleton
      d3.select("#legend").html(`
        <div class="legend-header">
          <div class="legend-title">
            <span id="legendTitleText">Legend (HIERARCHICAL)</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span id="legendSelectedCount" class="legend-badge">0 selected</span>
              <button class="panel-minimize-btn" id="closeLegendBtn" title="Minimize Legend">✕</button>
            </div>
          </div>
          <div class="legend-btn-row">
            <button id="selectAllBtn" class="legend-btn">Select All</button>
            <button id="deselectAllBtn" class="legend-btn">Deselect All</button>
            <button id="expandAllBtn" class="legend-btn">Expand All</button>
            <button id="collapseAllBtn" class="legend-btn">Collapse All</button>
          </div>
        </div>
        <div class="legend-instruction">☑️ Select entire chains (e.g. Mouse/Human Heavy & Light) or individual families to compare directly!</div>
        <div id="legendContent" style="max-height: 380px; overflow-y: auto;"></div>
      `);

      d3.select("#closeLegendBtn").on("click", () => {
        d3.select("#legend").classed("collapsed", true);
        document.getElementById("restoreLegendBtn").style.display = "inline-flex";
        updateEvoPosition();
      });

      d3.select("#selectAllBtn").on("click", () => {
        if (currentMode === "hierarchical") {
          data.forEach(d => selectedFilters.add(d.family));
        } else {
          data.forEach(d => selectedFilters.add(d[currentMode]));
        }
        updateHighlights();
      });

      d3.select("#deselectAllBtn").on("click", () => {
        selectedFilters.clear();
        updateHighlights();
      });

      d3.select("#expandAllBtn").on("click", () => {
        d3.selectAll(".legend-children").classed("collapsed", false);
        d3.selectAll(".legend-arrow").classed("collapsed", false).text("▼");
      });

      d3.select("#collapseAllBtn").on("click", () => {
        d3.selectAll(".legend-children").classed("collapsed", true);
        d3.selectAll(".legend-arrow").classed("collapsed", true).text("▶");
      });

      circles = circlesG.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 3.5)
        .attr("fill", d => getColor(d, "hierarchical"))
        .attr("opacity", 0.85)
        .attr("stroke", "#0d1117")
        .attr("stroke-width", 0.5)
        .attr("id", (d, i) => "vnode_" + i)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("r", 8.5).attr("stroke", "#fff").attr("stroke-width", 2.5).raise();
          const singleSeq = (d.ungapped_seq || d.aa_seq).replace(/[\.\-]/g, "");
          const crossrefVal = d.crossreferences || (d.legacy_name && d.legacy_name !== d.systematic_id && d.legacy_name !== d.gene_id ? d.legacy_name : '');
          tooltip.style("display", "block")
            .html(`
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; gap:8px;">
                <strong style="color:#38bdf8; font-size:15px; letter-spacing:0.3px;">${d.systematic_id || d.gene_id}</strong>
                ${d.vbase2_id || crossrefVal ? `<span style="color:#f59e0b; font-weight:700; font-size:12px; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); padding:1px 6px; border-radius:4px;">${d.vbase2_id || crossrefVal}</span>` : ''}
              </div>
              <div style="margin-bottom:4px;"><strong>V-Gene Name:</strong> <span style="color:#38bdf8; font-weight:bold;">${d.systematic_id || d.gene_name || d.gene_id}</span></div>
              <div style="margin-bottom:4px;"><strong>Systematic Nomenclature:</strong> <span style="color:#38bdf8; font-weight:bold;">${d.systematic_id || d.gene_id}</span></div>
              ${(d.vbase1_tomlinson_name || d.vbase1_name) ? `<div style="margin-bottom:4px;"><strong>VBASE (Tomlinson):</strong> <span style="color:#f472b6; font-weight:bold;">${d.vbase1_tomlinson_name || d.vbase1_name}</span></div>` : ''}
              ${d.imgt_name ? `<div style="margin-bottom:4px;"><strong>IMGT Symbol:</strong> <span style="color:#60a5fa; font-weight:bold;">${d.imgt_name}</span></div>` : ''}
              ${d.vbase2_id ? `<div style="margin-bottom:4px;"><strong>VBASE2 ID:</strong> <span style="color:#f59e0b; font-weight:bold;">${d.vbase2_id}</span></div>` : (crossrefVal ? `<div style="margin-bottom:4px;"><strong>Crossreference:</strong> <span style="color:#f59e0b; font-weight:bold;">${crossrefVal}</span></div>` : '')}
              ${(d.kabat_id || d.kabat_ids) ? `<div style="margin-bottom:4px;"><strong>Kabat ID:</strong> <span style="color:#c084fc; font-weight:bold;">${d.kabat_id || d.kabat_ids.split(';')[0].trim()}</span></div>` : ''}
              ${d.ebi_accessions ? `<div style="margin-bottom:4px;"><strong>EBI / EMBL:</strong> <span style="color:#34d399; font-weight:bold;">${d.ebi_accessions.length > 32 ? d.ebi_accessions.slice(0, 30) + '...' : d.ebi_accessions}</span></div>` : ''}
              ${d.clan ? `<div><strong>Evolutionary Clan:</strong> <span style="color:#34d399; font-weight:bold;">${d.clan}</span></div>` : ''}
              ${d.orthogroup ? `<div><strong>Orthogroup (≥75% Id):</strong> <span style="color:#a78bfa; font-weight:bold;">${d.orthogroup}</span></div>` : ''}
              <strong>Species:</strong> ${d.species === 'dogfish' ? '🦈 Dogshark (Spiny Dogfish)' : (d.species === 'dog' ? '🐕 Dog (Canine)' : d.species.toUpperCase())}<br>
              <strong>Chain Group:</strong> <span style="color:#e2e8f0; font-weight:600;">${d.chain_group || (d.species + " " + d.chain)}</span><br>
              <strong>V-Gene Family:</strong> <span style="color:#34d399; font-weight:bold;">${d.family || d.clan || '-'}</span><br>
              ${d.coincident_count && d.coincident_count > 1 ? `<div style="color:#f59e0b; font-size:11px; font-weight:600; margin-top:4px;">👥 Coincident Alleles: ${d.coincident_count} genes at this coordinate (click to compare)</div>` : ''}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px; color:#94a3b8;">
                <span>Mature Sequence:</span>
                <span style="color:#38bdf8; font-weight:600;">${singleSeq.length} aa</span>
              </div>
              <div style="font-family:monospace; margin-top:3px; background:#060a12; padding:6px; border-radius:4px; font-size:11px; word-break:break-all; border:1px solid #1e293b;">
                ${singleSeq}
              </div>
              <div style="font-size:10px; color:#64748b; margin-top:4px;">💡 Click to view • Shift-click to select multiple for IMGT alignment</div>
            `);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 15) + "px");
        })
        .on("mouseout", (event, d) => {
          const isSelected = selectedGeneIds.has(d.gene_id);
          const isFiltered = (currentMode === "hierarchical" || currentMode === "family")
            ? (selectedFilters.has(d.family) || selectedFilters.has(d.chain_group))
            : selectedFilters.has(d[currentMode]);
          const node = d3.select(event.currentTarget);

          if (isSelected) {
            node.attr("r", 8.5)
              .attr("stroke", "#38bdf8")
              .attr("stroke-width", 2.8)
              .attr("opacity", 1.0);
          } else if (selectedGeneIds.size > 0) {
            node.attr("r", isFiltered ? 5.0 : 2.5)
              .attr("stroke", isFiltered ? "#ffffff" : "none")
              .attr("stroke-width", isFiltered ? 1.2 : 0)
              .attr("opacity", isFiltered ? 0.35 : 0.12);
          } else if (selectedFilters.size > 0) {
            node.attr("r", isFiltered ? 6.0 : 2.0)
              .attr("stroke", isFiltered ? "#ffffff" : "none")
              .attr("stroke-width", isFiltered ? 1.8 : 0)
              .attr("opacity", isFiltered ? 1.0 : 0.04);
          } else {
            node.attr("r", 3.5)
              .attr("stroke", "#0d1117")
              .attr("stroke-width", 0.5)
              .attr("opacity", 0.85);
          }
          tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
          event.stopPropagation();
          const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;

          // If adding with shift while the table already displays sequences,
          // preserve those displayed sequences in selectedGeneIds so they are not wiped
          if (isMulti && selectedGeneIds.size === 0 && displayedGenes && displayedGenes.length > 0) {
            selectedGeneIds = new Set(displayedGenes.map(g => g.gene_id));
          }

          if (isMulti) {
            if (selectedGeneIds.has(d.gene_id)) {
              selectedGeneIds.delete(d.gene_id);
            } else {
              selectedGeneIds.add(d.gene_id);
              // Fly camera and beacon to newly added gene
              flyToGene(d.gene_id);
            }
          } else {
            selectedGeneIds.clear();
            selectedGeneIds.add(d.gene_id);
            flyToGene(d.gene_id);
          }
          updateCircleSelectionVisual();
          renderAlignmentView();
          openAlignmentDrawer();

          // Highlight the newly added or focused row in the alignment table
          document.querySelectorAll(".align-row").forEach(r => {
            if (r.dataset && r.dataset.geneId === d.gene_id) {
              r.classList.add("active-align-row");
              if (typeof r.scrollIntoView === "function") {
                r.scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            } else if (!isMulti) {
              r.classList.remove("active-align-row");
            }
          });
        });

      const urlParams = new URLSearchParams(window.location.search);
      const urlColorMode = urlParams.get("color") || urlParams.get("mode");
      if (urlColorMode && document.getElementById("colorSelect")) {
        const optionExists = Array.from(document.getElementById("colorSelect").options).some(o => o.value === urlColorMode);
        if (optionExists) {
          document.getElementById("colorSelect").value = urlColorMode;
        }
      }

      const initialMode = (document.getElementById("colorSelect") && document.getElementById("colorSelect").value) || "hierarchical";
      currentMode = initialMode;
      circles.attr("fill", d => getColor(d, initialMode));
      updateLegend(initialMode);

      d3.select("#colorSelect").on("change", function() {
        const mode = this.value;
        currentMode = mode;
        selectedFilters.clear();
        selectedGeneIds.clear();
        updateCircleSelectionVisual();
        banner.style("display", "none");
        circles.each(function(d) {
          this.setAttribute("fill", getColor(d, mode));
          this.setAttribute("opacity", "0.85");
          this.setAttribute("r", "3.5");
          this.setAttribute("stroke", "#0d1117");
          this.setAttribute("stroke-width", "0.5");
        });
        updateLegend(mode);
      });

      // =========================================================================
      // Species Quick-Filter Handler (TCRbase / Vertebrate Universe Focus Mode)
      // =========================================================================
      d3.select("#speciesFilterSelect").on("change", function() {
        const sp = this.value;
        if (!sp || sp === "all") {
          selectedFilters.clear();
          selectedGeneIds.clear();
          updateCircleSelectionVisual();
          banner.style("display", "none");
          updateHighlights();
          resetMapView();
          if (document.getElementById("kpiGenes") && window.DATASET_FILE === "tcrbase_pacmap_data.json") {
            document.getElementById("kpiGenes").innerText = "3,114";
            document.getElementById("kpiSpecies").innerText = "31";
            document.getElementById("kpiLoci").innerText = "4 Loci";
          }
          return;
        }

        const matched = globalData.filter(d => d.species && d.species.toLowerCase() === sp.toLowerCase());
        if (matched.length === 0) return;

        // Highlight matched species circles and dim non-matching
        selectedGeneIds = new Set(matched.map(m => m.gene_id));
        updateCircleSelectionVisual();

        // Compute 2D bounding box and fly camera to frame the species cluster smoothly
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        matched.forEach(d => {
          if (d.x < minX) minX = d.x;
          if (d.x > maxX) maxX = d.x;
          if (d.y < minY) minY = d.y;
          if (d.y > maxY) maxY = d.y;
        });

        const currentWidth = window.innerWidth || width;
        const currentHeight = window.innerHeight || height;
        const spanX = Math.max(maxX - minX, 1.5);
        const spanY = Math.max(maxY - minY, 1.5);
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        const fitScale = Math.min(Math.max(Math.min((currentWidth * 0.55) / spanX, (currentHeight * 0.55) / spanY), 1.2), 7.0);

        svg.transition()
          .duration(950)
          .ease(d3.easeCubicOut)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(currentWidth / 2 - midX * fitScale, (currentHeight / 2) - midY * fitScale).scale(fitScale)
          );

        // Update KPIs for the isolated species
        const spName = matched[0].organism || matched[0].species;
        const uniqueLoci = Array.from(new Set(matched.map(m => m.locus || m.chain))).join(", ");
        if (document.getElementById("kpiGenes")) {
          document.getElementById("kpiGenes").innerText = matched.length.toLocaleString();
          document.getElementById("kpiSpecies").innerText = spName;
          document.getElementById("kpiLoci").innerText = uniqueLoci || "TRA, TRB, TRG, TRD";
        }

        // Display banner with direct link to species analyzer or table
        const hasAnalyzer = (sp === "human" || sp === "mouse");
        const analyzerLink = sp === "human" ? "human_tcr_analyzer.html" : (sp === "mouse" ? "mouse_tcr_analyzer.html" : null);

        banner.style("display", "block").html(`
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
            <div>✨ <strong>${spName.toUpperCase()} TCR Repertoire:</strong> <strong>${matched.length.toLocaleString()}</strong> genes isolated (${uniqueLoci})</div>
            <div style="display:flex; gap:6px; align-items:center;">
              ${analyzerLink ? `<a href="${analyzerLink}" class="drawer-action-btn" style="background:#064e3b; color:#34d399; border-color:#059669; text-decoration:none;">🔬 Open ${sp === 'human' ? 'Human' : 'Mouse'} TCR Analyzer ↗</a>` : ''}
              <button id="btnViewSpeciesAlign" class="drawer-action-btn" style="background:#1e3a5f; color:#38bdf8; border-color:#38bdf8;">🧬 View Sequence Alignment (${matched.length})</button>
            </div>
          </div>
        `);

        d3.select("#btnViewSpeciesAlign").on("click", () => {
          renderAlignmentView(matched);
          openAlignmentDrawer();
        });
      });

      // =========================================================================
      // Constellation of Landmark Discovery Stars & Easter Eggs
      // =========================================================================
      const LANDMARK_EASTER_EGGS = {
        v186: {
          key: "v186",
          name: "V186.2 (B1-8 Anti-NP)",
          find: d => d.gene_id === 'IGHV0-7J6E*00' || (d.gene_name && d.gene_name.includes('V186.2')) || (d.legacy_name && d.legacy_name.includes('V186.2')) || (d.gene_id && d.gene_id.includes('7J6E')),
          color: "#fbbf24",
          starColor: "#f59e0b",
          title: "🌟 Landmark Star: V186.2 (Michael Reth & Klaus Rajewsky)",
          subtitle: "Mus musculus • IGHV0-7J6E*00 • IGHV1-72*01 • musIGHV057 • Clan I (J558)",
          description: "The foundational active heavy-chain variable domain of the <strong>B1-8 Anti-NP hybridoma</strong>, generated by <strong>Michael Reth</strong> in the laboratory of <strong>Klaus Rajewsky</strong> (<em>1978, Eur. J. Immunol.</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/97089/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">97089 ↗</a>) and cloned & sequenced by <strong>Alfred Bothwell</strong> (<em>1981, Cell</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/6788376/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">6788376 ↗</a>).",
          discoveries: [
            "<strong>Proof of Somatic Hypermutation</strong>: First definitive proof that somatic mutation diversifies mammalian antibody repertoires during immune responses.",
            "<strong>Trp33Leu (W33L) Affinity Maturation</strong>: Single point mutation in CDR1 confers ~10-fold affinity gain for 4-hydroxy-3-nitrophenylacetyl (NP).",
            "<strong>B1-8i Site-Directed Knock-in Mice</strong>: Created by Sonoda, Rajewsky et al. (<em>1997, Immunity</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/9075923/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">9075923 ↗</a>), enabling decades of live B-cell tracking, two-photon intravital imaging, and germinal center clonal selection dynamics."
          ]
        },
        wabl: {
          key: "wabl",
          name: "17.2.25 QM Mouse (Matthias Wabl & Marilia Cascalho)",
          find: d => (d.species === 'mouse' && (d.gene_id === 'IGHV0-COUF*00' || (d.family && d.family.includes('SM7')) || (d.legacy_name && d.legacy_name.includes('17.2.25')))),
          color: "#f472b6",
          starColor: "#db2777",
          title: "🌟 Landmark Star: 17.2.25 QM Mouse (Matthias Wabl & Marilia Cascalho)",
          subtitle: "Mus musculus • Mouse VH14 (SM7) • BALB/c a-NP Clone",
          description: "The foundational active heavy-chain variable domain of the <strong>BALB/c 17.2.25 Anti-NP hybridoma</strong>, cloned by <strong>Dennis Y. Loh, Alfred Bothwell, Thereza Imanishi-Kari, and David Baltimore</strong> (<em>1983, Cell</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/6432337/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">6432337 ↗</a>; GenBank K00608.1), and engineered by <strong>Marilia Cascalho & Matthias Wabl</strong> into the landmark <strong>Quasimonoclonal (QM) Mouse</strong> (<em>1996, Science</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/8658139/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">8658141 ↗</a>).",
          discoveries: [
            "<strong>The Quasimonoclonal (QM) Mouse</strong>: Knocking the rearranged 17.2.25 V(D)J into the J_H locus of kappa-deficient mice created a monospecific primary B-cell repertoire specific for NP.",
            "<strong>VH Gene Replacement (Receptor Revision)</strong>: Proved that peripheral B cells can replace their rearranged heavy chain with upstream germline V-genes to escape autoreactivity or broaden the repertoire.",
            "<strong>DNA Mismatch Repair in SHM</strong>: QM mice uncovered the essential role of the Pms2 mismatch repair pathway in targeting somatic hypermutation during germinal center selection."
          ]
        },
        winter: {
          key: "winter",
          name: "DP-47 (Sir Greg Winter & Ian Tomlinson)",
          find: d => d.gene_id === 'humIGHV200187_02' || (d.gene_name && d.gene_name.includes('IGHV3-23*01')) || (d.legacy_name && d.legacy_name.includes('DP-47')),
          color: "#38bdf8",
          starColor: "#0284c7",
          title: "🌟 Landmark Star: DP-47 (Sir Greg Winter & Ian Tomlinson)",
          subtitle: "Homo sapiens • humIGHV200187_02 • IGHV3-23*01 • DP-47 • Clan III (VH3)",
          description: "The universal synthetic therapeutic workhorse developed by <strong>Sir Greg Winter</strong> and <strong>Ian Tomlinson</strong> at the MRC Centre for Protein Engineering (CPE) in Cambridge. Anchored the historic <strong>VBASE</strong> directory (<em>Tomlinson et al., 1992/1996</em>; PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/1404389/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">1404389 ↗</a>).",
          discoveries: [
            "<strong>Phage Display Revolution</strong>: Master synthetic framework for human antibody libraries, bypassing immunization to isolate high-affinity therapeutics.",
            "<strong>Blockbuster Therapeutics</strong>: Serves as the germline framework for Adalimumab (Humira, anti-TNFα) and countless clinical biologics.",
            "<strong>Exceptional Stability & Expression</strong>: High thermodynamic stability, robust bacterial expression, and canonical pairing fidelity."
          ]
        },
        dupasquier: {
          key: "dupasquier",
          name: "Xen-IGHVH1-01 (Louis Du Pasquier & Ellen Hsu)",
          find: d => d.species === 'xenopus' && (d.gene_id === 'XENIGHV300001' || (d.family && d.family.includes('Clan III'))),
          color: "#34d399",
          starColor: "#059669",
          title: "🌟 Landmark Star: Xen-IGHVH1-01 (Louis Du Pasquier & Ellen Hsu)",
          subtitle: "Xenopus laevis • Amphibian VH1 • Allotetraploid S-Chromosome Homeolog",
          description: "Championed by <strong>Louis Du Pasquier</strong> and <strong>Ellen Hsu</strong> at the Basel Institute for Immunology, elucidating the evolutionary origin of the adaptive immune system across 500 million years of jawed vertebrates (<em>Annu. Rev. Immunol. 1989</em>; PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/2653371/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">2653372 ↗</a>).",
          discoveries: [
            "<strong>Pan-Vertebrate Phylogeny</strong>: Established the comparative immunogenomics of amphibians, reptiles, and cartilaginous fish, bridging cold-blooded and mammalian immunity.",
            "<strong>Allotetraploid Polyploidy</strong>: Demonstrated how whole-genome duplication in <em>Xenopus laevis</em> produced Long (L) and Short (S) chromosome homeologs with distinct selection pressures.",
            "<strong>Origins of Adaptive Isotypes</strong>: Revealed ancestral evolution of IgM, IgX, and IgY prior to mammalian IgG/IgE divergence."
          ]
        },
        milstein: {
          key: "milstein",
          name: "MOPC-21 Lineage (Georges Köhler & César Milstein)",
          find: d => d.species === 'mouse' && (d.gene_id === 'IGHV0-37IE*00' || (d.family && d.family.includes('X24'))),
          color: "#f43f5e",
          starColor: "#e11d48",
          title: "🌟 Landmark Star: MOPC-21 Lineage (Georges Köhler & César Milstein)",
          subtitle: "Mus musculus • Mouse VH4 (X24) • P3K / P3-X63-Ag8 Myeloma Lineage",
          description: "Honoring the epochal 1975 Nobel Prize discovery by <strong>Georges Köhler</strong> and <strong>César Milstein</strong> at the MRC Laboratory of Molecular Biology (LMB) in Cambridge (<em>Nature 1975</em>; DOI: <a href=\"https://doi.org/10.1038/256495a0\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">10.1038/256495a0 ↗</a>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/1172191/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">1172191 ↗</a>).",
          discoveries: [
            "<strong>The Invention of Hybridomas</strong>: Fusing antigen-primed B cells with the MOPC-21-derived P3K myeloma line produced the first immortal monoclonal antibody secretors.",
            "<strong>The Monoclonal Revolution</strong>: Transformed biology and medicine from variable polyclonal sera to reproducible, targeted therapies and diagnostic assays.",
            "<strong>Standard Balb/c Reference</strong>: The MOPC-21 variable sequence remains a primary reference for murine VH4 / X24 gene rearrangement studies."
          ]
        },
        kabat: {
          key: "kabat",
          name: "Bence Jones VκI (Kabat, Wu & Hilschmann)",
          find: d => d.species === 'human' && (d.gene_id === 'humIGKV200094' || (d.gene_name && d.gene_name.includes('IGKV1-12'))),
          color: "#a855f7",
          starColor: "#9333ea",
          title: "🌟 Landmark Star: Bence Jones VκI (Kabat, Wu & Hilschmann)",
          subtitle: "Homo sapiens • humIGKV200094 • IGKV1-12*01 • Kabat Kappa Subgroup I Prototype",
          description: "Sequenced by <strong>Norbert Hilschmann & Lyman Craig (1965)</strong> and analyzed in the historic 1970 study by <strong>Elvin A. Kabat & Tai Te Wu</strong> (<em>J. Exp. Med. 1970</em>, PMID: <a href=\"https://pubmed.ncbi.nlm.nih.gov/5508247/\" target=\"_blank\" style=\"color:#38bdf8; text-decoration:underline;\">5508247 ↗</a>).",
          discoveries: [
            "<strong>Discovery of CDRs</strong>: By aligning urinary Bence Jones light chains ('Roy', 'Ag', 'Cum'), Kabat and Wu discovered the Hypervariable Regions that form the antigen-binding paratope.",
            "<strong>The Kabat Numbering Standard</strong>: Founded the first systematic sequence numbering system for immunological proteins, creating the foundation for computational immunogenetics.",
            "<strong>Variable vs. Constant Domains</strong>: Provided definitive chemical proof of the two-domain structure of antibody light chains."
          ]
        },
        lysozyme: {
          key: "lysozyme",
          name: "The Anti-Lysozyme Enigma",
          find: d => d.species === 'human' && (d.gene_id === 'humIGHV200187_02' || (d.gene_name && d.gene_name.includes('IGHV3-23'))),
          color: "#22d3ee",
          starColor: "#0891b2",
          title: "✨ Landmark Enigma: The First Human Anti-Lysozyme",
          subtitle: "The Unmapped Germline Mystery • Recombinant Repertoire Origin",
          description: "Hen egg-white lysozyme (HEL) served as the primary model antigen for the very first atomic antibody-antigen crystal structures (e.g. D1.3) and early human phage-display selections (Winter, Griffiths, Marks).",
          discoveries: [
            "<strong>The Unmapped Germline Mystery</strong>: While D1.3 was murine and early human scFv selections bound lysozyme with nanomolar affinity, its exact physiological donor germline gene remained an unsolved historical puzzle.",
            "<strong>Why VBASE3 Exists</strong>: Exemplifies why complete, physiologically confirmed germline catalogs (Class I) with SIMD alignment are needed to unmask orphan and synthetic antibodies.",
            "<strong>Structural Crystallography</strong>: The lysozyme-antibody interface established the thermodynamic and stereochemical rules of antigen recognition."
          ]
        }
      };

      function detectEasterEgg(q) {
        if (!q) return null;
        q = q.toLowerCase();
        if (q.includes("186.2") || q === "v186" || q === "b1-8" || q === "b186" || q.includes("b1-8i") || q.includes("sonoda") || q === "reth" || q === "rajewsky" || q === "musighv057") return LANDMARK_EASTER_EGGS.v186;
        if (q.includes("17.2.25") || q === "17225" || q === "wabl" || q === "cascalho" || q === "qm" || q.includes("quasimonoclonal") || q.includes("quasi-monoclonal") || q === "k00608" || q === "musighv125") return LANDMARK_EASTER_EGGS.wabl;
        if (q.includes("dp-47") || q.includes("dp47") || q.includes("winter") || q.includes("tomlinson") || q.includes("vbase1") || q.includes("ighv3-23")) return LANDMARK_EASTER_EGGS.winter;
        if (q.includes("pasquier") || q.includes("du pasquier") || q.includes("ellen hsu") || q.includes("hsu") || q.includes("xenopus") || q.includes("xen-ighvh1")) return LANDMARK_EASTER_EGGS.dupasquier;
        if (q.includes("milstein") || q.includes("kohler") || q.includes("köhler") || q.includes("mopc-21") || q.includes("mopc21") || q.includes("mopc") || q.includes("hybridoma")) return LANDMARK_EASTER_EGGS.milstein;
        if (q.includes("kabat") || q.includes("wu") || q.includes("bence jones") || q.includes("bence-jones") || q.includes("bence") || q.includes("hilschmann") || q.includes("roy")) return LANDMARK_EASTER_EGGS.kabat;
        if (q.includes("lysozyme") || q.includes("anti-lysozyme") || q.includes("d1.3")) return LANDMARK_EASTER_EGGS.lysozyme;
        return null;
      }

      function igniteLandmarkStar(eggOrKey, cinematic = true) {
        const egg = (typeof eggOrKey === 'string') ? LANDMARK_EASTER_EGGS[eggOrKey] : eggOrKey;
        if (!egg) return;

        const targetGene = globalData.find(egg.find);
        if (!targetGene) {
          console.warn(`Landmark gene for ${egg.name} not found in universe dataset`);
          return;
        }

        // Close landmarks dropdown if open
        const dd = document.getElementById("landmarksDropdown");
        if (dd) dd.style.display = "none";

        // Highlight the selected item in the dropdown
        document.querySelectorAll(".landmark-item").forEach(item => {
          const isCur = item.getAttribute("onclick") && item.getAttribute("onclick").includes(`'${egg.key}'`);
          if (isCur) {
            item.style.background = "rgba(56, 189, 248, 0.25)";
            item.style.outline = "1px solid rgba(56, 189, 248, 0.5)";
          } else {
            item.style.background = "transparent";
            item.style.outline = "none";
          }
        });

        // Reflect current selection in the search bar
        const searchInput = document.getElementById("geneSearch");
        if (searchInput) searchInput.value = egg.name;

        // Switch selection to this landmark exclusively
        selectedGeneIds = new Set([targetGene.gene_id]);

        const targetX = targetGene.x;
        const targetY = targetGene.y;
        const scale = 5.5;

        // Center camera comfortably on the landmark star (offset slightly left to balance side panels)
        const screenW = window.innerWidth || width;
        const screenH = window.innerHeight || height;
        const centerX = screenW > 1200 ? (screenW - 200) / 2 : screenW / 2;
        const centerY = screenH / 2;

        // Responsive Pan & Zoom toward landmark star (matching Query Inspector)
        if (cinematic) {
          svg.transition()
            .duration(1100)
            .ease(d3.easeCubicOut)
            .call(
              zoom.transform,
              d3.zoomIdentity.translate(centerX - targetX * scale, centerY - targetY * scale).scale(scale)
            );
        }

        // Clear previous beacons completely
        beaconG.selectAll("*").remove();

        // 1. Primary high-visibility pulsing radar wave (landmark-themed color)
        beaconG.append("circle")
          .attr("cx", targetX)
          .attr("cy", targetY)
          .attr("class", "sonar-beacon landmark-beacon")
          .style("stroke", egg.color);

        // 2. Secondary wide expanding echo wave
        beaconG.append("circle")
          .attr("cx", targetX)
          .attr("cy", targetY)
          .attr("class", "sonar-beacon-secondary landmark-beacon")
          .style("stroke", egg.starColor || egg.color);

        // 3. Glowing stellar center core
        beaconG.append("circle")
          .attr("cx", targetX)
          .attr("cy", targetY)
          .attr("r", 5.5)
          .attr("class", "sonar-beacon-inner landmark-beacon")
          .style("fill", egg.color)
          .style("stroke", "#ffffff");

        // Cleanly reset ALL circles to standard attributes and highlight ONLY the active landmark
        circles.each(function(d) {
          const isMatch = (d.gene_id === targetGene.gene_id);
          if (isMatch) {
            d3.select(this).raise();
            this.setAttribute("r", "10.0");
            this.setAttribute("stroke", "#ffffff");
            this.setAttribute("stroke-width", "3.2");
            this.setAttribute("fill", egg.color);
            this.setAttribute("opacity", "1.0");
          } else {
            this.setAttribute("fill", getColor(d, currentMode));
            this.setAttribute("r", "3.0");
            this.setAttribute("stroke", "#0d1117");
            this.setAttribute("stroke-width", "0.5");
            this.setAttribute("opacity", "0.35");
          }
        });

        // Update Control Panel Banner
        if (banner) {
          banner.style("display", "block").html(`
            🌟 <strong>Landmark Star:</strong> <strong>${egg.name}</strong> (${targetGene.gene_id} • ${targetGene.species.toUpperCase()} • ${targetGene.family || targetGene.chain})<br>
            <span style="font-size:11px; color:${egg.color}; font-weight:600;">📍 Manifold Coordinates: (x: ${targetGene.x.toFixed(2)}, y: ${targetGene.y.toFixed(2)}) • ${targetGene.clan || 'Ancestral Clan'}</span>
          `);
        }

        // If the alignment drawer is currently open, dynamically update it to show the new landmark
        const drawer = document.getElementById("alignmentDrawer");
        if (drawer && !drawer.classList.contains("collapsed")) {
          renderAlignmentView([targetGene]);
        }

        // Synchronize with Query Inspector if open
        const insp = document.getElementById("inspectorPanel");
        if (insp && !insp.classList.contains("collapsed")) {
          const seq = (targetGene.mature_seq || targetGene.ungapped_seq || targetGene.sequence || targetGene.aa_seq || "");
          const ta = document.getElementById("seqTextarea");
          if (ta && seq) {
            ta.value = seq;
          }
        }

        // 4. Render Landmark Star Tribute Card
        d3.select("#stellarTributeCard").remove();
        const discoveriesHtml = egg.discoveries.map(disc => `<li>${disc}</li>`).join("");

        d3.select("body").append("div")
          .attr("id", "stellarTributeCard")
          .attr("class", "stellar-tribute-card")
          .style("border-color", egg.color)
          .style("box-shadow", `0 20px 45px rgba(0,0,0,0.85), 0 0 30px ${egg.color}40`)
          .html(`
            <div class="stellar-tribute-header" style="border-bottom-color: ${egg.color}40;">
              <div class="stellar-tribute-title" style="color:${egg.color}; text-shadow: 0 0 12px ${egg.color}80;">
                <span>${egg.title}</span>
              </div>
              <button id="closeStellarCardBtn" style="background:transparent; border:none; color:${egg.color}; font-size:16px; cursor:pointer;" title="Close Card">✕</button>
            </div>
            <div style="font-size:11.5px; color:${egg.color}; font-weight:700; margin-bottom:6px;">
              ${egg.subtitle}
            </div>
            <div style="margin-bottom:10px; color:#cbd5e1;">
              ${egg.description}
            </div>
            <div style="background:${egg.color}15; border-left:3px solid ${egg.color}; padding:8px 10px; border-radius:4px; margin-bottom:10px;">
              <div style="color:${egg.color}; font-weight:700; font-size:11px; margin-bottom:2px;">HISTORICAL MILESTONE & SIGNIFICANCE:</div>
              <ul style="margin:0; padding-left:14px; font-size:11px; color:#e2e8f0;">
                ${discoveriesHtml}
              </ul>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
              <button id="btnLoadLandmarkAlign" style="flex:1; padding:6px 10px; background:#1e293b; border:1px solid ${egg.color}; color:${egg.color}; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">🧬 View Sequence</button>
              <button id="btnInspectLandmark" style="flex:1; padding:6px 10px; background:linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.3)); border:1px solid #38bdf8; color:#38bdf8; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">🔬 Query Inspector</button>
              <button id="btnResetStarView" style="padding:6px 10px; background:#0f172a; border:1px solid #475569; color:#94a3b8; border-radius:6px; font-size:11px; cursor:pointer;">Show Full Universe</button>
            </div>
          `);

        d3.select("#closeStellarCardBtn").on("click", () => {
          d3.select("#stellarTributeCard").remove();
          beaconG.selectAll("*").remove();
          selectedGeneIds.clear();
          if (banner) banner.style("display", "none");
          const sIn = document.getElementById("geneSearch");
          if (sIn && sIn.value === egg.name) sIn.value = "";
          document.querySelectorAll(".landmark-item").forEach(item => {
            item.style.background = "transparent";
            item.style.outline = "none";
          });
          updateCircleSelectionVisual();
        });

        d3.select("#btnResetStarView").on("click", () => {
          d3.select("#stellarTributeCard").remove();
          beaconG.selectAll("*").remove();
          selectedGeneIds.clear();
          if (banner) banner.style("display", "none");
          const sIn = document.getElementById("geneSearch");
          if (sIn) sIn.value = "";
          document.querySelectorAll(".landmark-item").forEach(item => {
            item.style.background = "transparent";
            item.style.outline = "none";
          });
          resetMapView();
          updateHighlights();
          updateCircleSelectionVisual();
        });

        d3.select("#btnLoadLandmarkAlign").on("click", () => {
          selectedGeneIds = new Set([targetGene.gene_id]);
          updateCircleSelectionVisual();
          renderAlignmentView([targetGene]);
          openAlignmentDrawer();
        });

        d3.select("#btnInspectLandmark").on("click", () => {
          const seq = (targetGene.mature_seq || targetGene.ungapped_seq || targetGene.sequence || targetGene.aa_seq || "");
          const ta = document.getElementById("seqTextarea");
          if (ta && seq) {
            ta.value = seq;
          }
          const insp = document.getElementById("inspectorPanel");
          if (insp) insp.classList.remove("collapsed");
          runUniversalAnalysisAndProjection();
        });
      }

      function igniteV186Star(cinematic = true) {
        igniteLandmarkStar(LANDMARK_EASTER_EGGS.v186, cinematic);
      }

      window.LANDMARK_EASTER_EGGS = LANDMARK_EASTER_EGGS;
      window.igniteLandmarkStar = igniteLandmarkStar;
      window.igniteV186Star = igniteV186Star;

      // Close landmarks dropdown when clicking anywhere outside
      window.addEventListener("click", function(e) {
        const dd = document.getElementById("landmarksDropdown");
        const btn = document.getElementById("btnLandmarksMenu");
        if (dd && dd.style.display === "block") {
          if (!dd.contains(e.target) && (!btn || !btn.contains(e.target))) {
            dd.style.display = "none";
          }
        }
      });

      // Button listener for Star of V186.2
      d3.select("#btnLocateV186").on("click", function() {
        igniteLandmarkStar(LANDMARK_EASTER_EGGS.v186, true);
      });

      // Direct Gene Search & Easter Egg Detection (Debounced for fluid typing)
      let searchDebounceTimer = null;
      d3.select("#geneSearch").on("input", function() {
        const q = this.value.trim().toLowerCase();
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          executeUniverseSearch(q);
        }, 75);
      });

      function executeUniverseSearch(q) {
        if (!q) {
          d3.select("#stellarTributeCard").remove();
          if (beaconG.select(".landmark-beacon").node() || beaconG.select(".stellar-core").node()) {
            beaconG.selectAll("*").remove();
          }
          if (banner) banner.style("display", "none");
          updateHighlights();
          return;
        }

        const egg = detectEasterEgg(q);
        if (egg) {
          igniteLandmarkStar(egg, true);
        } else {
          d3.select("#stellarTributeCard").remove();
          if (beaconG.select(".landmark-beacon").node() || beaconG.select(".stellar-core").node()) {
            beaconG.selectAll("*").remove();
          }
        }

        let matchCount = 0;
        circles.each(function(d) {
          const match = (d.systematic_id && d.systematic_id.toLowerCase().includes(q)) ||
                        (d.legacy_name && d.legacy_name.toLowerCase().includes(q)) ||
                        (d.vbase1_tomlinson_name && d.vbase1_tomlinson_name.toLowerCase().includes(q)) ||
                        (d.vbase1_name && d.vbase1_name.toLowerCase().includes(q)) ||
                        d.gene_id.toLowerCase().includes(q) ||
                        (d.gene_name && d.gene_name.toLowerCase().includes(q)) ||
                        (d.imgt_name && d.imgt_name.toLowerCase().includes(q)) ||
                        (d.vbase2_id && d.vbase2_id.toLowerCase().includes(q)) ||
                        (d.kabat_id && d.kabat_id.toLowerCase().includes(q)) ||
                        (d.kabat_ids && d.kabat_ids.toLowerCase().includes(q)) ||
                        (d.ebi_accessions && d.ebi_accessions.toLowerCase().includes(q)) ||
                        d.species.toLowerCase().includes(q) ||
                        (d.family && d.family.toLowerCase().includes(q)) ||
                        (d.clan && d.clan.toLowerCase().includes(q)) ||
                        (d.orthogroup && d.orthogroup.toLowerCase().includes(q));
          if (match) matchCount++;
          if (match) {
            this.setAttribute("opacity", "1.0");
            this.setAttribute("r", "7.0");
            this.setAttribute("stroke", "#ffffff");
            this.setAttribute("stroke-width", "2.0");
          } else {
            this.setAttribute("opacity", "0.05");
            this.setAttribute("r", "2.0");
            this.setAttribute("stroke", "none");
          }
        });
        banner.style("display", "block").html(`
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
            <div>🔍 Found <strong>${matchCount.toLocaleString()}</strong> matching genes for "<strong>${q}</strong>"</div>
            <button id="btnViewSearchAlign" class="drawer-action-btn" style="background:#1e3a5f; color:#38bdf8; border-color:#38bdf8;">🧬 View Sequence Alignment (${matchCount})</button>
          </div>
        `);
        d3.select("#btnViewSearchAlign").on("click", () => {
          const matched = globalData.filter(d => (
            (d.systematic_id && d.systematic_id.toLowerCase().includes(q)) ||
            (d.legacy_name && d.legacy_name.toLowerCase().includes(q)) ||
            (d.vbase1_tomlinson_name && d.vbase1_tomlinson_name.toLowerCase().includes(q)) ||
            (d.vbase1_name && d.vbase1_name.toLowerCase().includes(q)) ||
            d.gene_id.toLowerCase().includes(q) ||
            (d.gene_name && d.gene_name.toLowerCase().includes(q)) ||
            (d.imgt_name && d.imgt_name.toLowerCase().includes(q)) ||
            (d.vbase2_id && d.vbase2_id.toLowerCase().includes(q)) ||
            (d.kabat_id && d.kabat_id.toLowerCase().includes(q)) ||
            (d.kabat_ids && d.kabat_ids.toLowerCase().includes(q)) ||
            (d.ebi_accessions && d.ebi_accessions.toLowerCase().includes(q)) ||
            d.species.toLowerCase().includes(q) ||
            (d.family && d.family.toLowerCase().includes(q)) ||
            (d.clan && d.clan.toLowerCase().includes(q)) ||
            (d.orthogroup && d.orthogroup.toLowerCase().includes(q))
          ));
          selectedGeneIds = new Set(matched.map(m => m.gene_id));
          updateCircleSelectionVisual();
          renderAlignmentView(matched);
          openAlignmentDrawer();
        });
      }

      // =========================================================================
      // Evolutionary Timeline & Emergence Movie Controller
      // =========================================================================
      const SPECIES_EVO_MYA = {
        // Chondrichthyes (Ordovician / Silurian ~465 Mya)
        "shark": 465, "dogfish": 465, "dogshark": 465, "elephantshark": 465,
        // Osteichthyes & Sarcopterygii (Devonian ~430-415 Mya)
        "gar": 430, "catfish": 430, "cod": 430, "salmon": 430, "trout": 430, "zebrafish": 430, "coelacanth": 415,
        // Amphibia (Carboniferous ~352 Mya)
        "xenopus": 352, "axolotl": 350,
        // Sauropsida - Reptilia & Aves (Pennsylvanian ~319 Mya divergence from synapsid stem)
        "chicken": 319, "duck": 319, "zebrafinch": 319, "turtle": 319, "alligator": 319, "anole": 319,
        // Mammalia - Monotremata (Jurassic ~180 Mya)
        "platypus": 180,
        // Mammalia - Metatheria / Marsupialia (Jurassic ~160 Mya)
        "opossum": 160, "tasmaniandevil": 160,
        // Eutheria - Afrotheria (Early Cretaceous ~105 Mya)
        "elephant": 105,
        // Boreoeutheria - Laurasiatheria (Late Cretaceous ~85-82 Mya)
        "hedgehog": 85, "bat": 85, "cat": 85, "dog": 85, "ferret": 85, "horse": 82,
        // Cetartiodactyla & Camelidae (Early Paleogene ~66-55 Mya)
        "alpaca": 66, "camel": 66, "llama": 66,
        "pig": 65, "cow": 62, "sheep": 62, "goat": 62, "buffalo": 62, "dolphin": 55, "orca": 55,
        // Euarchontoglires - Glires: Rodentia & Lagomorpha (Stem divergence ~82-75 Mya)
        "rabbit": 82, "guineapig": 75, "nakedmolerat": 75, "mouse": 75, "rat": 75, "hamster": 75,
        // Euarchontoglires - Primates (Eocene/Oligocene ~43-29 Mya)
        "marmoset": 43, "baboon": 29, "cynomolgus": 29, "rhesus": 29,
        // Hominoidea & Hominidae (Miocene ~20-6.5 Mya)
        "gibbon": 20, "orangutan": 15, "gorilla": 9, "chimpanzee": 6.5,
        // Modern Homo sapiens
        "human": 0
      };

      function getEpochDescription(mya) {
        if (mya >= 450) {
          return {
            badge: "🦈 Chondrichthyes Origin",
            name: "Ordovician / Silurian (~465 Mya)",
            desc: "Origin of Adaptive Immunity & RAG Recombination: Cartilaginous Fish (Nurse Shark VNAR, Dogshark / Spiny Dogfish, Elephant Shark)"
          };
        } else if (mya >= 380) {
          return {
            badge: "🐟 Osteichthyes Radiation",
            name: "Devonian (~430–415 Mya)",
            desc: "Bony Fish (Osteichthyes) Radiation: Teleostei IgM, IgD, and mucosal IgZ/IgT lineages (Zebrafish, Salmon, Trout, Cod, Coelacanth)"
          };
        } else if (mya >= 330) {
          return {
            badge: "🐸 Amphibian Lineage",
            name: "Carboniferous (~352 Mya)",
            desc: "Tetrapod Water-to-Land Transition: Amphibia IgY, ancient Light-Rho & Light-Sigma (Xenopus, Axolotl)"
          };
        } else if (mya >= 200) {
          return {
            badge: "🦆 Sauropsida / Aves",
            name: "Permian / Triassic (~319 Mya)",
            desc: "Amniote Sauropsid Diversification: Avian & Reptilian IgY & combinatorial gene conversion dominance (Chicken, Duck, Turtle, Anole)"
          };
        } else if (mya >= 140) {
          return {
            badge: "🦔 Early Mammalia",
            name: "Jurassic (~180–160 Mya)",
            desc: "Mammalian Dawn: Monotremes (Platypus) & Marsupials (Opossum, Tasmanian Devil) emerging with true IgG/IgA isotypes"
          };
        } else if (mya >= 80) {
          return {
            badge: "🐎 Placental Radiation",
            name: "Cretaceous (~105–82 Mya)",
            desc: "Placental Mammalian Radiation: Afrotheria (Elephant), Carnivora (Dog, Cat, Ferret), Perissodactyla (Horse), Lagomorpha (Rabbit)"
          };
        } else if (mya >= 50) {
          return {
            badge: "🦙 Camelid & Ungulate Radiation",
            name: "Late Cretaceous / Paleogene (~75–55 Mya)",
            desc: "Rodentia Expansion (Mouse, Rat) & Artiodactyla Divergence (Cow, Pig, Sheep), Camelidae VHH Nanobodies (Alpaca, Camel)"
          };
        } else if (mya >= 25) {
          return {
            badge: "🐒 Simian Primates",
            name: "Eocene / Oligocene (~43–29 Mya)",
            desc: "Simian Radiation: New World Monkeys (Marmoset) & Old World Cercopithecidae (Baboon, Cynomolgus, Rhesus)"
          };
        } else if (mya >= 5) {
          return {
            badge: "🦍 Hominoidea & Great Apes",
            name: "Miocene (~20–6.5 Mya)",
            desc: "Great Ape Specialization: Lesser Apes (Gibbon) and Hominidae (Gorilla, Chimpanzee)"
          };
        } else {
          return {
            badge: "👤 Modern Vertebrates & Humans",
            name: "Pleistocene to Present (0 Mya)",
            desc: "Complete Modern Vertebrate Universe: All 55 species & Homo sapiens Class I functional antibody repertoire"
          };
        }
      }

      let evoTimer = null;
      let isEvoPlaying = false;

      const evoSlider = document.getElementById("evoSlider");
      if (evoSlider) {
        function applyEvolutionFilter(myaThreshold) {
          const epoch = getEpochDescription(myaThreshold);
          const ageTag = document.getElementById("evoCurrentAgeTag");
          const epochBadge = document.getElementById("evoEpochBadge");
          const epochDesc = document.getElementById("evoEpochDesc");
          const countBadge = document.getElementById("evoCountBadge");
          if (ageTag) ageTag.innerText = myaThreshold === 0 ? "Present (0 Mya)" : `~${myaThreshold} Mya`;
          if (epochBadge) epochBadge.innerText = epoch.badge;
          if (epochDesc) epochDesc.innerText = `${epoch.name}: ${epoch.desc}`;

          let visibleCount = 0;
          circles.each(function(d) {
            const spMya = SPECIES_EVO_MYA[d.species] !== undefined ? SPECIES_EVO_MYA[d.species] : 50;
            const isVisible = spMya >= myaThreshold;
            const node = d3.select(this);
            if (isVisible) {
              visibleCount++;
              node.attr("display", "inline").attr("opacity", 0.85);
            } else {
              node.attr("display", "none").attr("opacity", 0);
            }
          });
          if (countBadge) countBadge.innerText = `${visibleCount.toLocaleString()} / ${data.length.toLocaleString()} genes`;
        }

        evoSlider.addEventListener("input", function() {
          const sliderVal = parseInt(this.value, 10);
          const mya = 500 - sliderVal;
          applyEvolutionFilter(mya);
        });

        function playEvolutionMovie() {
          if (isEvoPlaying) {
            clearInterval(evoTimer);
            isEvoPlaying = false;
            const pBtn = document.getElementById("evoPlayBtn");
            if (pBtn) pBtn.innerText = "▶ Play Movie";
            return;
          }
          isEvoPlaying = true;
          const pBtn = document.getElementById("evoPlayBtn");
          if (pBtn) pBtn.innerText = "❚❚ Pause";

          if (parseInt(evoSlider.value, 10) >= 500) {
            evoSlider.value = 0;
          }

          evoTimer = setInterval(() => {
            let val = parseInt(evoSlider.value, 10) + 5;
            if (val > 500) {
              val = 500;
              clearInterval(evoTimer);
              isEvoPlaying = false;
              const pb = document.getElementById("evoPlayBtn");
              if (pb) pb.innerText = "▶ Replay Movie";
            }
            evoSlider.value = val;
            applyEvolutionFilter(500 - val);
          }, 140);
        }

        const evoPlayBtn = document.getElementById("evoPlayBtn");
        if (evoPlayBtn) evoPlayBtn.addEventListener("click", playEvolutionMovie);

        const evoResetBtn = document.getElementById("evoResetBtn");
        if (evoResetBtn) {
          evoResetBtn.addEventListener("click", () => {
            if (isEvoPlaying) {
              clearInterval(evoTimer);
              isEvoPlaying = false;
              const pb = document.getElementById("evoPlayBtn");
              if (pb) pb.innerText = "▶ Play Movie";
            }
            evoSlider.value = 500;
            applyEvolutionFilter(0);
          });
        }

        const evoCountBadge = document.getElementById("evoCountBadge");
        if (evoCountBadge) evoCountBadge.innerText = `${data.length.toLocaleString()} genes`;
      }
    });

    // =========================================================================
    // Universal Sequence Matching Engine & Live Manifold Projection
    // =========================================================================
    const analyzeBtnEl = document.getElementById("analyzeBtn");
    if (analyzeBtnEl) analyzeBtnEl.onclick = runUniversalAnalysisAndProjection;

    async function runUniversalAnalysisAndProjection() {
      const raw = document.getElementById("seqTextarea").value.trim();
      if (!raw) return;
      if (!globalData || globalData.length === 0) return;

      // Clean & Detect DNA vs AA
      const clean = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (clean.length < 20) {
        alert("Please enter a valid antibody sequence of at least 20 residues.");
        return;
      }

      // Dual Engine Execution: Client WASM vs Server Native Rust
      let wasmData = null;
      let execEngineLabel = "Client WebAssembly (In-Browser)";
      let execDurationMs = 0;

      if (currentEngine === 'native') {
        const t0_native = performance.now();
        try {
          const resp = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sequence: clean, name: "Query" })
          });
          const serverRes = await resp.json();
          const t1_native = performance.now();
          execDurationMs = (t1_native - t0_native).toFixed(1);
          if (serverRes.status === "success" && serverRes.data) {
            wasmData = serverRes.data;
            execEngineLabel = `Server Native Rust (Apple M4 Pro • ${serverRes.exec_time_ms || execDurationMs} ms)`;
          }
        } catch (err) {
          console.warn("Server native Rust query failed, falling back to WASM:", err);
          execEngineLabel = "Client WebAssembly (Fallback)";
        }
      }

      if (!wasmData && wasmReady) {
        const t0_wasm = performance.now();
        try {
          wasmData = analyze_sequence(clean, "Query", null, null);
        } catch (err) {
          console.warn("WASM sequence analysis note:", err);
        }
        const t1_wasm = performance.now();
        execDurationMs = (t1_wasm - t0_wasm).toFixed(1);
        execEngineLabel = `Client WebAssembly (In-Browser • ${execDurationMs} ms)`;
      }

      const isDna = !clean.split('').some(c => ['E','F','I','L','P','Q','V','W','Y'].includes(c));
      let aaQuery = clean;
      if (isDna) {
        let bestFrameAa = '';
        let bestScore = -1;
        for (let fr = 0; fr < 3; fr++) {
          const trans = translateDnaJs(clean.slice(fr));
          const score = (trans.includes('C') ? 10 : 0) + (trans.includes('WVR') || trans.includes('WVK') || trans.includes('WYQ') || trans.includes('WFR') ? 20 : 0) - (trans.split('*').length * 15);
          if (score > bestScore) {
            bestScore = score;
            bestFrameAa = trans;
          }
        }
        aaQuery = bestFrameAa;
      }

      // Find Landmark 2nd Cysteine (Cys104) and Cys23
      let cys23 = -1;
      let cys104 = -1;
      for (let i = 15; i < Math.min(35, aaQuery.length); i++) {
        if (aaQuery[i] === 'C') { cys23 = i; break; }
      }
      for (let i = Math.min(aaQuery.length - 1, 125); i >= Math.max(65, cys23 + 45); i--) {
        if (aaQuery[i] === 'C') { cys104 = i; break; }
      }
      if (cys104 === -1) {
        cys104 = aaQuery.lastIndexOf('C');
      }

      const matureQuery = (cys104 !== -1 && cys104 >= 60) ? aaQuery.slice(0, cys104 + 1) : aaQuery.slice(0, 95);

      // Cys104-Anchored & Offset Search against all V-genes in globalData
      let bestV = null;
      let bestIdentity = -1;
      let bestMatches = 0;
      let bestShm = 999;
      let bestOverlap = 0;

      for (let i = 0; i < globalData.length; i++) {
        const v = globalData[i];
        const gSeq = (v.mature_seq || v.ungapped_seq || v.sequence || v.aa_seq || "").replace(/[\.\-]/g, "");
        if (!gSeq) continue;

        // Landmark Cys in germline sequence
        let gCys = -1;
        for (let k = gSeq.length - 1; k >= 0; k--) {
          if (gSeq[k] === 'C' && k >= 40) {
            gCys = k;
            break;
          }
        }

        // Test Cys104-to-Cys104 shift, zero shift, and sliding window offsets (-25 to +25)
        const shifts = new Set([0]);
        if (cys104 !== -1 && gCys !== -1) {
          shifts.add(cys104 - gCys);
        }
        for (let s = -25; s <= 25; s++) {
          shifts.add(s);
        }

        for (let shift of shifts) {
          let matches = 0;
          let compLen = 0;
          for (let qi = 0; qi < matureQuery.length; qi++) {
            const gi = qi - shift;
            if (gi >= 0 && gi < gSeq.length) {
              compLen++;
              if (matureQuery[qi] === gSeq[gi]) matches++;
            }
          }
          if (compLen >= 35) {
            const idPct = (matches / compLen) * 100.0;
            if (idPct > bestIdentity || (idPct === bestIdentity && compLen > bestOverlap)) {
              bestIdentity = idPct;
              bestV = v;
              bestMatches = matches;
              bestOverlap = compLen;
              bestShm = compLen - matches;
            }
          }
        }
      }

      if (!bestV) return;

      const detectedSpecies = bestV.species;
      const detectedChain = bestV.chain;
      const locusStr = (bestV.locus || detectedChain || "").toUpperCase();
      const isHeavy = detectedChain.includes("Heavy") || locusStr === "IGH";
      const isTrbOrTrd = locusStr.includes("TRB") || locusStr.includes("TRD") || detectedChain.includes("TRB") || detectedChain.includes("TRD");
      const isTcr = locusStr.startsWith("TR") || detectedChain.startsWith("TR");
      const hasDElement = isHeavy || isTrbOrTrd;

      // Extract CDR3: from residue after Cys104 up to J-segment start
      let cdr3 = "";
      let jSubseq = "";
      if (cys104 !== -1 && cys104 + 1 < aaQuery.length) {
        const rem = aaQuery.slice(cys104 + 1);
        let jSplit = -1;
        const jMotifs = [
          "WGQG", "WGRG", "WGAG", "WGHG", "FGQG", "FGAG", "FGKG", "FGEG", "FGPG", "FGNG", "FGSG", "FGDG",
          "TVSS", "TVSA", "TVL", "VEIK", "LEIK", "VDIK", "LDIK", "LTVT", "LTVL", "LTVV", "LTVI", "VTVE", "LSVL", "LVVI", "LVVE"
        ];
        for (let m of jMotifs) {
          const idx = rem.indexOf(m);
          if (idx !== -1 && (jSplit === -1 || idx < jSplit)) {
            jSplit = idx;
          }
        }
        if (jSplit !== -1 && jSplit > 0) {
          cdr3 = rem.slice(0, jSplit);
          jSubseq = rem.slice(jSplit);
        } else {
          cdr3 = rem.slice(0, Math.min(15, rem.length));
          jSubseq = rem.slice(cdr3.length);
        }
      }

      // Match D-Segment (6 reading frames, direct & inverted)
      let matchedD = null;
      let maxDLen = 0;
      if (hasDElement && cdr3.length >= 3 && DJ_DATABASE.d_genes) {
        const candidateD = DJ_DATABASE.d_genes.filter(d => {
          if (isHeavy) return !d.locus || d.locus === "IGH" || d.chain_type === "Heavy";
          if (isTrbOrTrd) return d.locus === "TRB" || d.locus === "TRD" || d.chain_type === "TRB" || d.chain_type === "TRD";
          return true;
        });

        for (let d of candidateD) {
          const frames = [
            [d.aa_rf1, false, "RF1"],
            [d.aa_rf2, false, "RF2"],
            [d.aa_rf3, false, "RF3"],
            [d.aa_inv_rf1, true, "Inv-RF1"],
            [d.aa_inv_rf2, true, "Inv-RF2"],
            [d.aa_inv_rf3, true, "Inv-RF3"]
          ];
          for (let [rfSeq, isInv, rfName] of frames) {
            const cleanRf = (rfSeq || "").replace(/[^A-Z]/g, '');
            const minK = isTrbOrTrd ? 2 : 3;
            if (cleanRf.length < minK) continue;
            for (let k = Math.min(cleanRf.length, cdr3.length); k >= minK; k--) {
              for (let off = 0; off <= cleanRf.length - k; off++) {
                const sub = cleanRf.slice(off, off + k);
                if (cdr3.includes(sub) && k > maxDLen) {
                  maxDLen = k;
                  matchedD = {
                    gene_id: d.gene_id,
                    matched_sub: sub,
                    is_inverted: isInv,
                    rf_name: rfName,
                    display: isInv ? `🔄 ${d.gene_id} (${rfName})` : `${d.gene_id} (${rfName})`
                  };
                }
              }
            }
          }
        }
      }

      // Match J-Segment & Verify Boundary Motif
      let matchedJ = null;
      let boundaryResult = "";
      if (DJ_DATABASE.j_genes) {
        let maxJScore = -1;
        const normTail = jSubseq || aaQuery.slice(Math.max(0, aaQuery.length - 20));
        let candidateJ = DJ_DATABASE.j_genes;
        if (isTcr) {
          const targetLocus = locusStr.includes("TRB") ? "TRB" : (locusStr.includes("TRA") ? "TRA" : (locusStr.includes("TRD") ? "TRD" : "TRG"));
          const locusMatches = DJ_DATABASE.j_genes.filter(j => j.locus === targetLocus || (j.chain_type && j.chain_type.includes(targetLocus)));
          if (locusMatches.length > 0) candidateJ = locusMatches;
        } else if (isHeavy) {
          const heavyMatches = DJ_DATABASE.j_genes.filter(j => j.chain_type === "Heavy" || j.locus === "IGH");
          if (heavyMatches.length > 0) candidateJ = heavyMatches;
        }

        for (let j of candidateJ) {
          const jSeq = j.aa_seq || "";
          let score = 0;
          for (let k = 0; k < Math.min(normTail.length, jSeq.length); k++) {
            if (normTail[normTail.length - 1 - k] === jSeq[jSeq.length - 1 - k]) score++;
          }
          if (score > maxJScore) {
            maxJScore = score;
            matchedJ = j;
          }
        }
        if (matchedJ) {
          const b = matchedJ.boundary_motif || (isTcr ? "LTVT" : "TVSS");
          if (b && aaQuery.endsWith(b)) {
            boundaryResult = `✅ Validated ${b} (0 Constant Bleed)`;
          } else if (b && aaQuery.includes(b)) {
            boundaryResult = `⚠️ Contains ${b} with Trailing Constant`;
          } else if (b) {
            boundaryResult = `ℹ️ Expected ${b}`;
          } else {
            boundaryResult = `✅ Validated synthesis boundary`;
          }
        }
      }

      // Populate HUD
      document.getElementById("analysisHUD").style.display = "block";
      document.getElementById("hudCoordBadge").innerText = `(x: ${bestV.x}, y: ${bestV.y})`;
      const spDisplay = detectedSpecies === 'dogfish' ? '🦈 DOGSHARK' : (detectedSpecies === 'dog' ? '🐕 DOG (CANINE)' : `🧬 ${detectedSpecies.toUpperCase()}`);
      document.getElementById("hudSpeciesBadge").innerText = spDisplay;
      document.getElementById("hudChainBadge").innerText = detectedChain;
      document.getElementById("hudFamilyBadge").innerText = bestV.family || "-";
      document.getElementById("hudClanBadge").innerText = bestV.clan;

      const shmBadge = document.getElementById("hudShmBadge");
      if (bestShm === 0) {
        shmBadge.className = "badge badge-low";
        shmBadge.innerText = "🌟 UNMUTATED GERMLINE";
      } else if (bestShm <= 5) {
        shmBadge.className = "badge badge-low";
        shmBadge.innerText = `✅ LOW SHM (${bestShm} mut)`;
      } else if (bestShm <= 15) {
        shmBadge.className = "badge badge-mod";
        shmBadge.innerText = `🟡 MODERATE SHM (${bestShm} mut)`;
      } else {
        shmBadge.className = "badge badge-high";
        shmBadge.innerText = `🔥 HIGH SHM (${bestShm} mut)`;
      }

      document.getElementById("hudVGene").innerText = bestV.gene_id;
      document.getElementById("hudVIdent").innerText = `${bestIdentity.toFixed(1)}% identity (${bestMatches} aa match)`;

      if (isHeavy) {
        if (matchedD) {
          document.getElementById("hudDGene").innerHTML = matchedD.display;
          document.getElementById("hudDFrame").innerText = `Subseq: "${matchedD.matched_sub}" (${matchedD.is_inverted ? 'Inverted Rearrangement' : 'Direct'})`;
        } else {
          document.getElementById("hudDGene").innerText = "IGHD (Undetermined)";
          document.getElementById("hudDFrame").innerText = "No >=3aa D-match in CDR3";
        }
      } else if (isTcr) {
        if (isTrbOrTrd) {
          if (matchedD) {
            document.getElementById("hudDGene").innerHTML = matchedD.display;
            document.getElementById("hudDFrame").innerText = `Subseq: "${matchedD.matched_sub}" (${matchedD.is_inverted ? 'Inverted Rearrangement' : 'Direct'})`;
          } else {
            document.getElementById("hudDGene").innerText = "TRBD / TRDD (Undetermined)";
            document.getElementById("hudDFrame").innerText = "No >=3aa D-match in CDR3";
          }
        } else {
          document.getElementById("hudDGene").innerText = "N/A (V-J Direct)";
          document.getElementById("hudDFrame").innerText = "TRA / TRG loci lack D-segments";
        }
      } else {
        document.getElementById("hudDGene").innerText = "N/A (Light Chain)";
        document.getElementById("hudDFrame").innerText = "D-segments absent in Light Loci";
      }

      const defaultJ = isTcr ? (locusStr.includes("TRB") ? "TRBJ" : (locusStr.includes("TRA") ? "TRAJ" : (locusStr.includes("TRD") ? "TRDJ" : "TRGJ"))) : "IGHJ";
      document.getElementById("hudJGene").innerText = matchedJ ? matchedJ.gene_id : defaultJ;
      document.getElementById("hudJBoundary").innerText = boundaryResult || "Canonical Synthesis Boundary";

      document.getElementById("hudCdr3").innerText = cdr3 || "-";
      document.getElementById("hudCdr3Len").innerText = cdr3 ? `${cdr3.length} AA` : "Length: 0";

      // Domain Architecture Ribbon (Powered by exact Rust WASM boundaries if available)
      let fr1 = aaQuery.slice(0, Math.max(0, cys23));
      let cdr1 = aaQuery.slice(cys23, Math.min(cys23 + 12, aaQuery.length));
      let fr2 = aaQuery.slice(cys23 + 12, Math.min(cys23 + 28, aaQuery.length));
      let cdr2 = aaQuery.slice(cys23 + 28, Math.min(cys23 + 38, aaQuery.length));
      let fr3 = aaQuery.slice(cys23 + 38, cys104 + 1);
      let cdr3Span = cdr3;
      let fr4 = jSubseq;

      if (wasmData && wasmData.fr1_aa && wasmData.cdr1_aa) {
        fr1 = wasmData.fr1_aa;
        cdr1 = wasmData.cdr1_aa;
        fr2 = wasmData.fr2_aa;
        cdr2 = wasmData.cdr2_aa;
        fr3 = wasmData.fr3_aa;
        cdr3Span = wasmData.cdr3_aa || cdr3;
        fr4 = wasmData.fr4_aa || jSubseq;
      }

      document.getElementById("hudRibbon").innerHTML = `
        <span class="rf-fr" title="FR1 (1-25)">${fr1}</span><span class="rf-cdr1" title="CDR1">${cdr1}</span><span class="rf-fr" title="FR2">${fr2}</span><span class="rf-cdr2" title="CDR2">${cdr2}</span><span class="rf-fr" title="FR3">${fr3}</span><span class="rf-cdr3" title="CDR3 (Hypervariable Junction)">${cdr3Span}</span><span class="rf-fr" title="FR4 / J-segment">${fr4}</span>
      `;

      // =======================================================================
      // LIVE MANIFOLD PROJECTION & CAMERA FLIGHT
      // =======================================================================
      const targetX = bestV.x;
      const targetY = bestV.y;
      const scale = 5.5;

      svg.transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(width / 2 - targetX * scale, height / 2 - targetY * scale).scale(scale)
        );

      beaconG.selectAll("*").remove();

      beaconG.append("circle")
        .attr("cx", targetX)
        .attr("cy", targetY)
        .attr("class", "sonar-beacon");

      beaconG.append("circle")
        .attr("cx", targetX)
        .attr("cy", targetY)
        .attr("r", 5.5)
        .attr("class", "sonar-beacon-inner");

      circles.each(function(d) {
        if (d.gene_id === bestV.gene_id && d.species === bestV.species) {
          d3.select(this)
            .raise()
            .transition().duration(400)
            .attr("r", 10.0)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 3.0)
            .attr("opacity", 1.0);
        }
      });

      banner.style("display", "block")
        .html(`🎯 <strong>Live Projection:</strong> Query centered on <strong>${bestV.gene_id}</strong> (${bestV.species.toUpperCase()} • ${bestV.family || bestV.chain}) with <strong>${bestIdentity.toFixed(1)}%</strong> identity.<br><span style="font-size:11px; color:${currentEngine === 'native' ? '#38bdf8' : '#34d399'}; font-weight:600;">${currentEngine === 'native' ? '🚀' : '⚡'} ${execEngineLabel}</span>`);
    }

    // Export module functions to window for DOM event handlers & interactive console analysis
    window.loadSample = loadSample;
    window.runUniversalAnalysisAndProjection = runUniversalAnalysisAndProjection;
    window.resetMapView = resetMapView;
    window.flyToGene = flyToGene;
    window.compareCoincidentCluster = compareCoincidentCluster;
    window.embed_sequences_pacmap = embed_sequences_pacmap;
    window.embed_matrix_pacmap = embed_matrix_pacmap;
    window.openAlignmentDrawer = openAlignmentDrawer;
    window.closeAlignmentDrawer = closeAlignmentDrawer;
    window.renderAlignmentView = renderAlignmentView;

    // Check URL parameters for direct presentation / spotlight mode (e.g. ?star=v186)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("star") || urlParams.get("highlight") === "v186" || urlParams.get("highlight") === "186" || urlParams.get("b18") || urlParams.get("b1-8")) {
      d3.select("#geneSearch").property("value", "V186.2");
      setTimeout(() => {
        if (typeof window.igniteV186Star === "function") {
          window.igniteV186Star(true);
        }
      }, 800);
    }

