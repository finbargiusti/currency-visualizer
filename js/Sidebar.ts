import Settings from './Settings';
import Screen from './Screen';
import WikiJS from 'wikijs';

import currencytitles from '../data/currencies.json';

export default class Sidebar {
  private set: Settings;
  private scr: Screen;

  private prevRemoveListener: () => void;

  private cache: { [ISO: string]: string } = {};

  constructor(set: Settings, scr: Screen) {
    this.set = set;
    this.scr = scr;
    this.sidebar()
      .querySelector('.close')
      ?.addEventListener('click', () => {
        this.close();
      });
  }

  private sidebar() {
    return document.getElementById('sidebar') as HTMLDivElement;
  }

  private content() {
    return this.sidebar().querySelector('.content') as HTMLDivElement;
  }

  public open(ISO: string) {
    this.sidebar().classList.add('open');
    this.content().innerHTML = '';

    const remove = this.sidebar().querySelector('#remove') as HTMLButtonElement;

    remove.removeEventListener('click', this.prevRemoveListener);

    this.prevRemoveListener = () => {
      this.set.changeCurrencyStatus(ISO, false);
      this.scr.calculateBalls().then(() => {
        this.scr.render();
        this.close();
      });
    };

    remove.addEventListener('click', this.prevRemoveListener);

    this.renderTitle(currencytitles[ISO]);
    this.renderInfo(ISO);
  }

  public close() {
    this.sidebar().classList.remove('open');
  }

  private renderTitle(title: string) {
    const header = document.createElement('h2');
    header.innerText = title;
    this.content().appendChild(header);
  }

  private async renderInfo(ISO: string) {
    let text: string;
    if (!this.cache[ISO]) {
      text = await WikiJS()
        .page(currencytitles[ISO])
        .then(async (page) => {
          const t = await (await page.summary()).replace('\n', '<br/><br/>');
          this.cache[ISO] = t;
          return t;
        });
    } else {
      text = this.cache[ISO];
    }
    const info = document.createElement('p');
    info.innerHTML = text;
    this.content().appendChild(info);
  }
}
