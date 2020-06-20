/*
 * ST ENTRY POINT
 *
 * Stefan Wong 2020
 */

#include <iostream>
#include <string>
// GL stuff
#include <GL/glew.h>
#include <SDL2/SDL.h>

#include "Shader.hpp"
#include "Util.hpp"


Shader the_shader;



// ======== ENTRY POINT  ======== // 
int main(int argc, char* argv[])
{
    int status;
    // hardcode test shader for now 
    std::string test_vert_shader = "shader/test.vert";
    std::string test_frag_shader = "shader/test.frag";

    // Set up SDL 
    SDL_Window* window;
    SDL_GLContext gl_ctx;


    window = create_window();
    gl_ctx = SDL_GL_CreateContext(window);
    glewExperimental = GL_TRUE;
    glewInit();
    
    status = the_shader.load(test_vert_shader, test_frag_shader);
    if(status < 0 || !the_shader.ok())
    {
        std::cerr << "[" << __func__ << "] failed to load shader files [" 
            << test_vert_shader << "] and [" << test_frag_shader 
            << "]" << std::endl;

        return -1;
    }

    return 0;
}
