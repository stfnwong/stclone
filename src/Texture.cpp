/*
 * TEXTURE 
 * 
 * Stefan Wong 2020
 */

#include "Texture.hpp"



// ======== TEXTURE ======== //
Texture::Texture() : id(0), unit(0), tex_type(TEXTURETYPE::TEX_1D), width(0), height(0) {} 

Texture::Texture(int w, int h, const uint8_t* data) 
{
    this->width = w;
    this->height = h;
}


void Texture::updateR32(const float* data)
{
    glActiveTexture( GL_TEXTURE0 + this->unit);
    glBindTexture( GL_TEXTURE_1D, this->id);
    glTexSubImage1D( GL_TEXTURE_1D, 0, 0, this->width, GL_RED, GL_FLOAT, data );
}

void Texture::release(void)
{
    glDeleteTextures(1, &this->id);
}
