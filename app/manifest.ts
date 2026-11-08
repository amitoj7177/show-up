import type { MetadataRoute } from "next";

// Lets people add Promise Pals to their phone's home screen and open it like a real app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promise Pals",
    short_name: "Promise Pals",
    description: "Pairs Calgarians who struggle to stick to their health goals with a nearby partner. Built for people step counters leave out.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8e7",
    theme_color: "#ffd54f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
