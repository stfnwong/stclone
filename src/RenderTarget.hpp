/*
 * RENDER TARGET
 * A texture with a framebuffer pointing at it
 *
 */

#ifndef __RENDER_TARGET_HPP
#define __RENDER_TARGET_HPP

#include <GL/glew.h>


/*
 * RenderTarget
 */
struct RenderTarget
{
    GLuint fbo = 0;
    GLuint tex = 0;
    int width  = 0;
    int height = 0;
};

bool create_render_target(RenderTarget& rt, int width, int height);
void destroy_render_target(RenderTarget& rt);

#endif /*__RENDER_TARGET_HPP*/
