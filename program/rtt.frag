// Fragment shader for render to texture test

in vec2 UV;

out vec3 col;


uniform sampler2D rendered_texture;
uniform float time;

void main(void)
{
    col = texture(rendered_texture, UV + 0.005 * vec2(sin(time + 1024.0 * UV.x), cos(time + 768.0 * UV.y))).xyz;
}
