import { createUnique, query } from '@/utils/dom'
import Optional, { mapOpt, safeGet } from '@/utils/tool'
import {
    compose,
    filter,
    forEach,
    head,
    isEmpty,
    isNil,
    match,
    not,
    prop,
    slice,
    split,
    trim,
} from 'ramda'

enum REPORT_TYPE {
    DISCOVERY = '秘境探索',
    SPACE_ATTACK = '空き地攻撃',
}

const RESOURCE_TYPE: {[key: string]: string} = {
    銅銭: 'money',
    木材: 'wood',
    綿: 'wool',
    鉄: 'ingot',
    糧: 'grain',
} as const

export default class Report {
    public dom: HTMLTableRowElement | null = null
    public type: string = ''
    public isReport: boolean = false
    public unReaded: boolean = false
    public url: string = ''
    public ress = new Map<string, number>()

    constructor(el: HTMLElement) {
        this.dom = el as HTMLTableRowElement
        this.isReport = Boolean(el && el.tagName && el.tagName === 'TR' && el.childElementCount > 3)
        if (this.isReport) {
            this.unReaded = el.classList.contains('noread')
            this.url = query('a', el)
                .map(aEL => (aEL as HTMLLinkElement).href.trim()).getOrDefault('')
            this.type = query('img', el)
                .map(img => (img as HTMLImageElement).alt.trim()).getOrDefault('other')
        }
    }

    public async readDetail() {
        if (!isEmpty(this.url) && !isNil(this.dom)) {
            const firstTd = this.dom.firstElementChild as HTMLElement
            if (firstTd) { firstTd.style.backgroundColor = '#990000' }
            const request = await fetch(this.url)
            const bodyText = await request.text()
            const ifm = createUnique('iframe', 'ixah-report', false) as HTMLIFrameElement
            Optional.of(ifm.contentDocument)
                .then(ifmDocument => {
                    ifmDocument.body.innerHTML = bodyText
                    Optional.of(ifmDocument.querySelector(this._selector()) as HTMLElement)
                        .then(this.fetchRess.bind(this))
                })
            if (firstTd) { firstTd.style.backgroundColor = '#fff' }
        }
    }

    private fetchRess(el: HTMLElement) {
        //ressText example: ["木材270", "綿270", "鉄270", "糧270"]
        const sumary = (ressText: string[]) => {
            forEach((text: string) => {
                const matched = match(/(\D+)(\d+)$/, text)
                this.ress.set(prop(matched[1], RESOURCE_TYPE),
                              compose(Number, head, match(/\d+$/))(text))
            }, ressText)
        }

        return compose(
            sumary,
            slice(1, -1),
            filter(compose(not, isEmpty)),
            split(' '),
            trim,
        )(el.innerText)
    }
    private _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item'
    }
}
