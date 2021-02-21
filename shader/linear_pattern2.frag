/*
    Some more patterns/tiling
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


vec2 rotate(vec2 st, float a)
{
    st -= 0.5;
    float ca = cos(a);
    float sa = sin(a);
    
    st = mat2(ca, -sa, sa, ca) * st;
    
    st += 0.5;

    return st;
}

vec2 tile(vec2 st, float zoom)
{
    st *= zoom;
    return fract(st);
}

float box(vec2 st, vec2 size, float smoothing)
{
    size = vec2(0.5) - size * 0.5;
    vec2 aa = vec2(smoothing * 0.5);
    vec2 uv = smoothstep(size, size + aa, st);

    uv *= smoothstep(size, size + aa, vec2(1.0) - st);

    return uv.x * uv.y;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = frag_coord / i_resolution;
    vec3 col = vec3(0.0);

    // divide the space 4 ways  
    st = tile(st, 4.0);

    // now rotate the divided space by 45 degrees
    st = rotate(st, PI * 0.25);
    // draw a square
    col = vec3(box(st, vec2(0.7), 0.01));

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
}
