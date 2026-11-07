import type { MetadataRoute } from "next";

// Lets people add Promise Pals to their phone's home screen and open it like a real app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promise Pals",
    short_name: "Promise Pals",
    description: "Keep your health promises with a real partner in Calgary.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
