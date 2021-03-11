/*
 * SHADER
 * A shader object
 *
 * Stefan Wong 2020
 */


#include <iostream>
#include <fstream>
#include <SDL2/SDL.h>
#include "Shader.hpp"

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

        std::cout << "[" << __func__ << "] " << err_msg << " '"
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
    {
        std::cout << "[" << __func__ << "] failed to loader shader from file " << filename << std::endl;
        return std::string("");
    }

    return output;
}

/*
 * Shader
 * We actually expect all the checking to be done by the caller rather than here.
 */
Shader::Shader() 
{
    this->program   = 0;
    this->shader[0] = 0;
    this->shader[1] = 0;
}

Shader::Shader(const std::string& vert_fname, const std::string& frag_fname)
{
    this->init(vert_fname, frag_fname);
}

int Shader::init(const std::string& vert_fname, const std::string& frag_fname)
{
    GLint success;
    GLchar info_log[512];

    std::string vshader_source = load_shader(vert_fname);
    std::string fshader_source = load_shader(frag_fname);

    if(vshader_source == "" || fshader_source == "")
        return -1;

    // For now, lets just put all the shader code here and worry about cleaning up later
    const GLchar* vs_code = vshader_source.c_str(); 
    const GLchar* fs_code = fshader_source.c_str(); 

    // vertex shader 
    std::cout << "[" << __func__ << "] compiling shader [" << vert_fname << "].... ";
    this->shader[0] = glCreateShader(GL_VERTEX_SHADER);   
    glShaderSource(this->shader[0], 1, &vs_code, NULL);
    glCompileShader(this->shader[0]);
    glGetShaderiv(this->shader[0], GL_COMPILE_STATUS, &success);
    if(!success)
    {
        std::cout << " FAILED" << std::endl;
        glGetShaderInfoLog(this->shader[0], 512, NULL, info_log);
        std::cout << "[" << __func__ << "] shader compilation log '" 
            << info_log << "' " << std::endl;
        return -1;
    }
    std::cout << " SUCCESS" << std::endl;

    // fragment shader
    std::cout << "[" << __func__ << "] compiling shader [" << frag_fname << "].... ";
    this->shader[1] = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(this->shader[1], 1, &fs_code, NULL);
    glCompileShader(this->shader[1]);
    glGetShaderiv(this->shader[1], GL_COMPILE_STATUS, &success);
    if(!success)
    {
        std::cout << " FAILED" << std::endl;
        glGetShaderInfoLog(this->shader[1], 512, NULL, info_log);
        std::cout << "[" << __func__ << "] shader compilation log '" 
            << info_log << "' " << std::endl;
        return -1;
    }
    std::cout << " SUCCESS" << std::endl;

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

    return 0;
}

Shader::~Shader() 
{
    if(this->program > 0)
    {
        for(int i = 0; i < 2; ++i)
        {
            glDetachShader(this->program, this->shader[i]);
            glDeleteShader(this->shader[i]);
        }
        glDeleteProgram(this->program);
    }
}

// operators 
Shader& Shader::operator=(const Shader& that)
{
    this->program = that.program;
    this->shader[0] = that.shader[0];
    this->shader[1] = that.shader[1];

    return *this;
}

/*
 * Shader::ok()
 */
bool Shader::ok(void) const
{
    return (this->program > 0) ? true : false;
}

void Shader::use(void)
{
    if(this->program > 0)
        glUseProgram(this->program);
}


/*
 * Shader::load()
 */
int Shader::load(const std::string& vert_fname, const std::string& frag_fname)
{
    return this->init(vert_fname, frag_fname);
}

/*
 * getProgram()
 */
GLint Shader::getProgram(void) const
{
    return this->program;
}

/*
 * Shader::getAttrib()
 */
int Shader::getAttrib(const std::string& a) const
{
    return glGetAttribLocation(this->program, a.c_str());
}

/*
 * Shader::getUniform()
 * TODO: change name to getUniformLocation?
 */
int Shader::getUniform(const std::string& u) const
{
    return glGetUniformLocation(this->program, u.c_str());
}


void Shader::setUniform1f(const std::string& uname, float x)
{
    int u = this->getUniform(uname);
    if(u != -1)
        glUniform1f(u, x);
}

void Shader::setUniform2f(const std::string& uname, float x, float y)
{
    int u =  this->getUniform(uname);
    if(u != -1)
        glUniform2f(u, x, y);
}

void Shader::setUniform3f(const std::string& uname, float x, float y, float z)
{
    int u =  this->getUniform(uname);
    if(u != -1)
        glUniform3f(u, x, y, z);
}

void Shader::setUniform4f(const std::string& uname, float x, float y, float z, float w)
{
    int u =  this->getUniform(uname);
    if(u != -1)
        glUniform4f(u, x, y, z, w);
}
