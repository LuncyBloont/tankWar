#version 300 es
precision mediump float;
out vec4 color;
in vec2 fuv;
in vec3 fnormal;
in vec3 fpos;
in vec4 vpos;

uniform float time;
uniform sampler2D albedo;
uniform sampler2D ao;
uniform sampler2D tasm;
uniform samplerCube skyMap;

uniform vec3 sunDir;
uniform vec3 sunColor;
uniform vec3 envColor;
uniform float envForce;
uniform float sunForce;

float noise(vec2 uv) {
    return fract(sin(dot(vec2(24.342429, 105.24344), uv)) * 284322.942925432 + time / 1056.);
}

void main() {
    vec3 normal = normalize(fnormal);
    vec2 uv = fuv * vec2(1., -1.);
    vec3 col = vec3(0);
    vec3 alb = texture(albedo, uv).rgb * 0.6 + vec3(0.1);
    vec3 colm = alb;
    vec3 a_s_m = texture(tasm, uv).rgb;
    vec3 viewDir = -normalize(fpos);
    float alphaBase = pow(a_s_m.r, 2.);
    float alphaFnl = pow(a_s_m.r, 1.);
    float specular = a_s_m.g;
    float metallic = a_s_m.b;
    vec3 ref = -reflect(viewDir, normal);
    mat3 rot = mat3(
        cos(-0.6), 0., sin(-0.6),
        0., 1., 0.,
        -sin(-0.6), 0., cos(-0.6)
    );
    ref = rot * ref;
    vec3 skycol = textureLod(skyMap, ref, (1. - specular) * 10. + 4.).rgb;
    vec3 skydiff = textureLod(skyMap, normal, 14.).rgb;
    skycol = skycol * 1.4;
    skydiff = skydiff * 1.4;
    vec3 ks = alb * 0.1 + vec3(0.9);

    col += alb * skydiff * envForce * 0.99 + skycol * envForce * 0.01;
    col += alb * sunColor * sunForce * max(0., dot(-sunDir, normal));
    col += ks * sunColor * sunForce * pow(max(0., dot(ref, -sunDir)), 1. + 256. * pow(specular, 6.)) * (0.8 * specular + 0.2);
    col += skycol * pow((1. - max(0., dot(viewDir, normal))), 4.);

    colm *= skycol * envForce + 
        sunColor * sunForce * pow(max(0., dot(ref, -sunDir)), 1. + 256. * pow(specular, 6.)) * (0.8 * specular + 0.2) + 
        skycol * pow((1. - max(0., dot(viewDir, normal))), 4.);

    if (alphaBase + alphaFnl * (1. - pow(max(0., dot(viewDir, normal)), 5.)) <= noise(vpos.xy / vpos.w)) discard;
    color = vec4(mix(col, colm, metallic), 1.);
    color = vec4(color.rgb * texture(ao, uv).r, 1.0);
}