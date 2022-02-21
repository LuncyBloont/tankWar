#version 300 es
precision highp float;

in vec4 info;
in vec2 fuv;
in vec4 vpos;
out vec4 color;

uniform float time;
uniform float alpha;
uniform sampler2D tasm;

float noise(vec2 uv) 
{
    return fract(sin(dot(vec2(24.342429, 105.24344), uv)) * 284322.942925432 + time / 1056.);
}

void main()
{
    vec3 a_s_m = texture(tasm, fuv).rgb;
    float alp = a_s_m.r * alpha;
    if (alp < 1. && alp <= noise(vpos.xy / vpos.w)) discard;
    color = info;
}