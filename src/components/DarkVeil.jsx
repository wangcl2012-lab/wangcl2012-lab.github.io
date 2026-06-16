import { useEffect, useRef } from "react";

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uHueShift;

  vec3 palette(float t) {
    vec3 a = vec3(0.055, 0.065, 0.058);
    vec3 b = vec3(0.12, 0.16, 0.10);
    vec3 c = vec3(0.34, 0.44, 0.20);
    vec3 d = vec3(0.48, 0.34, 0.14);
    return a + b * cos(6.28318 * (c * t + d + uHueShift));
  }

  float veil(vec2 p, float time) {
    float v = 0.0;
    v += sin(p.x * 2.2 + time * 0.34 + sin(p.y * 1.45 - time * 0.16));
    v += sin((p.x + p.y) * 1.6 - time * 0.22) * 0.72;
    v += cos(p.y * 2.8 + time * 0.18 + cos(p.x * 1.2)) * 0.48;
    return v / 2.2;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    float time = uTime;

    float field = veil(p, time);
    float foldA = smoothstep(0.12, 0.92, abs(sin(field * 1.34 + p.x * 0.42)));
    float foldB = smoothstep(0.28, 0.96, abs(cos(field * 0.88 - p.y * 0.5)));
    float edge = pow(max(foldA * foldB, 0.0), 2.15);

    vec3 color = palette(field * 0.28 + uv.x * 0.18 - uv.y * 0.12);
    color += vec3(0.42, 0.48, 0.18) * edge * 0.24;
    color *= 0.55 + 0.45 * smoothstep(-0.9, 0.8, field);

    float vignette = smoothstep(1.28, 0.18, length(p * vec2(0.72, 0.9)));
    color *= 0.36 + vignette * 0.72;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function DarkVeil({
  hueShift = -120,
  speed = 0.6,
  resolutionScale = 1,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return undefined;

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return undefined;

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "position");
    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    const hue = gl.getUniformLocation(program, "uHueShift");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId;
    let isVisible = true;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const scale = Math.min(resolutionScale, window.innerWidth < 700 ? 0.72 : 1);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio * scale));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = (now = 0) => {
      if (!isVisible) return;
      resize();
      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, (now / 1000) * speed);
      gl.uniform1f(hue, hueShift / 360);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = isVisible;
      isVisible = entry.isIntersecting;
      if (isVisible && !wasVisible && !reducedMotion) {
        frameId = requestAnimationFrame(render);
      } else if (!isVisible) {
        cancelAnimationFrame(frameId);
      }
    });

    observer.observe(canvas);
    render();
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [hueShift, resolutionScale, speed]);

  return <canvas ref={canvasRef} className={`dark-veil ${className}`} aria-hidden="true" />;
}
