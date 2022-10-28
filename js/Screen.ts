import getPack, { Circle } from './pack';
import Settings from './Settings';

import debounce from 'lodash.debounce';

import currencyNames from '../data/currencies.json';

export default class Screen {
  private bgColor = 'transparent';

  private canvas = () => document.getElementById('entry') as HTMLCanvasElement;

  private scaleBasis = 150;

  private scale = this.scaleBasis;

  private xOffset = 0;
  private yOffset = 0;

  private balls: Ball[] = [];
  private drawnBalls: Drawnball[] = [];

  private images: { [ISO: string]: HTMLImageElement } = {};

  private pack?: (data: Circle[]) => Circle[] = undefined;

  private updateLoaded = (c: number, n: number) => {
    const loading = document.getElementById(
      'loading-text'
    ) as HTMLHeadingElement;
    const loadWrapper = document.getElementById('loading') as HTMLDivElement;
    const loadBar = document.querySelector('.loaded') as HTMLDivElement;
    if (loadWrapper.style.display == 'none') {
      loadWrapper.style.display = 'flex';
    }
    loading.innerText = `Packing circle ${c} of ${n}...`;
    loadBar.style.width = `${(c * 100) / n}%`;
    if (c === n) loadWrapper.style.display = 'none'; // finished
  };

  private set: Settings;

  constructor(set: Settings) {
    this.set = set;
    set.setChangeCallback(() => {
      this.calculateBalls().then(() => this.render());
    });
    Object.keys(currencyNames).forEach((ISO) => {
      const img = new Image();
      img.height = 100;
      img.width = 100;
      img.onload = () => {
        this.images[ISO] = img;
      };
      console.log('fetching ' + ISO);
      // @ts-ignore
      if (process.env.NODE_ENV === 'development') {
        img.src = `/img/currencies/${ISO}.svg`;
      } else {
        img.src = `/currency-visualizer/img/currencies/${ISO}.svg`;
      }
    });
    this.canvas()
      .getContext('2d')
      ?.scale(window.devicePixelRatio, window.devicePixelRatio); // this hacky shit improves performance massively.. bruh
  }

  setOffset(x: number, y: number) {
    const maxOffset = 10 * this.scale;

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

        return this.calculateBalls();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  goTo(ISO: string, withSidebarOffset?: boolean) {
    const ball = this.drawnBalls.find((ball) => {
      return ball.label == ISO;
    })!;
    const currX = (this.xOffset / this.scale) * -1;
    const currY = (this.yOffset / this.scale) * -1;
    const currS = this.scale;
    const endS = this.scaleBasis / ball.radius;

    const x_sidebar_offset = (this.canvas().width / endS) * 0.2;

    if (
      Math.abs(
        ball.x - (withSidebarOffset ? currX - x_sidebar_offset : currX)
      ) < 0.01 &&
      Math.abs(ball.y - currY) < 0.01
    ) {
      return;
    }
    // const dist =
    //   Math.sqrt(Math.pow(ball.x - currX, 2) + Math.pow(ball.y - currY, 2)) * 80;

    // const num_frames = Math.max(Math.round(dist - dist / 4), 20);

    const num_frames = 100;

    // we need to create an offset so that we center it beside the sidebar.

    for (let i = 0; i <= num_frames; i++) {
      setTimeout(() => {
        const { x, y } = this.easePos(i / num_frames, {
          sx: currX,
          sy: currY,
          ex: withSidebarOffset ? ball.x - x_sidebar_offset : ball.x,
          ey: ball.y,
        });

        const s = currS + (endS - currS) * this.ease(i / num_frames);

        this.scale = s;
        this.xOffset = x * this.scale * -1;
        this.yOffset = y * this.scale * -1;
        this.render();
      }, 10 * i);
    }
  }

  private ease(x: number): number {
    // return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    return 1 - Math.pow(1 - x, 4);
  }

  private easePos(
    frame: number,
    options: {
      sx: number;
      sy: number;
      ex: number;
      ey: number;
    }
  ) {
    const { sx, sy, ex, ey } = options;
    const easedProgress = this.ease(frame);

    return {
      x: sx + (ex - sx) * easedProgress,
      y: sy + (ey - sy) * easedProgress,
    };
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
      const dist =
        Math.sqrt(Math.pow(ball.x - realX, 2) + Math.pow(ball.y - realY, 2)) /
        ball.radius;

      if (dist < closestDist) {
        closestDist = dist;
        closest = ball.label;
      }
    });

    return closest;
  }

  public async calculateBalls() {
    if (!this.pack) {
      this.pack = await getPack(this.updateLoaded);
    }

    const enabledBalls = this.set.getEnabledCurrencies();

    let ballsToUse: Ball[];

    ballsToUse = this.balls
      .filter((val) => enabledBalls[val.name])
      .sort((a, b) => b.value - a.value);

    let circles: Circle[] = ballsToUse.map((ball) => {
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
        label: ballsToUse[i].name,
      };
    });
  }

  private async drawBalls() {
    const canv = this.canvas();
    const centerY = canv.height / 2;
    const centerX = canv.width / 2;

    const interpScale = this.scale + 2 / this.scale;

    const ctx = canv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    this.drawnBalls.forEach((d) => {
      const realX = centerX + d.x * interpScale + this.xOffset;
      const realY = centerY + d.y * interpScale + this.yOffset;
      const realR = d.radius * interpScale;
      // avoid drawing really small circles
      if (realR < 3) {
        return;
      }
      // replace small circles with placeholder, so it is not jarring.
      if (realR < 5 || !this.images[d.label]) {
        ctx.save();
        ctx.arc(realX, realY, realR, 0, 2 * Math.PI, false);
        ctx.fillStyle = `white`;
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.drawImage(
        this.images[d.label],
        realX - realR,
        realY - realR,
        2 * realR,
        2 * realR
      );
      ctx.restore();

      // const fontSize = Math.min(64, realR / 2);

      // ctx.save();
      // ctx.font = `${fontSize}px sans-serif`;
      // ctx.textAlign = 'center';
      // ctx.fillStyle = 'white';
      // ctx.lineWidth = 2;
      // ctx.fillText(d.label, realX, realY + fontSize / 2);
      // ctx.strokeStyle = 'black';
      // ctx.strokeText(d.label, realX, realY + fontSize / 2);
      // ctx.restore();
    });

    return;
  }

  private drawbg() {
    const canv = this.canvas();
    const ctx = canv.getContext('2d')!;

    // ctx.fillStyle = this.bgColor;
    // ctx.fillRect(0, 0, canv.width, canv.height);
    ctx.clearRect(0, 0, canv.width, canv.height);
  }

  render() {
    requestAnimationFrame(() => {
      const canv = this.canvas();

      // const res = this.set.getResolution();

      canv.height = window.innerHeight;
      canv.width = window.innerWidth;

      // if (res < 1) {
      //   canv.style.marginLeft = window.innerWidth /
      // }
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
  label: string;
};

const randInt = (a, n) => a + Math.random() * (n - a);
