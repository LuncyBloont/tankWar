#version 300 es
precision mediump float;
in vec3 pos;
in vec2 uv;
in vec3 normal;
in vec3 tangent;
in vec3 bitangent;
out vec2 fuv;
out vec3 fnormal;
out vec3 fpos;
out vec4 vpos;
out vec3 ftangent;
out vec3 fbitangent;

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
    ftangent = (viewMatrix * rotate * vec4(tangent, 0.)).xyz;
    fbitangent = (viewMatrix * rotate * vec4(bitangent, 0.)).xyz;

    // ftangent = ftangent - dot(ftangent, fnormal) * fnormal;
    // fbitangent = cross(fnormal, ftangent);
    // Use orthogonal TBN matrix
    
    vpos = gl_Position;
    gl_PointSize = 1.;
}