# VBASE3 & TCRBase Dataset Dictionary

This directory contains the core public release datasets for **VBASE3 (Class I Confirmed Functional Master Catalog)**, the **VBASE3 Cross-Reference System**, and the **TCRBase Curated Master**.

All sequences in this release conform strictly to the **Class I Export Mandate**: only germline segments backed by direct physiological rearranged repertoire evidence ($\ge 75\%$ identity across the mature FR1$\rightarrow$Cys104 window) are included.

---

## 📁 File Manifest

| File | Description | Records | Primary Identifiers |
| :--- | :--- | :--- | :--- |
| `vbase3_class1_master_catalog.tsv` | Confirmed functional V, D, and J germline segments across 53 vertebrate species | 2,857 | `gene_id` (e.g., `humIGHV200187_02`, `Rab_Ighv_Rab_0001*0001`) |
| `vbase3_class1_evidence_catalog.tsv` | Machine-readable evidence catalog with genomic origins, 2+ supporting rearranged read accessions, and observed identity percentages | 2,857 | `gene_id`, `genomic_origin`, `rearranged_read_1_id`, `read_1_source_or_study`, `rearranged_read_2_id`, `read_2_source_or_study` |
| `vbase3_crossreference_table.tsv` | Unified cross-reference mapping across major historical nomenclatures | 3,900 | `systematic_id`, `vbase1_tomlinson_name`, `vbase2_id`, `imgt_name`, `kabat_id`, `ebi_accessions` |
| `vbase3_constant_regions.tsv` | Curated modular constant region cassettes across 7 species (secreted & membrane BCRs, TCR constants) | 108 | `id`, `species`, `gene`, `allotype`, `isotype`, `genbank_accession` |
| `tcrbase_germlines_curated.tsv` | Complete curated T-cell receptor ($\alpha, \beta, \gamma, \delta$) repertoire across 31 vertebrate taxa | 3,114 | `systematic_id`, `legacy_name`, `organism`, `locus`, `chain` |
| `vbase3_class1_d_segments.tsv` | Heavy chain diversity (D) segments with canonical RSS motifs | 93 | `gene_id`, `heptamer_5p`, `spacer_5p`, `heptamer_3p`, `spacer_3p` |
| `vbase3_class1_j_segments.tsv` | Joining (J) segments ending strictly at canonical synthesis boundaries | 113 | `gene_id`, `boundary_motif` (`TVSS`, `TVSA`, `TVL`, `VEIK`, `LEIK`, `LELK`, `VDIK`, `TAL`) |
| `vbase3_53_species_summary.tsv` | Summary statistics of locus assemblies across 53 vertebrate taxa | 53 species | `species_common_name`, `total_genomic_entries` |
| `fasta/vbase3_class1_v_heavy.fasta` | Variable Heavy (VH & VHH) nucleotide exons (mature FR1 to Cys104) | 2,201 | FASTA headers with metadata |
| `fasta/vbase3_class1_v_light.fasta` | Variable Light (VL: Kappa, Lambda, Rho, Sigma) nucleotide exons | 450 | FASTA headers with metadata |
| `fasta/vbase3_class1_j_segments.fasta` | Synthesis-ready J segments ending at canonical boundaries | 113 | FASTA headers with metadata |
| `fasta/vbase3_class1_d_segments.fasta` | Diversity segments with reading frame translations | 93 | FASTA headers with metadata |
| `fasta/vbase3_constant_regions.fasta` | Curated constant region cassettes across 7 species | 108 | FASTA headers with metadata |

---

## 🧬 Structural & Synthesis Boundary Rules

All sequences are pre-trimmed and verified for direct chemical gene synthesis and therapeutic antibody engineering:

1. **Heavy Chain V-genes (`IGHV`)**:
   - Signal peptide cleaved at canonical signal peptidase cleavage site.
   - Sequence extends from mature FR1 N-terminus to the **conserved second Cysteine (Cys104, IMGT position 104)** with 100.0% compliance (0 trailing residues beyond Cys104).
   - Downstream junctional and CDR3 residues are excluded to prevent junctional bias during combinatorial assembly.
2. **Light Chain V-genes (`IGKV`, `IGLV`, `IGRV`, `IGSV`)**:
   - Signal peptide cleaved at mature FR1 N-terminus.
   - Ends strictly at **Cys104** (100.0% compliance).
3. **Joining Segments (J-genes)**:
   - **Heavy Chain (`IGHJ`)**: Variable domain sequence ends strictly at **`TVSS`** (or `TVSA`) at IMGT position 122. All downstream constant region residues (e.g., `GSA`, `ASTK`) are excised (59 segments).
   - **Lambda / Rho Chains (`IGLJ`, `IGRJ`)**: Variable domain sequence ends strictly at **`TVL`** (or canonical physiological variant **`TAL`** in human IGLJ7*02) at IMGT position 117 (26 segments).
   - **Kappa / Sigma Chains (`IGKJ`, `IGSJ`)**: Variable domain sequence ends strictly at **`VEIK`**, **`LEIK`**, **`VDIK`**, **`LDIK`**, or canonical physiological variant **`LELK`** (murine J$\kappa$5, rat J$\kappa$1) at IMGT position 117 with zero constant region bleed-through (28 segments).
4. **Diversity Segments (`IGHD`)**:
   - Core coding region flanked by canonical 12-bp spacer RSS (`CACAGTG-12-ACAAAAACC` 5' and `GGTTTTTGT-12-CACTGTG` 3').

---

## 📋 Master Catalog Column Definitions (`vbase3_class1_master_catalog.tsv`)

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `gene_id` | String | Unique VBASE3 systematic identifier | `HSA_IGHV_C3F1.1055_02*01` |
| `species` | String | Organism common name | `human` |
| `segment_type` | String | Immunogenomic element type (`V-GENE`, `D-GENE`, `J-GENE`) | `V-GENE` |
| `chain_type` | String | Chain classification (`Heavy`, `Light`) | `Heavy` |
| `locus` | String | Genetic locus (`IGH`, `IGK`, `IGL`, etc.) | `IGH` |
| `vbase3_class` | String | Confidence classification (Class I Confirmed Functional) | `Class I (Confirmed Functional)` |
| `repertoire_evidence_count`| Integer| Number of independent rearranged clones matching this gene | `142` |
| `dna_sequence` | String | Coding nucleotide sequence | `CAGGTTCAGCTG...TACTGT` |
| `aa_sequence` | String | Translated mature amino acid sequence | `QVQLVQSG...AVYYC` |
| `boundary_or_rss` | String | Recombination Signal Sequence (RSS) or J-segment boundary | `CACAGTG` |
| `reference_or_accession` | String | Source assembly, chromosomal coordinates, or ENA accession | `hum_chr14:IGH` |
| `pdb_id` | String | Representative experimental 3D structures from Protein Data Bank (RCSB PDB) | `1IGY, 4G6A, 1OCW` |
| `alphafold_db_id` | String | AlphaFold Database model identifier (EMBL-EBI / DeepMind, linked via UniProt) | `AF-P01764-F1` |

---

## 🔗 Cross-Reference Table Column Definitions (`vbase3_crossreference_table.tsv`)

Provides Rosetta Stone equivalence mapping:
- `systematic_id`: VBASE3 canonical ID.
- `vbase1_tomlinson_name`: Historic MRC LMB Ian Tomlinson designation (e.g. `DP-47`, `DP-50`, `DP-7`, `DP-10`, `DP-14`).
- `vbase2_id`: VBASE2 database identifier (e.g. `humIGHV200`, `humIGKV001`).
- `vbase2_all_ids`: Aliases in VBASE2.
- `imgt_name`: Official IMGT gene and allele symbol (e.g. `IGHV3-23*01`).
- `imgt_all_names`: IMGT allelic variants sharing this mature sequence.
- `kabat_id`: Kabat Database accession (e.g. `Kabat:000142`).
- `ebi_accessions`: European Nucleotide Archive (ENA) / GenBank accessions.
- `species`: Organism.
- `segment_type`: V-GENE, D-GENE, J-GENE.
- `chain_type`: Heavy or Light.
- `locus`: IGH, IGK, IGL.
- `mature_aa_seq`: Mature amino acid sequence ending at Cys104.
- `pdb_id`: Cross-referenced experimental RCSB PDB structure IDs.
- `alphafold_db_id`: Cross-referenced AlphaFold DB model identifier (`AF-<UniProt>-F1`).

---

---

## 🛡️ Synthetic Sequence & Codon Optimization Safeguards

To safeguard Class I genomic authenticity against recombinant artifacts:
1. **Third-Position Synonymous GC Content ($GC_3$)**: Natural vertebrate immunoglobulin germlines exhibit $GC_3$ between $45\text{--}65\%$. Sequences with $GC_3 \ge 82\%$ are flagged for recombinant codon optimization.
2. **Optimal Codon Frequency ($F_{\text{opt}}$)**: Analyzes the fraction of degenerate residues utilizing the single preferred mammalian expression codon (e.g. CTG for Leu, GTG for Val, GAG for Glu). Recombinant synthesis constructs driving $F_{\text{opt}} \ge 80\%$ are segregated.
3. **Cloning Cassette Scars**: Restriction enzyme recognition sites frequently engineered into recombinant expression vectors (BstEII `GGTGACC` in J segments, AgeI `ACCGGT`, NheI `GCTAGC`, BsiWI `CGTACG`) are screened to block cloning vector bleed-through.

---

## 🔬 Decomposing Somatic Hypermutation vs. Recombinant Codon Optimization

When analyzing therapeutic antibodies (e.g., from clinical trials, patents, or expression vectors) against VBASE3 germlines, high apparent nucleotide divergence is frequently caused by recombinant codon optimization rather than physiological somatic hypermutation:

| Metric | Natural Physiological SHM | Recombinant Codon Optimization |
| :--- | :--- | :--- |
| **Primary Divergence Level** | Protein & Nucleotide (Affinity Maturation) | Nucleotide (Host Translation Optimization) |
| **Synonymous Fraction ($f_{\text{syn}}$)** | $20\text{--}35\%$ (non-synonymous mutations predominate) | **$70\text{--}90\%$** (predominantly silent changes) |
| **Wobble Position Shift ($\Delta GC_3$)** | $\Delta GC_3 \le 0$ (AID cytidine deamination transitions) | **$\Delta GC_3 = +15\%\text{ to }+35\%$** (heavy G/C bias at wobble position) |
| **Functional Impact** | Alters CDR antigen affinity & framework stability | Preserves protein sequence while optimizing CHO/HEK mRNA stability |

VBASE3 provides the canonical `analyze_somatic_vs_codon_optimization()` function (`vbase3_engine.sequence_utils`) to disentangle true functional amino acid substitutions ($dN$) from silent synonymous codon optimization ($dS$).



---

## 📜 License & Citation

- **Data License**: Creative Commons Attribution 4.0 International (CC-BY-4.0).
- **Attribution**: When using these datasets, cite the VBASE3 Zenodo DOI and the associated publication.
