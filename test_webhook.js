const http=require('http');
const AK='N8N_API_KEY_REMOVED';
const ID='WFCRM001chat01';
function api(m,p,b){return new Promise(function(res){var o={hostname:'localhost',port:5678,path:'/api/v1/'+p,method:m,headers:{'X-N8N-API-KEY':AK,'Content-Type':'application/json'}};var r=http.request(o,function(rp){var d='';rp.on('data',function(c){d+=c;});rp.on('end',function(){try{res({s:rp.statusCode,b:JSON.parse(d)})}catch{res({s:rp.statusCode,b:d})}});});r.on('error',function(e){res({s:0,b:e.message});});if(b!==undefined)r.write(JSON.stringify(b));r.end();});}
async function main(){
  for(var i=0;i<30;i++){try{var h=await api('GET','workflows/'+ID);if(h.s===200)break;}catch{}await new Promise(function(r){setTimeout(r,2000);});}
  console.log('WF:',(await api('GET','workflows/'+ID)).b.active);
  await api('POST','workflows/'+ID+'/deactivate',{});await new Promise(function(r){setTimeout(r,1000);});
  await api('POST','workflows/'+ID+'/activate',{});await new Promise(function(r){setTimeout(r,2000);});
  var r1=await new Promise(function(res){var b=new URLSearchParams({user_id:'test',name:'T',message:'Ola'}).toString();var o={hostname:'localhost',port:5678,path:'/webhook/crm-chat',method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'}};var r=http.request(o,function(rp){var d='';rp.on('data',function(c){d+=c;});rp.on('end',function(){res({s:rp.statusCode,b:d.substring(0,500)});});});r.on('error',function(e){res({s:0,b:e.message});});r.write(b);r.end();});
  console.log('Status:',r1.s,'Resp:',r1.b);
}
main().catch(function(e){console.error(e);});
