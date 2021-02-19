/*
    Explosion
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
    return mix(a, b, k) - k * h * (1.0-k);
}

vec3 smooth_min(vec3 a, vec3 b, float h)
{
    vec3 k = clamp((a - b) / h * 0.5 + 0.5, 0.0, 1.0);
    return mix(a, b, k) - k * h * (1.0-k);
}

float sphere(vec3 p, float s)
{
    return length(p) - s;
}

/*
    particles()
    TODO: how many iters can I do before I get framerate drops?
*/
vec3 particles(vec3 p, float t, float texp)
{
    float s = 1.0 + smoothstep(0.0, 1.0, fract(texp)) * 9.0;
    float xy_rot_offset = 0.6;

    for(int i = 0; i < 4; ++i)
    {
        float ts = t + float(i);
        p.xz *= rotate(ts);
        p.xy *= rotate(ts * xy_rot_offset);
        p = smooth_min(p, -p, -1.24);
        p -= s;
        s *= 0.7;       // pos gets gradually smaller 
    }

    return p;
}

float explosion(vec3 p, float t, float offset)
{
    float speed = 0.15;
    float ts = t * speed + offset;
    
    vec3 p1 = particles(p, ts * 0.00, ts);
    vec3 p2 = particles(p + vec3(1, 2, 3), ts * 0.13, ts);

    float fade = 1.0 - pow(fract(ts), 10);

    float d1 = length(p1) - 1.5 * fade;
    float d2 = length(p2) - 1.4 * fade;

    return smooth_min(d1, d2, -1.0);
}


float at1 = 0.0;
float at2 = 0.0;

float map(vec3 p)
{
    // adjust param 2 for start timing
    float m1 = explosion(p, i_time + 1.1, 2.2);
    float m2 = explosion(p, i_time, 0.00);

    at1 += 0.06 / (0.10 + abs(m1));
    at2 += 0.05 / (0.10 + abs(m2));

    return smooth_min(m1, m2, -1.0);
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
    vec3 s = vec3(0, 0, -20);
    vec3 r = normalize(vec3(-uv, 1));
    // change camera pos   
    cam_rotate(s, 0.3);
    cam_rotate(r, 0.3);

    // set up renderer 
    vec3 p = s;
    int i = 0;
    vec3 col = vec3(0.0);

    for(i = 0; i < 48; ++i)
    {
        float m = map(p);      
        float d = abs(m);

        if(d < 0.001)
            d = 0.1;        // bloom?

        p += r * d;         
        
        col += pow(at1 * 0.02, 2.1) * vec3(0.6, 0.2, 0.15);
        col += pow(at2 * 0.02, 1.8) * vec3(0.3, 0.33, 0.77);
    }

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
