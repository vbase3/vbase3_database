# VBASE3: Comparative Immunogenomics Database & WebAssembly Analytics Suite

[![GitHub Pages](https://img.shields.io/badge/Web_Portals-Live_on_GitHub_Pages-blue.svg)](https://vbase3.github.io/vbase3_database/)
[![Zenodo](https://zenodo.org/badge/DOI/10.5281/zenodo.22923344.svg)](https://doi.org/10.5281/zenodo.22923344)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**VBASE3** is an open, systematic comparative immunogenomics database and high-performance WebAssembly analysis suite for antigen receptor genes (B-cell antibodies and T-cell receptors) across jawed vertebrates (*Gnathostomata*).

This public repository contains:
1. **The VBASE3 Database**: Canonical Class I master catalogs, TCRBase germlines, Rosetta Stone cross-reference mappings, D/J diversity elements, and complete FASTA sequence libraries in [`datasets/`](datasets/).
2. **Database Documentation**: Detailed data dictionary ([`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md)), open-data provenance ([`docs/DATA_PROVENANCE_AND_SOURCES.md`](docs/DATA_PROVENANCE_AND_SOURCES.md)), and portal guides ([`docs/VBASE3_PORTAL_DIRECTORY.md`](docs/VBASE3_PORTAL_DIRECTORY.md)).
3. **Client-Side Web Portals**: Production zero-backend WebAssembly web applications deployed via GitHub Pages at **[https://vbase3.github.io/vbase3_database/](https://vbase3.github.io/vbase3_database/)**.
4. **Standalone AI & Node Tools**: Self-contained Model Context Protocol (MCP) server ([`node_tools/vbase3_mcp_server.mjs`](node_tools/vbase3_mcp_server.mjs)) and WASM CLI tool ([`node_tools/vbase3_wasm_cli.mjs`](node_tools/vbase3_wasm_cli.mjs)) for headless sequence analysis and AI agent integration.
5. **AI Agent Guidelines**: Full operational instructions and biological synthesis invariants for autonomous coding agents in [`AGENTS.md`](AGENTS.md).

> [!IMPORTANT]
> **⚠️ Must Read Before Using**: VBASE3 is currently in beta phase. Please consult [`MUST_READ_BEFORE_USING.md`](MUST_READ_BEFORE_USING.md) (or download the official advisory PDF: [`MUST_READ_BEFORE_USING.pdf`](MUST_READ_BEFORE_USING.pdf)) for community advisory notices, limitations, and feedback instructions.

---

## 📦 The VBASE3 Database (`datasets/`)

All master tables are open, versioned, and cross-referenced against INSDC (GenBank/ENA/DDBJ), IMGT, and VBASE2:

| Dataset File | Description | Records |
| :--- | :--- | :--- |
| [`datasets/vbase3_class1_master_catalog.tsv`](datasets/vbase3_class1_master_catalog.tsv) | Canonical Class I functional repertoire across benchmark vertebrate taxa | 2,856 confirmed genes |
| [`datasets/tcrbase_germlines_curated.tsv`](datasets/tcrbase_germlines_curated.tsv) | Curated TCRBase pan-vertebrate TCR germlines (TRA, TRB, TRG, TRD) | 3,114 TCR genes |
| [`datasets/vbase3_crossreference_table.tsv`](datasets/vbase3_crossreference_table.tsv) | Rosetta Stone cross-reference mapping (IMGT ↔ VBASE2 ↔ GenBank) | 3,900 cross-references |
| [`datasets/vbase3_class1_d_segments.tsv`](datasets/vbase3_class1_d_segments.tsv) | Diversity (D) segments with canonical 12-bp spacer RSS motifs | 41 core D-genes |
| [`datasets/vbase3_class1_j_segments.tsv`](datasets/vbase3_class1_j_segments.tsv) | Joining (J) segments strictly trimmed to canonical IMGT synthesis boundaries | 150 J-genes |
| [`datasets/vbase3_constant_regions.tsv`](datasets/vbase3_constant_regions.tsv) | Curated constant region cassettes with INSDC/GenBank accession links | 108 modular cassettes |
| [`datasets/fasta/`](datasets/fasta/) | Nucleotide & translated amino acid FASTA libraries for Heavy, Light, D, J, and C | 6 FASTA libraries |

Full column definitions and schemas are documented in [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md).

---

## 🌐 Live Web Portals (Zero-Backend WebAssembly)

All VBASE3 web applications execute **100% client-side** inside your web browser using compiled Rust WebAssembly (`pkg/dnaplot_wasm_bg.wasm`). **Zero sequences, clone data, or queries are ever transmitted to an external server.**

### Core Comparative Hub & Universes
- **[Central Portal Hub](https://vbase3.github.io/vbase3_database/index.html)**: Central portal gateway and search directory.
- **[55-Species PaCMAP Universe](https://vbase3.github.io/vbase3_database/vgene_pacmap_universe.html)**: Interactive 2D structural manifold of 2,048 vertebrate V-genes.
- **[TCR Universe](https://vbase3.github.io/vbase3_database/tcr_universe.html)**: Pan-vertebrate T-cell receptor germline explorer.
- **[Rosetta Stone Explorer](https://vbase3.github.io/vbase3_database/rosetta_stone.html)**: Interactive cross-nomenclature translator (IMGT ↔ VBASE2 ↔ GenBank).

### Species-Specific BCR Repertoire Analyzers
- **[Human (*Homo sapiens*) BCR Analyzer](https://vbase3.github.io/vbase3_database/human_vbase3_analyzer.html)**: Multi-chain ($V_H, V_\kappa, V_\lambda$) analyzer with Collier de Perles diagrams.
- **[Mouse (*Mus musculus*) BCR Analyzer](https://vbase3.github.io/vbase3_database/mouse_vbase3_analyzer.html)**: Multi-chain analyzer with landmark hybridomas (B1-8, MOPC-21, 2B8).
- **[Canine (*Canis lupus familiaris*) BCR Analyzer](https://vbase3.github.io/vbase3_database/dog_vbase3_analyzer.html)**: Veterinary antibody analysis suite.
- **[Rabbit (*Oryctolagus cuniculus*) BCR Analyzer](https://vbase3.github.io/vbase3_database/rabbit_vbase3_analyzer.html)**: Diagnostic & RabMAb analyzer.
- **[Camelid (*Lama glama / Camelus*) Analyzer](https://vbase3.github.io/vbase3_database/camelid_vbase3_analyzer.html)**: Heavy-chain only (VHH/nanobody) hallmark detector.
- **[Chicken (*Gallus gallus*) Analyzer](https://vbase3.github.io/vbase3_database/chicken_vbase3_analyzer.html)**: Avian gene conversion & IgY analyzer.
- **[Amphibian (*Xenopus*) Analyzer](https://vbase3.github.io/vbase3_database/xenopus_du_pasquier_hsu.html)**: Ancient amphibian repertoire visualizer.

### Single-Cell & High-Throughput Studios
- **[Single-Cell Repertoire Studio](https://vbase3.github.io/vbase3_database/single_cell_repertoire_studio.html)**: Paired $V_H:V_L$ clonotype mosaic and V-J pairing visualizer.
- **[Repertoire Diversity Analyzer](https://vbase3.github.io/vbase3_database/repertoire_diversity.html)**: CDR-H3 length distribution and biophysical spectra.
- **[Constant Regions Database](https://vbase3.github.io/vbase3_database/constant_regions.html)**: Modular Fc domain viewer with GenBank provenance.

---

## 🤖 Standalone AI & Node Tools (`node_tools/`)

For programmatic analysis, CLI scripts, and local AI assistant integration (Claude Desktop, Cursor, Antigravity):

```bash
cd node_tools

# Run standalone WebAssembly CLI analysis:
node vbase3_wasm_cli.mjs --seq "EVQLVESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAK"

# Run Model Context Protocol (MCP) stdio server:
node vbase3_mcp_server.mjs
```

See [`docs/MCP_SERVER_GUIDE.md`](docs/MCP_SERVER_GUIDE.md) for full configuration details.

---

## 💻 Running the Web Portals Locally

Because modern web browsers enforce CORS restrictions on local `file:///` URLs for WebAssembly and ES modules, run a lightweight static web server:

```bash
# 1. Clone this repository:
git clone https://github.com/vbase3/vbase3_database.git
cd vbase3_database

# 2. Start a local HTTP server:
python3 -m http.server 8000

# 3. Open your browser:
open http://localhost:8000/index.html
```

---

## 📜 Citation, License & Archival Deposit

- **Archival Release (Zenodo)**: [DOI 10.5281/zenodo.22923344](https://doi.org/10.5281/zenodo.22923344)
- **License**: [MIT License](LICENSE)
- **Trust & Open Data Provenance**: [`TRUST.md`](TRUST.md) and [`docs/DATA_PROVENANCE_AND_SOURCES.md`](docs/DATA_PROVENANCE_AND_SOURCES.md)
- **Citation**: See [`CITATION.cff`](CITATION.cff)
