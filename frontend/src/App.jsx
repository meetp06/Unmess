import { useEffect, useMemo, useRef, useState } from "react";
import { runReconciliation, uploadBankStatement, uploadReceipts } from "./services/api";

const sampleReport = [
  { transaction_id: "TX-80421", date: "2026-07-29", csv_vendor: "Acme Office Supply", receipt_vendor: "ACME Office Supplies", csv_amount: 184.5, receipt_amount: 184.5, status: "matched", confidence: 98.6, receipt_image: null },
  { transaction_id: "TX-80418", date: "2026-07-28", csv_vendor: "Northstar Coffee", receipt_vendor: "North Star Coffee Roasters", csv_amount: 42.8, receipt_amount: 47.8, status: "amount_discrepancy", confidence: 92.1, receipt_image: null },
  { transaction_id: "TX-80411", date: "2026-07-27", csv_vendor: "Metro Parking", receipt_vendor: null, csv_amount: 36, receipt_amount: null, status: "missing_receipt", confidence: 0, receipt_image: null },
  { transaction_id: "TX-80407", date: "2026-07-26", csv_vendor: "Cloudline Software", receipt_vendor: "Cloudline, Inc.", csv_amount: 249, receipt_amount: 249, status: "matched", confidence: 96.4, receipt_image: null },
  { transaction_id: "TX-80399", date: "2026-07-25", csv_vendor: "Union Market", receipt_vendor: "Union Market SF", csv_amount: 81.24, receipt_amount: 81.24, status: "matched", confidence: 94.8, receipt_image: null }
];

const statusStyle = {
  matched: "border-green/30 bg-green/10 text-green",
  amount_discrepancy: "border-danger/30 bg-danger/10 text-danger",
  missing_receipt: "border-amber/30 bg-amber/10 text-amber"
};

const statusLabel = {
  matched: "Matched",
  amount_discrepancy: "Amount discrepancy",
  missing_receipt: "Missing receipt"
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    upload: <><path d="M12 16V4" /><path d="m8 8 4-4 4 4" /><path d="M5 20h14" /></>,
    report: <><path d="M5 3h11l3 3v15H5z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-4.5-4.5L8 19" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    spark: <path d="m12 2 1.65 6.35L20 10l-6.35 1.65L12 18l-1.65-6.35L4 10l6.35-1.65z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function money(value) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}

function ReceiptPreviews({ files }) {
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const created = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setPreviews(created);
    return () => created.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);
  return <div className="flex w-full items-center gap-3 overflow-hidden">
    {previews.slice(0, 4).map((item) => <img className="h-16 w-12 shrink-0 border border-line object-cover" src={item.url} alt="Selected receipt preview" key={item.url} />)}
    <div className="min-w-0"><span className="block truncate text-sm text-ink">{files.length === 1 ? files[0].name : `${files.length} receipt images selected`}</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted">Ready for extraction</span></div>
  </div>;
}

function UploadZone({ title, description, accept, multiple, files, onFiles, kind }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const visibleFiles = files || [];

  function collect(fileList) {
    const next = [...fileList];
    if (next.length) onFiles(next);
  }

  return <section className="min-w-0 border-b border-line py-6 first:pt-0 md:border-b-0 md:py-0">
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <div><p className="text-sm font-medium text-ink">{title}</p><p className="mt-1 text-xs text-muted">{description}</p></div>
      {visibleFiles.length > 0 && <span className="font-mono text-[10px] uppercase tracking-[.12em] text-green">{visibleFiles.length} ready</span>}
    </div>
    <input ref={inputRef} className="sr-only" type="file" accept={accept} multiple={multiple} onChange={(event) => collect(event.target.files)} />
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => { event.preventDefault(); setDragActive(false); collect(event.dataTransfer.files); }}
      className={`group flex min-h-36 w-full items-center justify-center border border-dashed p-4 text-left transition duration-200 ${dragActive ? "border-green bg-green/5" : "border-line bg-surface/55 hover:border-[#4a554c] hover:bg-raised/65"}`}
    >
      {visibleFiles.length ? (
        kind === "receipt" ? <ReceiptPreviews files={visibleFiles} /> : <div className="flex w-full items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center border border-green/30 bg-green/10 text-green"><Icon name="file" /></span><span className="min-w-0"><span className="block truncate text-sm text-ink">{visibleFiles[0].name}</span><span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted">{(visibleFiles[0].size / 1024).toFixed(1)} KB · CSV statement</span></span><span className="ml-auto text-green"><Icon name="arrow" /></span></div>
      ) : <div className="flex flex-col items-center text-center"><span className="mb-3 grid h-9 w-9 place-items-center border border-line text-muted transition group-hover:text-green"><Icon name={kind === "receipt" ? "image" : "upload"} /></span><span className="text-sm text-ink">Drop files here or <span className="text-green">browse</span></span><span className="mt-1 text-xs text-muted">{kind === "receipt" ? "JPG or PNG · multiple files supported" : "One .csv file · max 5 MB"}</span></div>}
    </button>
  </section>;
}

function Summary({ report }) {
  const counts = useMemo(() => report.reduce((all, row) => ({ ...all, [row.status]: all[row.status] + 1 }), { matched: 0, amount_discrepancy: 0, missing_receipt: 0 }), [report]);
  const blocks = [["Matched", counts.matched, "text-green"], ["Discrepancies", counts.amount_discrepancy, "text-danger"], ["Missing receipts", counts.missing_receipt, "text-amber"]];
  return <div className="grid divide-x divide-line overflow-hidden border border-line sm:grid-cols-3">{blocks.map(([label, value, color]) => <div className="bg-surface px-4 py-3" key={label}><p className="font-mono text-[10px] uppercase tracking-[.12em] text-muted">{label}</p><p className={`mt-1 text-2xl font-medium tracking-tight ${color}`}>{value}</p></div>)}</div>;
}

function SectionLabel({ children }) { return <p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted">{children}</p>; }
function FieldGroup({ title, fields }) { return <div><SectionLabel>{title}</SectionLabel><dl className="mt-3 space-y-3">{fields.map(([label, value]) => <div key={label}><dt className="text-[11px] text-muted">{label}</dt><dd className="mt-0.5 text-sm text-ink">{value}</dd></div>)}</dl></div>; }

function DetailDrawer({ row, onClose }) {
  if (!row) return null;
  const isMissing = row.status === "missing_receipt";
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Reconciliation details" onMouseDown={onClose}>
    <aside className="scrollbar-subtle h-full w-full max-w-md overflow-y-auto border-l border-line bg-[#151816] p-5 shadow-drawer animate-slideIn" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted">Transaction detail</p><h2 className="mt-1 text-lg font-medium text-ink">{row.transaction_id}</h2></div><button className="grid h-9 w-9 place-items-center border border-line text-muted transition hover:border-[#4a554c] hover:text-ink" onClick={onClose} aria-label="Close details"><Icon name="close" /></button></div>
      <div className={`mt-6 inline-flex border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.1em] ${statusStyle[row.status]}`}>{statusLabel[row.status]}</div>
      <div className="mt-5 aspect-[4/3] overflow-hidden border border-line bg-canvas">{row.receipt_image ? <img src={row.receipt_image} className="h-full w-full object-contain" alt={`Receipt for ${row.receipt_vendor}`} /> : <div className="flex h-full flex-col items-center justify-center text-center text-muted"><Icon name={isMissing ? "file" : "image"} size={26} /><p className="mt-3 text-sm">{isMissing ? "No receipt linked" : "Receipt preview available after upload"}</p></div>}</div>
      <div className="mt-6 border-t border-line pt-5"><SectionLabel>Suggested match</SectionLabel><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-medium tracking-tight text-ink">{row.confidence}%</p><p className="pb-1 text-xs text-muted">confidence</p></div><div className="mt-3 h-1 overflow-hidden bg-line"><div className="h-full bg-green transition-all duration-500" style={{ width: `${row.confidence}%` }} /></div></div>
      <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2"><FieldGroup title="Receipt fields" fields={isMissing ? [["Vendor", "—"], ["Date", "—"], ["Total", "—"]] : [["Vendor", row.receipt_vendor], ["Date", row.date], ["Total", money(row.receipt_amount)]]} /><FieldGroup title="CSV fields" fields={[["Vendor", row.csv_vendor], ["Date", row.date], ["Amount", money(row.csv_amount)]]} /></div>
      {row.status === "amount_discrepancy" && <div className="mt-6 border-l-2 border-danger bg-danger/5 p-4 text-sm leading-6 text-[#f5c0ba]">Receipt total is {money(Math.abs(Number(row.csv_amount) - Number(row.receipt_amount)))} different from the bank statement.</div>}
    </aside>
  </div>;
}

export default function App() {
  const [bankFile, setBankFile] = useState(null);
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [report, setReport] = useState(sampleReport);
  const [selectedRow, setSelectedRow] = useState(null);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleRun() {
    if (!bankFile || !receiptFiles.length) {
      setNotice({ type: "warning", text: "Select a bank statement and at least one receipt image before running." });
      return;
    }
    setRunning(true);
    setNotice(null);
    try {
      const bankStatement = await uploadBankStatement(bankFile);
      await uploadReceipts(receiptFiles, bankStatement.session_id);
      const results = await runReconciliation(bankStatement.session_id);
      setReport(results);
      setNotice({ type: "success", text: `Reconciliation complete — ${results.length} transactions reviewed.` });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Unable to run reconciliation." });
    } finally {
      setRunning(false);
    }
  }

  const nav = [["Dashboard", "grid"], ["Uploads", "upload"], ["Reconciliation Report", "report"]];
  return <div className="min-h-screen bg-canvas text-ink selection:bg-green selection:text-canvas md:grid md:grid-cols-[236px_minmax(0,1fr)]">
    <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-line bg-[#121513] p-4 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0`}>
      <div className="flex items-center gap-3 px-2 py-2"><span className="grid h-8 w-8 place-items-center bg-green text-canvas"><Icon name="spark" size={15} stroke={2.5} /></span><span className="text-sm font-semibold leading-4 tracking-tight">Messy Ops<br />Reconciler</span></div>
      <nav className="mt-10 space-y-1">{nav.map(([label, icon], index) => <a href={index === 0 ? "#workspace" : index === 1 ? "#uploads" : "#report"} className={`flex items-center gap-3 px-3 py-2.5 text-sm transition ${index === 0 ? "bg-raised text-ink" : "text-muted hover:bg-raised/70 hover:text-ink"}`} key={label} onClick={() => setSidebarOpen(false)}><Icon name={icon} size={17} />{label}</a>)}</nav>
      <div className="mt-auto border-t border-line px-2 pt-4"><p className="font-mono text-[10px] uppercase tracking-[.13em] text-muted">Environment</p><p className="mt-1 flex items-center gap-2 text-xs text-[#c0c7bf]"><span className="h-1.5 w-1.5 rounded-full bg-green" />Local workspace</p></div>
    </aside>
    {sidebarOpen && <button className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main id="workspace" className="min-w-0 px-4 pb-10 pt-4 sm:px-7 md:px-10 lg:px-12">
      <header className="flex items-center justify-between border-b border-line pb-5"><div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center border border-line text-muted md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted">Operations / July close</p><h1 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">Reconciliation workspace</h1></div></div><button onClick={handleRun} disabled={running} className="inline-flex shrink-0 items-center gap-2 bg-green px-3.5 py-2.5 text-sm font-semibold text-canvas transition hover:bg-[#b6f38e] disabled:cursor-wait disabled:opacity-70 sm:px-4"><Icon name={running ? "spark" : "arrow"} size={16} stroke={2.2} />{running ? "Reconciling…" : "Run reconciliation"}</button></header>
      <div className="animate-enter">
        <section id="uploads" className="border-b border-line py-8"><div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted">Source files</p><h2 className="mt-1 text-lg font-medium tracking-tight">Add records for review</h2></div><p className="hidden text-xs text-muted sm:block">Files remain local to this review session.</p></div><div className="grid gap-x-8 gap-y-0 md:grid-cols-2"><UploadZone title="Upload Bank Statement" description="Validated CSV with transaction fields" accept=".csv,text/csv" files={bankFile ? [bankFile] : []} onFiles={(files) => setBankFile(files[0])} kind="statement" /><UploadZone title="Upload Receipts" description="Images are extracted when reconciliation runs" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple files={receiptFiles} onFiles={setReceiptFiles} kind="receipt" /></div></section>
        {notice && <div className={`mt-6 flex items-center gap-3 border px-4 py-3 text-sm ${notice.type === "success" ? "border-green/25 bg-green/5 text-[#d6f8bf]" : notice.type === "error" ? "border-danger/25 bg-danger/5 text-[#ffb9b1]" : "border-amber/25 bg-amber/5 text-[#ffe0a1]"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${notice.type === "success" ? "bg-green" : notice.type === "error" ? "bg-danger" : "bg-amber"}`} />{notice.text}</div>}
        <section id="report" className="pt-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-muted">Reconciliation report</p><h2 className="mt-1 text-lg font-medium tracking-tight">Transaction matching</h2></div><p className="text-xs text-muted">{report === sampleReport ? "Demo data" : "Live reconciliation"} · click a row to inspect</p></div><div className="mt-5"><Summary report={report} /></div><div className="scrollbar-subtle mt-5 overflow-x-auto border border-line"><table className="w-full min-w-[860px] border-collapse text-left"><thead className="border-b border-line bg-surface"><tr>{["Transaction ID", "Date", "CSV Vendor", "Receipt Vendor", "CSV Amount", "Receipt Amount", "Status"].map((heading) => <th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-muted" key={heading}>{heading}</th>)}</tr></thead><tbody>{report.map((row) => <tr className="group cursor-pointer border-b border-line/80 bg-canvas transition hover:bg-raised/70 last:border-0" key={row.transaction_id} onClick={() => setSelectedRow(row)}><td className="px-4 py-4 font-mono text-xs text-[#d1d7d0]">{row.transaction_id}</td><td className="px-4 py-4 text-sm text-muted">{row.date}</td><td className="max-w-[180px] truncate px-4 py-4 text-sm text-ink">{row.csv_vendor}</td><td className="max-w-[180px] truncate px-4 py-4 text-sm text-[#c7cec7]">{row.receipt_vendor || "—"}</td><td className="px-4 py-4 font-mono text-xs text-[#d1d7d0]">{money(row.csv_amount)}</td><td className="px-4 py-4 font-mono text-xs text-[#d1d7d0]">{money(row.receipt_amount)}</td><td className="px-4 py-4"><span className={`inline-flex border px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${statusStyle[row.status]}`}>{statusLabel[row.status]}</span></td></tr>)}</tbody></table></div></section>
      </div>
    </main>
    <DetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
  </div>;
}
