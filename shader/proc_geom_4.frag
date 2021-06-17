/*
    More geom, based on evvvvil streams 
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


// trace globals 
const int   MAX_TRACE_STEPS = 128;
const float MIN_TRACE_DIST  = 0.001;
const float MAX_TRACE_DIST  = 40.0;
// time
float mod_time;
// lighting
vec3 rd, ray_pos, norm;
// color 
vec3 col, fog, light_dir, albedo;
float diffuse, fresnel, specular, glow=0, glow2=0;
// geom
vec3 pos2, pos3;
float attr = 0;
// animation
float anim1=0, anim2=0;

// artifact killah
vec2 eps = vec2(0.00003, -0.00003);


// ======== PRIMITIVES ======== //
float box(vec3 p, vec3 r)
{
    p = abs(p) - r;
    return max(max(p.x, p.y), p.z);
}
float cylinder(vec3 p, float s)
{
    return length(p) - s;
}

// ======== TRANSFORMS ======== //
float smin(float a, float b, float k)
{
    float h = max(0.0, k - abs(a-b));
    return min(a, b) - h * h * 0.25 / k;
}

mat2 rotate(float r)
{
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

// ======== SCENE ======== //
// material ids 
#define MAT1 3
#define MAT2 5
#define MAT3 6
#define MAT4 7


vec2 geom(vec3 p, float mat_id)
{
    vec2 t, h;

    t = vec2(box(abs(p) - vec3(0, 0, 1), vec3(2.2, 0.4, 0.7)), mat_id);
    t.x = min(0.6 * cylinder(abs(abs(p) - vec3(0.5, 2, 0)) - vec3(0.5, 1, 1), 0.1), t.x);
    if(mat_id > MAT3)
        //glow2 += (0.001 / (0.03 * t.x * t.x * (2000.0 - (0.2 * anim1)))) * 0.5; // * 99.8));
        glow2 += 0.01 / (0.1 + pow(abs(t.x), -0.2));
    h = vec2(box(abs(p) - vec3(0, 0, 1), vec3(2.0, 0.5, 0.5)), MAT2);
    t = (t.x < h.x) ? t : h;        // merge 
    h = vec2(box(p, vec3(1.8, 0.2, 2.8)), MAT3);
    //glow += 0.001 / (0.1 * h.x * h.x * 4000.0);
    t = (t.x < h.x) ? t : h;            // merge 
    t.x *= 0.6;

    return t;
}


vec2 map(vec3 p)
{
    pos2 = p;
    //pos2.z = mod(p.z - mod_time * 0.2, 10.0) - 5.0;        // mod along x
    pos2.x = mod(p.x - mod_time * 0.1, 10.0) - 5.0;        // mod along x
    //pos2.y = mod(p.y - mod_time * 0.1, 1.0) - 0.5;        // mod along y

    for(int i = 0; i < 3; ++i)
    {
        pos2 = abs(pos2) - vec3(2.5, 1.9, 1.0);
        pos2.xy *= rotate(cos(p.y * 0.05) * 0.5);
        pos2.yz *= rotate(0.5 * sin(0.45 * mod_time + 2.5));
        pos2.x += 0.4;
    }
    //vec2 t = geom(p.xyz, MAT3);         // call this to render geometry alone with no transforms
    vec2 t = geom(pos2, MAT1);

    return t;
}

vec2 trace(in vec3 ro, in vec3 rd)
{
    vec2 h, t = vec2(0.01);

    for(int i = 0; i < MAX_TRACE_STEPS; ++i)
    {
        h = map(ro + rd * t.x);
        if(h.x < MIN_TRACE_DIST || t.x > MAX_TRACE_DIST)
            break;
        t.x += h.x;
        t.y = h.y;
        if(t.x > MAX_TRACE_DIST)
            t.y = 0.0;
    }

    return t;
}

// orbit camera coords
// (x-axis offset (radians), y position, z position, rotation vel)
//vec4 c = vec4(-35.0, -1.0, 3.0, 0.0);
vec4 c = vec4(
            1.2 * mod_time - 4.0,
            -10.0 * sin(0.1 * mod_time),
            //30.0 * sin(mod_time),
            //32.2 * exp(1.25 * sin(4.0 * mod_time)),
            //smoothstep(-30, 30, 5 * sin(mod_time)),
            12.0 - mod_time - 0.2 * cos(2.0 * mod_time),
            0.0
              //0.2 + smoothstep(0.0, 0.5, (2.0 * mod_time))
);
//vec4 c = vec4(cos(mod_time), 
//              2.0 - exp(1.0 - mod_time * mod_time),
//              6.8 + exp(1.0 - mod_time), 
//              0.1
//);

//vec4 c = vec4(-3.0 * sin(0.25 * mod_time + 10.0), 
//              -8.0 * cos(2.5 * mod_time + 10.0), 
//              10.0,
//              0.2 * sin(2.4 * mod_time + 1.0));

#define ambient(d) clamp(map(ray_pos * norm * d).x / d, 0.0, 1.0)
#define subsurface(d) smoothstep(0.0, 1.0, map(ray_pos + light_dir * d).x / d)

void main_image(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    // artifact killah
    mod_time = mod(i_time, 0.5 * 62.8318);
    // ray 
    //vec3 ro = vec3(cos(mod_time * c.w + c.x) * c.z, c.y, sin(mod_time * c.w + c.x) * c.z);
    vec3 ro = vec3(
        //cos(mod_time * c.w + c.x) * c.z, 
        cos(0.45 * mod_time) * 3.0 - 4.0,
        cos(0.25 * mod_time) * -8.0,
        //cos(0.125 * mod_time) * -10.0,
        //smoothstep(c.y -30, c.y + 30, mod_time), 
        sin(mod_time * c.w + c.x) * c.z
    );
    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    col = fog = vec3(0.01, 0.01, 0.14) - length(uv) * 0.02 - rd.z * 0.18;
    light_dir = normalize(vec3(-0.2 * cos(mod_time * 0.4), -2.0 * sin(mod_time * 0.25), -0.5));
    //light_dir = normalize(vec3(0.2, 0.5, -0.5));
    // trace it 
    vec2 z = trace(ro, rd);
    float t = z.x;
    if(z.y > 0)      // gonna make it 
    {
        ray_pos = ro + rd * z.x;
        norm = normalize(
            eps.xyy * map(ray_pos + eps.xyy).x +
            eps.yyx * map(ray_pos + eps.yyx).x +
            eps.yxy * map(ray_pos + eps.yxy).x +
            eps.xxx * map(ray_pos + eps.xxx).x
        );
                
        // these colors are actually quite ugly...
        albedo = vec3(1, 0.5, 0.0);
        if(z.y > MAT1)
            albedo = vec3(1.0, 0.0, 0.0);
        if(z.y > MAT2)
            albedo = vec3(0.0, 0.0, 1.0);
        if(z.y >= MAT3)
            albedo = vec3(0.0, 1.0, 0.0);
        if(z.y >= MAT4)     // background mostly
            albedo = mix(vec3(0.5, 0.7, 0.7), vec3(0.9, 0.9, 0.7), 0.5 + 0.5 * sin(pos3.y * 7.0));
        diffuse = max(0.0, dot(norm, light_dir));
        fresnel = pow(1.0 + dot(norm, rd), 4.0);
        specular = pow(max(dot(reflect(light_dir, norm), rd), 0.0), 40.0);
        col = mix(specular + mix(vec3(0.8), vec3(1.0), abs(rd)) * albedo * (ambient(0.1) + 0.2) * (diffuse + subsurface(0.3)), fog, min(fresnel, 0.2));
        //col = diffuse * albedo;
        col = mix(fog, col, exp(-0.002 * t * t));
    }

    frag_color = vec4(pow(col + glow * 0.2 + glow2 * mix(vec3(1.0, 0.5, 0.0), vec3(0.9, 0.3, 0.1), 0.5 + 0.5 * sin(pos3.y * 3.0)) , vec3(0.45)), 1.0);
}


void main(void)
{
    main_image(out_color, position_out * i_resolution.xy);
}
