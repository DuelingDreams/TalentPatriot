import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

async function generateSchemaReport() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database');

    // Initialize report content
    let report = `# Supabase Schema Report
**Generated:** ${new Date().toISOString()}
**Database:** PostgreSQL (Supabase)

`;

    // 1. Get all tables and columns
    console.log('Fetching tables and columns...');
    const tablesQuery = `
      SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.ordinal_position
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    // Group columns by table
    const tableColumns = {};
    tablesResult.rows.forEach(row => {
      if (!tableColumns[row.table_name]) {
        tableColumns[row.table_name] = [];
      }
      if (row.column_name) {
        tableColumns[row.table_name].push(row);
      }
    });

    // 2. Get foreign key relationships
    console.log('Fetching foreign key relationships...');
    const foreignKeysQuery = `
      SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    const foreignKeysResult = await client.query(foreignKeysQuery);
    
    // Group foreign keys by table
    const tableForeignKeys = {};
    foreignKeysResult.rows.forEach(row => {
      if (!tableForeignKeys[row.table_name]) {
        tableForeignKeys[row.table_name] = [];
      }
      tableForeignKeys[row.table_name].push(row);
    });

    // 3. Get RLS policies
    console.log('Fetching RLS policies...');
    const rlsPoliciesQuery = `
      SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    const rlsPoliciesResult = await client.query(rlsPoliciesQuery);
    
    // Group policies by table
    const tablePolicies = {};
    rlsPoliciesResult.rows.forEach(row => {
      if (!tablePolicies[row.tablename]) {
        tablePolicies[row.tablename] = [];
      }
      tablePolicies[row.tablename].push(row);
    });

    // 4. Get views
    console.log('Fetching views...');
    const viewsQuery = `
      SELECT 
          table_name,
          view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const viewsResult = await client.query(viewsQuery);

    // 5. Get functions
    console.log('Fetching functions...');
    const functionsQuery = `
      SELECT 
          routine_name,
          routine_type,
          data_type as return_type,
          routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public'
          AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `;
    
    const functionsResult = await client.query(functionsQuery);

    // Build the report
    report += `## Tables & Columns\n\n`;
    
    Object.keys(tableColumns).sort().forEach(tableName => {
      report += `### ${tableName}\n\n`;
      report += `| Column | Type | Nullable | Default |\n`;
      report += `|--------|------|----------|----------|\n`;
      
      tableColumns[tableName].forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
        const defaultVal = col.column_default || '-';
        report += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} |\n`;
      });
      
      // Add foreign keys if any
      if (tableForeignKeys[tableName]) {
        report += `\n**Foreign Keys:**\n`;
        tableForeignKeys[tableName].forEach(fk => {
          report += `- ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
        });
      }
      
      report += `\n`;
    });

    // Add RLS Policies section
    report += `## Row Level Security Policies\n\n`;
    
    if (Object.keys(tablePolicies).length > 0) {
      Object.keys(tablePolicies).sort().forEach(tableName => {
        report += `### ${tableName}\n\n`;
        
        tablePolicies[tableName].forEach(policy => {
          report += `**${policy.policyname}**\n`;
          report += `- **Role:** ${policy.roles ? policy.roles.join(', ') : 'ALL'}\n`;
          report += `- **Command:** ${policy.cmd}\n`;
          report += `- **Permissive:** ${policy.permissive}\n`;
          if (policy.qual) {
            report += `- **Using:** \`${policy.qual}\`\n`;
          }
          if (policy.with_check) {
            report += `- **With Check:** \`${policy.with_check}\`\n`;
          }
          report += `\n`;
        });
      });
    } else {
      report += `No RLS policies found in the public schema.\n\n`;
    }

    // Add Views section
    report += `## Views\n\n`;
    
    if (viewsResult.rows.length > 0) {
      viewsResult.rows.forEach(view => {
        report += `### ${view.table_name}\n\n`;
        report += `\`\`\`sql\n${view.view_definition}\n\`\`\`\n\n`;
      });
    } else {
      report += `No views found in the public schema.\n\n`;
    }

    // Add Functions section
    report += `## Functions\n\n`;
    
    if (functionsResult.rows.length > 0) {
      functionsResult.rows.forEach(func => {
        report += `### ${func.routine_name}()\n\n`;
        report += `- **Type:** ${func.routine_type}\n`;
        report += `- **Returns:** ${func.return_type}\n`;
        if (func.routine_definition) {
          report += `\n\`\`\`sql\n${func.routine_definition}\n\`\`\`\n\n`;
        }
      });
    } else {
      report += `No custom functions found in the public schema.\n\n`;
    }

    // Add summary
    report += `## Summary\n\n`;
    report += `- **Tables:** ${Object.keys(tableColumns).length}\n`;
    report += `- **Total Columns:** ${Object.values(tableColumns).reduce((sum, cols) => sum + cols.length, 0)}\n`;
    report += `- **Foreign Key Relationships:** ${foreignKeysResult.rows.length}\n`;
    report += `- **RLS Policies:** ${rlsPoliciesResult.rows.length}\n`;
    report += `- **Views:** ${viewsResult.rows.length}\n`;
    report += `- **Functions:** ${functionsResult.rows.length}\n`;

    // Write report to file
    fs.writeFileSync('supabase_schema_report.md', report);
    console.log('Schema report generated: supabase_schema_report.md');
    
    // Display summary
    console.log(`\n=== SCHEMA SUMMARY ===`);
    console.log(`Tables: ${Object.keys(tableColumns).length}`);
    console.log(`Columns: ${Object.values(tableColumns).reduce((sum, cols) => sum + cols.length, 0)}`);
    console.log(`Foreign Keys: ${foreignKeysResult.rows.length}`);
    console.log(`RLS Policies: ${rlsPoliciesResult.rows.length}`);
    console.log(`Views: ${viewsResult.rows.length}`);
    console.log(`Functions: ${functionsResult.rows.length}`);

  } catch (error) {
    console.error('Error generating schema report:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generateSchemaReport();