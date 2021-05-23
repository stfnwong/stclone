/*
Another attempt at terrain marching with mood lighting

*/

#version 330 core 

#define PI 3.141592653589793 

// Uniforms
in vec2 position_out;
out vec4 out_color;

uniform float i_time;
uniform float i_time_delta;
uniform vec2  i_resolution;
uniform vec4  i_mouse;

const int MAX_SOFT_SHADOW_ITER = 50;
const int MAX_INTERSECT_STEPS = 64;

const float MAX_LENGTH = 180.0;
const vec3 LIGHT_DIRECTION = normalize(vec3(1.0, -0.3, -0.4));
const vec3 LIGHT_COLOR = normalize(vec3(0.750, 0.819, 0.980));

// fog emulation
const float FOG_HEIGHT = 0.01;     // height of background fog
const float FOG_FADE_HEIGHT = 0.2; // fade the fog into the background (ie: "sky") at this height
const vec3 FOG_COLOR = vec3(0.3373, 0.3345, 0.3557); 

// noise generator 
float random(in vec2 st) { 
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}


// 2D noise generator
float noise_2d(vec2 uv) {
	vec2 st = 0.1 * uv;
	vec2 i = floor(st);
	vec2 f = fract(st);

	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));

	vec2 u = f * f * (3.0 - 2.0 * f);
	float a1 = mix(a, b, u.x);
	float a2 = mix(c, d, u.x);
	float a3 = mix(a1, a2, u.y);

	return clamp(a3, 0.0, 1.0);
}


// Fractal Brownian Motion 
float fbm(vec2 st) {
	float val = 0.0;
	float amp = 0.5;
	float freq = 0.4;

	const int num_octaves = 4;
	for(int i = 0; i < num_octaves; ++i) {
		val += amp * noise_2d(st * freq);
		st *= 2.0;
		amp *= 0.5;
		freq *= 1.02;
	}

	return val;
}

// rotation functions
mat3 rotate_x(float n) {
	float cn = cos(n);
	float sn = sin(n);

	return mat3(cn, 0.0, sn,
				0.0, 1.0, 0.0,
				-sn, 0.0, cn);
}

mat3 rotate_y(float n) {
	float cn = cos(n);
	float sn = sin(n);

	return mat3(1.0, 0.0, 0.0,
				0.0, cn, sn,
				0.0, sn, cn);

}

// Height function for terrain
float terrain(vec2 st) {
	float a = fbm(st.xy * 1.9) + 1.0;

	a = abs(1.0 - a) * 15.5 - 2.0;
	float b = fbm(st.yx * 33.333);
	float v = a - b * (a * 0.2);

	return v;
}

// adjust terrain displacement
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

// alternate terrain function
vec4 map(in vec3 p)
{
    float h = terrain(p.xz);
    float dis = displacement(0.25 * p * vec3(1.0, 1.4, 1.0));
    dis *= 3.0;

    return vec4((dis + p.y - h) * 0.25, p.x, h, 0.0);
}

vec4 intersect(in vec3 ro, in vec3 rd, in float tmax)
{
    float t = 0.1;
    vec3 res = vec3(0.0);
    float eps = 0.001;

    for(int i = 0; i < MAX_INTERSECT_STEPS; ++i)
    {
        vec3 pp = ro + rd * t;
        vec4 tmp = map(pp);
        res = tmp.ywx;
        t += tmp.x;
        eps *= 1.01;
        if(tmp.x < (eps * (t + 1.0)) || t > tmax)
            break;
    }

    return vec4(t, res);
}

// Raymarching loop
vec2 raymarch(vec3 ro, vec3 rd, out int mat_type) {
	float height = -1.0;
	float t = 0.02;
	float tmax = MAX_LENGTH;
    float eps = 0.001;

	for(;t <  tmax;) {
		int m = 0;
		vec3 rp = ro + rd * t;
		//float h = terrain(rp.xz, m);
		float h = terrain(rp.xz);
		float d = rp.y - h;

		if(d < 0.01) {
			height = h;
			mat_type = m;
			break;
		}

		t += 0.5 * d;
	}

	return vec2(height, t);
}

// fake soft shadow 
float soft_shadow(in vec3 ro, in vec3 rd, float tmin, float k)
{
    float res = 1.0;
    float t = tmin;
    for(int i = 0; i < MAX_SOFT_SHADOW_ITER; ++i)
    {
        float h = terrain(vec3(ro + rd).xz * t);
        //float h = terrain(vec3(ro + rd).xz * t).x
        res = min(res, k * h / t);
        t += clamp(h, 0.5, 1.0);
        if(h < 0.001)
            break;
    }

    return clamp(res, 0.0, 1.0);
}

// Approximate a normal
vec3 get_normal(vec3 rp) {
	int unused = 0;
	vec2 eps = vec2(0.01, 0.0);
	vec3 normal = normalize(
		vec3(
			 terrain(rp.xz + eps.xy) - terrain(rp.xz - eps.xy),
			 2.0 * eps.x,
			 terrain(rp.xz - eps.yx) - terrain(rp.xz + eps.yx)
		)
	);

	return normal;
}


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

// shadow
vec3 get_shading(vec3 p, vec3 ld, vec3 n) {
	int unused;

	// lambertian
	float kd = max(0.0, dot(-ld, n));
	// now cast a shadow ray
	vec3 a = p + vec3(0.0, 1.0, 0.0);
	//vec2 s = terrain(a, -LIGHT_DIRECTION, unused);
	vec2 s = raymarch(a, -LIGHT_DIRECTION, unused);
	float sh = (s.x == -1.0) ? 1.0 : 0.0;

	return (kd * LIGHT_COLOR * sh);
}

vec3 sky(vec3 ro, vec3 rd, vec2 st) {
	vec3 col = vec3(0.6, 0.8, 0.77);

	col += smoothstep(0.3, 0.6, fbm(rd.xz * 90.0 / rd.y));

	// simulate a light
	float d = dot(-LIGHT_DIRECTION, rd);
	if(d > 0.0) 
		col = mix(col, vec3(1.0, 1.0, 0.44), pow(d, 20.0));
	if(rd.y < FOG_FADE_HEIGHT)
		col = mix(FOG_COLOR, col, (rd.y - FOG_HEIGHT) / (FOG_FADE_HEIGHT - FOG_HEIGHT));
	if(rd.y < FOG_HEIGHT)
		col = FOG_COLOR;

	return clamp(col, 0.0, 1.0);  
}
	
// a bad Ambient Occlusion 
float bad_ao(vec3 n) {
	return abs(dot(n, vec3(0.0, 1.0, 0.0)));
}

float fog(float dist) {
	const float density = 0.006;
	return 1.0 - 1.0 / exp(pow(dist * density, 2.0));
}
 
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
	vec2 st = frag_coord.xy / i_resolution.xy;
	float finv = tan(60.0 * 0.25 * PI / 180.0);     // inverse of fov?

	float aspect = i_resolution.x / i_resolution.y;

	st.x = 2.0 * st.x * aspect;
	st = (st - vec2(aspect * 0.2, 1.0)) * finv;

	vec3 rd = normalize(vec3(st, 1.0));
	rd = rotate_y(0.0002 * 0.7853) * rotate_x(0.001 - 0.19) * rd;
	rd = normalize(rd);

	vec3 ro = vec3(0.0, 14.5, 0.0);
	ro += i_time * normalize(vec3(-1.0, 0.0, 1.0));

	int mat_type = 0;
	//vec2 height = raymarch(ro, rd, mat_type);
	vec2 tmat = raymarch(ro, rd, mat_type);

    float tmax = 100.0;
    //vec4 tmat = intersect(ro, rd, tmax);       // TODO: why is this method always super slow?
    vec3 pos = ro + tmat.x * rd;

	vec3 rp = ro + tmat.y * rd;
	vec3 n = get_normal(rp);
	vec3 kd = get_shading(rp, LIGHT_DIRECTION, n);


	// range for terrain fade
	float smin = 0.05;
	float smax = 0.19;

    // color vectors 
	vec3 color1 = vec3(0.934, 0.7556, 0.8);
	vec3 color2 = vec3(0.90, 0.733, 0.7337);

    // material colors
	if(mat_type == 1) {
		color1 = vec3(0.925, 0.724, 0.776);
		color2 = vec3(0.974, 0.768, 0.412);
	}
    // supposed to be the second type of terrain material
	if(mat_type == 2) {
		color1 = color1 + vec3(noise_2d(rp.xz * 8.1), noise_2d(rp.xz * 0.998), noise_2d(rp.zx)) * 0.20;
		color2 = color2 + vec3(noise_2d(rp.xz * 5.0), noise_2d(rp.zx * 0.44), noise_2d(rp.zx)) * 0.22;
	}
	
	
	//color1 = color1 + vec3(noise_2d(rp.xz * 8.1), noise_2d(rp.xz * 0.998), noise_2d(rp.zx)) * 0.20;
	//color2 = color2 + vec3(noise_2d(rp.xz * 2.0), noise_2d(rp.zx * 0.44), noise_2d(rp.zx)) * 0.22;

	float s = 1.0 - abs(dot(n, vec3(0.0, 1.0, 0.0)));
	vec3 col = mix(color1, color2, clamp(s, smin, smax));
	
	// mix in sky
	//col = mix(col, sky(ro, rd, height), fog(height.y));

	//float col_var = (noise_2d(rp.xz * 225.0) + noise_2d(rp.zx * 225.0)) * 0.5;
	//col = col * col_var;

    vec3 back_light = normalize(vec3(-LIGHT_DIRECTION.x, 0.0, -LIGHT_DIRECTION.z));
    vec3 fill_light = vec3(0.0, 1.0, 0.0);

    float dif = diffuse(LIGHT_DIRECTION, n, -rd, 1.0);
    float bac = diffuse(back_light, n, -rd, 1.0);
    float shadow = 0.0;
    if(dif > 0.001)
        shadow = soft_shadow(pos + 0.01 * n, LIGHT_DIRECTION, 0.005, 64.0); 

    // now compute lights 
    vec3 lin = vec3(0.0);
    lin += 7.0 * dif * vec3(1.20, 0.8, 0.8) * vec3(shadow, 0.5 * shadow * shadow + 0.5, shadow * shadow);
    //lin += 1.8 * sky * 
	
    col = col * 0.3 * bad_ao(n) + col * kd * lin;
	col = mix(col, FOG_COLOR, fog(tmat.y));

	if(tmat.x == -1.0)
		col = sky(ro, rd, st);

	frag_color = vec4(col, 1.0);
}

void main(void)
{
  mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
