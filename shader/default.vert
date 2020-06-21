/*
Default vertex shader 
*/

#version 330 core

in vec2 position;
out vec2 position_out;

void main(void)
{
    gl_Position = vec4(position, 0.0, 1.0);
    position_out = position;
}
