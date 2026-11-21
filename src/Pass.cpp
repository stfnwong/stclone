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
