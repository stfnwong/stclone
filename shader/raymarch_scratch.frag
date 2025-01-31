/* 
 * Some basic raymarching from scratch 
 */

#version 330 core 
#define RENDER_MIST

// Constants for raymarch
// TODO: it it generally better in shader code to use typed vars or preprocessor?

const float EPS = 0.001;
const float MAX = 20.0;
const int MAX_RAYMARCH_STEPS = 100;
const float MIN_RAYMARCH_DIST = 0.001;
const int MAX_CLUMP_ITER = 5;


// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


float sph(in vec3 p)
{
    return length(p) - 1.0;
}

float plane(in vec3 p)
{
    return p.y + 1.0;
}


float map(in vec3 p)
{
    float d1 = sph(p);
    float d2 = plane(p);

    return min(d1, d2);
}


vec3 normals(in vec3 p)
{
    vec2 e = vec2(EPS, 1.0);
    vec3 gr = vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
    );

    return normalize(gr);
}


float trace(vec3 ro, vec3 rd)
{
    float d, t;
    d = 1.0;
    t = 0.0;

    for(int i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        if(d < EPS)
            break;

        d = map(ro + t * rd);
        t += d;
    }

    return t;
}


void main(void)
{
    vec2 uv = (gl_FragCoord.xy * 2.0 - i_resolution.xy) / min(i_resolution.x, i_resolution.y);

    // Configure rays
    vec3 ro = vec3(0.0, -0.2, 2.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    vec3 col = vec3(0.0);
    float tr = trace(ro, rd);

    if(tr < MAX)
    {
        vec3 pos = ro + tr * rd;
        vec3 nor = normals(pos);

        col = vec3(0.2, 0.122, 0.4);
        col *= exp(-tr * 0.102);
    }

    gl_FragColor = vec4(col, 1.0);
}
