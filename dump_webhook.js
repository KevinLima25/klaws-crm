const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('n8n/data/database.sqlite');
const wf=db.prepare("SELECT * FROM workflow_entity WHERE id='WFCRM001chat01'").get();
const nodes=JSON.parse(wf.nodes);
const webhook=nodes.find(n=>n.type==='n8n-nodes-base.webhook');
console.log('Webhook params:', JSON.stringify(webhook.parameters, null, 2));
const buf=nodes.find(n=>n.name==='Salvar no Buffer');
console.log('Buffer params:', JSON.stringify(buf.parameters.jsCode.substring(0,100)));
// Also dump DADOS to understand output
const dados=nodes.find(n=>n.name==='DADOS');
if(dados)console.log('DADOS params:', JSON.stringify(dados.parameters, null, 2));
const fr=nodes.find(n=>n.name==='Format Response');
if(fr)console.log('Format Response params:', JSON.stringify(fr.parameters, null, 2));
const wr=nodes.find(n=>n.name==='Webhook Response');
if(wr)console.log('Webhook Response params:', JSON.stringify(wr.parameters, null, 2));
db.close();
