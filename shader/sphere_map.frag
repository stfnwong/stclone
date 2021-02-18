/*
Some map of spheres
This is taken from various live shader videos, its not fully original work
*/


#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


mat2 rotate(float a)
{
    float ca = cos(a);
    float sa = sin(a);

    return mat2(ca, sa, -sa, ca);
}


float map(vec3 p)
{
    return length(p) - 1;
}



void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    float ar = i_resolution.x / i_resolution.y;
    vec2 uv = frag_coord / i_resolution.xy;

    //vec2 uv = vec2(frag_coord

    // draw a sphere 
    vec3 s = vec3(0, 0, -10);
    vec3 r = normalize(vec3(-uv, 1));

    vec3 p = s;
    int i = 0;
    for(i = 0; i < 128; ++i)
    {
        float d = abs(map(p));      // depth map?
        if(d < 0.0001)
            break;
        p += r * d;         
    }

    vec3 col = vec3(0);
    col += pow(1-i / 101.0, 8);

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
    //mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
