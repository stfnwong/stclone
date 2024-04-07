/*
 * Render to texture test
 */

#include <iostream>

#include <GL/glew.h>
#include <SDL2/SDL.h>

// input args
#include <getopt.h>


#include "Shader.hpp"
#include "Util.hpp"


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
    Args args;
    const char* const short_args = "vhi:o:W:H:";
    const struct option long_args[] = {0};
    int argn = 1;
    int status;

    char* endptr;
    long number;

    // get args 
    while(1)
    {
        const auto opt = getopt_long(argc, argv, short_args, long_args, nullptr);
        if(opt == -1)
            break;

        switch(opt)
        {
            // NOTE: does nothing as of now
            case 'v':
                args.verbose = true;
                break;

            case 'h':
                std::cout << "TODO : write help text and print here" << std::endl;
                break;

            case 'W':
                number = strtol(argv[argn+1], &endptr, 10);    // string to int...
                args.width = (int) number;
                argn++;
                break;

            case 'H':
                number = strtol(argv[argn+1], &endptr, 10);    // string to int...
                args.height = (int) number;
                argn++;
                break;

            default:
                std::cerr << "Unknown option " << std::string(optarg) << "(arg " << argn << ")" << std::endl;
                exit(-1);
                break;
        }
        argn++;
    }

    //args.frag_shader_fname = std::string(argv[argc-1]);
    // TODO: hardcoding these for expediency
    args.frag_shader_fname = "program/rtt.frag";
    args.vert_shader_fname = "program/rtt.vert";

    // Set up SDL 
    SDL_Window* window;
    SDL_GLContext gl_ctx;

    window = create_window(args.frag_shader_fname.c_str(), args.width, args.height);
    gl_ctx = SDL_GL_CreateContext(window);
    glewExperimental = GL_TRUE;
    glewInit();

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
