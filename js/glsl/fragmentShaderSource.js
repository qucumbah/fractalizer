export const fragmentShaderSource = `
precision highp float;

///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////Complex////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

float PI = 3.141592653589793;
float E  = 2.718281828459045;

vec2 cartesianToPolar(vec2 v) {
  float s = v.x*v.x + v.y*v.y;
  
  if (s <= 0.0) {
    return vec2(0, 0);
  }
  
  float r = sqrt(s);
  float a = v.y>=0.0 ? acos(v.x/r) : PI*2.0-acos(v.x/r);
  
  //a = clamp(a, 0.0, PI*2.0);
  
  return vec2(r, a);
}
vec2 polarToCartesian(float r, float a) {
  return vec2(
    r*cos(a),
    r*sin(a)
  );
}

vec2 add(vec2 a, vec2 b) {
  return a + b;
}
vec2 sub(vec2 a, vec2 b) {
  return a - b;
}

vec2 mul(vec2 a, vec2 b) {
  vec2 aPolar = cartesianToPolar(a);
  vec2 bPolar = cartesianToPolar(b);
  
  return polarToCartesian(
    aPolar[0] * bPolar[0],
    aPolar[1] + bPolar[1]
  );
}
vec2 div(vec2 a, vec2 b) {
  vec2 aPolar = cartesianToPolar(a);
  vec2 bPolar = cartesianToPolar(b);
  
  return polarToCartesian(
    aPolar[0] / bPolar[0],
    aPolar[1] - bPolar[1]
  );
}

vec2 powComplex(vec2 v1, vec2 v2) {
  if (v1.x == 0.0 && v1.y == 0.0) {
    return vec2(0, 0);
  }
  
  vec2 polar = cartesianToPolar(v1);
  float a = polar[1];
  float r = polar[0];
  float c = v2.x;
  float d = v2.y;
  
  float resultRadius = pow(r, c) * pow(E, -d*a);
  float resultAngle = d*log(r) + c*a;
  
  return polarToCartesian(resultRadius, resultAngle);
}

vec2 neg(vec2 a) {
  return vec2(-a.x, -a.y);
}

vec2 sinComplex(vec2 a) {
  vec2 left = polarToCartesian( pow(E, -a.y)/2.0, a.x - PI/2.0 );
  vec2 right = polarToCartesian( pow(E, a.y)/2.0, -a.x - PI/2.0 );
  return sub(left, right);
}
vec2 cosComplex(vec2 a) {
  return sinComplex( vec2(PI/2.0 - a.x, a.y) );
}

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////Color/////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

int getMod(int x, int y) {
  return int(mod(float(x), float(y)) + 0.5);
}

vec3 hsvToRgb(float h, float s, float v) {
  int hi = int(mod((h/60.0), 6.0));
  float vMin = (100.0-s)*v/100.0;
  float a = (v-vMin)*mod(h, 60.0)/60.0;
  float vInc = vMin+a;
  float vDec = v-a;
  
  float r, g, b;
  
  if (hi==0) {
    r = v;
    g = vInc;
    b = vMin;
  } else if (hi==1) {
    r = vDec;
    g = v;
    b = vMin;
  } else if (hi==2) {
    r = vMin;
    g = v;
    b = vInc;
  } else if (hi==3) {
    r = vMin;
    g = vDec;
    b = v;
  } else if (hi==4) {
    r = vInc;
    g = vMin;
    b = v;
  } else if (hi==5) {
    r = v;
    g = vMin;
    b = vDec;
  }
  
  return vec3(r/100.0, g/100.0, b/100.0);
  
  /*
  const hi = Math.floor((h/60)%6);
  const vMin = (100-s)*v/100;
  const a = (v-vMin)*(h%60)/60;
  const vInc = vMin+a;
  const vDec = v-a;
  
  switch (hi) {
    case 0:
      r = v;
      g = vInc;
      b = vMin;
    break;
    case 1:
      r = vDec;
      g = v;
      b = vMin;
    break;
    case 2:
      r = vMin;
      g = v;
      b = vInc;
    break;
    case 3:
      r = vMin;
      g = vDec;
      b = v;
    break;
    case 4:
      r = vInc;
      g = vMin;
      b = v;
    break;
    case 5:
      r = v;
      g = vMin;
      b = vDec;
    break;
  }
  */
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////Render//////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

vec2 fun(vec2 complex);

varying vec2 v_position;

uniform vec2 u_offset;
uniform vec2 u_imageSize;
uniform float u_scale;
uniform float u_saturationRange;
uniform float u_valueRange;
void main() {
  float halfImageWidth = u_imageSize.x / 2.0;
  float halfImageHeight = u_imageSize.y / 2.0;
  
  vec2 bottomLeft = vec2(
    v_position.x*halfImageWidth + halfImageWidth + u_offset.x,
    v_position.y*halfImageHeight + halfImageHeight + u_offset.y
  );
  vec2 complex = mul( bottomLeft, vec2(1.0/u_scale, 0) );
  vec2 polar = cartesianToPolar( fun(complex) );
  
  float saturation = u_saturationRange==0.0 ? 100.0 : clamp(polar[0] / u_saturationRange, 0.0, 1.0) * 100.0;
  float value = u_valueRange==0.0 ? 100.0 : clamp(polar[0] / u_valueRange, 0.0, 1.0) * 100.0;
  
  vec3 rgb = hsvToRgb(
    polar[1] / PI * 180.0,
    saturation,
    value
  );
  
  gl_FragColor = vec4(rgb, 1);
}
`;