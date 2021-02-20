/*
 * SHADER
 * A shader object
 *
 * Stefan Wong 2020
 */

#ifndef __SHADER_HPP
#define __SHADER_HPP

#include <GL/glew.h>
#include <string>


/*
 * Shader
 */
class Shader
{
    GLint program;
    GLuint shader[2];

    private:
        int init(const std::string& vert_fname, const std::string& frag_fname);

    public:
        Shader();
        Shader(const std::string& vert_fname, const std::string& frag_fname);
        ~Shader();

        Shader(const Shader& that) = delete;
        Shader& operator=(const Shader& that);
        
        bool ok(void) const;
        void use(void);
        int load(const std::string& vert_fname, const std::string& frag_fname);

        int getAttrib(const std::string& a) const;
        int getUniform(const std::string& u) const;
        void setUniform2f(const std::string& uname, float x, float y);
        void setUniform3f(const std::string& uname, float x, float y, float z);
        void setUniform4f(const std::string& uname, float x, float y, float z, float w);

};

#endif /*__SHADER_HPP*/
