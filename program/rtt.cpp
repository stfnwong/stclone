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


#include "Shader.hpp"
#include "Util.hpp"


/*
 * Shader uniforms. Locations are per-program, so each pass has its own copy.
 */
struct ShaderUniforms
{
    GLint i_time;
    GLint i_time_delta;
    GLint i_resolution;
    GLint i_mouse;
    GLint i_frame;
    GLint i_channel0;
};

/*
 * RenderTarget
 * A texture with a framebuffer pointing at it
 */
struct RenderTarget
{
    GLuint fbo = 0;
    GLuint tex = 0;
    int width  = 0;
    int height = 0;
};


Shader buf_a_shader;
Shader image_shader;
ShaderUniforms buf_a_uniforms;
ShaderUniforms image_uniforms;

RenderTarget buf_a[2];      // ping-pong pair
int cur = 0;                // index of the target written this frame


/*
 * create_quad()
 * Full screen quad as two triangles. Attribute 0 is bound to "position" in Shader::init()
 */
GLuint create_quad(void)
{
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glBindVertexArray(vao);

    float quad_vertex_buffer[] = {
        -1.0f, -1.0f,
         1.0f, -1.0f,
         1.0f,  1.0f,
        -1.0f, -1.0f,
        -1.0f,  1.0f,
         1.0f,  1.0f,
    };

    glGenBuffers(1, &vbo);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quad_vertex_buffer), quad_vertex_buffer, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(0);

    return vao;
}

/*
 * create_render_target()
 */
bool create_render_target(RenderTarget& rt, int width, int height)
{
    rt.width = width;
    rt.height = height;

    // Float format so buffers can hold values outside [0, 1], like Shadertoy
    glGenTextures(1, &rt.tex);
    glBindTexture(GL_TEXTURE_2D, rt.tex);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, width, height, 0, GL_RGBA, GL_FLOAT, nullptr);
    // No mipmaps, so MIN_FILTER must not be a mipmap filter (the default is)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    glGenFramebuffers(1, &rt.fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, rt.fbo);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, rt.tex, 0);

    bool ok = glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE;

    // start from black
    glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    return ok;
}

/*
 * load_pass_shader()
 */
int load_pass_shader(Shader& shader, ShaderUniforms& uniforms, const std::string& vert_fname, const std::string& frag_fname)
{
    int status = shader.load(vert_fname, frag_fname);
    if(status < 0 || !shader.ok())
    {
        std::cerr << "[" << __func__ << "] failed to load shader files ["
            << vert_fname << "] and [" << frag_fname << "]" << std::endl;
        return -1;
    }

    uniforms.i_time       = shader.getUniform("i_time");
    uniforms.i_time_delta = shader.getUniform("i_time_delta");
    uniforms.i_resolution = shader.getUniform("i_resolution");
    uniforms.i_mouse      = shader.getUniform("i_mouse");
    uniforms.i_frame      = shader.getUniform("i_frame");
    uniforms.i_channel0   = shader.getUniform("i_channel0");

    return 0;
}

/*
 * set_common_uniforms()
 * Uniforms belong to a program, so this must be called after each use()
 */
void set_common_uniforms(const ShaderUniforms& uniforms, float time_now, float time_diff, const float* mouse, int frame, int width, int height)
{
    glUniform1f(uniforms.i_time, time_now);
    glUniform1f(uniforms.i_time_delta, time_diff);
    glUniform2f(uniforms.i_resolution, (float) width, (float) height);
    glUniform4fv(uniforms.i_mouse, 1, mouse);
    glUniform1i(uniforms.i_frame, frame);
}

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
