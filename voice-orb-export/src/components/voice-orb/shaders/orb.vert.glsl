#version 300 es
// Fullscreen-triangle passthrough. The orb is assembled entirely in the
// fragment stage from vUv — there is no 3D geometry and no lighting.
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
