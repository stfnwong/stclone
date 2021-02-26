/* 
    Ray marching test
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




// Distance function for a sphere at (0, 1, 6)
float get_dist(vec3 p)
{
    vec4 sphere = vec4(0.0, 1.0, 6.0, 1.0);
    float ds = length(p - sphere.xyz) - sphere.w;
    float dp = p.y;
    float d = min(ds, dp);      // for these distance functions we always take the closest point in the scene

    return d;
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


float get_light(vec3 p)
{
    vec3 light_pos = vec3(0, 5.0, 6.0);     // where the light comes from in the scene
    vec3 l = normalize(light_pos - p);      
    vec3 n = get_normal(p);

    return 1.0;         // TODO: finish implementation
}





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

    //col = vec3(diff);
    col = get_normal(p);

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
