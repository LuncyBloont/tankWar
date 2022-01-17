#version 300 es

#define shadowScale 0.001
#define shadowStep 0.0005
#define shadowBias 0.006

precision mediump float;
out vec4 color;
in vec2 fuv;
in vec3 fnormal;
in vec3 fpos;
in vec4 vpos;
in vec3 ftangent;
in vec3 fbitangent;
in vec3 wnormal;
in vec3 wtangent;
in vec3 wbitangent;
in vec4 shadowPos;

uniform float time;
uniform sampler2D albedo;
uniform sampler2D tao;
uniform sampler2D tasm;
uniform samplerCube skyMap;
uniform sampler2D normalMap;
uniform sampler2D shadowMap;
uniform sampler2D emission;

uniform vec3 sunDir;
uniform vec3 sunColor;
uniform vec3 envColor;
uniform float envForce;
uniform float sunForce;
uniform mat4 viewMatrix;

float noise(vec2 uv) 
{
    return fract(sin(dot(vec2(24.342429, 105.24344), uv)) * 284322.942925432 + time / 1056.);
}

float calSunForce(float asF)
{
    float sf = 0.;
    float base = 0.;
    for (float x = -shadowScale; x <= shadowScale; x += shadowStep)
    {
        for (float y = -shadowScale; y <= shadowScale; y += shadowStep)
        {
            float shadow = texture(shadowMap, shadowPos.xy * 0.5 + 0.5 + vec2(x, y)).r;
            if (shadowPos.x < -1. || shadowPos.x > 1. || shadowPos.y < -1. || shadowPos.y > 1.)
            {
                shadow = 1.;
            }
            if (shadow > shadowPos.z - shadowBias || shadowPos.z >= 1.0)
            {
                sf += sunForce;
            }
            base += 1.;
        }
    }
    return min(sf / base, asF);
}

void main() 
{
    vec3 normal = normalize(fnormal);
    vec3 tangent = normalize(ftangent);
    vec3 bitangent = normalize(fbitangent);

    vec3 wwnormal = normalize(wnormal);
    vec3 wwtangent = normalize(wtangent);
    vec3 wwbitangent = normalize(wbitangent);
    
    vec2 uv = fuv * vec2(1., -1.);

    vec4 tnorm = texture(normalMap, uv);
    tnorm = 2. * (tnorm - 0.5);
    normal = normalize(tnorm.z * normal + tnorm.x * tangent + tnorm.y * bitangent);
    wwnormal = normalize(tnorm.z * wwnormal + tnorm.x * wwtangent + tnorm.y * wwbitangent);

    vec3 col = vec3(0);
    vec3 alb = texture(albedo, uv).rgb * 0.6 + vec3(0.1);
    vec3 colm = alb;
    vec4 aocol = texture(tao, uv);
    float sf = calSunForce(aocol.g);
    vec3 a_s_m = texture(tasm, uv).rgb;
    vec3 viewDir = -normalize(fpos);
    float alphaBase = pow(a_s_m.r, 2.);
    float alphaFnl = pow(a_s_m.r, 1.);
    float specular = pow(a_s_m.g, 6.);
    float metallic = a_s_m.b;
    vec3 ref = -reflect(viewDir, normal);
    vec3 worldRef = -reflect((vec4(viewDir, 0.) * viewMatrix).xyz, wwnormal);
    worldRef = vec3(worldRef.x, worldRef.y, -worldRef.z);
    vec3 wolrdNormal = wwnormal;
    wolrdNormal = vec3(-wolrdNormal.x, wolrdNormal.y, -wolrdNormal.z);
    vec3 skycol = textureLod(skyMap, worldRef, (1. - a_s_m.g) * 14. + 1.).rgb;
    vec3 skydiff = textureLod(skyMap, wolrdNormal, 15.).rgb;
    skycol = skycol * envColor;
    skydiff = skydiff * envColor;
    vec3 ks = alb * 0.1 + vec3(0.9);

    col += alb * skydiff * envForce * 0.99 + skycol * envForce * 0.01;
    col += alb * sunColor * sf * max(0., dot(-sunDir, normal)) * 1.4 ;
    col += ks * sunColor * sf * pow(max(0., dot(ref, -sunDir)), 1. + 256. * specular) * (specular * 256. + 1.) / 257.; // / pow(0.01, pow(specular, 3.)) * 0.01;// (0.8 * specular) * 0.5;
    col += skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;

    colm *= skycol * envForce + 
        sunColor * sf * pow(max(0., dot(ref, -sunDir)), 1. + 256. * specular) * (specular * 128. + 129.) / 257. * 3. + 
        skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;

    if (alphaBase + alphaFnl * (1. - pow(max(0., dot(viewDir, normal)), 1.)) <= noise(vpos.xy / vpos.w)) discard;
    color = vec4(mix(col, colm, metallic), 1.);
    vec4 ems = texture(emission, uv);
    color = vec4(color.rgb * aocol.r + alb * aocol.b * 5. + ems.rgb * ems.a * 5., 1.0);
}