export async function loadCatalog(){ /* real call to host catalog */ // @ts-ignore
  return window.fabric?.invoke("plugin:catalog:list");
}
export async function install(id:string){ // @ts-ignore
  return window.fabric?.invoke("plugin:install",{id});
}
export async function remove(id:string){ // @ts-ignore
  return window.fabric?.invoke("plugin:remove",{id});
}