/* 
    This is really just me trying to follow along a nusan stream...
*/

#version 330 core 

const int MAX_RAYMARCH_STEPS = 100;
//const float MAX_RAYMARCH_DENOM = (float) (MAX_RAYMARCH_STEPS + 1.0);
const float MIN_RAYMARCH_DIST = 0.001;

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

// repeats 
vec3 repeat(vec3 p, vec3 s) 
{
    return (fract(p / s - 0.5) - 0.5) * s;
}
vec2 repeat(vec2 p, vec2 s)
{
    return (fract(p/s - 0.5) - 0.5) * s;
}
float repeat(float p, float s) 
{
    return (fract(p/s - 0.5) - 0.5) * s;
}


// math functions
mat2 rot(float a) 
{
    float ca = cos(a);
    float sa = sin(a);
    
    return mat2(ca, sa, -sa, ca);
}


// shapes 
float cylinder(vec2 p, float s)
{
    return length(p) - s;
}
float sphere(vec3 p, float s)
{
    return length(p) - s;
}
float box(vec3 p, vec3 s)
{
    p = abs(p) - s;
    return max(p.x, max(p.y, p.z));
}

// Compute interior of tunnel
vec3 tunnel(vec3 p)
{
    vec3 offset = vec3(0.0);
    float dd = p.z + i_time;

    // controls the curvature of the tunnel in x and y
    offset.x += 6.0 * sin(dd * 0.1); 
    offset.y += 2.0 * cos(dd * 0.01 + 0.5); 

    return offset;
}

// Scene entry point
float map(vec3 p)
{
    vec3 tunnel_point = p;
    tunnel_point += tunnel(tunnel_point);

    // returning the inverse of this shape puts us "inside" it
    float idist = -cylinder(tunnel_point.xy, 12.0);
    vec3 ipoint = repeat(tunnel_point, vec3(2.0));        // interior point

    // let d be the final distance for this ray
    float d;
    d = max(idist, -sphere(ipoint, 1.2));

    // cylinders 
    vec3 pc = tunnel_point;
    pc.xy *= rot(pc.z * -0.04);
    pc.x = abs(pc.x) - 3.0;
    pc.z = repeat(pc.z, 10.0);
    // add turns to cylinder position
    pc.x += 2.0 * sin(pc.y * 0.40);
    pc.z += 1.2 * cos(pc.z * 0.4);

    // change these into polar coords
    vec3 pp = tunnel_point;
    pp.x = atan(tunnel_point.y, tunnel_point.x) * 10.0 / 3.141592;
    pp.y = length(tunnel_point.xy) - 10.0;
    pp.xz = repeat(pp.xz, vec2(5.0, 6.0));

    d = min(d, box(pp, vec3(1.0)));

    d = min(d, cylinder(pc.xz, 0.5));

    return d;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    vec3 s = vec3(0.0, 1.0, -20.0);
    vec3 t = vec3(0.0, 0.0, 0.0);
    
    // compute the target position for the camera 
    float advance = i_time * 8.0;
    s.z += advance;
    t.z += advance;
    s -= tunnel(s);
    t -= tunnel(t);

    // now compute the ray direction 
    vec3 cz = normalize(t - s);         // ray direction towards  the target from the starting point
    vec3 cx = normalize(cross(cz, vec3(0.0, 1.0, 0.0)));
    vec3 cy = normalize(cross(cz, cx));

    float fov = 1.0;
    vec3 r = normalize(cx * uv.x + cy * uv.y + cz * fov);

    // ray march / path trace loop
    vec3 p = s;
    int i = 0;

    for(i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        float d = map(p);
        if(d < MIN_RAYMARCH_DIST)
            break;
        p += r * d;
    }

    vec3 col = vec3(0.0); 
    col += pow(1.0 - i / 101.0, 8.0);

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
