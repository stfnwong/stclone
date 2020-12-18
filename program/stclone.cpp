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
#include "Texture.hpp"
#include "Util.hpp"

// TODO: putting texture here for now because I am in a mad rush

//enum TextureType { TEXTURETYPE_1D = 1, TEXTURETYPE_2D = 2 };
//
//struct Texture 
//{
//    int width;
//    int height;
//    TextureType type;
//};
//
//struct GLTexture : public Texture 
//{
//    GLuint tex_id;
//    int unit;
//};
//
//Texture* CreateRGBA8TextureFromData(Shader shader, int w, int h, const unsigned char* data)
//{
//    GLuint glTexId = 0;
//    glGenTextures(1, &glTexId);
//    glBindTexture(GL_TEXTURE_2D, glTexId);
//    unsigned int * p32bitData = new unsigned int[ w * h ];
//    for(int i=0; i<w*h; i++) p32bitData[i] = (data[i] << 24) | 0xFFFFFF;
//    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, p32bitData);
//    delete[] p32bitData;
//
//    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
//
//    GLTexture * tex = new GLTexture();
//    tex->width = w;
//    tex->height = h;
//    tex->ID = glTexId;
//    tex->type = TEXTURETYPE_2D;
//    tex->unit = 0; // this is always 0 cos we're not using shaders here
//
//    return tex;
//}
//
//void BindTexture(Texture* t)
//{
//
//}
//
//void ReleaseTexture(Texture* t)
//{
//    glDeleteTextures(1, &((GLTexture*)t)->tex_id);
//}

unsigned char* default_texture_data;

/*
 * Shader uniforms 
 */
struct ShaderUniforms
{
    GLuint i_time;
    GLuint i_time_delta;
    GLuint i_resolution;
    GLuint i_mouse;
    GLuint i_frame;
    GLuint i_channel_0;
    GLuint i_channel_1;
};

/*
 * Command line args
 */
struct Args
{
    std::string vert_shader_fname;
    std::string frag_shader_fname;
    bool verbose;

    Args() : 
        vert_shader_fname("shader/default.vert"), 
        frag_shader_fname("shader/default.frag"),
        verbose(false) 
    {} 
};

// Shader
Shader the_shader;
ShaderUniforms uniforms;
GLTexture i_channel_0;

int channel_0_idx = 0;      // TODO: in case I want to assign this later
int channel_1_idx = 0;      // TODO: in case I want to assign this later

unsigned int cur_frame = 0;

/*
 * render()
 */
void render(float time_now, float time_diff, const float* mouse)
{
    glUniform1f(uniforms.i_time, time_now);
    glUniform1f(uniforms.i_time_delta, time_diff);
    glUniform2f(uniforms.i_resolution, DISP_W, DISP_H);
    glUniform4fv(uniforms.i_mouse, 1, mouse);
    // frame count
    // channel uniform   (texture/sampler)
    //glUniform1i(uniforms.i_channel_0, channel_0_idx);
    //glUniform1i(uniforms.i_channel_1, channel_0_idx);


    // bind the texture to tex unit 0
    //i_channel_0.bind(0);
    //glBindTexture(uniforms.i_channel_0, 0);
    glActiveTexture(GL_TEXTURE0 + 0);
    glBindTexture(GL_TEXTURE_2D, i_channel_0.tex_id );     // TODO: 
    //glBindTexture(GL_TEXTURE_2D, uniforms.i_channel_0);     // TODO: 
    glUniform1i(uniforms.i_channel_0, 0);

    glDrawArrays(GL_TRIANGLES, 0, 3);

    glDrawArrays(GL_TRIANGLES, 3, 3);
}


// ======== ENTRY POINT  ======== // 
int main(int argc, char* argv[])
{
    Args args;
    const char* const short_args = "vhi:o:";
    const struct option long_args[] = {0};
    int argn = 0;
    int status;

    // create default texture data
    const int w = 512;
    const int h = 512;
    default_texture_data = new unsigned char[w * h];
    for(int p = 0; p < (w * h); ++p)
        default_texture_data[p] = 0;


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

            default:
                std::cerr << "Unknown option " << std::string(optarg) << "(arg " << argn << ")" << std::endl;
                exit(-1);
                break;
        }
        argn++;
    }

    if(argc > argn+1)
        args.frag_shader_fname = std::string(argv[argn+1]);
    if(argc > argn+2)
        args.vert_shader_fname = std::string(argv[argn+2]);

    // Set up SDL 
    SDL_Window* window;
    SDL_GLContext gl_ctx;

    window = create_window(args.frag_shader_fname.c_str());
    gl_ctx = SDL_GL_CreateContext(window);
    glewExperimental = GL_TRUE;
    glewInit();

    // set up vertex buffer 
    GLuint vao;
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

    GLuint quad;
    glGenBuffers(1, &quad);
    glBindBuffer(GL_ARRAY_BUFFER, quad);
    glBufferData(GL_ARRAY_BUFFER, sizeof(triangles), triangles, GL_STATIC_DRAW);

    // create shader 
    std::cout << "Using vertex shader [" << args.vert_shader_fname << "]" << std::endl;
    std::cout << "Using fragment shader [" << args.frag_shader_fname << "]" << std::endl;
    
    status = the_shader.load(args.vert_shader_fname, args.frag_shader_fname);
    if(status < 0 || !the_shader.ok())
    {
        std::cerr << "[" << __func__ << "] failed to load shader files [" 
            << args.vert_shader_fname << "] and [" << args.frag_shader_fname 
            << "]" << std::endl;

        return -1;
    }
    the_shader.use();

    // Frame buffer 
    GLuint framebuffer = 0;
    glGenFramebuffers(1, &framebuffer);
    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);

    // Create a texture to render to
    i_channel_0.create(w, h, default_texture_data);
    // TODO : clean up
    // another texture to render to
    GLuint render_texture;
    glGenTextures(1, &render_texture);
    glBindTexture(GL_TEXTURE_2D, render_texture);
    // give an empty image as the texture
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 512, 512, 0, GL_RGB, GL_UNSIGNED_BYTE, 0);

    // depth buffer
    GLuint depthbuffer;
    glGenRenderbuffers(1, &depthbuffer);
    glBindRenderbuffer(GL_RENDERBUFFER, depthbuffer);
    glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT, 512, 512);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, depthbuffer);

    // config framebuffer
    glFramebufferTexture(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, i_channel_0.tex_id, 0);
    // set the list of draw buffers
    GLenum draw_buffers[1] = {GL_COLOR_ATTACHMENT0};
    glDrawBuffers(1, draw_buffers);

    // connect shader inputs and outputs
    GLint pos;

    pos = the_shader.getAttrib("position");
    glVertexAttribPointer(pos, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(pos);

    pos = the_shader.getAttrib("position_out");
    glVertexAttribPointer(pos, 2, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(pos);

    glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);

    uniforms.i_time       = the_shader.getUniform("i_time");
    uniforms.i_time_delta = the_shader.getUniform("i_time_delta");
    uniforms.i_resolution = the_shader.getUniform("i_resolution");
    uniforms.i_mouse      = the_shader.getUniform("i_mouse");
    uniforms.i_frame      = the_shader.getUniform("i_frame");
    uniforms.i_channel_0  = the_shader.getUniform("i_channel_0");
    uniforms.i_channel_1  = the_shader.getUniform("i_channel_1");


    bool running = true;
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

                case SDL_QUIT:
                    running = false;
                    break;
            }
        }

        auto now       = std::chrono::high_resolution_clock::now();
        float diff     = std::chrono::duration_cast<std::chrono::duration<float>>(now - prev).count();
        float now_time = std::chrono::duration_cast<std::chrono::duration<float>>(now - start).count();
        //int frames_elapsed = 

        prev = now;

        render(now_time, diff, mouse);
        SDL_GL_SwapWindow(window);
    }

    SDL_GL_DeleteContext(gl_ctx);
    destroy_window(window);

    delete[] default_texture_data;

    return 0;
}
