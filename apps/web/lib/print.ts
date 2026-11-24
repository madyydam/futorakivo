// Ported from nodedr-pos's frontend/lib/print.ts: loads the backend's
// self-printing receipt HTML into a hidden same-page iframe rather than a
// new tab, so there's no blank/finished tab left for the cashier to notice
// and close. The OS print dialog still opens exactly as it would for any
// other page (any printer, or "Save as PDF").
import { canPrintOnDevice, printHtmlOnDevice } from "@/lib/device-print";
import { getOutboxItems } from "@/lib/offline-outbox";
import { toast } from "@/lib/toast";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateOfflineReceiptHtml(orderId: string): string {
  const items = getOutboxItems();
  const item = items.find((i) => i.tempOrderId === orderId || i.id === orderId);
  const orderNum = escapeHtml(item?.orderSummary?.orderNumber || orderId);
  const table = escapeHtml(item?.orderSummary?.tableName || "Takeaway");
  const total = escapeHtml(item?.orderSummary?.totalAmount || "0.00");
  const dateStr = escapeHtml(
    item?.createdAt
      ? new Date(item.createdAt).toLocaleString("en-IN")
      : new Date().toLocaleString("en-IN")
  );

  const itemRows = item?.orderSummary?.items?.length
    ? item.orderSummary.items
        .map(
          (it) => `
    <div class="row">
      <span>${escapeHtml(it.name)} x${Number(it.quantity) || 1}</span>
      <span>₹${escapeHtml(it.price)}</span>
    </div>`
        )
        .join("")
    : `
    <div class="row">
      <span>Bill Summary (${Number(item?.orderSummary?.itemsCount) || 1} items)</span>
      <span>₹${total}</span>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offline Bill - ${orderNum}</title>
  <style>
    body { font-family: monospace; font-size: 13px; max-width: 300px; margin: 0 auto; padding: 12px; line-height: 1.4; color: #000; }
    .offline-banner { border: 2px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 12px; }
    .header { text-align: center; margin-bottom: 12px; }
    .brand-title { font-size: 16px; font-weight: bold; }
    .ticket-num { font-size: 14px; font-weight: bold; margin: 4px 0; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
    .total-row { font-size: 15px; font-weight: bold; margin-top: 6px; }
    .footer { text-align: center; font-size: 10px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="offline-banner">⚡ OFFLINE BILL (LOCAL COUNTER MODE)</div>
  <div class="header">
    <div class="brand-title">KIVO RESTAURANT</div>
    <div class="ticket-num">Order #${orderNum}</div>
    <div>${table}</div>
    <div style="font-size: 10px;">${dateStr}</div>
  </div>
  <div class="divider"></div>
  <div class="row" style="font-weight: bold;"><span>ITEMS</span><span>TOTAL</span></div>
  ${itemRows}
  <div class="divider"></div>
  <div class="row total-row"><span>NET TOTAL:</span><span>₹${total}</span></div>
  <div class="divider"></div>
  <div class="footer">
    Stored locally in counter outbox queue.<br>
    Will automatically synchronize to cloud.<br>
    Thank you for dining with us!
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

function generateOfflineKotHtml(orderId: string): string {
  const items = getOutboxItems();
  const item = items.find((i) => i.tempOrderId === orderId || i.id === orderId);
  const orderNum = escapeHtml(item?.orderSummary?.orderNumber || orderId);
  const table = escapeHtml(item?.orderSummary?.tableName || "Takeaway");
  const dateStr = escapeHtml(
    item?.createdAt
      ? new Date(item.createdAt).toLocaleTimeString("en-IN")
      : new Date().toLocaleTimeString("en-IN")
  );

  const itemRows = item?.orderSummary?.items?.length
    ? item.orderSummary.items
        .map(
          (it) => `
    <div class="row" style="font-size: 15px; font-weight: bold; margin-bottom: 2px;">
      <span>${escapeHtml(it.name)}</span>
      <span>x${Number(it.quantity) || 1}</span>
    </div>`
        )
        .join("")
    : `
    <div class="row">
      <span>Order Items</span>
      <span>${Number(item?.orderSummary?.itemsCount) || 1}</span>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offline KOT - ${orderNum}</title>
  <style>
    body { font-family: monospace; font-size: 14px; max-width: 300px; margin: 0 auto; padding: 12px; line-height: 1.4; color: #000; }
    .kot-banner { border: 2px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 8px; }
    .header { text-align: center; margin-bottom: 8px; }
    .ticket-num { font-size: 16px; font-weight: bold; }
    .table-name { font-size: 15px; font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="kot-banner">⚡ KITCHEN ORDER TICKET (OFFLINE)</div>
  <div class="header">
    <div class="ticket-num">KOT #${orderNum}</div>
    <div class="table-name">${table}</div>
    <div style="font-size: 11px;">Time: ${dateStr}</div>
  </div>
  <div class="divider"></div>
  <div class="row" style="font-weight: bold;"><span>ITEMS</span><span>QTY</span></div>
  ${itemRows}
  <div class="divider"></div>
  <div style="text-align: center; font-size: 11px; margin-top: 8px;">
    Sent from Offline Counter POS
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

let printFrame: HTMLIFrameElement | null = null;

function getPrintFrame(): HTMLIFrameElement {
  if (printFrame) return printFrame;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  // Positioned far off-screen rather than display:none/width:0 — a 0-width
  // frame forces the browser to lay out the receipt at 0px before printing,
  // clipping the right-aligned amount columns. A real box lets it lay out
  // normally; the huge negative offset keeps it invisible without affecting
  // page layout.
  frame.style.position = "fixed";
  frame.style.top = "-10000px";
  frame.style.left = "-10000px";
  frame.style.width = "380px";
  frame.style.height = "600px";
  frame.style.border = "none";
  document.body.appendChild(frame);
  printFrame = frame;
  return frame;
}

/** Bill figures the cashier has typed but not yet saved (see receipt route). */
export type BillQuery = Record<string, string | number | undefined>;

export function billQueryString(adj: BillQuery = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(adj)) {
    if (v !== undefined && v !== "" && v !== 0) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `&${s}` : "";
}

/** In the phone app: fetch the page and hand it to Android's print dialog (Save as PDF or any printer). */
function printPageOnDevice(url: string, name: string) {
  void fetch(url, { credentials: "include" })
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load the ${name.toLowerCase()} (${r.status})`);
      return r.text();
    })
    .then((html) => printHtmlOnDevice(html, name))
    .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Could not open the print dialog"));
}

/** Browser print of the bill (open order) or receipt (paid order). Read-only. */
export function openReceiptPrint(orderId: string, branchId: string, adj: BillQuery = {}) {
  if (orderId.startsWith("off_")) {
    const html = generateOfflineReceiptHtml(orderId);
    if (canPrintOnDevice()) {
      printHtmlOnDevice(html, "Offline Bill");
      return;
    }
    const frame = getPrintFrame();
    frame.srcdoc = html;
    return;
  }

  if (canPrintOnDevice()) {
    printPageOnDevice(`/api/v1/orders/${orderId}/receipt?branchId=${branchId}${billQueryString(adj)}`, "Bill");
    return;
  }
  const frame = getPrintFrame();
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return;
    try {
      win.focus();
      win.print();
    } catch {
      win.postMessage("print", "*");
    }
  };
  // Force a reload even if printing the same order twice in a row.
  frame.src = `/api/v1/orders/${orderId}/receipt?branchId=${branchId}${billQueryString(adj)}&t=${Date.now()}`;
}

export function openKotPrint(orderId: string, branchId: string) {
  if (orderId.startsWith("off_")) {
    const html = generateOfflineKotHtml(orderId);
    if (canPrintOnDevice()) {
      printHtmlOnDevice(html, "Offline KOT");
      return;
    }
    const frame = getPrintFrame();
    frame.srcdoc = html;
    return;
  }

  if (canPrintOnDevice()) {
    printPageOnDevice(`/api/v1/orders/${orderId}/kot?branchId=${branchId}`, "Kitchen ticket");
    return;
  }
  const frame = getPrintFrame();
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return;
    try {
      win.focus();
      win.print();
    } catch {
      win.postMessage("print", "*");
    }
  };
  frame.src = `/api/v1/orders/${orderId}/kot?branchId=${branchId}&t=${Date.now()}`;
}
