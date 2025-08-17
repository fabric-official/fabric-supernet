import * as fs from "fs"; import * as path from "path"; import * as https from "https";
export async function check(){
  const cfg=path.join(process.cwd(),"config","update-feed.json"); if(fs.existsSync(cfg)) return JSON.parse(fs.readFileSync(cfg,"utf8"));
  const url=process.env.UPDATE_FEED_URL; if(!url) return { available:false };
  return await new Promise(res=>https.get(url,(r)=>{ let d=""; r.on("data",c=>d+=c); r.on("end",()=>{ try{res(JSON.parse(d))}catch{res({available:false})} })}).on("error",()=>res({available:false})));
}