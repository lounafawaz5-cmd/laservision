import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import opentype from "opentype.js";

// Real extruded 3D lettering (three.js) from a bundled font, for text that sits in the scene
// and casts shadows. Units are whatever the scene uses (the edits use centimetres).

const fontCache = new Map<string, Promise<opentype.Font>>();
const loadFont = (file: string) => {
  if (!fontCache.has(file)) {
    fontCache.set(file, fetch(staticFile(file)).then((r) => r.arrayBuffer()).then((b) => opentype.parse(b)));
  }
  return fontCache.get(file)!;
};

export const useOpenTypeFont = (file: string) => {
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [handle] = useState(() => delayRender(`font ${file}`));
  useEffect(() => {
    loadFont(file).then((f) => {
      setFont(f);
      continueRender(handle);
    });
  }, [file, handle]);
  return font;
};

export type Glyph = {
  char: string;
  geometry: THREE.ExtrudeGeometry;
  // Centre of the glyph's footprint, in the block's coordinates (x along the line, y up).
  x: number;
  y: number;
  width: number;
};

export type Extrude = { depth: number; bevel: number };

/** One geometry per letter, centred on its own footprint so it can move on its own. */
export const layoutGlyphs = (
  font: opentype.Font,
  lines: string[],
  capHeight: number,
  lineGap: number,
  extrude: Extrude,
  letterSpacing = 0,
): Glyph[] => {
  const unitsCap = (font.tables.os2 as { sCapHeight?: number }).sCapHeight || font.unitsPerEm * 0.7;
  const size = (capHeight / unitsCap) * font.unitsPerEm;
  const out: Glyph[] = [];
  const lineWidths = lines.map(
    (l) => font.getAdvanceWidth(l, size, { kerning: true }) + letterSpacing * Math.max(0, l.length - 1),
  );
  lines.forEach((line, li) => {
    // Lines stack upward from the last one, which stands on the surface.
    const baseY = (lines.length - 1 - li) * (capHeight + lineGap);
    let pen = -lineWidths[li] / 2;
    const glyphs = font.stringToGlyphs(line);
    glyphs.forEach((g, gi) => {
      const adv = ((g.advanceWidth ?? 0) / font.unitsPerEm) * size;
      const char = line[gi];
      if (char !== " ") {
        const path = g.getPath(0, 0, size);
        const sp = new THREE.ShapePath();
        for (const c of path.commands) {
          // opentype is y-down; three is y-up.
          if (c.type === "M") sp.moveTo(c.x, -c.y);
          else if (c.type === "L") sp.lineTo(c.x, -c.y);
          else if (c.type === "Q") sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
          else if (c.type === "C") sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
        }
        const shapes = sp.toShapes(false);
        const geometry = new THREE.ExtrudeGeometry(shapes, {
          depth: extrude.depth,
          curveSegments: 10,
          bevelEnabled: true,
          bevelThickness: extrude.bevel,
          bevelSize: extrude.bevel * 0.8,
          bevelSegments: 4,
        });
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox!;
        const cx = (bb.min.x + bb.max.x) / 2;
        // Origin of each letter: centre-bottom of its footprint, middle of its thickness.
        geometry.translate(-cx, 0, -extrude.depth / 2);
        geometry.computeVertexNormals();
        out.push({ char, geometry, x: pen + cx, y: baseY, width: bb.max.x - bb.min.x });
      }
      pen += adv + letterSpacing;
    });
    // Kerning is small at these sizes; advance widths are enough for display lettering.
  });
  return out;
};

export const useGlyphs = (
  font: opentype.Font | null,
  lines: string[],
  capHeight: number,
  lineGap: number,
  extrude: Extrude,
  letterSpacing = 0,
) =>
  useMemo(
    () => (font ? layoutGlyphs(font, lines, capHeight, lineGap, extrude, letterSpacing) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [font, lines.join("\n"), capHeight, lineGap, extrude.depth, extrude.bevel, letterSpacing],
  );
