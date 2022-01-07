#version 300 es
precision mediump float;

uniform samplerCube skyMap;
uniform float time;

in vec3 fuv;
out vec4 color;
void main() {
    float vr = 0.;//time / 100000.;
    mat3 rot = mat3(
        cos(-0.6 - vr), 0., sin(-0.6 - vr),
        0., 1., 0.,
        -sin(-0.6 - vr), 0., cos(-0.6 - vr)
    );
    color = texture(skyMap, rot * normalize(fuv));
}