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

/*
    particles()
    TODO: how many iters can I do before I get framerate drops?
*/
vec3 particles(vec3 p, float t)
{
    int num_iters = 4;      // TODO: GLSL compiler optimizes away to const right?
    //float s = - 2 + exp(fract(i_time * 0.5) * 0.1) * 4.0;
    float s = 6.0 + sin(i_time * 0.25) * 4.0;
    //float xy_rot_offset = 0.24 * cos(i_time); //0.777;
    float xy_rot_offset = 0.6;

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

float exploding_particles(vec3 p, float t, float offset)
{
    float ts = t * 0.15 + offset;
    
    vec3 p1 = particles(p, t * 0.1);
    //vec3 p2 = particles(p + vec3(3, 2, 1), t * 0.13);

    float fade = 1.0 - pow(fract(ts), 9);

    float d1 = length(p1) - 1.5 * fade;
    //float d2 = length(p2) - 1.4 * fade;

    //return smooth_min(d1, d2, -1.0);
    return d1;
}

/*
    Generate central collection of particles 
*/
//float map(vec3 p)
//{
//    float ts1 = 0.12;
//    float ts2 = -0.32;
//    vec3 p1_offset = vec3(1, 1, 0);
//    vec3 p2_offset = vec3(3, 0, 0);
//
//    // each set of points here is actually part of a new "collection" of
//    // particles
//    vec3 p1 = particles(p + p1_offset, i_time * ts1);
//    vec3 p2 = particles(p + p2_offset, i_time * ts2);
//
//    // merge the particles together 
//    float d1 = length(p1) - 2.0;
//    float d2 = length(p2) - 2.0;
//    float merge = smooth_min(d1, d2, -1.0);
//
//    return merge;
//}


float map(vec3 p)
{
    float m1 = exploding_particles(p, i_time, 0.0);
    float m2 = exploding_particles(p, i_time, 0.5);

    return smooth_min(m1, m2, -1);
}


void cam_rotate(inout vec3 p, float rate)
{
    float t = i_time * rate;
    p.xz *= rotate(t);
    p.xy *= rotate(t * 1.2);
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    float ar = i_resolution.x / i_resolution.y;
    vec2 uv = frag_coord / i_resolution.xy;


    // draw a sphere 
    vec3 s = vec3(0, 0, -60);
    vec3 r = normalize(vec3(-uv, 1));
    // change camera pos   
    cam_rotate(s, 0.3);
    cam_rotate(r, 0.3);

    // set up renderer 
    vec3 p = s;
    int i = 0;
    vec3 col = vec3(0);
    float at = 0;

    for(i = 0; i < 96; ++i)
    {
        float m = map(p);      // depth map?
        float d = abs(m);
        at += 0.07 / (0.1 + abs(m));

        if(d < 0.001)
            d = 0.1;        // bloom?

        p += r * d;         
        
        // update color
        float col_param = at * 0.008;
        col += pow(min(col_param, col_param * 0.5 * sin(0.5 * i_time) + 0.67), 1.6) * vec3(0.1, 0.3, 0.7); 

        //col += pow(at * 0.004, 1.4 * sin(0.25 * i_time)) * vec3(0.1, 0.5, 0.85); 
        //col += pow(at * 0.012, 2) * vec3(0.1, 0.5, 1.0 * cos(0.25 * i_time) + 0.25);
    }

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
