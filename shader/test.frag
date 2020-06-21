/*
Sample fragment shader for 'unit' style testing 
*/

#version 410 core 

uniform sampler2D tex;

in vec4 out_color;
in vec2 out_texcoord;
in float out_factor;

out vec4 frag_color;

void main(void)
{
    vec4 v4Texture = out_color * texture(tex, out_texcoord);
    vec4 v4Color = out_color;

    frag_color = mix(v4Texture, v4Color, out_factor);
}
