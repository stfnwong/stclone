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

// area 
vec3 tunnel(vec3 p)
{
    vec3 offset = vec3(0.0);
    float dd = p.z + i_time;
    offset.x += sin(dd * 0.125 + 4.0);
    offset.y += cos(dd * 0.25);
    //offset.x += 1.0 * sin(dd * 0.075 + 4.0); 
    //offset.y += 1.0 * cos(dd * 0.125); 

    return offset;
}

vec3 tunnel2(vec3 p)
{
    vec3 offset = vec3(0.0);
    float dd = p.z * 0.02;
    //dd = floor(dd) + smoothstep(0.0, 1.0, smoothstep(0.0, 1.0, fract(dd)));
    //dd *= 1.7;
    offset.x += 8.0 * sin(dd * 2.2 - 4.4) * cos(2.2 * dd + 2.2);
    offset.y += 4.0 * cos(dd * 0.75 + 2.25);

    return offset;
}

// distance field 
float map(vec3 p) 
{
    vec3 p2 = p;
    p2.z += i_time * 0.02;
    p2 += tunnel2(p2);

    //float dd = p2.z + i_time;
    //p2.x += 2.0 * sin(dd * 0.075 + 4.0); 
    //p2.y += 2.0 * cos(dd * 0.125); 

    float d2 = -cylinder(p2.xy, 10.0);
    vec3 p3 = repeat(p2, vec3(2.0));

    d2 = max(d2, -sphere(p3, 1.25));
    return d2;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // TODO: something to center the image?
    // normalize pixel co-ords (from 0 to 1)
    vec2 uv = frag_coord / i_resolution.xy;
    uv -= 0.125;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    // draw a sphere 
    vec3 s = vec3(0, 0, -20);
    vec3 r = normalize(vec3(-uv, 4.0));

    //s += tunnel(s);

    // set up renderer 
    vec3 p = s;
	p += i_time * vec3(0.0, 0.0, 10.0);     // TODO: more sophisticated path than just a line
    int i = 0;

    for(i = 0; i < MAX_RAYMARCH_STEPS; ++i)
    {
        float d = map(p);      

        if(d < MIN_RAYMARCH_DIST)
            break;

        p += r * d;         
    }
    vec3 col = vec3(0.0);
    col += pow(1.0 - i / 101.0, 4.0);
    
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
