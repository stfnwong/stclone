/*
 * Image pass for render to texture test. Displays Buffer A.
 */

#version 330 core

out vec4 out_color;

uniform vec2  i_resolution;
uniform sampler2D i_channel0;   // Buffer A

void main(void)
{
    // Buffer A can exceed 1.0 where the brush overlaps itself, so clamp for display
    out_color = vec4(clamp(texture(i_channel0, gl_FragCoord.xy / i_resolution).rgb, 0.0, 1.0), 1.0);
}
