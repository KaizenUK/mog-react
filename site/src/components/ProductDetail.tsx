// ProductDetail.tsx

import { useState, useEffect } from "react";
import { submitOrder, type OrderInsert } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PackSizeResolved = {
  label: string;
  sku?: string;
  imageUrl?: string;
  price?: string;
  leadTime?: string;
  moq?: string;
  notes?: string;
};

export type TechDoc = {
  title: string;
  docType: string;
  language: string;
  url: string;
};

type BasketItem = { size: PackSizeResolved; qty: number };

type Props = {
  title: string;
  slug: string;
  summary?: string;
  bodyHtml?: string;
  mainImageUrl?: string;
  viscosityGrade?: string;
  approvals?: string[];
  packSizes?: PackSizeResolved[];
  unavailablePackSizes?: string[];
  docs?: TechDoc[];
};

// ─── Canonical sizes (always shown even if Sanity has none) ───────────────────

const CANONICAL: readonly string[] = [
  "1L","5L","20L","25L","200L","205L","208L","1000L","Bulk Tanker",
];

function buildDisplaySizes(
  sanity: PackSizeResolved[],
  unavailablePackSizes: string[] = [],
): PackSizeResolved[] {
  const unavailable = new Set((unavailablePackSizes ?? []).map((s) => String(s)));
  const map = new Map(sanity.map((s) => [s.label, s]));
  const out: PackSizeResolved[] = CANONICAL
    .filter((c) => !unavailable.has(c))
    .map((c) => map.get(c) ?? { label: c });
  for (const s of sanity) {
    if (!CANONICAL.includes(s.label) && !unavailable.has(s.label)) out.push(s);
  }
  return out;
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  navy:   "#0f1c34",
  mid:    "#1e2b44",
  gold:   "#c8a034",
  goldLt: "#e8c060",
  cream:  "#faf9f7",
  white:  "#ffffff",
  bdr:    "rgba(30,43,68,0.10)",
  muted:  "rgba(30,43,68,0.50)",
  dim:    "rgba(30,43,68,0.28)",
};

// ─── Shared input styles ──────────────────────────────────────────────────────

const iBase: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "7px",
  border: `1.5px solid ${C.bdr}`,
  background: C.cream,
  color: C.navy,
  fontFamily: "'Lato', sans-serif",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block",
  fontFamily: "'Lato', sans-serif",
  fontSize: "10px", fontWeight: 700,
  color: C.muted, letterSpacing: "0.09em",
  textTransform: "uppercase", marginBottom: "5px",
};

// ─── Field & Textarea defined at MODULE LEVEL so React never re-mounts them ───
//     (defining them inside a parent component causes focus loss on every keystroke)

type FieldProps = {
  id: string; label: string; placeholder: string;
  type?: string; required?: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

function Field({ id, label, placeholder, type = "text", required = false, value, onChange }: FieldProps) {
  return (
    <div>
      <label style={lbl} htmlFor={id}>{label}{required ? " *" : ""}</label>
      <input
        style={iBase} id={id} name={id} type={type}
        required={required} placeholder={placeholder}
        value={value} onChange={onChange}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,160,52,0.11)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = C.bdr;  e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

type TextAreaProps = {
  id: string; label: string; placeholder: string;
  value: string; onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
};

function TextArea({ id, label, placeholder, value, onChange }: TextAreaProps) {
  return (
    <div>
      <label style={lbl} htmlFor={id}>{label}</label>
      <textarea
        style={{ ...iBase, resize: "vertical", minHeight: "68px" }}
        id={id} name={id} placeholder={placeholder}
        value={value} onChange={onChange}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,160,52,0.11)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = C.bdr;  e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function QtyStepper({ value, onChange, min = 1 }: { value: number; onChange: (n: number) => void; min?: number }) {
  const btnStyle: React.CSSProperties = {
    width: "30px", height: "30px", borderRadius: "6px",
    border: `1.5px solid ${C.bdr}`, background: C.white,
    color: C.mid, fontSize: "16px", lineHeight: 1,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
    transition: "border-color 0.15s",
    fontFamily: "sans-serif",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdr}
      >−</button>
      <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "15px", fontWeight: 600, color: C.navy, minWidth: "24px", textAlign: "center" }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdr}
      >+</button>
    </div>
  );
}

// ─── Order form ───────────────────────────────────────────────────────────────

type FormState = {
  name: string; company: string; email: string; phone: string;
  line1: string; line2: string; town: string; county: string;
  postcode: string; notes: string;
};
const BLANK: FormState = {
  name: "", company: "", email: "", phone: "",
  line1: "", line2: "", town: "", county: "",
  postcode: "", notes: "",
};

function CheckoutForm({
  productTitle, productSlug, basket, onSuccess,
}: {
  productTitle: string; productSlug: string;
  basket: BasketItem[]; onSuccess: () => void;
}) {
  const [f, setF] = useState<FormState>(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  const totalQty = basket.reduce((s, i) => s + i.qty, 0);
  const sizeLabel = basket.length === 1 ? basket[0].size.label : "Multiple sizes";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const order: OrderInsert = {
      product_title: productTitle,
      product_slug: productSlug,
      size_label: sizeLabel,
      sku: basket.length === 1 ? basket[0].size.sku : undefined,
      quantity: totalQty,
      basket_items: JSON.stringify(
        basket.map((i) => ({ size: i.size.label, sku: i.size.sku, qty: i.qty }))
      ),
      customer_name: f.name,
      customer_company: f.company || undefined,
      customer_email: f.email,
      customer_phone: f.phone,
      delivery_address_line1: f.line1,
      delivery_address_line2: f.line2 || undefined,
      delivery_town: f.town,
      delivery_county: f.county || undefined,
      delivery_postcode: f.postcode,
      notes: f.notes || undefined,
    };
    const { error } = await submitOrder(order);
    setBusy(false);
    if (error) { setErr("Couldn't submit right now — please call us directly."); return; }
    onSuccess();
  };

  const g2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Basket summary */}
      <div style={{
        padding: "12px 14px", borderRadius: "9px",
        background: "rgba(200,160,52,0.05)",
        border: `1px solid rgba(200,160,52,0.18)`,
        marginBottom: "4px",
      }}>
        <div style={{ ...lbl, marginBottom: "7px" }}>Your order</div>
        {basket.map((item, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: "13px", color: C.mid,
            paddingBottom: i < basket.length - 1 ? "4px" : 0,
            marginBottom: i < basket.length - 1 ? "4px" : 0,
            borderBottom: i < basket.length - 1 ? `1px solid ${C.bdr}` : "none",
          }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, color: C.navy }}>
              {item.size.label}
            </span>
            <span style={{ color: C.muted }}>× {item.qty}</span>
          </div>
        ))}
      </div>

      <div style={g2}>
        <Field id="name"    label="Full name"  placeholder="Jane Smith"          required value={f.name}    onChange={ch} />
        <Field id="company" label="Company"    placeholder="Acme Ltd (optional)"          value={f.company} onChange={ch} />
      </div>
      <div style={g2}>
        <Field id="email" label="Email" placeholder="jane@company.co.uk" type="email" required value={f.email} onChange={ch} />
        <Field id="phone" label="Phone" placeholder="07700 900000"        type="tel"   required value={f.phone} onChange={ch} />
      </div>

      <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: "10px" }}>
        <div style={{ ...lbl, marginBottom: "8px" }}>Delivery address</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Field id="line1"   label="Address line 1" placeholder="123 Industrial Estate"    required value={f.line1}   onChange={ch} />
          <Field id="line2"   label="Address line 2" placeholder="Unit B (optional)"                 value={f.line2}   onChange={ch} />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px" }}>
            <Field id="town"     label="Town / City" placeholder="Birmingham"   required value={f.town}     onChange={ch} />
            <Field id="county"   label="County"      placeholder="W. Midlands"           value={f.county}   onChange={ch} />
            <Field id="postcode" label="Postcode"    placeholder="B1 1AA"       required value={f.postcode} onChange={ch} />
          </div>
        </div>
      </div>

      <TextArea id="notes" label="Additional notes"
        placeholder="Requirements, preferred delivery dates, access restrictions…"
        value={f.notes} onChange={ch} />

      {err && (
        <div style={{
          padding: "9px 13px", borderRadius: "7px",
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
          color: "#b91c1c", fontSize: "13px",
        }}>{err}</div>
      )}

      <button type="submit" disabled={busy} style={{
        marginTop: "4px", padding: "13px",
        borderRadius: "9px",
        background: busy
          ? "rgba(200,160,52,0.40)"
          : `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
        color: C.navy, fontFamily: "'Oswald', sans-serif",
        fontWeight: 600, fontSize: "14px", letterSpacing: "0.05em",
        textTransform: "uppercase", border: "none",
        cursor: busy ? "not-allowed" : "pointer",
        boxShadow: busy ? "none" : "0 4px 16px rgba(200,160,52,0.28)",
        transition: "all 0.18s",
      }}>
        {busy ? "Sending…" : "Submit Order Request"}
      </button>

      <p style={{ fontSize: "11px", color: C.dim, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
        No payment taken now. We'll contact you within the hour to confirm pricing and arrange delivery.
      </p>
    </form>
  );
}

// ─── Basket drawer ────────────────────────────────────────────────────────────

type DrawerStep = "select" | "basket" | "form" | "success";

function BasketDrawer({
  open, onClose, title, slug, mainImageUrl, packSizes, unavailablePackSizes,
}: {
  open: boolean; onClose: () => void;
  title: string; slug: string;
  mainImageUrl?: string; packSizes: PackSizeResolved[]; unavailablePackSizes?: string[];
}) {
  const displaySizes = buildDisplaySizes(packSizes, unavailablePackSizes ?? []);

  const [step, setStep] = useState<DrawerStep>("select");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [addQty, setAddQty] = useState(1);

  useEffect(() => {
    if (open) { setStep("select"); setSelectedIdx(null); setAddQty(1); }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const selected = selectedIdx !== null ? displaySizes[selectedIdx] : null;

  const addToBasket = () => {
    if (!selected) return;
    setBasket((prev) => {
      const i = prev.findIndex((b) => b.size.label === selected.label);
      if (i >= 0) {
        return prev.map((b, idx) => idx === i ? { ...b, qty: b.qty + addQty } : b);
      }
      return [...prev, { size: selected, qty: addQty }];
    });
    setStep("basket");
    setSelectedIdx(null);
    setAddQty(1);
  };

  const updateQty = (label: string, qty: number) => {
    if (qty < 1) return;
    setBasket((prev) => prev.map((b) => b.size.label === label ? { ...b, qty } : b));
  };

  const removeItem = (label: string) => {
    setBasket((prev) => prev.filter((b) => b.size.label !== label));
  };

  const totalQty = basket.reduce((s, i) => s + i.qty, 0);

  // ── Drawer header ──────────────────────────────────────────────────────────

  const stepLabel: Record<DrawerStep, string> = {
    select: "Add to basket",
    basket: `Basket${basket.length > 0 ? ` (${totalQty} item${totalQty !== 1 ? "s" : ""})` : ""}`,
    form:   "Your details",
    success:"Order received",
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(8,17,31,0.58)",
          backdropFilter: "blur(5px)",
          zIndex: 900,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      <div
        role="dialog" aria-modal="true" aria-label="Basket"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(500px, 100vw)",
          background: C.white,
          zIndex: 901,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.36s cubic-bezier(0.22,0.61,0.36,1)",
          overflowY: "auto",
          display: "flex", flexDirection: "column",
          boxShadow: "-16px 0 64px rgba(8,17,31,0.15)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px",
          borderBottom: `1px solid ${C.bdr}`,
          position: "sticky", top: 0, background: C.white, zIndex: 2,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(step === "basket" || step === "form") && (
              <button
                onClick={() => setStep(step === "form" ? "basket" : "select")}
                style={{
                  background: "none", border: "none", padding: "4px", cursor: "pointer",
                  color: C.muted, display: "flex",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: "14px",
              fontWeight: 600, color: C.navy, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {stepLabel[step]}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: `1.5px solid ${C.bdr}`, background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.muted, transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = C.gold; b.style.color = C.gold; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = C.bdr;  b.style.color = C.muted; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: "32px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "22px",
                boxShadow: "0 6px 24px rgba(200,160,52,0.28)",
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "22px", fontWeight: 600, color: C.navy, marginBottom: "10px", letterSpacing: "-0.01em" }}>
                Order received
              </h3>
              <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.65, maxWidth: "320px", marginBottom: "20px" }}>
                Thank you. Our sales team will contact you <strong style={{ color: C.mid }}>within the hour</strong> to confirm availability and arrange payment.
              </p>
              <div style={{
                padding: "6px 16px", borderRadius: "999px",
                background: "rgba(200,160,52,0.08)", border: `1px solid rgba(200,160,52,0.20)`,
                fontFamily: "'Oswald', sans-serif", fontSize: "11px", fontWeight: 600,
                color: C.gold, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Midland Oil Group
              </div>
            </div>
          )}

          {/* ── SIZE SELECTION ── */}
          {step === "select" && (
            <>
              {/* Mini product card */}
              <div style={{
                display: "flex", gap: "12px", alignItems: "center",
                padding: "10px 12px", borderRadius: "9px",
                border: `1px solid ${C.bdr}`, background: C.cream, marginBottom: "20px",
              }}>
                {mainImageUrl && (
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "6px",
                    background: C.white, border: `1px solid ${C.bdr}`,
                    overflow: "hidden", flexShrink: 0,
                  }}>
                    <img src={mainImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "13px", fontWeight: 600, color: C.navy }}>{title}</div>
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>
                    {selected ? `Selected: ${selected.label}` : "Select a size below"}
                  </div>
                </div>
              </div>

              {/* Size pills */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ ...lbl, marginBottom: "10px" }}>Pack size</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {displaySizes.map((s, i) => {
                    const active = selectedIdx === i;
                    return (
                      <button key={s.label} onClick={() => setSelectedIdx(i)} style={{
                        padding: "7px 14px", borderRadius: "999px",
                        border: active ? `2px solid ${C.gold}` : `1.5px solid ${C.bdr}`,
                        background: active ? C.gold : C.white,
                        color: active ? C.navy : C.mid,
                        fontFamily: "'Oswald', sans-serif",
                        fontWeight: active ? 600 : 400,
                        fontSize: "12px", letterSpacing: "0.05em", textTransform: "uppercase",
                        cursor: "pointer", transition: "all 0.14s",
                        boxShadow: active ? "0 2px 8px rgba(200,160,52,0.22)" : "none",
                      }}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected size detail */}
              {selected && (selected.sku || selected.price || selected.leadTime || selected.moq) && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px",
                  padding: "12px", borderRadius: "8px",
                  border: `1px solid rgba(200,160,52,0.18)`,
                  background: "rgba(200,160,52,0.04)",
                  marginBottom: "16px",
                }}>
                  {selected.sku      && <SpecCell label="SKU"        value={selected.sku} />}
                  {selected.price    && <SpecCell label="Pricing"     value={selected.price} />}
                  {selected.leadTime && <SpecCell label="Lead time"   value={selected.leadTime} />}
                  {selected.moq      && <SpecCell label="Min. order"  value={selected.moq} />}
                  {selected.notes    && (
                    <div style={{ gridColumn: "1/-1" }}>
                      <div style={{ ...lbl, marginBottom: "3px" }}>Notes</div>
                      <div style={{ fontSize: "12px", color: "rgba(30,43,68,0.60)", lineHeight: 1.4 }}>{selected.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ ...lbl, margin: 0 }}>Quantity</div>
                <QtyStepper value={addQty} onChange={setAddQty} />
              </div>

              {/* Add button */}
              <button
                onClick={addToBasket}
                disabled={selectedIdx === null}
                style={{
                  width: "100%", padding: "12px",
                  borderRadius: "9px",
                  background: selectedIdx === null
                    ? "rgba(200,160,52,0.22)"
                    : `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
                  color: C.navy, fontFamily: "'Oswald', sans-serif",
                  fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em",
                  textTransform: "uppercase", border: "none",
                  cursor: selectedIdx === null ? "not-allowed" : "pointer",
                  boxShadow: selectedIdx === null ? "none" : "0 3px 14px rgba(200,160,52,0.26)",
                  transition: "all 0.16s",
                }}
              >
                {selectedIdx === null
                  ? "Select a size to add"
                  : `Add ${addQty} × ${selected?.label} to basket`}
              </button>

              {/* Jump to basket if already has items */}
              {basket.length > 0 && (
                <button
                  onClick={() => setStep("basket")}
                  style={{
                    marginTop: "10px", width: "100%", padding: "10px",
                    borderRadius: "9px", border: `1.5px solid ${C.bdr}`,
                    background: "transparent", color: C.mid,
                    fontFamily: "'Oswald', sans-serif", fontSize: "12px",
                    fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    cursor: "pointer", transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdr}
                >
                  View basket ({totalQty} item{totalQty !== 1 ? "s" : ""}) →
                </button>
              )}
            </>
          )}

          {/* ── BASKET REVIEW ── */}
          {step === "basket" && (
            <>
              {basket.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: "14px" }}>
                  Your basket is empty.
                  <br />
                  <button
                    onClick={() => setStep("select")}
                    style={{ marginTop: "12px", background: "none", border: "none", cursor: "pointer", color: C.gold, fontWeight: 700, fontFamily: "'Lato', sans-serif", fontSize: "14px" }}
                  >
                    ← Add sizes
                  </button>
                </div>
              ) : (
                <>
                  {/* Item rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "16px" }}>
                    {basket.map((item) => (
                      <div key={item.size.label} style={{
                        display: "flex", alignItems: "center",
                        padding: "12px 14px", borderRadius: "9px",
                        border: `1px solid ${C.bdr}`, background: C.cream,
                        gap: "12px",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "14px", fontWeight: 600, color: C.navy }}>
                            {item.size.label}
                          </div>
                          {item.size.sku && (
                            <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>SKU: {item.size.sku}</div>
                          )}
                          {item.size.price && (
                            <div style={{ fontSize: "11px", color: C.muted }}>Price: {item.size.price}</div>
                          )}
                        </div>
                        <QtyStepper value={item.qty} onChange={(n) => updateQty(item.size.label, n)} />
                        <button
                          onClick={() => removeItem(item.size.label)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: "4px", color: C.dim, transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = "#b91c1c"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = C.dim}
                          aria-label={`Remove ${item.size.label}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderRadius: "8px",
                    background: C.white, border: `1px solid ${C.bdr}`,
                    marginBottom: "16px",
                  }}>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "12px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Total items
                    </span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "16px", fontWeight: 600, color: C.navy }}>
                      {totalQty}
                    </span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setStep("form")}
                    style={{
                      width: "100%", padding: "13px",
                      borderRadius: "9px",
                      background: `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
                      color: C.navy, fontFamily: "'Oswald', sans-serif",
                      fontWeight: 600, fontSize: "14px", letterSpacing: "0.05em",
                      textTransform: "uppercase", border: "none", cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(200,160,52,0.28)",
                      marginBottom: "8px",
                    }}
                  >
                    Continue to your details →
                  </button>

                  <button
                    onClick={() => setStep("select")}
                    style={{
                      width: "100%", padding: "10px",
                      borderRadius: "9px", border: `1.5px solid ${C.bdr}`,
                      background: "transparent", color: C.mid,
                      fontFamily: "'Oswald', sans-serif", fontSize: "12px",
                      fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                      cursor: "pointer", transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold}
                    onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdr}
                  >
                    + Add another size
                  </button>
                </>
              )}
            </>
          )}

          {/* ── CHECKOUT FORM ── */}
          {step === "form" && (
            <CheckoutForm
              productTitle={title}
              productSlug={slug}
              basket={basket}
              onSuccess={() => setStep("success")}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Tiny spec cell ─────────────────────────────────────────────────────────────
function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ ...lbl, marginBottom: "3px" }}>{label}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "13px", color: C.navy, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function ProductDetail({
  title, slug, summary, bodyHtml,
  mainImageUrl, viscosityGrade,
  approvals = [], packSizes = [], unavailablePackSizes = [], docs = [],
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryDoc = docs[0] ?? null;

  const displaySizes = buildDisplaySizes(packSizes, unavailablePackSizes);
  const sizeHint = displaySizes.length > 0
    ? `${displaySizes.length} pack size${displaySizes.length !== 1 ? "s" : ""} — ${displaySizes[0].label} to ${displaySizes[displaySizes.length - 1].label}`
    : "Size options available on request";

  return (
    <>
      <style>{`
        body { background: ${C.cream} !important; color: ${C.navy} !important; }

        .pdp-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: clamp(32px, 4.5vw, 72px);
          align-items: start;
          max-width: 1160px;
          margin: 0 auto;
          padding: clamp(40px, 5vw, 72px) clamp(20px, 5vw, 60px);
        }
        @media (max-width: 860px) {
          .pdp-grid { grid-template-columns: 1fr; }
          .pdp-img  { max-width: 420px; }
        }

        .pdp-strip-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .pdp-strip-item {
          padding: 0 clamp(14px, 2.5vw, 32px);
          border-right: 1px solid rgba(255,255,255,0.09);
          font-family: 'Oswald', sans-serif;
          font-size: clamp(10px, 1.1vw, 12px);
          font-weight: 600;
          color: rgba(255,255,255,0.48);
          letter-spacing: 0.11em;
          text-transform: uppercase;
          white-space: nowrap;
          line-height: 1;
        }
        .pdp-strip-item:last-child { border-right: none; }

        .pdp-add-btn { transition: transform 0.14s ease, box-shadow 0.14s ease !important; }
        .pdp-add-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 9px 28px rgba(200,160,52,0.40) !important;
        }
        .pdp-doc-link:hover { border-color: ${C.gold} !important; color: ${C.gold} !important; }

        /* Description prose — tighter line-height so it sits closer to the image */
        .pdp-body p  { margin-bottom: 0.55em; }
        .pdp-body ul,
        .pdp-body ol { padding-left: 1.3em; margin-bottom: 0.6em; }
        .pdp-body li { margin-bottom: 0.25em; }
        .pdp-body h2,
        .pdp-body h3 {
          font-family: 'Oswald', sans-serif; font-weight: 600; color: ${C.navy};
          margin-top: 1.4em; margin-bottom: 0.35em; line-height: 1.15;
        }
        .pdp-body h2 { font-size: 18px; }
        .pdp-body h3 { font-size: 15px; }
        .pdp-body strong { color: ${C.navy}; font-weight: 700; }
        .pdp-body a { color: ${C.gold}; text-decoration: underline; text-underline-offset: 3px; }
        .pdp-body blockquote {
          border-left: 3px solid ${C.gold}; padding-left: 12px;
          margin-left: 0; color: ${C.muted}; font-style: italic;
        }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ background: C.cream }}>
        <div className="pdp-grid">

          {/* Image — fixed 420px column, modest padding */}
          <div
            className="pdp-img"
            style={{
              background: C.white,
              borderRadius: "14px",
              padding: "20px",
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 24px rgba(15,28,52,0.07), 0 1px 4px rgba(15,28,52,0.04)",
              border: `1px solid ${C.bdr}`,
            }}
          >
            {mainImageUrl
              ? <img src={mainImageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              : <div style={{ opacity: 0.12, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="0.9"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: C.mid }}>No image</span>
                </div>
            }
          </div>

          {/* Info column */}
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Breadcrumb */}
            <nav style={{ marginBottom: "16px", fontSize: "12px", color: C.dim, lineHeight: 1 }}>
              <a href="/products" style={{ color: C.gold, textDecoration: "none", fontWeight: 700 }}>Products</a>
              <span style={{ margin: "0 6px" }}>›</span>
              <span>{title}</span>
            </nav>

            {/* Viscosity badge */}
            {viscosityGrade && (
              <div style={{ marginBottom: "12px" }}>
                <span style={{
                  display: "inline-block", padding: "3px 9px", borderRadius: "3px",
                  background: C.mid, fontFamily: "'Oswald', sans-serif",
                  fontSize: "10px", fontWeight: 600, color: C.gold,
                  letterSpacing: "0.09em", textTransform: "uppercase",
                }}>
                  {viscosityGrade}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: "clamp(26px, 3vw, 44px)",
              fontWeight: 600, lineHeight: 1.07,
              color: C.navy, margin: "0 0 18px",
              letterSpacing: "-0.015em",
            }}>
              {title}
            </h1>

            {/* Body / description — tighter line-height, less bottom margin */}
            {bodyHtml ? (
              <div
                className="pdp-body"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "clamp(13px, 1.3vw, 15px)",
                  lineHeight: 1.58,
                  color: "rgba(15,28,52,0.64)",
                  marginBottom: "18px",
                }}
              />
            ) : summary ? (
              <p style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "clamp(13px, 1.3vw, 15px)",
                lineHeight: 1.58, color: "rgba(15,28,52,0.64)",
                margin: "0 0 18px",
              }}>
                {summary}
              </p>
            ) : null}

            {/* Gold accent rule */}
            <div style={{ width: "40px", height: "2px", background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: "18px" }} />

            {/* Approvals */}
            {approvals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "16px" }}>
                {approvals.map((a, i) => (
                  <span key={i} style={{
                    padding: "3px 8px", borderRadius: "3px",
                    border: `1px solid rgba(200,160,52,0.26)`,
                    background: "rgba(200,160,52,0.05)",
                    fontFamily: "'Oswald', sans-serif", fontSize: "10px", fontWeight: 600,
                    color: C.mid, letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>{a}</span>
                ))}
              </div>
            )}

            {/* TDS link */}
            {primaryDoc && (
              <div style={{ marginBottom: "18px" }}>
                <a
                  href={primaryDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdp-doc-link"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontFamily: "'Lato', sans-serif", fontSize: "12px", fontWeight: 700,
                    color: C.mid, textDecoration: "none",
                    border: `1.5px solid ${C.bdr}`,
                    padding: "6px 12px", borderRadius: "6px",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download {primaryDoc.docType || "TDS"}
                  {primaryDoc.language && <span style={{ color: C.dim, fontWeight: 400, marginLeft: "4px" }}>· {primaryDoc.language}</span>}
                </a>
                {docs.slice(1).map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                    className="pdp-doc-link"
                    style={{
                      marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "5px",
                      fontFamily: "'Lato', sans-serif", fontSize: "12px", fontWeight: 700,
                      color: C.muted, textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {d.docType || "Doc"}
                  </a>
                ))}
              </div>
            )}

            {/* Size hint */}
            <p style={{ fontSize: "11px", color: C.muted, margin: "0 0 18px", lineHeight: 1.5 }}>
              Available in <strong style={{ color: C.mid }}>{sizeHint}</strong>. Choose your sizes when you add to basket.
            </p>

            {/* CTA */}
            <div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="pdp-add-btn"
                style={{
                  padding: "12px 26px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
                  color: C.navy, fontFamily: "'Oswald', sans-serif",
                  fontWeight: 600, fontSize: "13px", letterSpacing: "0.05em",
                  textTransform: "uppercase", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(200,160,52,0.28)",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Add to Basket
              </button>
              <p style={{ marginTop: "8px", fontSize: "11px", color: C.dim }}>
                No payment taken now — we confirm pricing &amp; delivery with you directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ NAVY STRIP ════════════════════════════════════════════════════ */}
      <section style={{ background: C.navy, padding: "18px clamp(20px,5vw,60px)" }}>
        <div className="pdp-strip-row">
          {["UK Manufactured","OEM Certified","Next-Day Available","Batch Quality Tested","30+ Years Experience"].map((t, i) => (
            <div key={i} className="pdp-strip-item">{t}</div>
          ))}
        </div>
      </section>

      {/* ══ BASKET DRAWER ═════════════════════════════════════════════════ */}
      <BasketDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={title}
        slug={slug}
        mainImageUrl={mainImageUrl}
        packSizes={packSizes}
        unavailablePackSizes={unavailablePackSizes}
      />
    </>
  );
}
