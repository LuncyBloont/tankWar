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
uniform mat4 viewMatrix;

void main() {
    // fpos = (rotate * vec4(pos - vec3(0., 2.7, 0.), 1.)).xyz + vec3(mpos * vec2(1. / 200., -1. / 200.), -5.);
    fpos = (viewMatrix * rotate * vec4(pos, 1.)).xyz;
    gl_Position = perspective * vec4(fpos, 1.);
    fuv = uv;
    fnormal = (viewMatrix * rotate * vec4(normal, 0.)).xyz;
    vpos = gl_Position;
    gl_PointSize = 1.;
}