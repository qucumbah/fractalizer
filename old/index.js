$(document).ready(function() {
  let board = new Board(550, 550);
  $('#output').append(board.getCanvas());
  $('#output').append(board.getCoords());
  board.repaint();
});

class Complex {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  asCartesian() {
    return { x: this.x, y: this.y };
  }
  asPolar() {
    return Complex.cartesianToPolar({x: this.x, y: this.y});
  }

  add({x, y}) {
    return new Complex(this.x+x, this.y+y);
  }
  subtract({x, y}) {
    return new Complex(this.x-x, this.y-y);
  }

  multiply({x, y}) {
    const thisPolar = this.asPolar();
    const otherPolar = Complex.cartesianToPolar({x, y});

    const multiplied = Complex.polarToCartesian({
      r: thisPolar.r * otherPolar.r,
      a: thisPolar.a + otherPolar.a
    });
    return new Complex(multiplied.x, multiplied.y);
  }

  pow(n) {
    const polar = this.asPolar();
    const powered = Complex.polarToCartesian({
      r: Math.pow(polar.r, n),
      a: polar.a*n
    });
    return new Complex(powered.x, powered.y);
  }

  static polarToCartesian = ({r, a}) => {
    return {
      x: r*Math.cos(a),
      y: r*Math.sin(a)
    };
  }
  static cartesianToPolar = ({x, y}) => {
    const r = Math.sqrt(x*x + y*y);
    if (r===0) {
      return {r, a: 0};
    }
    const a = y>=0 ? Math.acos(x/r) : Math.PI*2-Math.acos(x/r);
    return {r, a};
  }
}

class Board {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.scale = width/3;

    this.canvas = $('<canvas id="canvas" />').attr({
      width: this.width,
      height: this.height
    });
    this.ctx = this.canvas.get(0).getContext('2d');

    this.coords = $('<div id="coords" />');
    this.canvas.on('mousemove', e => {
      let complex = this.getComplexFromCanvasPoint(e.offsetX, e.offsetY);
      let result = this.fun(complex);

      const precition = 2;
      this.coords.text(
        `f(${complex.x.toFixed(precition)}, ${complex.y.toFixed(precition)}) =
        (${result.x.toFixed(precition)}, ${result.y.toFixed(precition)})`
      );
    });
  }

  getCanvas = () => {
    return this.canvas;
  }
  getCoords = () => {
    return this.coords;
  }

  repaint = () => {
    let img = new Image(this.width, this.height);
    this.ctx.drawImage(img, 0, 0);
    let imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    let data = imageData.data;

    console.log(data);

    for (let y = 0; y<this.height; y++) {
      for (let x = 0; x<this.width; x++) {
        let {r, g, b} = this.at(x, y);

        r = Math.floor(r*255/100);
        g = Math.floor(g*255/100);
        b = Math.floor(b*255/100);

        data[4*(y*this.width+x)+0] = r; //r
        data[4*(y*this.width+x)+1] = g; //g
        data[4*(y*this.width+x)+2] = b; //b
        data[4*(y*this.width+x)+3] = 255; //a

        //console.log(r,g,b);
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  fun = complex => {
    return complex
      .pow(10)
      .subtract(complex.pow(3))
      .multiply({x: 10, y: 0});
  }

  at = (x, y) => {
    const complex = this.getComplexFromCanvasPoint(x, y);
    const polar = this.fun(complex).asPolar();
    return hsvToRgb(
      polar.a/Math.PI * 180,
      // 0.71>sqrt(2)/2, max distance from origin<width*0.71
      polar.r/(this.width*0.71/this.scale)*100,
      100
    );
  }

  getComplexFromCanvasPoint = (x, y) => {
    x = x-this.width/2;
    y = this.height/2-y;
    return new Complex(x/this.scale, y/this.scale);
  }
}

function hsvToRgb(h, s, v) {
  hi = Math.floor((h/60)%6);
  vMin = (100-s)*v/100;
  a = (v-vMin)*(h%60)/60;
  vInc = vMin+a;
  vDec = v-a;

  let r, g, b;
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

  return {r, g, b};
}
