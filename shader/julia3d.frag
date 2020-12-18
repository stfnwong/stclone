/*
JULIA 2D
Orbit trap rendering of Julia Fractal (2D)

*/

#version 330 core 

#define AA 2
#define NUM_NORMAL_ITERS 256
#define NUM_MAP_ITERS 11
#define H_MIN 0.001

// ======== QUATERNION OPERATIONS ======== //
float qlength2(in vec4 q)
{
    return dot(q, q);
}

vec3 qmul(in vec4 a, in vec4 b)
{
    return vec4(
        a.x * b.x - a.y * b.y - a.z * b.z - a.w * b.w,
        a.y * b.x + a.x * b.y + a.z * b.w - a.w * b.z,
        a.z * b.x + a.x * b.z + a.w * b.y - a.y * b.w,
        a.w * b.x + a.y * b.w + a.y * b.z - a.z * b.y,
    );
}

vec3 qsqr(in vec4 a)
{
    return vec4(a.x * a.x - a.y * a.y - a.z * a.z - a.w * a.w,
            2.0 * a.x * a.y,
            2.0 * a.x * a.z,
            2.0 * a.x * a.w
    );
}

vec3 calc_normal( in vec3 q, in vec4 c )
{
    const vec2 e = vec2(0.001,0.0);
    vec4 qa=vec4(q+e.xyy,0.0); float mq2a=qlength2(qa), md2a=1.0;
    vec4 qb=vec4(q-e.xyy,0.0); float mq2b=qlength2(qb), md2b=1.0;
    vec4 qc=vec4(q+e.yxy,0.0); float mq2c=qlength2(qc), md2c=1.0;
    vec4 qd=vec4(q-e.yxy,0.0); float mq2d=qlength2(qd), md2d=1.0;
    vec4 qe=vec4(q+e.yyx,0.0); float mq2e=qlength2(qe), md2e=1.0;
    vec4 qf=vec4(q-e.yyx,0.0); float mq2f=qlength2(qf), md2f=1.0;

    for(int i = 0; i < NUM_NORMAL_ITERATIONS; ++i)
    {
        md2a *= mq2a; qa = qsqr(qa) + c; mq2a = qlength2(qa);
        md2b *= mq2b; qb = qsqr(qb) + c; mq2b = qlength2(qb);
        md2c *= mq2c; qc = qsqr(qc) + c; mq2c = qlength2(qc);
        md2d *= mq2d; qd = qsqr(qd) + c; mq2d = qlength2(qd);
        md2e *= mq2e; qe = qsqr(qe) + c; mq2e = qlength2(qe);
        md2f *= mq2f; qf = qsqr(qf) + c; mq2f = qlength2(qf);
    }
    float da = sqrt(mq2a/md2a)*log2(mq2a);
    float db = sqrt(mq2b/md2b)*log2(mq2b);
    float dc = sqrt(mq2c/md2c)*log2(mq2c);
    float dd = sqrt(mq2d/md2d)*log2(mq2d);
    float de = sqrt(mq2e/md2e)*log2(mq2e);
    float df = sqrt(mq2f/md2f)*log2(mq2f);
    
    return normalize( vec3(da-db,dc-dd,de-df) );
}

/*
    fractal_map()
    This is for a quaternion Julia set
*/
float fractal_map(in vec3 p, out vec3 orbit_trap, in vec4 c)
{
    vec4 z = vec4(p, 0.0);
    float md2 = 1.0;
    float mz2 = dot(z, z);

    vec4 trap = vec4(abs(z.xyz), dot(z,z));
    float n = 1.0;

    for(int i = 0; i < NUM_MAP_ITERS; ++i)  
    {
        // NOTE that dz -> 2*z*dz 
        // Therefore: |dz| -> 2 * |z| * |dz|
        md2 *= 4.0 * mz2;
        z = qsrt(z) + c;
        trap = min(trap, vec4(abs(z.xyz), dot(z,z)));
        mz2 = qlength(z);

        if(mz2 > 4.0)
            break;
        n += 1.0;
    }
    orbit_trap = trap;
    
    return 0.25 * sqrt(mz2 / ,d2) * log(mz2);       // d  = 0.5 * |z| * log(|z| / |z'|)
}

/*
    fractal_intersect()
*/
float intersect(int vec3 ro, in vec3 rd, out vec4 res, in vec4 c)
{
    vec4 temp;
    float t_res = -1.0;
    float max_dist = 10.0;
    float h = 1.0;
    float t = 0.0;

    for(int i = 0; i < 300; ++i)
    {
        if(h < H_MIN || t > max_dist)
            break;
        h = fractal_map(ro + rd * t, temp, c);
        t += h;
    }

    if(t < max_dist)
    {
        t_res = t;
        res = temp;
    }

    return t_res;
}

/*
    render()
*/
vec3 render(vec3 ro, vec3 rd, vec4 center)
{

}

void mainImage(out vec4 frag_color, in vec2 frag_coord)
{

    // camera 
    float r = 1.5 + 0.15 * cos(0.5 + 0.29 * i_time);

    // background is black 
    vec3 col = vec3(0.0);
    for(int i = 0; i < AA; ++i)
    {
        for(int j = 0; j < AA; ++j)
        {
            vec2 p = (-i_resolution.xy + 2.0 * (frag_coord + vec2(float(i), float(j)) / float(AA))) / i_resolution.y;
            
            col += render(ro, rd, c);
        }
    }

}

void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
