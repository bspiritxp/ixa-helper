import _ from 'lodash'
import { createUnique } from '@/utils/dom'

const REPORT_TYPE = [
    '秘境探索',
    '空き地攻撃',
]

const RESOURCE_TYPE = {
    money: '銅',
    wood: '木',
    wool: '綿',
    ingot: '鉄',
    grain: '糧',
}


export default class Report {
    constructor(el) {
        this.isReport = el && el.tagName && el.tagName === 'TR' && el.childElementCount > 3
        if (this.isReport) {
            this.unReaded = el.hasClassName('noread')
            this.url = el.querySelector('a').href.trim()
            this.ress = new Map()
            const imgEL = el.querySelector('img')
            this.type = imgEL ? imgEL.alt.trim() : 'other'
        }
    }

    _sperator() {
        return this.type === REPORT_TYPE[0] ? '\t' : ' '
    }
    
    _selector() {
        return this.type === REPORT_TYPE[0] ? 'p.gettreger' : 'div.got_item'
    }

    async readDetial() {
        if (!_.isEmpty(this.url)) {
            const request = await fetch(this.url)
            const bodyText = await request.text()
            const ifm = createUnique('iframe', 'ixah-report', false)
            ifm.contentDocument.body.innerHTML = bodyText
            fetchRess(ifm.contentDocument.querySelector(this._selector()))
        }
    }

    fetchRess(el) {
        if (el) {
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
}