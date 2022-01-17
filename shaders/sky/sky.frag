#version 300 es
precision mediump float;

uniform samplerCube skyMap;
uniform float time;
uniform vec3 sunDir;
uniform vec3 sunCol;
uniform vec3 envCol;
uniform float envForce;
uniform float sunForce;

in vec3 fuv;
in vec3 rawPos;
out vec4 color;
void main() 
{
    color = texture(skyMap, normalize(fuv)) * vec4(envCol * envForce, 1.) + 
        (vec4(pow(max(0., dot(normalize(rawPos), -sunDir)), 512.) * sunCol* 0.7, 0.) +
        vec4(max(0., dot(normalize(rawPos), -sunDir)) * sunCol * 0.3, 0.) * vec4(sunCol * sunForce, 1.));
}