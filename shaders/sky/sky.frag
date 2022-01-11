#version 300 es
precision mediump float;

uniform samplerCube skyMap;
uniform float time;

in vec3 fuv;
out vec4 color;
void main() {
    color = texture(skyMap, normalize(fuv));
}