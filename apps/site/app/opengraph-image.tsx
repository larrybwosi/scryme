import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Scryme — Enterprise Business Platform";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #4338ca, #6366f1)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#4338ca",
            }}
          >
            S
          </div>
          <span
            style={{
              marginLeft: "24px",
              fontSize: "72px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "-0.05em",
            }}
          >
            Scryme
          </span>
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.2,
          }}
        >
          The all-in-one enterprise platform for CRM, POS, Inventory, and Finance
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
