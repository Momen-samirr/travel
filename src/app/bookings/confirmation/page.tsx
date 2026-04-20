"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>({
    loading: true,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const invoiceId = params.get("invoice_id") || "";
    const status = (params.get("invoice_status") || "").toUpperCase();
    const success = params.get("success") || "";

    const debug = {
      fullUrl: window.location.href,
      parsed: {
        invoiceId,
        status,
        success,
      },
    };

    // ❌ No invoice_id
    if (!invoiceId) {
      setData({
        error: "NO_INVOICE_ID",
        debug,
      });
      return;
    }

    // ✅ Call backend to verify + update booking
    fetch("/api/payments/payin/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoiceId,
        status,
        success,
      }),
    })
      .then(async (res) => {
        const json = await res.json();

        if (json.success && json.bookingId) {
          // ✅ Redirect to final confirmation page
          window.location.href = `/bookings/${json.bookingId}/confirmation`;
        } else {
          setData({
            error: json.error || "UNKNOWN_ERROR",
            debug,
            response: json,
          });
        }
      })
      .catch((err) => {
        setData({
          error: "CLIENT_ERROR",
          message: err.message,
          debug,
        });
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <pre style={{ fontSize: "16px" }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
