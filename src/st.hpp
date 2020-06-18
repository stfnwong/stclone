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




// Display function



#endif /*__ST_HPP*/
