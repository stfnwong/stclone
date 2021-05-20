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
float cyl(vec2 p, float s)
{
    return length(p) - s;
}

float map(vec3 p) 
{
    vec3 p2 = p;
    float dd = p2.z + i_time;
    p2.x += 2.0 * sin(dd * 0.075 + 4.0); 
    p2.y += 4.0 * cos(dd * 0.25 + 0.5);

    return -cyl(p2.xy, 8.0);
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // TODO: something to center the image?
    // normalize pixel co-ords (from 0 to 1)
    vec2 uv = frag_coord / i_resolution.xy;
    uv -= 0.25;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    // draw a sphere 
    vec3 s = vec3(0, 0, -20);
    vec3 r = normalize(vec3(-uv, 4.0));

    // set up renderer 
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
    col += pow(1.0 - i / 101.0, 4.0);
    
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
