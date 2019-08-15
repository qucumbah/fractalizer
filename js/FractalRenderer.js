import {vertexShaderSource} from './glsl/vertexShaderSource.js';
import {fragmentShaderSource} from './glsl/fragmentShaderSource.js';

//const gl = init();
//const program = loadProgram(gl, vertexShaderSource, fragmentShaderSource);
//draw(gl, program, 0, 0);

export default class FractalRenderer {
  constructor({
    body,
    scale,
    saturationRange,
    valueRange,
    _width,
    _height
  }) {
    this.width = _width;
    this.height = _height;
    
    this.canvas = createCanvas(_width, _height);
    this.gl = getGL(this.canvas);
    this.program = loadProgram(
        this.gl,
        vertexShaderSource,
        fragmentShaderSource + body
    );
    
    const globals = { scale, saturationRange, valueRange };
    
    setGlobals(this.gl, this.program, globals);
  }
  
  getImage(x, y) {
    draw(this.gl, this.program, x, y, this.width, this.height);
    
    return new Promise(resolve => this.canvas.toBlob(resolve));
    /*
    const result = new Image();
    result.src = this.canvas.toDataURL();
    
    return result;
    */
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  //document.body.appendChild(canvas);
  //const canvas = document.getElementById('canvas');
  
  return canvas;
}

function getGL(canvas) {
  const gl = canvas.getContext('webgl');

  if (!gl) {
    throw new Error('Error: webgl not supported');
  }
  
  console.dir(gl);
  
  return gl;
}

function loadProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);
  
  //Render the entire frame as two triangles
  const a_positionLocation = gl.getAttribLocation(program, 'a_position');
  const a_positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
  
  const positions = [
    -1, -1,
    1, 1,
    1, -1,
    -1, -1,
    1, 1,
    -1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enableVertexAttribArray(a_positionLocation);
  
  const size = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const bufferOffset = 0;
  gl.vertexAttribPointer(
      a_positionLocation, size, type, normalize, stride, bufferOffset);
  
  return program;
}

function setGlobals(gl, program, globals) {
  for (const name in globals) {
    const location = gl.getUniformLocation(program, 'u_' + name);
    gl.uniform1f(location, globals[name]);
  }
  /*
  //Set globals to user settings
  const scale = 10;
  const saturationRange = 5;
  const valueRange = 0;
  
  const u_scaleLocation = gl.getUniformLocation(program, 'u_scale');
  const u_saturationRangeLocation = gl.getUniformLocation(program, 'u_saturationRange');
  const u_valueRangeLocation = gl.getUniformLocation(program, 'u_valueRange');
  gl.uniform1f(u_scaleLocation, scale);
  gl.uniform1f(u_saturationRangeLocation, saturationRange);
  gl.uniform1f(u_valueRangeLocation, valueRange);
  */
}

function draw(gl, program, x, y, width, height) {
  const u_offsetLocation = gl.getUniformLocation(program, 'u_offset');
  const u_imageSizeLocation = gl.getUniformLocation(program, 'u_imageSize');
  
  gl.uniform2f(u_offsetLocation, x, y);
  gl.uniform2f(u_imageSizeLocation, width, height);
  
  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  
  throw new Error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  
  throw new Error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
