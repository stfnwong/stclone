/*
    Simple Raytracer 
    This version just does a sphere
*/

#version 330 core 

#define NUM_INTERSECTION_ITERS 64
#define NUM_SHADOW_ITERS 64
#define NUM_ROTATION_ITERS 3
#define NUM_PATHS 32

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

// equation of a sphere centered at the origin
float sphere(in vec3 ro, in vec3 rd)
{
    // |xyz^2| = r^2, and therefore <xyz, xyz> = r^2
    // xyz = ro + t  * rd
    // rewrite as |ro^2| + t^2 + 2<ro, rd>t - r^2 = 0
    // solve resulting qudratic
    float r = 1.0;
    float b = 2.0 * dot(ro, rd);
    float c = dot(ro, ro) - r * r;
    float h = b * b - 4.0 * c;
    
    if( h < 0.0)
        return -1.0;

    return (-b - sqrt(h)) / 2.0;
}

float intersect(in vec3 ro, in vec3 rd)
{
    float t = sphere(ro, rd);       // intersect with a spher
    return t;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // pixel coords from 0 to 1
    vec2 uv = (2.0 * frag_coord - i_resolution.xy) / i_resolution.y;

    // generate a ray with origin ro and direction rd
    vec3 ro = vec3(0.0, 1.0, 3.0);
    vec3 rd = normalize(vec3(-1.0 + 2.0 * uv, -1.0));
    // intersect the ray with the scene
    float id = intersect(ro, rd);

    // default background is a gradient
    vec3 col = vec3(uv.x);
    if(id > 0.0)
    {
        // if we hit something, draw white
        col = vec3(1.0);
    }


    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
