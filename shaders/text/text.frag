#version 300 es

precision mediump float;

uniform sampler2D albedo;
uniform int[8] text;

in vec2 fuv;
out vec4 color;

void main()
{
    if (int(fuv.x * 8.) < 0 || int(fuv.x * 8.) > 7)
    {
        discard;
        return;
    }
    int tid = text[int(fuv.x * 8.)];
    if (tid < 0) 
    {
        discard;
        return;
    }
    vec2 suv = vec2((fract(fuv.x * 8.) * 0.6 + 0.2) / 37. + float(tid) / 37., fuv.y);
    vec4 c = texture(albedo, suv);
    if (c.r < 0.5) discard;
    color = vec4(vec3(1.), 1.);
}