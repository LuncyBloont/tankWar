#version 300 es
precision mediump float;

uniform mat4 inPerspective;
uniform mat4 perspective;
uniform mat4 viewMatrix;

in vec4 pos;
out vec3 fuv;
void main()
{
    gl_Position = perspective * vec4(pos.xyz, 1.);
    gl_PointSize = 8.;
    fuv = (vec4(pos.xyz, 0.) * viewMatrix).xyz;
}