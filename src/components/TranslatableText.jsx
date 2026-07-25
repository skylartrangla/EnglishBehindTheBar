import { useEffect, useRef, useState } from "react";
import { dictionary } from "../data/course.js";

const HOLD_MS = 5000;

function normalizeWord(word) {
  return word.toLowerCase().replace(/[’']/g, "").replace(/[^a-z-]/g, "");
}

function Word({ children, translation, onOpen }) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);
  const startPoint = useRef(null);

  const cancel = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    startPoint.current = null;
    setHolding(false);
  };

  const reveal = (element) => {
    cancel();
    const rect = element.getBoundingClientRect();
    onOpen({
      word: children,
      translation,
      x: Math.min(window.innerWidth - 110, Math.max(110, rect.left + rect.width / 2)),
      y: Math.max(90, rect.top - 8),
    });
  };

  const begin = (event) => {
    if (event.pointerType === "mouse" && event.type !== "pointerenter") return;
    if (event.pointerType !== "mouse" && event.type !== "pointerdown") return;

    cancel();
    startPoint.current = { x: event.clientX, y: event.clientY };
    setHolding(true);
    const element = event.currentTarget;
    timerRef.current = window.setTimeout(() => reveal(element), HOLD_MS);
  };

  const handleMove = (event) => {
    if (!startPoint.current || event.pointerType === "mouse") return;
    const moved = Math.hypot(
      event.clientX - startPoint.current.x,
      event.clientY - startPoint.current.y,
    );
    if (moved > 12) cancel();
  };

  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      className={`translation-word${holding ? " is-holding" : ""}`}
      onPointerEnter={begin}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") cancel();
      }}
      onPointerDown={begin}
      onPointerMove={handleMove}
      onPointerUp={(event) => {
        if (event.pointerType !== "mouse") cancel();
      }}
      onPointerCancel={cancel}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          reveal(event.currentTarget);
        }
      }}
      aria-label={`${children}. Hold for five seconds to translate.`}
    >
      {children}
    </button>
  );
}

export default function TranslatableText({ text, className = "", sentenceTranslation = "" }) {
  const [popover, setPopover] = useState(null);
  const parts = text.split(/(\s+|[.,!?;:()[\]“”"]+)/).filter(Boolean);

  useEffect(() => {
    if (!popover) return undefined;
    const dismiss = () => setPopover(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [popover]);

  return (
    <span className={`translatable-text ${className}`}>
      {parts.map((part, index) => {
        const key = normalizeWord(part);
        if (!key) return <span key={`${part}-${index}`}>{part}</span>;
        const translation = dictionary[key] || sentenceTranslation || "Chưa có nghĩa trong từ điển bài học.";
        return (
          <Word key={`${part}-${index}`} translation={translation} onOpen={setPopover}>
            {part}
          </Word>
        );
      })}
      {popover && (
        <span
          className="translation-popover"
          style={{ left: popover.x, top: popover.y }}
          role="status"
        >
          <strong>{popover.word}</strong>
          <span>{popover.translation}</span>
          <button type="button" onClick={() => setPopover(null)} aria-label="Close translation">
            ×
          </button>
        </span>
      )}
    </span>
  );
}
