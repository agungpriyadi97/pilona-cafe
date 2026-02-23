import { supabaseService } from "../../../lib/supabaseServer";

function rupiah(n: number) {
  return "Rp " + (n ?? 0).toLocaleString("id-ID");
}

export default async function PrintPage({ params }: { params: { id: string } }) {
  const svc = supabaseService();

  const { data: order, error } = await svc
    .from("orders")
    .select("id,created_at,customer_name,customer_phone,order_type,status,subtotal,tax,total")
    .eq("id", params.id)
    .single();

  if (error || !order) {
    return (
      <html>
        <body style={{ fontFamily: "monospace" }}>
          <div>Order tidak ditemukan.</div>
        </body>
      </html>
    );
  }

  const { data: items } = await svc
    .from("order_items")
    .select("name,qty,price_label,price_value")
    .eq("order_id", params.id);

  const created = new Date(order.created_at).toLocaleString("id-ID");

  return (
    <html>
      <head>
        <title>Struk #{order.id.slice(0, 6)}</title>
        <style>{`
          @page { size: 80mm auto; margin: 6mm; }
          body { font-family: monospace; color: #111; }
          .center { text-align: center; }
          .row { display:flex; justify-content: space-between; gap: 8px; }
          .muted { color:#555; }
          hr { border:0; border-top:1px dashed #999; margin: 10px 0; }
          .small { font-size: 12px; }
          .big { font-size: 16px; font-weight: 700; }
        `}</style>
      </head>

      <body>
        <div className="center big">PILONA COFFEE</div>
        <div className="center small muted">Harapan Kita</div>
        <hr />

        <div className="small">
          <div className="row">
            <div>Waktu</div>
            <div>{created}</div>
          </div>
          <div className="row">
            <div>Nama</div>
            <div>{order.customer_name}</div>
          </div>
          <div className="row">
            <div>HP</div>
            <div>{order.customer_phone}</div>
          </div>
          <div className="row">
            <div>Type</div>
            <div>{order.order_type === "DINE_IN" ? "Dine In" : "Take Away"}</div>
          </div>
        </div>

        <hr />
        <div className="big">ITEM</div>

        <div className="small" style={{ marginTop: 8 }}>
          {(items ?? []).map((it: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 6 }}>
              <div className="row">
                <div style={{ maxWidth: "52mm" }}>
                  {it.qty}x {it.name}
                </div>
                <div>{it.price_label ?? (it.price_value ? rupiah(it.price_value) : "")}</div>
              </div>
            </div>
          ))}
        </div>

        <hr />
        <div className="small">
          <div className="row">
            <div>Subtotal</div>
            <div>{rupiah(order.subtotal ?? 0)}</div>
          </div>
          <div className="row">
            <div>Pajak</div>
            <div>{rupiah(order.tax ?? 0)}</div>
          </div>
          <div className="row big">
            <div>Total</div>
            <div>{rupiah(order.total ?? 0)}</div>
          </div>
        </div>

        <hr />
        <div className="center small muted">Terima kasih 🙏</div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = () => {
                window.print();
              };
            `,
          }}
        />
      </body>
    </html>
  );
}