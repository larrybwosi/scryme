import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Scryme Product Page";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { category: string } }) {
  const { category } = params;
  const title = category.toUpperCase();

  const getColor = (cat: string) => {
    switch (cat) {
      case "crm":
        return "#6366f1";
      case "pos":
        return "#10b981";
      case "inventory":
        return "#f59e0b";
      case "finance":
        return "#ec4899";
      default:
        return "#4338ca";
    }
  };

  const getDescription = (cat: string) => {
    switch (cat) {
      case "crm":
        return "Close more deals with a visual pipeline built for scale.";
      case "pos":
        return "A desktop POS that keeps selling — even offline.";
      case "inventory":
        return "Real-time stock control across every location.";
      case "finance":
        return "Books that balance themselves automatically.";
      default:
        return "Enterprise solutions for your business.";
    }
  };

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
          padding: "80px",
          border: `20px solid ${getColor(category)}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "15px",
              background: getColor(category),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            S
          </div>
          <span
            style={{
              marginLeft: "20px",
              fontSize: "40px",
              fontWeight: "bold",
              color: "#111827",
            }}
          >
            Scryme
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: getColor(category),
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            {title} Module
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#111827",
              lineHeight: 1.1,
              maxWidth: "800px",
            }}
          >
            {getDescription(category)}
          </div>
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "#6b7280",
          }}
        >
          scryme.tech/products/{category}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
