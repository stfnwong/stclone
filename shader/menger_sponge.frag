/*
    Meneger sponge raymarching test
*/
#version 330 core 

#define NUM_INTERSECTION_ITER 64

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


vec4 map(in vec3 p)
{
    float d = sdf_box3d(p, vec3(1.0));        // distance to unit cube
    float c = sdf_cross(p * 3.0) / 3.0;
    d = max(d, -c);

    return vec4(d, 1.0, 1.0, 1.0);
}


vec4 intersect(in vec3 ro, in vec3 rd)
{
    float t = 0.0;
    vec4 ip = vec4(-1.0);       // intersection point
    vec4 h = vec4(1.0);
    
    // Do a fixed number of iterations 
    for(int i = 0; i < NUM_INTERSECTION_ITER; ++i)
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


// normal by central differences 
// This is just the naive technique, next step is to use the tetrahedron method
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
    render()
    Raymarch routine 
*/
vec3 render(in vec3 ro, in vec3 rd)
{
    vec3 col = mix(vec3(0.1, 0.15, 0.24) * 0.5, vec3(0.56, 0.7, 0.7), 0.5 + 0.5 * rd.y);  // z = dist from camera, try that
    
    vec4 tmat = intersect(ro, rd);      // origin, direction

    if(tmat.x > 0.0)
    {
        //vec3 pos = rp + tmat.x * rd;
        //vec3 norm = calc_normal(pos);

        // TODO: provide more sophisticated colors
        vec3 col = vec3(
            0.5 * 0.5 + cos(0.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(1.0 + 2.0 * tmat.z),
            0.5 * 0.5 + cos(2.0 + 2.0 * tmat.z)
        );
    }

    return pow(col, vec3(0.45));
}


void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // camera position 
    // For this we just made the camera rotate around x 
    vec3 cam_pos = 0.1 * vec3(2.5 * sin(0.25 * i_time), cos(i_time), cos(i_time));

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
