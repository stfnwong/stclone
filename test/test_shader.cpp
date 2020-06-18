/* 
 * TEST_SHADER 
 * Unit tests for shader object
 *
 * Stefan Wong 2020
 */

#define CATCH_CONFIG_MAIN
#include "catch/catch.hpp"

#include "Shader.hpp"


TEST_CASE("test_shader_init", "[classic]")
{
    Shader test_shader;

    REQUIRE(false == test_shader.ok());
}
