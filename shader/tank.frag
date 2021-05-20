/*
Some fucking thing 

*/

#version 330 core 

const int MAX_RAYMARCH_STEPS = 100;
const float MIN_RAYMARCH_DIST = 0.001;

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

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

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

// illusion
vec3 repeat(vec3 p, vec3 s) 
{
    return (fract(p / s - 0.5) - 0.5) * s;
}

float repeat(float p, float s) 
{
    return (fract(p/s - 0.5) - 0.5) * s;
}

// area 
vec3 tunnel(vec3 p)
{
    vec3 offset = vec3(0.0);
    float dd = p.z * 0.02;
    dd = floor(dd) + smoothstep(0.0, 1.0, smoothstep(0.0, 1.0, fract(dd)));
    //dd *= 1.7;
    offset.x += 5.0 * sin(dd * 2.2 + 2.4) + 1.2 * cos(6.2 * dd + 2.2);
    offset.y += 4.0 * cos(dd * 2.75) + 0.2 * sin(dd * 8.25);
    //offset.x += 8.0 * sin(dd * 2.2 + 4.4) * cos(2.2 * dd + 2.2);
    //offset.y += 4.0 * cos(dd * 0.75 + 2.25);

    return offset;
}

// distance field 
float map(vec3 p) 
{
    vec3 p2 = p;

    // tunnel interior
    p2.z += i_time * 0.02;
    p2 += tunnel(p2);

    float d2 = -cylinder(p2.xy, 10.0);
    // s parameter to repeat() is sort of like distance between repeats?
    vec3 p3 = repeat(p2, vec3(2.0));

    // if the sphere term is positive here then we create spheres whose size
    // are equal to the size of the second argument. If the sphere term is
    // negative then we cut spheres from the "tunnel" by the radius 
    d2 = max(d2, -sphere(p3, 1.2));

    // other things...?
    vec3 p4 = p2;
    p4.xy *= rot(p4.z * 0.1);
    p4.x = abs(p4.x) - 4.0;
    p4.x += 2.3 * sin(p4.y * 0.32);
    p4.z = repeat(p4.z, 10.0);      // repeat distance of cylinders

    return min(cylinder(p4.xz, 0.5), d2);
    //return min(d2, cylinder(p4.xz, 0.3));
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    vec2 uv = frag_coord / i_resolution.xy;
    uv -= 0.125;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    vec3 s = vec3(0, 0, 4);   
    vec3 t = vec3(0.0);

    float advance = i_time * 12.0;
    s.z -= advance;
    t.z -= advance;
    s -= 0.75 * tunnel(s);
    t -= tunnel(t);

    // normalization constants 
    vec3 cz = normalize(t - s);
    vec3 cx = normalize(cross(cz, vec3(0, 1, 0)));
    vec3 cy = normalize(cross(cz, cx));

    float fov = 1.1;
    vec3 r = normalize(cx * uv.x + cy * uv.y + cz * fov);

    // set up renderer 
    vec3 p = s;
	//p += i_time * vec3(0.0, 0.0, 10.0);     // TODO: more sophisticated path than just a line
    int i = 0;

    for(i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        float d = map(p);      

        if(d < MIN_RAYMARCH_DIST)
            break;

        p += r * d;         
    }
    vec3 col = vec3(0.0);
    col += pow(1.0 - i / 101.0, 6.0);
    
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
