const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('n8n/data/database.sqlite');
const wf=db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes=JSON.parse(wf.nodes);
console.log('Nodes:');
nodes.forEach(n=>console.log('  '+n.typeVersion+' '+n.type+' "'+n.name+'"'));
const conn=JSON.parse(wf.connections);
console.log('\nConnections:');
Object.keys(conn).forEach(k=>{
  const v=conn[k];
  if(v.main) v.main.forEach((out,i)=>{
    out.forEach(c=>console.log('  '+k+'['+i+'] -> '+c.node));
  });
});
db.close();
