// Fragment shader for render to texture test

#version 330 core

in vec2 UV;

layout(location = 0) out vec4 col;


uniform sampler2D rendered_texture;
uniform float time;

void main(void)
{
    col = vec4(texture(rendered_texture, UV + 0.005 * vec2(sin(time + 1024.0 * UV.x), cos(time + 768.0 * UV.y))).xyz, 1.0);
}
