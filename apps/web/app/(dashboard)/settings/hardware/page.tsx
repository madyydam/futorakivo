"use client";

import { useEffect, useState } from "react";
import {
  Bluetooth,
  CheckCircle2,
  Cpu,
  Layers,
  Printer,
  Radio,
  RefreshCw,
  Scissors,
  Sparkles,
  Tv,
  Volume2,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  connectBluetoothPrinter,
  connectWebSerialPrinter,
  EscPosEncoder,
  getHardwareConfig,
  playOrderChime,
  saveHardwareConfig,
  sendEscPosToBluetooth,
  sendEscPosToSerial,
  triggerCashDrawerKick,
  type HardwarePrinterConfig,
} from "@/lib/hardware-bridge";

export default function HardwareSettingsPage() {
  const [config, setConfig] = useState<HardwarePrinterConfig>(getHardwareConfig);
  const [usbConnected, setUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  useEffect(() => {
    setConfig(getHardwareConfig());
  }, []);

  const handleUpdateConfig = (patch: Partial<HardwarePrinterConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    saveHardwareConfig(updated);
    toast.success("Hardware configuration updated");
  };

  const handleConnectUsb = async () => {
    try {
      const res = await connectWebSerialPrinter();
      setUsbConnected(true);
      setUsbDeviceName(res.name);
      toast.success(`Connected to ${res.name}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to open USB printer port");
    }
  };

  const handleConnectBt = async () => {
    try {
      const res = await connectBluetoothPrinter();
      setBtConnected(true);
      setBtDeviceName(res.name);
      toast.success(`Paired with ${res.name}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Bluetooth pairing failed or cancelled");
    }
  };

  const handlePrintTestReceipt = async () => {
    try {
      setIsPrintingTest(true);
      const encoder = new EscPosEncoder();
      encoder
        .alignCenter()
        .bold(true)
        .doubleSize()
        .line("KIVO BISTRO")
        .normalSize()
        .bold(false)
        .line("HORECA Management Simplified")
        .line("Connaught Place, New Delhi")
        .line("GSTIN: 07AAAAA0000A1Z5")
        .divider("=")
        .alignLeft()
        .twoColumns("Order: #KIVO-104", "Table: T-4")
        .twoColumns("Date: 15-Nov-2026", "Time: 10:55 AM")
        .divider("-")
        .bold(true)
        .twoColumns("ITEM", "AMT (INR)")
        .bold(false)
        .twoColumns("1x Paneer Butter Masala", "280.00")
        .twoColumns("2x Butter Naan", "120.00")
        .twoColumns("1x Fresh Lime Soda", "60.00")
        .divider("-")
        .twoColumns("Subtotal:", "460.00")
        .twoColumns("CGST (2.5%):", "11.50")
        .twoColumns("SGST (2.5%):", "11.50")
        .bold(true)
        .twoColumns("TOTAL DUE:", "483.00")
        .bold(false)
        .divider("=")
        .alignCenter()
        .line("Paid via Dynamic UPI (Google Pay)")
        .line("Thank You! Visit Again")
        .cut();

      const raw = encoder.getUint8Array();

      if (usbConnected) {
        await sendEscPosToSerial(raw);
        toast.success("Test receipt printed via USB!");
      } else if (btConnected) {
        await sendEscPosToBluetooth(raw);
        toast.success("Test receipt printed via Bluetooth!");
      } else {
        // Fallback browser print preview
        toast.info("No direct USB/Bluetooth printer attached. Printing via system dialog...");
        window.print();
      }
    } catch (e: any) {
      toast.error(e?.message || "Printing failed");
    } finally {
      setIsPrintingTest(false);
    }
  };

  const handlePrintTestKot = async () => {
    try {
      setIsPrintingTest(true);
      const encoder = new EscPosEncoder();
      encoder
        .alignCenter()
        .bold(true)
        .doubleSize()
        .line("--- KITCHEN ORDER (KOT) ---")
        .normalSize()
        .bold(false)
        .alignLeft()
        .line(`KOT #: #KOT-092    TABLE: Table 04`)
        .line(`Waiter: Rahul S    Type: DINE-IN`)
        .line(`Time: 10:56 AM`)
        .divider("=")
        .bold(true)
        .twoColumns("QTY  ITEM DESCRIPTION", "NOTES")
        .bold(false)
        .line("2x   Butter Chicken       [Extra Spicy]")
        .line("4x   Tandoori Roti        [Crispy]")
        .line("1x   Jeera Rice           []")
        .divider("-")
        .alignCenter()
        .line("--- END OF TICKET ---")
        .cut();

      const raw = encoder.getUint8Array();

      if (usbConnected) {
        await sendEscPosToSerial(raw);
        toast.success("Test KOT ticket printed via USB!");
      } else if (btConnected) {
        await sendEscPosToBluetooth(raw);
        toast.success("Test KOT ticket printed via Bluetooth!");
      } else {
        toast.info("Thermal printer ready: Connect USB or Bluetooth to send binary ESC/POS KOT.");
      }
    } catch (e: any) {
      toast.error(e?.message || "KOT printing failed");
    } finally {
      setIsPrintingTest(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Restaurant, branch, and staff configuration</p>
      </div>

      <SettingsTabs />

      {/* Hero Overview */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Cpu className="size-5" />
          </div>
          <div>
            <div className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Petpooja-Grade Hardware Integration Bridge</span>
              <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">ZERO CLOUD LATENCY</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              Control your thermal receipt printers (80mm/58mm), kitchen KOT printers, cash drawers, and UPI QR voice soundboxes directly from the counter PC or tablet.
            </p>
          </div>
        </div>
      </div>

      {/* Device Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* USB Thermal Printer */}
        <Card className="border-border/70 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Printer className="size-4 text-primary" />
                <span>USB Thermal Receipt Printer</span>
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  usbConnected ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : "text-muted-foreground"
                }`}
              >
                {usbConnected ? "CONNECTED" : "NOT CONNECTED"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Direct binary ESC/POS communication via Web Serial. Connects directly to Epson, TVS, NGX, POSIFLEX, and thermal printers.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {usbConnected && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span className="truncate">{usbDeviceName}</span>
              </div>
            )}
            <Button
              variant={usbConnected ? "outline" : "default"}
              size="sm"
              onClick={handleConnectUsb}
              className="w-full text-xs font-semibold h-9 cursor-pointer"
            >
              <Printer className="size-3.5 mr-1.5" />
              <span>{usbConnected ? "Re-connect USB Printer" : "Connect USB ESC/POS Printer"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Bluetooth Mobile Printer */}
        <Card className="border-border/70 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bluetooth className="size-4 text-blue-500" />
                <span>Bluetooth Mobile Printer</span>
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  btConnected ? "border-blue-500 text-blue-600 bg-blue-500/10" : "text-muted-foreground"
                }`}
              >
                {btConnected ? "PAIRED" : "NOT PAIRED"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Wireless 58mm/80mm pocket thermal printers for table-side billing and captain order takers.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {btConnected && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5 text-xs text-blue-700 dark:text-blue-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span className="truncate">{btDeviceName}</span>
              </div>
            )}
            <Button
              variant={btConnected ? "outline" : "default"}
              size="sm"
              onClick={handleConnectBt}
              className="w-full text-xs font-semibold h-9 cursor-pointer"
            >
              <Bluetooth className="size-3.5 mr-1.5" />
              <span>{btConnected ? "Pair Another Bluetooth Printer" : "Pair Bluetooth Printer"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Cash Drawer & Soundbox */}
        <Card className="border-border/70 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Wallet className="size-4 text-emerald-500" />
                <span>Cash Drawer &amp; Soundbox</span>
              </CardTitle>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px]">
                READY
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Electronic cash register drawer (RJ11 kick pulse) and audio soundbox order announcements.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerCashDrawerKick}
              className="w-full text-xs font-semibold h-8 cursor-pointer"
            >
              <Wallet className="size-3 mr-1.5 text-emerald-600" />
              <span>Kick Cash Drawer Pulse</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => playOrderChime("Table 4, Rupees 483 received via UPI")}
              className="w-full text-xs font-semibold h-8 cursor-pointer"
            >
              <Volume2 className="size-3 mr-1.5 text-purple-600" />
              <span>Test Audio Soundbox Chime</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Hardware Test & Diagnostics Bar */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            <span>Hardware Diagnostics &amp; Sample Print Testing</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Send immediate real-time test jobs to confirm printer alignment, font scaling, and cutter operations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handlePrintTestReceipt}
              disabled={isPrintingTest}
              className="text-xs font-semibold h-10 gap-2 bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Print 80mm Bill Receipt</span>
            </Button>

            <Button
              variant="outline"
              onClick={handlePrintTestKot}
              disabled={isPrintingTest}
              className="text-xs font-semibold h-10 gap-2 cursor-pointer"
            >
              <Layers className="size-4 text-blue-500" />
              <span>Print Kitchen KOT Ticket</span>
            </Button>

            <Button
              variant="outline"
              onClick={triggerCashDrawerKick}
              className="text-xs font-semibold h-10 gap-2 cursor-pointer"
            >
              <Wallet className="size-4 text-emerald-500" />
              <span>Trigger Cash Drawer Kick</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => playOrderChime("New Zomato delivery order: Rupees 640")}
              className="text-xs font-semibold h-10 gap-2 cursor-pointer"
            >
              <Volume2 className="size-4 text-purple-500" />
              <span>Play Order Voice Chime</span>
            </Button>
          </div>

          {/* Preferences */}
          <div className="border-t border-border/60 pt-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Counter Terminal Automation Rules
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Scissors className="size-3.5 text-muted-foreground" />
                    <span>Auto-Cut Thermal Paper</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Cut paper automatically after receipt finishes</div>
                </div>
                <Switch
                  checked={config.autoCut}
                  onCheckedChange={(checked) => handleUpdateConfig({ autoCut: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-emerald-500" />
                    <span>Auto-Open Cash Drawer</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Kick drawer pulse when cash payment recorded</div>
                </div>
                <Switch
                  checked={config.kickDrawerOnCash}
                  onCheckedChange={(checked) => handleUpdateConfig({ kickDrawerOnCash: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Volume2 className="size-3.5 text-purple-500" />
                    <span>Voice Soundbox Alerts</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Announce new incoming orders and UPI payments</div>
                </div>
                <Switch
                  checked={config.soundAlertsEnabled}
                  onCheckedChange={(checked) => handleUpdateConfig({ soundAlertsEnabled: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
