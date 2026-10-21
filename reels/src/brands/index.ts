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

export type BrandId = "laservision" | "zeiss";

export type Brand = {
  name: string;
  colors: {
    primary: string;
    accent: string;
    text: string;
    captionBg: string;
  };
  fonts: { latin: string; arabic: string };
  outroLine: string;
};

// PLACEHOLDERS: replace colors, fonts and outro copy with each brand kit.
export const brands: Record<BrandId, Brand> = {
  laservision: {
    name: "Laser Vision",
    colors: { primary: "#0B3D91", accent: "#2EC4F1", text: "#FFFFFF", captionBg: "rgba(11,61,145,0.85)" },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    outroLine: "Book your consultation",
  },
  zeiss: {
    name: "Zeiss",
    colors: { primary: "#141E8C", accent: "#FFFFFF", text: "#FFFFFF", captionBg: "rgba(0,0,0,0.75)" },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    outroLine: "Visit us in store",
  },
};

const ARABIC = /[؀-ۿ]/;
export const isArabic = (text: string) => ARABIC.test(text);

export const fontFor = (brand: Brand, text: string) =>
  isArabic(text) ? brand.fonts.arabic : brand.fonts.latin;
