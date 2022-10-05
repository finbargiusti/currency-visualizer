import Screen from './Screen';

const loadWrapper = document.getElementById('loading') as HTMLDivElement;
const loading = document.getElementById('loading-text') as HTMLHeadingElement;

const loadBar = document.querySelector('.loaded') as HTMLDivElement;

const canvas = document.getElementById('entry') as HTMLCanvasElement;

const updateLoaded = (c: number, n: number) => {
  loading.innerText = `Packing circle ${c} of ${n}...`;
  loadBar.style.width = `${(c * 100) / n}%`;
  if (c === n) loadWrapper.style.display = 'none'; // finished
};

async function startInitialRender() {
  let mouseDown = false;

  const sc = new Screen(updateLoaded);

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
}

(() => {
  startInitialRender();
})();
