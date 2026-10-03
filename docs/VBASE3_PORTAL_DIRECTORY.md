# 🌐 VBASE3 Web Applications & Visualizer Directory

This directory provides a consolidated map of all interactive portals, visual analytics suites, and database interfaces in VBASE3.

---

## 🏛️ Core Discovery & Repertoire Visualizers

| Portal | URL / File | Purpose & Key Features | Data Engine & Source |
| :--- | :--- | :--- | :--- |
| **Portal Home & Index** | [`index.html`](http://localhost:8000/index.html) | Global navigation hub, GenBank V-gene frequency tables, quick search, and landmark query launcher. | Static + WASM router |
| **55-Species PaCMAP Universe** | [`vgene_pacmap_universe.html`](http://localhost:8000/vgene_pacmap_universe.html) | Complete pan-vertebrate antibody universe across 55 species, Dildrop homology families, and evolution epoch sliders. | D3.js + `vgene_pacmap_data.json` |
| **Expressed Repertoire Diversity** | [`repertoire_diversity.html`](http://localhost:8000/repertoire_diversity.html) | Multi-dataset manifold of expressed BCR clones, single-cell heavy+light pairs, and live side-by-side WASM vs. Native Rust benchmark. | D3.js + WASM SIMD / Native Rayon |
| **Repertoire Analytics & Mosaics** | [`repertoire_analysis.html`](http://localhost:8000/repertoire_analysis.html) | **New:** GenBank V-J co-occurrence heatmaps, 3-way V-D-J recombination flow, and single-cell clonotype expansion mosaics (treemaps). | D3.js + GenBank 27k mouse + 10x single-cell |
| **Constant Region Database** | [`constant_regions.html`](http://localhost:8000/constant_regions.html) | **New:** Modular constant cassettes (CH1, Hinge, CH2, CH3, Fc, CL, TCR) with direct links and in-browser viewing of original GenBank `.gb` flat files. | `vbase3_constant_regions.json` + `.gb` flat files |
| **DNAPLOT Sequence Alignment** | [`dnaplot.html`](http://localhost:8000/dnaplot.html) | In-browser IMGT 1–128 alignment, SHM somatic hypermutation quantification, and Collier de Perles 2D graphical display. | Client-side Rust WebAssembly (`pkg/`) |
| **System Status & Coverage** | [`vbase3_status.html`](http://localhost:8000/vbase3_status.html) | Live coverage matrix across all 55 species, tripartite loci status, and autonomous harvester health. | `vbase3_status_summary.json` |

---

## 🔬 Deep-Dive Species & Engineering Analyzers

| Portal | URL / File | Purpose & Key Features | Biological Significance |
| :--- | :--- | :--- | :--- |
| **Human VBASE3 Analyzer** | [`human_vbase3_analyzer.html`](http://localhost:8000/human_vbase3_analyzer.html) | Complete 50-year historical timeline (Kabat $\rightarrow$ VBASE $\rightarrow$ VBASE2 $\rightarrow$ IMGT $\rightarrow$ VBASE3), chromosome 14/2/22 megabase loci, and full human V-gene table. | Therapeutic antibody development |
| **Mouse VBASE3 Analyzer** | [`mouse_vbase3_analyzer.html`](http://localhost:8000/mouse_vbase3_analyzer.html) | C57BL/6 vs. BALB/c allotypic divergence, anti-NP immune response lead $V186.2$, and J558 clan dominance. | Preclinical model standard |
| **Rabbit RabMAb Analyzer** | [`rabbit_vbase3_analyzer.html`](http://localhost:8000/rabbit_vbase3_analyzer.html) | Single predominant rearranging VH1 diversified via somatic gene conversion; conserved inter-CDR Cys21–Cys79 bridge. | Ultra-high affinity diagnostic mAbs |
| **Camelid VHH Analyzer** | [`camelid_vbase3_analyzer.html`](http://localhost:8000/camelid_vbase3_analyzer.html) | Autonomous single-domain heavy-chain-only antibodies (HCAbs), hydrophilic FR2 substitutions, and extended CDR3 loops. | Nanobody therapeutics |
| **Canine Vet-mAb Analyzer** | [`dog_vbase3_analyzer.html`](http://localhost:8000/dog_vbase3_analyzer.html) | Extreme light chain inversion (~90% lambda chain dominance); canine therapeutic antibody development. | Veterinary oncology & dermatology |
| **Chicken Avian Analyzer** | [`chicken_vbase3_analyzer.html`](http://localhost:8000/chicken_vbase3_analyzer.html) | Single rearranging VH1/VL1 pair diversified by bursal pseudogene gene conversion; OmniChicken transgenic platform. | Highly conserved mammalian target mAbs |
| **Xenopus Amphibian Analyzer** | [`xenopus_du_pasquier_hsu.html`](http://localhost:8000/xenopus_du_pasquier_hsu.html) | Allotetraploid Du Pasquier & Hsu subgenomes (L & S chromosomes) and ancestral light chains (Ig$\rho$, Ig$\sigma$). | Tetrapod evolutionary immunogenomics |
| **Human TCR Analyzer** | [`human_tcr_analyzer.html`](http://localhost:8000/human_tcr_analyzer.html) | 283 curated human TCR V-genes (TRA, TRB, TRG, TRD), 5 D, 75 J, clinical benchmarks (1G4 NY-ESO-1, EBV, CMV, MAIT), and 2D PaCMAP manifold. | TCR-T immunotherapy & infectious disease |
| **Mouse TCR Analyzer** | [`mouse_tcr_analyzer.html`](http://localhost:8000/mouse_tcr_analyzer.html) | 290 curated mouse TCR V-genes (TRA, TRB, TRG, TRD), 4 D, 16 J, transgenic benchmarks (OT-I, OT-II, 2B4, DETC $\gamma\delta$), and 2D PaCMAP manifold. | Preclinical immunology & TCR transgenic models |
| **Single-Cell Paired Studio** | [`single_cell_repertoire_studio.html`](http://localhost:8000/single_cell_repertoire_studio.html) | Combinatorial VH:VL pairing matrix, clonal expansion hierarchy, longitudinal kinetics (D0 $\rightarrow$ D180), and synthesis sheet export. | Single-cell antibody discovery & clonal kinetics |
| **TCRBase Repertoire** | [`tcr_repertoire.html`](http://localhost:8000/tcr_repertoire.html) | Complete $\alpha\beta$ and $\gamma\delta$ T-cell receptor universe across 3,114 functional Class I TCR genes. | Cellular immunotherapy & TCR-T design |

---

## 🌾 Autonomous Harvester & Engine Architecture

* **Autonomous Harvester Daemon**:
  * Script: `scripts/autonomous_harvester_and_rebuilder.py`
  * Process: PID `96962` (active in background)
  * Status: **371 completed cycles**, **2,089 genomic loci**, **28,124 rearranged sequences** across **59 species**
* **Local Dual-Engine Web Server**:
  * Script: `python3 web/static/serve_wasm.py`
  * Port: `http://localhost:8000`
