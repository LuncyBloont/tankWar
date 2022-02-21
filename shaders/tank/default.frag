#version 300 es

#define shadowScale 0.001
#define shadowSample 2
#define shadowBias 0.006

precision highp float;
out vec4 color;
in vec2 fuv;
in vec3 fnormal;
in vec3 fpos;
in vec4 vpos;
in vec3 wpos;
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

uniform vec3 light[8];
uniform vec3 lightRGB[8];

uniform vec3 sunDir;
uniform vec3 sunColor;
uniform vec3 envColor;
uniform float envForce;
uniform float sunForce;
uniform mat4 viewMatrix;

uniform float noiseSize;
uniform float noiseForce;

uniform float emissionForce;
uniform float alpha;
uniform vec3 mainColor;

float noise(vec2 uv, float k) 
{
    return fract(sin(dot(vec2(24.342429, 105.24344), uv)) * 284322.942925432 + time * k / 1056.);
}

float calSunForce(float asF)
{
    float sf = 0.;
    float base = 0.;
    float bias = shadowBias;
    for (int i = 0; i < shadowSample; i++) 
    {
        for (int j = 0; j < shadowSample; j++) 
        {
            vec2 uv = shadowPos.xy * 0.5 + 0.5 + (vec2(i, j) - vec2(shadowSample) / 2.) * shadowScale;
            if (uv.x <= 0. || uv.x >= 1. || uv.y <= 0. || uv.y >= 1. || shadowPos.z >= 1.0 || shadowPos.z < 0.)
            {
                sf += sunForce;
                base += 1.;
                continue;
            }
            vec3 shadowc = texture(shadowMap, uv).xyz;
            float shadow = shadowc.r + shadowc.r / 255. + shadowc.b / 255. / 255.;
            float diff = shadow - shadowPos.z + bias;
            if (diff > 0.)
            {
                sf += sunForce;
            }
            else
            {
                sf += max(0., (bias + diff) / bias) * sunForce;
            }
            base += 1.;
        }
    }
    return min(sf / base, asF);
}

float getNoise()
{
    if (noiseForce <= 0.) return 1.;
    float n00 = noise(floor(vec2(fuv.x, fuv.y) * noiseSize) / noiseSize, 0.) * noiseForce + (1. - noiseForce);
    float n01 = noise(floor(vec2(fuv.x, fuv.y + 1. / noiseSize) * noiseSize) / noiseSize, 0.) * noiseForce + (1. - noiseForce);
    float n10 = noise(floor(vec2(fuv.x + 1. / noiseSize, fuv.y) * noiseSize) / noiseSize, 0.) * noiseForce + (1. - noiseForce);
    float n11 = noise(floor(vec2(fuv.x + 1. / noiseSize, fuv.y + 1. / noiseSize) * noiseSize) / noiseSize, 0.) * noiseForce + (1. - noiseForce);
    float x = fract(fuv.x * noiseSize);
    float y = fract(fuv.y * noiseSize);
    return mix(mix(n00, n10, x), mix(n01, n11, x), y);
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
    vec3 alb = texture(albedo, uv).rgb * mainColor * 0.99 + vec3(0.01);
    vec3 colm = alb;
    vec4 aocol = texture(tao, uv);
    float sf = calSunForce(aocol.g) * 0.8 + 0.2;
    vec3 a_s_m = texture(tasm, uv).rgb;
    float alp = alpha * a_s_m.r;
    if (alp < 1. && alp <= noise(vpos.xy / vpos.w, 1.)) discard;
    vec3 viewDir = -normalize(fpos);
    float specular = pow(a_s_m.g, 6.);
    float metallic = a_s_m.b;
    vec3 ref = -reflect(viewDir, normal);
    vec3 worldRef = -reflect((vec4(viewDir, 0.) * viewMatrix).xyz, wwnormal);
    vec3 wolrdNormal = wwnormal;
    vec3 skycol = textureLod(skyMap, vec3(worldRef.x, worldRef.y, -worldRef.z), (1. - a_s_m.g) * 14. + 1.).rgb;
    vec3 skydiff = textureLod(skyMap, vec3(-wolrdNormal.x, wolrdNormal.y, -wolrdNormal.z), 15.).rgb;
    skycol = skycol * envColor;
    skydiff = skydiff * envColor;
    vec3 ks = alb * 0.1 + vec3(0.9);

    vec3 refCol = sunColor * sf * pow(max(0., dot(ref, -sunDir)), 1. + 256. * specular);
    vec3 diffCol = sunColor * sf * max(0., dot(-sunDir, normal));

    for (int i = 0; i < 8; i++)
    {
        if (light[i].x < 0.001 && light[i].y < 0.001 && light[i].z < 0.001) continue;
        vec3 ldir = light[i] - wpos;
        float lForce = 1. / pow(length(ldir), 2.);
        vec3 rgb = lightRGB[i] * lForce;
        if (rgb.x < 0.001 && rgb.y < 0.001 && rgb.z < 0.001) continue;
        ldir = normalize(ldir);
        refCol += rgb * pow(max(0., dot(worldRef, ldir)), 1. + 256. * specular);
        diffCol += rgb * max(0., dot(ldir, wolrdNormal));
    }

    col += alb * skydiff * envForce * 0.99 * 1.5 + skycol * envForce * 0.01 * 1.5;
    col += alb * diffCol * 1.4;
    col += ks * refCol * (specular * 256. + 1.) / 257.; // / pow(0.01, pow(specular, 3.)) * 0.01;// (0.8 * specular) * 0.5;
    col += skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;

    colm *= skycol * envForce * 1.5 + 
        refCol * (specular * 128. + 129.) / 257. * 3. + 
        skycol * pow((1. - max(0., dot(viewDir, normal))), 4.) * 0.5;
    color = vec4(mix(col, colm, metallic * a_s_m.g), 1.);
    vec4 ems = texture(emission, uv);
    float ns = getNoise();
    color = vec4(color.rgb * ns * aocol.r + alb * aocol.b * 5. + ems.rgb * mainColor * ems.a * emissionForce * 5., 1.0);
    vec3 cc = color.rgb;
    cc.x = pow(cc.x, 1.3) * 1.5;
    cc.y = pow(cc.y, 1.3) * 1.5;
    cc.z = pow(cc.z, 1.3) * 1.5;
    color.rgb = cc;
}