import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useShot, useTheme } from "../context";
import { LAYOUT } from "../theme";
import type { Word } from "../types";
import { usePop } from "./ui";

const MAX_WORDS = 3;
const MAX_CHARS = 18;

/** Splits a line into short caption pages, breaking after punctuation. */
const paginate = (words: Word[]) => {
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const word of words) {
    const chars =
      page.reduce((n, w) => n + w.text.length + 1, 0) + word.text.length;
    if (page.length === MAX_WORDS || (page.length > 0 && chars > MAX_CHARS)) {
      pages.push(page);
      page = [];
    }
    page.push(word);
    if (/[.,!?;:]$/.test(word.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  return mergeOrphans(pages);
};

const chars = (page: Word[]) =>
  page.reduce((n, w) => n + w.text.length + 1, -1);
const endsSentence = (page: Word[]) =>
  /[.,!?;:]$/.test(page[page.length - 1].text);

/** Pulls a lone trailing word ("…built in" + "code.") back onto the page before it. */
const mergeOrphans = (pages: Word[][]) =>
  pages.reduce<Word[][]>((merged, page) => {
    const before = merged[merged.length - 1];
    if (
      page.length === 1 &&
      before &&
      !endsSentence(before) &&
      chars(before) + chars(page) < MAX_CHARS + 8
    ) {
      before.push(page[0]);
    } else {
      merged.push(page);
    }
    return merged;
  }, []);

type Props = {
  /** Top of the caption band; defaults to the band under the stage. */
  top?: number;
  /** Left edge, moved right when the print host stands bottom left. */
  left?: number;
};

/** Word-by-word captions in the reel's style, one short page at a time. */
export const Captions: React.FC<Props> = ({
  top = LAYOUT.captionTop,
  left = LAYOUT.captionLeft,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const { words } = useShot();
  const pages = useMemo(() => paginate(words), [words]);
  const t = frame / fps;

  const pageIndex = Math.max(
    0,
    pages.findLastIndex((p) => p[0].start <= t),
  );
  const page = pages[pageIndex];
  const enter = usePop(Math.round((page?.[0].start ?? 0) * fps) - 1, {
    damping: 15,
    stiffness: 260,
  });
  if (!page) return null;
  const current = page.findLastIndex((w) => w.start <= t);
  const Look = theme.style === "print" ? PaperStrip : Chips;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right: LAYOUT.captionRight,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Look page={page} current={current} t={t} enter={enter} tilt={pageIndex % 2 ? 1.2 : -1.5} />
    </div>
  );
};

type LookProps = {
  page: Word[];
  current: number;
  /** Seconds into the shot. */
  t: number;
  enter: number;
  tilt: number;
};

const bare = (word: Word) => word.text.replace(/[.,!?;:]+$/, "");

/** Flat: spoken words fill in, the current word sits on an accent block. */
const Chips: React.FC<LookProps> = ({ page, current, enter }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 18px",
        fontWeight: 800,
        fontSize: 62,
        lineHeight: 1.15,
        textTransform: "uppercase",
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px) scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
      }}
    >
      {page.map((word, i) => {
        const active = i === current;
        return (
          <span
            key={i}
            style={{
              padding: "2px 14px",
              borderRadius: 14,
              color: active ? theme.card : theme.ink,
              background: active ? theme.accent : theme.card,
              border: theme.edge(5),
              boxShadow: theme.shadow(7),
              opacity: i <= current ? 1 : 0.35,
              transform: active ? "rotate(-2deg) scale(1.06)" : undefined,
            }}
          >
            {bare(word)}
          </span>
        );
      })}
    </div>
  );
};

/** Print: the whole page sits on a paper strip and each word fills with ink as it's said. */
const PaperStrip: React.FC<LookProps> = ({ page, current, t, enter, tilt }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        ...theme.surface(theme.card),
        boxShadow: theme.shadow(12),
        borderRadius: 12,
        padding: "10px 28px 14px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 20px",
        fontFamily: theme.display,
        fontSize: 58,
        lineHeight: 1.12,
        textTransform: "uppercase",
        transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px) rotate(${tilt * enter}deg)`,
        opacity: Math.min(1, enter * 2),
      }}
    >
      {page.map((word, i) => {
        const fill =
          i < current
            ? 1
            : i > current
              ? 0
              : interpolate(t, [word.start, Math.max(word.end, word.start + 0.12)], [0.15, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
        const ink = i === current ? theme.accent : theme.ink;
        return (
          <span
            key={i}
            style={{
              color: "transparent",
              backgroundImage: `linear-gradient(90deg, ${ink} ${fill * 100}%, ${theme.ink}2e ${fill * 100}%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {bare(word)}
          </span>
        );
      })}
    </div>
  );
};
