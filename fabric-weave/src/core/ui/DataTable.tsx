import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface DataTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
  className?: string;
}

export function DataTable({ headers, rows, className }: DataTableProps) {
  return (
    <Card className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {headers.map((header, i) => (
                <th key={i} className="text-left p-4 font-medium text-mutedForeground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="p-4 text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}