#version 300 es
precision mediump float;
in vec3 pos;
in vec2 uv;
in vec3 normal;
in vec3 tangent;
in vec3 bitangent;
out vec2 fuv;
out vec3 fnormal;
out vec3 fpos;
out vec4 vpos;
out vec3 ftangent;
out vec3 fbitangent;
out vec3 wnormal;
out vec3 wtangent;
out vec3 wbitangent;
out vec4 shadowPos;

uniform mat4 perspective;
uniform float time;
uniform mat4 rotate;
uniform mat4 inRotate;
uniform mat4 viewMatrix;
uniform mat4 perspectiveShadow;

void main() 
{
    fpos = (viewMatrix * rotate * vec4(pos, 1.)).xyz;
    gl_Position = perspective * vec4(fpos, 1.);
    fuv = uv;
    wnormal = (vec4(normal, 0.) * inRotate).xyz;
    wtangent = (rotate * vec4(tangent, 0.)).xyz;
    wbitangent = (rotate * vec4(bitangent, 0.)).xyz;
    fnormal = (viewMatrix * vec4(wnormal, 0.)).xyz;
    ftangent = (viewMatrix * vec4(wtangent, 0.)).xyz;
    fbitangent = (viewMatrix * vec4(wbitangent, 0.)).xyz;
    
    /*if (fract(time / 1000.) > 0.5) 
    {
        ftangent = ftangent - dot(ftangent, fnormal) * fnormal;
        vec3 _fbitangent = cross(ftangent, fnormal);
        if (dot(fbitangent, _fbitangent) < 0.) fbitangent = -_fbitangent;
        else fbitangent = _fbitangent;
        // Use orthogonal TBN matrix
    }*/

    vpos = gl_Position;
    gl_PointSize = 1.;
    shadowPos = perspectiveShadow * rotate * vec4(pos, 1.);
}