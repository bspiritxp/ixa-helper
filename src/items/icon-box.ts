import { createElement, setCss } from '@/utils/dom'
import Optional from '@/utils/tool'
import { isNil } from 'ramda'
import { RareName, Rarity } from './card'

const SINGLE_ICON_SIZE = 30
const ICON_MAGIN = 5

class IconBox {
    public onChanged: ((oldValue: HTMLImageElement|null, newValue: HTMLImageElement) => void) | null
    private elm: HTMLDivElement
    private idx: number|null = null
    private icons: HTMLDivElement[]

    constructor(icons: HTMLDivElement[]) {
        this.icons = icons
        this.onChanged = null
        this.elm = createElement('div', 'iconBox', false) as HTMLDivElement
        this.icons.forEach((v, i) => {
            v.dataset.index = i.toString()
            setCss(v, {
                cursor: 'pointer',
                height: 'fit-content',
                padding: `${ICON_MAGIN}px`,
                width: 'fit-content',
            })
            v.onclick = e => {
                const target = e.currentTarget as HTMLDivElement
                Optional.ofNullable(target.dataset.index)
                    .map(txt => Number(txt))
                    .then(this.select.bind(this))
            }
            this.elm.append(v)
        })
        const closeButton = createElement('div', 'closeBox', true)
        closeButton.textContent = '×'
        closeButton.onclick = this.close.bind(this)
        setCss(closeButton, {
            'color': '#333',
            'font-weight': 'bold',
            'font-size': '16px',
            'cursor': 'pointer',
        })
        this.elm.append(closeButton)
        setCss(this.elm, {
            'display': 'grid',
            'width': `${SINGLE_ICON_SIZE * 3 + ICON_MAGIN * 4}px`,
            'position': 'absolute',
            'border': '1px solid #fff',
            'visibility': 'hidden',
            'border-radius': '5px',
            'background-color': '#fff',
            'z-index': '9999',
            'grid-template-columns': 'repeat(3, 30px)',
            'grid-column-gap': `${ICON_MAGIN}px`,
        })
    }
    public get offsetWidth() {
        return this.elm.offsetWidth
    }

    public get offsetHeight() {
        return this.elm.offsetHeight
    }

    public get dom() {
        return this.elm
    }

    public get value(): Rarity|null {
        if (isNil(this.idx)) { return null }
        const key = (this.icons[this.idx].firstElementChild as HTMLImageElement).getAttribute('alt') as RareName
        return Rarity[key]
    }

    public select(index: number) {
        if (index < 0 || index >= this.icons.length) { return }
        const oldValue = isNil(this.idx) ? null : this.icons[this.idx].firstElementChild as HTMLImageElement
        this.idx = index
        const newValue = this.icons[this.idx].firstElementChild as HTMLImageElement
        if (this.onChanged) {
            this.onChanged(oldValue, newValue)
        }
    }

    public show(x: number, y: number) {
        this.elm.style.top = `${y}px`
        this.elm.style.left = `${x}px`
        this.elm.style.visibility = 'visible'
    }

    public close() {
        this.elm.style.visibility = 'hidden'
    }

    public putIn(parent: HTMLElement = document.body) {
        parent.append(this.elm)
    }

    get isShow() {
        return this.elm.style.visibility !== 'hidden'
    }
}

export default IconBox
