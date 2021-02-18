/*
    Simple Raytracer 
    This version just does a sphere
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

// ======== PRIMITIVES ======== //

/*
    sphere()
Equation of a sphere centered at some point given by vec4 oc
*/
float sphere(in vec3 ro, in vec3 rd, in vec4 sph)
{
    // |xyz^2| = r^2, and therefore <xyz, xyz> = r^2
    // xyz = ro + t  * rd
    // rewrite as |ro^2| + t^2 + 2<ro, rd>t - r^2 = 0
    // solve resulting qudratic
    //
    // Now we can specify the center of the sphere as an offset from another
    // sphere
    vec3 oc = ro - sph.xyz;
    float b = 2.0 * dot(oc, rd);
    float c = dot(oc, oc) - sph.w * sph.w;
    float h = b * b - 4.0 * c;
    
    if( h < 0.0)
        return -1.0;

    return (-b - sqrt(h)) / 2.0;
}

vec3 sphere_normal(in vec3 pos, in vec4 sphere)
{
    return normalize(pos - sphere.xyz) / sphere.w;
}


/*
    plane()
*/
float plane(in vec3 ro, in vec3 rd)
{
    // y = 0 for a plane, 
    // = r0.y + t * rd.y
    return -ro.y / rd.y;
}

vec3 plane_normal(in vec3 pos)
{
    return vec3(0.0, 1.0, 0.0);
}


// origin sphere 
vec4 origin_sphere = vec4(0.0, 1.5, 0.0, 1.0);

/*
    intersect()
*/
float intersect(in vec3 ro, in vec3 rd, out float t_res)
{
    t_res = 1000.0;
    float id = -1.0;
    float tsphere = sphere(ro, rd, origin_sphere);       // intersect with a sphere
    float tplane = plane(ro, rd);        // intersect with a plane

    if(tsphere > 0.0)
    {
        id = 1.0;
        t_res = tsphere;
    }
    if(tplane > 0.0 && tplane < t_res)
    {
        id = 2.0;
        t_res = tplane;
    }

    return id;
}


// ======== ENTRY POINT ======== //
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec3 light = normalize(vec3(2.0, 1.2, 0.5)) * vec3(1.0 * cos(i_time), 0.25 * sin(i_time), 1.0) ;
    //vec3 light = normalize(vec3(0.555));
    // pixel coords from 0 to 1
    vec2 uv = (2.0 * frag_coord - i_resolution.xy) / i_resolution.y;

    origin_sphere.x = 0.5 * cos(i_time);
    origin_sphere.y = 0.5 * cos(0.25 * i_time);
    origin_sphere.z = 0.5 * sin(i_time);

    // generate a ray with origin ro and direction rd
    //vec2 correction = vec2(1.78, 1.0);
    vec3 ro = vec3(0.0, 1.0, 2.5);
    vec3 rd = normalize(vec3((-1.0 + 2.0 * uv) , -1.0));
    // intersect the ray with the scene
    float t;
    float id = intersect(ro, rd, t);

    // default background is a gradient
    //vec3 col = vec3(uv.x);
    vec3 col = vec3(0.0);
    vec3 pos = ro + t * rd;
    //if(id > 0.0)
    if(id > 0.5 && id < 1.5)        // we hit the sphere
    {
        vec3 nor = sphere_normal(pos, origin_sphere);
        float diffuse = clamp(dot(nor, light), 0.0, 1.0);
        float ambient = 0.5 + 0.5 * nor.y;
        col = vec3(0.12, 0.85, 0.25) * diffuse + ambient * vec3(0.2, 0.3, 0.4);
    }
    else if(id > 1.5)       // we hit the plane
    {
        // we hit the plane
        vec3 nor = plane_normal(pos);
        float diffuse = clamp(dot(nor, light), 0.0, 1.0);
        float ambient = smoothstep(0.0, 2.0 * origin_sphere.w, length(pos.xz - origin_sphere.xz));
        //col = vec3(ambient * 0.777) * vec3(0.5, 0.6, 0.7);
        //col = vec3(1.0, 0.8, 0.6) * diffuse + ambient * vec3(0.3, 0.4, 0.5);
        col = vec3(0.2, 0.55, 0.13) * diffuse + ambient * vec3(0.125, 0.3, 0.5);
        col = col * vec3(0.6);
    }
    //col = sqrt(col);

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
