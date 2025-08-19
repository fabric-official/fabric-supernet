import * as React from 'react';
import QRCode from 'qrcode';
import { useBridge } from '../state/BridgeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@radix-ui/react-select';

export function PairQr() {
  const { pairPayload, refreshPairPayload } = useBridge();
  const [dataURL, setDataURL] = React.useState<string>('');
  const [kind, setKind] = React.useState<string>('android');

  React.useEffect(() => {
    (async () => {
      if (!pairPayload) return setDataURL('');
      try {
        const url = await QRCode.toDataURL(pairPayload, { errorCorrectionLevel: 'M', margin: 1, scale: 6 });
        setDataURL(url);
      } catch { setDataURL(''); }
    })();
  }, [pairPayload]);

  React.useEffect(() => { refreshPairPayload(kind); }, [refreshPairPayload, kind]);

  return (
    <div className="p-4 grid md:grid-cols-2 gap-4 items-start">
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">Device type</div>
        <select value={kind} onChange={e=>setKind(e.target.value)} className="px-2 py-1 border rounded-md">
          <option value="android">Android</option>
          <option value="ios">iOS</option>
          <option value="router">Router</option>
          <option value="linux">Linux</option>
          <option value="windows">Windows</option>
          <option value="mac">Mac</option>
          <option value="iot">IoT</option>
        </select>
        <div className="text-sm text-muted-foreground">Scan this QR with the Device Bridge app</div>
        {dataURL ? (
          <img src={dataURL} alt="Pair QR" className="border rounded-xl w-64 h-64 object-contain bg-white" />
        ) : (
          <div className="w-64 h-64 border rounded-xl flex items-center justify-center text-xs text-muted-foreground">
            Generating QRâ€¦
          </div>
        )}
        <div className="text-xs text-muted-foreground break-all">{pairPayload || ''}</div>
        <div className="flex gap-2">
          <Button type="button" onClick={()=>refreshPairPayload(kind)}>Regenerate</Button>
          <Button type="button" onClick={()=>{ if (pairPayload) navigator.clipboard?.writeText(pairPayload); }}>Copy payload</Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-sm font-semibold">Instructions</div>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Open Device Bridge app on the device.</li>
          <li>Select <b>Pair with Supernet</b> and scan the QR.</li>
          <li>Wait for the device to appear as <b>pending</b> in the Devices tab.</li>
          <li>Approve it and optionally assign an agent + energy budget.</li>
        </ol>
      </div>
    </div>
  );
}
