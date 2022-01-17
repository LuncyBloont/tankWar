#version 300 es
precision mediump float;

in vec3 pos;
out vec4 info;

uniform mat4 perspectiveShadow;
uniform mat4 rotate;

void main()
{
    gl_Position = perspectiveShadow * rotate * vec4(pos, 1.);
    info = vec4(gl_Position.z, 0., 0., 1.);
}