/*
 * ST ENTRY POINT
 *
 * Stefan Wong 2020
 */

#include <iostream>
#include <string>
// GL stuff
#include <GL/glew.h>
#ifdef __APPLE__
    #define GL_SILENCE_DEPRECATION      // GL isn't good enough for apple now, but neither am I
    #include <GL/glut.h>
#else
    #include <GLUT/glut.h>
#endif /*__APPLE__*/
// project stuff
#include "st.hpp"

//void st_disp_func(void)
//{
//
//
//}




int main(int argc, char* argv[])
{
    glutInitWindowSize(640, 480);       // start with a small window
    // NOTE : are these all deprecated?
    glutInit(&argc, argv);
    
    glutInitDisplayMode(GLUT_RGB | GLUT_DOUBLE);
    glutCreateWindow("test window");

    //glutDisplayFunc(st_disp_func);


    // hardcode test shader for now 
    std::string test_vert_shader = "shader/test.vert";
    std::string test_frag_shader = "shader/test.frag";

    Shader test_shader(test_vert_shader, test_frag_shader);

    return 0;
}
