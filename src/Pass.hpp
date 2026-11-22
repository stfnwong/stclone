/*
 * PASS
 * Helpers for a single full screen shader pass
 *
 */

#ifndef __PASS_HPP
#define __PASS_HPP

#include <string>
#include <GL/glew.h>

#include "RenderTarget.hpp"
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

/*
 * Pass
 * One full screen shader pass. An offscreen pass (a Shadertoy "Buffer") renders into a
 * ping-pong pair of targets, otherwise the pass renders into the window.
 *
 * channel0 is the pass whose output is bound to i_channel0. It may be this pass, in
 * which case the shader sees its own output from the previous frame.
 */
struct Pass
{
    Shader shader;
    ShaderUniforms uniforms;
    bool offscreen = false;
    RenderTarget target[2];
    int cur = 0;                        // index of the target written next
    const Pass* channel0 = nullptr;
};

int load_pass_shader(Shader& shader, ShaderUniforms& uniforms, const std::string& vert_fname, const std::string& frag_fname);
void set_common_uniforms(const ShaderUniforms& uniforms, float time_now, float time_diff, const float* mouse, int frame, int width, int height);


int    load_pass(Pass& pass, const std::string& vert_fname, const std::string& frag_fname);
bool   create_pass_targets(Pass& pass, int width, int height);
void   destroy_pass_targets(Pass& pass);
GLuint pass_output(const Pass& pass);
void   draw_pass(Pass& pass, float time_now, float time_diff, const float* mouse, int frame, int win_w, int win_h);

#endif /*__PASS_HPP*/
