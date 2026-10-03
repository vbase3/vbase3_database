# VBASE3 Licensing, Copyright & IP Compliance Audit

**Project**: VBASE3 (Vertebrate Antibody & TCR Germline Universe)  
**Primary Author & Depositor**: Werner Müller, Emeritus Professor of Cellular Immunology, University of Manchester  
**Target License**: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/)  
**Audit Date**: September 2026  

---

## Executive Summary

A comprehensive intellectual property and licensing audit was conducted across all datasets, software components, web applications, third-party libraries, and documentation included in the `zenodo_submission/` release package.

**Conclusion**: **100% of the contents of VBASE3 are fully compatible with release under the Creative Commons Attribution 4.0 International (CC-BY-4.0) license.** There are zero proprietary encumbrances, non-commercial-only restrictions (NC), copyleft viral conflicts (GPL), or copyright infringements.

---

## 1. Primary Biological Data & Genomic Sources

| Data Source | Content Used | Original License / Legal Status | CC-BY-4.0 Compatibility | Notes & Legal Precedents |
| :--- | :--- | :--- | :---: | :--- |
| **INSDC (NCBI GenBank, ENA, DDBJ)** | Raw vertebrate genome assemblies, RefSeq chromosome records, and cDNA accessions | **Public Domain** (Worldwide) | **COMPATIBLE** | Nucleotide and amino acid sequences are uncopyrightable facts of nature under international jurisprudence (*Feist Publications v. Rural Telephone Service*, 499 U.S. 340; *Myriad Genetics*, 569 U.S. 576). INSDC policy places records in the public domain for unrestricted reuse. |
| **Vertebrate Genomes Project (VGP) & Ensembl** | High-coverage PacBio HiFi / Nanopore vertebrate assemblies across 53 species | **Open Data / CC-BY** | **COMPATIBLE** | Assemblies are released under open access for unrestricted comparative analysis and derivative annotation. |
| **NCBI SRA & ENA AIRR Reads** | Rearranged physiological repertoire sequencing runs for Class I validation | **Public Domain / Open Access** | **COMPATIBLE** | Short-read sequencing archives are public scientific datasets used for evidence-based validation. |
| **VBASE (MRC LMB, Cambridge)** | Historic Directory of Human V-genes ("DP" designations) | **Academic Public Directory** | **COMPATIBLE** | DP numbers (e.g. DP-47, DP-50) are standard scientific nomenclature established by Ian Tomlinson and Greg Winter (1992–1996), freely cited and cross-referenced in scientific literature. |
| **VBASE2 (GBF / TU Braunschweig)** | Cross-reference mappings, VBASE2 IDs, and evidence classification hierarchy | **Academic Open Access (NAR Database Issue)** | **COMPATIBLE** | **Werner Müller is the senior and corresponding author** (*Retter, Althaus, Münch, Müller, NAR 2005*). Curation methodology and cross-reference data are authored by the depositor. |
| **IMGT / WHO-IUIS Nomenclature** | Gene and allele symbols (`IGHV3-23*01`), accession cross-references | **Public Scientific Nomenclature** | **COMPATIBLE** | VBASE3 does **not** mirror or redistribute proprietary IMGT databases. VBASE3 variable exons are newly extracted from primary genome assemblies with cleaved signal peptides and exact Cys104 boundaries. IMGT symbols are used purely as standard WHO-IUIS scientific cross-references. |
| **TCRBase** | Curated T-cell receptor variable repertoires across 31 vertebrate species | **Original Work** (Werner Müller) | **COMPATIBLE** | Newly curated and classified by Werner Müller / VBASE3. |

---

## 2. Software, Libraries & Web Assets

| Component | Files / Location | Origin & Author | Upstream License | CC-BY-4.0 Compatibility |
| :--- | :--- | :--- | :--- | :---: |
| **WebAssembly Engine (`pkg/`)** | `pkg/dnaplot_wasm_bg.wasm`, `node_tools/pkg/` | Werner Müller & Antigravity (refactored from original C DNAPLOT) | Original Author Work | **COMPATIBLE (MIT)** |
| **Web Applications & Scripts** | `*.html`, `js/*.js` | Original scripts created for VBASE3 | Original Author Work | **COMPATIBLE** |
| **Node.js MCP Server & CLI Runner** | `node_tools/vbase3_mcp_server.mjs`, `node_tools/vbase3_wasm_cli.mjs` | Werner Müller & Antigravity | Original Author Work | **COMPATIBLE (MIT)** |
| **Benchmarking Suite** | `benchmarks/*.py` | Werner Müller & Antigravity | Original Author Work | **COMPATIBLE (MIT)** |
| **Open Dataset Catalogs** | `datasets/*.tsv`, `datasets/fasta/*.fasta` | VBASE3 Initiative | Creative Commons Attribution 4.0 | **COMPATIBLE (CC-BY-4.0)** |
| **D3.js Visualization Engine** | `js/d3.v7.min.js` (Self-Hosted) | Mike Bostock | **ISC License** (permissive, BSD-compatible) | **COMPATIBLE** |
| **Typography: Inter Font** | `fonts/inter-*.woff2` (Self-Hosted) | Rasmus Andersson | **SIL Open Font License 1.1 (OFL)** | **COMPATIBLE** |
| **Typography: Outfit Font** | `fonts/outfit-*.woff2` (Self-Hosted) | Rodrigo Fuenzalida | **SIL Open Font License 1.1 (OFL)** | **COMPATIBLE** |
| **Typography: Fira Code** | `fonts/fira-code-*.woff2` (Self-Hosted) | Nikita Prokopov | **SIL Open Font License 1.1 (OFL)** | **COMPATIBLE** |
| **Typography: JetBrains Mono** | `fonts/jetbrains-mono-*.woff2` (Self-Hosted) | JetBrains | **Apache License 2.0 / OFL** | **COMPATIBLE** |

---

## 3. Figures, Logos & Manuscripts

| Item | Location | Authorship | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Manuscript Preprint** | `manuscript_vbase3.pdf` | Werner Müller | Original Work (CC-BY-4.0) |
| **Advisory Notices & Guides** | `MUST_READ_BEFORE_USING.md`, `TRUST.md`, `AGENTS.md` | Werner Müller & Antigravity | Original Work (CC-BY-4.0) |
| **Figures & Logos** | Embedded in `manuscript_vbase3.pdf`, `images/` | Werner Müller & Antigravity | Original Work (CC-BY-4.0) |

---

## 4. Specific Legal Risk Assessments

### 4.1 Re-use of IMGT Gene Names
- **Question**: Does including IMGT gene and allele names in the cross-reference table infringe any database rights?
- **Finding**: **No.** IMGT gene designations (such as `IGHV1-69*01`) are the official, international nomenclature sanctioned by the **WHO-IUIS Nomenclature Sub-Committee for Immunoglobulins and T-cell Receptors**. Citing or mapping scientific names and accession numbers in comparative tables constitutes fair scientific use and standard bibliographic cross-referencing. VBASE3 does not replicate IMGT database schemas or proprietary software.

### 4.2 Re-use of VBASE and VBASE2
- **Question**: Can VBASE DP names and VBASE2 IDs be distributed in the cross-reference catalog?
- **Finding**: **Yes.** Werner Müller was a founding investigator and senior author of VBASE2 (*Retter et al., 2005*). VBASE DP numbers are historical public domain scientific designations dating from 1992. Both are fully authorized for open dissemination under CC-BY-4.0.

### 4.3 Client-Side WebAssembly Privacy
- **Finding**: By design, the publicly facing web portal runs all alignment, analysis, and visualization logic **100% on the client side via WebAssembly**. No user sequence data is ever transmitted to or logged on any external server. This guarantees that third-party researchers and biotherapeutic developers can analyze proprietary or clinical sequences with zero risk of intellectual property leakage.

---

## 5. Formal Certification

The depositor certifies that:
1. All data and materials included in `zenodo_submission/` were obtained and curated in full accordance with international academic norms and open-science best practices.
2. No third-party copyright, patent, trademark, or confidentiality agreements are violated by releasing this package under CC-BY-4.0.
3. The dataset and software package are ready for unrestricted public deposit on **Zenodo** and submission to **Nucleic Acids Research** or **eLife**.
