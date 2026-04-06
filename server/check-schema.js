const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aqI9Rick0AVP@ep-billowing-hill-an21ayo9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  await client.query('SET search_path TO app, public');
  try {
    // Check if conversations table exists
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'app' AND table_name IN ('conversations','clinical_documents') ORDER BY 1`
    );
    console.log('=== Tables found ===');
    tables.rows.forEach(r => console.log('  ' + r.table_name));

    // clinical_documents columns
    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'clinical_documents' ORDER BY ordinal_position`
    );
    console.log('\n=== clinical_documents columns ===');
    cols.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ') null:' + r.is_nullable));

    // conversations columns if exists
    const conv = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'conversations' ORDER BY ordinal_position`
    );
    if (conv.rows.length > 0) {
      console.log('\n=== conversations columns ===');
      conv.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ') null:' + r.is_nullable));
    } else {
      console.log('\n=== conversations table DOES NOT EXIST ===');
    }

    // Check medications table
    const med = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'medications' ORDER BY ordinal_position`
    );
    console.log('\n=== medications table columns ===');
    if (med.rows.length === 0) console.log('  (table does not exist)');
    med.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check clinical_profiles table
    const cp = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'clinical_profiles' ORDER BY ordinal_position`
    );
    console.log('\n=== clinical_profiles table columns ===');
    if (cp.rows.length === 0) console.log('  (table does not exist)');
    cp.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check data_merge_logs table
    const dml = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'data_merge_logs' ORDER BY ordinal_position`
    );
    console.log('\n=== data_merge_logs table columns ===');
    if (dml.rows.length === 0) console.log('  (table does not exist)');
    dml.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check field_conflicts table
    const fc = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'field_conflicts' ORDER BY ordinal_position`
    );
    console.log('\n=== field_conflicts table columns ===');
    if (fc.rows.length === 0) console.log('  (table does not exist)');
    fc.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check departments table
    const dept = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'departments' ORDER BY ordinal_position`
    );
    console.log('\n=== departments table columns ===');
    if (dept.rows.length === 0) console.log('  (table does not exist)');
    dept.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check users table
    const usr = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'users' ORDER BY ordinal_position`
    );
    console.log('\n=== users table columns ===');
    usr.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check clinical_documents table  
    const cd = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'clinical_documents' ORDER BY ordinal_position`
    );
    console.log('\n=== clinical_documents table columns ===');
    if (cd.rows.length === 0) console.log('  (table does not exist)');
    cd.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

    // Check allergies table
    const al = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'allergies' ORDER BY ordinal_position`
    );
    console.log('\n=== allergies table columns ===');
    if (al.rows.length === 0) console.log('  (table does not exist)');
    al.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
