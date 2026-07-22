const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('n8n/data/database.sqlite');
const wf=db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes=JSON.parse(wf.nodes);
nodes.forEach(n=>{
  if(n.type==='n8n-nodes-base.switch' || n.name==='Master Router (Switch)'||n.name==='file_type_router'){
    console.log('Switch:', JSON.stringify({name:n.name,typeVersion:n.typeVersion,type:n.type,params:Object.keys(n.parameters)},null,2));
  }
});
db.close();
