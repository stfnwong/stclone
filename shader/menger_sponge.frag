/*
    Meneger sponge raymarching test
*/
#version 330 core 

#define NUM_INTERSECTION_ITERS 64
#define NUM_SHADOW_ITERS 64
#define NUM_ROTATION_ITERS 3
#define NUM_PATHS 32

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;



/*
    sdf_box3d()
    Signed Distance Function of a unit cube
*/
float sdf_box3d(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/*
    sdf_cross()
    Cross made of 3 unit cubes. Note that there is one more 
    optimization we can do here, but I don't care about it 
    for now.
*/
float sdf_cross(in vec3 p)
{
    float da = sdf_box3d(p.xyz, vec3(1.0));
    float db = sdf_box3d(p.yzx, vec3(1.0));
    float dc = sdf_box3d(p.zxy, vec3(1.0));

    return min(da, min(db, dc));  // union of 3 cubes
}

const mat3 ma = mat3( 0.60, 0.00,  0.80,
                      0.00, 1.00,  0.00,
                     -0.80, 0.00,  0.60 );

vec4 map(in vec3 p)
{
    float d = sdf_box3d(p,vec3(1.0));
    vec4 res = vec4( d, 1.0, 0.0, 0.0 );

    float anim = smoothstep( -0.125, 0.2, -cos(0.5*i_time) );
    //float anim = smoothstep( -0.1, 0.25, 0.5) * (0.1 * sin(0.25 * i_time)); // * sin(0.15 * i_time);
	float off = 5.45*sin( 0.01*i_time ) * 0.25 * cos(2.22 * i_time);
    //float off = 8.0 * cos(0.3 * i_time) + 0.55 * sin(0.25 * i_time);
    //float off = 1.5;
    //float off = 8.0 * sin(0.025 * i_time) * cos(i_time);
	
    float s = 1.0;
    for( int m=0; m < NUM_ROTATION_ITERS; m++ )
    {
        p = mix( p, ma*(p+off), anim ); // translate point p during rotation
	   
        vec3 a = mod( p*s, 2.0 )-1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0*abs(a));
        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc))-1.0)/s;

        if( c>d )
        {
          d = c;
          res = vec4( d, min(res.y,0.2*da*db*dc), (1.0+float(m))/4.0, 0.0 );
        }
    }

    return res;
}


vec4 intersect(in vec3 ro, in vec3 rd)
{
    float t = 0.0;
    vec4 ip = vec4(-1.0);       // intersection point
    vec4 h = vec4(1.0);
    
    // Do a fixed number of iterations 
    for(int i = 0; i < NUM_INTERSECTION_ITERS; ++i)
    {
        if(h.x < 0.002 || t > 10.0)   //
            break;

        h = map(ro + rd * t);
        ip = vec4(t, h.yzw);
        t += h.x;
    }

    if(t > 10.0)
        ip = vec4(1.0);     // we passed the cube

    return ip;
}

/*
    shadow()
*/
float shadow(in vec3 ro, in vec3 rd, float min_t, float k)
{
    float res = 1.0;
    float t = min_t;        
    float h = 1.0;

    for(int i = 0; i < NUM_SHADOW_ITERS; ++i)
    {
        h = map(ro + rd * t).x;
        res = min(res, k * h / t);
        t += clamp(h, 0.0005, 0.1);
    }

    return clamp(res, 0.0, 1.0);
}

/*
    calc_normal()
    normal by central differences 
    This is just the naive technique, next step is to use the tetrahedron method
*/
vec3 calc_normal(in vec3 p)
{
    vec3 eps = vec3(0.0001, 0.0, 0.0);
    vec3 nor;

    nor.x = map(p + eps.xyy).x - map(p - eps.xyy).x;
    nor.y = map(p + eps.yxy).x - map(p - eps.yxy).x;
    nor.z = map(p + eps.yyx).x - map(p - eps.yyx).x;

    return normalize(nor);
}

/*
    pixel_color
*/
//vec3 pixel_color(in vec2 pixel, in vec3 resolution)
//{
//    return vec3(0.0);
//}

// position of light source
vec3 light_pos = normalize(vec3(1.0, 0.9, 0.3));

/*
    render()
    Raymarch routine 
*/
vec3 render(in vec3 ro, in vec3 rd)
{
    vec3 col1 = vec3(0.31, 0.32, 0.31);
    vec3 col2 = vec3(0.24, 0.22, 0.21);
    float mix_factor = 0.50;

    
    vec3 col = mix(col1 * mix_factor, col2, 0.5 * rd.x);     // background color

    vec4 tmat = intersect(ro, rd);      // origin, direction
    if(tmat.x > 0.0)
    {
        vec3 pos = ro + tmat.x * rd;
        vec3 norm = calc_normal(pos);
        
        float occ = tmat.y;
        float sun = clamp(dot(norm, light_pos), 0.0, 1.0);
        float diff = max(0.1 + 0.87  * dot(norm, light_pos), 0.00);
        float shad = shadow(pos, light_pos, 0.001, 44.5);
        float back = max(0.4 + 0.6 * dot(norm, vec3(-light_pos.x, light_pos.y, -light_pos.z)), 0.0);
        float sky = clamp(0.5 + 0.5 * norm.y, 0.0, 1.0);
        float indirect = clamp(dot(norm, normalize(light_pos * vec3(-1.0, 0.0, -1.0))), 0.0, 1.0);
        //shad = shad * max(0.1 + 0.9 * dot(norm, light_pos), 0.0) * tmat.y;

        vec3 lin = sun * vec3(1.64, 1.27, 0.99) * pow(vec3(shad), vec3(1.0, 1.2, 1.5));
        lin += sky * vec3(0.16, 0.20, 0.28) * occ;
        lin += indirect * vec3(0.40, 0.28, 0.20) * occ;

        vec3 matcol = vec3(
            0.5 * 0.5 + cos(0.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(1.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(2.0 + 2.0 * tmat.z)
        );
        col = matcol * lin;
    }

    return pow(col, vec3(1.0/2.2));
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    //float shutter_apeture = 0.6;
    //float fov = 2.5;
    //float focus_distance = 1.3;
    //float blur_amt = 0.0015;
    //int   num_levels = 5;


    // camera position 
    // For this we just made the camera rotate around x 
    vec3 cam_pos = 0.2 * vec3(2.8 * sin(0.25 * i_time), 10.15 * cos(i_time * 0.13), 25.0 * cos(0.13 * i_time));
    //vec3 cam_pos = 0.1 * vec3(2.5 * cos(i_time), 0.33 * sin(0.25 * i_time), 0.5 * sin(2.02 * i_time));

    // Do AA, blur, and so on here

    vec2 p = (2.0 * frag_coord - i_resolution.xy) / i_resolution.y;
    vec3 ww = normalize(vec3(0.0) - cam_pos);
    vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));        // ww is the cameras w coord
    vec3 vv = normalize(cross(ww, uu));
    vec3 rd = normalize(p.x * uu + p.y * vv + 2.5 * ww);

    vec3 color = render(cam_pos, rd);     

    frag_color = vec4(color, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
