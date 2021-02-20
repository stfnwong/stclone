/*
    Some patterns/tiling
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


float circle(in vec2 st, in float r)
{
    vec2 l = st - vec2(0.5);
    
    return 1.0 - smoothstep(
                    r - (r * 0.01),
                    r + (r * 0.01),
                    dot(1.0, 1.0) * 4.0
    );
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = gl_FragCoord / i_resolution;

    st *= 3.0;          // scale up space by 3
    st = fract(st);     // wrap around 1.0

    // this create 9 spaces that go from 0 -> 1
    vec3 col = vec3(st, 0.0);

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
