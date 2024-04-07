/*
 * Render to texture test
 */

#include <iostream>

#include <GL/glew.h>
#include <SDL2/SDL.h>

#include "Shader.hpp"


Shader the_shader;		// TODO: what to do about this

struct ShaderUniforms
{
    GLuint i_time;
    GLuint i_time_delta;
    GLuint i_resolution;
    GLuint i_mouse;
};


ShaderUniforms uniforms;


// TODO: this could end up a library function...
int create_shader(const std::string& vert_shader_fname, const std::string& frag_shader_fname)
{
    int status;
    // set up vertex buffer 
    GLuint vao, quad;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    // full screen quad
    float quad_vertex_buffer[] = {
        -1.0f, -1.0f,
         1.0f, -1.0f,
         1.0f,  1.0f,
        -1.0f, -1.0f,
        -1.0f,  1.0f,
         1.0f,  1.0f,
    };

    glGenBuffers(1, &quad);
    glBindBuffer(GL_ARRAY_BUFFER, quad);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quad_vertex_buffer), quad_vertex_buffer, GL_STATIC_DRAW);

    // create shader 
    std::cout << "Using vertex shader [" << vert_shader_fname << "]" << std::endl;
    std::cout << "Using fragment shader [" << frag_shader_fname << "]" << std::endl;
    
    status = the_shader.load(vert_shader_fname, frag_shader_fname);
    if(status < 0 || !the_shader.ok())
    {
        std::cerr << "[" << __func__ << "] failed to load shader files [" 
            << vert_shader_fname << "] and [" << frag_shader_fname 
            << "]" << std::endl;

        return -1;
    }
    the_shader.use();

    // connect shader inputs and outputs
    GLint pos;

    pos = the_shader.getAttrib("position");
    glVertexAttribPointer(pos, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(pos);

    pos = the_shader.getAttrib("position_out");
    glVertexAttribPointer(pos, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(pos);


    uniforms.i_time       = the_shader.getUniform("i_time");
    uniforms.i_time_delta = the_shader.getUniform("i_time_delta");
    uniforms.i_resolution = the_shader.getUniform("i_resolution");
    uniforms.i_mouse      = the_shader.getUniform("i_mouse");

    return 0;
}


int main(int argc, char *argv[])
{
	// TODO: make parameters...
	int height = 768;
	int width = 1024;

	// Create a frame buffer here 
	GLuint frame_buffer_name = 0;
	glGenFramebuffers(1, &frame_buffer_name);     // TODO: segfault here
	glBindFramebuffer(GL_FRAMEBUFFER, frame_buffer_name);

	// Create a texture to render to
	GLuint rendered_texture;
	glGenTextures(1, &rendered_texture);
	glBindTexture(GL_TEXTURE_2D, rendered_texture);


	glTexImage2D(
		GL_TEXTURE_2D,
		0,
		GL_RGB,
		(GLsizei) width,
		(GLsizei) height,
		0,
		GL_RGB,
		GL_UNSIGNED_BYTE,
		0
	);

	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

	// Get a depth buffer 
	GLuint depth_render_buffer;
	glGenRenderbuffers(1, &depth_render_buffer);
	glBindRenderbuffer(GL_RENDERBUFFER, depth_render_buffer);
	glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT, (GLsizei) width, (GLsizei) height);
	glFramebufferRenderbuffer(
			GL_FRAMEBUFFER,
			GL_DEPTH_ATTACHMENT,
			GL_RENDERBUFFER,
			depth_render_buffer
	);

	// Configure frame buffer 
	glFramebufferTexture(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, rendered_texture, 0);

	GLenum draw_buffers[1] = {GL_COLOR_ATTACHMENT0};
	glDrawBuffers(1, draw_buffers);

	if(!(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE))
	{
		std::cout << "[" << __func__ << "] failed to create framebuffer" << std::endl;
		return 0;
	}

	// Make a quad for the screen
	GLuint quad_vertex_array;
	glGenVertexArrays(1, &quad_vertex_array);
	glBindVertexArray(quad_vertex_array);

	static const GLfloat quad_vertex_buffer_data[] = {
		-1.0f, -1.0f, 0.0f,
		1.0f,  -1.0f, 0.0f,
		-1.0f,  1.0f, 0.0f,
		-1.0f, -1.0f, 0.0f,
		 1.0f, -1.0f, 0.0f,
		 1.0f,  1.0f, 0.0f,
	};
	
	GLuint quad_vertex_buffer;
	glGenBuffers(1, &quad_vertex_buffer);
	glBindBuffer(GL_ARRAY_BUFFER, quad_vertex_buffer);
	glBufferData(
			GL_ARRAY_BUFFER, 
			sizeof(quad_vertex_buffer),
			quad_vertex_buffer_data,
			GL_STATIC_DRAW
	);


	Shader rtt;

	rtt.load("program/rtt.vert", "program/rtt.frag");

	// Compile a GLSL program from the shader code


}
