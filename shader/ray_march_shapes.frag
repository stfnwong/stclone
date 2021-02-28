/* 
    Ray march a box
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURFACE_DIST 0.01


// ======= SHAPES ======== //
// Distance function for a sphere at (0, 1, 6)
float sphere(vec3 p)
{
    vec4 sphere = vec4(0.0, 1.0, 6.0, 1.0);
    float ds = length(p - sphere.xyz) - sphere.w;
    float dp = p.y;
    float d = min(ds, dp);      // for these distance functions we always take the closest point in the scene

    return d;
}

// a box
float box(vec3 p, vec3 s)
{
    p = abs(p) - s;
    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

// capsule from a point a -> b with radius r
float capsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 ab = b - a;
    vec3 ap = p - a;

    float t = dot(ab, ap) / dot(ab, ab);
    t = clamp(t, 0.0, 1.0);

    vec3 c = a + t  * ab;

    return length(p - c) - r;
}

// Call the distance function for the shape we are interested in
// we need all this stuff for the capsule
float get_dist(vec3 p)
{
    // plane params 
    float plane_dist = p.y;
    // capsule params 
    vec3 a = vec3(0.0, 1.0, 6.0);
    vec3 b = vec3(1.0, 2.0, 6.0);
    float r = 0.5;

    float cap_dist =  capsule(p, a, b, r);
    return min(cap_dist, plane_dist);
}



// compute normal by sampling two points and finding slope
vec3 get_normal(vec3 p)
{
    float d = get_dist(p);      // find dist at point p
    vec2 e = vec2(0.01, 0.0);
    // sample from a point e near to p
    vec3 n = d - vec3(get_dist(p-e.xyy), get_dist(p-e.yxy), get_dist(p - e.yyx));
    
    return normalize(n);
}

/* 
    RAY MARCH INNER LOOP 
*/
float ray_march(vec3 ro, vec3 rd)
{
    float d_origin = 0.0;         // initial distance
    
    for(int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 p = ro + d_origin * rd;
        float ds = get_dist(p);         // find the distance to the scene from point p
        d_origin += ds;
        if(ds < SURFACE_DIST || d_origin > MAX_DIST)
            break;
    }

    return d_origin;          // distance to intersection point we found 
}


float get_light(vec3 p)
{
    vec3 light_pos = vec3(0, 5.0, 6.0);     // where the light comes from in the scene
   
    // move the light
    light_pos.xz += vec2(sin(i_time), cos(i_time));

    vec3 l = normalize(light_pos - p);      
    vec3 n = get_normal(p);

    float diff = clamp(dot(n, l), 0.0, 1.0);
    // find shadow by casting another ray from just above the plane 
    // towards the light
    float d_light = ray_march(p + n * SURFACE_DIST, l);
    if(d_light < length(light_pos - p))
        diff *= 0.1;

    return diff;
}




void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = (frag_coord - 0.5 * i_resolution.xy) / i_resolution.y;
    vec3 col = vec3(0);

    // setup camera position
    vec3 ro = vec3(0.0, 1.0, 0.0);
    vec3 rd = normalize(vec3(uv.x, uv.y, 1.0));

    float d = ray_march(ro, rd);

    vec3 p = ro + rd * d;       // find the point we want to light 
    float diff = get_light(p);

    d /= 8.0;

    col = vec3(diff);
    //col = get_normal(p);

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
