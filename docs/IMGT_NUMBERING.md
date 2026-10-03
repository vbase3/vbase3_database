# IMGT Numbering System

## Overview

IMGT (the international ImMunoGeneTics information system) provides a unique numbering system for immunoglobulin V-domains. This document explains how DNAPLOT implements this numbering.

## IMGT Positions

### Framework and CDR Regions

| Region | IMGT Positions | Codons | Notes |
|--------|---------------|--------|-------|
| FR1    | 1-26          | 1-78 nt | First framework |
| CDR1   | 27-38         | 79-114 nt | First hypervariable loop |
| FR2    | 39-55         | 115-165 nt | Second framework |
| CDR2   | 56-65         | 166-195 nt | Second hypervariable loop |
| FR3    | 66-104        | 196-312 nt | Third framework |
| CDR3   | 105-117       | 313-351 nt | Variable length! |
| FR4    | 118-128       | 352-384 nt | Fourth framework (J-region) |

### Key Anchor Positions

| Position | Amino Acid | Significance |
|----------|------------|--------------|
| 23 | CYS (C) | 1st-CYS - conserved |
| 41 | TRP (W) | Conserved TRP |
| 104 | CYS (C) | 2nd-CYS - marks end of FR3/start of CDR3 |
| 118 | TRP (W) | J-TRP (heavy chain) or PHE (light chain) - marks start of FR4 |

## Gap Handling

### Why Gaps Are Needed

Different V-genes have slightly different lengths in certain regions, but IMGT numbering must remain consistent. Gaps (represented as `.`) are inserted to maintain alignment.

### Standard Gap Positions

Common gap positions in V-genes:
- Position 10 (FR1)
- Position 31-32 (CDR1) - CDR1 can vary in length
- Position 60-62 (CDR2) - CDR2 can vary in length
- Position 73-74 (FR3)

### Example

```
Query:   CAGGTGCAGCTGGTGGAGTCTGGG...GGC---TACTGG
Master:  CAGGTGCAGCTGGTGGAGTCTGGG...GGC...TACTGG
         ^^^ Matching bases              ^^^ Gaps
```

## CDR3 Special Handling

CDR3 is variable in length and determined by:
1. **5' boundary**: 2nd-CYS (codon 312-314, position 104)
2. **3' boundary**: J-TRP (codon 352-354, position 118)

The actual CDR3 length depends on:
- V-gene 3' end
- D-segment (heavy chains)
- N-nucleotides
- J-gene 5' portion

### Junction vs CDR3

- **CDR3-IMGT**: Positions 105-117 (excludes anchor residues)
- **Junction**: Includes the anchor residues C and W
  - Heavy: From 2nd-CYS through J-TRP
  - Light: From 2nd-CYS through J-PHE

## Implementation Notes

### Calculating Position from Nucleotide Index

```rust
// For a gapped sequence:
// nt_position counts nucleotides (excluding gaps)
// imgt_position considers gaps
fn nt_to_imgt_position(aligned_seq: &str, nt_index: usize) -> usize {
    let mut nt_count = 0;
    for (i, c) in aligned_seq.chars().enumerate() {
        if c != '.' {
            if nt_count == nt_index {
                return i / 3 + 1;  // Convert to codon/position
            }
            nt_count += 1;
        }
    }
    0
}
```

### Extracting a Region

```rust
// Extract CDR1 (positions 27-38)
fn extract_cdr1(aligned_seq: &str) -> &str {
    let start_nt = (27 - 1) * 3;  // Position 27 → nucleotide 78
    let end_nt = 38 * 3;          // Position 38 → nucleotide 114
    &aligned_seq[start_nt..end_nt]
}
```

## Ruler System

DNAPLOT uses ruler files to display IMGT numbering:

### Ruler Types

1. **Position ruler**: Shows IMGT position numbers
2. **Nucleotide ruler**: Shows nucleotide positions within codons (1,2,3)
3. **FR/CDR ruler**: Shows region boundaries

### Example Display

```
IMGT Position:     1         2         3
Nucleotide:    123456789012345678901234567890...
FR/CDR:        <------- FR1 -------> <-- CDR1 -->
Sequence:      CAGGTGCAGCTGGTGGAGTCTGGGGGAGGC...
```

## Historical Heritage: `Vset` (Williams & Barclay, 1988) and the 1998 Numbering Standard

The genealogical foundation of the IMGT variable domain alignment traces directly to the structural definition of the Immunoglobulin Superfamily (IgSF) and the **V-set** domain alignment published by **Alan F. Williams and A. Neil Barclay** at the MRC Cellular Immunology Unit, Sir William Dunn School of Pathology, University of Oxford:

> **Williams, A. F., & Barclay, A. N.** (1988). The immunoglobulin superfamily—domains for cell surface recognition. *Annual Review of Immunology*, 6, 381–405. DOI: [10.1146/annurev.iy.06.040188.002121](https://doi.org/10.1146/annurev.iy.06.040188.002121)

Alan F. Williams was the pioneering architect of the IgSF concept, establishing the division between variable-like (V-set) and constant-like (C-set) domains. The **`Vset`** alignment format developed by Werner Müller built upon this structural foundation to establish a uniform coordinate system across variable domains. 

The `Vset` format was virtually identical to the eventual IMGT standardized numbering, with only a single coordinate difference: `Vset` positioned the canonical framework 1 (FR1) gap at position 11, whereas consortium discussions among the IMGT founders agreed to place the gap at position 10. 

Both the finalized **IMGT unique numbering system** and the 2D **Collier de Perles** (pearl necklace) graphical representations were formally published in the 1998 *Nucleic Acids Research* paper (*Lefranc, Giudicelli, Busin, Bodmer, Müller et al., 1998*).

## References

1. **Williams, A. F., & Barclay, A. N.** (1988). The immunoglobulin superfamily—domains for cell surface recognition. *Annual Review of Immunology*, 6, 381–405. DOI: [10.1146/annurev.iy.06.040188.002121](https://doi.org/10.1146/annurev.iy.06.040188.002121)
2. **Lefranc, M.-P., Giudicelli, V., Busin, C., Bodmer, J., Müller, W., Bontrop, R., Lemaitre, M., Malik, A., & Chaume, D.** (1998). IMGT, the international ImMunoGeneTics database. *Nucleic Acids Research*, 26(1), 297–303. DOI: [10.1093/nar/26.1.297](https://doi.org/10.1093/nar/26.1.297)
3. **Retter, I., Althaus, H.-H., Münch, R., & Müller, W.** (2005). VBASE2, an integrative V gene database. *Nucleic Acids Research*, 33(Database Issue), D671–D674. DOI: [10.1093/nar/gki088](https://doi.org/10.1093/nar/gki088)
4. **Lefranc, M.-P., Pommié, C., Ruiz, M., Giudicelli, V., Foulquier, E., Truong, L., Thouvenin-Contet, V., & Lefranc, G.** (2003). IMGT unique numbering for immunoglobulin and T cell receptor variable domains and Ig superfamily V-like domains. *Developmental and Comparative Immunology*, 27(1), 55–77.


