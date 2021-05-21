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





float map(vec3 p)
{
    return length(p) - 5.0;
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = vec2(frag_coord.x / i_resolution.x, frag_coord.y / i_resolution.y);
    //uv -= 0.5;
    uv /= vec2(i_resolution.y / i_resolution.x, 1.0);

    vec3 s = vec3(0.0, 0.0, -10.0);
    vec3 r = normalize(vec3(-uv, 1.0));

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

    // normalize pixel co-ords (from 0 to 1)
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
