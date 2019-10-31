import { createUnique, query } from '@/utils/dom'
import Optional, { mapOpt, safeGet } from '@/utils/tool'
import {
    compose,
    equals,
    filter,
    forEach,
    head,
    isEmpty,
    isNil,
    match,
    not,
    pipe,
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
    銅: 'money',
    木: 'wood',
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
        const sumary = (ressTexts: string[]) =>
            forEach((text: string) =>
                this.ress.set(prop(text[0], RESOURCE_TYPE),
                    compose(Number, head, match(/\d+$/))(text[0])))

        return pipe(
            trim, split(' '),
            filter((s: string) => compose(not, isEmpty)(s)),
            slice(1, -1),
            sumary)(el.innerText)
    }
    private _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item'
    }
}
