# VBASE3 Model Context Protocol (MCP) Server Guide

## Overview

The **VBASE3 MCP Server** (`developer_scripts/vbase3_mcp_server.mjs`) allows AI assistants and agentic coding environments (such as **Google Antigravity IDE**, **Claude Desktop**, **Cursor**, and custom LLM agents) to directly invoke the high-performance VBASE3 WebAssembly engine via standard JSON-RPC 2.0 over `stdio`.

Because the underlying engine runs as zero-dependency WebAssembly (`web/static/pkg/dnaplot_wasm_bg.wasm`), all sequence alignments, germline lookups, and synthesis boundary audits execute **100% locally** within milliseconds. Proprietary therapeutic antibody sequences never leave your machine.

---

## Exposed MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `vbase3_analyze_sequence` | `sequence`, `species`, `chain` | Performs full V(D)J alignment, IMGT unique numbering (positions 1–128), CDR1/2/3 loop detection, somatic hypermutation (SHM) counts, and in-frame productivity analysis. |
| `vbase3_verify_synthesis_boundary` | `sequence`, `chain_type` | Audits variable heavy/light domain sequences for recombinant gene synthesis design. Verifies canonical C-terminal motifs (`TVSS`/`TVSA` for Heavy; `VEIK`/`LEIK`/`TVL` for Light) and flags any trailing constant region bleed-through. |
| `vbase3_trim_antibody_seq` | `peptide_sequence`, `dna_sequence`, `chain_type` | Canonical sequence trimmer. Truncates trailing constant region overhang residues (e.g., `GSA`, `RTV`, `GQPKAAPSD`) from variable domain peptide and nucleotide sequences, terminating cleanly at the exact IMGT J-segment boundary. |
| `vbase3_lookup_gene` | `gene_id`, `species` | Sub-millisecond lookup of any Class I functional V-gene or allele across 55 vertebrate species. Supports IMGT symbols (e.g. `IGHV3-23*01`) and VBASE gene IDs (e.g. `humIGHV200187`). |
| `vbase3_export_structure_input` | `vh_sequence`, `vl_sequence`, `pipeline`, `identifier` | Formats paired synthesis-ready antibody VH/VL sequences for leading 3D structure prediction pipelines (`colabfold`, `alphafold3`, `esmfold`, `boltz`). Enforces synthesis boundaries before formatting. |
| `vbase3_calculate_biophysics` | `cdr3_amino_acid` | Calculates CDR3 loop length, net charge at physiological pH 7.4, and Kyte-Doolittle hydropathy index to assess solubility and off-target liabilities. |
| `vbase3_get_server_status` | *(none)* | Returns VBASE3 database release version, vertebrate species coverage, gating policies, and regulatory Research Use Only (RUO) notice. |

---

## Standalone Node.js WebAssembly CLI (`vbase3_wasm_cli.mjs`)

For command-line AI agents and headless batch environments, the standalone WASM CLI provides sub-millisecond execution with zero external npm dependencies:

```bash
# 1. Sub-millisecond Class I gene lookup (returns JSON)
node developer_scripts/vbase3_wasm_cli.mjs --lookup IGHV3-23 --format json

# 2. Audit synthesis boundary
node developer_scripts/vbase3_wasm_cli.mjs --audit-boundary "EVQL...TVSSGSA" --format json

# 3. Canonical boundary trimming
node developer_scripts/vbase3_wasm_cli.mjs --trim-boundary "EVQL...TVSSGSA" --format json

# 4. CDR3 Biophysical profile
node developer_scripts/vbase3_wasm_cli.mjs --biophysics "CSRWGGDGFYAMDYW" --format json

# 5. Format paired FASTA for AlphaFold/ColabFold
node developer_scripts/vbase3_wasm_cli.mjs --structure "EVQL...TVSS" --vl "DIQM...VEIK" --pipeline colabfold --format json
```

---

## Configuration

### 1. Claude Desktop Configuration
Add the server definition to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vbase3": {
      "command": "node",
      "args": [
        "/absolute/path/to/vbase3_database/developer_scripts/vbase3_mcp_server.mjs"
      ]
    }
  }
}
```

### 2. Google Antigravity IDE / Custom Agent Config
Add to your project or user MCP configuration (`.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "vbase3_immunogenomics": {
      "command": "node",
      "args": [
        "developer_scripts/vbase3_mcp_server.mjs"
      ]
    }
  }
}
```

---

## Example Interaction in an AI Assistant

### User:
> *"Analyze this variable heavy sequence for recombinant synthesis. Does it end cleanly at the canonical synthesis boundary?*
> `EVQLVESGGGLVQPGGSLRLSCAASGFTFSDYAMSWVRQAPGKGLEWVAVISYDGSNKYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAKDRLSITIRPRYYGMDVWGQGTTVSSGSA`"

### AI Assistant (Invoking `vbase3_verify_synthesis_boundary`):
```json
{
  "sequence_length": 126,
  "detected_chain_type": "heavy",
  "canonical_motif_found": "TVSS",
  "is_synthesis_compliant": false,
  "trailing_constant_residues": "GSA",
  "recommendation": "Remove trailing constant region residues 'GSA' to terminate cleanly at 'TVSS'."
}
```

### AI Response:
> "Your sequence contains a 3-amino acid constant-region overhang (`GSA`) after the canonical IMGT position 122 boundary. For recombinant gene synthesis, you must truncate the sequence to end precisely at `TVSS`:
> `...YYGMDVWGQGTTVSS`."

---

## Embedding Interactive Webviews in AI Environments

Because all VBASE3 web applications execute client-side WebAssembly, AI assistants can also serve and embed the interactive web applications directly within IDE panels, sidecars, or webviews:
- **Collier de Perles 2D Modal**: `https://vbase3.github.io/vbase3_database/dnaplot.html`
- **Single-Cell Repertoire Studio**: `https://vbase3.github.io/vbase3_database/single_cell_repertoire_studio.html`
- **Universal PaCMAP Manifold**: `https://vbase3.github.io/vbase3_database/vgene_pacmap_universe.html`

This architecture allows the LLM to perform deep sequence reasoning while embedding publication-ready interactive visualizations right in the developer's workspace.
