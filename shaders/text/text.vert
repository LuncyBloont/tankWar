#version 300 es
precision mediump float;

in vec3 pos;
in vec2 uv;

uniform mat4 perspective;
uniform mat4 viewMatrix;
uniform mat4 rotate;

out vec2 fuv;

void main()
{
    gl_Position = perspective * viewMatrix * rotate * vec4(pos, 1.);
    fuv = 1. - uv;
}


