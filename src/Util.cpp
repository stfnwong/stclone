/*
 * UTIL
 */

#include "Util.hpp"


/*
 * create_window()
 */
SDL_Window* create_window(const char* window_title, int width, int height)
{
    SDL_Init(SDL_INIT_VIDEO);
    SDL_GL_SetSwapInterval(1);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_STENCIL_SIZE, 8);

    return SDL_CreateWindow(window_title, SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, width, height, SDL_WINDOW_OPENGL);
}

/*
 * destroy_window()
 */
void destroy_window(SDL_Window* window)
{
    SDL_DestroyWindow(window);
    SDL_Quit();
}
