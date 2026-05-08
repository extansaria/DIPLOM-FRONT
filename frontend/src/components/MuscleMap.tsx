import { useEffect, useRef } from "react";

const frontSvgUrl = "./frontend/src/assets/1.svg";
const backSvgUrl = "./frontend/src/assets/2.svg";

const SVG_NS = "http://www.w3.org/2000/svg";

const hoverFill = "rgba(255, 122, 26, 0.74)";
const clickableFill = "rgba(120, 128, 140, 0.34)";

type MuscleZone = { id: string; group: string; title: string };

type SvgQueryRoot = {
  getElementById(id: string): Element | null;
  querySelector(selectors: string): Element | null;
};

function ensureBreastHitOverlay(breastG: Element | null) {
  if (!breastG || breastG.querySelector("path[data-breast-hit]")) return;
  const mask = breastG.querySelector(":scope > mask");
  if (!mask) return;
  const ds = [...mask.querySelectorAll("path")]
    .map((p) => p.getAttribute("d"))
    .filter(Boolean) as string[];
  if (!ds.length) return;

  const doc = breastG.ownerDocument;
  if (!doc) return;
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

function ensureZoneMaskHitOverlay(zoneEl: Element | null, markerAttr: string) {
  if (!zoneEl || zoneEl.querySelector(`path[${markerAttr}]`)) return;
  const mask = zoneEl.querySelector(":scope > mask");
  if (!mask) return;
  const ds = [...mask.querySelectorAll("path")]
    .map((p) => p.getAttribute("d"))
    .filter(Boolean) as string[];
  if (!ds.length) return;

  const doc = zoneEl.ownerDocument;
  if (!doc) return;
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

const FRONT_MUSCLE_ZONES: MuscleZone[] = [
  { id: "breast", group: "pectoralis-major", title: "Грудь" },
  { id: "trapezoid", group: "trapezius", title: "Трапеция" },
  { id: "shoulders", group: "shoulders", title: "Передняя дельта" },
  { id: "biceps", group: "biceps", title: "Бицепс" },
  { id: "forearms", group: "forearms", title: "Предплечья" },
  { id: "press", group: "core", title: "Пресс" },
  { id: "oblique", group: "obliques", title: "Косые мышцы преса" },
  { id: "quadriceps", group: "quadriceps", title: "Ноги (квадрицепс)" }
];

const BACK_MUSCLE_ZONES: MuscleZone[] = [
  { id: "middledelta", group: "middle-delt", title: "Средняя дельта" },
  { id: "posteriordelta", group: "rear-delt", title: "Задняя дельта" },
  { id: "trapezoid", group: "trapezius", title: "Трапеция" },
  { id: "thewidest", group: "lats", title: "Широчайшая" },
  { id: "buttocks", group: "glutes", title: "Ягодицы" },
  { id: "bicepsthigh", group: "hamstrings", title: "Бицепс бедра" },
  { id: "caviar", group: "calves", title: "Икры" },
  { id: "lowerback", group: "lower-back", title: "Поясница" },
  { id: "triceps", group: "triceps", title: "Трицепс" }
];

function findZoneElement(svgRoot: SvgQueryRoot, zoneId: string): Element | null {
  const byId = svgRoot.getElementById(zoneId);
  if (byId) return byId;
  if (zoneId.includes(" ")) {
    return svgRoot.querySelector(`[id="${zoneId.replace(/"/g, "")}"]`);
  }
  return null;
}

function pathsForInteraction(zoneEl: Element): Element[] {
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
  if (zoneEl.id === "bicepsthigh") {
    const hit = zoneEl.querySelector("path[data-bicepsthigh-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "caviar") {
    const hit = zoneEl.querySelector("path[data-caviar-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "lowerback") {
    const hit = zoneEl.querySelector("path[data-lowerback-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "triceps") {
    const hit = zoneEl.querySelector("path[data-triceps-hit]");
    if (hit) return [hit];
  }
  if (zoneEl.id === "posteriordelta") {
    const hit = zoneEl.querySelector("path[data-posteriordelta-hit]");
    if (hit) return [hit];
  }
  return [...zoneEl.querySelectorAll("path")].filter((p) => !p.closest("mask"));
}

function prepareHitArea(paths: Element[]) {
  paths.forEach((p) => {
    p.setAttribute("fill", clickableFill);
    p.setAttribute("pointer-events", "all");
  });
}

function paintPaths(paths: Element[], fill: string) {
  paths.forEach((p) => p.setAttribute("fill", fill));
}

function applyVectorGlow(svgRoot: Element | null) {
  if (!svgRoot) return;
  const vectorNodes = svgRoot.querySelectorAll('[id="Vector"]');
  vectorNodes.forEach((node) => {
    node.setAttribute("fill", "rgba(123, 132, 145, 0.22)");
    node.setAttribute("stroke", "#7b8491");
    node.setAttribute("stroke-width", "1.2");
    node.setAttribute("stroke-linejoin", "round");
    node.setAttribute("stroke-linecap", "round");
    (node as HTMLElement).style.filter = "drop-shadow(0 0 2px rgba(255, 122, 26, 0.2))";
  });
}

type MuscleMapProps = {
  onMuscleSelect: (groupId: string) => void;
};

export function MuscleMap({ onMuscleSelect }: MuscleMapProps) {
  const frontHostRef = useRef<HTMLDivElement>(null);
  const backHostRef = useRef<HTMLDivElement>(null);

  function setupInteractiveFigure(
    host: HTMLDivElement | null,
    svgUrl: string,
    ariaLabel: string,
    zones: readonly MuscleZone[]
  ) {
    if (!host) return undefined;

    const ac = new AbortController();
    let alive = true;
    let rafId = 0;
    const detachFns: Array<() => void> = [];
    const tooltipEl = document.createElement("div");
    tooltipEl.className = "muscle-tooltip";
    tooltipEl.hidden = true;

    void (async () => {
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
        (svgEl as HTMLElement).style.width = "100%";
        (svgEl as HTMLElement).style.height = "auto";
        (svgEl as HTMLElement).style.maxHeight = "500px";
        (svgEl as HTMLElement).style.display = "block";
        applyVectorGlow(svgEl);

        const svgQuery = parsed as unknown as SvgQueryRoot;

        const seenIds = new Set<string>();
        for (const zone of zones) {
          if (seenIds.has(zone.id)) continue;
          const el = findZoneElement(svgQuery, zone.id);
          if (!el) continue;
          if (zone.id === "breast") ensureBreastHitOverlay(el);
          if (zone.id === "quadriceps") ensureZoneMaskHitOverlay(el, "data-quadriceps-hit");
          if (zone.id === "shoulders") ensureZoneMaskHitOverlay(el, "data-shoulders-hit");
          if (zone.id === "biceps") ensureZoneMaskHitOverlay(el, "data-biceps-hit");
          if (zone.id === "forearms") ensureZoneMaskHitOverlay(el, "data-forearms-hit");
          if (zone.id === "trapezoid") ensureZoneMaskHitOverlay(el, "data-trapezoid-hit");
          if (zone.id === "thewidest") ensureZoneMaskHitOverlay(el, "data-thewidest-hit");
          if (zone.id === "buttocks") ensureZoneMaskHitOverlay(el, "data-buttocks-hit");
          if (zone.id === "bicepsthigh") ensureZoneMaskHitOverlay(el, "data-bicepsthigh-hit");
          if (zone.id === "caviar") ensureZoneMaskHitOverlay(el, "data-caviar-hit");
          if (zone.id === "lowerback") ensureZoneMaskHitOverlay(el, "data-lowerback-hit");
          if (zone.id === "triceps") ensureZoneMaskHitOverlay(el, "data-triceps-hit");
          if (zone.id === "posteriordelta") ensureZoneMaskHitOverlay(el, "data-posteriordelta-hit");
          const paths = pathsForInteraction(el);
          if (!paths.length) continue;
          prepareHitArea(paths);
          seenIds.add(zone.id);
        }

        const root = document.importNode(svgEl, true);
        applyVectorGlow(root);
        if (!alive || ac.signal.aborted) return;
        host.replaceChildren(root);
        host.appendChild(tooltipEl);

        const rootQuery = root as unknown as SvgQueryRoot;

        type ZoneState = { zone: MuscleZone; pathsLive: Element[]; baseFills: (string | null)[] };
        const states: ZoneState[] = [];
        seenIds.clear();
        for (const zone of zones) {
          if (seenIds.has(zone.id)) continue;
          const zoneEl = findZoneElement(rootQuery, zone.id);
          if (!zoneEl) continue;
          const pathsLive = pathsForInteraction(zoneEl);
          if (!pathsLive.length) continue;
          seenIds.add(zone.id);
          zoneEl.setAttribute("data-muscle-zone-id", zone.id);
          zoneEl.setAttribute("aria-label", zone.title);
          (zoneEl as HTMLElement).style.cursor = "pointer";
          const baseFills = pathsLive.map((p) => p.getAttribute("fill"));
          states.push({ zone, pathsLive, baseFills });
        }

        function clearAllHover() {
          for (const s of states) {
            s.pathsLive.forEach((p, i) => p.setAttribute("fill", s.baseFills[i] || clickableFill));
          }
        }

        function applyHover(zoneId: string | null) {
          clearAllHover();
          if (!zoneId) return;
          const s = states.find((st) => st.zone.id === zoneId);
          if (!s) return;
          paintPaths(s.pathsLive, hoverFill);
          if (zoneId === "posteriordelta") {
            const middleDelta = states.find((st) => st.zone.id === "middledelta");
            if (middleDelta) paintPaths(middleDelta.pathsLive, clickableFill);
          }
        }

        let activeZoneId: string | null = null;

        function pickZoneIdUnderPointer(clientX: number, clientY: number) {
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

        function onPointerMove(e: PointerEvent) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            const next = pickZoneIdUnderPointer(e.clientX, e.clientY);
            const changed = next !== activeZoneId;
            activeZoneId = next;
            if (changed) applyHover(next);
            const s = states.find((st) => st.zone.id === next);
            if (!s) {
              tooltipEl.hidden = true;
              return;
            }
            tooltipEl.textContent = s.zone.title;
            const rect = host.getBoundingClientRect();
            const left = e.clientX - rect.left + 10;
            const top = e.clientY - rect.top + 10;
            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
            tooltipEl.hidden = false;
          });
        }

        function onPointerLeave() {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = 0;
          activeZoneId = null;
          clearAllHover();
          tooltipEl.hidden = true;
        }

        function onClick(e: MouseEvent) {
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
          tooltipEl.remove();
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

  return (
    <section className="muscle-board">
      <h2 className="home-build-title">Интерактивная анатомическая схема</h2>
      <div className="muscle-views">
        <div>
          <p className="muted">Вид спереди</p>
          <div className="silhouette">
            <div className="anatomy-figure" ref={frontHostRef} />
          </div>
        </div>
        <div>
          <p className="muted">Вид сзади</p>
          <div className="silhouette">
            <div className="anatomy-figure" ref={backHostRef} />
          </div>
        </div>
      </div>
      <p className="muted map-guide-line">Выберите мышечную группу, что бы увидеть список лучших упражнений для ее развития</p>
    </section>
  );
}
