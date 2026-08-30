import { ImageResponse } from "next/og";

/**
 * Generated app icon (issue #18). A simple brand monogram on the brand colour —
 * no external asset. A designed favicon/OG image is tracked as deferred work
 * (issue #4 hero/OG asset).
 */

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b0522f",
          color: "#faf7f2",
          fontSize: 320,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
