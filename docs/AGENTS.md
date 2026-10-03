# AI Agent Guide for VBASE3 Public Repository

Welcome, AI Agent! This guide instructs autonomous AI assistants (Claude, Cursor, Antigravity, GitHub Copilot, Codex, and custom LLM agents) on how to navigate, query, and utilize the VBASE3 database and WebAssembly sequence analysis tools efficiently and accurately.

---

## 🧭 Repository Architecture & Navigation

This public repository is structured into four functional zones:

1. **`datasets/` (The Canonical Immunogenomics Database)**:
   - `vbase3_class1_master_catalog.tsv`: 2,856 confirmed functional V, D, and J genes across 36 benchmark vertebrate taxa.
   - `tcrbase_germlines_curated.tsv`: 3,114 curated TCR genes (TRA, TRB, TRG, TRD) across 31 vertebrate species.
   - `vbase3_crossreference_table.tsv`: 3,900 cross-mappings linking IMGT, VBASE2, Tomlinson DP nomenclature, and INSDC/GenBank accessions.
   - `vbase3_class1_d_segments.tsv` & `vbase3_class1_j_segments.tsv`: Core diversity and joining segments.
   - `vbase3_constant_regions.tsv`: 108 modular constant cassettes with INSDC/GenBank accession links.
   - `datasets/fasta/`: Complete nucleotide and amino acid FASTA libraries for Heavy, Light, D, J, and C.
   - Full column definitions and schemas are in [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md).

2. **`node_tools/` (Headless WebAssembly Tools & Model Context Protocol)**:
   - `vbase3_wasm_cli.mjs`: Standalone CLI runner wrapping the compiled WebAssembly sequence analysis engine (`pkg/dnaplot_wasm_bg.wasm`).
   - `vbase3_mcp_server.mjs`: Model Context Protocol (MCP) JSON-RPC 2.0 stdio server for native tool-calling AI agents.
   - `test_node_tools.mjs`: 52 standalone unit verifications. Run with: `node node_tools/test_node_tools.mjs`.

3. **`docs/` (Authoritative Documentation & Provenance)**:
   - `DATA_DICTIONARY.md`: Column schemas and data types.
   - `DATA_PROVENANCE_AND_SOURCES.md`: Traceability to INSDC, IMGT, VBASE2, and Ensembl.
   - `WEB_PORTAL_DATASET_PROVENANCE.md`: Provenance of benchmark antibody clones and controls.
   - `MCP_SERVER_GUIDE.md`: Step-by-step setup guide for Claude Desktop, Cursor, and IDEs.
   - `VBASE3_PORTAL_DIRECTORY.md`: Sitemap of all interactive web visualizers.
   - `MUST_READ_BEFORE_USING.md` & `.pdf`: Official community advisory notice.

4. **Root Web Portals (Zero-Backend WebAssembly)**:
   - 26 static HTML5 web analyzers (`human_vbase3_analyzer.html`, `mouse_vbase3_analyzer.html`, `camelid_vbase3_analyzer.html`, `index.html`) hosted via GitHub Pages at `https://vbase3.github.io/vbase3_database/`.

---

## ⚡ Fast Sequence Analysis via CLI (`node_tools/vbase3_wasm_cli.mjs`)

**Do NOT attempt to parse antibody sequences or align germlines via LLM prompt heuristics.** Always use the compiled WebAssembly CLI for sub-millisecond, biologically accurate results:

```bash
# 1. Full sequence alignment, IMGT numbering, CDR loops, and productivity:
node node_tools/vbase3_wasm_cli.mjs --seq "EVQLVESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAK" --format json

# 2. Audit synthesis boundaries for recombinant expression:
node node_tools/vbase3_wasm_cli.mjs --audit-boundary "EVQLVESGGGLVQPGGSLRLSCAAS...WGQGTLVTVSSGSA" --format json

# 3. Trim constant region bleed-through to canonical IMGT J-boundary:
node node_tools/vbase3_wasm_cli.mjs --trim-boundary "EVQLVESGGGLVQPGGSLRLSCAAS...WGQGTLVTVSSGSA" --format json

# 4. Instant Class I gene lookup (resolves IMGT symbols and VBASE IDs):
node node_tools/vbase3_wasm_cli.mjs --lookup IGHV3-23 --format json

# 5. Calculate CDR3 biophysical profile (length, net charge, hydropathy):
node node_tools/vbase3_wasm_cli.mjs --biophysics "CSRWGGDGFYAMDYW" --format json
```

---

## 🛡️ Critical Biological Invariants for Sequence Design

When assisting users with antibody or TCR synthesis, engineering, or cloning, you **MUST STRICTLY ENFORCE** these boundary rules:

1. **Heavy Chain (VH) Boundary**:
   - Variable heavy domains MUST terminate strictly at the `TVSS` or `TVSA` motif (IMGT position 122).
   - Strip any constant region residues appended after this motif (e.g. `GSA`, `ASTKGP`).
2. **Light Chain (VL) Boundary**:
   - **Lambda Chains (IGL)**: Must terminate strictly at `TVL` or `TAL` (IMGT position 117). Strip any constant residues (e.g. `GQPKAAPSD`, `GQPKAAPSV`).
   - **Kappa Chains (IGK)**: Must terminate strictly at `VEIK`, `LEIK`, `VDIK`, `LDIK`, or `LELK` (IMGT position 117). Strip any constant residues (e.g. `RTV`, `RTVAAPS`).
3. **Mature V-Gene Window**:
   - Mature V-genes terminate strictly at conserved Cys104 (IMGT position 104). Signal peptides must be cleaved; hypervariable V(D)J junctional CDR3 is excluded.
4. **VHH Specificity**:
   - Only Camelidae (alpaca, llama, camel) possess VHH single-domain antibodies. Human and rodent antibodies are conventional heterotetrameric paired $V_H:V_L$ chains.

---

## 🤖 Model Context Protocol (MCP) Setup

To connect VBASE3 directly to your AI toolbelt (Claude Desktop, Cursor, Antigravity, etc.), configure the stdio server:

```json
{
  "mcpServers": {
    "vbase3": {
      "command": "node",
      "args": ["<path-to-repo>/node_tools/vbase3_mcp_server.mjs"]
    }
  }
}
```

Exposed MCP tools:
- `vbase3_analyze_sequence`: Full V(D)J alignment, IMGT numbering, CDR1/2/3 loop detection, SHM counts.
- `vbase3_verify_synthesis_boundary`: Audits sequences for constant region bleed-through.
- `vbase3_trim_antibody_seq`: Truncates sequences cleanly at canonical synthesis boundaries.
- `vbase3_lookup_gene`: Sub-millisecond lookup across Class I vertebrate genes.
- `vbase3_calculate_biophysics`: Net charge, hydropathy, and CDR3 length.
- `vbase3_export_structure_input`: Formats paired FASTA for AlphaFold3, ColabFold, Boltz, and ESMFold.

---

## 💡 Token Economy & Context Guidelines

* **Do NOT read entire large TSV or FASTA files into prompt context.** `vbase3_class1_master_catalog.tsv` is ~1 MB (2,856 rows). Instead, filter with standard command-line tools:
  ```bash
  # Filter master catalog by species or locus:
  awk -F'\t' '$2 == "human" && $4 == "IGH" {print $1, $3, $5}' datasets/vbase3_class1_master_catalog.tsv | head -n 20
  ```
* **Consult [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md)** for exact column names and definitions before writing scripts.
* **Run health check**: To verify the environment, run `node node_tools/test_node_tools.mjs` (all 52 tests should pass in < 1 second).
