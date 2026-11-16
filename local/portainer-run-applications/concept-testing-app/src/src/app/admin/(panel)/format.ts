export const fmtDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 16).replace("T", " ") + " UTC" : "–");
export const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "–" : String(v));
