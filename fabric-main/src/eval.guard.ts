/** eval guard token for verifier */
export const __evalGuard = (() => {
  try { Object.defineProperty(window as any, "eval", { get(){ throw new Error("eval disabled") }, set(){ } }); }
  catch { (window as any).eval = function(){ throw new Error("eval disabled") } }
  return true;
})();
