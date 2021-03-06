/*
    Another warp
*/


#version 330 core 

#define PI 3.14159265359

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;



vec3 warp2(vec2 uv)
{
    float l;

    for(int i = 0; i < 8; ++i)
    {
        l = length(vec2(uv.x, uv.y));
        
        uv.x = uv.x - cos(uv.y + sin(l)) + cos(i_time / 7.7);
        uv.y = uv.y + sin(uv.x + cos(l)) + sin(i_time / 5.1);
    }

    return vec3(uv, l);
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = 6.0 * frag_coord.xy / i_resolution;
    // warp2 color mix 
    vec3 uv_c = warp2(uv);
    vec3 col_motion = vec3(cos(uv_c.z), -0.5 * sin(uv_c.z), cos(uv_c.z));
    vec3 col = pow(0.18 * cos(uv_c.x) + sin(uv_c.y), 2.2) * vec3(0.17, 0.43, 0.7);
    
    frag_color = vec4(col_motion * col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
