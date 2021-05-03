/* 
A sort of copy of another terrain marching implementation
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


const float SC = 250.0;     // 
const int TERRAIN_MID_ITER = 9;
const int TERRAIN_HIGH_ITER = 16;
const float k_max_t = 2500.0 * SC;

const int FBM_NUM_OCTAVES = 4;

float rand(vec2 co){
   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand2(vec2 co){
   return fract(cos(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}



// value noise and analytical derivatives
vec3 analytic_noise(in vec2 x) {
  vec2 f = fract(x);
  // do some smoothing to prevent discontinuities
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);

  // TODO: sample these from a texture later
  vec2 p = floor(x);
  float a = rand2(p);
  float b = rand2(p + vec2(1.0, 0.0));
  float c = rand2(p + vec2(0.0, 1.0));
  float d = rand2(p + vec2(1.0, 1.0));

  vec3 dd = vec3(a + (b - a) * u.x + (c - a) * u.y + (a-b-c+d) * u.x * u.y,
			     du * (vec2(b-a, c-a) + (a-b-c+d)*u.yx));

  return dd;
}


// test noise - keep this until the texture loading is working
float value_noise_simple(in vec2 p) {
  const vec2 vv = vec2(0.0, 1.0);

  vec2 interp = smoothstep(vec2(0.0), vec2(1.0), fract(p));
  vec2 grid   = floor(p);

  return mix(
	mix(rand2(grid + vv.xx),
		rand2(grid + vv.yx),
		interp.x),
	mix(rand2(grid + vv.xy),
		rand2(grid + vv.yy),
		interp.x),
	interp.y);

}

// a really basic noise gen
float simple_noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = rand2(i);
  float b = rand2(i + vec2(1.0, 0.0));
  float c = rand2(i + vec2(0.0, 1.0));
  float d = rand2(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 * u.x) + (d - b) * u.x * u.y;
}


// one iteration of fractal brownian motion
float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;

  for(int i = 0; i < FBM_NUM_OCTAVES; ++i) {
	val += amp * value_noise_simple(p);
	p *= 2.0;
	amp *= 0.5;
  }

  return val;
}

const mat2 m2 = mat2(0.8, -0.6, 0.6, 0.8);

// mid level terrain functiom
float terrain_mid(in vec2 x) {
  
  vec2 p = x * 0.003 / SC;
  float a = 0.0;
  float b = 1.0;
  vec2 d = vec2(0.0);

  for(int i = 0; i < TERRAIN_MID_ITER; ++i) {
	vec3 n = analytic_noise(p);
	d += n.yz;
	a += b * n.x / (1.0 + dot(d, d));
	b *= 0.5;
	p = m2 * p * 2.0;
  }

  return SC * 120.0 * a;
}

// upper-level terrain function
float terrain_high(in vec2 x) {
  vec2 p = x * 0.003 / SC;
  float a = 0.0;
  float b = 1.0;
  vec2 d = vec2(0.0);

  for(int i = 0; i < TERRAIN_HIGH_ITER; ++i) {
	vec3 n = analytic_noise(p);
	d += n.yz;
	a += b * n.x / (1.0 + dot(d, d));
	b *= 0.5;
	p = m2 * p * 2.0;
  }

  return SC * 120.0 * a;
} 

// cast a ray into the scene
float ray_cast(in vec3 ro, in vec3 rd, in float tmin, in float tmax) {
  float t = tmin;

  for(int i = 0; i < 100; ++i) {
	vec3 pos = ro + t * rd;
	float h = pos.y - terrain_mid(pos.xz);
	if(abs(h) < (0.0015 * t) || t > tmax)
	  break;
	t += 0.4 * h;
  }
  
  return t;
}

// compute normals by central differences
vec3 calc_normal(in vec3 pos, in float t) {
  vec2 eps = vec2(0.001 * t, 0.0);

  return normalize(
				   vec3(terrain_high(pos.xz - eps.xy) - terrain_high(pos.xz + eps.xy),
				        2.0 * eps.x,
						terrain_high(pos.xz - eps.yx) - terrain_high(pos.xz - eps.yx)
						)
				   );
  }    // why the fuck does glsl-mode enforce this fucking brace style by default???


// main rendering loop
vec4 render(in vec3 ro, in vec3 rd) {

  // start with just the renderer from Elevated
  vec3 light1 = normalize(vec3(-0.8, 0.4, -0.3));
  // bounding plane
  float t_min = 1.0;
  float t_max = k_max_t;

  float max_h = 250.0 * SC;
  float tp = (max_h - ro.y) / rd.y;

  if(tp > 0.0) {
	if(ro.y > max_h)
	  t_min = max(t_min, tp);
	else
	  t_min = min(t_max, tp);
  }

  float sundot = clamp(dot(rd, light1), 0.0, 1.0);
  vec3 col;

  //float t = ray_cast(ro, rd, t_min, t_max);
  float t = t_min + 0.01;

  if(t > t_max) {
	// sky
	col = vec3(0.3, 0.5, 0.85) - rd.y * rd.y * 0.5;
	col = mix(col, 0.85 * vec3(0.7, 0.75, 0.85), pow(1.0 - max(rd.y, 0.0), 4.0));
	// sun
	col += 0.25 * vec3(1.0, 0.7, 0.4) * pow(sundot, 5.0);      // does the gamma here do lens flare?
	col += 0.25 * vec3(1.0, 0.8, 0.6) * pow(sundot, 64.0);
	col += 0.2  * vec3(1.0, 0.8, 0.6) * pow(sundot, 512.0);
	// clouds
	vec2 sc = ro.xz + rd.xz * (SC * 1000.0 - ro.y) / rd.y;
	col = mix(col, 0.68 * vec3(0.4, 0.65, 1.0), 0.5 * smoothstep(0.5, 0.8, fbm(0.0005 * sc / SC)));
	// horizon
	col = mix(col, 0.68 * vec3(0.4, 0.65, 1.0), pow(1.0 - max(rd.y, 0.0), 16.0));
	t = -1.0;
	}
  else {
	// terrain
	vec3 pos = ro + rd * t;
	vec3 nor = calc_normal(pos, t);
	vec3 ref = reflect(rd, nor);
	float fre = clamp(1.0 + dot(rd, nor), 0.0, 1.0);
	vec3 hal = normalize(light1 - rd);

	// rock (this requires implementation of the texture sampler)
	//float r = texture(i_channel0, (7.0 / SC) * pos.xz / 256.0).x;
	//col = (r * 0.25 + 0.75) * 0.9 * mix(vec3(0.08, 0.05, 0.03), vec3(0.10, 0.09, 0.08), texture(i_channel0, 0.0007 * vec2(pos.x, pos.y * 48.0) / SC).x);
	float r = fbm((7.0 / SC) * pos.xz / 256.0);
	col = (r * 0.25 + 0.75) * 0.9 * mix(vec3(0.08, 0.05, 0.03), vec3(0.10, 0.09, 0.08), fbm(0.007 * vec2(pos.x, pos.y * 48.0)));
	
	col = mix(col, 0.20 * vec3(0.45, 0.30, 0.15) * (0.50 + 0.50 * r), smoothstep(0.7, 0.9, nor.y));
	col = mix(col, 0.15 * vec3(0.30, 0.30, 0.10) * (0.25 + 0.75 * r), smoothstep(0.95, 1.0, nor.y));
	//col *= 0.1 * 1.8 * sqrt(fbm(pos.xz * 0.04) * fbm(pos.xz * 0.005));

	// TODO: snow

	// lighting
	float amb = clamp(0.5 + 0.5 * nor.y, 0.0, 1.0);
	float dif = clamp(dot(light1, nor), 0.0, 1.0);
	float bac = clamp(0.2 + 0.8 * dot(normalize(vec3(-light1.x, 0.0, light1.z)), nor), 0.0, 1.0);
	float sh  = 1.0;

	//if(dif >= 0.0001) {
	//  sh = soft_shadow(pos + light1 * SC * 0.05, light1);

	vec3 lin = vec3(0.0);
	lin += dif * vec3(8.00, 5.00, 3.00) * 1.3 * vec3(sh, sh * sh * 0.5 + 0.5 * sh, sh * sh * 0.8 + 0.2 * sh);
	lin += amb  * vec3(0.40, 0.60, 1.00) * 1.2;
	lin += bac  * vec3(0.40, 0.50, 0.60);
	col *= lin;

	// TODO: more colour adjust here

	// fog
	float fo = 1.0 - exp(-pow(0.001 * t / SC, 1.5));
	vec3 fco = 0.65 * vec3(0.4, 0.65, 1.0);

	col = mix(col, fco, fo);
  }

  // sun scatter
  col += 0.3 * vec3(1.0, 0.7, 0.3) * pow(sundot, 8.0);
  // gamma
  col = sqrt(col);

  return vec4(col, t);

}
  

mat3 set_camera(in vec3 ro, in vec3 ta, in float cr) {
  vec3 cw = normalize(ta - ro);
  vec3 cp = vec3(sin(cr), cos(cr), 0.0);
  vec3 cu = normalize(cross(cw, cp));
  vec3 cv = normalize(cross(cu, cw));

  return mat3(cu, cv, cw);
}

// compute next position in camera path
// this is the same implementation  used in Elevated 
vec3 cam_path(float time) {
  return SC * 1100.0 * vec3(cos(0.0 + 0.23 * time), 0.0, cos(1.5 + 0.21 * time));
}


// adjust camera position
void move_camera(float time, out vec3 ro_out, out vec3 ta_out, out float cr_out, out float fl_out) {
  vec3 ro = cam_path(time);
  vec3 ta = cam_path(time + 3.3);

  // which terrain function should the camera follow?
  ro.y = terrain_mid(ro.xz) + 22.0 * SC;
  ta.y = ro.y - 20.0 * SC;

  float cr = 2.0 * cos(0.1 * time);
  
  ro_out = ro;
  ta_out = ta;
  cr_out = cr;

  fl_out = 3.0;
}


// Entry point 
void mainImage(out vec4 frag_color, in vec2 frag_coord)
{
  float time = i_time * 0.1 - 0.1 + 0.3 + 4.0 / i_resolution.x;

  // camera position
  vec3 ro;
  vec3 ta;

  float cr;
  float fl;

  // camera to world transform
  mat3 cam = set_camera(ro, ta, cr);
  // position of this pixel 
  vec2 p = (-i_resolution.xy + 2.0 * frag_coord) / i_resolution.y;

  vec3 total = vec3(0.0);

  // if we did AA it would be here
  float t = k_max_t;
  
  // get camera ray
  vec3 rd = cam * normalize(vec3(p, fl));
  vec4 res = render(ro, rd);
  t = min(t, res.w);

  total += res.xyz;

  // divide total here if doing AA

  // now find a velocity vector through depth-reprojection
  float vel = 0.0;

  if(t < 0.0) {
	vel = -1.0;
  }
  else {
	// previous camera position
	float prev_time = time - 0.1 * 1.0 / 24.0;
    vec3 ro_prev;
	vec3 ta_prev;
	float cr_prev;
	float fl_prev;

	move_camera(time, ro_prev, ta_prev, cr_prev, fl_prev);
	mat3 prev_cam = set_camera(ro_prev, ta_prev, cr_prev);

	// world space transform
	vec3 wpos = ro + rd * t;
	// camera space transform
	vec3 cpos = vec3(
					 dot(wpos - ro_prev, prev_cam[0]),
					 dot(wpos - ro_prev, prev_cam[1]),
					 dot(wpos - ro_prev, prev_cam[2])
	);
	// normalized device coord space
	vec2 npos = fl_prev * cpos.xy / cpos.z;
	// screen space 
	vec2 spos = 0.5 + 0.5 * npos * vec2(i_resolution.y / i_resolution.x, 1.0);

	// compress velocity vector into a single float
	vec2 uv = frag_coord / i_resolution.xy;
	spos = clamp(0.5 + 0.5 * (spos - uv) / 0.25, 0.0, 1.0);
	vel = floor(spos.x * 1023.0) + floor(spos.y * 1023.0) * 1024.0;

	
  }
  // draw the height and velocity vectors for the terrain 
  //frag_color = vec4(total, vel);
  frag_color = vec4(total, 1.0); //vec4(total, 1.0);
}




void main(void)
{
    mainImage(out_color, (0.5 + 0.5 * position_out) * i_resolution.xy);
}
