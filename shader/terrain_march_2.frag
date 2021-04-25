/*
Another attempt at terrain marching

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

const float MAX_LENGTH = 180.0;
const vec3 LIGHT_DIRECTION = normalize(vec3(1.0, -0.3, -0.4));
const vec3 LIGHT_COLOR = normalize(vec3(0.950, 0.619, 0.180));

// fog emulation
const float FOG_HEIGHT = 0.01;     // height of background fog
const float FOG_FADE_HEIGHT = 0.2; // fade the fog into the background (ie: "sky") at this height
const vec3 FOG_COLOR = vec3(0.9774, 0.7345, 0.655);     // color of the fog

// Random noise generator 
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
		freq *= 1.22;
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

	a = abs(1.0 - a) * 17.5 - 4.0;
	float b = fbm(st.yx * 33.333);
	float v = a - b * (a * 0.2);

	return v;
}

// Raymarching loop
vec2 raymarch(vec3 ro, vec3 rd, out int mat_type) {
	float height = -1.0;
	float t = 0.02;
	float tmax = MAX_LENGTH;

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
	float finv = tan(90.0 * 0.5 * PI / 180.0);     // inverse of fov?

	float aspect = i_resolution.x / i_resolution.y;

	st.x = st.x * aspect;
	st = (st - vec2(aspect * 0.5, 0.5)) * finv;

	vec3 rd = normalize(vec3(st, 1.0));
	rd = rotate_y(0.0002 * 0.7853) * rotate_x(0.001 - 0.19) * rd;
	rd = normalize(rd);

	vec3 ro = vec3(0.0, 14.5, 0.0);
	ro += i_time * normalize(vec3(-1.0, 0.0, 1.0));

	int mat_type = 0;
	vec2 height = raymarch(ro, rd, mat_type);

	vec3 rp = ro + height.y * rd;
	vec3 n = get_normal(rp);
	vec3 kd = get_shading(rp, LIGHT_DIRECTION, n);

	// range for terrain fade
	float smin = 0.05;
	float smax = 0.19;

	vec3 color1 = vec3(0.934, 0.7556, 0.0);
	vec3 color2 = vec3(0.0, 0.233, 0.7337);

	if(mat_type == 1) {
		color1 = vec3(0.925, 0.724, 0.576);
		color2 = vec3(0.474, 0.368, 0.212);
	}

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
	
    col = col * 0.3 * bad_ao(n) + col * kd;
	col = mix(col, FOG_COLOR, fog(height.y));

	if(height.x == -1.0)
		col = sky(ro, rd, st);

	frag_color = vec4(col, 1.0);
}

void main(void)
{
  mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
