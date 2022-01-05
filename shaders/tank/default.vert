#version 300 es
precision mediump float;
in vec3 pos;
in vec2 uv;
in vec3 normal;
out vec2 fuv;
out vec3 fnormal;
out vec3 fpos;
out vec4 vpos;

uniform vec2 mpos;
uniform mat4 perspective;
uniform float time;
uniform mat4 rotate;

void main() {
    gl_Position = perspective * (rotate * vec4(pos, 1.) + vec4(log(abs(mpos.x / 80.) + 1.) * sign(mpos.x), -log(abs(mpos.y / 80.) + 1.) * sign(mpos.y), -5., 0.));
    fuv = uv;
    fnormal = (rotate * vec4(normal, 0.)).xyz;
    fpos = (pos + vec3(mpos.x / 80., -mpos.y / 80., -5.));
    vpos = gl_Position;
    gl_PointSize = 1.;
}