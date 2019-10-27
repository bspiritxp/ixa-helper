import { createUnique } from '@/utils/dom'
import Optional from '@/utils/tool'
import {
    forEach,
    isEmpty,
    isNil,
    match,
    pipe,
    prop,
    slice,
} from 'ramda'

enum REPORT_TYPE {
    DISCOVERY = '秘境探索',
    SPACE_ATTACK = '空き地攻撃',
}

const RESOURCE_TYPE = {
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
            this.url = Optional.ofNullable(el.querySelector('a'))
                .map((aEL: {href: string}) => aEL.href.trim()).getOrDefault('')
            this.type = Optional.ofNullable(el.querySelector('img'))
                .map((img: {alt: string}) => img.alt.trim()).getOrDefault('other')
        }
    }

    public async readDetail() {
        if (!isEmpty(this.url) && !isNil(this.dom)) {
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
        const populateResource = (resource: string[]) => {
            const regex = /\d+$/ // match resource amount
            forEach((res: string) => {
                this.ress.set(prop(res[0])(RESOURCE_TYPE), Number(match(regex, res)[0]))
            })(resource)
        }

        // 过滤掉与资源无关的信息，把资源与对应量存入映射变量
        // TODO: might reconsider data structure of using a Map object to store a pair
        // use pair from 'ramda' instead, and store as an object
        const process = pipe(
            slice(1, -1),
            populateResource,
        )

        process(el.innerText.trim().split(' '))
    }
    private _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item'
    }
}
