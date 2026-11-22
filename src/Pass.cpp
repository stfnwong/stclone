/*
 * PASS
 * Helpers for a single full screen shader pass
 *
 */

#include <iostream>

#include "Pass.hpp"


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
 * load_pass()
 */
int load_pass(Pass& pass, const std::string& vert_fname, const std::string& frag_fname)
{
    return load_pass_shader(pass.shader, pass.uniforms, vert_fname, frag_fname);
}

/*
 * create_pass_targets()
 * Replaces any existing targets, so this also serves to clear and resize them.
 */
bool create_pass_targets(Pass& pass, int width, int height)
{
    destroy_pass_targets(pass);

    for(int i = 0; i < 2; ++i)
    {
        if(!create_render_target(pass.target[i], width, height))
        {
            destroy_pass_targets(pass);
            return false;
        }
    }
    pass.cur = 0;

    return true;
}

/*
 * destroy_pass_targets()
 */
void destroy_pass_targets(Pass& pass)
{
    for(int i = 0; i < 2; ++i)
        destroy_render_target(pass.target[i]);
}

/*
 * pass_output()
 * The texture this pass wrote most recently, or 0 for a pass that renders to the window.
 * Never the texture the pass will write next, so it is always safe to sample.
 */
GLuint pass_output(const Pass& pass)
{
    if(!pass.offscreen)
        return 0;

    return pass.target[1 - pass.cur].tex;
}

/*
 * draw_pass()
 */
void draw_pass(Pass& pass, float time_now, float time_diff, const float* mouse, int frame, int win_w, int win_h)
{
    GLuint fbo  = 0;
    int width   = win_w;
    int height  = win_h;

    if(pass.offscreen)
    {
        fbo    = pass.target[pass.cur].fbo;
        width  = pass.target[pass.cur].width;
        height = pass.target[pass.cur].height;
    }

    // Look up the input before swapping, so a pass reading itself gets the previous frame
    GLuint input = (pass.channel0) ? pass_output(*pass.channel0) : 0;

    glBindFramebuffer(GL_FRAMEBUFFER, fbo);
    glViewport(0, 0, width, height);
    pass.shader.use();
    set_common_uniforms(pass.uniforms, time_now, time_diff, mouse, frame, width, height);

    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, input);
    glUniform1i(pass.uniforms.i_channel0, 0);      // sampler reads from unit 0

    glDrawArrays(GL_TRIANGLES, 0, 6);

    if(pass.offscreen)
        pass.cur = 1 - pass.cur;
}
