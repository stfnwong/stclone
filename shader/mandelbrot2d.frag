/*
    2D Mandelbrot
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


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = (frag_coord.xy - 0.5 * i_resolution.xy) / i_resolution.y;
    vec2 m = i_mouse.xy / i_resolution.xy;

    float zoom_factor = 10.0;
    float zoom = pow(10.0, -m.x * zoom_factor);
    // center the screen on the zoom point 
    vec2 c = uv * zoom * 3.0;
    //c += vec2(0.25 * m.x, 0.25 * m.y);
    //vec2 c = vec2(m.x, m.y) * zoom * 3.0;
    c += vec2(-0.69955, 0.37999);

    // start computing the escape value for this pixel 
    vec2 z = vec2(0.0);
    float iter = 0.0;

    const float max_iter = 100.0;       // after this just let the pixel escape

    // mandlebrot set is given by f(z) = z^2 + c < inf 
    // where z is complex
    for(float i = 0.0; i < max_iter; ++i)
    {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if(length(z) > 2.0)     // range is -1 -> 1
            break;

        iter += 1.0;
    }
    
    float f = 1.0 - (iter / max_iter);
    vec3 col = vec3(f);
    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, gl_FragCoord.xy);
}
