import Screen from './Screen';
import Settings from './Settings';

const openSettings = document.querySelector(
  '#open-settings'
) as HTMLButtonElement;

const canvas = document.getElementById('entry') as HTMLCanvasElement;

let mouseDown = false;

const set = new Settings();
const sc = new Screen(set);

openSettings.addEventListener('click', () => {
  set.open();
});

window.addEventListener('resize', () => {
  sc.render();
});

canvas.addEventListener('mousedown', () => {
  mouseDown = true;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('touchstart', () => {
  mouseDown = true;
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', (e) => {
  mouseDown = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('touchend', (e) => {
  mouseDown = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', (e) => {
  mouseDown = false;
  canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    sc.setOffset(e.movementX, e.movementY);
    sc.render();
  }
});

canvas.addEventListener('dblclick', (e) => {
  sc.getClickedCurrency(e.pageX, e.pageY);
});

canvas.addEventListener('wheel', (e) => {
  sc.setScale(e.deltaY, e.clientX, e.clientY);
  sc.render();
});

sc.getBalls().then(() => {
  sc.render();
});
