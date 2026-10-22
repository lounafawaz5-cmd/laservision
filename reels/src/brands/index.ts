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
  // "clean": white bold words with a shadow, no box (LaserVision house style).
  // "box": text on a solid caption box.
  captionStyle: "clean" | "box";
  outroLine: string;
};

// Colors: brand/laservision/GUIDELINES.md and brand/zeiss/GUIDELINES.md.
// Rules from the strategy doc (strategy/SUMMARY.md):
// - Laser Vision: calm, clean, muted. CTA is WhatsApp, never sales language.
// - ZVC: bright, high contrast. Never the ZEISS block logo; use the ZVC "by Laser Vision" wordmark.
export const brands: Record<BrandId, Brand> = {
  laservision: {
    name: "LaserVision",
    logo: "brand/laservision-logo.png",
    colors: {
      background: "#FFFFFF",
      primary: "#005D83",
      accent: "#30A4BF",
      text: "#FFFFFF",
      captionBg: "#005D83",
      captionText: "#FFFFFF",
    },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    captionStyle: "clean",
    outroLine: "WhatsApp +961 81 54 20 20",
  },
  zvc: {
    // Store name is fine on screen; the blue ZEISS block logo is not. Use the "by Laser Vision" wordmark.
    name: "ZEISS Vision Center",
    logo: "brand/zvc-wordmark-white.png",
    colors: {
      background: "#000000",
      primary: "#000000",
      accent: "#D9E906",
      text: "#FFFFFF",
      captionBg: "#FFFFFF",
      captionText: "#000000",
    },
    fonts: { latin: LATIN, arabic: ARABIC_FONT },
    captionStyle: "box",
    outroLine: "WhatsApp us your prescription\n81 47 20 20",
  },
};

const ARABIC = /[؀-ۿ]/;
export const isArabic = (text: string) => ARABIC.test(text);

// Mixed lines (Arabic with English terms like IPL) need both fonts in the stack,
// otherwise the Latin words fall back to a serif system font.
export const fontFor = (brand: Brand, text: string) => {
  const latin = `"${brand.fonts.latin}"`;
  const arabic = `"${brand.fonts.arabic}"`;
  return isArabic(text) ? `${arabic}, ${latin}, sans-serif` : `${latin}, ${arabic}, sans-serif`;
};
