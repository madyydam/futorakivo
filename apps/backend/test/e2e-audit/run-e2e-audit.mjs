import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_AUDIT_DB_URL =
  'postgresql://postgres@localhost:5432/kivo_e2e_audit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../../../..');
const webAuditDir = join(repoRoot, 'apps', 'web', 'lib', 'e2e-audit');

const auditDbUrl = process.env.E2E_AUDIT_DATABASE_URL || DEFAULT_AUDIT_DB_URL;

if (/nodedr_restaurant/i.test(auditDbUrl)) {
  console.error(
    `[E2E-AUDIT] Refusing to run against dev database: ${auditDbUrl}`,
  );
  process.exit(1);
}

const childEnv = {
  ...process.env,
  DATABASE_URL: auditDbUrl,
  JWT_SECRET:
    process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 32
      ? process.env.JWT_SECRET
      : 'kivo-e2e-audit-jwt-secret-key-32chars-minimum',
};

function runPnpm(args, opts = {}) {
  const isWin = process.platform === 'win32';
  return spawnSync(isWin ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: repoRoot,
    env: childEnv,
    shell: isWin,
    encoding: 'utf8',
    stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function parseNodeTestSummary(output) {
  const testsMatch = output.match(/^(?:#|ℹ)\s*tests\s+(\d+)/mu);
  const passMatch = output.match(/^(?:#|ℹ)\s*pass\s+(\d+)/mu);
  const failMatch = output.match(/^(?:#|ℹ)\s*fail\s+(\d+)/mu);
  const skippedMatch = output.match(/^(?:#|ℹ)\s*skipped\s+(\d+)/mu);
  const suitesMatch = output.match(/^(?:#|ℹ)\s*suites\s+(\d+)/mu);
  return {
    suites: suitesMatch ? Number(suitesMatch[1]) : 0,
    tests: testsMatch ? Number(testsMatch[1]) : 0,
    passed: passMatch ? Number(passMatch[1]) : 0,
    failed: failMatch ? Number(failMatch[1]) : 0,
    skipped: skippedMatch ? Number(skippedMatch[1]) : 0,
  };
}

console.log('============================================================');
console.log('KIVO HORECA E2E Audit Runner');
console.log(`Target DB: ${auditDbUrl}`);
console.log('============================================================');

console.log('\n[1/4] Checking DB connectivity & applying Prisma migrations...');
const migrateRes = runPnpm([
  '--filter',
  '@futora/backend',
  'exec',
  'prisma',
  'migrate',
  'deploy',
]);
if (migrateRes.status !== 0) {
  console.error('[E2E-AUDIT] prisma migrate deploy failed.');
  process.exit(migrateRes.status ?? 1);
}

const pushRes = runPnpm([
  '--filter',
  '@futora/backend',
  'exec',
  'prisma',
  'db',
  'push',
  '--skip-generate',
]);
if (pushRes.status !== 0) {
  console.error('[E2E-AUDIT] prisma db push --skip-generate failed.');
  process.exit(pushRes.status ?? 1);
}

console.log('\n[2/4] Ensuring @futora/types is built...');
const typesBuild = runPnpm(['--filter', '@futora/types', 'build']);
if (typesBuild.status !== 0) {
  console.error('[E2E-AUDIT] @futora/types build failed.');
  process.exit(typesBuild.status ?? 1);
}

console.log('\n[3/4] Running backend Jest E2E audit suites...');
const reportDir = mkdtempSync(join(tmpdir(), 'kivo-e2e-audit-'));
const reportPath = join(reportDir, 'jest-report.json');

let backendSummary = {
  executed: true,
  exitCode: 1,
  suitesTotal: 0,
  suitesPassed: 0,
  suitesFailed: 0,
  testsTotal: 0,
  testsPassed: 0,
  testsFailed: 0,
  testsPending: 0,
  suiteDetails: [],
};

try {
  const jestRes = runPnpm([
    '--filter',
    '@futora/backend',
    'exec',
    'jest',
    '--config',
    './test/jest-e2e-audit.json',
    '--runInBand',
    '--no-cache',
    '--json',
    `--outputFile=${reportPath}`,
  ]);

  backendSummary.exitCode = jestRes.status ?? 1;

  if (existsSync(reportPath)) {
    const raw = readFileSync(reportPath, 'utf8');
    const report = JSON.parse(raw);
    backendSummary.suitesTotal = report.numTotalTestSuites ?? 0;
    backendSummary.suitesPassed = report.numPassedTestSuites ?? 0;
    backendSummary.suitesFailed = report.numFailedTestSuites ?? 0;
    backendSummary.testsTotal = report.numTotalTests ?? 0;
    backendSummary.testsPassed = report.numPassedTests ?? 0;
    backendSummary.testsFailed = report.numFailedTests ?? 0;
    backendSummary.testsPending = report.numPendingTests ?? 0;
    backendSummary.suiteDetails = Array.isArray(report.testResults)
      ? report.testResults.map((suite) => {
          const assertions = Array.isArray(suite.assertionResults)
            ? suite.assertionResults
            : [];
          const passed = assertions.filter((a) => a.status === 'passed').length;
          const failed = assertions.filter((a) => a.status === 'failed').length;
          return {
            name: basename(suite.name ?? 'unknown'),
            status: suite.status ?? 'unknown',
            passed,
            failed,
          };
        })
      : [];
  }
} finally {
  rmSync(reportDir, { recursive: true, force: true });
}

console.log('\n[4/4] Running web E2E audit suites...');
const webTestFiles = existsSync(webAuditDir)
  ? readdirSync(webAuditDir).filter((file) => file.endsWith('.test.ts'))
  : [];

let webSummary = {
  skipped: false,
  exitCode: 0,
  suites: 0,
  tests: 0,
  passed: 0,
  failed: 0,
  skippedTests: 0,
};

if (webTestFiles.length === 0) {
  webSummary.skipped = true;
  console.log(
    '[WEB] Note: no web audit files found in apps/web/lib/e2e-audit/*.test.ts yet — skipping web step.',
  );
} else {
  const webRes = runPnpm(
    [
      '--filter',
      'web',
      'exec',
      'node',
      '--test',
      '--no-warnings',
      'lib/e2e-audit/*.test.ts',
    ],
    { capture: true },
  );

  if (webRes.stdout) process.stdout.write(webRes.stdout);
  if (webRes.stderr) process.stderr.write(webRes.stderr);

  const parsed = parseNodeTestSummary(
    `${webRes.stdout ?? ''}\n${webRes.stderr ?? ''}`,
  );
  webSummary = {
    skipped: false,
    exitCode: webRes.status ?? 1,
    suites: parsed.suites,
    tests: parsed.tests,
    passed: parsed.passed,
    failed: parsed.failed,
    skippedTests: parsed.skipped,
  };
}

console.log('\n============================================================');
console.log('E2E AUDIT SUMMARY');
console.log('============================================================');
console.log(
  `Backend Suites : ${backendSummary.suitesPassed}/${backendSummary.suitesTotal} passed, ${backendSummary.suitesFailed} failed`,
);
console.log(
  `Backend Tests  : ${backendSummary.testsPassed}/${backendSummary.testsTotal} passed, ${backendSummary.testsFailed} failed, ${backendSummary.testsPending} pending`,
);
for (const suite of backendSummary.suiteDetails) {
  console.log(
    `  - ${suite.name}: ${String(suite.status).toUpperCase()} (${suite.passed} passed, ${suite.failed} failed)`,
  );
}

if (webSummary.skipped) {
  console.log('Web Tests      : SKIPPED (no apps/web/lib/e2e-audit/*.test.ts)');
} else {
  console.log(
    `Web Tests      : ${webSummary.passed}/${webSummary.tests} passed, ${webSummary.failed} failed, ${webSummary.skippedTests} skipped`,
  );
}

const backendOk =
  backendSummary.exitCode === 0 &&
  backendSummary.suitesFailed === 0 &&
  backendSummary.testsFailed === 0 &&
  backendSummary.testsTotal > 0;

const webOk = webSummary.skipped
  ? true
  : webSummary.exitCode === 0 &&
    webSummary.failed === 0 &&
    webSummary.tests > 0;

const totalExecutedTests =
  backendSummary.testsTotal + (webSummary.skipped ? 0 : webSummary.tests);

const overallPass = backendOk && webOk && totalExecutedTests > 0;
console.log(`OVERALL STATUS : ${overallPass ? 'PASS' : 'FAIL'}`);
console.log('============================================================');

process.exit(overallPass ? 0 : 1);
