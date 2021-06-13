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
const float MIN_TRACE_DIST  = 0.001;
const float MAX_TRACE_DIST  = 60.0;
// time
float mod_time;
// lighting
vec3 rd, ray_pos, norm;
// color 
vec3 col, fog, light_dir, albedo;
float diffuse, fresnel, specular;
// geom
vec3 pos2, pos3;
float attr = 0;

// artifact killah
vec2 eps = vec2(0.00003, -0.00003);


// ======== PRIMITIVES ======== //
float box(vec3 p, vec3 r)
{
    p = abs(p) - r;
    return max(max(p.x, p.y), p.z);
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
#define MAT1 5
#define MAT2 6
#define MAT3 7


vec2 geom(vec3 p)
{
    //vec2 t = vec2(box(abs(p) - vec3(2.0, 0.0, 0.0), vec3(1.0)), MAT1);
    vec2 t = vec2(box(p, vec3(4, 1, 3)), MAT2);
    t.x = max(t.x, -(length(p) - 2.5));         // this places a hole in the box base 
    t.x = max(abs(t.x) - 0.2, (p.y - 0.4));     // onion trick + cuts a horizontal plane through box

    vec2 h = vec2(box(p, vec3(5, 1, 3)), MAT2);      // new box with new material id
    h.x = max(h.x, - (length(p) - 2.5));        // cut another hole in this box 
    h.x = max(abs(h.x) - 0.1, (p.y - 0.5));     // another onion trick cut

    // merge and retain material id 
    t = t.x < h.x ? t : h;

    // another box - in the original this had the material id passed in         
    h = vec2(box(p + vec3(0.0, 0.4, 0.0), vec3(5.4, 0.4, 3.4)), MAT2);
    h.x = max(h.x, -(length(p) - 2.5));     // diggng more holes into geom
    t = t.x < h.x ? t : h;      // merge again

    // stick a ball in it broski
    h = vec2(length(p) - 2.0, MAT1);
    t = (t.x < h.x) ? t : h;
    
    t.x *= 0.6;

    return t;
}


vec3 p1, p2, p3;
float anim1, anim2;

// until the geometry is right, we don't do any positional transforms
vec2 map(vec3 p)
{
    pos2 = p;
    pos2.yz = p.yz *= rotate(sin(pos2.x * 0.3 - mod_time * 0.5) * 0.4);

    // this var is used for animating various things 
    anim1 = sin(pos2.x * 0.2 * mod_time);
    anim2 = cos(pos2.x * 0.2 * mod_time);
    p.x = mod(p.x - mod_time * 4.0, 20) - 10.0;      // mod along z axis

    vec2 t = geom(p);
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
vec4 c = vec4(-1.0, 8.0, -10.0, 0.0);

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
    //vec3 ro = vec3(18.0, 6.0, 5.0 - cos(0.24 * mod_time) * 10.0); 
    vec3 ro = vec3(cos(mod_time * c.w + c.x) * c.z, c.y, sin(mod_time * c.w + c.x) * c.z);

    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    col = fog = vec3(0.1) - length(uv) * 0.1;
    light_dir = normalize(vec3(0.2, 0.5, -0.5));
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
    //vec3 bg_col_1 = vec3(0.2, 0.5, blue_component);    
    //vec3 bg_col_2 = vec3(0.5, 0.0, 0.7);
    //vec3 bg_col_3 = vec3(0.4, 0.5, 0.77);
                
        albedo = vec3(0.25, 0.56, 0.2);
        if(z.y > MAT1)
            albedo = vec3(0.4, 0.3, 0.7);
        if(z.y > MAT2)
            albedo = vec3(0.2, 0.5, 0.75);
        diffuse = max(0.0, dot(norm, light_dir));
        fresnel = pow(1.0 + dot(norm, rd), 4.0);
        specular = pow(max(dot(reflect(light_dir, norm), rd), 0.0), 40.0);
        col = mix(specular + albedo * (ambient(0.1) + 0.2) * (diffuse + subsurface(0.2)), fog, min(fresnel, 0.2));
        //col = diffuse * albedo;
    }

    frag_color = vec4(pow(col, vec3(0.45)), 1.0);
}


void main(void)
{
    main_image(out_color, position_out * i_resolution.xy);
}
