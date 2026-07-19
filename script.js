// Get the canvas element by its ID
const canvas = document.getElementById('fluid-canvas');
// Get the WebGL rendering context
const gl = canvas.getContext('webgl');

// Check if WebGL is supported by the browser
if (!gl) {
    console.error("WebGL not supported by your browser.");
}

// 1. Vertex Shader: Simple pass-through shader for 2D screen coordinates
const vsSource = `
    attribute vec2 position;
    void main() {
        // Set the vertex position (x, y, z, w)
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

// 2. Fragment Shader: The "brain" of the visual effect
const fsSource = `
    precision highp float;
    uniform vec2 u_resolution; // Canvas size (width, height)
    uniform vec2 u_mouse;      // Mouse position (x, y)
    uniform float u_time;      // Elapsed time in seconds

    // Helper: Generates a pseudo-random 2D vector based on position
    vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    // Helper: Generates smooth gradient noise
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f); // Cubic smoothing
        return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)), 
                       dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                   mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)), 
                       dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
        // Normalize coordinates to 0.0 - 1.0 range
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 mouse = u_mouse / u_resolution.xy;

        // Scale coordinates for the noise distortion
        vec2 uvWarp = uv * 6.0;
        // Generate time-based noise for movement
        float n = noise(uvWarp + vec2(u_time * 0.2, u_time * 0.1));
        
        // Calculate distance between current pixel and mouse
        float distToMouse = distance(uv, mouse);
        // Create a circular area of influence around the mouse
        float mouseInfluence = smoothstep(0.3, 0.0, distToMouse);
        
        // Distort UV coordinates using noise and mouse position
        vec2 distortedUV = uv + vec2(n) * 0.1 + (mouse - uv) * mouseInfluence * 0.05;

        // Calculate the fluid pattern (higher multiplier = more detail/lines)
        float pattern = noise(distortedUV * 8.0 - vec2(0.0, u_time * 0.3));
        // absolute value + smoothstep creates the "double line" fluid look
        // kept the first param at 0.0 to keep the core lines thin
        pattern = smoothstep(0.0, 0.4, abs(pattern));

        // Background and fluid colors
        vec3 baseBg = vec3(0.01, 0.003, 0.04); // Deep dark purple/black
        vec3 fluidColor = vec3(0.4, 0.1, 0.9); // Neon purple lines
        
        // Calculate where the "glow" edges are based on the pattern
        // sharpened the range (0.01, 0.08 -> 0.005, 0.04) to make lines much thinner
        float edgeGlow = 1.0 - smoothstep(0.005, 0.04, pattern);
        
        // Combine background and fluid. 
        // Use multiplication for darkening to ensure the area around the mouse scales toward black.
        vec3 finalColor = mix(baseBg, fluidColor, edgeGlow);
        // mouseInfluence goes from 0.0 (far) to 1.0 (at mouse).
        // (1.0 - mouseInfluence * 0.6) will go from 1.0 (far) to 0.6 (at mouse), darkening it by 40%.
        finalColor *= (1.0 - mouseInfluence * 0.8); 
        
        // Final pixel color output
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Helper: Compiles a shader from source code
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    // Check if compilation was successful
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Compile vertex and fragment shaders
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

// Link shaders into a WebGL program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Define geometry: a rectangle (two triangles) covering the entire screen
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,  -1,  1, // Triangle 1
    -1,  1,   1, -1,   1,  1, // Triangle 2
]), gl.STATIC_DRAW);

// Tell WebGL how to pull coordinates from the buffer into the "position" attribute
const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Get memory locations for the uniform variables in the shader
const resLocation = gl.getUniformLocation(program, "u_resolution");
const mouseLocation = gl.getUniformLocation(program, "u_mouse");
const timeLocation = gl.getUniformLocation(program, "u_time");

// Store current mouse coordinates
let mouseX = 0, mouseY = 0;
// Update mouse coordinates on movement
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = canvas.height - e.clientY; // Flip Y for WebGL's bottom-up coordinate system
});

// Function to adjust canvas size to match the window dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Tell WebGL the new dimensions
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// Handle window resizing
window.addEventListener('resize', () => {
    resizeCanvas();
    render(performance.now()); // Force a redraw immediately on resize
});

// Initial canvas setup
resizeCanvas();

// The main animation loop
function render(time) {
    // Pass current data (size, mouse, time) to the shader
    gl.uniform2f(resLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform1f(timeLocation, time * 0.001); // Convert milliseconds to seconds

    // Draw the geometry (6 vertices = 2 triangles)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Request the next frame
    requestAnimationFrame(render);
}

// Start the animation
requestAnimationFrame(render);