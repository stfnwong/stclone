/*
    Fractal Brownian Motion 
    This warps an fbm with another fbm
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

#define TOTAL_POINTS 8


mat2 rotate(float a)
{
    float ca = cos(a);
    float sa = sin(a);

    return mat2(ca, sa, -sa, ca);
}

float random2(vec2 p)
{
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// this is the implementation by Morgan McGuire
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st)
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    // four corner of a tile
    float a = random2(i);
    float b = random2(i + vec2(1.0, 0.0));
    float c = random2(i + vec2(0.0, 1.0));
    float d = random2(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 6
float fbm(in vec2 st)
{
    // initialize
    float value = 0.0;
    float amp = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = rotate(0.5);

    // start combining waves 
    for(int i = 0; i < NUM_OCTAVES; ++i)
    {
        // reduce axial bias with rotations 
        value += amp * noise(st);
        st = rot * st * 2.0 + shift;      // next octave
        amp *= 0.5;     // dampen higher frequency components
    }

    return value;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = 3.0 * frag_coord / i_resolution.xy; // * 3.0;        // multiply on top zooms out, multiply on bottom zooms in
    //st.x *= i_resolution.x / i_resolution.y;
    vec3 col = vec3(0.0);

    vec2 q = vec2(0.0);
    q.x = fbm(st + 0.20 * i_time);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * i_time);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * i_time);

    float f = fbm(st + r);

    // now mix colors 
    col = mix(vec3(0.101, 0.91, 0.36), vec3(0.76, 0.78, 0.42), clamp((f*f) * 4.0, 0.1, 1.0));
    
    col = mix(col, vec3(0.0, 0.0, 0.116), clamp(length(q), 0.1, 1.0));

    col = mix(col, vec3(0.97, 1.0, 1.0), clamp(length(r.x), 0.1, 1.0));

    vec3 col_mix = col * (f * f * f + 0.6 * f * f + 0.5 * f);
    //vec3 col_mix = col * f;
    //vec3 col_mix = col * vec3(q, 1.0) * vec3(1.0, r);

    frag_color = vec4(col_mix, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
}

