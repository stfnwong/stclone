/*
    VORONOI
Stuff from the book of shaders 

*/

#version 330 core 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

#define TOTAL_POINTS 8

mat2 rotate(float a)
{
    float ca = cos(a);
    float sa = sin(a);

    return mat2(ca, sa, -ca, -sa);
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // normalize pixel co-ords (from 0 to 1)
    vec2 st = frag_coord / i_resolution.xy;
    st.x *= i_resolution.x / i_resolution.y;

    //float ar = i_resolution.x / i_resolution.y;
    //vec2 uv = frag_coord / i_resolution.xy;
    vec3 col = vec3(0.0);

    // cell positions 
    vec2 point[6];
    
    point[0] = vec2(0.83, 0.75);
    point[1] = vec2(0.60, 0.07);
    point[2] = vec2(0.28, 0.64);
    point[3] = vec2(0.31, 0.26);
    point[4] = vec2(0.11, 0.83);
    point[5] = i_mouse.xy / i_resolution.xy;

    /*
    Cellular noise is generated from a distance field. We compute the 
    distance from each pixel to the closest point.
    */
    float min_dist = 1.0;
    for(int i = 0; i < 6; ++i)
    {
        float d = distance(st, point[i]);
        // keep the smallest dist 
        min_dist = min(d, min_dist);
    }

    // drat the distance field
    col += min_dist * vec3(0.91, 0.84, 0.65);
    // show isolines 
    //col -= step(0.7, abs(sin(50.0 * min_dist))) * 0.3;

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
