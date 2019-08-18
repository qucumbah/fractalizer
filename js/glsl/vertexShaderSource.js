export default `
attribute vec4 a_position;

varying vec2 v_position;

void main() {
  v_position = a_position.xy;
  gl_Position = a_position;
}
`;
