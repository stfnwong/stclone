/*
 * TEXTURE 
 * 
 * Stefan Wong 2020
 */

#include "Texture.hpp"



// ======== TEXTURE ======== //
Texture::Texture() : width(0), height(0), id(0), type(TEXTURETYPE_2D) {} 


// Texture type that we can pass to GL functions
GLTexture::GLTexture() {} 

void GLTexture::create(int w, int h, const unsigned char* data)
{
    GLuint gl_tex_id = 0;
    glGenTextures(1, &gl_tex_id);

    glBindTexture(GL_TEXTURE_2D, gl_tex_id);

    unsigned int* p32_data = new unsigned int[w * h];

    // load data
    for(int i = 0; i < (w * h); ++i)
        p32_data[i] = (data[i] << 24) | 0xFFFFFF;
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, p32_data);

    delete[] p32_data;

    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

    this->width = w;
    this->height = h;
    this->tex_id = gl_tex_id;
    this->type = TEXTURETYPE_2D;
    this->unit = 0;     // TODO: this needs to be shader index?
}

GLTexture::~GLTexture()
{
    glDeleteTextures(1, &this->tex_id);
    //glDeleteTextures(1, &(this->tex_id));
}


void GLTexture::bind(GLuint unit)
{
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, unit);
    //glActiveTexture(GL_TEXTURE0 + this->unit);
    //glBindTexture(GL_TEXTURE_2D, this->tex_id);
}
