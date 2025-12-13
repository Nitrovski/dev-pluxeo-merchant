import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import QRCode from "qrcode";

type EnrollResponse = {
  cardId: string;
  walletToken: string;
  merchantName?: string;
  cardContent?: any;
};

export function EnrollmentPage() {
  const { code } = useParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<EnrollResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (!code) {
          setStatus("error");
          setError("Chybí kód v URL.");
          return;
        }

        // ✅ volání BE enroll
        const res = await fetch(`${API_BASE_URL}/api/enroll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setError(json?.error || "Nepodařilo se přidat kartu.");
          return;
        }

        if (cancelled) return;

        setData(json);
        setStatus("done");

        // ✅ zákaznický QR (pro pozdější scan u merchanta)
        const png = await QRCode.toDataURL(json.walletToken, { width: 260, margin: 2 });
        if (!cancelled) setQrDataUrl(png);
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setError(e?.message || "Nastala chyba.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="text-lg font-semibold">Přidávám kartu…</div>
          <div className="mt-2 text-sm text-slate-400">Chvilku strpení.</div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="text-lg font-semibold">Nepodařilo se přidat kartu</div>
          <div className="mt-2 text-sm text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <div className="text-lg font-semibold">Karta vytvořena ✅</div>
        <div className="mt-1 text-sm text-slate-400">
          {data?.merchantName ? <>Podnik: <span className="text-slate-100 font-medium">{data.merchantName}</span></> : "Hotovo."}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-sm font-semibold">Váš QR kód</div>
          <div className="text-xs text-slate-400">Ukažte ho obsluze (později bude v Apple/Google Wallet).</div>

          <div className="mt-3 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Customer QR" className="h-[260px] w-[260px] rounded-xl" />
            ) : (
              <div className="h-[260px] w-[260px] rounded-xl bg-slate-900/40" />
            )}
          </div>
        </div>

        <div className="mt-4 text-[11px] text-slate-500 break-all">
          Token: {data?.walletToken}
        </div>
      </div>
    </div>
  );
}
