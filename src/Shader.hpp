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
    GLint shader[2];

    private:
        void init(const std::string& vert_fname, const std::string& frag_fname);

    public:
        Shader();
        Shader(const std::string& vert_fname, const std::string& frag_fname);
        ~Shader();

        Shader(const Shader& that) = delete;
        Shader& operator=(const Shader& that) = delete;
        
        bool ok(void) const;
        //void use(void);
        void load(const std::string& vert_fname, const std::string& frag_fname);
        // TODO : methods to set uniform ? 
};

#endif /*__SHADER_HPP*/
