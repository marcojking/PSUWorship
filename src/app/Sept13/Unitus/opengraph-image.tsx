import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export const alt = "WM&A × UNITUS Sponsorship Proposal";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const photoData = await readFile(
    join(process.cwd(), "public/about/ep-art-flowers.jpg"),
    "base64",
  );
  const photoSrc = `data:image/jpeg;base64,${photoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        <img
          src={photoSrc}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.78) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 64,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: 64,
              height: 5,
              background: "#b45741",
              marginBottom: 22,
            }}
          />
          <div
            style={{
              fontSize: 60,
              fontWeight: 600,
              color: "#fff7eb",
              letterSpacing: -1,
            }}
          >
            WM&amp;A × UNITUS
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#fff7eb",
              opacity: 0.85,
              marginTop: 10,
            }}
          >
            Sponsorship Proposal
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
