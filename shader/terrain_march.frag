/*
Terrain Marching test

*/
#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


struct Ray
{
    vec3 origin;
    vec3 d;
};

// Compute normal by central differences method
//vec3 get_normal(const vec3 p)
//{
//    const float eps = 0.01f;
//
//    return normalize( 
//        vec3(height_function(p.x - eps, p.z) - height_function(p.x + eps, p.z),
//            2.0f * eps,
//            height_function(p.x, p.z - eps) - height_function(p.x, p.z + eps)
//        )
//    );
//}

// ======== NOISE FUNCTIONS ======== //
float hash(vec2 v)
{
    return fract(sin(dot(v, vec2(50.2, 7.777)))) * 2500.1;
}

float get_noise(vec2 v)
{
    vec2 root_v = floor(v);
    vec2 f = smoothstep(0.0, 1.0, fract(v));

    vec4 n;
    n.x = hash(root_v);
    n.y = hash(root_v + vec2(0.0, 1.0));
    n.x = hash(root_v + vec2(1.0, 0.0));
    n.w = hash(root_v + vec2(1.0, 1.0));

    n.xy = mix(n.xz, n.yw, f.y);
    
    return mix(n.x, n.y, f.x);
}

/*
    height_function()
    Compute the deformation of the pixel at x,z
*/
float height_function(float x, float z)
{
    return sin(x) * cos(z);
}

//bool cast_ray(const vec3 ro, const vec3 rd, inout float res_t)
//{
//    // ray speed, dist to near clip plane, max ray dist
//    const float dt = 0.01f;          
//    const float min_t = 0.001f; 
//    const float max_y = 10.0f;
//
//    for(float t = min_t; t < max_t; t += dt)
//    {
//        const vec3 p = ro + rd * t;
//        if(p.y < height_function(p.x, p.y))
//        {
//            res_t = t - 0.5f * dt;
//            return true;
//        }
//    }
//
//    return false;
//}

//vec3 get_color(const Ray ray, float t)
//{
//    const vec3 p = ray.origin + ray.d * t;
//    const vec3 n = get_normal(p);
//    const vec3 s = get_shadow(p, n);
//    const vec3 m = get_material(p, n);
//
//    return apply_fog(m * s, t);
//}



// TODO : this is something really simple 
const vec3 cam_pos = vec3(-5.8, -5.35, 12);
const float FOV = 180.0;
const float FD = 40.0;      // depth of field

float noise(vec2 v)
{
    return sin(v.y * 5.0) * 
           cos(v.x * 2.56) * 
           sin(sin(v.y * 2.18) * 
           cos(v.x * 1.16)) / 0.65;
}

float terrain(vec3 cam_pos, vec3 mdir, float depth, float e, float time)
{
    for(int i = 0; i < 255; i++)
    {
        vec3 ptgr = (cam_pos + depth * mdir) + vec3(0, 0, 3);
        vec2 o = vec2(-time, time);
        
        float h  = 1.5 * noise((ptgr.xy + o) * 0.1) / 2.0;
        float b  = h + noise((ptgr.xy + o) * 0.7) / 5.0;
        float w  = clamp(0.5 + 0.5 * (b - h) / 0.3, 0.0, 1.0);
        float sm = mix(b, h, w) - 0.3 * w * (1.0 - w);

        float dist = min(1.0, dot(ptgr, vec3(0.5, 0.5, 0.5)) + sm);

        if(dist < 0.000001)
            return depth;
        
        depth += dist;
        if(depth >= e)
            return e;
    }

    return e;
}

void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 f_coord = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    vec2 scr = vec2(1);
    vec3 f = normalize(vec3(0.25, 1.0, -4.0) - cam_pos + 
             vec3(cos(i_time) / 2.0, 
                 -sin(i_time) / 2.0,
                 0.0
             )
    );
    vec3 s = normalize(cross(f, vec3(0.0, 0.0, 1.0)));
    vec3 u = cross(s, f);
    
    //float dist = terrain(cam_pos, 
    //            mat4(vec4(s, 0.0), vec4(u, 0.0), vec4(-f, 0.0), vec4(0.0, 0.0, 0.0, 1.0))
    //          * vec4(normalize(vec3(f_coord - scr / 2.0, -scr.y / tan(radians(73.0 + FOV) / 2.0))), 0.0).xyz, 1.0, 100.0, t * 3.0);
    //float dist = dst(cam_pos, (mat4(vec4(s, 0.0), vec4(u, 0.0), vec4(-f, 0.0), vec4(0.0, 0.0, 0.0, 1.0)) * vec4(normalize(vec3(f_coord - scr / 2.0, -scr.y / tan(radians(73.0 + FOV) / 2.0))), 0.0).xyz, 1.0, 100.0, t * 3.0);

    // TODO : dramatically simplify this expression
	float dist = terrain(cam_pos, (
		mat4(vec4(s, 0.0),vec4(u, 0.0),vec4(-f, 0.0),vec4(0.0, 0.0, 0.0, 1.0))
		*vec4(normalize(vec3(f_coord - scr / 2.0, -scr.y / tan(radians(73.0+FOV) / 2.0))), 0.0)
	).xyz, 1.0, 100.0, i_time*3.0);

    if(dist > 100.0)
    {
        frag_color = vec4(1.0);
    }

    //vec4 ret = vec4(vec4(0.1, 0.1, 0.1, 1.0) - vec4(0.0, 0.0, 0.0, 0.0, smoothstep(0.0, FD, dist))) / 1.0 + (f_coord.y / 3.0);
    vec4 ret = vec4(vec4(0.1,0.1,0.1,1)-vec4(0.0,0.0,0.0,smoothstep(0.0, FD, dist)))/1.0+(f_coord.y/3.0);
    frag_color = vec4(cos(i_time), 0.9 * sin(i_time), 0.9, 1.0) - vec4(vec3(0.2) + ret.rgb * 3.0 * ret.a, 0.0);


    // normalize pixel co-ords (from 0 to 1)
    //float ar = i_resolution.x / i_resolution.y;
    //vec2 uv = frag_coord / i_resolution.xy;

    // Shoot a ray from each pixel in the scene starting at the camera and cast until an
    // intersection point is found.

    //vec2 uv = (2.0 * frag_coord - i_resolution.xy) / i_resolution.x;        // pixel pos 
    //vec3 cam_pos;

    //cam_pos.x = cos(-i_time * CAM_SPEED) * 30.0;
    //cam_pos.y = sin(-i_time * CAM_SPEED) * 30.0;
    //cam_pos.z = get_terrain_noise(cam_pos.xy, 1) + sin(i_time * 0.25);
    //

    //vec3 mb_color = vec3(1.0, 0.5 * sin(i_time), cos(i_time)) * trace_dist_est(ray) * 1.1 + 0.1;

    //frag_color = vec4(mb_color, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
