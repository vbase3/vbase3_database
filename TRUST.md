# VBASE3 Reference Trust Specification & Data Strata Architecture

**VBASE3 Release 1.0.0 (Zenodo Deposit & Archival Reference)**  
*Single Ground Truth Documentation, Cryptographic Provenance, and Gating Policy*

---

## 1. Executive Summary & The Trust Bar

VBASE3 provides an audited, zero-cloud-leakage, comparative immunogenomics reference and WebAssembly analysis engine for vertebrate B-cell and T-cell receptors across 53 species.

To meet the highest standards of scientific trust (IMGT/OGRDB caliber), VBASE3 establishes an **unbroken chain of identity**:
$$\text{Query Sequence} \longrightarrow \text{Gene Call (WASM)} \longrightarrow \text{Systematic ID} \longrightarrow \text{Row in Deposited Master TSV} \longrightarrow \text{Identical Nucleotide/AA Sequence}$$

This document formalizes the data strata, defines what is shipped in this Zenodo deposit versus what remains in the internal research partition, and publishes immutable cryptographic hashes for all released components.

---

## 2. Three-Tier Data Strata Architecture

VBASE3 stratifies immunogenomic evidence into three explicit tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STRATUM 1: Raw Genomic Scaffolds (NCBI / Ensembl / Vertebrate Genomes)     │
│  • Chromosome assemblies, raw BACs, and contigs across vertebrate taxa.     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ RSS & Annotation Pipeline
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STRATUM 2: Locus Germlines (Internal Research Partition: 8,329 entries)   │
│  • 8,329 annotated V/D/J segments identified by RSS motif scanning in 43   │
│    species TSVs (`data/vbase3/functional/`).                                │
│  • Class II (Germline Only): Valid locus genes awaiting physiological SHM  │
│    or rearrangement evidence from public deep-sequencing repertoires.       │
│  • Intentionally retained in research repository; NOT mixed into public    │
│    Class I production release catalogs.                                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Physiological Repertoire Verification
                                       │ (≥ 75% identity, mature FR1→Cys104)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STRATUM 3: Class I Master Catalog (Deposited Public Reference: 2,856 entries) │
│  • Exactly 2,856 confirmed functional genes across 36 benchmark vertebrate  │
│    species (with 17 additional vertebrate taxa reserved in roadmap).        │
│  • Shipped in this Zenodo release (`vbase3_class1_master_catalog.tsv`).     │
│  • Backed by direct physiological rearranged repertoire evidence.           │
│  • Synthesis-ready coding DNA for all 1,844 Nucleotide-Verified records     │
│    (1,839 unambiguous; 5 with documented IUPAC ambiguity codes); 1,012      │
│    Protein-Only records require in silico codon optimization.               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Stratum 2 (8,329 entries) is Not Shipped in the Class I Deposit
Under the **VBASE3 Class I Export Mandate**:
> *Any public release or exported production catalog of VBASE3 MUST contain Class I entries only (confirmed functional with physiological rearranged repertoire evidence). Class II entries (germline-only, unconfirmed by repertoire) remain in internal research partitions and must never be mixed into public production catalogs.*

Advertising 8,329 as a public deposit file count was an inventory conflation between the internal research partition and the public Class I export. **The single, authoritative Class I deposit metric is 2,856 records across 36 confirmed vertebrate species (with 17 reserved taxa).**

---

## 3. Single Ground Truth Chain: Call Resolution Architecture

To eliminate orphan gene calls and naming ambiguity, the VBASE3 runtime resolver (`GeneResolver`) navigates a hierarchical index:

1. **Stratum 3 Master Catalog (`vbase3_class1_master_catalog.tsv`)**:
   - Authoritative primary identifier: `gene_id` (e.g., `humIGHV200187_02`, `Rab_Ighv_Rab_0001*0001`, `musIGHV200175`, `IGHV0-7J6E*00`).
   - Every entry matches the deposited sequence bit-for-bit.
2. **Rosetta Stone Cross-Reference (`vbase3_crossreference_table.tsv`, 3,900 rows)**:
   - Transparently bi-directionally cross-references historical nomenclatures:
     - **Tomlinson / VBASE (DP)**: `DP-47`, `V3-23`, etc.
     - **IMGT Nomenclature**: `IGHV3-23*01`, `IGHV1-72*01`, `IGKV1-39*01`, etc.
     - **VBASE2 Identifiers**: `humIGHV187`, `musIGHV057`, `V186.2`, etc.
     - **Kabat & GenBank Accessions**: PDB cross-references and AlphaFold model IDs.
3. **Stratum 2 Provenance Protection**:
   - Queries matching internal locus germlines (e.g., `IGHV0-WN4M*00`) resolve to their locus origin and are explicitly tagged:
     `reference_stratum: Stratum 2 (Locus Germline - Internal Research Partition)`
     `class: Class II (Germline Only)`
   - The engine never mislabels a Stratum 2 locus call as Stratum 3.

---

## 4. Synthesis Invariants & Structural Boundary Compliance

All sequences in the public deposit are validated against strict structural boundaries to prevent non-functional synthesis products or constant region bleed-through:

| Feature | Audit Metric | Compliance Rate | Verification Rule |
| :--- | :--- | :--- | :--- |
| **V-Gene C-terminal Boundary** | 2,650 / 2,650 V-genes | **100.0%** | Sequence extends from mature FR1 N-terminus and terminates **strictly at Cys104**. Trailing residues (`...CAR`, `...CAK`, etc.) are completely excised across 100% of deposited V-genes. |
| **Nucleotide Synthesis Readiness** | 1,844 / 1,844 Verified | **100.0%** | 1,844 `Nucleotide-Verified` records provide full-length validated coding DNA ready for direct chemical gene synthesis without codon translation ambiguity (1,839 unambiguous; 5 with documented IUPAC ambiguity codes S, M, N, X from source GenBank records). The remaining 1,012 historical entries are documented `Protein-Only Records` awaiting modern high-throughput sequencing confirmation, requiring in silico codon optimization prior to chemical synthesis. |
| **J-Gene Synthesis Boundary** | 113 / 113 J-segments | **100.0%** | Terminates strictly at canonical synthesis boundaries: `TVSS`/`TVSA` (Heavy, 59 seqs), `TVL`/`TAL` (Lambda/Rho, 26 seqs), `VEIK`/`LEIK`/`LELK`/`VDIK` (Kappa/Sigma, 28 seqs) with **zero constant region bleed-through** (`GSA`, `ASTK`, `RTV`, `GQPKAAPSD`). |
| **Natural J Polymorphisms** | 3 / 3 documented | **100.0%** | Documented natural germline functional variants: `LELK` in murine J$\kappa$5 (`mus_jk5`) and rat J$\kappa$1 (`rno_IGKJ1`); `TAL` in human IGLJ7*02 (`hum_IGLJ7*02`). All exhibit zero constant region bleed-through and are accepted synthesis standards. |
| **Reading Frame & Stop Codons (V & J)** | 2,763 / 2,763 V/J genes | **100.0%** | Mature reading frame verified (0 internal stop codons in Frame 0 for all functional V and J exons). |
| **D-Segment Reading Frames & Lengths** | 93 / 93 D-segments | **100.0%** | D-segments participate in multiple reading frames during CDR-H3 junctional joining. Because D-segments represent junctional diversity elements flanked by canonical 12-bp RSS, their genomic coding lengths need not be codon-complete multiples of three (62 D intervals differ by ~1 nt from 3× translated length). While 31 D-segments carry non-productive stop codons in Frame 0, they encode functional peptides in Frames 1 or 2 as expected for diversity elements. |

---

## 5. Cold-Blooded (Ectothermic) Vertebrates: Experimental Research Partition

Antigen receptor loci in cold-blooded vertebrates (amphibians such as *Xenopus*, teleost fish, and cartilaginous fish) diverge fundamentally from mammalian organization and are designated as an **Experimental Research Partition**:

1. **Somatic Indels & IMGT Alignment Incompatibility**:
   - In ectothermic vertebrates, AID-mediated somatic hypermutation (SHM) routinely generates **in-frame codon insertions and deletions (indels)** across CDRs and framework regions (as demonstrated by Du Pasquier, Hsu, Flajnik, and Litman).
   - Somatic insertions cause rigid IMGT positional numbering grids (which enforce fixed framework lengths) and ungapped alignment algorithms to fail due to phase-shift artifacts.
   - VBASE3 implements affine-gapped dynamic programming (`calc_gapped_identity`, `mode="auto"`) and phase-independent $k$-mer profiling to map somatically elongated variants back to their genomic germlines without artificial penalty.
2. **Repertoire Evidence Context**:
   - High-throughput NGS AIRR datasets do not exist for most cold-blooded species in SRA. Repertoire verification relies primarily on curated, full-length Sanger cDNA/mRNA sequences from classical literature (Du Pasquier & Hsu, Schwager, Flajnik).
3. **Non-Mammalian Genomic Organization**:
   - *Xenopus laevis* is an allotetraploid with two homeologous subgenomes: **Long (L)** and **Short (S)** chromosomes (e.g. `Chr8.L` and `Chr8.S` for IGH).
   - Cartilaginous fish (sharks, skates, rays) utilize clustered $[V-D-D-J-C]_n$ miniloci rather than single translocons.
   - Distinct light chain lineages (Ig$\rho$, Ig$\sigma$) and heavy isotypes (IgX, IgY, IgW, IgNAR) possess unique CDR3 and boundary motifs.
Users analyzing cold-blooded sequences should note that these taxa are subject to evolutionary invariants distinct from placental mammals.

---

## 6. Authoritative Manifest & Cryptographic Checksums (SHA-256)

Every file in the Zenodo deposit is cryptographically anchored. Any alteration in a single base pair or byte will invalidate these checksums:

```
1400ab423050e759f1aaec2b14663b09c5a1741d9547181ad7580a9651b7062c  gh_pages/pkg/dnaplot_wasm_bg.wasm
6acfacfd5a7a48af769bf53c919d74b9f59d46f2b48d55f1633262fb177f03b9  datasets/vbase3_class1_master_catalog.tsv
b27513cf2728ee6bc8dbef9bd2a646c06bfe62cfdbfde9e36a396cb1351a515c  datasets/vbase3_class1_evidence_catalog.tsv
2c841b498952678b0cdb3dfaf0ebe027f3fad2b973653ebe0b878ce200d0ba4e  datasets/vbase3_crossreference_table.tsv
ff2cdb2f11c7fae8bf3832f64dfc7c752cfb69afc4a6e38c9754fe4b82f8b6c3  datasets/tcrbase_germlines_curated.tsv
2cceea5539d9dbc6ce5aa68dd80618ee12343d498da87af471bf6c1db90f94ed  datasets/vbase3_class1_d_segments.tsv
637e91a89ba7b258a3ec83345071de5a4799896d2ad6c906019db4aa1f0f9a0e  datasets/vbase3_class1_j_segments.tsv
78250c74de81c770a3296f44c277fc94e5b8b4e9cd1ecb237e257fa7a2d1ee12  datasets/vbase3_53_species_summary.tsv
fd405735743ad1440d25cd2a6292c37ce99172f2048520fd176a7d811291b8d7  datasets/fasta/vbase3_class1_v_heavy.fasta
55ddcf57bbe0420d22467aa1ab2a4e7124e6cc05e2429015ffb7305039ed0dc3  datasets/fasta/vbase3_class1_v_light.fasta
994aa9c8265c8854d8ff36ed38bda073cef38a0d9a3e6761c300bb234d7f1a79  datasets/fasta/vbase3_class1_d_segments.fasta
8590445ca3a172dff937dfcc2859548e8bd732c153f3fd6e7cad2d1a0e17afb7  datasets/fasta/vbase3_class1_j_segments.fasta
f6fad4be291c0d9f03c4f85a728d1df16a414325f3581d5be2b618b5b634155f  manuscript_vbase3.pdf
```

---

## 7. Scope of Release: What VBASE3 Beta Is and Is Not For

### What VBASE3 Is Designed For:
- **Recombinant Gene Synthesis**: Full-length validated coding DNA provided for all 1,844 Nucleotide-Verified records with zero downstream constant region contamination; 1,012 Protein-Only records require in silico codon optimization prior to chemical synthesis.
- **Air-Gapped, Privacy-Preserving Sequence Analysis**: Fully functional client-side WebAssembly execution with zero sequence data transmitted over the internet (HIPAA / GDPR / Proprietary compliant).
- **Comparative Vertebrate Immunogenomics**: Comparative cross-species germline alignment across 36 benchmark vertebrate species with confirmed Class I functional repertoires (17 additional vertebrate taxa reserved in comparative roadmap).
- **AI & Structural Modeling Pipeline Input**: Formatted sequence handoffs to ColabFold, AlphaFold3, ESMFold, and Boltz-1.
- **Programmatic & Agentic AI Workflows**: Headless execution via Node.js CLI and Model Context Protocol (MCP) server.

### What VBASE3 Is Not For:
- **Diagnostic Clinical Decision-Making**: Provided strictly for Research Use Only (RUO). Clinical or diagnostic deployments require independent institutional and regulatory validation.
- **Unverified Pseudogene Cloning**: Does not include truncated pseudogene fragments in the Class I catalog without genomic locus and expression validation.
