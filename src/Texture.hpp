/*
 * TEXTURE 
 * 
 * Stefan Wong 2020
 */

#ifndef __TEXTURE_HPP
#define __TEXTURE_HPP

#include <GL/glew.h>
#include <SDL2/SDL.h>

enum class TEXTURETYPE 
{
    TEX_1D = 1,
    TEX_2D = 2,
};

/*
 * Texture 
 */
struct Texture
{
    //unsigned int id;
    GLuint id;
    int unit;
    //const char* tex_type;
    TEXTURETYPE tex_type;
    int width;
    int height;

    public:
        Texture();
        Texture(int w, int h, const uint8_t* data);
        Texture& operator=(const Texture& that) = default;
        // TODO : load, etc

        void updateR32(const float* data);
        void release(void);
};

#endif /*__TEXTURE_HPP*/
