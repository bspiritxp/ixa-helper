import { createUnique } from '@/utils/dom'
import Optional from '@/utils/tool'
import _ from 'lodash'

enum REPORT_TYPE {
    DISCOVERY = '秘境探索',
    SPACE_ATTACK = '空き地攻撃',
}

const RESOURCE_TYPE = {
    money: '銅',
    wood: '木',
    wool: '綿',
    ingot: '鉄',
    grain: '糧',
} as const

export default class Report {
    public dom: HTMLTableRowElement | null = null
    public type: string = ''
    public isReport: boolean = false
    public unReaded: boolean = false
    public url: string = ''
    public ress = new Map()

    constructor(el: HTMLElement) {
        this.dom = el as HTMLTableRowElement
        this.isReport = Boolean(el && el.tagName && el.tagName === 'TR' && el.childElementCount > 3)
        if (this.isReport) {
            this.unReaded = el.classList.contains('noread')
            this.url = Optional.ofNullable(el.querySelector('a'))
                .map((aEL: {href: string}) => aEL.href.trim()).getOrDefault('')
            this.type = Optional.ofNullable(el.querySelector('img'))
                .map((img: {alt: string}) => img.alt.trim()).getOrDefault('other')
        }
    }

    public async readDetial() {
        if (!_.isEmpty(this.url) && !_.isNull(this.dom)) {
            const firstTd = this.dom.firstElementChild as HTMLElement
            if (firstTd) { firstTd.style.backgroundColor = '#990000' }
            const request = await fetch(this.url)
            const bodyText = await request.text()
            const ifm = createUnique('iframe', 'ixah-report', false) as HTMLIFrameElement
            Optional.ofNullable(ifm.contentDocument)
              .then(ifmDocument => {
                ifmDocument.body.innerHTML = bodyText
                Optional.ofNullable(ifmDocument.querySelector(this._selector()) as HTMLElement)
                    .then(this.fetchRess.bind(this))
            })
            if (firstTd) { firstTd.style.backgroundColor = '#fff' }
        }
    }

    private fetchRess(el: HTMLElement) {
        _(el.innerText.trim().split(' '))
            .filter(t => t.trim() !== '')
            .slice(1, -1)
            .each(text => {
                const ressKey = _.findKey(RESOURCE_TYPE, o => o === text[0])
                if (ressKey) {
                    const r = /(\d+)$/.exec(text)
                    const value = _.isArray(r) ? r[0] : 0
                    this.ress.set(ressKey, Number(value))
                }
            })
    }
    private _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item'
    }
}
