/*
    There is no sense in which this is a tank
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


// ======== SHAPES ======== //
float cylinder(vec2 p, float s)
{
    return length(p) - s;
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float box(vec3 p, vec3 s)
{
    p = abs(p) - s;
    return max(p.x, max(p.y, p.z));
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

    return offset;
}

// Lighting globals 
vec3 light_pos = vec3(4.0, 0.0, -12.0); //-12.0);
float light = 0.0;

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

    // light 
    p2.z = repeat(p.z, 67.0);
    vec3 relative_pos = light_pos - p;
    float dl = length(relative_pos) - 0.5;
    light += 1.0 / (0.2 + dl * dl);

    d2 = min(d2, dl);
    d2 = min(d2, max(-relative_pos.y, length(relative_pos.xz) - 0.3));


    // draw a sphere at light_pos ?
   
    // alternative tunnel interiors
    //float cc = abs(cylinder(p.xy, 11.1)) - 2.0;
    //cc = max(cc ,abs(d2) - 1.0);
    //d2 = min(d2, cc);

    // other things...?
    vec3 p4 = p2;
    p4.xy *= rot(p4.z * 0.1);
    p4.x = abs(p4.x) - 4.0;
    p4.x += 2.3 * sin(p4.y * 0.32);
    p4.z = repeat(p4.z, 10.0);      // repeat distance of cylinders

    return min(cylinder(p4.xz, 0.5), d2);
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    vec2 uv = frag_coord / i_resolution.xy;
    uv -= 0.125;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    vec3 s = vec3(0, 0, 4);   
    vec3 t = vec3(0.0, 0.0, 0.4);

    float advance = i_time * 12.0;
    s.z -= advance;
    t.z -= advance;
    //s -= 1.75 * tunnel(s);
    s -= tunnel(s);
    t -= tunnel(t);

    // normalization constants 
    vec3 cz = normalize(t - s);
    vec3 cx = normalize(cross(cz, vec3(0, 1, 0)));
    vec3 cy = normalize(cross(cz, cx));

    float fov = 1.1;
    vec3 r = normalize(cx * uv.x + cy * uv.y + cz * fov);
    vec2 offset = vec2(0, 0.01);

    // set up renderer 
    vec3 p = s;
    int i = 0;
    float dd = 0;

    for(i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        float d = map(p);      
        if(d < MIN_RAYMARCH_DIST)
            break;

        p += r * d;         
        dd += d;
    }

    // this isn't quite the update that I wanted...
    //light_pos.z -= advance - 0.5 - tunnel(p).z;
    //light_pos -= tunnel(p) + 2.0;
    //light_pos.z -= advance - 0.5 - tunnel(p).x;

    light_pos.z -= advance;
    light_pos -= tunnel(light_pos);

    // adjust lighting 
    vec3 n = normalize(map(p) - vec3(map(p - offset.xyy), map(p - offset.yxy), map(p - offset.yyx)));
    //light_pos.z -= advance;
    //light_pos -= tunnel(light_pos);

    //vec3 light_pos_2 = light_pos;
    //light_pos_2 -= tunnel(light_pos_2) * 0.4;
    vec3 pl = p;
    pl.z = repeat(pl.z, 67.0);
    vec3 l = normalize(light_pos - p);

    float ao = clamp(map(p + n), 0.0, 1.0);
    
    vec3 light_color = vec3(1.0, 0.75, 0.22);
    vec3 fog_color = vec3(0.6, 0.6, 0.7);
    //vec3 fog_color = vec3(0.43, 0.25, 0.31);

    float fog = 12.0 / (1.0 + length(light_pos - pl));
    vec3 col = vec3(0.0);
    col += (dot(n, l) * 0.5 + 0.5) * fog * fog_color * ao;
    col += light * light_color;
    
    // gamma correct
    col += pow(dd * 0.007, 2.0);
    col *= 1.2 - length(uv);
    col = 1.0 - exp(-col * 2.2);

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
