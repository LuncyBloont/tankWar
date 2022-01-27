#version 300 es
precision highp float;

in vec3 pos;
in vec2 uv;
out vec4 info;
out vec2 fuv;
out vec4 vpos;

uniform mat4 perspectiveShadow;
uniform mat4 rotate;

void main()
{
    gl_Position = perspectiveShadow * rotate * vec4(pos, 1.);
    vpos = gl_Position;
    float r = floor(gl_Position.z * 255.) / 255.;
    float g = floor(fract(gl_Position.z * 255.) * 255.) / 255.;
    float b = floor(fract(gl_Position.z * 255. * 255.) * 255.) / 255.;
    info = vec4(r, g, b, 1.);
    fuv = uv;
}