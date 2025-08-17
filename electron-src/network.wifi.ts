import { execFileSync } from "child_process"; import * as fs from "fs"; import * as os from "os";
export function scan(): any[] {
  try{
    if(process.platform==="win32"){
      const out=execFileSync("netsh",["wlan","show","networks","mode=Bssid"],{encoding:"utf8"});
      return out.split(/\r?\n/).filter(l=>/^\s*SSID/.test(l)).map(l=>({ ssid: l.split(":").slice(1).join(":").trim() }));
    }
    if(process.platform==="darwin"){
      const airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport";
      const out=execFileSync(airport,["-s"],{encoding:"utf8"}); return out.split(/\r?\n/).slice(1).filter(Boolean).map(l=>({ ssid: l.trim().split(/\s{2,}/)[0] }));
    }
    const out=execFileSync("nmcli",["-t","-f","SSID","dev","wifi"],{encoding:"utf8"}); return out.split(/\r?\n/).filter(Boolean).map(ssid=>({ ssid }));
  }catch{ return []; }
}
export function join(ssid:string, pass?:string){
  if(process.platform==="win32"){
    const profile=`<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"><name>${ssid}</name><SSIDConfig><SSID><name>${ssid}</name></SSID></SSIDConfig><connectionType>ESS</connectionType><connectionMode>auto</connectionMode><MSM><security><authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption>${pass?`<sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>${pass}</keyMaterial></sharedKey>`:""}</security></MSM></WLANProfile>`;
    const os=require("os"); const fs=require("fs"); const p=fs.mkdtempSync(os.tmpdir()+"\\wifi-")+"\\p.xml"; fs.writeFileSync(p,profile);
    execFileSync("netsh",["wlan","add","profile",`filename="${p}"`],{encoding:"utf8"}); execFileSync("netsh",["wlan","connect",`name="${ssid}"`],{encoding:"utf8"}); return { ok:true };
  }
  if(process.platform==="darwin"){ execFileSync("networksetup",["-setairportnetwork","en0",ssid].concat(pass?[pass]:[]),{encoding:"utf8"}); return { ok:true }; }
  execFileSync("nmcli",["dev","wifi","connect",ssid].concat(pass?["password",pass]:[]),{encoding:"utf8"}); return { ok:true };
}