/*
 * Buffer A for render to texture test.
 * Reads its own previous frame through i_channel0, fades it and paints a dot at the mouse.
 */

#version 330 core

out vec4 out_color;

uniform vec2  i_resolution;
uniform vec4  i_mouse;
uniform int   i_frame;
uniform sampler2D i_channel0;   // previous frame of this buffer

void main(void)
{
    vec2 uv   = gl_FragCoord.xy / i_resolution;
    vec3 prev = (i_frame == 0) ? vec3(0.0) : texture(i_channel0, uv).rgb;

    vec2 m = vec2(i_mouse.x, i_resolution.y - i_mouse.y);   // SDL y is top-down
    float d = length(gl_FragCoord.xy - m);
    vec3 brush = vec3(1.0, 0.5, 0.2) * smoothstep(20.0, 0.0, d);

    out_color = vec4(prev * 0.98 + brush, 1.0);     // fade + paint
}
