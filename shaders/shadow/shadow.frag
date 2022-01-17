#version 300 es
precision mediump float;

in vec4 info;
out vec4 color;

void main()
{
    color = info;
}