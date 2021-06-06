/*
    More geom
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
// TODO: const type vs #define? which produces the smallest binary?
const int   MAX_TRACE_STEPS = 128;
const float MIN_TRACE_DIST  = 0.0001;
const float MAX_TRACE_DIST  = 60.0;
// time
float mod_time;
// lighting
vec3 rd, ray_pos, norm;
// color 
vec3 col, fog, light_dir;
vec3 albedo;

vec2 eps = vec2(0.00003, -0.00003);


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

vec2 map(vec3 p)
{
    vec2 t = vec2(length(p) - 2.0, 5);

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
        t.y += h.y;
        
        if(t.x > MAX_TRACE_DIST)
            t.y = 0.0;
    }

    return t;
}



vec4 c = vec4(1.0, 4.0, 10.0, 1.0);

void main_image(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    // artifact killah
    mod_time = mod(i_time, 62.8318);
    // ray 
    //vec3 ro = vec3(18.0, 6.0, 5.0 - cos(0.24 * mod_time) * 10.0); 
    vec3 ro = vec3(cos(mod_time * c.w * c.w) * c.z, c.y, sin(mod_time * c.w * c.x) * c.z);

    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    col = fog = vec3(0.1) - length(uv) * 0.1;
    light_dir = normalize(vec3(0.1, 0.5, -0.5));
    // trace it 
    vec2 z = trace(ro, rd);
    if(z.y > 0)      // gonna make it 
    {
        ray_pos = ro + rd * z.x;
        norm = normalize(
            eps.xyy * map(ray_pos + eps.xyy).x +
            eps.yyx * map(ray_pos + eps.yyx).x +
            eps.yxy * map(ray_pos + eps.yxy).x +
            eps.xxx * map(ray_pos + eps.xxx).x
        );
                
        albedo = vec3(0.44);
        float diffuse = max(0.0, dot(norm, light_dir));
        col = diffuse * albedo;
    }

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    main_image(out_color, position_out * i_resolution.xy);
}
