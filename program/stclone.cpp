/*
 * ST ENTRY POINT
 *
 * Stefan Wong 2020
 */

#include <iostream>
#include <string>
#include <chrono>
// GL stuff
#include <GL/glew.h>
#include <SDL2/SDL.h>
// input args
#include <getopt.h>

#include "Shader.hpp"
#include "Util.hpp"

/*
 * Shader uniforms 
 */
struct ShaderUniforms
{
    GLuint i_time;
    GLuint i_time_delta;
    GLuint i_resolution;
    GLuint i_mouse;
};

/*
 * Command line args
 */
struct Args
{
    std::string vert_shader_fname;
    std::string frag_shader_fname;
    int width;
    int height;
    bool verbose;

    Args() : 
        vert_shader_fname("shader/default.vert"), 
        frag_shader_fname("shader/default.frag"),
        width(DISP_W),
        height(DISP_H),
        verbose(false) 
    {} 
};

// Shader
Shader the_shader;
ShaderUniforms uniforms;

/*
 * render()
 */
void render(float time_now, float time_diff, const float* mouse)
{
    glUniform1f(uniforms.i_time, time_now);
    glUniform1f(uniforms.i_time_delta, time_diff);
    glUniform2f(uniforms.i_resolution, DISP_W, DISP_H);
    glUniform4fv(uniforms.i_mouse, 1, mouse);
    glDrawArrays(GL_TRIANGLES, 0, 3);
    glDrawArrays(GL_TRIANGLES, 3, 3);
}

// Load shader 
int create_shader(const std::string& vert_shader_fname, const std::string& frag_shader_fname)
{
    int status;
    // set up vertex buffer 
    GLuint vao, quad;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    // full screen quad
    float triangles[] = {
        -1.0f, -1.0f,
         1.0f, -1.0f,
         1.0f,  1.0f,
        -1.0f, -1.0f,
        -1.0f,  1.0f,
         1.0f,  1.0f,
    };

    glGenBuffers(1, &quad);
    glBindBuffer(GL_ARRAY_BUFFER, quad);
    glBufferData(GL_ARRAY_BUFFER, sizeof(triangles), triangles, GL_STATIC_DRAW);

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


// ======== ENTRY POINT  ======== // 
int main(int argc, char* argv[])
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

    args.frag_shader_fname = std::string(argv[argc-1]);

    // Set up SDL 
    SDL_Window* window;
    SDL_GLContext gl_ctx;

    window = create_window(args.frag_shader_fname.c_str(), args.width, args.height);
    gl_ctx = SDL_GL_CreateContext(window);
    glewExperimental = GL_TRUE;
    glewInit();

    status = create_shader(args.vert_shader_fname, args.frag_shader_fname);
    if(status < 0)
        exit(status);

    bool running = true;
    bool paused = false;
    auto start = std::chrono::high_resolution_clock::now();
    auto prev = start;
    float mouse[4];

    while(running)
    {
        SDL_Event event;

        while(SDL_PollEvent(&event))
        {
            switch(event.type)
            {
                case SDL_MOUSEBUTTONDOWN:
                    if(event.button.button == SDL_BUTTON_LEFT)
                    {
                        mouse[2] = mouse[0];
                        mouse[3] = mouse[1];
                    }
                    break;

                case SDL_MOUSEBUTTONUP:
                    if(event.button.button == SDL_BUTTON_LEFT)
                    {
                        mouse[2] = 0.0f;
                        mouse[3] = 0.0f;
                    }
                    break;

                case SDL_MOUSEMOTION:
                    mouse[0] = event.motion.x;
                    mouse[1] = event.motion.y;
                    break;

                case SDL_KEYDOWN:
                    switch(event.key.keysym.sym)
                    {
                        case SDLK_r:
                            status = create_shader(args.vert_shader_fname, args.frag_shader_fname);
                            break;
                            
                        case SDLK_p:
                            paused = !paused;
                            break;
                    }
                    break;

                case SDL_QUIT:
                    running = false;
                    break;
            }
        }

        if(!paused)
        {
            auto now       = std::chrono::high_resolution_clock::now();
            float diff     = std::chrono::duration_cast<std::chrono::duration<float>>(now - prev).count();
            float now_time = std::chrono::duration_cast<std::chrono::duration<float>>(now - start).count();

            prev = now;
            render(now_time, diff, mouse);
            SDL_GL_SwapWindow(window);
        }
    }

    SDL_GL_DeleteContext(gl_ctx);
    destroy_window(window);

    return 0;
}
