/* 
    More raymarching tricks 
*/

#version 330 core 
#define RENDER_MIST

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



// ======== TRANSFORMS ======== //
mat2 rot(float a) 
{
    float ca = cos(a);
    float sa = sin(a);
    
    return mat2(ca, sa, -sa, ca);
}
// random numbers 
float random(vec2 uv)
{
    return fract(dot(sin(uv * 752.322 + uv.yx * 653.842), vec2(254.652)));
}

// ======== SHAPES ======== //
float cylinder(vec2 p, float s)
{
    return length(p) - s;
}
float sphere(vec3 p, float s)
{
    return length(p) - s;
}
float box(vec3 p, vec3 s)
{
    p = abs(p) - s;
    return max(p.x, max(p.y, p.z));
}


// ======== COMPOSITIONS ======== //
vec3 clump(vec3 p)
{
    const float rot_freq = 0.125;
    const float scale_freq = 0.2512;
    const float particle_scale = 0.0025;
    float particle_dist = particle_scale * sin(i_time * scale_freq) + 1.1;

    for(int i = 0; i < MAX_CLUMP_ITER; ++i)
    {
        float t = (0.5 * sin(i_time) + 0.5 + i_time)  * rot_freq + i;
        p.xy *= rot(t * 1.414);
        p.yz *= rot(t * 0.7071);

        // twist it a bit 
        //float dist = -22.0;
        //p = (fract(p / dist - 0.5) - 0.5) * dist;
        
        p = abs(p);
        // the smaller this number is, the more "compact" the resulting volume
        //p -= 1.2;           // spacing between iterations
        p -= particle_dist;
    }
        
    return p;
}

// Color buffers
float col_at = 0.0;
float col_buf_1 = 0.0;
float col_buf_2 = 0.0;

// ======== DISTANCE TO SCENE ======== //
float map(vec3 p)
{
    vec3 p_clump = clump(p);
    vec3 box_dims = vec3(1.0, 0.2, 0.3);

    float d1 = box(p_clump, box_dims);
    float d2 = box(p_clump, box_dims);

    // final/output distance 
    float d = max(abs(d1), abs(d2)) - 0.2;

    // accumulate colors
    col_at += 0.13 / (0.13 / abs(d));

    // what happens if color is accumulated based on another shape?
    //float d_col = box(p_clump * vec3(0.4), vec3(2.2));
    col_buf_1 += 0.2 / (0.15 / abs(d1));
    col_buf_2 += 0.2 / (0.5 / abs(d2));

    return d;
}

// ======== CAMERA ======== //
void camera(inout vec3 p)
{
    float t = i_time * 0.2;
    p.yz *= rot(t * 1.141);
    p.zx *= rot(t * 0.7071);
}


// ======== ENTRY POINT ======== //
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    // fix center of screen 
    uv -= 0.15;
    // fake move the screen a bit 
    //uv -= 0.25 - (0.5 + sin(i_time * 0.21));
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    // camera position 
    float cam_dist = 12.0;
    vec3 s = vec3(0.0, 1.0, -cam_dist);
    vec3 r = normalize(vec3(-uv, 1.0));
    
    // control camera from here rather than from map
    camera(s);
    camera(r);

    // ray march / path trace loop
    vec3 p = s;
    int i = 0;

    float factor = 0.98; // + (0.102 * random(uv));

    for(i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        float d = map(p);
        // adjust the distance calc 
#ifdef RENDER_MIST
        float dd = -length(p - s) + 4.0 * (0.5 * sin(i_time * 0.002) + 0.5);
        d = abs(max(d, dd));
        d *= factor;
#endif //RENDER_MIST

        if(d < MIN_RAYMARCH_DIST)
#ifdef RENDER_MIST
            d = 0.0004;
#else
            break;
#endif // RENDER_MIST
        p += r * d;
    }

    vec3 col = vec3(0.0); 
    //col += pow(1.0 - i / 101.0, 16.0);

    float blue_component = 0.5 * sin(i_time * 0.1) + 0.5 - 0.32;
    vec3 bg_col_1 = vec3(0.2, 0.5, blue_component);    
    vec3 bg_col_2 = vec3(0.5, 0.0, 0.7);
    vec3 bg_col_3 = vec3(0.4, 0.5, 0.77);

    vec3 bg = mix(bg_col_1, bg_col_2, pow(abs(r.z), 6.2));
    bg = mix(bg, bg_col_3, pow(abs(r.y), 8.0));

    col += pow(col_at * 0.022, 0.22) * bg;
    // mix colours
    float bg_mix = 0.5 * sin(col_at) + 0.5;
    col += col_at * 0.012 * bg;
    col += pow(col_buf_1 * 0.008, 1.2);
    col += pow(col_buf_2 * 0.058, 2.2);
    // change background "depth"?
    //col *= 1.5 - length(uv);

    col = 1.0 - exp(-col * 1.8);
    col = pow(col, vec3(7.2));
    
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
