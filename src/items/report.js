import _ from 'lodash'
import { createUnique } from 'Utils/dom'

const REPORT_TYPE = [
    '秘境探索'
]

export default class Report {
    constructor(el) {
        this.isReport = el && el.tagName && el.tagName === 'TR'
        if (this.isReport) {
            this.unReaded = el.hasClassName('noread')
            this.url = el.querySelector('a').href.trim()
            this.ress = {
                wood: 0,
                cotton: 0,
                iron: 0,
                food: 0,
                coin: 0,
                other: '',
            }
            this.type = el.querySelector('img').alt.trim()
        }
    }

    async readDetial() {
        if (!_.isEmpty(this.url)) {
            const request = await fetch(this.url)
            const bodyText = await request.text()
            const ifm = createUnique('iframe', 'ixah-report')
            ifm.contentDocument.body.innerHTML = bodyText
        }
    }
}