const http=require('http'), url=require('url');
const ok=(res,obj)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(obj||{ok:true}))};
const bad=(res,code,msg)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,code,msg}))};
const srv=http.createServer((req,res)=>{
  const p=url.parse(req.url).pathname||'/';
  if(req.method==='POST' && p==='/api/devices/enroll'){
    let body=''; req.on('data',d=>body+=d);
    req.on('end', ()=> ok(res,{ok:true,route:p,received:body?JSON.parse(body):{}}));
  } else if (req.method==='GET' && (p==='/'||p==='/health')) {
    ok(res,{status:'up'});
  } else {
    bad(res,404,'not found');
  }
});
srv.listen(8787,'0.0.0.0',()=>console.log('mock-api listening on 8787'));
