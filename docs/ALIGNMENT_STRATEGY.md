# V-gene Alignment Strategy

## Overview

V-gene alignment is the critical first step in immunoglobulin sequence analysis. This document details the alignment strategy used in DNAPLOT.

## The Challenge

Input sequences typically contain:
1. **Leader sequence** (signal peptide) - 0-200+ nucleotides before mature V-gene
2. **Mature V-gene** - The actual V-region (~280-300 nt)
3. **D-segment** (heavy chains) - Variable length
4. **J-gene portion** - 3' end of the rearranged gene

We need to:
- Find the best matching germline V-gene
- Identify where the mature V-gene starts (leader offset)
- Apply IMGT gaps correctly
- Calculate accurate sequence identity

## Sliding Window Algorithm

### Basic Approach

```
Input:  [---LEADER---][----MATURE V-GENE----][D][J]
                      ^
                      Find this start position

For offset = 0 to max_offset:
    score = compare(input[offset:], v_gene)
    track best score and offset
```

### Offset Range Calculation

```rust
let input_len = input_sequence.len();
let v_gene_len = v_gene.len();

// Minimum overlap required for meaningful comparison
let min_overlap = 100;

// Maximum offset = how much leader we can skip
// while still having enough sequence to compare
let max_offset = input_len - min_overlap;

// Search range
for offset in (0..max_offset).step_by(3) {  // Step by codon
    // Compare at this offset
}
```

### Scoring Function

```rust
fn compare_offset(query: &str, master: &str, offset: usize) -> i64 {
    let query_slice = &query[offset..];
    let compare_len = query_slice.len().min(master.len());
    
    let mut score = 0i64;
    for i in 0..compare_len {
        let q = query_slice.chars().nth(i);
        let m = master.chars().nth(i);
        
        if q == m {
            score += MATCH_SCORE;      // +2
        } else if q == Some('.') || m == Some('.') {
            // Gap - no penalty for IMGT gaps
            score += 0;
        } else {
            score += MISMATCH_PENALTY; // -1
        }
    }
    
    // Length bonus - prefer longer alignments
    score += compare_len as i64 / 10;
    
    score
}
```

## Leader Detection

### The Problem

A sequence with a 200bp leader:
```
Input (485 nt): [--LEADER 200nt--][--V-GENE 285nt--]
V-gene DB (294 nt with gaps): [--V-GENE with IMGT gaps--]
```

If we compare from position 0:
- First 200 nt of input ≠ first 200 nt of V-gene
- Identity appears low (~30%)

### The Solution

1. **Sliding window** finds best offset (e.g., offset=200)
2. We now know: leader ends at position 200
3. Compare `input[200:]` to V-gene → ~99% identity

### Virtual Digest Prediction (Optional)

For faster searching, we can predict approximate leader length:
1. Find restriction enzyme patterns in input
2. Compare to known patterns in V-gene database
3. Use predicted offset as starting point

```rust
fn predict_offset_from_digest(input: &str, v_gene: &str) -> Option<usize> {
    // Find BamHI site positions
    let input_sites = find_restriction_sites(input, "GGATCC");
    let vgene_sites = find_restriction_sites(v_gene, "GGATCC");
    
    // Offset = difference in first site positions
    if !input_sites.is_empty() && !vgene_sites.is_empty() {
        Some(input_sites[0] - vgene_sites[0])
    } else {
        None
    }
}
```

## Gap Application

### After Finding Best Match

Once we have:
- Best V-gene match (with IMGT gaps)
- Leader offset

We apply gaps to the mature sequence:

```rust
// WRONG: Apply gaps at original offset
// let aligned = aligner.align(&input, &v_gene);

// CORRECT: Remove leader, then apply gaps at offset 0
let mature_seq = &input[leader_offset..];
let aligned = aligner.apply_gaps(&mature_seq, 0);
```

### How Gap Application Works

```
Master (with gaps): CAG.GTGCAG...
Query (no gaps):    CAGGTGCAG...
                       ^
                       Insert gap here

Result:             CAG.GTGCAG...
```

The `apply_gaps()` function:
1. Iterates through master sequence
2. Where master has gap, inserts gap in query
3. Where master has nucleotide, copies from query

## Identity Calculation

### After Alignment

```rust
fn calculate_identity(aligned_query: &str, aligned_master: &str) -> f64 {
    let mut matches = 0;
    let mut total = 0;
    
    for (q, m) in aligned_query.chars().zip(aligned_master.chars()) {
        // Skip gap positions
        if q == '.' || m == '.' {
            continue;
        }
        
        total += 1;
        if q.to_ascii_uppercase() == m.to_ascii_uppercase() {
            matches += 1;
        }
    }
    
    if total == 0 { return 0.0; }
    matches as f64 / total as f64
}
```

### Important: Compare Aligned Sequences

WRONG:
```rust
// Comparing gapped master to ungapped query
let identity = calculate_identity(&input, &master_with_gaps);  // ~60%
```

RIGHT:
```rust
// Both sequences aligned with gaps at same positions
let identity = calculate_identity(&aligned_query, &master_with_gaps);  // ~99%
```

## Complete Pipeline

```rust
pub fn find_and_align_v_gene(input: &str, species: &str, chain: ChainType) 
    -> Result<(String, f64, String), Error> 
{
    // 1. Load V-gene database
    let v_genes = load_v_genes(species, chain)?;
    
    // 2. Find best match with sliding window
    let mut best_score = i64::MIN;
    let mut best_match = None;
    let mut best_offset = 0;
    
    for v_gene in v_genes.iter() {
        let v_gene_gapfree: String = v_gene.data()
            .chars()
            .filter(|c| *c != '.')
            .collect();
        
        // Skip if lengths are incompatible
        let len_diff = (input.len() as i64 - v_gene_gapfree.len() as i64).abs();
        if len_diff > 250 { continue; }
        
        // Search for best offset
        let max_offset = input.len().saturating_sub(100);
        for offset in (0..max_offset).step_by(3) {
            let score = compare_offset(input, &v_gene_gapfree, offset);
            if score > best_score {
                best_score = score;
                best_match = Some(v_gene.clone());
                best_offset = offset;
            }
        }
    }
    
    let best_v = best_match.ok_or("No V-gene match found")?;
    
    // 3. Remove leader and apply gaps
    let mature_seq = &input[best_offset..];
    let aligner = Aligner::new();
    let aligned = aligner.apply_gaps(mature_seq, best_v.data(), 0);
    
    // 4. Calculate identity
    let identity = calculate_identity(&aligned, best_v.data());
    
    Ok((aligned, identity, best_v.name().to_string()))
}
```

## Optimization Tips

1. **Step by 3**: Search offsets in codon steps for speed
2. **Length filter**: Skip V-genes with vastly different lengths
3. **Early termination**: If score > threshold, can stop (but careful with leaders)
4. **Parallel search**: Use rayon to search V-genes in parallel
5. **Pre-sort database**: Search most common V-genes first

