/*
Default fragment shader 
*/

#version 330 core 

in vec2 position_out;
out vec4 out_color;
 
uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


// Copy of default shader in shadertoy
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    vec2 uv = frag_coord / i_resolution.xy;

    // time-varying pixel color 
    vec3 col = 0.5 + 0.5 * cos(i_time + uv.xyx + vec3(0, 2, 4));

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
