import { useEffect, useRef } from 'react';

const FluidCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vsSource = `
      attribute vec2 position;
      void main() {
          gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      vec2 hash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)), 
                         dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                     mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)), 
                         dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 mouse = u_mouse / u_resolution.xy;
          vec2 uvWarp = uv * 6.0;
          float n = noise(uvWarp + vec2(u_time * 0.2, u_time * 0.1));
          float distToMouse = distance(uv, mouse);
          float mouseInfluence = smoothstep(0.3, 0.0, distToMouse);
          vec2 distortedUV = uv + vec2(n) * 0.1 + (mouse - uv) * mouseInfluence * 0.05;
          float pattern = noise(distortedUV * 8.0 - vec2(0.0, u_time * 0.3));
          pattern = smoothstep(0.0, 0.4, abs(pattern));
          vec3 baseBg = vec3(0.01, 0.003, 0.04);
          vec3 fluidColor = vec3(0.4, 0.1, 0.9);
          float edgeGlow = 1.0 - smoothstep(0.005, 0.04, pattern);
          vec3 finalColor = mix(baseBg, fluidColor, edgeGlow);
          finalColor *= (1.0 - mouseInfluence * 0.8); 
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = canvas.height - e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let animationFrameId;
    const render = (time) => {
      gl.uniform2f(resLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      gl.uniform1f(timeLocation, time * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="fluid-canvas" ref={canvasRef} />;
};

export default FluidCanvas;
