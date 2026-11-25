export function SheetExchange({
  heading,
  help,
  action,
  csvHref,
  xlsxHref,
  modelCsv,
  modelXlsx,
}: {
  heading: string;
  help: string;
  action: (formData: FormData) => Promise<void>;
  csvHref: string;
  xlsxHref: string;
  modelCsv: string;
  modelXlsx: string;
}) {
  return (
    <section className="panel" style={{ padding: "1rem", margin: "1rem 0" }}>
      <div className="kicker">
        <h2>{heading}</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a className="btn-ghost" href={csvHref}>Exporter CSV</a>
          <a className="btn-ghost" href={xlsxHref}>Exporter Excel</a>
        </div>
      </div>
      <p className="muted">{help}</p>
      <p className="muted">
        Modèle vide : <a href={modelCsv}>CSV</a> · <a href={modelXlsx}>Excel</a>
      </p>
      <form action={action} className="fields">
        <label className="field">
          Fichier CSV ou Excel .xlsx
          <input name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
        </label>
        <button className="btn-primary" type="submit">Importer</button>
      </form>
    </section>
  );
}

export function ImportNotice({
  ok,
  crees,
  ignores,
  detail,
  noun,
}: {
  ok?: string;
  crees?: string;
  ignores?: string;
  detail?: string;
  noun: string;
}) {
  if (ok !== "import") return null;
  const created = Number(crees || "0");
  const skipped = Number(ignores || "0");
  const label = created > 1 ? `${noun}s` : noun;
  return (
    <p className="notice">
      {created} {label} créé{created > 1 ? "s" : ""}. {skipped > 0 ? `${skipped} ligne${skipped > 1 ? "s" : ""} non importée${skipped > 1 ? "s" : ""}.` : ""}
      {detail ? ` ${detail}` : ""}
    </p>
  );
}
