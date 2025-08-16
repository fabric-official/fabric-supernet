export async function invoke(channel:string, data?:any){
  const caps = (channel === "export.artifact") ? ["export.artifact"] :
               (channel.startsWith("git.")) ? ["git.pull"] :
               (channel.startsWith("wifi.")) ? ["wifi.scan"] :
               (channel.startsWith("device:")) ? ["device:challenge"] : [];
  // gate/pin/policy prelude
  // @ts-ignore
  return window.fabric?.invoke(channel, data, caps);
}