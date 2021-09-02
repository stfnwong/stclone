/*
    Terrain test
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
#define MAX_MARCH_STEPS 96
#define MIN_MARCH_DIST 0.001
#define MAX_MARCH_DIST 20.0


// ========= TRANSFORMS ======== //
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


// ========= GEOMETRY ======== //


float height_map(vec2 p)
{
    float ret = 0.0;
    float a = 1;

    // combine the layer function in various ways 
    for(int i = 0; i < 3; i++)
    {

    }
}


float map(vec3 p)
{
    return (p.y - height_map(p.xz) * 0.35) * 0.75;
}

float trace(in vec3 ro, in vec3 rd)
{
    float t = 0;
    float d;

    for(int i = 0; i < MAX_MARCH_STEPS; ++i)
    {
        d = map(ro + rd * t);
        if(abs(d) < MIN_MARCH_DIST * (t * 0.125 + 1.0) || t > MAX_MARCH_DIST)
            break;

        // try and take larger steps where possible
        t += (step(1.0, t) * 0.3 + 0.7) * d;
    }
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

