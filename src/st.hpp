/*
 * ST
 */

#ifndef __ST_HPP
#define __ST_HPP

#include <GL/glew.h>
#include <string>

/*
 * Texture 
 */
struct Texture
{
    unsigned int id;
    const char* tex_type;

    public:
        Texture();
        Texture& operator=(const Texture& that) = default;
};


/*
 * Shader
 */
struct Shader
{
    GLint program;
    GLint shader[2];

    public:
        Shader(const std::string& vert_fname, const std::string& frag_fname);
        ~Shader();

        Shader(const Shader& that) = delete;
        Shader& operator=(const Shader& that) = delete;
        
        bool Ok(void) const;
        void Use(void);
        // TODO : methods to set uniform ? 
};


// Display function



#endif /*__ST_HPP*/
