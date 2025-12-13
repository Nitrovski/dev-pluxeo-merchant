import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import QRCode from "qrcode";

type EnrollResponse = {
  cardId: string;
  walletToken: string;
  merchantName?: string;
  cardContent?: any;
};

type Status = "loading" | "done" | "error";

export function EnrollmentPage() {
  const { code } = useParams();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<EnrollResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (!code) {
          setStatus("error");
          setError("Chybí kód v URL.");
          return;
        }

        // 1) zavolej enroll
        const res = await fetch(`${API_BASE_URL}/api/enroll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setError(json?.error || "Enroll se nepodařil.");
          return;
        }

        if (cancelled) return;

        setData(json);
        setStatus("done");

        // 2) vygeneruj QR pro zákazníka (walletToken)
        // Později tohle nahradíš "Add to Apple/Google Wallet"
        const qrText = json.walletToken; // nebo URL typu `${window.location.origin}/c/${json.walletToken}`
        const png = await QRCode.toDataURL(qrText, { margin: 2, width: 280 });

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
      <div style={{ padding: 24 }}>
        <h1>Přidávám kartu…</h1>
        <p>Chvilku strpení.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: 24 }}>
        <h1>Nepodařilo se přidat kartu</h1>
        <p>{error}</p>
        <p style={{ marginTop: 16 }}>
          <Link to="/">Zpět</Link>
        </p>
      </div>
    );
  }

  // done
  return (
    <div style={{ padding: 24 }}>
      <h1>Karta vytvořena ✅</h1>
      <p>
        {data?.merchantName ? (
          <>Podnik: <b>{data.merchantName}</b></>
        ) : (
          <>Kartička je připravená.</>
        )}
      </p>

      <div style={{ marginTop: 20 }}>
        <h3>Váš QR kód</h3>
        <p>Ukažte ho obsluze při návštěvě (později to bude v Apple/Google Wallet).</p>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Customer QR" style={{ width: 280, height: 280 }} />
        ) : (
          <p>Generuji QR…</p>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <small>Token: {data?.walletToken}</small>
      </div>
    </div>
  );
}
