import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts so renders never depend on network access.
// Swap for each brand's own font files once the brand kits arrive.
const LATIN = "Inter";
const ARABIC_FONT = "Noto Sans Arabic";
for (const weight of ["400", "700", "800"]) {
  loadFont({ family: LATIN, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
  loadFont({ family: ARABIC_FONT, url: staticFile(`fonts/noto-sans-arabic-arabic-${weight}-normal.woff2`), weight });
}

export type BrandId = "laservision" | "zvc";

export type Brand = {
  name: string;
  // Path in public/. Leave empty to show the name as text instead.
  logo: string;
  colors: {
    background: string;
    primary: string;
    accent: string;
    text: string;
    captionBg: string;
    captionText: string;
  };
  fonts: { latin: string; arabic: string };
  outroLine: string;
};

// Rules from the strategy doc (strategy/SUMMARY.md):
// - Laser Vision: calm, clean, muted. CTA is WhatsApp, never sales language.
// - ZVC: bright, high contrast. The ZEISS name and logo may NOT appear in original content.
export const brands: Record<BrandId, Brand> = {
  laservision: {
    name: "LaserVision",
    logo: "brand/laservision-logo.png",
    colors: {
      background: "#FFFFFF",
      primary: "#15557C",
      accent: "#8FB8CF",
      text: "#FFFFFF",
      captionBg: "rgba(21,85,124,0.88)",
      captionText: "#FFFFFF",
    },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    outroLine: "Questions? WhatsApp us",
  },
  zvc: {
    // PLACEHOLDER: confirm the store name allowed on screen (no ZEISS name/logo in original content).
    name: "Vision Center",
    logo: "",
    colors: {
      background: "#111111",
      primary: "#111111",
      accent: "#FFD84D",
      text: "#FFFFFF",
      captionBg: "#FFFFFF",
      captionText: "#111111",
    },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    outroLine: "WhatsApp us your prescription\n81 47 20 20",
  },
};

const ARABIC = /[؀-ۿ]/;
export const isArabic = (text: string) => ARABIC.test(text);

export const fontFor = (brand: Brand, text: string) =>
  isArabic(text) ? brand.fonts.arabic : brand.fonts.latin;
