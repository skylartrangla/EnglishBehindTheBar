import { useEffect, useRef, useState } from "react";
import { dictionary } from "../data/course.js";

const HOLD_MS = 2000;
const WORD_PATTERN = /[A-Za-z]+(?:[’'-][A-Za-z]+)*/g;
const SKIP_SELECTOR =
  "input, textarea, select, option, audio, video, [data-no-translate], .translation-popover";

function normalizeWord(word) {
  return word.toLowerCase().replace(/[’']/g, "").replace(/[^a-z-]/g, "");
}

function caretAtPoint(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  if (!document.caretPositionFromPoint) return null;
  const position = document.caretPositionFromPoint(x, y);
  if (!position) return null;
  const range = document.createRange();
  range.setStart(position.offsetNode, position.offset);
  range.collapse(true);
  return range;
}

function wordAtPoint(x, y) {
  const range = caretAtPoint(x, y);
  const node = range?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.parentElement) return null;
  if (node.parentElement.closest(SKIP_SELECTOR)) return null;

  const text = node.textContent || "";
  const offset = Math.min(range.startOffset, Math.max(0, text.length - 1));
  const matches = [...text.matchAll(WORD_PATTERN)];
  const match = matches.find((item) => offset >= item.index && offset <= item.index + item[0].length);
  if (!match) return null;

  const word = match[0];
  const wordRange = document.createRange();
  wordRange.setStart(node, match.index);
  wordRange.setEnd(node, match.index + word.length);
  const rect = wordRange.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  if (x < rect.left - 2 || x > rect.right + 2 || y < rect.top - 2 || y > rect.bottom + 2) {
    return null;
  }

  return {
    id: `${word}-${match.index}-${text}`,
    word,
    translation:
      dictionary[normalizeWord(word)] || "Chưa có bản dịch cho từ này.",
    x: rect.left + rect.width / 2,
    y: rect.top,
  };
}

export default function GlobalTranslator() {
  const [holding, setHolding] = useState(null);
  const [popover, setPopover] = useState(null);
  const timerRef = useRef(null);
  const targetRef = useRef(null);
  const touchStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimeoutRef = useRef(null);

  useEffect(() => {
    const clearHold = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      targetRef.current = null;
      touchStartRef.current = null;
      setHolding(null);
      document.body.classList.remove("translation-holding");
    };

    const begin = (candidate, pointerType, point) => {
      if (!candidate) {
        clearHold();
        return;
      }
      if (targetRef.current?.id === candidate.id) return;

      clearHold();
      targetRef.current = candidate;
      if (pointerType !== "mouse") touchStartRef.current = point;
      setHolding({ x: point.x, y: point.y });
      document.body.classList.add("translation-holding");
      timerRef.current = window.setTimeout(() => {
        setPopover({
          ...candidate,
          x: Math.min(window.innerWidth - 110, Math.max(110, candidate.x)),
          y: Math.max(90, candidate.y - 8),
        });
        if (pointerType !== "mouse") {
          suppressClickRef.current = true;
          window.clearTimeout(suppressTimeoutRef.current);
          suppressTimeoutRef.current = window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 1200);
        }
        clearHold();
      }, HOLD_MS);
    };

    const handlePointerMove = (event) => {
      if (event.pointerType !== "mouse") {
        if (
          touchStartRef.current &&
          Math.hypot(
            event.clientX - touchStartRef.current.x,
            event.clientY - touchStartRef.current.y,
          ) > 12
        ) {
          clearHold();
        }
        return;
      }
      begin(wordAtPoint(event.clientX, event.clientY), "mouse", {
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerDown = (event) => {
      if (event.pointerType === "mouse") return;
      setPopover(null);
      begin(wordAtPoint(event.clientX, event.clientY), event.pointerType, {
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerEnd = (event) => {
      if (event.pointerType !== "mouse") clearHold();
    };

    const handleClick = (event) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      window.clearTimeout(suppressTimeoutRef.current);
      event.preventDefault();
      event.stopPropagation();
    };

    const handleContextMenu = (event) => {
      if (touchStartRef.current || suppressClickRef.current) event.preventDefault();
    };

    const dismiss = () => {
      clearHold();
      setPopover(null);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerEnd, { passive: true });
    document.addEventListener("pointercancel", handlePointerEnd, { passive: true });
    document.addEventListener("pointerleave", clearHold);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);

    return () => {
      clearHold();
      window.clearTimeout(suppressTimeoutRef.current);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerEnd);
      document.removeEventListener("pointerleave", clearHold);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, []);

  return (
    <>
      {holding && (
        <span
          className="translation-hold-indicator"
          style={{ left: holding.x, top: holding.y }}
          aria-hidden="true"
        />
      )}
      {popover && (
        <aside
          className="translation-popover"
          style={{ left: popover.x, top: popover.y }}
          role="status"
          aria-live="polite"
        >
          <strong>{popover.word}</strong>
          <span>{popover.translation}</span>
          <button type="button" onClick={() => setPopover(null)} aria-label="Close translation">
            ×
          </button>
        </aside>
      )}
    </>
  );
}
