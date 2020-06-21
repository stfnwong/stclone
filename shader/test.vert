/*
Sample vertex shader for 'unit' style testing 
*/

#version 410 core 

in vec3 in_pos;
in vec4 in_color;
in vec3 in_texcoord;
in float in_factor;

out vec4 out_color;
out vec2 out_texcoord;
out float out_factor;

uniform vec2 v2Offset;
uniform mat4 matProj;

void main(void)
{
    vec4 pos = vec4(in_pos + vec3(v2Offset, 0), 1.0);
    
    gl_Position = pos * matProj;
    out_color = in_color;
    out_texcoord = in_texcoord;
    out_factor = in_factor;
}
