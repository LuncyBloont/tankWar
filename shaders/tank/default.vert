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
    fpos = (rotate * vec4(pos, 1.)).xyz + vec3(mpos * vec2(1. / 400., -1. / 400.), -5.);
    gl_Position = perspective * vec4(fpos, 1.);
    fuv = uv;
    fnormal = (rotate * vec4(normal, 0.)).xyz;
    vpos = gl_Position;
    gl_PointSize = 1.;
}