/*
 * UTIL
 */


#ifndef __UTIL_HPP
#define __UTIL_HPP

#include <string>
#include <GL/glew.h>
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
    std::string buf_a_fname;        // empty means no Buffer A
    int width;
    int height;
    bool verbose;

    Args() : 
        vert_shader_fname("shader/default.vert"), 
        frag_shader_fname("shader/default.frag"),
        buf_a_fname(""),
        width(DISP_W),
        height(DISP_H),
        verbose(false) 
    {} 
};



SDL_Window* create_window(const char* window_title, int width, int height);
void destroy_window(SDL_Window* window);
GLuint create_quad(void);

#endif /*__UTIL_HPP*/
