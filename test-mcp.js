#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamTransport } from '@supabase/mcp-utils';
import { createSupabaseApiPlatform, createSupabaseMcpServer } from './packages/mcp-server-supabase/dist/index.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testMcp() {
  console.log('🧪 Testing Supabase MCP Server...');

  try {
    // Create client and server transports
    const clientTransport = new StreamTransport();
    const serverTransport = new StreamTransport();

    // Connect the streams
    clientTransport.readable.pipeTo(serverTransport.writable);
    serverTransport.readable.pipeTo(clientTransport.writable);

    // Create MCP client
    const client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Create Supabase platform and server
    const platform = createSupabaseApiPlatform({
      accessToken: process.env.SUPABASE_ACCESS_TOKEN,
    });

    const server = createSupabaseMcpServer({
      platform,
      readOnly: true, // Safe mode for testing
    });

    // Connect client and server
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    console.log('✅ MCP Server connected successfully!');

    // List available tools
    console.log('\n🔧 Available tools:');
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // First, get list of projects to find project_id
    console.log('\n📋 Getting your projects...');
    const projectsResult = await client.callTool({
      name: 'list_projects',
      arguments: {}
    });

    let projectId = null;
    if (projectsResult.content && projectsResult.content.length > 0) {
      console.log('Projects raw response:', projectsResult.content[0].text);
      try {
        const projects = JSON.parse(projectsResult.content[0].text);
        console.log('Parsed projects:', projects);
        if (Array.isArray(projects) && projects.length > 0) {
          projectId = projects[0].id;
          console.log(`✅ Found project: ${projects[0].name} (ID: ${projectId})`);
        } else {
          console.log('No projects in array or response is not array');
        }
      } catch (e) {
        console.log('Could not parse projects JSON:', e.message);
      }
    } else {
      console.log('No content in projects response');
    }

    if (!projectId) {
      console.log('❌ No projects found');
      return;
    }

    // Test list_tables tool with project_id
    console.log('\n📋 Testing list_tables...');
    const result = await client.callTool({
      name: 'list_tables',
      arguments: {
        project_id: projectId,
        schemas: ['public'] // Get tables from public schema
      }
    });

    console.log('\n🗂️  Tables in your Supabase database:');
    if (result.content && result.content.length > 0) {
      console.log('Raw response:', result.content[0].text);
      try {
        const tables = JSON.parse(result.content[0].text);
        if (Array.isArray(tables)) {
          tables.forEach(table => {
            console.log(`\n📊 Table: ${table.name}`);
            console.log(`   Schema: ${table.schema}`);
            console.log(`   Comment: ${table.comment || 'No comment'}`);
          });
        } else {
          console.log('Response is not an array:', tables);
        }
      } catch (e) {
        console.log('Could not parse JSON:', e.message);
      }
    } else {
      console.log('No tables found or unable to parse response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testMcp().catch(console.error);