/*
JULIA 2D
Orbit trap rendering of Julia Fractal (2D)

*/


#version 330 core 

#define AA 2
#define NUM_DERIVATIVE_ITERS 256


// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


/*
    render()
*/
float calc_distance(in vec2 p, in float time)
{
    float l_time = 0.5 - 0.5 * cos(0.06 * time);
    float zoom = pow(0.9, 5.0 * time);
    vec2 c = vec2(-0.745, 0.186) - 0.35 * zoom * (1.0 - l_time * 0.5);
    vec2 cen = vec2(0.2655, 0.301) + zoom * 0.4 * cos(2.0 + 2.0 * l_time);
    vec2 z = cen + (p - cen) * zoom;

    // implement full derivative (slower)
    vec2 dz = vec2(1.0, 0.0);
    for(int i = 0; i < NUM_DERIVATIVE_ITERS; ++i)
    {
        dz = 2.0 * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x);
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if(dot(z,z) > 200.0)
            break;
    }
    float d = sqrt(dot(z, z) / dot(dz, dz)) * log(dot(z, z));

    return sqrt(clamp((150.0 / zoom) * d, 0.0, 1.0));
}

void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    vec2 uv = (2.0 * frag_coord - i_resolution.xy) / i_resolution.y;
    float scol = 0.0;    
    for(int i = 0; i < AA; ++i)
    {
        for(int j = 0; j < AA; ++j)
        {
            vec2 of = -0.5 + vec2(float(i), float(j)) / float(AA);
            scol += calc_distance(uv + of, i_time);
        }   
    }
    scol = scol / float(AA * AA);
       
    vec3 vcol = pow(vec3(scol), vec3(0.9, 1.1, 1.4));
    // TODO : probably need scaling above

    frag_color = vec4(vcol, 1.0);
}


void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
