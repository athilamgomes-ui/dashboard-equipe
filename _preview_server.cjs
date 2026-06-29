const http=require('http'),fs=require('fs'),path=require('path');
const ROOT='/Users/elkgomes/Desktop/claude/dashboard-equipe';
const MT={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/precificacao.html';
  const f=path.join(ROOT,p);
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end('404');return;} res.writeHead(200,{'Content-Type':MT[path.extname(f)]||'application/octet-stream'});res.end(d);});
}).listen(8766,()=>console.log('up on 8766'));
