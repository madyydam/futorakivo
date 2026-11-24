"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Monitor,
  Tablet,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/hooks/use-branch";
import {
  useDevices,
  useCreatePairingCode,
  useRevokeDevice,
  useUnlockDevice,
  type DeviceRegistration,
  type PairingCodeResult,
} from "@/hooks/use-devices";
import { ApiError } from "@/lib/api";

export default function DevicesSettingsPage() {
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();
  const { branches } = useBranch();
  const createPairingCode = useCreatePairingCode();
  const revokeDevice = useRevokeDevice();
  const unlockDevice = useUnlockDevice();

  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [activeCode, setActiveCode] = useState<PairingCodeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);

  // Initialize outlet selection
  useEffect(() => {
    if (branches.length > 0 && !selectedOutletId) {
      setSelectedOutletId(branches[0].id);
    }
  }, [branches, selectedOutletId]);

  // Countdown timer for pairing code (10 minutes TTL)
  useEffect(() => {
    if (!activeCode) return;
    const expiresMs = new Date(activeCode.expiresAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        setActiveCode(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCode]);

  const handleGenerateCode = async () => {
    if (!selectedOutletId) {
      toast.error("Please select a branch/outlet");
      return;
    }

    createPairingCode.mutate(
      { outletId: selectedOutletId },
      {
        onSuccess: (res) => {
          setActiveCode(res);
          toast.success("New pairing code generated");
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError ? err.message : "Failed to generate pairing code",
          );
        },
      },
    );
  };

  const handleCopyCode = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode.code);
    setCopied(true);
    toast.success("Pairing code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (device: DeviceRegistration) => {
    if (
      !confirm(
        `Are you sure you want to revoke "${device.label}"? This terminal will be disconnected immediately and its security token destroyed.`,
      )
    ) {
      return;
    }

    revokeDevice.mutate(device.id, {
      onSuccess: () => toast.success(`Device "${device.label}" revoked`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Failed to revoke device"),
    });
  };

  const handleUnlock = (device: DeviceRegistration) => {
    unlockDevice.mutate(device.id, {
      onSuccess: () => toast.success(`Lock cleared for "${device.label}"`),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Failed to unlock device"),
    });
  };

  const isLocked = (device: DeviceRegistration) =>
    Boolean(device.lockedUntil && new Date(device.lockedUntil) > new Date());

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Restaurant, branch, and device configuration</p>
      </div>

      <SettingsTabs />

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[18px] font-medium text-foreground">Registered POS Terminals</h2>
            <p className="text-sm text-muted-foreground">
              Manage authorized counter terminals, waitstaff tablets, and KDS devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Dialog
              open={pairDialogOpen}
              onOpenChange={(open) => {
                setPairDialogOpen(open);
                if (!open) setActiveCode(null);
              }}
            >
              <DialogTrigger
                render={
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-4 w-4" />
                    Pair New Terminal
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tablet className="h-5 w-5 text-primary" />
                    Pair New POS Terminal
                  </DialogTitle>
                  <DialogDescription>
                    Onboard a new tablet, counter touchscreen, or KDS screen securely using a
                    temporary pairing code or QR scan.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">Assign Branch / Outlet</label>
                    <Select
                      value={selectedOutletId}
                      onValueChange={(v) => setSelectedOutletId(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!activeCode ? (
                    <Button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={createPairingCode.isPending}
                      className="mt-2 w-full gap-2"
                    >
                      {createPairingCode.isPending ? "Generating Code…" : "Generate Pairing Code"}
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={JSON.stringify({
                            code: activeCode.code,
                            outletId: activeCode.outletId,
                          })}
                          size={160}
                          level="M"
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Pairing Code
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-3xl font-extrabold tracking-widest text-primary">
                            {activeCode.code}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyCode}
                            className="h-8 w-8"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Expires in: {formatCountdown(remainingSec)}
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Open the POS terminal app on your device, choose &quot;Pair Device&quot;, and enter
                        this code or scan the QR.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPairDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : devices && devices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Terminal Name</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Active / IP</TableHead>
                <TableHead className="hidden sm:table-cell">Security</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => {
                const locked = isLocked(device);

                return (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span>{device.label}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ID: {device.id}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {device.outlet?.name ?? "—"}
                    </TableCell>

                    <TableCell>
                      {device.status === "REVOKED" ? (
                        <Badge variant="destructive" className="gap-1 font-normal text-xs">
                          <XCircle className="h-3 w-3" />
                          Revoked
                        </Badge>
                      ) : locked ? (
                        <Badge variant="destructive" className="gap-1 font-normal text-xs bg-amber-600">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 font-normal text-xs text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground md:table-cell text-xs">
                      <div>
                        {device.lastSeenAt
                          ? new Date(device.lastSeenAt).toLocaleDateString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Never"}
                      </div>
                      <div className="font-mono text-[10px]">{device.lastIp || "—"}</div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs">
                      {(device.failedAttempts ?? 0) > 0 ? (
                        <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {device.failedAttempts} failed attempt(s)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Clean</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(locked || (device.failedAttempts ?? 0) > 0) && device.status !== "REVOKED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlock(device)}
                            className="h-8 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/50"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Unlock
                          </Button>
                        )}

                        {device.status !== "REVOKED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(device)}
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Tablet className="h-10 w-10 text-muted-foreground/60" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">No POS terminals paired yet</p>
              <p className="text-xs text-muted-foreground">
                Pair your counter terminals, tablets, and kitchen screens using pairing codes.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setPairDialogOpen(true)}
              className="mt-2 gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              Pair First Terminal
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
