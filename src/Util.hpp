/*
 * UTIL
 */


#ifndef __UTIL_HPP
#define __UTIL_HPP

#include <string>
#include <SDL2/SDL.h>

// start with a tiny demo
constexpr int DISP_W = 800;
constexpr int DISP_H = 600;


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



SDL_Window* create_window(const char* window_title, int width, int height);
void destroy_window(SDL_Window* window);

#endif /*__UTIL_HPP*/
