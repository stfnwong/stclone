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
    /*
        (From Inigo Quilez: )
         Most implementations out there suffer from precision issues, because they generate their random points in 
    "domain" space (like "world" or "object" space), which can be arbitrarily far from the origin. One can solve the issue 
    moving all the code to higher precision data types, or by being a bit clever. My implementation does not generate the 
    points in "domain" space, but in "cell" space: once the integer and fractional parts of the shading point are extracted 
    and therefore the cell in which we are working identified, all we care about is what happens around this cell, meaning we 
    can drop all the integer part of our coordinates away all together, saving many precision bits. In fact, in a regular 
    voronoi implementation the integer parts of the point coordinates simply cancel out when the random per cell feature 
    points are subtracted from the shading point. In the implementation above, we don't even let that cancelation happen, 
    cause we are moving all the computations to "cell" space. This trick also allows one to handle the case where you want to 
    voronoi-shade a whole planet - one could simply replace the input to be double precision, perform the floor() and fract() 
    computations, and go floating point with the rest of the computations without paying the cost of changing the whole 
    implementation to double precision. Of course, same trick applies to Perlin Noise patterns (but i've never seen it 
    implemented nor documented anywhere)."

    */

    vec2 i_st = floor(st);          
    vec2 f_st = fract(st);          // fractional part - used to compute distances within this tile
    float min_dist = 1.0;
    vec2 min_point;

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
            if(dist < min_dist)
            {
                min_dist = dist;
                min_point = point;
            }
        }
    } 
    col += dot(min_point, vec2(0.3, 0.7)) * vec3(0.12, 0.45, 0.89);
    //col += min_dist * vec3(0.86, 0.49, 0.2);
    //col += dot(min_point, vec2(0.3, 0.6));      // assign color based on closest point position

    // add distance field
    //col.g = min_dist;

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

