import currencyInfo from '../data/currencies.json';

export default class Settings {
  private currencies: {
    [ISO: string]: {
      name: string;
      enabled: boolean;
    };
  } = {};

  private resolution: number = 0.5;

  private panel() {
    return document.getElementById('settings')!;
  }

  private changeCallback: () => void = () => {};

  public setChangeCallback(ch: () => void) {
    this.changeCallback = ch;
  }

  public setResolution(res: number) {
    if (res < 0 || res > 1) {
      throw 'resolution must be between 0 and 1';
    }
    this.resolution = res;
  }

  public getResolution() {
    return this.resolution;
  }

  constructor() {
    Object.keys(currencyInfo).forEach((k) => {
      this.currencies[k] = {
        name: currencyInfo[k],
        enabled: true,
      };
    });

    document
      .getElementById('close-settings')
      ?.addEventListener('click', () => this.close());
  }

  public close() {
    const pan = this.panel();
    pan.style.opacity = '0';
    pan.style.display = 'none';
    this.changeCallback();
  }

  public open() {
    const pan = this.panel();
    pan.style.display = 'flex';
    setTimeout(() => {
      pan.style.opacity = '1';
    }, 10);
    this.render();
  }

  public render() {
    this.renderCurrencyOptions();
  }

  public renderCurrencyOptions(query: string = '') {
    const wrap = document.querySelector('.currency-toggle-options')!;
    wrap.innerHTML = '';
    const search = document.querySelector(
      '#currency-search'
    ) as HTMLInputElement;
    search.value = query;
    search.addEventListener('input', () => {
      if (search.value.length > query.length || query === '')
        this.renderCurrencyOptions(search.value);
    });
    Object.keys(this.currencies)
      .filter((val) => {
        if (!query) return true;
        return this.currencies[val].name
          .toLowerCase()
          .includes(query.toLowerCase());
      })
      .sort(
        (a, b) => {
          const a_enabled = this.currencies[a].enabled;
          const b_enabled = this.currencies[b].enabled;
          return a_enabled === b_enabled ? 0 : a_enabled ? -1 : 1;
        } // sort checked first
      )
      .forEach((k) => {
        const currency = this.currencies[k];
        const d = document.createElement('div');
        d.className = 'currency-toggle-wrap';
        const tag = document.createElement('span');
        tag.innerText = currency.name;
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = currency.enabled;
        toggle.addEventListener('change', () => {
          this.currencies[k].enabled = toggle.checked;
        });

        d.appendChild(tag);
        d.appendChild(toggle);
        wrap.appendChild(d);
      });
  }

  public getEnabledCurrencies(): { [ISO: string]: boolean } {
    const enabled: { [ISO: string]: boolean } = {};

    Object.keys(this.currencies).forEach((k) => {
      enabled[k] = this.currencies[k].enabled;
    });

    return enabled;
  }
}
