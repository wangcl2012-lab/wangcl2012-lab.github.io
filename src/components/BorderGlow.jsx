import { useCallback, useEffect, useRef } from "react";
import "./BorderGlow.css";

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const GRADIENT_KEYS = ["--gradient-one", "--gradient-two", "--gradient-three", "--gradient-four", "--gradient-five", "--gradient-six", "--gradient-seven"];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function parseHSL(value) {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 220, s: 80, l: 80 };
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  return Object.fromEntries(
    opacities.map((opacity, index) => [
      `--glow-color${keys[index]}`,
      `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`,
    ]),
  );
}

function buildGradientVars(colors) {
  const vars = {};
  GRADIENT_KEYS.forEach((key, index) => {
    vars[key] = `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${colors[Math.min(COLOR_MAP[index], colors.length - 1)]} 0px, transparent 50%)`;
  });
  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
const easeInCubic = (value) => value * value * value;

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
  let frameId;
  let cancelled = false;
  const timeout = window.setTimeout(() => {
    const startedAt = performance.now();
    const tick = () => {
      if (cancelled) return;
      const progress = Math.min((performance.now() - startedAt) / duration, 1);
      onUpdate(start + (end - start) * ease(progress));
      if (progress < 1) frameId = requestAnimationFrame(tick);
      else onEnd?.();
    };
    frameId = requestAnimationFrame(tick);
  }, delay);
  return () => {
    cancelled = true;
    window.clearTimeout(timeout);
    cancelAnimationFrame(frameId);
  };
}

function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "220 90 78",
  backgroundColor = "#090c1d",
  borderRadius = 22,
  glowRadius = 34,
  glowIntensity = 0.9,
  coneSpread = 25,
  animated = false,
  animationDelay = 0,
  colors = ["#A6C8FF", "#7754FF", "#FF9FFC"],
  fillOpacity = 0.34,
}) {
  const cardRef = useRef(null);

  const handlePointerMove = useCallback((event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const kx = dx === 0 ? Infinity : centerX / Math.abs(dx);
    const ky = dy === 0 ? Infinity : centerY / Math.abs(dy);
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    card.style.setProperty("--edge-proximity", (edge * 100).toFixed(3));
    card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!animated || !card) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const cancelAnimations = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        card.classList.add("sweep-active");
        card.style.setProperty("--cursor-angle", "110deg");
        cancelAnimations.push(animateValue({
          delay: animationDelay,
          duration: 500,
          onUpdate: (value) => card.style.setProperty("--edge-proximity", value),
        }));
        cancelAnimations.push(animateValue({
          delay: animationDelay,
          duration: 1500,
          end: 50,
          ease: easeInCubic,
          onUpdate: (value) => card.style.setProperty("--cursor-angle", `${355 * (value / 100) + 110}deg`),
        }));
        cancelAnimations.push(animateValue({
          delay: animationDelay + 1500,
          duration: 2250,
          start: 50,
          end: 100,
          onUpdate: (value) => card.style.setProperty("--cursor-angle", `${355 * (value / 100) + 110}deg`),
        }));
        cancelAnimations.push(animateValue({
          delay: animationDelay + 2500,
          duration: 1500,
          start: 100,
          end: 0,
          ease: easeInCubic,
          onUpdate: (value) => card.style.setProperty("--edge-proximity", value),
          onEnd: () => card.classList.remove("sweep-active"),
        }));
      },
      { rootMargin: "80px 0px" },
    );
    observer.observe(card);

    return () => {
      observer.disconnect();
      cancelAnimations.forEach((cancel) => cancel());
    };
  }, [animated, animationDelay]);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        "--card-bg": backgroundColor,
        "--edge-sensitivity": edgeSensitivity,
        "--border-radius": `${borderRadius}px`,
        "--glow-padding": `${glowRadius}px`,
        "--cone-spread": coneSpread,
        "--fill-opacity": fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}

export default BorderGlow;
