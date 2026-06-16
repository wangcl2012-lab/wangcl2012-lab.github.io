import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const MAX_COLORS = 8;

const hexToRGB = (hex) => {
  const color = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(color.slice(0, 2), 16) / 255,
    parseInt(color.slice(2, 4), 16) / 255,
    parseInt(color.slice(4, 6), 16) / 255,
  ];
};

const prepColors = (input) => {
  const base = (input?.length ? input : ["#A6C8FF", "#5227FF", "#FF9FFC"]).slice(0, MAX_COLORS);
  const colors = Array.from({ length: MAX_COLORS }, (_, index) =>
    hexToRGB(base[Math.min(index, base.length - 1)]),
  );
  const average = [0, 1, 2].map(
    (channel) => colors.slice(0, base.length).reduce((sum, color) => sum + color[channel], 0) / base.length,
  );
  return { colors, count: base.length, average };
};

const vertex = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;
  uniform vec3 iResolution;
  uniform vec2 iMouse;
  uniform float iTime;
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform vec3 uColor5;
  uniform vec3 uColor6;
  uniform vec3 uColor7;
  uniform int uColorCount;
  uniform vec3 uBgColor;
  uniform vec3 uMouseColor;
  uniform float uSpeed;
  uniform int uStreakCount;
  uniform float uStreakWidth;
  uniform float uStreakLength;
  uniform float uGlow;
  uniform float uDensity;
  uniform float uTwinkle;
  uniform float uZoom;
  uniform float uBgGlow;
  uniform float uOpacity;
  uniform float uMouseEnabled;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  varying vec2 vUv;

  vec3 palette(float h) {
    int count = uColorCount;
    if (count < 1) count = 1;
    int index = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
    if (index <= 0) return uColor0;
    if (index == 1) return uColor1;
    if (index == 2) return uColor2;
    if (index == 3) return uColor3;
    if (index == 4) return uColor4;
    if (index == 5) return uColor5;
    if (index == 6) return uColor6;
    return uColor7;
  }

  vec3 tanhv(vec3 x) {
    vec3 e = exp(-2.0 * x);
    return (1.0 - e) / (1.0 + e);
  }

  vec2 sceneC(vec2 frag, vec2 resolution) {
    vec2 point = (frag + frag - resolution) / resolution.x;
    float z = 0.0;
    float distance = 1e3;
    vec4 orbit = vec4(0.0);
    for (int k = 0; k < 39; k++) {
      if (distance <= 1e-4) break;
      orbit = z * normalize(vec4(point, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
      distance = 1.0 - sqrt(length(orbit * orbit));
      z += distance;
    }
    return vec2(orbit.x, atan(orbit.z, orbit.y));
  }

  void mainImage(out vec4 outputColor, vec2 coordInput) {
    vec2 resolution = iResolution.xy;
    vec2 uv = (coordInput + coordInput - resolution) / resolution.x;
    float time = 0.1 * iTime * uSpeed + 9.0;
    float rings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
    vec2 cell = vec2(5e-3, 6.28318530718 / rings);
    vec2 center = sceneC(coordInput, resolution);
    vec2 dx = sceneC(coordInput + vec2(1.0, 0.0), resolution) - center;
    vec2 dy = sceneC(coordInput + vec2(0.0, 1.0), resolution) - center;
    dx.y -= 6.28318530718 * floor(dx.y / 6.28318530718 + 0.5);
    dy.y -= 6.28318530718 * floor(dy.y / 6.28318530718 + 0.5);
    vec2 feather = abs(dx) + abs(dy);
    vec2 point = vec2(2.0, 1.0) * uv - (resolution / resolution.x) * vec2(0.0, 1.0);
    vec4 light = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(point, point) + 6.0), 0.0);

    float mouseGlow = 0.0;
    if (uMouseEnabled > 0.5) {
      vec2 mouse = (iMouse + iMouse - resolution) / resolution.x;
      float mouseDistance = length(uv - mouse);
      mouseGlow = exp(-mouseDistance * mouseDistance / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
      light.rgb += uMouseColor * mouseGlow * 0.25;
    }

    float width = 5e-4 * uStreakWidth;
    vec2 range = vec2(max(length(feather), 1e-5));
    float tail = 19.0 / max(uStreakLength, 0.05);

    for (int layer = 0; layer < 16; layer++) {
      if (layer >= uStreakCount) break;
      float seed = float(layer) + 1.0;
      float random = fract(sin(dot(vec2(seed, floor(center.x / cell.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
      vec2 streak = center - (time + time * random) * vec2(0.0, 1.0);
      streak -= floor(streak / cell + 0.5) * cell;
      float hue = fract(8663.0 * random);
      float weight = mix(1.5, 1.0 + sin(time + 7.0 * hue + 4.0), uTwinkle);
      weight *= 1.0 + mouseGlow * 2.0;
      vec2 inner = vec2(length(max(streak, vec2(-1.0, 0.0))), length(streak) - width) - width;
      vec2 smoothMask = vec2(1.0) - smoothstep(-range, range, inner);
      light.rgb += dot(smoothMask, vec2(exp(tail * streak.y), 3.0)) * palette(hue) * weight;
      center.x += cell.x / 8.0;
    }

    vec3 color = sqrt(tanhv(max(light.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
    outputColor = vec4(color, uOpacity);
  }

  void main() {
    vec4 color;
    mainImage(color, vUv * iResolution.xy);
    gl_FragColor = color;
  }
`;

export default function Lightfall({
  className = "",
  colors = ["#D8BA63", "#86B48C", "#B7C7D9"],
  backgroundColor = "#11180F",
  speed = 0.55,
  streakCount = 4,
  streakWidth = 0.75,
  streakLength = 1.3,
  glow = 0.8,
  density = 0.5,
  twinkle = 0.45,
  zoom = 2.5,
  backgroundGlow = 0.35,
  opacity = 0.75,
  mouseInteraction = true,
  mouseStrength = 0.35,
  mouseRadius = 0.8,
  mouseDampening = 0.15,
  mixBlendMode,
  paused = false,
  dpr,
  maxFps = 30,
}) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const mouseTargetRef = useRef([0, 0]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({
      dpr: Math.min(dpr ?? (window.devicePixelRatio || 1), window.innerWidth < 768 ? 1 : 1.25),
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const prepared = prepColors(colors);
    const uniforms = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [0, 0] },
      iTime: { value: 0 },
      ...Object.fromEntries(prepared.colors.map((color, index) => [`uColor${index}`, { value: color }])),
      uColorCount: { value: prepared.count },
      uBgColor: { value: hexToRGB(backgroundColor) },
      uMouseColor: { value: prepared.average },
      uSpeed: { value: speed },
      uStreakCount: { value: Math.max(1, Math.min(16, Math.round(streakCount))) },
      uStreakWidth: { value: streakWidth },
      uStreakLength: { value: streakLength },
      uGlow: { value: glow },
      uDensity: { value: density },
      uTwinkle: { value: twinkle },
      uZoom: { value: zoom },
      uBgGlow: { value: backgroundGlow },
      uOpacity: { value: opacity },
      uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
      uMouseStrength: { value: mouseStrength },
      uMouseRadius: { value: mouseRadius },
    };
    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex, fragment, uniforms }),
    });

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      const scale = renderer.dpr || 1;
      mouseTargetRef.current = [
        (event.clientX - bounds.left) * scale,
        (bounds.height - (event.clientY - bounds.top)) * scale,
      ];
    };
    if (mouseInteraction) canvas.addEventListener("pointermove", onPointerMove);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frameInterval = 1000 / Math.max(1, maxFps);
    let lastPointerTime = 0;
    let lastRenderTime = 0;
    let isIntersecting = false;
    let isPageVisible = !document.hidden;
    let reduceMotion = motionQuery.matches;
    let disposed = false;
    let hasRenderedStill = false;

    const stopLoop = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const render = (time) => {
      frameRef.current = null;
      if (disposed || !isIntersecting || !isPageVisible) return;

      const shouldAnimate = !paused && !reduceMotion;
      if (shouldAnimate) {
        frameRef.current = requestAnimationFrame(render);
        if (time - lastRenderTime < frameInterval) return;
      } else if (hasRenderedStill) {
        return;
      }

      uniforms.iTime.value = time * 0.001;
      const delta = lastPointerTime ? (time - lastPointerTime) / 1000 : 0;
      lastPointerTime = time;
      const factor = mouseDampening > 0 ? Math.min(1, 1 - Math.exp(-delta / mouseDampening)) : 1;
      uniforms.iMouse.value[0] += (mouseTargetRef.current[0] - uniforms.iMouse.value[0]) * factor;
      uniforms.iMouse.value[1] += (mouseTargetRef.current[1] - uniforms.iMouse.value[1]) * factor;
      renderer.render({ scene: mesh });
      lastRenderTime = time;
      hasRenderedStill = true;
    };

    const startLoop = () => {
      if (disposed || frameRef.current !== null || !isIntersecting || !isPageVisible) return;
      frameRef.current = requestAnimationFrame(render);
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          hasRenderedStill = false;
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: "120px 0px" },
    );
    intersectionObserver.observe(container);

    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) startLoop();
      else stopLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onMotionChange = (event) => {
      reduceMotion = event.matches;
      hasRenderedStill = false;
      startLoop();
    };
    motionQuery.addEventListener?.("change", onMotionChange);

    return () => {
      disposed = true;
      stopLoop();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener?.("change", onMotionChange);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.remove();
    };
  }, [
    backgroundColor,
    backgroundGlow,
    colors,
    density,
    glow,
    mouseDampening,
    mouseInteraction,
    mouseRadius,
    mouseStrength,
    opacity,
    paused,
    speed,
    streakCount,
    streakLength,
    streakWidth,
    twinkle,
    zoom,
    dpr,
    maxFps,
  ]);

  return (
    <div
      ref={containerRef}
      className={`lightfall-container ${className}`.trim()}
      style={mixBlendMode ? { mixBlendMode } : undefined}
      aria-hidden="true"
    />
  );
}
