/* tslint:disable */
/* eslint-disable */
export function version(): string;
/**
 * Universal Single-Pass Multi-Species Antibody Analysis directly backed by Stratum 3 master catalog
 */
export function analyze_sequence_universal(sequence: string, name: string): any;
export function analyze_repertoire_batch(fasta_content: string, species_hint?: string | null): any;
/**
 * Runs PaCMAP dimensionality reduction directly on a pre-computed feature matrix in WebAssembly
 */
export function embed_matrix_pacmap(matrix_json: string, n_neighbors?: number | null, n_iters?: number | null, learning_rate?: number | null): any;
export function init(): void;
export function get_airr_tsv_header(): string;
/**
 * Detects species-specific structural and immunogenetic exceptions
 * (Camelid hydrophilic FR2 hallmarks, Rabbit Cys21-Cys79 inter-CDR disulfide,
 * Bovine stalk-knob ultralong loops, Canine lambda dominance, Avian gene conversion)
 */
export function detect_species_exceptions(aa_seq: string, species_hint?: string | null): any;
export function analyze_sequence(sequence: string, name: string, species_hint?: string | null, chain_hint?: string | null): any;
export function get_imgt_html(sequence: string, name: string, _name_format: string): string;
export function get_reference_stratum(): string;
/**
 * Zero-overhead hardware SIMD vector Hamming distance on WebAssembly (16 bytes per instruction)
 */
export function vector_hamming_distance(seq_a: string, seq_b: string): number;
export function parse_fasta_names(fasta_content: string): any;
/**
 * Classifies TCR rearrangements with Gamma/Delta and Alpha/Beta lineage resolution,
 * cross-locus rearrangement detection, and TRD tandem D-segment annotation.
 */
export function classify_tcr_rearrangement_wasm(v_gene: string, j_gene: string, c_gene?: string | null): any;
/**
 * Computes k-mer TF-IDF features and runs PaCMAP dimensionality reduction on antibody sequences in browser WebAssembly
 */
export function embed_sequences_pacmap(sequences_json: string, n_neighbors?: number | null, n_iters?: number | null, learning_rate?: number | null, max_kmers?: number | null): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly analyze_repertoire_batch: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly analyze_sequence: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number];
  readonly analyze_sequence_universal: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly classify_tcr_rearrangement_wasm: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly detect_species_exceptions: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly embed_matrix_pacmap: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
  readonly embed_sequences_pacmap: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly get_airr_tsv_header: () => [number, number];
  readonly get_imgt_html: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly get_reference_stratum: () => [number, number];
  readonly init: () => void;
  readonly parse_fasta_names: (a: number, b: number) => [number, number, number];
  readonly vector_hamming_distance: (a: number, b: number, c: number, d: number) => number;
  readonly version: () => [number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
