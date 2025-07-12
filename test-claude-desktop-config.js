#!/usr/bin/env node

// Test script to verify Claude Desktop configuration works
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: 'sbp_f97e856f6f3f252c24f2dd727fdc0033abd1a652',
  SUPABASE_URL: 'https://jqhjibjlbtuzyqnbmcwq.supabase.co',
  PROJECT_REF: 'jqhjibjlbtuzyqnbmcwq'
};

const serverPath = join(__dirname, 'packages/mcp-server-supabase/dist/transports/stdio.js');

console.log('🧪 Testing Claude Desktop MCP Configuration...');
console.log(`📁 Server path: ${serverPath}`);
console.log('🌐 Environment variables set');

// Test 1: Check if server starts
console.log('\n1️⃣ Testing server startup with --version');
const versionTest = spawn('node', [serverPath, '--version'], { env });

versionTest.stdout.on('data', (data) => {
  console.log(`✅ Version: ${data.toString().trim()}`);
});

versionTest.stderr.on('data', (data) => {
  console.error(`❌ Error: ${data.toString()}`);
});

versionTest.on('close', (code) => {
  console.log(`Version test exited with code ${code}`);
  
  if (code === 0) {
    console.log('\n✅ Claude Desktop configuration should work!');
    console.log('\nNext steps:');
    console.log('1. Restart Claude Desktop');
    console.log('2. Look for "meowiarti-database" in the MCP servers list');
    console.log('3. Test with a simple query like "List my Dr. Meowiarti story tables"');
  } else {
    console.log('\n❌ Configuration needs debugging');
  }
});

versionTest.on('error', (err) => {
  console.error('❌ Failed to start process:', err);
});