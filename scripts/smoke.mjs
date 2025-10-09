#!/usr/bin/env node
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const RENDER_API_URL = process.env.RENDER_API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('🧪 Running smoke tests...\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

await test('API /healthz returns 200 with { ok: true }', async () => {
  const res = await fetch(`${RENDER_API_URL}/healthz`);
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Expected { ok: true }, got ${JSON.stringify(data)}`);
  }
});

await test('Frontend /login returns 200 (HTML)', async () => {
  const res = await fetch(`${FRONTEND_URL}/login`);
  if (res.status !== 200) {
    throw new Error(`Expected 200, got ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    throw new Error(`Expected HTML, got ${contentType}`);
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
