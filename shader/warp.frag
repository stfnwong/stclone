/*
    basic warping
*/

#version 330 core 

#define PI 3.14159265359

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    //vec2 uv = gl_FragCoord.xy / i_resolution;
    vec2 uv = frag_coord.xy / i_resolution;
    
    vec3 color = vec3(0.0);

    color += sin(uv.x * cos(i_time / 60.0) * 60.0) + sin(uv.y * cos(i_time / 60.0) * 10.0);
    color += cos(uv.y * cos(i_time / -20.0) * 60.0) + cos(uv.x * sin(i_time / 10.0) * 10.0);

    color *= sin(i_time / 10.0) * 0.5;          // dampen the brightness

    frag_color = vec4(color, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
    //mainImage(out_color, position_out * i_resolution.xy);
}
