"use client";

import { PERMISSIONS } from "@futora/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Computed once at module load — PERMISSIONS is a static const, no need to
// re-group on every render.
const GROUPED_PERMISSIONS = (() => {
  const map = new Map<string, (typeof PERMISSIONS)[number][]>();
  for (const permission of PERMISSIONS) {
    const list = map.get(permission.category) ?? [];
    list.push(permission);
    map.set(permission.category, list);
  }
  return [...map.entries()];
})();

export function PermissionChecklist({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const totalCount = PERMISSIONS.length;
  const totalSelected = selected.length;

  const toggleAllInCategory = (categoryPermissions: (typeof PERMISSIONS)[number][]) => {
    const allSelected = categoryPermissions.every((p) => selected.includes(p.key));
    for (const p of categoryPermissions) {
      const isSelected = selected.includes(p.key);
      if (allSelected && isSelected) {
        onToggle(p.key);
      } else if (!allSelected && !isSelected) {
        onToggle(p.key);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-muted-foreground">Permission Matrix (38 keys)</span>
        <Badge variant={totalSelected > 0 ? "secondary" : "outline"} className="text-[11px] font-normal">
          {totalSelected} of {totalCount} granted
        </Badge>
      </div>

      <div className="flex max-h-72 flex-col gap-4 overflow-y-auto rounded-lg border border-border p-3">
        {GROUPED_PERMISSIONS.map(([category, permissions]) => {
          const grantedInCategory = permissions.filter((p) => selected.includes(p.key)).length;
          const allInCategory = grantedInCategory === permissions.length;

          return (
            <div key={category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border/50 pb-1">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {category}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {grantedInCategory}/{permissions.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllInCategory(permissions)}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {allInCategory ? "Deselect" : "Select all"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.key}
                    className="flex cursor-pointer items-start gap-2 rounded p-1 text-xs text-foreground hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selected.includes(permission.key)}
                      onCheckedChange={() => onToggle(permission.key)}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-medium">{permission.label}</span>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {permission.key}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
