
/**
 * Local sign helper (optional). CI uses keyless cosign; this is for dev only.
 * Usage: node scripts/sign.mjs <infile> <outfile.sig>
 */
import 'dotenv/config';
import { execSync } from 'child_process';

const infile = process.argv[2];
const outfile = process.argv[3] || `${infile}.sig`;
if (!infile) { console.error('Usage: node scripts/sign.mjs <infile> <outfile.sig>'); process.exit(1); }

try {
  execSync(`cosign sign-blob --yes --oidc-provider "${process.env.COSIGN_OIDC_ISSUER || 'https://token.actions.githubusercontent.com'}" --output-signature "${outfile}" --bundle "${infile}.sigstore" "${infile}"`, { stdio: 'inherit', shell: 'bash' });
  console.log('✔ signed', infile, '→', outfile);
} catch (e) {
  console.error('Signing failed. Install cosign and ensure OIDC is available.');
  process.exit(1);
}
