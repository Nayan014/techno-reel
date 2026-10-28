import React, { useEffect, useId, useState } from "react";
import { Img, staticFile, useDelayRender } from "remotion";

/**
 * A product's logo from public/ (fetched for each reel by the brand-logos skill), fitted into a
 * `size` px square. `tint` redraws it as a silhouette in that colour; pass it only for a mono logo
 * (see useMonoLogo), so a colour logo keeps its own colours.
 */
export const Logo: React.FC<{ src: string; size: number; tint?: string }> = ({
  src,
  size,
  tint,
}) => {
  const id = `logo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      {tint && (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <filter id={id} colorInterpolationFilters="sRGB">
            <feFlood floodColor={tint} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </svg>
      )}
      <Img
        src={staticFile(src)}
        style={{
          display: "block",
          width: size,
          height: size,
          objectFit: "contain",
          filter: tint ? `url(#${id})` : undefined,
        }}
      />
    </>
  );
};

/**
 * True when the logo at `src` is an SVG in one black, white or grey, so a scene may redraw it in
 * a theme colour. A coloured logo (even a one-colour one like Claude's orange) and a PNG stay as is.
 */
export const useMonoLogo = (src?: string) => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => (src ? delayRender(`Reading logo ${src}`) : null));
  const [mono, setMono] = useState(false);

  useEffect(() => {
    if (!src || handle === null) return;
    fetch(staticFile(src))
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `No logo at public/${src}. "icon" is a file path under public/, ` +
              `e.g. "reels/<slug>/icons/openai.svg" (fetch it with the brand-logos skill).`,
          );
        }
        return src.endsWith(".svg") ? res.text() : "";
      })
      .then((svg) => {
        setMono(svg !== "" && isMono(svg));
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [src, handle, continueRender, cancelRender]);

  return mono;
};

/** No gradients or pictures, and every fill and stroke is the same grey. */
const isMono = (svg: string) => {
  if (/<(linearGradient|radialGradient|pattern|image)\b/i.test(svg)) return false;
  const colors = new Set(
    Array.from(
      svg.matchAll(/(?:fill|stroke|stop-color)\s*[:=]\s*["']?\s*([^"';\s>}]+)/gi),
      (m) => m[1].toLowerCase(),
    ).filter((c) => !/^(none|transparent|currentcolor|inherit|url\()/.test(c)),
  );
  return colors.size <= 1 && [...colors].every(isGrey);
};

const isGrey = (color: string) => {
  if (["black", "white", "gray", "grey"].includes(color)) return true;
  const hex = color.match(/^#([0-9a-f]{3,8})$/)?.[1];
  if (!hex) return false;
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 24;
};
