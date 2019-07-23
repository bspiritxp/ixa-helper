import { create, setCss } from "@/utils/dom";
import Optional from "@/utils/tool";
import { Rarity, RareName } from "./card";
import _ from "lodash";

const SINGLE_ICON_SIZE = 30;
const ICON_MAGIN = 5;

class IconBox {
    private _el: HTMLDivElement;
    private _value: number|null = null;
    private icons: HTMLDivElement[];
    onChanged: ((oldValue: HTMLImageElement|null, newValue: HTMLImageElement) => void) | null;
    constructor(icons: HTMLDivElement[]) {
        this.icons = icons;
        this.onChanged = null;
        this._el = create('div', 'iconBox', false) as HTMLDivElement;
        this.icons.forEach((v, i) => {
            v.dataset.index = i.toString();
            setCss(v, {
                padding: `${ICON_MAGIN}px`,
                width: 'fit-content',
                height: 'fit-content',
                cursor: 'pointer',
            })
            v.onclick = e => {
                const target = e.currentTarget as HTMLDivElement;
                Optional.ofNullable(target.dataset.index)
                    .map(txt => Number(txt))
                    .then(this.select.bind(this));
            }
            this._el.append(v);
        });
        setCss(this._el, {
            display: 'grid',
            width: `${SINGLE_ICON_SIZE * 3 + ICON_MAGIN * 4}px`,
            position: 'absolute',
            border: '1px solid #fff',
            visibility: 'hidden',
            'border-radius': '5px',
            'background-color': '#fff',
            'z-index': '9999',
            'grid-template-columns': 'repeat(3, 30px)',
            'grid-column-gap': `${ICON_MAGIN}px`,
        });
    }
    
    public get offsetWidth() {
        return this._el.offsetWidth;
    }

    public get offsetHeight() {
        return this._el.offsetHeight;
    }

    public get dom() {
        return this._el;
    }
    
    public get value(): Rarity|null {
        if (_.isNull(this._value)) return null;
        const key = (this.icons[this._value].firstElementChild as HTMLImageElement).getAttribute('alt') as RareName;
        return Rarity[key];
    }

    select(index: number) {
        if (index < 0 || index >= this.icons.length) return;
        const oldValue = _.isNull(this._value) ? null : this.icons[this._value].firstElementChild as HTMLImageElement;
        this._value = index
        const newValue = this.icons[this._value].firstElementChild as HTMLImageElement;
        if (this.onChanged) {
            this.onChanged(oldValue, newValue);
        }
    }

    show(x: number, y: number) {
        this._el.style.top = `${y}px`;
        this._el.style.left = `${x}px`;
        this._el.style.visibility = 'visible';
    }

    close() {
        this._el.style.visibility = 'hidden';
    }

    putIn(parent: HTMLElement = document.body) {
        parent.append(this._el);
    }

    get isShow() {
        return this._el.style.visibility !== 'hidden';
    }
}

export default IconBox;
