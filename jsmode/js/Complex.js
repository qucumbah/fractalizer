class ComplexNumberError extends Error {
  constructor(message) {
    super(message);
  }
}

export default class Complex {
  constructor({x, y}) {
    this.x = x;
    this.y = y;
  }
  static fromPolar = ({r, a}) => {
    return this.polarToCartesian({r, a});
  }

  asCartesian() {
    return { x: this.x, y: this.y };
  }
  asPolar() {
    return Complex.cartesianToPolar({x: this.x, y: this.y});
  }

  add({x, y}) {
    return new Complex({x: this.x+x, y: this.y+y});
  }
  sub({x, y}) {
    return new Complex({x: this.x-x, y: this.y-y});
  }

  mul({x, y}) {
    const thisPolar = this.asPolar();
    const otherPolar = Complex.cartesianToPolar({x, y});

    return Complex.fromPolar({
      r: thisPolar.r * otherPolar.r,
      a: thisPolar.a + otherPolar.a
    });
  }
  div({x, y}) {
    const thisPolar = this.asPolar();
    const otherPolar = Complex.cartesianToPolar({x, y});

    return Complex.fromPolar({
      r: thisPolar.r / otherPolar.r,
      a: thisPolar.a - otherPolar.a
    });
  }

  pow({x, y}) {
    if (this.x===0 && this.y===0) {
      return new Complex({x: 0, y: 0});
    }

    const a = this.asPolar().a;
    const r = this.asPolar().r;
    const c = x;
    const d = y;

    const resultRadius = r**c * Math.E**(-d*a);
    const resultAngle = d*Math.log(r) + c*a;

    return Complex.fromPolar({
      r: resultRadius,
      a: resultAngle
    });
  }

  // realPower(n) {
  //   const polar = this.asPolar();

  //   return Complex.fromPolar({
  //     r: Math.pow(polar.r, n),
  //     a: polar.a*n
  //   });
  // }

  static neg = ({x, y}) => {
    return new Complex({x: -x, y: -y});
  }

  //See sketch 2
  static sin = ({x, y}) => {
    const left = Complex.fromPolar({r: (Math.E**-y)/2, a: x - Math.PI/2});
    const right = Complex.fromPolar({r: (Math.E**y)/2, a: -x - Math.PI/2});
    return left.sub(right);
  }
  static cos = ({x, y}) => {
    return this.sin({x: Math.PI/2-x, y});
  }

  static polarToCartesian = ({r, a}) => {
    return new Complex({
      x: r*Math.cos(a),
      y: r*Math.sin(a)
    });
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
