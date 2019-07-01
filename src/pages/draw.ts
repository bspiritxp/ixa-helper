import { query, queryAll, createUnique } from '@/utils/dom'
import { totalMoney } from '@/utils/data'
import _ from 'lodash'
import Optional from '@/utils/tool';
import { parseDom } from '../utils/dom';

const continueDraw = `
    <input id="drawLimit" type="number" value="1" min="1" max="10" size="3" style="width: 3rem" />
    <button id='drawBtn' style="padding: 0.5rem">Draw</button>
`;

enum KUJI_TYPE {
    UNKNOWN = '',
    WHITE = '戦国くじ【白】',
}

enum SELECTOR {
    KUJI_TITLE = '.b_cm_title',
    FORM_NAME = 'sengokukuji',
    CARD_BOX = '.cardresult',
    CARD_RESULT = '.cardstatus',
    CARD_NUMBER = '#ixaDogFootNavi dl dd:last-child',
    CARD_STOCK = 'p.l_cardstock',
    DRAW_BUTTON = 'a.right',
    MONEY_BOX = '.money_b',
    KUJI_RESULT_IMG = 'img[alt="戦国くじの結果"]',
}

const afterDraw = (cardNum: number, money: number) => {
    const cardNumberEL = <HTMLElement>query(SELECTOR.CARD_NUMBER);
    const moneyEL = <HTMLElement>query(SELECTOR.MONEY_BOX);
    const cardStockEL = <HTMLElement>query(SELECTOR.CARD_STOCK);
    if (cardNumberEL && moneyEL && cardStockEL) {
        cardNumberEL.innerText = cardNum.toString();
        moneyEL.innerText = money.toString();
        let [cn, tn] = _.map(cardStockEL.innerText.trim().split('/'), t => Number(t.trim()));
        cn = tn - cardNum;
        cardStockEL.innerText = `${cn} / ${tn}`;
    }
}

const cardNums = (text: string|null) => text ? Number(text.substr(0, text.length - 1)) : 0


const kujiForm = document.forms.namedItem(SELECTOR.FORM_NAME);
const draw = async () => {
    const limit = Optional.ofNullable(query('input#drawLimit'))
                    .map((el: Element) => Number((<HTMLInputElement>el).value))
                    .getOrDefault(1);
    const ifm = <HTMLIFrameElement>createUnique('iframe', 'cardResult', false);
    const cardBox = Optional.ofNullable(<HTMLElement>query(SELECTOR.CARD_BOX));
    if (kujiForm) {
        let money = totalMoney();
        let cardNum = Optional.ofNullable(<HTMLElement>query(SELECTOR.CARD_NUMBER))
            .map((el: { textContent: any; }) => el.textContent)
            .map((raw: string) => cardNums(raw))
            .get();
        const fmData = new FormData(kujiForm);
        queryAll(SELECTOR.CARD_RESULT).forEach((o: { remove: () => void; }) => o.remove());
        for(let i=0;i<limit;i++) {
            if (money < 500) {
                alert('铜钱不足');
                return;
            }
            if (cardNum <= 0) {
                alert('卡位不足');
                return;
            }
            const rep = await fetch(kujiForm.action, { method: kujiForm.method, body: fmData })
            const content = await rep.text();
            if (ifm.contentDocument) {
                ifm.contentDocument.body.innerHTML = content;
                const newCard = <HTMLElement>ifm.contentDocument.querySelector(SELECTOR.CARD_RESULT);
                newCard.prepend(parseDom(`<h3>第${i+1}枚</h3>`));
                money = Optional.ofNullable(ifm.contentDocument.querySelector(SELECTOR.MONEY_BOX))
                    .map((el: { textContent: string|null; }) => el.textContent)
                    .map((content: string) => Number(content))
                    .getOrDefault(0);
                cardNum = Optional.ofNullable(ifm.contentDocument.querySelector(SELECTOR.CARD_NUMBER))
                    .map((el: { textContent: string|null; }) => cardNums(el.textContent))
                    .get();
                cardBox
                    .map(el => el.firstElementChild)
                    .then(child => child.after(newCard));
                afterDraw(cardNum, money);
            }
        }        
    }
};

export default (jq$: CallableFunction|null) => {
    const kujiType = Optional.ofNullable(query(SELECTOR.KUJI_TITLE)).map((el: { textContent: string|null; }) => el.textContent).getOrDefault(KUJI_TYPE.UNKNOWN).trim();
    if (kujiType !== KUJI_TYPE.WHITE) return;
    if (jq$) {
        jq$(SELECTOR.KUJI_RESULT_IMG).after(jq$(continueDraw));
        jq$('button#drawBtn').on('click', draw);
    } else {
        const container = document.createElement('span');
        container.innerHTML = continueDraw;
        const box = query(SELECTOR.KUJI_RESULT_IMG);
        Optional.ofNullable(box).then((el: { after: (arg0: HTMLSpanElement) => void; }) => el.after(container));
        Optional.ofNullable(query('button#drawBtn')).then((el: { addEventListener: (arg0: string, arg1: () => Promise<void>) => void; }) => el.addEventListener('click', draw));
    }
}