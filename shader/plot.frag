/*
    Plotting functions 
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


/* 
    draw a line plot of a given function
*/
float plot(vec2 st)
{
    return smoothstep(0.02, 0.0, abs(st.y - st.x));
}

/* 
    draw a smooth line plot of a given function
*/
float plot_smooth(vec2 st, float pct)
{
    return smoothstep(pct - 0.02, pct, st.y) -
           smoothstep(pct, pct + 0.02, st.y);
}

void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 st = gl_FragCoord.xy / i_resolution;
    
    // function to plot
    //float y = st.x;
    float y = pow(st.x, 2.4 * (sin(i_time) + 1.0));
    //float y = 0.2 * exp(0.25 * sin(i_time) * st.x);

    // color the plot 
    vec3 col = vec3(y);
    // plot a line
    float pct = plot_smooth(st, y);
    col = (1.0 - pct) * col;            // colorize gradient
    col += pct * vec3(0.0, 0.0, 1.0);

    frag_color = vec4(col, 1.0);
}

void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
