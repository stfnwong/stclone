/*
Some map of spheres
This is taken from various live shader videos, its not fully original work
*/


#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


mat2 rotate(float a)
{
    float ca = cos(a);
    float sa = sin(a);

    return mat2(ca, sa, -sa, ca);
}

// IQ polynomial smooth min 
float smooth_min(float a, float b, float h)
{
    float k = clamp((a - b) / h * 0.5 + 0.5, 0.0, 1.0);
    return mix(a, b, k) - k * h * (1-k);
}

vec3 smooth_min(vec3 a, vec3 b, float h)
{
    vec3 k = clamp((a - b) / h * 0.5 + 0.5, 0.0, 1.0);
    return mix(a, b, k) - k * h * (1-k);
}

float sphere(vec3 p, float s)
{
    return length(p) - s;
}

vec3 particles(vec3 p, float t)
{
    int num_iters = 4;      // TODO: GLSL compiler optimizes away to const right?
    float s = 8;
    //float xy_rot_offset = 0.24 * cos(i_time); //0.777;
    float xy_rot_offset = 0.677;

    for(int i = 0; i < num_iters; ++i)
    {
        float ts = t + i;
        p.xz *= rotate(ts);
        p.xy *= rotate(ts * xy_rot_offset);
        p = smooth_min(p, -p, -1.5);
        p -= s;
        s *= 0.7;;       // pos gets gradually smaller 
    }

    return p;
}

/*
    Generate central collection of particles 
*/
float map(vec3 p)
{
    float ts1 = 0.12;
    float ts2 = 0.92;
    vec3 p1_offset = vec3(0);
    vec3 p2_offset = vec3(3, 0, 0);

    // each set of points here is actually part of a new "collection" of
    // particles
    vec3 p1 = particles(p + p1_offset, i_time * ts1);
    vec3 p2 = particles(p + p2_offset, i_time * ts2);

    // merge the particles together 
    float d1 = length(p1) - 2.0;
    float d2 = length(p2) - 2.0;
    float merge = smooth_min(d1, d2, -1.0);

    return merge;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    float ar = i_resolution.x / i_resolution.y;
    vec2 uv = frag_coord / i_resolution.xy;

    //vec2 uv = vec2(frag_coord

    // draw a sphere 
    vec3 s = vec3(0, 0, -60);
    vec3 r = normalize(vec3(-uv, 1));

    vec3 p = s;
    int i = 0;
    vec3 col = vec3(0);
    float at = 0;

    for(i = 0; i < 96; ++i)
    {
        float m = map(p);      // depth map?
        float d = abs(m);
        at += 0.07 / (0.2 + abs(m));
        if(d < 0.001)
            d = 0.1;        // bloom?

        p += r * d;         

        // update color
        col += at * 0.001 * vec3(0.2, 0.5, 1.0 * cos(0.25 * i_time));
    }

    float col_scale = 1.12;
    col += pow(1-i / 101.0, 4) * col_scale;

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
    //mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
