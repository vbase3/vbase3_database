# VBASE3 Version Archive & Release Provenance

> **Permanent Scientific Reproducibility Guarantee**:  
> To ensure reproducible research and stable citations in antibody engineering and immunogenomics, every published version of VBASE3 is permanently archived with its own Zenodo DOI and immutable dataset snapshot. Users and automated pipelines can query or download any historical release at any time.

---

## 🏛️ Release Catalog & Version History

| Release Version | Release Date | Zenodo DOI | Master Catalog Snapshot | Confirmed Genes | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`v1.0.0-beta`** | Oct 3, 2026 | [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22923345.svg)](https://doi.org/10.5281/zenodo.22923345) | [`datasets/archive/v1.0.0-beta/`](datasets/archive/v1.0.0-beta/) | 2,890 tripartite segments | Initial public baseline release across 53 vertebrate species with full WebAssembly portals and AI tool suite. |

---

## 📁 Archived Files per Release

For each archived release, the following canonical dataset snapshots are frozen under `datasets/archive/<version>/`:

* `vbase3_class1_master_catalog.tsv`: Canonical Class I repertoire (confirmed functional with physiological rearranged evidence).
* `tcrbase_germlines_curated.tsv`: Complete curated TCR $\alpha$, $\beta$, $\gamma$, $\delta$ germline repertoire.
* `vbase3_crossreference_table.tsv`: Multi-database cross-reference mapping (IMGT, VBASE2, Tomlinson DP, Kabat, GenBank).
* `vbase3_class1_v_heavy.tsv` & `vbase3_class1_v_light.tsv`: Mature V-exons ending strictly at conserved Cys104.
* `vbase3_class1_d_segments.tsv` & `vbase3_class1_j_segments.tsv`: D and J segments ending strictly at canonical IMGT synthesis boundaries (`TVSS`/`TVSA` for Heavy, `TVL` for Lambda, `VEIK`/`LEIK` for Kappa).
* `vbase3_constant_regions.tsv`: Modular constant region cassettes.

---

## 🔒 Post-Release Gene Name Immutability Mandate

Under the **Gene Name Immutability Mandate**:
1. **Never Renumber**: Once a sequence is assigned an identifier in a release, that gene ID is strictly frozen and will **never** be renamed in subsequent updates.
2. **Backward-Compatible Expansions**: Future weekly or monthly releases add new candidate sequences under non-colliding systematic identifiers without altering any baseline mappings.
3. **Citations Remain Valid**: Any paper citing a sequence ID from `v1.0.0-beta` (or any archived version) will resolve identically across all future VBASE3 releases.

---

## 📥 How to Access a Previous Version

### 1. Direct Web / Repository Access
In the public GitHub repository:
```bash
git clone https://github.com/vbase3/vbase3_database.git
cd vbase3_database

# Inspect archived v1.0.0-beta catalog
head -n 20 datasets/archive/v1.0.0-beta/vbase3_class1_master_catalog.tsv
```

### 2. Git Tag Checkout
```bash
# Checkout the exact repository state of release v1.0.0-beta
git checkout v1.0.0-beta
```

### 3. Permanent Zenodo Archive
Download the complete, certified zip archive directly from Zenodo using the version-specific DOI:
* **Release v1.0.0-beta**: [https://doi.org/10.5281/zenodo.22923345](https://doi.org/10.5281/zenodo.22923345)
