// TCRbase Expressed Repertoire & Single-Cell Paired Response Controller
import initWasm from '../pkg/dnaplot_wasm.js';

let wasmReady = false;
let currentEngine = 'wasm';

// Initialize WebAssembly Engine
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
    console.log("✅ TCRbase WebAssembly Engine Initialized.");
  } catch (err) {
    console.warn("WASM initialization note:", err);
  }
}
initWasmEngine();

window.switchExecutionEngine = function(engine) {
  currentEngine = engine;
  const btnWasm = document.getElementById("btnEngineWasm");
  const btnNative = document.getElementById("btnEngineNative");
  const badge = document.getElementById("wasmBadge");
  const badgeText = document.getElementById("engineBadgeText");

  if (engine === 'wasm') {
    if (btnWasm) btnWasm.className = "engine-btn active wasm";
    if (btnNative) btnNative.className = "engine-btn";
    if (badge) badge.className = "wasm-badge wasm-active";
    if (badgeText) badgeText.innerText = "⚡ Client WASM: Active (In-Browser)";
  } else {
    if (btnWasm) btnWasm.className = "engine-btn";
    if (btnNative) btnNative.className = "engine-btn active native";
    if (badge) badge.className = "wasm-badge native-active";
    if (badgeText) badgeText.innerText = "🚀 Server Native Rust: Active (Apple M4 Pro)";
  }
};

window.openBenchmarkModal = function() {
  const modal = document.getElementById("benchmarkModal");
  if (modal) modal.style.display = "flex";
};

window.closeBenchmarkModal = function() {
  const modal = document.getElementById("benchmarkModal");
  if (modal) modal.style.display = "none";
};

// Main D3 Visualizer Setup
window.addEventListener("DOMContentLoaded", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const svg = d3.select("#canvas").attr("width", width).attr("height", height);
  const g = svg.append("g");
  const beaconG = g.append("g").attr("id", "beaconGroup");
  const circlesG = g.append("g").attr("id", "circlesGroup");

  let globalData = [];
  let circles = null;
  let currentMode = "response";
  let selectedFilters = new Set();
  let activeSelectedId = null;

  // Zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.2, 35])
    .on("zoom", (e) => {
      g.attr("transform", e.transform);
      const k = e.transform.k;
      const radiusFactor = Math.max(0.3, 1.0 / Math.pow(k, 0.35));
      if (circles) {
        circles.attr("r", d => {
          let baseR = getBaseRadius(d);
          if (selectedFilters.size > 0) {
            const isMatch = selectedFilters.has(d[currentMode]);
            baseR = isMatch ? (baseR * 1.5) : 1.8;
          }
          return baseR * radiusFactor;
        }).attr("stroke-width", Math.max(0.2, 0.5 * radiusFactor));
      }
    });

  svg.call(zoom);
  svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.85));

  function resetMapView() {
    svg.transition().duration(850).call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.85));
  }
  d3.select("#resetZoom").on("click", resetMapView);

  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'f' || e.key === 'F') resetMapView();
  });

  // Panel Collapses
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
  if (toggleInspectorBtn) {
    toggleInspectorBtn.onclick = () => {
      setInspectorCollapsed(!inspectorPanel.classList.contains("collapsed"));
    };
  }
  const closeInspectorBtn = document.getElementById("closeInspectorBtn");
  if (closeInspectorBtn) closeInspectorBtn.onclick = () => setInspectorCollapsed(true);
  if (restoreInspectorBtn) restoreInspectorBtn.onclick = () => setInspectorCollapsed(false);

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

  const restoreLegendBtn = document.getElementById("restoreLegendBtn");
  if (restoreLegendBtn) {
    restoreLegendBtn.onclick = () => {
      d3.select("#legend").classed("collapsed", false);
      restoreLegendBtn.style.display = "none";
    };
  }

  const tooltip = d3.select("#tooltip");
  const banner = d3.select("#selectionBanner");

  // Color Palettes
  const responseColors = {
    "Viral: CMV pp65": "#38bdf8",                         // Sky Blue
    "Viral: EBV BMLF1": "#a855f7",                        // Purple
    "Viral: Influenza A M1": "#06b6d4",                   // Cyan
    "Viral: SARS-CoV-2 (COVID-19)": "#ef4444",            // Crimson Red
    "Tumor: Melanoma (NY-ESO-1 / MART-1)": "#f59e0b",     // Amber
    "Autoimmune & Treg: Insulin / MBP": "#ec4899",        // Pink
    "Murine Model: OT-I (OVA) & LCMV": "#10b981",         // Emerald
    "Healthy: Naive T-Cell Repertoire": "#64748b",        // Slate
    "Healthy: Polyclonal Single Cells": "#475569",        // Darker Slate
    "Innate-Like TCR: MAIT & iNKT": "#fbbf24",            // Gold
    "Ruminant γδ Expansion: Bovine WC1+": "#f97316"       // Orange
  };

  const phenotypeColors = {
    "CD8+ Cytotoxic (CTL)": "#ef4444",
    "CD8+ Effector Memory (Tem)": "#38bdf8",
    "CD8+ Central Memory (Tcm)": "#06b6d4",
    "CD8+ Activated Effector": "#f43f5e",
    "CD8+ Exhausted TIL (Tex)": "#f59e0b",
    "CD4+ Helper (Th1)": "#10b981",
    "CD4+ Helper (Th2)": "#34d399",
    "CD4+ Helper (Th17)": "#84cc16",
    "CD4+ Regulatory T-Cell (Treg)": "#ec4899",
    "CD4+ Naive / CD8+ Naive": "#64748b",
    "CD4+ Naive": "#64748b",
    "CD8+ Naive": "#64748b",
    "Innate-Like T-Cell (MAIT / iNKT)": "#fbbf24",
    "γδ T-Cell (WC1+ Peripheral)": "#f97316"
  };

  const expansionColors = {
    "Hyper-Expanded (≥50 cells)": "#ef4444",
    "Expanded (5-49 cells)": "#f59e0b",
    "Clonal (2-4 cells)": "#38bdf8",
    "Singleton (1 cell)": "#64748b"
  };

  const chainColors = {
    "TRB": "#06b6d4",
    "TRA": "#10b981",
    "TRD": "#f59e0b",
    "TRG": "#8b5cf6"
  };

  const cdr3CatColors = {
    "Short (≤11 AA)": "#38bdf8",
    "Canonical (12-14 AA)": "#10b981",
    "Long (15-17 AA)": "#f59e0b",
    "Extended (≥18 AA)": "#ef4444"
  };

  const chargeColors = {
    "Cationic (+)": "#3b82f6",
    "Neutral": "#94a3b8",
    "Anionic (-)": "#ef4444"
  };

  function getBaseRadius(d) {
    if (currentMode === "expansion_category") {
      if (d.clonal_expansion >= 50) return 6.0;
      if (d.clonal_expansion >= 5) return 4.5;
      if (d.clonal_expansion >= 2) return 3.2;
      return 2.4;
    }
    if (d.clonal_expansion >= 50) return 4.5;
    if (d.clonal_expansion >= 5) return 3.8;
    return 3.0;
  }

  function getColor(d, mode) {
    if (mode === "response") return responseColors[d.response] || "#94a3b8";
    if (mode === "cell_phenotype") return phenotypeColors[d.cell_phenotype] || "#94a3b8";
    if (mode === "expansion_category") return expansionColors[d.expansion_category] || "#94a3b8";
    if (mode === "primary_chain") return chainColors[d.primary_chain] || "#94a3b8";
    if (mode === "cdr3_cat") return cdr3CatColors[d.cdr3_cat] || "#94a3b8";
    if (mode === "cdr3_charge_cat") return chargeColors[d.cdr3_charge_cat] || "#94a3b8";
    return "#38bdf8";
  }

  // Load Repertoire JSON
  d3.json("tcr_repertoire_pacmap_data.json").then(data => {
    globalData = data;

    // Update KPI bar
    const respCount = new Set(data.map(d => d.response)).size;
    const phenoCount = new Set(data.map(d => d.cell_phenotype)).size;
    if (document.getElementById("kpiGenes")) document.getElementById("kpiGenes").innerText = data.length.toLocaleString();
    if (document.getElementById("kpiResponses")) document.getElementById("kpiResponses").innerText = respCount.toLocaleString();
    if (document.getElementById("kpiPhenotypes")) document.getElementById("kpiPhenotypes").innerText = phenoCount.toLocaleString();

    // Create circles
    circles = circlesG.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => getBaseRadius(d))
      .attr("fill", d => getColor(d, currentMode))
      .attr("opacity", 0.85)
      .attr("stroke", "#0d1117")
      .attr("stroke-width", 0.5)
      .attr("id", (d, i) => "tcr_node_" + i)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("r", getBaseRadius(d) + 4.0).attr("stroke", "#fff").attr("stroke-width", 2.0).raise();
        tooltip.style("display", "block")
          .html(`
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
              <strong style="color:#38bdf8; font-size:13.5px;">${d.cell_barcode}</strong>
              <span class="badge" style="background:rgba(52,211,153,0.2); color:#34d399;">${d.clonal_expansion} cell${d.clonal_expansion > 1 ? 's' : ''}</span>
            </div>
            <div><strong>Response:</strong> <span style="color:#f8fafc;">${d.response}</span></div>
            <div><strong>Phenotype:</strong> <span style="color:#c084fc;">${d.cell_phenotype}</span></div>
            <div><strong>Target Epitope:</strong> <span style="color:#38bdf8;">${d.epitope}</span></div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid #334155;">
              <div><strong>Primary (${d.primary_chain}):</strong> ${d.v_call} • ${d.cdr3}</div>
              <div><strong>Paired (${d.paired_chain}):</strong> ${d.paired_v_call} • ${d.paired_cdr3}</div>
            </div>
            <div style="font-size:10.5px; color:#94a3b8; margin-top:4px;">Click point to inspect full paired single-cell architecture</div>
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("r", getBaseRadius(d))
          .attr("stroke", d.id === activeSelectedId ? "#38bdf8" : "#0d1117")
          .attr("stroke-width", d.id === activeSelectedId ? 2.5 : 0.5);
        tooltip.style("display", "none");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        selectClone(d);
      });

    // Update legend
    updateLegend(currentMode);

    // Color dropdown handler
    d3.select("#colorSelect").on("change", function() {
      currentMode = this.value;
      selectedFilters.clear();
      banner.style("display", "none");
      circles.transition().duration(450)
        .attr("fill", d => getColor(d, currentMode))
        .attr("r", d => getBaseRadius(d))
        .attr("opacity", 0.85);
      updateLegend(currentMode);
    });

    // Search filter
    d3.select("#geneSearch").on("input", function() {
      const q = this.value.trim().toLowerCase();
      if (!q) {
        updateHighlights();
      } else {
        let matchCount = 0;
        circles.each(function(d) {
          const match = d.id.toLowerCase().includes(q) ||
            d.cell_barcode.toLowerCase().includes(q) ||
            d.response.toLowerCase().includes(q) ||
            d.epitope.toLowerCase().includes(q) ||
            d.cell_phenotype.toLowerCase().includes(q) ||
            d.v_call.toLowerCase().includes(q) ||
            d.cdr3.toLowerCase().includes(q) ||
            d.paired_v_call.toLowerCase().includes(q) ||
            d.paired_cdr3.toLowerCase().includes(q);
          if (match) matchCount++;
          d3.select(this)
            .attr("opacity", match ? 1.0 : 0.05)
            .attr("r", match ? (getBaseRadius(d) + 3.0) : 1.5)
            .attr("stroke", match ? "#fff" : "none")
            .attr("stroke-width", match ? 2 : 0);
        });

        banner.style("display", "block").html(`
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div>🔍 Found <strong>${matchCount.toLocaleString()}</strong> matching single cells for "<strong>${q}</strong>"</div>
            <button id="clearSearchBannerBtn" class="filter-banner-btn">Clear Search</button>
          </div>
        `);
        d3.select("#clearSearchBannerBtn").on("click", () => {
          document.getElementById("geneSearch").value = "";
          updateHighlights();
        });
      }
    });

    // Preset selection dispatcher
    window.selectPreset = function(presetKey) {
      let target = null;
      if (presetKey === "1g4_nyeso1") {
        target = globalData.find(d => d.response.includes("Melanoma") && d.v_call.includes("TRBV6-5") && d.cdr3.includes("CASSYVGNTGELFF"));
      } else if (presetKey === "flu_m1") {
        target = globalData.find(d => d.response.includes("Influenza") && d.v_call.includes("TRBV19") && d.cdr3.includes("CASSIRSSYEQYF"));
      } else if (presetKey === "cmv_pp65") {
        target = globalData.find(d => d.response.includes("CMV") && d.v_call.includes("TRBV12-4") && d.cdr3.includes("CASSRGANYGYTF"));
      } else if (presetKey === "covid_spike") {
        target = globalData.find(d => d.response.includes("COVID") && d.v_call.includes("TRBV7-9") && d.cdr3.includes("CASSRTGELFF"));
      } else if (presetKey === "murine_oti") {
        target = globalData.find(d => d.response.includes("OT-I") && d.v_call.includes("TRBV12-1") && d.cdr3.includes("CASSRANYEQYF"));
      } else if (presetKey === "mait_cell") {
        target = globalData.find(d => d.response.includes("MAIT") && d.paired_v_call.includes("TRAV1-2"));
      } else if (presetKey === "bovine_gd") {
        target = globalData.find(d => d.response.includes("Bovine") && d.paired_v_call.includes("TRDV1"));
      }

      if (target) {
        selectClone(target);
      }
    };
  });

  // Select clone & populate paired HUD
  function selectClone(d) {
    activeSelectedId = d.id;
    setInspectorCollapsed(false);

    // Center & pulse beacon
    const targetX = d.x;
    const targetY = d.y;
    const targetK = 3.5;
    svg.transition().duration(900).call(
      zoom.transform,
      d3.zoomIdentity.translate(width/2 - targetX * targetK, height/2 - targetY * targetK).scale(targetK)
    );

    beaconG.selectAll("*").remove();
    beaconG.append("circle")
      .attr("cx", targetX)
      .attr("cy", targetY)
      .attr("r", 10)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2.5)
      .transition()
      .duration(1200)
      .ease(d3.easeCircleOut)
      .attr("r", 32)
      .attr("opacity", 0)
      .on("end", function repeat() {
        d3.select(this)
          .attr("r", 10)
          .attr("opacity", 1)
          .transition()
          .duration(1200)
          .ease(d3.easeCircleOut)
          .attr("r", 32)
          .attr("opacity", 0)
          .on("end", repeat);
      });

    // Populate inspector HUD
    document.getElementById("hudBarcodeBadge").innerText = d.cell_barcode;
    document.getElementById("hudResponseBadge").innerText = d.response;
    document.getElementById("hudPhenotypeBadge").innerText = d.cell_phenotype;
    document.getElementById("hudExpansionBadge").innerText = `${d.clonal_expansion} cell${d.clonal_expansion > 1 ? 's' : ''} (${d.expansion_category.split(' ')[0]})`;

    document.getElementById("hudEpitope").innerText = d.epitope;
    document.getElementById("hudMhc").innerText = d.mhc_restriction;
    document.getElementById("hudSpecies").innerText = `${d.organism} (${d.species.toUpperCase()})`;

    // Primary chain
    document.getElementById("hudPrimaryChainTitle").innerText = `Primary Chain (${d.primary_chain})`;
    document.getElementById("hudVGene").innerText = d.v_call;
    document.getElementById("hudJGene").innerText = d.j_call;
    document.getElementById("hudCdr3").innerText = d.cdr3;
    document.getElementById("hudCdr3Len").innerText = `Len: ${d.cdr3_len} AA`;
    document.getElementById("hudCdr3Charge").innerText = `Charge: ${d.cdr3_charge > 0 ? '+' : ''}${d.cdr3_charge}`;
    document.getElementById("hudCdr3Hyd").innerText = `Hyd: ${d.cdr3_hydropathy}`;

    // Paired chain
    document.getElementById("hudPairedChainTitle").innerText = `Paired Chain (${d.paired_chain})`;
    document.getElementById("hudPairedV").innerText = d.paired_v_call;
    document.getElementById("hudPairedJ").innerText = d.paired_j_call;
    document.getElementById("hudPairedCdr3").innerText = d.paired_cdr3;
    document.getElementById("hudPairedLen").innerText = `Len: ${d.paired_cdr3_len} AA`;
    document.getElementById("hudPairedCharge").innerText = `Charge: ${d.paired_cdr3_charge > 0 ? '+' : ''}${d.paired_cdr3_charge}`;
    document.getElementById("hudPairedHyd").innerText = `Hyd: ${d.paired_cdr3_hydropathy}`;
  }

  // Update Legend
  function updateLegend(mode) {
    if (!globalData || globalData.length === 0) return;

    const countMap = {};
    globalData.forEach(d => {
      const val = d[mode] || "Other";
      countMap[val] = (countMap[val] || 0) + 1;
    });

    const sortedKeys = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);
    const titles = {
      "response": "Antigen / Immune Response",
      "cell_phenotype": "Single-Cell T-Cell Phenotype",
      "expansion_category": "Clonal Expansion Level",
      "primary_chain": "Primary TCR Chain",
      "cdr3_cat": "CDR3 Length Spectrum",
      "cdr3_charge_cat": "CDR3 Net Charge"
    };

    const leg = d3.select("#legend").html(`
      <div class="legend-header">
        <div class="legend-title">
          <span>${titles[mode] || mode}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <span id="legendSelectedCount" class="legend-badge">0 selected</span>
            <button class="panel-minimize-btn" id="closeLegendBtn" title="Minimize Legend">✕</button>
          </div>
        </div>
        <div class="legend-btn-row">
          <button id="selectAllBtn" class="legend-btn">Select All</button>
          <button id="deselectAllBtn" class="legend-btn">Deselect All</button>
        </div>
      </div>
      <div class="legend-instruction">☑️ Filter single cells by response category or clonal expansion.</div>
      <div id="legendContent" style="max-height: 380px; overflow-y: auto;"></div>
    `);

    d3.select("#closeLegendBtn").on("click", () => {
      d3.select("#legend").classed("collapsed", true);
      document.getElementById("restoreLegendBtn").style.display = "inline-flex";
    });

    d3.select("#selectAllBtn").on("click", () => {
      sortedKeys.forEach(k => selectedFilters.add(k));
      updateHighlights();
    });

    d3.select("#deselectAllBtn").on("click", () => {
      selectedFilters.clear();
      updateHighlights();
    });

    const legList = d3.select("#legendContent");
    sortedKeys.forEach(k => {
      const count = countMap[k];
      const color = getColor({ [mode]: k }, mode);
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

    updateHighlights();
  }

  function updateHighlights() {
    const count = selectedFilters.size;
    const badge = document.getElementById("legendSelectedCount");
    if (badge) badge.innerText = `${count} selected`;

    if (count === 0) {
      banner.style("display", "none");
      d3.selectAll(".legend-item").classed("checked-item", false);
      d3.selectAll(".legend-cb").property("checked", false);
      if (circles) {
        circles.transition().duration(250)
          .attr("opacity", 0.85)
          .attr("r", d => getBaseRadius(d))
          .attr("stroke", d => d.id === activeSelectedId ? "#38bdf8" : "#0d1117")
          .attr("stroke-width", d => d.id === activeSelectedId ? 2.5 : 0.5);
      }
    } else {
      banner.style("display", "block").html(`
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>Active Filter: <strong>${count}</strong> categories selected</div>
          <button id="clearBannerBtn" class="filter-banner-btn">Clear Filter</button>
        </div>
      `);
      d3.select("#clearBannerBtn").on("click", () => {
        selectedFilters.clear();
        updateHighlights();
      });

      d3.selectAll(".legend-item").each(function() {
        const k = d3.select(this).attr("data-key");
        const isChecked = selectedFilters.has(k);
        d3.select(this).classed("checked-item", isChecked);
        d3.select(this).select(".legend-cb").property("checked", isChecked);
      });

      if (circles) {
        circles.transition().duration(250)
          .attr("opacity", d => selectedFilters.has(d[currentMode]) ? 1.0 : 0.06)
          .attr("r", d => selectedFilters.has(d[currentMode]) ? (getBaseRadius(d) * 1.5) : 1.8)
          .attr("stroke", d => selectedFilters.has(d[currentMode]) ? "#fff" : "none")
          .attr("stroke-width", d => selectedFilters.has(d[currentMode]) ? 1.5 : 0);
      }
    }
  }
});
