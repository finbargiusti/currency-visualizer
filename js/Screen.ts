import getPack, { Circle } from './pack';

export default class Screen {
  private bgColor = 'transparent';

  private canvas = () => document.getElementById('entry') as HTMLCanvasElement;

  private scale = 2;

  private currencies: { [name: string]: string } = {
    USD: '#8B9684',
    GBP: '#030162',
    RUB: '#CE291E',
    EUR: '#013193',
    AUD: '#F2C60B',
    AFN: '#DFDFDF',
    BTC: '#EA8B1A',
    ETH: '#52587D',
  };

  private xOffset = 0;
  private yOffset = 0;

  private balls: Ball[] = [];
  private drawnBalls: Drawnball[] = [];

  private pack?: (data: Circle[]) => Circle[] = undefined;

  private updateLoadedText: (a: number, c: number) => void;

  constructor(updateLoadedText: (a: number, c: number) => void) {
    this.updateLoadedText = updateLoadedText;
  }

  setOffset(x: number, y: number) {
    const maxOffset = 100 * this.scale;

    this.xOffset = Math.min(
      Math.max(this.xOffset + x, -1 * maxOffset),
      maxOffset
    );
    this.yOffset = Math.min(
      Math.max(this.yOffset + y, -1 * maxOffset),
      maxOffset
    );
  }

  setScale(ds: number, mx: number, my: number) {
    const prevScale = this.scale;
    this.scale = Math.max(this.scale + ds, 2);
    this.xOffset = this.xOffset * (this.scale / prevScale);
    this.yOffset = this.yOffset * (this.scale / prevScale);
  }

  getBalls() {
    return fetch('https://cdn.moneyconvert.net/api/latest.json')
      .then((res) => {
        if (!res.ok) {
          console.log('http err ' + res.status);
        } else {
          return res.json();
        }
      })
      .then((responseObject) => {
        Object.keys(responseObject.rates).forEach((val) => {
          this.balls.push({
            name: val,
            value: Math.sqrt(1 / responseObject.rates[val] / Math.PI),
          });
        });

        // this.balls = this.balls.filter((b) =>
        //   Object.keys(this.currencies).includes(b.name)
        // );

        // this.balls.sort((b1, b2) => b1.value - b2.value);

        return this.calculateBalls();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  getClickedCurrency(x: number, y: number) {
    const canv = this.canvas();
    const centerY = canv.height / 2;
    const centerX = canv.width / 2;

    const realX = (x - centerX - this.xOffset) / this.scale;
    const realY = (y - centerY - this.yOffset) / this.scale;

    let closest = 'USD';
    let closestDist = Infinity;

    this.drawnBalls.forEach((ball) => {
      const dist = Math.sqrt(
        Math.pow(ball.x - realX, 2) + Math.pow(ball.y - realY, 2)
      );

      if (dist < closestDist) {
        closestDist = dist;
        closest = ball.label;
      }
    });

    window.open(`https://moneyconvert.net/${closest.toLowerCase()}`);
  }

  async calculateBalls() {
    if (!this.pack) {
      this.pack = await getPack(this.updateLoadedText);
    }

    let circles: Circle[] = this.balls.map((ball) => {
      return {
        x: 0.0,
        y: 0.0,
        r: ball.value,
      };
    });

    console.log('starting to pack');

    circles = await this.pack!(circles);

    console.log('packing complete', circles);

    this.drawnBalls = circles.map((circ, i) => {
      return {
        x: circ.x,
        y: circ.y,
        radius: circ.r,
        color:
          this.currencies[this.balls[i].name] ??
          `rgb(${randInt(0, 255)},${randInt(0, 255)},${randInt(0, 255)}`,
        label: this.balls[i].name,
      };
    });
  }

  drawBalls() {
    const canv = this.canvas();
    const centerY = canv.height / 2;
    const centerX = canv.width / 2;

    const interpScale = this.scale + 2 / this.scale;

    const ctx = canv.getContext('2d')!;

    this.drawnBalls.forEach((d, i) => {
      // console.log(`Drawing ${i}, x: ${d.x}, y: ${d.y} ,r: ${d.radius}`);

      const realX = centerX + d.x * interpScale + this.xOffset;
      const realY = centerY + d.y * interpScale + this.yOffset;
      const realR = d.radius * interpScale;
      ctx.beginPath();
      ctx.arc(realX, realY, realR, 0, 2 * Math.PI, false);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.closePath;

      const fontSize = Math.min(64, realR / 2);

      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.lineWidth = 2;
      ctx.fillText(d.label, realX, realY + fontSize / 2);
      ctx.strokeStyle = 'black';
      ctx.strokeText(d.label, realX, realY + fontSize / 2);
    });
  }

  drawbg() {
    const canv = this.canvas();
    const ctx = canv.getContext('2d')!;

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, canv.width, canv.height);
  }

  render() {
    requestAnimationFrame(() => {
      const canv = this.canvas();
      canv.height = window.innerHeight;
      canv.width = window.innerWidth;
      this.drawbg();
      this.drawBalls();
    });
  }
}

export type Ball = {
  name: string;
  value: number;
};

export type Drawnball = {
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
};

const randInt = (a, n) => a + Math.random() * (n - a);
