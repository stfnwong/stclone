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

vec2 random2(vec2 p)
{
    return fract(
        sin(vec2(
                dot(p, vec2(127.1, 311.7)),
                dot(p, vec2(269.1, 183.3))
                )
            )
        * 43758.5453
    );
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = frag_coord / i_resolution;

    st.x *= i_resolution.x / i_resolution.y;

    vec3 col = vec3(0.0);

    // scale 
    st *= 3.0;
    // tile the space 
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);
    float min_dist = 1.0;

    // here we iterate over the 9 neighbouring tiles 
    for(int y = -1; y <= 1; ++y)
    {
        for(int x = -1; x <= 1; ++x)
        {
            // next neighbour
            vec2 neighbor = vec2(float(x), float(y));
            // select some random position from the neighbour
            vec2 point = random2(i_st + neighbor);
            // animate this random point
            point = 0.5 + 0.5 * sin(i_time + 6.2831 * point);
            // create a vector between the pixel and the point
            vec2 diff = neighbor + point - f_st;
            // find the distance to the point 
            float dist = length(diff);
            // keep the closest distance
            min_dist = min(dist, min_dist);
        }
    } 
    col += min_dist * vec3(0.86, 0.49, 0.2);

    // draw the cell center 
    //col += 1.0 - step(0.02, min_dist);
    //// draw a grid 
    //col.r += step(0.98, f_st.x) + step(0.98, f_st.y);
    // draw isolines 
    //col -= step(0.7, abs(sin(27.0 * min_dist))) * 0.5;

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
}

