import { createUnique, query } from '@/utils/dom';
import Optional, { mapOpt, safeGet } from '@/utils/tool';
import { findKey } from 'lodash';
import {
    compose,
    equals,
    filter,
    forEach,
    head,
    isEmpty,
    match,
    not,
    pipe,
    slice,
    split,
    trim,
} from 'ramda';

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
    public dom: HTMLTableRowElement | null = null;
    public type: string = '';
    public isReport: boolean = false;
    public unReaded: boolean = false;
    public url: string = '';
    public ress = new Map();

    constructor(el: HTMLElement) {
        this.dom = el as HTMLTableRowElement;
        this.isReport = Boolean(el && el.tagName && el.tagName === 'TR' && el.childElementCount > 3);
        if (this.isReport) {
            this.unReaded = el.classList.contains('noread');
            this.url = Optional.of(el.querySelector('a'))
                .map((aEL: {href: string}) => aEL.href.trim()).getOrDefault('');
            // this.type = query('img', el)
            //     .map((img: {alt: string}) => img.alt.trim()).getOrDefault('other');
            this.type = compose(
                safeGet('other'),
                mapOpt((img: HTMLElement) => (img as HTMLImageElement).alt.trim()),
                )(query('img', el));
        }
    }

    public async readDetial() {
        if (!(isEmpty(this.url) || this.dom === null)) {
            const firstTd = this.dom.firstElementChild as HTMLElement;
            if (firstTd) { firstTd.style.backgroundColor = '#990000'; }
            const request = await fetch(this.url);
            const bodyText = await request.text();
            const ifm = createUnique('iframe', 'ixah-report', false) as HTMLIFrameElement;
            Optional.of(ifm.contentDocument)
              .then(ifmDocument => {
                ifmDocument.body.innerHTML = bodyText;
                Optional.of(ifmDocument.querySelector(this._selector()) as HTMLElement)
                    .then(this.fetchRess.bind(this));
            });
            if (firstTd) { firstTd.style.backgroundColor = '#fff'; }
        }
    }

    private fetchRess(el: HTMLElement) {
        // _(el.innerText.trim().split(' '))
        //     .filter(t => t.trim() !== '')
        //     .slice(1, -1)
        //     .each(text => {
                // const ressKey = _.findKey(RESOURCE_TYPE, o => o === text[0]);
        //         if (ressKey) {
        //             const r = /(\d+)$/.exec(text);
        //             const value = _.isArray(r) ? r[0] : 0;
        //             this.ress.set(ressKey, Number(value));
        //         }
        //     });
        const sumary = (ressTexts: string[]) =>
            forEach((text: string) =>
                this.ress.set(findKey(RESOURCE_TYPE, equals(text[0])),
                    compose(Number, head, match(/\d+$/))(text[0])));

        return pipe(
            trim, split(' '),
            filter((s: string) => compose(not, isEmpty)(s)),
            slice(1, -1),
            sumary)(el.innerText);
    }
    private _selector() {
        return this.type === REPORT_TYPE.DISCOVERY ? 'p.gettreger' : 'div.got_item';
    }
}
