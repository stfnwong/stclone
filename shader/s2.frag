// This is my shader now
// A lot of this is taken from other shaders that I've seen on shadertoy, so the real
// credit should at least go to not me.


#version 330 core 
#define NUM_ITERATIONS 24

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;



mat2 rotate(float a)
{
    float ca = cos(a);
    float sa = sin(a);

    return mat2(ca, sa, -sa, ca);
}

float random2(vec2 p)
{
    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// this is the implementation by Morgan McGuire
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st)
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    // four corner of a tile
    float a = random2(i);
    float b = random2(i + vec2(1.0, 0.0));
    float c = random2(i + vec2(0.0, 1.0));
    float d = random2(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 6
float fbm(in vec2 st)
{
    // initialize
    float value = 0.0;
    float amp = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = rotate(0.5);

    float a_factor = 0.25 * (0.5 * sin(i_time * 0.125) + 0.5) + 0.25;

    // start combining waves 
    for(int i = 0; i < NUM_OCTAVES; ++i)
    {
        // reduce axial bias with rotations 
        value += amp * noise(st);
        st = rot * st * 2.0 + shift;      // next octave
        amp *= a_factor;
        //amp *= 0.25;     // dampen higher frequency components
    }

    return value;
}




float rand(vec3 s) {
    
    //Thanks to Shane for the improved random function
    return fract(cos(dot(s, vec3(7, 157, 113)))*43758.5453);

    /* old
    return fract( (fract(s.x*32.924)*8. + fract(s.x*296.234) +
                 fract(s.y*32.924)*8. + fract(s.y*296.234) +
                 fract(s.z*32.924)*8. + fract(s.z*296.234))*98.397 );*/
}

vec3 desaturate(vec3 col)
{
    float bw = (min(col.r, min(col.g, col.b))) + (max(col.r, max(col.g, col.b))) * 0.5;
    return vec3(bw, bw, bw);
}

// this is just some placeholder garbage for now 
vec3 color_function(in vec3 x)
{
    float a = rand(x * 0.4  + 0.25);
	float b = rand(x * 0.32  + 0.4);
	float c = rand(x * 0.21 + 0.22);

	return vec3(a, b, c);
}

void mainImage( out vec4 frag_color, in vec2 frag_coord )
{
    //screen uv coord
	vec2 R = i_resolution.xy,
        uv = (frag_coord - 0.5*R) / i_resolution.y;
    
    //setup simple camera ray
	vec3 rp = vec3(i_time * 0.14, i_time * 0.91, mod(i_time, 120.0) + 50.0);
    //vec3 rp = vec3(i_time*0.14,i_mouse.y/50.+i_time*0.091,mod(i_time,100.)+i_mouse.x/50.);
    vec3 rd = normalize(vec3(uv,1.));
    
    //color accumulation and distance ray travelled
    vec3 c = vec3(0.);
    float s = 0.;
    
    for (int i = 0; i < NUM_ITERATIONS; i++) {
        vec3 hp = rp+rd*s;
        
        float a = (0.09+0.02*rand(hp*0.09127));
        float b = fbm(hp.xy);
        //float xx = a * 1.77 * b;
        float fade = 1.0 * pow(normalize(length(hp)), 0.22); // - pow(fract(length(hp)), 0.444 * sin(i_time) * 0.25);
        //float fade = 1.0;
        float xx = b * fade;
        
        //color sample at point
        vec2 tex_pos = (hp.xy+hp.zz*sin((hp.yx+hp.z*3.)*0.25)*.035)*0.15;
        float cc = xx*mix(10.0,0.0,float(i)/128.0) * pow(xx, 1.25) * (float(i) / 30.0);

		c += color_function(hp.xyx * hp.zzz) * cc * 0.1; // * sin((hp.yx + hp.z * 3.0) * 0.25)).xyz * cc * 0.1;
        //c += color_function(vec3(tex_pos, cc)); 
        // TODO : need a real texture sampler here.....
        //c += texture(iChannel0,tex_pos).xyz*cc*0.1;
        //c += texture(iChannel0,(hp.xy+hp.zz*sin((hp.yx+hp.z*3.)*0.25)*.035)*0.15).xyz*cc*0.1;
        //step ray forward
        s += a;
    }

    c = pow(c, vec3(0.9 * sin(i_time * 0.01) + 0.12));
    
    frag_color = vec4(pow(c,vec3(4.)),1.);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
