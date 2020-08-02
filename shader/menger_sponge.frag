/*
    Meneger sponge raymarching test
*/
#version 330 core 

#define NUM_INTERSECTION_ITERS 64
#define NUM_SHADOW_ITERS 64
#define NUM_ROTATION_ITERS 4

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

    //float ani = smoothstep( -0.2, 0.2, -cos(0.5*i_time) );
	//float off = 1.5*sin( 0.01*i_time );
    float ani = smoothstep( -0.2, 0.2, 0.5) * 0.25 * sin(0.01 * i_time);
	//float off = 5.45*sin( 0.01*i_time ) * 0.25 * cos(2.22 * i_time);
    float off = 0.0;
	
    float s = 1.0;
    for( int m=0; m<NUM_ROTATION_ITERS; m++ )
    {
        p = mix( p, ma*(p+off), ani ); // translate point p during rotation
	   
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

// position of ,light source
vec3 light = normalize(vec3(1.0, 0.9, 0.3));
/*
    render()
    Raymarch routine 
*/
vec3 render(in vec3 ro, in vec3 rd)
{
    vec3 col1 = vec3(0.11, 0.12, 0.7);
    vec3 col2 = vec3(0.34, 0.32, 0.31);
    float mix_factor = 0.55;
    
    vec3 col = mix(mix_factor * col1, col2, 0.5 + 0.5 * rd.z);
    
    //vec3 col = mix(vec3(0.1, 0.15, 0.24) * 0.5, vec3(0.56, 0.7, 0.7), 0.5 + 0.5 * rd.z);  // z = dist from camera, try that
    vec4 tmat = intersect(ro, rd);      // origin, direction

    if(tmat.x > 0.0)
    {
        vec3 pos = ro + tmat.x * rd;
        vec3 norm = calc_normal(pos);

        float occ = tmat.y;
        float diff = max(0.1 + 0.77  * dot(norm, light), 0.00);
        float shad = shadow(pos, light, 0.02, 76.5);
        float back = max(0.4 + 0.6 * dot(norm, vec3(-light.x, light.y, -light.z)), 0.0);
        //shad = shad * max(0.1 + 0.9 * dot(norm, light), 0.0) * tmat.y;
        vec3 lin = vec3(0.0);
        lin += 1.00 * diff * vec3(0.2, 0.73, 0.6) * shad;
        lin += 0.25 * occ * vec3(0.15, 0.17, 0.08);
        lin += 0.22 * back * vec3(1.00, 1.00, 1.00) * (0.5 + 0.5 * occ);

        // TODO: provide more sophisticated colors
        vec3 matcol = vec3(
            0.5 * 0.5 + cos(0.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(1.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(2.0 + 2.0 * tmat.z)
        );
        col = matcol * lin;
    }

    return pow(col, vec3(0.44));
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // camera position 
    // For this we just made the camera rotate around x 
    vec3 cam_pos = 1.1 * vec3(1.5 * sin(0.25 * i_time), 0.1 * cos(i_time * 1.13), cos(0.13 * i_time));
    //vec3 cam_pos = 0.1 * vec3(2.5 * cos(i_time), 0.33 * sin(0.25 * i_time), 0.5 * sin(2.02 * i_time));

    // TODO: add anti-aliasing 
    vec2 p = (2.0 * frag_coord - i_resolution.xy) / i_resolution.y;
    vec3 ww = normalize(vec3(0.0) - cam_pos);
    vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));        // ww is the cameras w coord
    vec3 vv = normalize(cross(ww, uu));
    vec3 rd = normalize(p.x * uu + p.y * vv + 2.5 * ww);

    vec3 color = render(cam_pos, rd);     // rd is the direction vector?

    frag_color = vec4(color, 1.0);
}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
