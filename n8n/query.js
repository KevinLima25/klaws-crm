const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all("SELECT id, name, active, nodes, connections, settings, createdAt, updatedAt, staticData FROM workflow_entity WHERE id = 'WFCRM001chat01'", (err, workflows) => {
  if (err) { console.log("Error: " + err.message); return; }
  console.log("FULL_WORKFLOW:");
  console.log(JSON.stringify(workflows, null, 2));

  db.all("SELECT id, email, firstName, lastName, role FROM user", (err, users) => {
    if (err) { console.log("No user table: " + err.message); } else {
      console.log("USERS:", JSON.stringify(users));
    }

    db.all("SELECT * FROM user_api_keys", (err, keys) => {
      if (err) { console.log("No api keys: " + err.message); } else {
        console.log("API_KEYS:", JSON.stringify(keys));
      }
      db.close();
    });
  });
});
