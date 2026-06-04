import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OUTSIDE",
    short_name: "OUTSIDE",
    description: "Le monde est dehors.",
    start_url: "/home",
    display: "standalone",
    background_color: "#050509",
    theme_color: "#ff3d5a",
    orientation: "portrait",
    scope: "/",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/monochrome-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "monochrome",
      },
      {
        src: "/icons/monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
    shortcuts: [
      {
        name: "Créer un plan",
        short_name: "Créer",
        description: "Créer un nouveau plan",
        url: "/plans/new",
        icons: [
          {
            src: "/icons/shortcut-create.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Explorer",
        short_name: "Explorer",
        description: "Découvrir les plans et lieux autour de toi",
        url: "/home",
        icons: [
          {
            src: "/icons/shortcut-explore.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Lieux",
        short_name: "Lieux",
        description: "Explorer les lieux partenaires",
        url: "/places",
        icons: [
          {
            src: "/icons/shortcut-explore.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
