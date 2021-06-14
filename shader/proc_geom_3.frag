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
float diffuse, fresnel, specular, glow, glow2;
// geom
vec3 pos2, pos3;
float attr = 0;
// animation
float anim1, anim2;

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
#define MAT1 3
#define MAT2 5
#define MAT3 7

vec2 geom(vec3 p, float mat_id)
{
    p.y += anim1 * 0.05;            // this var animates colors?
    vec2 t = vec2(box(p, vec3(5, 1, 3)), MAT1);  // box base 
    t.x = max(abs(t.x), -length(p) - 2.5);      // hole in box 
    t.x = max(abs(t.x) - 0.2, (p.y - 0.4));
    vec2 h = vec2(box(p, vec3(5,1,3)), MAT2);
    h.x = max(h.x, -length(p) - 2.5);
    h.x = max(abs(h.x) - 0.1, (p.y - 0.5));
    t = (t.x < h.x) ? t : h;        // geom merge

    // another box with a new material 
    h = vec2(box(p + vec3(0, 0.4, 0), vec3(5.4, 0.4, 3.4)), mat_id);
    h.x = max(h.x, -(length(p) - 2.5));
    
    t = (t.x < h.x) ? t : h;        // geom merge
    //h = vec2(length(p) - 2.0, mat_id);      // sphere
    //t = (t.x < h.x) ? t : h;        // geom merge
    t.x *= 0.7;

    return t;
}

vec2 map(vec3 p)
{
    pos2 = pos3 = p;
    pos3.yz = p.yz * rotate(sin(pos2.x * 0.2 - mod_time * 0.5) * 0.4);

    p.zx *= rotate(2.57); 
    p.yz *= rotate(1.57); 
    anim1 = sin(pos2.x * 0.8 * mod_time);
    anim2 = cos(pos2.x * 0.2 * mod_time);

    p.x = mod(p.x - mod_time * 0.2, 10.0) - 5.0;        // mod along x
    //p.z =  
    // this is the trick where we use the w component of a vec4 to track scale changes in the fractal
    vec4 new_pos = vec4(p * 0.3, 0.3);

    for(int i = 0; i < 3; ++i)
    {
        new_pos.xyz = abs(new_pos.xyz) - vec3(1, 1.2, 0);
        new_pos.xyz = 2.0 * clamp(new_pos.xyz, -vec3(0), vec3(4, 0, -2.3 + anim2)) - new_pos.xyz;
        //new_pos.zy *= 0.2 * sin(0.44 * mod_time) * rotate(p.z);
        new_pos = new_pos * (1.3) / clamp(dot(new_pos.xyz, new_pos.xyz), 0.1, 0.82);        // clamp and scale
    }

    //vec2 t = geom(p.xyz, MAT3);         // call this to render geometry alone with no transforms
    vec2 t = geom(abs(new_pos.xyz) - vec3(2,0,0), MAT2);         // call this to render geometry alone with no transforms
    t.x /= new_pos.w;
    t.x = max(t.x, box(p, vec3(5, 5, 10)));     // clip fractal into a box
    new_pos *= 0.5;
    new_pos.yz *= rotate(0.785);
    new_pos.yz += 2.5;

    vec2 h = geom(abs(new_pos.xyz) - vec3(0, 4.5, 0), MAT3);
    h.x = max(h.x, -box(p, vec3(20, 4, 4)));        // remove inside of large fractal
    h.x /= new_pos.w * 1.5;
    glow2 += 0.01 / (0.1 * h.x * h.x *  (1000.0 - anim2 * 998.0));
    t = (t.x < h.x) ? t : h;

    h = vec2(0.6 * pos3.y + sin(p.y * 5.0) * 0.03, MAT3);
    t = (t.x < h.x) ? t : h;
    h = vec2(length(cos(pos3.xyz * 0.6 + vec3(mod_time, mod_time, 0))) + 0.003, MAT3);
    glow += 0.1 / (0.1 * h.x * h.x * 2000.0);
    t = (t.x < h.x) ? t : h;
    
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
vec4 c = vec4(2.0, 3.0, -8.0, 0.12);

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
    vec3 ro = vec3(cos(mod_time * c.w + c.x) * c.z, c.y, sin(mod_time * c.w + c.x) * c.z);
    // camera 
    vec3 cw = normalize(vec3(0.0) - ro);
    vec3 cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3 cv = normalize(cross(cu, cw));

    rd = mat3(cu, cv, cw) * normalize(vec3(uv, 0.5));

    col = fog = vec3(0.1, 0.1, 0.6) - length(uv) * 0.1 - rd.y * 0.2;
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
        albedo = vec3(0.55, 0.56, 0.1);
        if(z.y > MAT1)
            albedo = vec3(0.6, 0.3, 0.7);
        if(z.y > MAT2)
            albedo = vec3(0.2, 0.5, 0.75);
        if(z.y >= MAT3)
            albedo = mix(vec3(0.5, 0.5, 0.7), vec3(0.9, 0.3, 0.7), 0.5 + 0.5 * sin(pos3.y * 7.0));
        diffuse = max(0.0, dot(norm, light_dir));
        fresnel = pow(1.0 + dot(norm, rd), 4.0);
        specular = pow(max(dot(reflect(light_dir, norm), rd), 0.0), 40.0);
        col = mix(specular + mix(vec3(0.8), vec3(1.0), abs(rd)) * albedo * (ambient(0.1) + 0.2) * (diffuse + subsurface(0.2)), fog, min(fresnel, 0.2));
        //col = diffuse * albedo;
        col = mix(fog, col, exp(-0.003 * t * t *t ));
    }

    frag_color = vec4(pow(col + glow * 0.2 + glow2 * mix(vec3(1.0, 0.5, 0.0), vec3(0.9, 0.3, 0.1), 0.5 + 0.5 * sin(pos3.y * 3.0)) , vec3(0.45)), 1.0);
}


void main(void)
{
    main_image(out_color, position_out * i_resolution.xy);
}
