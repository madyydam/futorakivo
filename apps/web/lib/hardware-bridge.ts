"use client";

import { toast } from "@/lib/toast";

export interface HardwarePrinterConfig {
  type: "BROWSER" | "USB_SERIAL" | "BLUETOOTH" | "NETWORK";
  paperWidth: "58mm" | "80mm";
  autoCut: boolean;
  kickDrawerOnCash: boolean;
  soundAlertsEnabled: boolean;
}

const STORAGE_KEY = "kivo.hardware.config.v1";

const DEFAULT_CONFIG: HardwarePrinterConfig = {
  type: "BROWSER",
  paperWidth: "80mm",
  autoCut: true,
  kickDrawerOnCash: true,
  soundAlertsEnabled: true,
};

export function getHardwareConfig(): HardwarePrinterConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveHardwareConfig(config: HardwarePrinterConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save hardware config:", e);
  }
}

// -----------------------------------------------------------------------------
// ESC/POS Command Encoder (Petpooja Hardware Standard)
// -----------------------------------------------------------------------------

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @ (Initialize printer)
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  bold(enable = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  doubleSize(): this {
    this.buffer.push(0x1d, 0x21, 0x11); // GS ! 0x11 (Double width and height)
    return this;
  }

  normalSize(): this {
    this.buffer.push(0x1d, 0x21, 0x00); // GS ! 0x00
    return this;
  }

  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 63); // ASCII or '?'
    }
    return this;
  }

  line(str = ""): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  twoColumns(left: string, right: string, width = 42): this {
    const space = Math.max(1, width - left.length - right.length);
    this.line(left + " ".repeat(space) + right);
    return this;
  }

  divider(char = "-", width = 42): this {
    this.line(char.repeat(width));
    return this;
  }

  feed(lines = 3): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut(): this {
    this.feed(2);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00); // GS V 66 0 (Cut paper)
    return this;
  }

  kickDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250 (Kick pin 2)
    return this;
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// -----------------------------------------------------------------------------
// Web Serial USB Printer Transport
// -----------------------------------------------------------------------------

let activeSerialPort: any = null;

export async function connectWebSerialPrinter(): Promise<{ name: string }> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    throw new Error("Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.");
  }

  const port = await (navigator as any).serial.requestPort();
  await port.open({ baudRate: 9600 });
  activeSerialPort = port;
  return { name: "USB Thermal Printer (Direct ESC/POS)" };
}

export async function sendEscPosToSerial(data: Uint8Array): Promise<void> {
  if (!activeSerialPort || !activeSerialPort.writable) {
    // Attempt re-opening or throw
    throw new Error("No USB printer port open. Please connect your printer first.");
  }
  const writer = activeSerialPort.writable.getWriter();
  await writer.write(data);
  writer.releaseLock();
}

// -----------------------------------------------------------------------------
// Web Bluetooth Thermal Printer Transport
// -----------------------------------------------------------------------------

let activeBluetoothDevice: any = null;
let activeBluetoothCharacteristic: any = null;

export async function connectBluetoothPrinter(): Promise<{ name: string }> {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth API is not supported in this browser. Please use Chrome or Edge on Android, Windows, or Mac.");
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
    optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb", "e7810a71-73ae-499d-8c15-faa9aef0c3f2"],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
  const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

  activeBluetoothDevice = device;
  activeBluetoothCharacteristic = characteristic;

  return { name: device.name || "Bluetooth Thermal Printer" };
}

export async function sendEscPosToBluetooth(data: Uint8Array): Promise<void> {
  if (!activeBluetoothCharacteristic) {
    throw new Error("Bluetooth printer is not connected. Please pair in Settings > Hardware.");
  }

  // Bluetooth MTU is typically 20-512 bytes, send in chunks of 100 bytes
  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await activeBluetoothCharacteristic.writeValue(chunk);
  }
}

// -----------------------------------------------------------------------------
// Universal Cash Drawer Kick Pulse
// -----------------------------------------------------------------------------

export async function triggerCashDrawerKick(): Promise<void> {
  const encoder = new EscPosEncoder();
  encoder.kickDrawer();
  const raw = encoder.getUint8Array();

  if (activeSerialPort) {
    await sendEscPosToSerial(raw);
    toast.success("Cash drawer pulse sent via USB!");
    return;
  }

  if (activeBluetoothCharacteristic) {
    await sendEscPosToBluetooth(raw);
    toast.success("Cash drawer pulse sent via Bluetooth!");
    return;
  }

  toast.info("Cash drawer pulse ready: Connect USB/Bluetooth printer in Hardware tab to send kick command.");
}

// -----------------------------------------------------------------------------
// Web Audio Soundbox & Chime Bridge (Petpooja Voice Announcement)
// -----------------------------------------------------------------------------

export function playOrderChime(text = "New order received on KIVO"): void {
  try {
    if (typeof window === "undefined") return;

    // 1. Synthesize multi-tone pleasant chime using Web Audio API
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Chord frequencies: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    }

    // 2. Play vocal speech announcement if supported
    if ("speechSynthesis" in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      }, 450);
    }
  } catch (e) {
    console.warn("Sound chime error:", e);
  }
}
