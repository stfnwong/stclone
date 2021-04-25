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

	vec3 color1 = vec3(1.0, 0.0, 0.0);
	vec3 color2 = vec3(0.0, 0.233, 0.337);

	color1 = color1 + vec3(noise_2d(rp.xz * 8.1), noise_2d(rp.xz * 0.998), noise_2d(rp.zx)) * 0.20;
	color2 = color2 + vec3(noise_2d(rp.xz * 2.0), noise_2d(rp.zx * 0.44), noise_2d(rp.zx)) * 0.22;

	float s = 1.0 - abs(dot(n, vec3(0.0, 1.0, 0.0)));
	vec3 col = mix(color1, color2, clamp(s, smin, smax));
    col = col * 0.3 + col * kd;
	//float col_var = (noise_2d(rp.xz * 225.0) + noise_2d(rp.zx * 225.0)) * 0.5;
	//col = col * col_var;

	frag_color = vec4(col, 1.0);
}

void main(void)
{
  mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
