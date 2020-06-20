/* 
 * TEST_SHADER 
 * Unit tests for shader object
 *
 * Stefan Wong 2020
 */

#define CATCH_CONFIG_MAIN
#include "catch/catch.hpp"

#include <GL/glew.h>
#ifdef __APPLE__
    #define GL_SILENCE_DEPRECATION      // GL isn't good enough for apple now, but neither am I
#endif /*__APPLE__*/

#include <SDL2/SDL.h>

#include <string>
#include "Shader.hpp"
#include "Util.hpp"


const std::string in_vert_shader = "shader/test.vert";
const std::string in_frag_shader = "shader/test.frag";

SDL_Window* test_window;
SDL_GLContext test_context;

TEST_CASE("test_shader", "[classic]")
{
    // SDL Context setup
    test_window = create_window();      
    test_context = SDL_GL_CreateContext(test_window);
    glewExperimental = GL_TRUE;
    glewInit();

    SECTION("test_shader_init")
    {
        Shader test_shader;

        REQUIRE(false == test_shader.ok());
    }

    SECTION("test_shader_load")
    {
        Shader test_shader;
        int status;

        REQUIRE(false == test_shader.ok());

        status = test_shader.load(in_vert_shader, in_frag_shader);
        REQUIRE(status == 0);
    }

    SDL_GL_DeleteContext(test_context);
    destroy_window(test_window);
}



// TODO : also test shader load on construction


