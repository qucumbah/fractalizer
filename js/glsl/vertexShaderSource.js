export default `
attribute vec4 a_position;

varying vec2 v_position;

void main() {
  gl_PointSize = 1.0;
  v_position = a_position.xy;
  gl_Position = a_position;
}
`;
