
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear');
const resultDiv = document.getElementById('result');
let isDrawing = false;
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);
clearBtn.addEventListener('click', clearCanvas);
function start(e) {
  isDrawing = true;
  draw(e);
}
function draw(e) {
  if (!isDrawing) return;
  ctx.lineWidth = 25;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}
function stop() {
  isDrawing = false;
  getResult();
}
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultDiv.innerText = '';
}
function getResult() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let input = [];
  for (let i = 0; i < pixels.length; i += 4) {
    let brightness = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
    input.push(brightness);
  }
  const result = neuralNetwork(input);
  resultDiv.innerText = result;
}
function neuralNetwork(input) {
  // Code to train and test the neural network goes here
  // This is just a placeholder function
  return Math.floor(Math.random() * 10);
}
