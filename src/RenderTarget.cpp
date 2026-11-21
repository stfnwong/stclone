/*
 * RENDER TARGET
 * A texture with a framebuffer pointing at it
 *
 */

#include "RenderTarget.hpp"


/*
 * create_render_target()
 * Leaves the default framebuffer (0) bound on return.
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
 * destroy_render_target()
 * Safe to call on a target that was never created.
 */
void destroy_render_target(RenderTarget& rt)
{
    if(rt.fbo)
        glDeleteFramebuffers(1, &rt.fbo);
    if(rt.tex)
        glDeleteTextures(1, &rt.tex);

    rt = RenderTarget();
}
