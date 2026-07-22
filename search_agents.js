const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('n8n/data/database.sqlite');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

// Search for any references to comprovante, conciliacao, agendamento in all tables
for (const t of tables) {
  try {
    // Check text columns for keywords
    const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
    const textCols = cols.filter(c => c.type === 'TEXT' || c.type === 'varchar' || c.type === 'VARCHAR');
    for (const col of textCols) {
      const rows = db.prepare(`SELECT DISTINCT ${col.name} FROM "${t.name}" WHERE ${col.name} LIKE '%comprovante%' OR ${col.name} LIKE '%conciliac%' OR ${col.name} LIKE '%agente%' LIMIT 5`).all();
      if (rows.length > 0) {
        console.log(t.name + '.' + col.name + ':', rows.map(r => (r[col.name] || '').substring(0,60)).join(', '));
      }
    }
  } catch(e) {
    // skip
  }
}

// Also check workflow_history for all names
const hist = db.prepare("SELECT DISTINCT name FROM workflow_history WHERE name LIKE '%comprovante%' OR name LIKE '%conciliac%' OR name LIKE '%Agente%'").all();
console.log('\nWorkflow history names:', hist.map(h => h.name));

// But first check if these cols actually exist
const wfCols = db.prepare('PRAGMA table_info(workflow_entity)').all();
console.log('\nworkflow_entity columns:', wfCols.map(c => c.name));

// Search workflow_entity name column
const ent = db.prepare("SELECT id, name, active FROM workflow_entity WHERE name LIKE '%comprovante%' OR name LIKE '%conciliac%' OR name LIKE '%Agente%'").all();
console.log('\nWorkflow entity matches:', JSON.stringify(ent));

db.close();
