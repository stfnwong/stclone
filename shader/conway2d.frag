/*
 CONWAY 2d as fragment shader

*/

//#version 410 core
//
//uniform sampler2D channel_0;
//
//// Sinwave noise generator
//float sin_noise(in vec2 co)
//{
//    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
//}
//
//float tex_at_pos(int i, int j)
//{
//    return texture(channel_0, (
//}
//
//
//
//
//void mainImage(out vec4 frag_color, in vec2 frag_coord)
//{
//    vec2 res = i_resolution.xy;
//
//    // get texture coords 
//    vec2 uv = c.xy / res;
//    // get current pixel
//    float pix = texture(
//}

#version 410 core

#define brushSize 20.0

#define T(i,j) texture(i_channel_0, (uv + vec2(i,j)*vec2(1.0/R) )).r 
#define N(i,j)  + float( T(i,j) > 0.)

in vec2 position_out;
out vec4 out_color;
 
uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;
uniform sampler2D i_channel_0;

uniform int i_frame;


//noise see https://www.shadertoy.com/view/ltB3zD
float snoise(in vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


void mainImage( out vec4 O, in vec2 c )
{
	vec2 R = i_resolution.xy;
    
    // retrieve the texture coordinate
    vec2 uv = c.xy / R;
    
    // get the current pixel
    float v = texture(i_channel_0, uv).r;
    
    // check to seee if we are at the start of the timeline or if the R key is pressed.
    //if(distance(iMouse.xy, c) < brushSize && iMouse.z > .0)
    //{
    //    O = vec4(1.0);
    //}
    //else
    {
        float n =   N(-1,-1) + N(-1, 0) + N(-1, 1)
                  + N( 0,-1)            + N( 0, 1)
                  + N( 1,-1) + N( 1, 0) + N( 1, 1);


        // resurect if we are not live, and have 3 live neighrbours
        v += (1.0-float(v > 0.0)) * float(n == 3.0);

        // kill if we do not have either 3 or 2 neighbours
        v *= float(n == 2.0) + float(n == 3.0);

        // fade the current pixel as it ages
        v -= float(v > 0.4)*0.05;

        // write out the pixel
        O = vec4(vec3(v), 1.0);
    }
    ////Generate some noise to get things going
    //else
    //{
    //    O = vec4(snoise(c) > 0.8 ? 1.0 : 0.0);
    //}
}


void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
