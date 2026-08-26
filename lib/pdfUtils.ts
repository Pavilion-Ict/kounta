export const APP_VERSION = "1.0.0";
export const BUSINESS_NAME = "PAVILION";

const fmt = (n: any) => (n === "" || n == null || isNaN(Number(n))) ? "—" : Number(n).toLocaleString("en-NG");
const fmtN = (n: any) => isNaN(Number(n)) ? 0 : Number(n);
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };

function openPrintWindow(html: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Please allow popups for this site to print and export PDFs.");
  }
}

const PDF_BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 20px; }
  h1 { margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; }
  .biz-header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 14px; }
  .biz-sub { font-size: 11px; color: #555; margin-top: 3px; }
  .meta { font-size: 10px; color: #666; margin-bottom: 12px; }
  .summary-grid { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
  .sum-card { flex: 1; min-width: 90px; padding: 8px 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; }
  .sum-card .lbl { font-size: 8px; text-transform: uppercase; color: #888; margin-bottom: 2px; letter-spacing: 0.5px; }
  .sum-card .val { font-size: 13px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #1a2535; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  .tfoot td { font-weight: bold; background: #f0f0f0; border-top: 2px solid #bbb; }
  .amber { color: #c07800; } .green { color: #166534; } .red { color: #991b1b; }
  .right { text-align: right; }
  @media print { body { padding: 10px; } }
`;

export function generateReceipt(rowsOrRow: any, title: string, isMulti = false) {
  const rows = Array.isArray(rowsOrRow) ? rowsOrRow : [rowsOrRow];
  if (rows.length === 0) return;

  const receiptNo = `RCP-${rows[0].id.split('-')[0].toUpperCase()}${isMulti ? '-MULTI' : ''}`;
  
  const isPublishing = title.toLowerCase().includes('publishing') || title.toLowerCase().includes('fixed cost product');
  let grandTotal = 0;
  let totalBalance = 0;

  const itemsHtml = rows.map(row => {
    const price = isPublishing ? fmtN(row.price) : fmtN(row.price * row.qty);
    grandTotal += price;
    totalBalance += fmtN(row.balance);
    
    return `
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #eee;">
        <div class="row"><span class="label">Description</span><span class="value">${row.description || "—"}</span></div>
        <div class="row"><span class="label">Quantity</span><span class="value">${row.qty || "—"}</span></div>
        ${!isPublishing ? `<div class="row"><span class="label">Unit Price</span><span class="value">₦${fmt(row.price)}</span></div>` : ""}
        <div class="row"><span class="label">Amount</span><span class="value">₦${fmt(price)}</span></div>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${receiptNo}</title>
  <style>
    ${PDF_BASE_STYLES}
    body { max-width: 400px; margin: 0 auto; padding: 24px; }
    .receipt-box { border: 2px solid #111; border-radius: 4px; padding: 20px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 12px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
    .row .label { color: #555; }
    .row .value { font-weight: 600; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 4px; }
    .footer { text-align: center; font-size: 10px; color: #888; margin-top: 16px; }
    .stamp { text-align: center; margin: 14px 0 8px; }
    .stamp span { display: inline-block; border: 2px solid #166534; color: #166534; font-weight: bold; font-size: 13px; padding: 4px 16px; border-radius: 4px; letter-spacing: 1px; transform: rotate(-3deg); }
  </style></head><body>
  <div class="receipt-box">
    <div style="display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 14px;">
      <img src="${window.location.origin}/icon.png" alt="Logo" style="width: 40px; height: 40px; object-fit: contain;" />
      <div>
        <h1 style="text-align: left; font-size: 18px; margin: 0;">${BUSINESS_NAME}</h1>
        <div class="biz-sub" style="text-align: left; margin: 0;">${title} Services</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:12px;">
      <span><b>Receipt No:</b> ${receiptNo}</span>
      <span><b>Date:</b> ${fmtDate(rows[0].entry_date || rows[0].created_at)}</span>
    </div>
    <div class="row"><span class="label">Client</span><span class="value">${rows[0].client_name || "—"}</span></div>
    
    <hr class="divider"/>
    <h3 style="font-size: 10px; text-transform: uppercase; margin: 0 0 10px 0; color: #888;">Items</h3>
    ${itemsHtml}
    
    <div class="total-row"><span>GRAND TOTAL</span><span>₦${fmt(grandTotal)}</span></div>
    ${totalBalance > 0 ? `<div class="row" style="margin-top:6px; color:#c07800;"><span class="label">Total Balance Due</span><span class="value">₦${fmt(totalBalance)}</span></div>` : ""}
    <hr class="divider"/>
    <div class="row"><span class="label">Payment Mode</span><span class="value" style="text-transform: capitalize;">${rows[0].payment_method}</span></div>
    <div class="row"><span class="label">Delivery</span><span class="value" style="text-transform: capitalize;">${rows[0].delivery_method}</span></div>
    ${!isMulti && rows[0].note ? `<div class="row"><span class="label">Note</span><span class="value">${rows[0].note}</span></div>` : ""}
    ${grandTotal ? `<div class="stamp"><span>RECEIVED</span></div>` : ""}
    <div class="footer">Thank you for your business!<br/>${BUSINESS_NAME} · ${fmtDate(new Date().toISOString())}</div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  openPrintWindow(html);
}

export function exportLedgerPDF({ filteredRows, totalRevenue, totalCop, copRows, filterDate, title }: any) {
  const gross    = totalRevenue - totalCop;
  const isNoMultiply = title.toLowerCase().includes('publishing') || title.toLowerCase().includes('digital prints') || title.toLowerCase().includes('fixed cost product') || title.toLowerCase().includes('non-fixed cost product');
  
  const rowsHtml = filteredRows.map((r: any) => `<tr>
    <td>${fmtDate(r.entry_date || r.created_at)}</td><td>${r.client_name || "—"}</td><td>${r.description || "—"}</td>
    <td class="right">${r.qty || "—"}</td>
    ${!isNoMultiply ? `<td class="right">${r.price ? fmt(r.price) : "—"}</td>` : ''}
    <td class="right" style="font-weight:bold;">${isNoMultiply ? fmt(r.price) : fmt(r.price * r.qty)}</td>
    <td class="right">${r.balance ? fmt(r.balance) : "—"}</td>
    <td style="text-transform: capitalize;">${r.payment_method}</td><td style="text-transform: capitalize;">${r.delivery_method}</td>
    <td>${r.note || "—"}</td>
  </tr>`).join("");

  const copHtml = copRows.map((r: any) => `<tr>
    <td>${fmtDate(r.entry_date || r.created_at)}</td>
    <td>${r.item || "—"}</td><td>${r.note || "—"}</td>
    <td class="right amber">₦${r.amount ? fmt(r.amount) : "—"}</td>
  </tr>`).join("");

  const today = new Date().toISOString().slice(0, 10);
  
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${BUSINESS_NAME} — ${title} Ledger</title>
  <style>${PDF_BASE_STYLES}</style></head><body>
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 14px;">
      <img src="${window.location.origin}/icon.png" alt="Logo" style="width: 40px; height: 40px; object-fit: contain;" />
      <div style="text-align: left;">
        <h1 style="margin: 0;">${BUSINESS_NAME}</h1>
        <div class="biz-sub" style="margin: 0;">${title} Services — Sales Ledger</div>
      </div>
    </div>
    <div class="meta">Exported: ${new Date().toLocaleString("en-GB")} &nbsp;|&nbsp; Entries: ${filteredRows.length}${filterDate ? ` &nbsp;|&nbsp; Date: ${fmtDate(filterDate)}` : ""}</div>
    <div class="summary-grid">
      <div class="sum-card"><div class="lbl">Revenue</div><div class="val">₦${fmt(totalRevenue)}</div></div>
      <div class="sum-card"><div class="lbl">Total COP</div><div class="val amber">₦${fmt(totalCop)}</div></div>
      <div class="sum-card"><div class="lbl">Gross Profit</div><div class="val ${gross >= 0 ? "green" : "red"}">₦${fmt(gross)}</div></div>
    </div>
    
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;color:#333;">Sales Record</h2>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 24px;"><thead><tr>
      <th>Date</th><th>Client</th><th>Description</th><th class="right">Qty</th>
      ${!isNoMultiply ? '<th class="right">Unit Price</th>' : ''}<th class="right">Total Price</th><th class="right">Balance</th><th>Payment</th><th>Delivery</th><th>Note</th>
    </tr></thead><tbody>${rowsHtml}</tbody>
    <tfoot><tr class="tfoot">
      <td colspan="${!isNoMultiply ? '5' : '4'}">Total Revenue</td>
      <td class="right">₦${fmt(totalRevenue)}</td>
      <td colspan="4"></td>
    </tr></tfoot></table>
    
    <div style="margin-top:20px;">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;color:#333;">Production Cost (COP)</h2>
      <table><thead><tr><th>Date</th><th>Cost Item</th><th>Note</th><th class="right">Amount</th></tr></thead>
      <tbody>${copHtml}</tbody>
      <tfoot><tr class="tfoot"><td colspan="3">Total COP</td><td class="right amber">₦${fmt(totalCop)}</td></tr></tfoot>
      </table>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  openPrintWindow(html);
}

export function exportPublishingPDF({ filteredRows, catalogue, totalRevenue, totalCop, filterDate, title, stockLogs = [] }: any) {
  const grossProfit = totalRevenue - totalCop;
  const rowsHtml = filteredRows.map((r: any) => {
    const unitCop = (catalogue[r.description] || { cop: 0 }).cop;
    const tcp = unitCop * (Number(r.qty) || 0);
    return `<tr>
      <td>${fmtDate(r.entry_date || r.created_at)}</td><td>${r.client_name || "—"}</td><td>${r.description || "—"}</td>
      <td class="right">${r.qty || "—"}</td>
      <td class="right font-monospace amber">₦${fmt(tcp)}</td>
      <td class="right">₦${r.price ? fmt(r.price) : "—"}</td>
      <td class="right">${r.balance ? fmt(r.balance) : "—"}</td>
      <td style="text-transform: capitalize;">${r.payment_method}</td><td style="text-transform: capitalize;">${r.delivery_method}</td>
      <td>${r.note || "—"}</td>
    </tr>`;
  }).join("");

  const stockHtml = stockLogs && stockLogs.length > 0 ? `
    <div style="margin-top:24px; page-break-inside: avoid;">
      <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;color:#333;">Daily Stock Logs</h2>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="width: 15%;">Date</th>
            <th style="width: 28%;">Opening Stock</th>
            <th style="width: 29%;">Additional Notes</th>
            <th style="width: 28%;">Closing Stock</th>
          </tr>
        </thead>
        <tbody>
          ${stockLogs.map((s: any) => `
            <tr>
              <td style="font-weight: bold;">${fmtDate(s.date || s.created_at)}</td>
              <td style="white-space: pre-wrap;">${s.opening_stock || "—"}</td>
              <td style="white-space: pre-wrap;">${s.additional_notes || "—"}</td>
              <td style="white-space: pre-wrap;">${s.closing_stock || "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${BUSINESS_NAME} — ${title} Ledger</title>
  <style>${PDF_BASE_STYLES}</style></head><body>
    <div class="biz-header"><h1>${BUSINESS_NAME}</h1><div class="biz-sub">${title} Services — Sales Ledger</div></div>
    <div class="meta">Exported: ${new Date().toLocaleString("en-GB")} &nbsp;|&nbsp; Entries: ${filteredRows.length}${filterDate ? ` &nbsp;|&nbsp; Date: ${fmtDate(filterDate)}` : ""}</div>
    <div class="summary-grid">
      <div class="sum-card"><div class="lbl">Revenue</div><div class="val">₦${fmt(totalRevenue)}</div></div>
      <div class="sum-card"><div class="lbl">Total COP</div><div class="val amber">₦${fmt(totalCop)}</div></div>
      <div class="sum-card"><div class="lbl">Gross Profit</div><div class="val ${grossProfit >= 0 ? "green" : "red"}">₦${fmt(grossProfit)}</div></div>
    </div>
    
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;color:#333;">Fixed Cost Product Records</h2>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 24px;"><thead><tr>
      <th>Date</th><th>Client</th><th>Service</th><th class="right">Qty</th>
      <th class="right amber">Total COP</th><th class="right">Price</th><th class="right">Balance</th><th>Payment</th><th>Delivery</th><th>Note</th>
    </tr></thead><tbody>${rowsHtml}</tbody>
    </table>
    
    ${stockHtml}

    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  openPrintWindow(html);
}

export function exportSummaryPDF({ byDate, inRange, totalRevenue, totalCop, grossProfit, copRows, stockLogs = [], from, to, title }: any) {
  const isNoMultiply = title.toLowerCase().includes('publishing') || title.toLowerCase().includes('digital prints') || title.toLowerCase().includes('fixed cost product') || title.toLowerCase().includes('non-fixed cost product');
  
  const dayBlocks = byDate.map(([date, dRows]: any) => {
    const rev = dRows.reduce((s: any, r: any) => s + (isNoMultiply ? fmtN(r.price) : fmtN(r.price) * fmtN(r.qty)), 0);
    const dayStock = stockLogs?.find((s: any) => (s.date || s.created_at?.split('T')[0]) === date);

    const rowsHtml = dRows.map((r: any) => `<tr>
      <td>${r.client_name || "—"}</td><td>${r.description || "—"}</td>
      <td class="right">${r.qty || "—"}</td>
      ${!isNoMultiply ? `<td class="right">${r.price ? fmt(r.price) : "—"}</td>` : ''}
      <td class="right" style="font-weight:bold;">${isNoMultiply ? fmt(r.price) : fmt(r.price * r.qty)}</td>
      <td class="right">${r.balance ? fmt(r.balance) : "—"}</td>
      <td style="text-transform: capitalize;">${r.payment_method}</td><td style="text-transform: capitalize;">${r.delivery_method}</td>
      <td>${r.note || "—"}</td>
    </tr>`).join("");

    return `<div style="margin-bottom:18px;page-break-inside:avoid;">
      <div style="background:#1a2535;color:#fff;padding:7px 10px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;">
        <b>${fmtDate(date)}</b>
        <span style="font-size:10px;">Revenue: ₦${fmt(rev)} · ${dRows.length} entries</span>
      </div>
      ${dRows.length > 0 ? `
        <table style="width:100%; border-collapse: collapse; margin-bottom: 8px;">
        <thead>
          <tr>
            <th>Client Name</th><th>Description</th><th class="right">Qty</th>
            ${!isNoMultiply ? '<th class="right">Unit Price (₦)</th>' : ''}
            <th class="right">Total (₦)</th><th class="right">Balance (₦)</th><th>Payment Mode</th><th>Delivery</th><th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        </table>
      ` : ''}
      ${dayStock ? `
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;padding:6px 10px;margin-top:4px;margin-bottom:10px;font-size:9.5px;">
          <div style="font-weight:bold;color:#1e293b;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-size:9px;">📦 Daily Stock Log (${fmtDate(date)})</div>
          <table style="width:100%;border-collapse:collapse;margin:0;font-size:9px;">
            <thead>
              <tr style="background:#e2e8f0;color:#334155;">
                <th style="padding:3px 6px;text-align:left;border:none;width:33%;">Opening Stock</th>
                <th style="padding:3px 6px;text-align:left;border:none;width:34%;">Additional Notes</th>
                <th style="padding:3px 6px;text-align:left;border:none;width:33%;">Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.opening_stock || "—"}</td>
                <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.additional_notes || "—"}</td>
                <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.closing_stock || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>`;
  }).join("");

  const copHtml = copRows.map((r: any) => `<tr>
    <td>${fmtDate(r.entry_date || r.created_at)}</td>
    <td>${r.item || "—"}</td><td>${r.note || "—"}</td>
    <td class="right amber">₦${r.amount ? fmt(r.amount) : "—"}</td>
  </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${BUSINESS_NAME} — Summary</title>
  <style>${PDF_BASE_STYLES}</style></head><body>
    <div class="biz-header"><h1>${BUSINESS_NAME}</h1><div class="biz-sub">${title} Services — Summary Report</div></div>
    <div class="meta">Period: ${fmtDate(from)} — ${fmtDate(to)} · ${inRange.length} entries · Generated: ${new Date().toLocaleString("en-GB")}</div>
    <div class="summary-grid">
      <div class="sum-card"><div class="lbl">Revenue</div><div class="val">₦${fmt(totalRevenue)}</div></div>
      <div class="sum-card"><div class="lbl">Total COP</div><div class="val amber">₦${fmt(totalCop)}</div></div>
      <div class="sum-card"><div class="lbl">Gross Profit</div><div class="val ${grossProfit >= 0 ? "green" : "red"}">₦${fmt(grossProfit)}</div></div>
    </div>
    ${dayBlocks}
    ${copRows.length > 0 ? `
      <div style="margin-top:20px;">
        <h2 style="font-size:12px;text-transform:uppercase;margin:0 0 6px;">Production Cost (COP)</h2>
        <table><thead><tr><th>Date</th><th>Cost Item</th><th>Note</th><th class="right">Amount</th></tr></thead>
        <tbody>${copHtml}</tbody>
        <tfoot><tr class="tfoot"><td colspan="3">Total COP</td><td class="right amber">₦${fmt(totalCop)}</td></tr></tfoot>
        </table>
      </div>
    ` : ''}
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
  
  openPrintWindow(html);
}

export function exportGlobalSummaryPDF({ ledgers, allExpenses, allIncome, from, to }: any) {
  const ledgersHtml = ledgers.map((l: any) => {
    return `
    <div style="margin-bottom: 24px; page-break-inside: avoid;">
      <h2 style="font-size:18px; font-weight: 800; text-align: center; text-transform:uppercase; margin-bottom: 16px; border-bottom: 2px solid #1a2535; padding-bottom: 8px; margin-top: 16px;">
        ${l.title}
      </h2>
      <div class="summary-grid" style="margin-bottom: 12px;">
        <div class="sum-card"><div class="lbl">Revenue</div><div class="val">₦${fmt(l.totalRevenue)}</div></div>
        <div class="sum-card"><div class="lbl">COP</div><div class="val amber">₦${fmt(l.totalCop)}</div></div>
        <div class="sum-card"><div class="lbl">Gross Profit</div><div class="val ${l.netProfit >= 0 ? "green" : "red"}">₦${fmt(l.netProfit)}</div></div>
      </div>
      <div style="font-size: 11px; color: #555; margin-bottom: 8px;">
        ${l.inRange.length} sales · ${l.copRows.length} COP entries ${l.stockLogs?.length ? `· ${l.stockLogs.length} stock logs` : ''}
      </div>
      
      ${l.byDate.map(([date, dRows]: any) => {
        const isNoMultiply = l.title.toLowerCase().includes('publishing') || l.title.toLowerCase().includes('digital prints') || l.title.toLowerCase().includes('fixed cost product') || l.title.toLowerCase().includes('non-fixed cost product');
        const rev = dRows.reduce((s: any, r: any) => s + (isNoMultiply ? fmtN(r.price) : fmtN(r.price) * fmtN(r.qty)), 0);
        const dayStock = l.stockLogs?.find((s: any) => (s.date || s.created_at?.split('T')[0]) === date);

        const rowsHtml = dRows.map((r: any) => `<tr>
          <td style="padding:4px; border-bottom:1px solid #eee;">${r.client_name || "—"}</td><td style="padding:4px; border-bottom:1px solid #eee;">${r.description || "—"}</td>
          <td class="right" style="padding:4px; border-bottom:1px solid #eee;">${r.qty || "—"}</td>
          ${!isNoMultiply ? `<td class="right" style="padding:4px; border-bottom:1px solid #eee;">${r.price ? fmt(r.price) : "—"}</td>` : ''}
          <td class="right" style="padding:4px; border-bottom:1px solid #eee; font-weight:bold;">${isNoMultiply ? fmt(r.price) : fmt(r.price * r.qty)}</td>
          <td class="right" style="padding:4px; border-bottom:1px solid #eee;">${r.balance ? fmt(r.balance) : "—"}</td>
          <td style="padding:4px; border-bottom:1px solid #eee; text-transform: capitalize;">${r.payment_method}</td><td style="padding:4px; border-bottom:1px solid #eee; text-transform: capitalize;">${r.delivery_method}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${r.note || "—"}</td>
        </tr>`).join("");
        return `<div style="margin-bottom:18px;page-break-inside:avoid; font-size: 10px;">
          <div style="background:#f1f5f9;color:#334155;padding:4px 8px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;border:1px solid #e2e8f0;border-bottom:none;">
            <b>${fmtDate(date)}</b>
            <span>Revenue: ₦${fmt(rev)} · ${dRows.length} entries</span>
          </div>
          ${dRows.length > 0 ? `
            <table style="width:100%; border-collapse: collapse; margin-bottom: 8px; border:1px solid #e2e8f0;">
            <thead style="background:#f8fafc;">
              <tr>
                <th style="padding:4px; text-align:left; border-bottom:2px solid #e2e8f0;">Client Name</th><th style="padding:4px; text-align:left; border-bottom:2px solid #e2e8f0;">Description</th><th class="right" style="padding:4px; border-bottom:2px solid #e2e8f0;">Qty</th>
                ${!isNoMultiply ? '<th class="right" style="padding:4px; border-bottom:2px solid #e2e8f0;">Unit Price (₦)</th>' : ''}
                <th class="right" style="padding:4px; border-bottom:2px solid #e2e8f0;">Total (₦)</th><th class="right" style="padding:4px; border-bottom:2px solid #e2e8f0;">Balance (₦)</th><th style="padding:4px; text-align:left; border-bottom:2px solid #e2e8f0;">Payment Mode</th><th style="padding:4px; text-align:left; border-bottom:2px solid #e2e8f0;">Delivery</th><th style="padding:4px; text-align:left; border-bottom:2px solid #e2e8f0;">Note</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            </table>
          ` : ''}
          ${dayStock ? `
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;padding:6px 10px;margin-top:4px;margin-bottom:10px;font-size:9.5px;">
              <div style="font-weight:bold;color:#1e293b;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-size:9px;">📦 Daily Stock Log (${fmtDate(date)})</div>
              <table style="width:100%;border-collapse:collapse;margin:0;font-size:9px;">
                <thead>
                  <tr style="background:#e2e8f0;color:#334155;">
                    <th style="padding:3px 6px;text-align:left;border:none;width:33%;">Opening Stock</th>
                    <th style="padding:3px 6px;text-align:left;border:none;width:34%;">Additional Notes</th>
                    <th style="padding:3px 6px;text-align:left;border:none;width:33%;">Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.opening_stock || "—"}</td>
                    <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.additional_notes || "—"}</td>
                    <td style="padding:4px 6px;vertical-align:top;border:none;white-space:pre-wrap;background:#fff;">${dayStock.closing_stock || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>`;
      }).join("")}
      
      ${l.copRows.length > 0 ? `
        <h3 style="font-size: 10px; text-transform: uppercase; margin: 8px 0 4px; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 2px;">Cost of Production (COP)</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px;">
          <tbody>
            ${l.copRows.map((e: any) => `<tr><td style="padding:2px; border-bottom:1px dashed #eee; width: 20%;">${fmtDate(e.entry_date || e.created_at)}</td><td style="padding:2px; border-bottom:1px dashed #eee; width: 60%;">${e.item || "—"} ${e.note ? `(${e.note})` : ''}</td><td style="text-align:right; padding:2px; border-bottom:1px dashed #eee; width: 20%; font-weight: bold;">₦${fmt(e.amount)}</td></tr>`).join("")}
          </tbody>
        </table>
      ` : ''}

    </div>
    `;
  }).join("");

  const grandRevenue = ledgers.reduce((s: number, l: any) => s + l.totalRevenue, 0);
  const grandCop = ledgers.reduce((s: number, l: any) => s + l.totalCop, 0);
  const grandExpenses = allExpenses ? allExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) : 0;
  const grandIncome = allIncome ? allIncome.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) : 0;
  const grandNetProfit = grandRevenue - grandCop - grandExpenses + grandIncome;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${BUSINESS_NAME} — Global Summary</title>
  <style>${PDF_BASE_STYLES}</style></head><body>
    <div class="biz-header"><h1>${BUSINESS_NAME}</h1><div class="biz-sub">Global Operations Summary</div></div>
    <div class="meta">Period: ${fmtDate(from)} — ${fmtDate(to)} · Generated: ${new Date().toLocaleString("en-GB")}</div>
    
    <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
      <h2 style="font-size: 16px; text-align: center; margin-top: 0; margin-bottom: 16px;">Consolidated Totals</h2>
      <div class="summary-grid">
        <div class="sum-card"><div class="lbl">Total Revenue</div><div class="val" style="font-size: 20px;">₦${fmt(grandRevenue)}</div></div>
        <div class="sum-card"><div class="lbl">Total COP</div><div class="val amber" style="font-size: 20px;">₦${fmt(grandCop)}</div></div>
        <div class="sum-card"><div class="lbl">Total Expenses</div><div class="val amber" style="font-size: 20px;">₦${fmt(grandExpenses)}</div></div>
        <div class="sum-card"><div class="lbl">Total Income</div><div class="val green" style="font-size: 20px;">₦${fmt(grandIncome)}</div></div>
        <div class="sum-card" style="grid-column: span 2;"><div class="lbl">Consolidated Net Profit</div><div class="val ${grandNetProfit >= 0 ? 'green' : 'red'}" style="font-size: 24px;">₦${fmt(grandNetProfit)}</div></div>
      </div>
    </div>

    ${ledgersHtml}
    
    ${allExpenses && allExpenses.length > 0 ? `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h2 style="font-size:14px; text-transform:uppercase; margin-bottom: 8px; border-bottom: 2px solid #1a2535; padding-bottom: 4px;">Global Expenses</h2>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px;">
          <tbody>
            ${allExpenses.map((e: any) => `<tr><td style="padding:2px; border-bottom:1px dashed #eee; width: 20%;">${fmtDate(e.entry_date || e.created_at)}</td><td style="padding:2px; border-bottom:1px dashed #eee; width: 60%;">${e.description || e.item || "—"}</td><td style="text-align:right; padding:2px; border-bottom:1px dashed #eee; width: 20%; font-weight: bold; color: #d97706;">₦${fmt(e.amount)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${allIncome && allIncome.length > 0 ? `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h2 style="font-size:14px; text-transform:uppercase; margin-bottom: 8px; border-bottom: 2px solid #1a2535; padding-bottom: 4px;">Global Income</h2>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px;">
          <tbody>
            ${allIncome.map((e: any) => `<tr><td style="padding:2px; border-bottom:1px dashed #eee; width: 20%;">${fmtDate(e.entry_date || e.created_at)}</td><td style="padding:2px; border-bottom:1px dashed #eee; width: 60%;">${e.description || e.item || "—"}</td><td style="text-align:right; padding:2px; border-bottom:1px dashed #eee; width: 20%; font-weight: bold; color: #16a34a;">₦${fmt(e.amount)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : ''}
    
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
  
  openPrintWindow(html);
}
