/*
MANDLEBULB
A test mandlebuld. This is cobbled together from various places 

Stefan Wong 2020
*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

// constants for this shader
const int MAX = 2;
const float PI = 3.1415927;
const vec3 BG_COLOR = vec3(0.0, 0.0, 0.0);
const float INF = 99999999.0;
vec3 LIGHT_DIRECTION = vec3(0.0, 1.0, 0.5);


struct Sphere
{
    vec3 p;
    float r;
};


struct Ray
{
    vec3 origin;
    vec3 d;
};


Sphere sphere_container[MAX];
int sphere_count = 0;


// compute rotation
mat3 rotation_matrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,          oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y + s,
                oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.z * s, oc * axis.z * axis.z + c
    );
}


// distance estimator for mandlebulb
float mandelbulb_dist_est(vec3 pos)
{
    pos = mod(pos, 4.0) - 2.0;
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;

    const int num_iter = 4;
    float escape_dist = 3.0;
    float power = 8.0;

    for(int i = 0; i < num_iter; ++i)
    {
        r = length(z);
        if(r > escape_dist)
            break;

        // convert to polar coords 
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;

        // scale and rotate point 
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;

        // convert back to cartesian coords 
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += pos * cos(i_time);
    }

    return 0.5 * log(r) * r / dr;
}


float trace_dist_est(Ray ray)
{
    float total_dist = 0.0;
    const int max_ray_steps = 50;
    float min_dist = 0.0005;        // smaller for more steps...
    int steps;

    for(steps = 0; steps < max_ray_steps; ++steps)
    {
        vec3 p = ray.origin + total_dist * ray.d;      // new ray pos 
        float dist = mandelbulb_dist_est(p);
        total_dist += dist;
        if(dist < min_dist)
            break;
    }

    return 1.0 - float(steps) / float(max_ray_steps);
}


float sphere_intersect(Ray ray, Sphere sphere, out vec3 color)
{
    float dx = ray.origin.x - sphere.p.x;
    float dy = ray.origin.y - sphere.p.y;
    float dz = ray.origin.z - sphere.p.z;

    // solve quadratic
    float a = ray.d.x * ray.d.x + ray.d.y * ray.d.y + ray.d.z * ray.d.z;
    float b = 2.0 * (ray.d.x * dx + ray.d.y * dy + ray.d.z * dz);
    float c = dx * dx + dy * dy + dz * dx - sphere.r * sphere.r;
    float d = b * b - 4.0 * a * c;

    if(d > 0.0)
    {
        float t0 = (-b + sqrt(d)) / 2.0;
        float t1 = (-b - sqrt(d)) / 2.0;
        float t = max(t0, t1);
        vec3 ip = ray.origin + ray.d * t;
        vec3 normal = normalize(ip - sphere.p);

        vec3 sphere_color = vec3(1.0, 1.0, 0.0);
        color = clamp(vec3(sphere_color) * dot(normal, LIGHT_DIRECTION * 0.25 * cos(i_time)), vec3(0.0), vec3(1.0));
        color += sphere_color * vec3(0.1);

        return t;
    }

    return INF;
}

// TODO : get rid of this setup (just have a single mandelbulb)
void setup_scene(void)
{
    Sphere sphere0;
    
    sphere0.p  = vec3(0.0, 0.0, 0.0);
    sphere0.r = 1.0;

    sphere_container[0] = sphere0;
    sphere_count = 1;
    LIGHT_DIRECTION.x = sin(i_time);
    LIGHT_DIRECTION.y = cos(i_time);
}


Ray get_ray(vec2 uv)
{
    Ray ray;
    
    mat3 rot = rotation_matrix(vec3(0.0, 1.0, 1.0), i_time / 5.0);
    vec3 ro = vec3(i_time, i_time / 2.0, i_time * 2.0);     // rotate around based on clock tick...
    
    ray.origin = ro;
    ray.d = normalize(vec3(1.0, uv)); 

    return ray;
}


vec3 trace(Ray ray)
{
    vec3 closest_color = BG_COLOR;
    float closest_dist = INF;

    //for(int i = 0; i < sphere_count; ++i)
    //{
    //    vec3 current_color;
    //    float current_dist = sphere_intersect(ray, sphere_container[i], current_color);
    //    if(closest_dist > current_dist)
    //    {
    //        closest_dist = current_dist;
    //        closest_color = current_color;
    //    }
    //}

    vec3 current_color;
    float current_dist = sphere_intersect(ray, sphere_container[0], current_color);
    if(closest_dist > current_dist)
    {
        closest_dist = current_dist;
        closest_color = current_color;
    }

    return closest_color;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    float ar = i_resolution.x / i_resolution.y;
    vec2 uv = frag_coord / i_resolution.xy;

    setup_scene();
    
    vec3 color_sum = vec3(0.0, 0.0, 0.0);
    float kernel_size = 2.0;

    for(float x = 0.0; x < kernel_size; ++x)
    {
        for(float y = 0.0; y < kernel_size; ++y)
        {
            vec2 ruv = uv + vec2(x / kernel_size, y / kernel_size) / i_resolution.xy;
            Ray ray = get_ray(ruv);
            color_sum += trace(ray);
        }
    }
    color_sum = color_sum / kernel_size * kernel_size;
    
    Ray ray = get_ray(uv);
    vec3 mb_color = vec3(1.0, 0.5 * sin(i_time), cos(i_time)) * trace_dist_est(ray) * 1.1 + 0.1;

    frag_color = vec4(mb_color, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
