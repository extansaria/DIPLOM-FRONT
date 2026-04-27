import { html, useEffect, useRef } from "../lib.js";

const frontSvgUrl = "./frontend/src/assets/1.svg";
const backSvgUrl = "./frontend/src/assets/2.svg";

const SVG_NS = "http://www.w3.org/2000/svg";

const hoverFill = "rgba(34, 197, 94, 0.55)";
/** Базовая подсветка кликабельных зон, чтобы было видно куда нажимать. */
const clickableFill = "rgba(34, 197, 94, 0.18)";

/**
 * У груди в 1.svg основной path: fill + mask — зелёный hover маскируется, клик ловится плохо.
 * Добавляем path по контурам из mask поверх и отключаем pointer-events у остальных path в группе.
 */
function ensureBreastHitOverlay(breastG) {
  if (!breastG || breastG.querySelector("path[data-breast-hit]")) return;
  const mask = breastG.querySelector(":scope > mask");
  if (!mask) return;
  const ds = [...mask.querySelectorAll("path")]
    .map((p) => p.getAttribute("d"))
    .filter(Boolean);
  if (!ds.length) return;

  const doc = breastG.ownerDocument;
  const overlay = doc.createElementNS(SVG_NS, "path");
  overlay.setAttribute("d", ds.join(" "));
  overlay.setAttribute("fill", clickableFill);
  overlay.setAttribute("fill-rule", "evenodd");
  overlay.setAttribute("pointer-events", "all");
  overlay.setAttribute("data-breast-hit", "1");
  breastG.appendChild(overlay);

  breastG.querySelectorAll(":scope > path:not([data-breast-hit])").forEach((p) => {
    p.setAttribute("pointer-events", "none");
  });
}

/**
 * Для зон, где контуры заданы через mask, создаем отдельный path-перекрытие:
 * он надежно ловит hover/click и позволяет заливку при наведении.
 */
function ensureZoneMaskHitOverlay(zoneEl, markerAttr) {
  if (!zoneEl || zoneEl.querySelector(`path[${markerAttr}]`)) return;
  const mask = zoneEl.querySelector(":scope > mask");
  if (!mask) return;
  const ds = [...mask.querySelectorAll("path")]
    .map((p) => p.getAttribute("d"))
    .filter(Boolean);
  if (!ds.length) return;

  const doc = zoneEl.ownerDocument;
  const overlay = doc.createElementNS(SVG_NS, "path");
  overlay.setAttribute("d", ds.join(" "));
  overlay.setAttribute("fill", clickableFill);
  overlay.setAttribute("fill-rule", "evenodd");
  overlay.setAttribute("pointer-events", "all");
  overlay.setAttribute(markerAttr, "1");
  zoneEl.appendChild(overlay);

  zoneEl.querySelectorAll(`:scope > path:not([${markerAttr}])`).forEach((p) => {
    p.setAttribute("pointer-events", "none");
  });
}

/** id группы в SVG → каталог (у всех зон одна логика: заливка при hover, как у press). */
const FRONT_MUSCLE_ZONES = [
  { id: "breast", group: "pectoralis-major", title: "Грудь" },
  { id: "trapezoid", group: "trapezius", title: "Трапеция" },
  { id: "shoulders", group: "shoulders", title: "Плечи" },
  { id: "biceps", group: "biceps", title: "Бицепс" },
  { id: "forearms", group: "forearms", title: "Предплечья" },
  { id: "press", group: "core", title: "Пресс" },
  { id: "oblique", group: "obliques", title: "Косые мышцы преса" },
  { id: "quadriceps", group: "quadriceps", title: "Ноги (квадрицепс)" }
];

const BACK_MUSCLE_ZONES = [
  { id: "trapezoid", group: "trapezius", title: "Трапеция" },
  { id: "thewidest", group: "lats", title: "Широчайшая" },
  { id: "buttocks", group: "glutes", title: "Ягодицы" }
];

function findZoneElement(svgRoot, zoneId) {
  const byId = svgRoot.getElementById(zoneId);
  if (byId) return byId;
  if (zoneId.includes(" ")) {
    return svgRoot.querySelector(`[id="${zoneId.replace(/"/g, "")}"]`);
  }
  return null;
}

function pathsForInteraction(zoneEl) {
  if (zoneEl instanceof SVGPathElement) return [zoneEl];
  if (zoneEl.id === "breast") {
    const hit = zoneEl.querySelector("path[data-breast-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "quadriceps") {
    const hit = zoneEl.querySelector("path[data-quadriceps-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "shoulders") {
    const hit = zoneEl.querySelector("path[data-shoulders-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "biceps") {
    const hit = zoneEl.querySelector("path[data-biceps-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "forearms") {
    const hit = zoneEl.querySelector("path[data-forearms-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "trapezoid") {
    const hit = zoneEl.querySelector("path[data-trapezoid-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "thewidest") {
    const hit = zoneEl.querySelector("path[data-thewidest-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "buttocks") {
    const hit = zoneEl.querySelector("path[data-buttocks-hit]");
    if (hit) return [hit];
  }
  return [...zoneEl.querySelectorAll("path")].filter((p) => !p.closest("mask"));
}

function prepareHitArea(paths) {
  paths.forEach((p) => {
    const f = p.getAttribute("fill");
    if (!f || f === "none") p.setAttribute("fill", clickableFill);
    p.setAttribute("pointer-events", "all");
  });
}

export function MuscleMap({ onMuscleSelect }) {
  const frontHostRef = useRef(null);
  const backHostRef = useRef(null);

  function setupInteractiveFigure(host, svgUrl, ariaLabel, zones) {
    if (!host || typeof onMuscleSelect !== "function") return undefined;

    const ac = new AbortController();
    let alive = true;
    let rafId = 0;
    const detachFns = [];

    (async () => {
      try {
        const res = await fetch(svgUrl, { signal: ac.signal });
        if (!res.ok || !alive || ac.signal.aborted) return;
        const txt = await res.text();
        if (!alive || ac.signal.aborted) return;

        const parsed = new DOMParser().parseFromString(txt, "image/svg+xml");
        if (parsed.querySelector("parsererror")) return;

        const svgEl = parsed.documentElement;
        svgEl.setAttribute("role", "img");
        svgEl.setAttribute("aria-label", ariaLabel);
        svgEl.style.width = "100%";
        svgEl.style.height = "auto";
        svgEl.style.maxHeight = "500px";
        svgEl.style.display = "block";

        const seenIds = new Set();
        for (const zone of zones) {
          if (seenIds.has(zone.id)) continue;
          const el = findZoneElement(svgEl, zone.id);
          if (!el) continue;
          if (zone.id === "breast") ensureBreastHitOverlay(el);
          if (zone.id === "quadriceps") ensureZoneMaskHitOverlay(el, "data-quadriceps-hit");
          if (zone.id === "shoulders") ensureZoneMaskHitOverlay(el, "data-shoulders-hit");
          if (zone.id === "biceps") ensureZoneMaskHitOverlay(el, "data-biceps-hit");
          if (zone.id === "forearms") ensureZoneMaskHitOverlay(el, "data-forearms-hit");
          if (zone.id === "trapezoid") ensureZoneMaskHitOverlay(el, "data-trapezoid-hit");
          if (zone.id === "thewidest") ensureZoneMaskHitOverlay(el, "data-thewidest-hit");
          if (zone.id === "buttocks") ensureZoneMaskHitOverlay(el, "data-buttocks-hit");
          const paths = pathsForInteraction(el);
          if (!paths.length) continue;
          prepareHitArea(paths);
          seenIds.add(zone.id);
        }

        const root = document.importNode(svgEl, true);
        if (!alive || ac.signal.aborted) return;
        host.replaceChildren(root);

        const states = [];
        seenIds.clear();
        for (const zone of zones) {
          if (seenIds.has(zone.id)) continue;
          const zoneEl = findZoneElement(root, zone.id);
          if (!zoneEl) continue;
          const pathsLive = pathsForInteraction(zoneEl);
          if (!pathsLive.length) continue;
          seenIds.add(zone.id);
          zoneEl.setAttribute("data-muscle-zone-id", zone.id);
          zoneEl.setAttribute("aria-label", zone.title);
          zoneEl.style.cursor = "pointer";
          const baseFills = pathsLive.map((p) => p.getAttribute("fill"));
          states.push({ zone, pathsLive, baseFills });
        }

        function clearAllHover() {
          for (const s of states) {
            s.pathsLive.forEach((p, i) => p.setAttribute("fill", s.baseFills[i] || clickableFill));
          }
        }

        function applyHover(zoneId) {
          clearAllHover();
          if (!zoneId) return;
          const s = states.find((st) => st.zone.id === zoneId);
          if (!s) return;
          s.pathsLive.forEach((p) => p.setAttribute("fill", hoverFill));
        }

        let activeZoneId = null;

        function pickZoneIdUnderPointer(clientX, clientY) {
          const hits = document.elementsFromPoint(clientX, clientY);
          for (const node of hits) {
            if (!root.contains(node)) continue;
            const marker = node.closest("[data-muscle-zone-id]");
            if (marker && root.contains(marker)) {
              return marker.getAttribute("data-muscle-zone-id");
            }
          }
          return null;
        }

        function onPointerMove(e) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            const next = pickZoneIdUnderPointer(e.clientX, e.clientY);
            if (next === activeZoneId) return;
            activeZoneId = next;
            applyHover(next);
          });
        }

        function onPointerLeave() {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = 0;
          activeZoneId = null;
          clearAllHover();
        }

        function onClick(e) {
          const id = pickZoneIdUnderPointer(e.clientX, e.clientY);
          if (!id) return;
          const z = zones.find((x) => x.id === id);
          if (!z) return;
          e.preventDefault();
          e.stopPropagation();
          onMuscleSelect(z.group);
        }

        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("pointerleave", onPointerLeave);
        root.addEventListener("click", onClick);

        detachFns.push(() => {
          root.removeEventListener("pointermove", onPointerMove);
          root.removeEventListener("pointerleave", onPointerLeave);
          root.removeEventListener("click", onClick);
          if (rafId) cancelAnimationFrame(rafId);
        });
      } catch {
        /* сеть / abort */
      }
    })();

    return () => {
      alive = false;
      ac.abort();
      detachFns.forEach((fn) => fn());
      host.replaceChildren();
    };
  }

  useEffect(() => {
    const host = frontHostRef.current;
    return setupInteractiveFigure(host, frontSvgUrl, "Анатомическая схема спереди", FRONT_MUSCLE_ZONES);
  }, [onMuscleSelect]);

  useEffect(() => {
    const host = backHostRef.current;
    return setupInteractiveFigure(host, backSvgUrl, "Анатомическая схема сзади", BACK_MUSCLE_ZONES);
  }, [onMuscleSelect]);

  return html`
    <section className="muscle-board">
      <h3 style=${{ marginTop: 0 }}>Интерактивная анатомическая схема</h3>
      <p className="muted">Наведите и кликните на группу мышц, чтобы перейти в каталог.</p>
      <div className="muscle-views">
        <div>
          <p className="muted">Вид спереди</p>
          <div className="silhouette">
            <div className="anatomy-figure" ref=${frontHostRef} />
          </div>
        </div>
        <div>
          <p className="muted">Вид сзади</p>
          <div className="silhouette">
            <div className="anatomy-figure" ref=${backHostRef} />
          </div>
        </div>
      </div>
    </section>
  `;
}
