/*
 * PASS
 * Helpers for a single full screen shader pass
 *
 */

#ifndef __PASS_HPP
#define __PASS_HPP

#include <string>
#include <GL/glew.h>

#include "Shader.hpp"


/*
 * Shader uniforms. Locations are per-program, so each pass has its own copy.
 */
struct ShaderUniforms
{
    GLint i_time;
    GLint i_time_delta;
    GLint i_resolution;
    GLint i_mouse;
    GLint i_frame;
    GLint i_channel0;
};

int load_pass_shader(Shader& shader, ShaderUniforms& uniforms, const std::string& vert_fname, const std::string& frag_fname);
void set_common_uniforms(const ShaderUniforms& uniforms, float time_now, float time_diff, const float* mouse, int frame, int width, int height);

#endif /*__PASS_HPP*/
