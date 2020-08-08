/*
    Simple Raytracer 

*/

#version 330 core 

#define NUM_INTERSECTION_ITERS 64
#define NUM_SHADOW_ITERS 64
#define NUM_ROTATION_ITERS 3
#define NUM_PATHS 32

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec3 col = vec3(0.0);

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
