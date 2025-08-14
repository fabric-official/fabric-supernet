export default class LRU {
  constructor(limit=1000){ this.limit=limit; this.map=new Map(); }
  get(k){ if(!this.map.has(k)) return undefined; const v=this.map.get(k); this.map.delete(k); this.map.set(k,v); return v; }
  set(k,v){ if(this.map.has(k)) this.map.delete(k); this.map.set(k,v); if(this.map.size>this.limit){ const fk=this.map.keys().next().value; this.map.delete(fk);} }
}
