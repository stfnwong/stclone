/* 
    Another attempt at dark terrain with high contrast lighting
*/


#version 330 core 
#define NUM_ITERATIONS 24

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;



vec3 render(vec2 uv)
{


}


void mainImage( out vec4 frag_color, in vec2 frag_coord )
{
    vec2 uv = frag_coord.xy / i_resolution.xy;
    
    
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
