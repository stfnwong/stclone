/*
 * ST
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include "st.hpp"

// ======== TEXTURE ======== //
Texture::Texture() : id(0), tex_type("") {} 

// ======== SHADER ======== //

void check_shader_error(GLuint shader, GLuint flag, bool is_program, const std::string& err_msg)
{
    GLint success = 0;
    GLchar error[1024];

    if(is_program)
        glGetProgramiv(shader, flag, &success);
    else
        glGetShaderiv(shader, flag, &success);

    if(success == GL_FALSE)
    {
        if(is_program)
            glGetProgramInfoLog(shader, sizeof(error), NULL, error);
        else
            glGetShaderInfoLog(shader, sizeof(error), NULL, error);

        std::cerr << "[" << __func__ << "] " << err_msg << " '"
            << error << "'" << std::endl;
    }
}


/*
 * load_shader()
 */
std::string load_shader(const std::string& filename)
{
    std::ifstream file;

    file.open(filename.c_str());

    std::string output;
    std::string line;

    if(file.is_open())
    {
        while(file.good())
        {
            getline(file, line);
            output.append(line + "\n");
        }
    }
    else
        std::cerr << "[" << __func__ << "] failed to loader shader from file " << filename << std::endl;

    return output;
}

/*
 * Shader
 * We actually expect all the checking to be done by the caller rather than here.
 */
Shader::Shader(const std::string& vert_fname, const std::string& frag_fname)
{
    GLint success;
    GLchar info_log[512];

    std::string vshader_source = load_shader(vert_fname);
    std::string fshader_source = load_shader(frag_fname);

    // For now, lets just put all the shader code here and worry about cleaning up later
    const GLchar* vs_code = vshader_source.c_str(); 
    const GLchar* fs_code = fshader_source.c_str(); 

    // vertex shader 
    this->shader[0] = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(this->shader[0], 1, &vs_code, NULL);
    glCompileShader(this->shader[0]);
    glGetShaderiv(this->shader[0], GL_COMPILE_STATUS, &success);
    if(!success)
    {
        glGetShaderInfoLog(this->shader[0], 512, NULL, info_log);
        std::cerr << "[" << __func__ << "] shader compilation log '" 
            << info_log << "' " << std::endl;
    }

    // fragment shader
    this->shader[1] = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(this->shader[1], 1, &fs_code, NULL);
    glCompileShader(this->shader[1]);
    glGetShaderiv(this->shader[1], GL_COMPILE_STATUS, &success);
    if(!success)
    {
        glGetShaderInfoLog(this->shader[1], 512, NULL, info_log);
        std::cerr << "[" << __func__ << "] shader compilation log '" 
            << info_log << "' " << std::endl;
    }

    // Create the program
    this->program = glCreateProgram();
    for(int i = 0; i < 2; ++i)
        glAttachShader(this->program, this->shader[i]);

    // For now we just fix the attributes here. Not sure it its worth trying to make this more dynamic?
    glBindAttribLocation(this->program, 0, "position");
    glBindAttribLocation(this->program, 1, "tex_coord");

    glLinkProgram(this->program);
    check_shader_error(this->program, GL_LINK_STATUS, true, "ERROR: Failed to link program");

    glValidateProgram(this->program);
    check_shader_error(this->program, GL_VALIDATE_STATUS, true, "ERROR: Failed to validate program");
}

Shader::~Shader() 
{
    for(int i = 0; i < 2; ++i)
    {
        glDetachShader(this->program, this->shader[i]);
        glDeleteShader(this->shader[i]);
    }
    glDeleteProgram(this->program);
}

bool Shader::Ok(void) const
{
    return (this->program > 0) ? true : false;
}
