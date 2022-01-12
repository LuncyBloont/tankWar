#version 300 es
precision mediump float;
out vec4 color;
in vec2 fuv;
in vec3 fnormal;
in vec3 fpos;
in vec4 vpos;
in vec3 ftangent;
in vec3 fbitangent;

uniform float time;
uniform sampler2D albedo;
uniform sampler2D ao;
uniform sampler2D tasm;
uniform samplerCube skyMap;
uniform sampler2D normalMap;

uniform vec3 sunDir;
uniform vec3 sunColor;
uniform vec3 envColor;
uniform float envForce;
uniform float sunForce;
uniform mat4 viewMatrix;

float noise(vec2 uv) {
    return fract(sin(dot(vec2(24.342429, 105.24344), uv)) * 284322.942925432 + time / 1056.);
}

void main() {
    vec3 normal = normalize(fnormal);
    vec3 tangent = normalize(ftangent);
    vec3 bitangent = normalize(fbitangent);
    
    vec2 uv = fuv * vec2(1., -1.);

    vec4 tnorm = texture(normalMap, uv);
    tnorm = 2. * (tnorm - 0.5);
    normal = normalize(tnorm.z * normal + tnorm.x * tangent + tnorm.y * bitangent);

    vec3 col = vec3(0);
    vec3 alb = texture(albedo, uv).rgb * 0.6 + vec3(0.1);
    vec3 colm = alb;
    vec4 aocol = texture(ao, uv);
    vec3 a_s_m = texture(tasm, uv).rgb;
    vec3 viewDir = -normalize(fpos);
    float alphaBase = pow(a_s_m.r, 2.);
    float alphaFnl = pow(a_s_m.r, 1.);
    float specular = pow(a_s_m.g, 6.);
    float metallic = a_s_m.b;
    vec3 ref = -reflect(viewDir, normal);
    vec3 worldRef = (vec4(ref, 0.) * viewMatrix).xyz;
    worldRef = vec3(-worldRef.x, worldRef.y, -worldRef.z);
    vec3 wolrdNormal = (vec4(normal, 0.) * viewMatrix).xyz;
    wolrdNormal = vec3(-wolrdNormal.x, wolrdNormal.y, -wolrdNormal.z);
    vec3 skycol = textureLod(skyMap, worldRef, (1. - a_s_m.g) * 14. + 1.).rgb;
    vec3 skydiff = textureLod(skyMap, wolrdNormal, 15.).rgb;
    skycol = skycol;
    skydiff = skydiff;
    vec3 ks = alb * 0.1 + vec3(0.9);

    col += alb * skydiff * envForce * 0.99 + skycol * envForce * 0.01;
    col += alb * sunColor * sunForce * max(0., dot(-sunDir, normal)) * 1.4 * aocol.g;
    col += ks * sunColor * sunForce * pow(max(0., dot(ref, -sunDir)), 1. + 256. * specular) * (specular * 256. + 1.) / 257. * aocol.g; // / pow(0.01, pow(specular, 3.)) * 0.01;// (0.8 * specular) * 0.5;
    col += skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;

    colm *= skycol * envForce + 
        sunColor * sunForce * pow(max(0., dot(ref, -sunDir)), 1. + 256. * specular) * (specular * 128. + 129.) / 257. * 3. * aocol.g + 
        skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;

    if (alphaBase + alphaFnl * (1. - pow(max(0., dot(viewDir, normal)), 1.)) <= noise(vpos.xy / vpos.w)) discard;
    color = vec4(mix(col, colm, metallic), 1.);
    color = vec4(color.rgb * aocol.r, 1.0);
}