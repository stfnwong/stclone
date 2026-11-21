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

#include "Pass.hpp"
#include "Shader.hpp"
#include "Util.hpp"


// Shader
Shader the_shader;
ShaderUniforms uniforms;


/*
 * render()
 */
void render(float time_now, float time_diff, const float* mouse, int frame, int width, int height)
{
    set_common_uniforms(uniforms, time_now, time_diff, mouse, frame, width, height);
    glDrawArrays(GL_TRIANGLES, 0, 6);
}

/*
 * reload_shader()
 * On failure the previous program stays in use
 */
int reload_shader(const Args& args)
{
    std::cout << "Using vertex shader [" << args.vert_shader_fname << "]" << std::endl;
    std::cout << "Using fragment shader [" << args.frag_shader_fname << "]" << std::endl;

    int status = load_pass_shader(the_shader, uniforms, args.vert_shader_fname, args.frag_shader_fname);
    if(status < 0)
        return status;

    the_shader.use();
    return 0;
}


// ======== ENTRY POINT  ======== //
int main(int argc, char* argv[])
{
    Args args;
    const char* const short_args = "vhW:H:";
    const struct option long_args[] = {{0, 0, 0, 0}};
    int status;

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
                std::cout << "Usage: " << argv[0] << " [-W width] [-H height] [shader.frag]" << std::endl;
                exit(0);

            case 'W':
                args.width = (int) strtol(optarg, nullptr, 10);
                break;

            case 'H':
                args.height = (int) strtol(optarg, nullptr, 10);
                break;

            default:
                exit(-1);
        }
    }

    // fragment shader is the first non-option arg, otherwise keep the default
    if(optind < argc)
        args.frag_shader_fname = std::string(argv[optind]);

    // Set up SDL
    SDL_Window* window;
    SDL_GLContext gl_ctx;

    window = create_window(args.frag_shader_fname.c_str(), args.width, args.height);
    gl_ctx = SDL_GL_CreateContext(window);
    if(!gl_ctx)
    {
        std::cerr << "Failed to create GL context: " << SDL_GetError() << std::endl;
        exit(-1);
    }
    glewExperimental = GL_TRUE;
    glewInit();

    create_quad();

    status = reload_shader(args);
    if(status < 0)
        exit(status);

    bool running = true;
    bool paused = false;
    int frame = 0;
    auto start = std::chrono::high_resolution_clock::now();
    auto prev = start;
    float mouse[4] = {0.0f, 0.0f, 0.0f, 0.0f};

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
                            if(reload_shader(args) == 0)
                                frame = 0;
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
            render(now_time, diff, mouse, frame, args.width, args.height);
            SDL_GL_SwapWindow(window);
            frame++;

            GLenum err = glGetError();
            if(err != GL_NO_ERROR)
                std::cerr << "GL error 0x" << std::hex << err << std::dec << " on frame " << frame << std::endl;
        }
    }

    SDL_GL_DeleteContext(gl_ctx);
    destroy_window(window);

    return 0;
}
