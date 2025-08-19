import * as React from 'react';
import { useBridge } from '../state/BridgeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PoliciesPanel() {
  const { devices, setBudget } = useBridge();
  const [selected, setSelected] = React.useState<string>('');
  const [budget, setBudgetValue] = React.useState<number>(0);

  React.useEffect(() => {
    if (selected) {
      const d = devices.find(x => x.id === selected);
      setBudgetValue(d?.energyBudget || 0);
    }
  }, [selected, devices]);

  const apply = async () => {
    if (selected) await setBudget(selected, budget);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select value={selected} onChange={e=>setSelected(e.target.value)} className="px-2 py-1 border rounded-md">
          <option value="">Select deviceâ€¦</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
        </select>
        <Input type="number" min={0} value={budget} onChange={e=>setBudgetValue(parseInt(e.target.value||'0',10))} className="w-32"/>
        <Button onClick={apply}>Apply</Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Energy budget is enforced by policy kernel; exceeding budget yields runtime denial.
      </div>
    </div>
  );
}
