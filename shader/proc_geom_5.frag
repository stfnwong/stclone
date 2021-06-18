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

// ======== SCENE ======== //
// material ids 
#define MAT1 3
#define MAT2 5
#define MAT3 6
#define MAT4 7


vec2 geom(vec3 p, float mat_id)
{
    vec2 t, h;

    //t = vec2(box(abs(p) - vec3(0, 1, 0), vec3(0.0, -0.0, -0.0)), mat_id);
    t = vec2(box(abs(p) + vec3(0.5, 0.5, 0.5), vec3(1, 1, 1)), mat_id);
    t.x = max(t.x, -box(p, vec3(0.5, 0.1, 0.1)));

    return t;
}

vec2 map(vec3 p)
{
    vec2 t = geom(p.xyz, MAT1);         // call this to render geometry alone with no transforms

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
vec4 c = vec4(1.0, -1.0, 2.0, 0.1);

#define ambient(d) clamp(map(ray_pos * norm * d).x / d, 0.0, 1.0)
#define subsurface(d) smoothstep(0.0, 1.0, map(ray_pos + light_dir * d).x / d)

void main_image(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.2);

    // artifact killah
    mod_time = mod(i_time, 0.5 * 62.8318);
    // ray 
    //vec3 ro = vec3(cos(mod_time * c.w + c.x) * c.z, c.y, sin(mod_time * c.w + c.x) * c.z);
    //vec3 ro = vec3(
    //    //cos(mod_time * c.w + c.x) * c.z, 
    //    cos(0.45 * mod_time) * 3.0 - 4.0,
    //    cos(0.25 * mod_time) * -8.0,
    //    //cos(0.125 * mod_time) * -10.0,
    //    //smoothstep(c.y -30, c.y + 30, mod_time), 
    //    sin(mod_time * c.w + c.x) * c.z
    //);
    vec3 ro = vec3(cos(mod_time * c.w + c.x) * c.z, c.y, sin(mod_time * c.w + c.x) * c.z);
    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    col = fog = vec3(0.01, 0.01, 0.14) - length(uv) * 0.01 - rd.z * 0.2;
    //light_dir = normalize(vec3(-0.2 * cos(mod_time * 0.4), -2.0 * sin(mod_time * 0.25), -0.5));
    light_dir = normalize(vec3(0.2, 0.5, -0.5));
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
        //albedo = vec3(1, 0.5, 0.0);
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
