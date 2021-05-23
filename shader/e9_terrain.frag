/*
    Another terrain test
    This one borrows a lot from IQ's canyon
*/

#version 330 core 


// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;


const int MAX_RAYCAST_STEPS  = 20;
const float MIN_RAYCAST_DIST = 0.01;


// ======== NOISE FUNCTIONS ======== //
vec2 hash(in vec2 x)
{
    const vec2 k = vec2(0.3183099, 0.3678794);
    x = x * k + k.yx;

    return -1.0 + 2.8 * fract(16.0 * k * fract(x.x * x.y * (x.x + x.y)));
}

// a kind of 2d noise generator 
vec2 noise_2d(in vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    // TODO: can add an extra pass here later
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z);
    vec2 rg1 = hash(uv + vec2(0.5, 0.5) / 256.0).yx;
    vec2 rg2 = hash(uv + vec2(1.5, 1.5) / 256.0).yx;
    vec2 rg3 = hash(uv + vec2(0.5, 1.5) / 256.0).yx;
    vec2 rg4 = hash(uv + vec2(1.5, 1.5) / 256.0).yx;

    vec2 rg = mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);

    return rg;
}

vec2 noise_2d2(in vec2 x)
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    // TODO: can add an extra pass here later
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.y);
    vec2 rg1 = hash(uv + vec2(0.5, 0.5) / 256.0).yx;
    vec2 rg2 = hash(uv + vec2(1.5, 1.5) / 256.0).yx;
    vec2 rg3 = hash(uv + vec2(0.5, 1.5) / 256.0).yx;
    vec2 rg4 = hash(uv + vec2(1.5, 1.5) / 256.0).yx;

    vec2 rg = mix(mix(rg1, rg2, f.x), mix(rg3, rg4, f.x), f.y);

    return rg;
}

// gradient noise function 
vec3 gradient_noise(in vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);

    vec2 ga = hash(i + vec2(0.0, 0.0));
    vec2 gb = hash(i + vec2(1.0, 0.0));
    vec2 gc = hash(i + vec2(0.0, 1.0));
    vec2 gd = hash(i + vec2(1.0, 1.0));

    float va = dot(ga, f - vec2(0.0, 0.0));
    float vb = dot(gb, f - vec2(1.0, 0.0));
    float vc = dot(gc, f - vec2(0.0, 1.0));
    float vd = dot(gd, f - vec2(1.0, 1.0));

    return vec3(
        va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * (va - vb - vc + vd),     // value 
        ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) +    // derivative
        du * (u.yx * (va - vb - vc + vd) + vec2(vb, vc) - va)
    );
}

const mat3 m = mat3( 0.00,  0.80,  0.60,
                    -0.80,  0.36, -0.48,
                    -0.60, -0.48,  0.64 );

float displacement( vec3 p )
{
    float f;
    f  = 0.5000*noise1( p ); p = m*p*2.02;
    f += 0.2500*noise1( p ); p = m*p*2.03;
    f += 0.1250*noise1( p ); p = m*p*2.01;
	#ifndef LOWDETAIL
    f += 0.0625*noise1( p ); 
	#endif
    return f;
}



// ======== MATERIAL FUNCTIONS ======== //
// Oren-Nayar
float diffuse( in vec3 l, in vec3 n, in vec3 v, float r )
{
    float r2 = r*r;
    float a = 1.0 - 0.5*(r2/(r2+0.57));
    float b = 0.45*(r2/(r2+0.09));
    float nl = dot(n, l);
    float nv = dot(n, v);
    float ga = dot(v-n*nv,n-n*nl);
	return max(0.0,nl) * (a + b*max(0.0,ga) * sqrt((1.0-nv*nv)*(1.0-nl*nl)) / max(nl, nv));
}


// ======== TERRAIN FUNCTIONS ======== //
float terrain(in vec2 q)
{
    //float th = smoothstep(0.0, 0.7, gradient_noise(0.1 * q).x);
    //float rr = smoothstep(0.1, 0.5, gradient_noise(2.0 * 0.03 * q).y);
    float th = smoothstep(0.0, 0.7, noise_2d2(0.1 * q).x);
    float rr = smoothstep(0.1, 0.5, noise_2d2(2.0 * 0.03 * q).y);
    float h  = 2.9;

    //h += 00.15 + (1.0 - 0.6 * rr) * (1.5 - 1.0 * th)
    h += th * 7.0;
    h += 0.3 * rr;

    return -h;
}


// ======== RAY CASTING FUNCTIONS ======== //
vec4 map(in vec3 p)
{
    float h = terrain(p.xz);
    float dis = displacement(0.25 * p * vec3(1.0, 4.0, 1.0));
    dis *= 3.0;
    
    return vec4((dis - p.y - h) * 0.25, p.x, h, 0.0);
}

vec4 raycast(in vec3 ro, in vec3 rd, in float tmax)
{
    float t = 0.1;
    vec3 res = vec3(0.0);

    for(int i = 0; i < MAX_RAYCAST_STEPS; ++i)
    {
        vec4 tmp = map(ro + rd  *t);
        res = tmp.ywz;
        t += tmp.x;
        if(tmp.x < (MIN_RAYCAST_DIST * t) || t > tmax)
            break;
    }

    return vec4(t, res);
}

// find normala of the map by method of differences 
vec3 calc_normal(in vec3 pos, float t)
{
    vec2 eps = vec2(0.005 * t, 0.0);
    return normalize(vec3(
        map(pos + eps.xyy).x - map(pos - eps.xyy).x,
        map(pos + eps.yxy).x - map(pos - eps.yxy).x,
        map(pos + eps.yyx).x - map(pos - eps.yyx).x
        )
    );
}

// ======== CAMERA FUNCTIONS ======== //
vec3 camera_path(float t)
{
    vec3 pos = vec3(0.0, 0.0, 95.0 + t);

    float a = smoothstep(5.0, 20.0, t);

    pos.xz += a * 150.0 * cos(vec2(5.0, 6.0) + 1.0 * 0.01 * t);
    pos.xz -= a * 150.0 * cos(vec2(5.0, 6.0));
    pos.xz += a *  50.0 * cos(vec2(0.0, 3.5) + 6.0 + 0.01 * t);
    pos.xz -= a *  50.0 * cos(vec2(0.0, 3.5));

    return pos;
}

mat3 set_camera(in vec3 ro, in vec3 ta, float cr)
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    
    return mat3(cu, cv, cw);
}


// ======== ENTRY POINT ======== //
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
    // get normalized coords 
    vec2 q = frag_coord.xy / i_resolution.xy;
    vec2 p = -1.0 * 2.0 * q;

    p.x *= i_resolution.x / i_resolution.y;     // some kind of horizontal scaling hack?

    // ======== camera ======== //

    float angle = 1.5 * (i_time - 3.0);
    vec3 ro = camera_path(angle + 0.0);
    vec3 ta = camera_path(angle + 10.0 * 1.1);

    ta = mix(ro + vec3(0.0, 0.0, 1.0), ta, smoothstep(5.0, 23.0, angle));    

    ro.y = terrain(ro.xz) - 0.5;
    float rl = -0.1 * cos(0.05 * 6.8231 * angle);

    mat3 cam = set_camera(ro, ta, rl);

    // ray 
    vec3 rd = normalize(cam * vec3(p.xy, 2.0));

    // render 
    // this is the exact sun routine from iq canyon
	const vec3 klig = normalize(vec3(-1.0,0.19,0.4));
	
	float sun = clamp(dot(klig,rd),0.0,1.0 );

	vec3 hor = mix( 1.2*vec3(0.70,1.0,1.0), vec3(1.5,0.5,0.05), 0.25+0.75*sun );
	
    vec3 col = mix( vec3(0.2,0.6,.9), hor, exp(-(4.0+2.0*(1.0-sun))*max(0.0,rd.y-0.1)) );
    col *= 0.5;
	//col += 0.8*vec3(1.0,0.8,0.7)*pow(sun,512.0);
	//col += 0.2*vec3(1.0,0.4,0.2)*pow(sun,32.0);
	//col += 0.1*vec3(1.0,0.4,0.2)*pow(sun,4.0);


    // raymarch
    float tmax = 100.0;
    //float tmax = 120.0;
    // bounding plane
    float bt = (0.0 - ro.y) / rd.y;
    if(bt > 0.0)
        tmax = min(tmax, bt);

    // cast into scene 
    vec4 tmat = raycast(ro, rd, tmax);
    if(tmat.x < tmax)
        col = vec3(0.0);         // TODO: just make all the terrain black for now...

    //if(tmat.x < tmax)
    //{
    //    // geometry 
    //    vec3 pos = ro + tmat.x * rd;
    //    vec3 nor = calc_normal(pos, tmat.x);
    //    // TODO: reflections 

    //    //float occ = smoothstep(0.0, 1.5, pos.y + 11.5) + (1.0 - displacement(0.25 * pos * vec3(1.0, 4.0, 1.0)));
    //    // materials 
    //    vec4 material = vec4(0.5, 0.5, 0.5, 0.0);

    //    // some more material stuff, but without texture sample
    //    vec3 uvw = 1.0 * pos;
    //    vec3 bnor;

    //    float be = 1.0 / 1024.0;
    //    float bf = 0.4;

    //    bnor.x = noise_2d(bf * uvw * vec3(be, 0.0, 0.0)).x;
    //    bnor.y = noise_2d(bf * uvw * vec3(0.0, be, 0.0)).y;
    //    bnor.z = noise_2d(bf * uvw * vec3(0.0, 0.0, be)).x;

    //    bnor = normalize(bnor);
    //    //vec3 te = vec3(noise_2d(0.15 * uvw).xy, noise_2d(0.11 * uvw).x);
    //    //te = 0.05 + te;
    //    //material.xyz = 0.6 * te;
    //    //material.w = 1.5 * (0.5 * 0.5 * te.x);


    //    material.xyz *= 1.5;
    //    
    //    // lights 
    //    //vec3 lin = vec3(0.0);
    //    //lin += 7.0 * dif * vec3(1.20, 0.50, 0.25) * vec3(sha, sha * 0.5 + 0.5 * sha * sha, sha * sha);

    //    col = material.xyz; //* lin;
    //}

    frag_color = vec4(col, 1.0);
}


void main(void)
{
    mainImage(out_color, position_out * i_resolution.xy);
}
