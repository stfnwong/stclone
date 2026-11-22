/*
 * SHADER
 * A shader object
 *
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
    this->program = 0;
    this->shader[0] = 0;
    this->shader[1] = 0;
}

Shader::Shader(const std::string& vert_fname, const std::string& frag_fname) : Shader()
{
    this->init(vert_fname, frag_fname);
}

/*
 * compile_shader()
 * Returns the shader handle, or 0 on failure
 */
static GLuint compile_shader(GLenum type, const std::string& source, const std::string& fname)
{
    GLint success;
    GLchar info_log[512];
    const GLchar* code = source.c_str();

    std::cout << "[" << __func__ << "] compiling shader [" << fname << "].... ";
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &code, NULL);
    glCompileShader(s);
    glGetShaderiv(s, GL_COMPILE_STATUS, &success);
    if(!success)
    {
        std::cout << " FAILED" << std::endl;
        glGetShaderInfoLog(s, 512, NULL, info_log);
        std::cout << "[" << __func__ << "] shader compilation log '" 
            << info_log << "' " << std::endl;
        glDeleteShader(s);
        return 0;
    }
    std::cout << " SUCCESS" << std::endl;

    return s;
}

/*
 * Shader::init()
 * Builds the new program in locals and only replaces the current one on success,
 * so a failed reload leaves the previous program intact.
 */
int Shader::init(const std::string& vert_fname, const std::string& frag_fname)
{
    GLint success;

    std::string vshader_source = load_shader(vert_fname);
    std::string fshader_source = load_shader(frag_fname);

    if(vshader_source == "" || fshader_source == "")
        return -1;

    GLuint vs = compile_shader(GL_VERTEX_SHADER, vshader_source, vert_fname);
    if(!vs)
        return -1;

    GLuint fs = compile_shader(GL_FRAGMENT_SHADER, fshader_source, frag_fname);
    if(!fs)
    {
        glDeleteShader(vs);
        return -1;
    }

    // Create the program
    GLuint prog = glCreateProgram();
    glAttachShader(prog, vs);
    glAttachShader(prog, fs);

    // For now we just fix the attributes here. Not sure it its worth trying to make this more dynamic?
    glBindAttribLocation(prog, 0, "position");
    glBindAttribLocation(prog, 1, "tex_coord");

    glLinkProgram(prog);
    check_shader_error(prog, GL_LINK_STATUS, true, "ERROR: Failed to link program");
    glGetProgramiv(prog, GL_LINK_STATUS, &success);
    if(!success)
    {
        glDeleteProgram(prog);
        glDeleteShader(vs);
        glDeleteShader(fs);
        return -1;
    }

    glValidateProgram(prog);
    check_shader_error(prog, GL_VALIDATE_STATUS, true, "ERROR: Failed to validate program");

    // swap in the new program
    this->release();
    this->program = prog;
    this->shader[0] = vs;
    this->shader[1] = fs;

    return 0;
}

/*
 * Shader::release()
 */
void Shader::release(void)
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

    this->program = 0;
    this->shader[0] = 0;
    this->shader[1] = 0;
}

Shader::~Shader() 
{
    this->release();
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
 * Shader::getAttrib()
 */
int Shader::getAttrib(const std::string& a) const
{
    return glGetAttribLocation(this->program, a.c_str());
}

/*
 * Shader::getUniform()
 */
int Shader::getUniform(const std::string& u) const
{
    return glGetUniformLocation(this->program, u.c_str());
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



