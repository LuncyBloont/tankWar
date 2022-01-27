#version 300 es
precision highp float;

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
    float k = max(0., dot(normalize(rawPos), -sunDir));
    color = texture(skyMap, normalize(fuv)) * vec4(envCol * envForce, 1.) + 
        (vec4(pow(k, 512.) * sunCol * 0.6, 0.) +
        vec4(k * sunCol * 0.4, 0.) * vec4(sunCol * sunForce, 1.));
    
    color.x = pow(color.x, 1.3) * 1.5;
    color.y = pow(color.y, 1.3) * 1.5;
    color.z = pow(color.z, 1.3) * 1.5;
}