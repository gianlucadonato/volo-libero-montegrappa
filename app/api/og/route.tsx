import { ImageResponse } from "@vercel/og";

export async function GET() {
  try {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          fontSize: 60,
          color: "black",
          background: "#f6f6f6",
          width: "100%",
          height: "100%",
          paddingTop: 50,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>ASD Volo Libero Montegrappa</p>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.log(error);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
