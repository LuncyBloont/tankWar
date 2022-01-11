#version 300 es
precision mediump float;

uniform samplerCube skyMap;
uniform float time;
uniform vec3 sunDir;
uniform vec3 sunCol;

in vec3 fuv;
in vec3 rawPos;
out vec4 color;
void main() {
    color = texture(skyMap, normalize(fuv)) + vec4(pow(max(0., dot(normalize(rawPos), -sunDir)), 512.) * sunCol* 0.7, 0.) +
        vec4(max(0., dot(normalize(rawPos), -sunDir)) * sunCol * 0.3, 0.);
}