/*
 * Render to texture test
 *
 * Two passes per frame:
 *   Buffer A : reads its own output from the previous frame, writes to a texture
 *   Image    : reads Buffer A, writes to the window
 *
 * Buffer A uses a pair of textures that swap roles each frame (ping-pong), since
 * a draw can't sample the texture it is rendering into.
 */

#include <iostream>
#include <chrono>

#include <GL/glew.h>
#include <SDL2/SDL.h>

// input args
#include <getopt.h>


#include "Pass.hpp"
#include "RenderTarget.hpp"
#include "Shader.hpp"
#include "Util.hpp"


Shader buf_a_shader;
Shader image_shader;
ShaderUniforms buf_a_uniforms;
ShaderUniforms image_uniforms;

RenderTarget buf_a[2];      // ping-pong pair
int cur = 0;                // index of the target written this frame


/*
 * render()
 */
void render(float time_now, float time_diff, const float* mouse, int frame, int win_w, int win_h)
{
    int prev = 1 - cur;

    // ---- Pass 1: Buffer A, reads last frame's A, writes this frame's A
    glBindFramebuffer(GL_FRAMEBUFFER, buf_a[cur].fbo);
    glViewport(0, 0, buf_a[cur].width, buf_a[cur].height);
    buf_a_shader.use();
    set_common_uniforms(buf_a_uniforms, time_now, time_diff, mouse, frame, buf_a[cur].width, buf_a[cur].height);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, buf_a[prev].tex);
    glUniform1i(buf_a_uniforms.i_channel0, 0);      // sampler reads from unit 0

    glDrawArrays(GL_TRIANGLES, 0, 6);

    // ---- Pass 2: Image, reads this frame's A, writes the window
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glViewport(0, 0, win_w, win_h);
    image_shader.use();
    set_common_uniforms(image_uniforms, time_now, time_diff, mouse, frame, win_w, win_h);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, buf_a[cur].tex);
    glUniform1i(image_uniforms.i_channel0, 0);

    glDrawArrays(GL_TRIANGLES, 0, 6);

    cur = prev;     // swap
}


// ======== ENTRY POINT  ======== //
int main(int argc, char *argv[])
{
    Args args;
    const char* const short_args = "vhW:H:";
    const struct option long_args[] = {{0, 0, 0, 0}};

    // get args
    while(1)
    {
        const auto opt = getopt_long(argc, argv, short_args, long_args, nullptr);
        if(opt == -1)
            break;

        switch(opt)
        {
            case 'v':
                args.verbose = true;
                break;

            case 'h':
                std::cout << "Usage: " << argv[0] << " [-W width] [-H height]" << std::endl;
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

    // TODO: hardcoding these for expediency
    const std::string vert_fname  = "program/rtt.vert";
    const std::string buf_a_fname = "program/rtt_buf_a.frag";
    const std::string image_fname = "program/rtt_image.frag";

    // Set up SDL
    SDL_Window* window;
    SDL_GLContext gl_ctx;

    window = create_window("rtt", args.width, args.height);
    gl_ctx = SDL_GL_CreateContext(window);
    if(!gl_ctx)
    {
        std::cerr << "Failed to create GL context: " << SDL_GetError() << std::endl;
        exit(-1);
    }
    glewExperimental = GL_TRUE;
    glewInit();

    create_quad();

    for(int i = 0; i < 2; ++i)
    {
        if(!create_render_target(buf_a[i], args.width, args.height))
        {
            std::cerr << "Failed to create framebuffer " << i << std::endl;
            exit(-1);
        }
    }

    if(load_pass_shader(buf_a_shader, buf_a_uniforms, vert_fname, buf_a_fname) < 0)
        exit(-1);
    if(load_pass_shader(image_shader, image_uniforms, vert_fname, image_fname) < 0)
        exit(-1);

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
                        case SDLK_p:
                            paused = !paused;
                            break;

                        // restart the simulation, buffers clear themselves on frame 0
                        case SDLK_c:
                            frame = 0;
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
