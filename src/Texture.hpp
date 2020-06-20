/*
 * TEXTURE 
 * 
 * Stefan Wong 2020
 */

#ifndef __SHADER_HPP

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
        // TODO : load, etc
};

#define __SHADER_HPP
#endif /*__SHADER_HPP*/
