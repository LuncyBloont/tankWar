#version 300 es
precision mediump float;

uniform samplerCube skyMap;

in vec3 fuv;
out vec4 color;
void main() {
    mat3 rot = mat3(
        cos(-0.6), 0., sin(-0.6),
        0., 1., 0.,
        -sin(-0.6), 0., cos(-0.6)
    );
    color = texture(skyMap, rot * normalize(fuv));
}