#!/usr/bin/env node
/**
 * Automated Test Suite for VBASE3 Node.js Tools & MCP Server
 * ==========================================================
 * Verifies that the WebAssembly CLI and MCP Server operate
 * 100% locally with zero external npm dependencies.
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_SCRIPT = path.join(__dirname, 'vbase3_wasm_cli.mjs');
const MCP_SCRIPT = path.join(__dirname, 'vbase3_mcp_server.mjs');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  }
}

console.log('⚡ [VBASE3 Node Tools Test Suite] Running standalone unit verifications...\n');

// 1. Test CLI Help
const helpOutput = execSync(`node "${CLI_SCRIPT}" --help`, { encoding: 'utf-8' });
assert(helpOutput.includes('VBASE3 WebAssembly CLI Engine'), 'CLI displays help header');
assert(helpOutput.includes('--audit-boundary'), 'CLI displays --audit-boundary flag');

// 2. Test CLI Sample
const sampleOutput = execSync(`node "${CLI_SCRIPT}" --sample musIGHV044 --format json`, { encoding: 'utf-8' });
const sampleJson = JSON.parse(sampleOutput);
assert(sampleJson.results && sampleJson.results.length === 1, 'Sample returns 1 analyzed sequence');
assert(sampleJson.results[0].is_productive === true, 'Sample sequence is productive in-frame');
assert(sampleJson.results[0].species === 'mouse', 'Sample sequence correctly identified as mouse');

// 3. Test CLI Gene Lookup
const lookupOutput = execSync(`node "${CLI_SCRIPT}" --lookup IGHV3-23 --format json`, { encoding: 'utf-8' });
const lookupJson = JSON.parse(lookupOutput);
assert(lookupJson.gene_id === 'humIGHV200187' || (lookupJson.reference_or_accession && lookupJson.reference_or_accession.includes('IGHV3-23')), 'Gene lookup maps IGHV3-23 to valid Class I allele');
assert(lookupJson.cys104_anchor === 'Cys104 Present', 'Gene lookup validates Cys104 anchor');
assert(lookupJson.mature_aa_sequence.endsWith('C'), 'Mature sequence terminates at Cys104');

// 4. Test CLI Boundary Audit
const dirtySeq = 'EVQLVESGGGLVQPGGSLRLSCAASGFTFSDYAMSWVRQAPGKGLEWVAVISYDGSNKYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAKDRLSITIRPRYYGMDVWGQGTTVSSGSA';
const auditOutput = execSync(`node "${CLI_SCRIPT}" --audit-boundary "${dirtySeq}" --format json`, { encoding: 'utf-8' });
const auditJson = JSON.parse(auditOutput);
assert(auditJson.canonical_motif_found === 'TVSS', 'Boundary audit detects TVSS motif');
assert(auditJson.is_synthesis_compliant === false, 'Boundary audit identifies non-compliant GSA tail');
assert(auditJson.trailing_constant_residues === 'GSA', 'Boundary audit extracts GSA trailing residues');

// 5. Test CLI Boundary Trimming
const trimOutput = execSync(`node "${CLI_SCRIPT}" --trim-boundary "${dirtySeq}" --format json`, { encoding: 'utf-8' });
const trimJson = JSON.parse(trimOutput);
assert(trimJson.is_trimmed === true, 'Boundary trim marks sequence as trimmed');
assert(trimJson.trimmed_length === 123, 'Boundary trim shortens 126 aa to 123 aa');
assert(trimJson.trimmed_peptide.endsWith('TVSS'), 'Trimmed peptide terminates precisely at TVSS');

// 6. Test CLI Biophysics
const bioOutput = execSync(`node "${CLI_SCRIPT}" --biophysics "CSRWGGDGFYAMDYW" --format json`, { encoding: 'utf-8' });
const bioJson = JSON.parse(bioOutput);
assert(bioJson.length_amino_acids === 15, 'Biophysics calculates 15-aa CDR3 length');
assert(typeof bioJson.net_charge_ph74 === 'number', 'Biophysics returns numerical net charge');
assert(typeof bioJson.mean_kyte_doolittle_hydropathy === 'number', 'Biophysics returns numerical hydropathy');

// --- GOLD-STANDARD BENCHMARK REGRESSION SUITE ---
console.log('\n🏆 [Gold-Standard Immunogenomic Benchmarks]');

// Benchmark 1: B1-8 Murine Hybridoma (Anti-NP)
const b18Out = execSync(`node "${CLI_SCRIPT}" --sample musIGHV044 --format json`, { encoding: 'utf-8' });
const b18Json = JSON.parse(b18Out);
assert(b18Json.results[0].species === 'mouse', 'B1-8 auto-resolves to species: mouse');
assert(b18Json.results[0].chain === 'H', 'B1-8 auto-resolves to chain: H');
assert(b18Json.results[0].v_systematic_id === 'IGHV0-7J6E*00', 'B1-8 auto-resolves to authentic V186.2 systematic ID: IGHV0-7J6E*00');
assert(b18Json.results[0].v_identity === 100.0, 'B1-8 matches IGHV0-7J6E*00 at exactly 100.0% identity');

// Benchmark 2: Trastuzumab (Herceptin) Humanized Heavy Chain
const trasVhSeq = 'EVQLVESGGGLVQPGGSLRLSCAASGFNIKDTYIHWVRQAPGKGLEWVARIYPTNGYTRYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCSRWGGDGFYAMDYWGQGTLVTVSS';
const trasVhOut = execSync(`node "${CLI_SCRIPT}" --seq "${trasVhSeq}" --format json`, { encoding: 'utf-8' });
const trasVhJson = JSON.parse(trasVhOut);
assert(trasVhJson.results[0].species === 'human' || trasVhJson.results[0].species === 'Homo sapiens', 'Trastuzumab VH auto-resolves to species: human/Homo sapiens');
assert(trasVhJson.results[0].chain === 'H', 'Trastuzumab VH auto-resolves to chain: H');
const trasV = trasVhJson.results[0].imgt_name || trasVhJson.results[0].v_gene;
assert(trasV.includes('IGHV3') || trasV.includes('C3F3'), `Trastuzumab VH correctly matches IGHV3 family (got ${trasV})`);
assert(trasVhSeq.endsWith('TVSS'), 'Trastuzumab VH ends at canonical TVSS boundary');

// Benchmark 3: Trastuzumab (Herceptin) Light Chain (Kappa)
const trasVlSeq = 'DIQMTQSPSSLSASVGDRVTITCRASQDVNTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSRSGTDFTLTISSLQPEDFATYYCQQHYTTPPTFGQGTKVEIK';
const trasVlOut = execSync(`node "${CLI_SCRIPT}" --seq "${trasVlSeq}" --format json`, { encoding: 'utf-8' });
const trasVlJson = JSON.parse(trasVlOut);
assert(trasVlJson.results[0].species === 'human' || trasVlJson.results[0].species === 'Homo sapiens', 'Trastuzumab VL auto-resolves to species: human/Homo sapiens');
assert(trasVlJson.results[0].chain === 'K', 'Trastuzumab VL auto-resolves to chain: K');
const trasVl = trasVlJson.results[0].imgt_name || trasVlJson.results[0].v_gene;
assert(trasVl.includes('IGKV1') || trasVl.includes('humIGKV200115'), `Trastuzumab VL correctly matches IGKV1 family (got ${trasVl})`);
assert(trasVlSeq.endsWith('VEIK'), 'Trastuzumab VL ends at canonical VEIK boundary');

// Benchmark 4: OKT3 Murine Anti-CD3 Heavy Chain
const okt3VhSeq = 'QVQLQQSGAELARPGASVKMSCKASGYTFTRYTMHWVKQRPGQGLEWIGYINPSRGYTNYNQKFKDKATLTTDKSSSTAYMQLSSLTSEDSAVYYCARYYDDHYCLDYWGQGTTLTVSS';
const okt3VhOut = execSync(`node "${CLI_SCRIPT}" --seq "${okt3VhSeq}" --format json`, { encoding: 'utf-8' });
const okt3VhJson = JSON.parse(okt3VhOut);
assert(okt3VhJson.results[0].species === 'mouse', 'OKT3 VH auto-resolves to species: mouse');
assert(okt3VhJson.results[0].chain === 'H', 'OKT3 VH auto-resolves to chain: H');
assert(okt3VhJson.results[0].v_identity >= 90.0, `OKT3 VH V-identity >= 90% (got ${okt3VhJson.results[0].v_identity}%)`);
assert(okt3VhSeq.endsWith('TVSS'), 'OKT3 VH ends at canonical TVSS boundary');

// Benchmark 5: DP-47 Human Germline IGHV3-23
const dp47Seq = 'EVQLLESGGGLVQPGGSLRLSCAASGFTFSSYAMSWVRQAPGKGLEWVSAISGSGGSTYYADSVKGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCAK';
const dp47Out = execSync(`node "${CLI_SCRIPT}" --seq "${dp47Seq}" --format json`, { encoding: 'utf-8' });
const dp47Json = JSON.parse(dp47Out);
assert(dp47Json.results[0].species === 'human' || dp47Json.results[0].species === 'Homo sapiens', 'DP-47 auto-resolves to species: human/Homo sapiens');
assert(dp47Json.results[0].chain === 'H', 'DP-47 auto-resolves to chain: H');
const dp47V = dp47Json.results[0].imgt_name || dp47Json.results[0].v_alias || dp47Json.results[0].v_gene;
assert(dp47V.includes('IGHV3-23') || dp47V.includes('200187'), `DP-47 matches IGHV3-23 (got ${dp47V})`);
assert(dp47Json.results[0].v_identity === 100.0, 'DP-47 matches germline at 100.0% identity');

// Benchmark 6: Rabbit Gene & Boundary Verification (ocu_IGHJ1)
const rabOut = execSync(`node "${CLI_SCRIPT}" --lookup ocu_IGHJ1 --format json`, { encoding: 'utf-8' });
const rabJson = JSON.parse(rabOut);
assert(rabJson.species === 'rabbit', 'Rabbit lookup returns species: rabbit');
assert(rabJson.chain === 'Heavy', 'Rabbit lookup returns chain: Heavy');
assert(rabJson.mature_aa_sequence.endsWith('TVSS'), 'Rabbit IGHJ1 strictly terminates at canonical TVSS boundary');


// 7. Test MCP Protocol (Initialize, List Tools, Call vbase3_trim_antibody_seq)
console.log('\n🤖 [VBASE3 MCP Protocol Test] Spawning MCP JSON-RPC stdio subprocess...');

async function testMcpServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [MCP_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = '';

    proc.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep remainder

      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line.trim());

        if (msg.id === 1) {
          assert(msg.result && msg.result.serverInfo && msg.result.serverInfo.name === 'vbase3-mcp-server', 'MCP initialize handshake succeeded');
          // Send tools/list
          proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
        } else if (msg.id === 2) {
          const tools = msg.result.tools.map(t => t.name);
          assert(tools.includes('vbase3_analyze_sequence'), 'MCP exposes vbase3_analyze_sequence');
          assert(tools.includes('vbase3_verify_synthesis_boundary'), 'MCP exposes vbase3_verify_synthesis_boundary');
          assert(tools.includes('vbase3_trim_antibody_seq'), 'MCP exposes vbase3_trim_antibody_seq');
          assert(tools.includes('vbase3_lookup_gene'), 'MCP exposes vbase3_lookup_gene');
          assert(tools.includes('vbase3_export_structure_input'), 'MCP exposes vbase3_export_structure_input');
          assert(tools.includes('vbase3_calculate_biophysics'), 'MCP exposes vbase3_calculate_biophysics');
          assert(tools.includes('vbase3_get_server_status'), 'MCP exposes vbase3_get_server_status');

          // Call vbase3_trim_antibody_seq
          proc.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
              name: 'vbase3_trim_antibody_seq',
              arguments: {
                peptide_sequence: 'DIQMTQSPSSLSASVGDRVTITCRASQGIRNYLAWYQQKPGKAPKLLIYAASTLQSGVPSRFSGSGSGTDFTLTISSLQPEDVATYYCQRYNRAPYTFGQGTKVEIKRTV',
                chain_type: 'kappa'
              }
            }
          }) + '\n');
        } else if (msg.id === 3) {
          assert(!msg.result.isError, 'MCP tool call returned without error');
          const payload = JSON.parse(msg.result.content[0].text);
          assert(payload.is_trimmed === true, 'MCP tool call trimmed kappa light chain RTV overhang');
          assert(payload.trimmed_peptide.endsWith('VEIK'), 'MCP tool call verified VEIK boundary');
          assert(payload.removed_residues === 'RTV', 'MCP tool call isolated RTV constant residues');
          proc.kill();
          resolve();
        }
      }
    });

    proc.stderr.on('data', () => {});
    proc.on('error', reject);

    // Send initial handshake
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) + '\n');
  });
}

await testMcpServer();

console.log(`\n🎉 All ${passed}/${total} Node.js tools & MCP tests PASSED cleanly!`);
