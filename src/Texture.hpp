/*
 * TEXTURE 
 * 
 * Stefan Wong 2020
 */

#ifndef __TEXTURE_HPP
#define __TEXTURE_HPP


//#include <SDL2/SDL.h>
#include <GL/glew.h>

enum TextureType { TEXTURETYPE_1D = 1, TEXTURETYPE_2D = 2 };

/*
 * Texture 
 */
struct Texture
{
    int width;
    int height;
    unsigned int id;
    TextureType type;

    public:
        Texture();
        Texture(const Texture& that) = delete;
        Texture& operator=(const Texture& that) = delete;
        //Texture& operator=(const Texture& that) = default;
        // TODO : load, etc

};


struct GLTexture : public Texture
{
    GLuint tex_id;
    int    unit;       // which texture unit we bind to

    public:
        GLTexture();
        ~GLTexture();
        void create(int w, int h, const unsigned char* data);

        void bind(GLuint unit);
};

#endif /*__TEXTURE_HPP*/
