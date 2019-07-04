import _ from 'lodash'
import { createUnique } from '@/utils/dom'
import Optional from '@/utils/tool';

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
} as const;


export default class Report {
    type: string = ''
    isReport: boolean = false
    unReaded: boolean = false
    url: string = ''
    ress = new Map()

    constructor(el: HTMLElement) {
        this.isReport = Boolean(el && el.tagName && el.tagName === 'TR' && el.childElementCount > 3)
        if (this.isReport) {
            this.unReaded = el.classList.contains('noread')
            this.url = Optional.ofNullable(el.querySelector('a')).map((aEL: {href: string}) => aEL.href.trim()).getOrDefault('')
            this.type = Optional.ofNullable(el.querySelector('img')).map((img: {alt: string}) => img.alt.trim()).getOrDefault('other')
        }
    }

    _sperator() {
        return this.type === REPORT_TYPE.DISCOVERY ? '\t' : ' '
    }
    
    _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item'
    }

    async readDetial() {
        if (!_.isEmpty(this.url)) {
            const request = await fetch(this.url)
            const bodyText = await request.text()
            const ifm = <HTMLIFrameElement>createUnique('iframe', 'ixah-report', false)
            Optional.ofNullable(ifm.contentDocument)
              .then(ifmDocument => {
                ifmDocument.body.innerHTML = bodyText
                Optional.ofNullable(<HTMLElement>ifmDocument.querySelector(this._selector()))
                    .then(this.fetchRess)
              });
        }
    }

    fetchRess(el: HTMLElement) {
        _(el.innerText.trim().split(this._sperator()))
            .filter(t => t !== '')
            .slice(1, -1)
            .each(text => {
                const ressKey = _.findKey(RESOURCE_TYPE, o => o == text[0])
                const r = /(\d+)$/.exec(text)
                const value = _.isArray(r) ? r[0] : 0
                this.ress.set(ressKey, value) 
            })
    }
}