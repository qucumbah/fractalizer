import vertexShaderSource from './glsl/vertexShaderSource.js';
import fragmentShaderSource from './glsl/fragmentShaderSource.js';
import {decode} from './util.js';

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
  }

  updateProgram({ body, scale, saturationRange, valueRange }) {
    this.program = loadProgram(
      this.gl,
      vertexShaderSource,
      fragmentShaderSource + body
    );

    const globals = { scale, saturationRange, valueRange };
    setGlobals(this.gl, this.program, globals);
  }

  getValueAt(x, y) {
    getValueAt(this.gl, this.program, x, y);

    const arr = new Uint8Array(8);
    this.gl.readPixels(0, 0, 2, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, arr);

    const real = [arr[0], arr[1], arr[2], arr[3]];
    const imag = [arr[4], arr[5], arr[6], arr[7]];

    const realFloat = decode(real);
    const imagFloat = decode(imag);

    return { x: realFloat, y: imagFloat };
  }

  getImage(x, y) {
    draw(this.gl, this.program, x, y, this.width, this.height);

    return new Promise(resolve => this.canvas.toBlob(resolve));
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
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    throw new Error('Error: webgl not supported');
  }

  //console.dir(gl);

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
    -1, 1,
    -1, -1,
    1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

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
}

function draw(gl, program, x, y, width, height) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const u_offsetLocation = gl.getUniformLocation(program, 'u_offset');
  const u_imageSizeLocation = gl.getUniformLocation(program, 'u_imageSize');
  const u_returnTypeLocation = gl.getUniformLocation(program, 'u_returnType');

  gl.uniform2f(u_offsetLocation, x, y);
  gl.uniform2f(u_imageSizeLocation, width, height);
  gl.uniform1i(u_returnTypeLocation, 0);

  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

function getValueAt(gl, program, x, y) {
  gl.viewport(0, 0, 2, 1);

  const u_offsetLocation = gl.getUniformLocation(program, 'u_offset');
  const u_returnTypeLocation = gl.getUniformLocation(program, 'u_returnType');

  gl.uniform2f(u_offsetLocation, x, y);
  gl.uniform1i(u_returnTypeLocation, 1);

  const primitiveType = gl.POINTS;
  const offset = 0;
  const count = 2;

  gl.clearColor(0, 0, 0, 0);
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
