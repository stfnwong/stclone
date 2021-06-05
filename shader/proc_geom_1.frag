/* 
    Trying out some new procedural geometry ideals 
*/


#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


#define MAX_RAYMARCH_STEPS 128
#define MIN_RAYMARCH_DIST 0.0001
#define MAX_RAYMARCH_DIST 40.0          // aka: far dist



float t;        // distance param
vec2 scene_dist;
vec2 eps = vec2(0.000035, -0.000035);

float mod_time;

vec3 po;        // ray position
vec3 no;        // normal to scene
vec3 np;
float st;

// lights  
vec3 light_dir;
float glow, glow2;

// positions
vec3 base_pos;
vec3 new_pos;
vec3 prev_pos;

// colors 
vec3 albedo;            // albedo base color
vec3 fog;
vec3 col;

// accent for lights
#define laccent(d) clamp(map(po + no * d).x / d, 0.0, 1.0)
// smoothing for lights 
#define lsmooth(d) smoothstep(0.0, 1.0, map(po + light_dir * d).x / d)

// ======== PRIMITIVES ======== //
float box(vec3 p, vec3 r)
{
    p = abs(p) - r;
    return max(max(p.x, p.y), p.z);
}

mat2 rotate(float r)
{
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

// ==== Component ==== // 
vec2 geom(vec3 p, float m)      // m - material 
{
    // this implementation is cheating - I am re-using stuff from evvvvil to try something out 
    vec2 h, t = vec2(box(p, vec3(4.0, 0.5, 0.5)), 5.0);
    t.x = min(box(abs(p) - vec3(3.0, 0.0, 0.0), vec3(0.8, 0.5, 100.0)), t.x);
    h = vec2(box(p, vec3(5.2, 0.7, 0.2)), 3.0);
    h.x = min(box(abs(p) - vec3(3.0, 0.0, 0.0), vec3(1.0, 0.2, 100.0)), h.x);
    h.x = min(length(abs(p) - vec3(7.0, 0.0, 0.0)) - 1.2, h.x);

    t = (t.x < h.x) ? t : h;        
    h = vec2(box(p + vec3(0.0, 0.4, 0.0), vec3(5.4, 0.4, 3.4)), m);
    h.x = max(h.x, -(length(p) - 2.5));
    t = (t.x < h.x) ? t : h;        
    t.x *= 0.8;

    return t;
}


vec2 map(in vec3 p)
{
    vec2 h, t = vec2(10000.0, 0.0);
    prev_pos = p;
    base_pos = p;

    // do some rotations
    for(int i = 0; i < 4; ++i)
    {
        prev_pos.xy *= rotate(1.57 * st);     // 
        prev_pos.xyz = abs(prev_pos.xyz) - mix(vec3(0.0, 3.0, 6.0), vec3(0.0, 10.0, 2.0), st);
        prev_pos *= 1.4;
        prev_pos.xz *= rotate(0.785 * (1.0 - st));
        t = (t.x < h.x) ? t : h;
    }

    t = geom(p, 2.0);
    np = prev_pos.xyz;
    p.xy *= rotate(cos(p.z * 1.4 * mod_time * 10.0) * 0.5 * mod_time * 5.0);
    h = vec2(length(p - vec3(cos(p.z * 24) * 0.05 + cos(p.x), 0.0, 0.0)) - 5.0 * st, 6.0);
    h.x *= 0.5;
    t = (t.x < h.x) ? t : h;

    return t;
}


vec2 trace(in vec3 ro, in vec3 rd)
{
    // near plane 
    vec2 h = vec2(0.1);
    vec2 t = vec2(0.1);

    for(int i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        h = map(ro + rd * t.x);     
        if(h.x < MIN_RAYMARCH_DIST || t.x > MAX_RAYMARCH_DIST)
            break;
        t.x += h.x;
        t.y += h.y;
        if(t.x > MAX_RAYMARCH_DIST)
            t.y = 0.0;
    }

    return t;
}


// TODO : find out how many bytes are used for each thing. Eg, how many bytes 
// required to do a function call, how each declaration compiles, etc
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    mod_time = mod(i_time, 62.8318);

    // ray position 
    vec3 ro = vec3(20.0, 1.0, cos(mod_time) * 10.0); 
    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    // ray direction 
    vec3 rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    scene_dist = trace(ro, rd);
    t = scene_dist.x;

    col = vec3(0.1, 0.2, 0.3) - length(uv) * 0.1 * rd.y * 2.0;
    fog = col * 1.2;

    if(t > 0)
    {
        po = ro + rd * t;
        no = normalize(
            eps.xyy * map(po + eps.xyy).x + 
            eps.yyx * map(po + eps.yxy).x + 
            eps.yxy * map(po + eps.yxy).x + 
            eps.xxx * map(po + eps.xxx).x
        );

        albedo        = mix(vec3(0.1, 0.2, 0.4), vec3(0.1, 0.4, 0.77), 0.5 + 0.5 * sin(base_pos.y * 6.9));
        float diffuse = max(0.0, dot(no, light_dir));
        float fresnel = pow(1.0 + dot(no, rd), 4.0);
        float spec    = pow(max(dot(reflect(-light_dir, no), -rd), 0.0), 40.0);
        col = mix(spec + mix(vec3(0.8), vec3(1.0), abs(rd)) * albedo * (diffuse + lsmooth(2.0)), fog, min(fresnel, 0.2));                
        col = mix(fog, col, exp(-0.0003 * t * t * t));          // soften with fog
    }

    vec3 final_col = pow(col + glow * 2.0 + glow2 * mix(vec3(1.0, 0.5, 0.0), vec3(0.9, 0.3, 0.1), 0.5 + 0.5 * sin(base_pos.y * 3.0)), vec3(0.55));

    frag_color = vec4(final_col, 1.0);
    //frag_color = vec4(vec3(scene_dist.x, scene_dist.y, 1.0), 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
