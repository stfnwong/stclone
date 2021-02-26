/*
    Fractal Brownian Motion
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

    // start combining waves 
    for(int i = 0; i < NUM_OCTAVES; ++i)
    {
        value += amp * noise(st);
        st *= 2.0;      // next octave
        amp *= 0.5;     // dampen higher frequency components
    }

    return value;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = frag_coord / i_resolution;
    st.x *= i_resolution.x / i_resolution.y;

    vec3 col = vec3(0.0);
    col += fbm(st * 3.0) * vec3(0.1, 0.23, 0.78);
    col += fbm(st * 0.7) * vec3(0.98, 0.78, 0.21);

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
}
