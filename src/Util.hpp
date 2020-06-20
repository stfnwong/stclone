/*
 * UTIL
 */


#ifndef __UTIL_HPP
#define __UTIL_HPP

#include <SDL2/SDL.h>

// start with a tiny demo
constexpr int DISP_W = 800;
constexpr int DISP_H = 600;

SDL_Window* create_window(void);
void destroy_window(SDL_Window* window);

#endif /*__UTIL_HPP*/
