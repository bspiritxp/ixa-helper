import { query, queryAll, createUnique } from '@/utils/dom'
import { totalMoney } from '@/utils/data'
import _ from 'lodash'
import Optional from '@/utils/tool'
import { parseDom, create } from '@/utils/dom'

const continueDraw = `
    <input id="drawLimit" type="number" value="1" min="1" max="10" size="3" style="width: 3rem" />
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
    const cardNumberEL = query(SELECTOR.CARD_NUMBER).get();
    const moneyEL = query(SELECTOR.MONEY_BOX).get();
    const cardStockEL = query(SELECTOR.CARD_STOCK).get();
    cardNumberEL.innerText = `${cardNum}枚`;
    moneyEL.innerText = money.toString();
    let [cn, tn] = _.map(cardStockEL.innerText.trim().split('/'), t => Number(t.trim()));
    cn = tn - cardNum;
    cardStockEL.innerText = `${cn} / ${tn}`;
}

const cardNums = (text: string|null) => text ? Number(text.replace('枚', '')) : 0;


const kujiForm = document.forms.namedItem(SELECTOR.FORM_NAME);
const draw = async () => {
    const limit = query('input#drawLimit')
                    .map((el: Element) => Number((<HTMLInputElement>el).value))
                    .getOrDefault(1);
    const ifm = <HTMLIFrameElement>createUnique('iframe', 'cardResult', false);
    const cardBox = query(SELECTOR.CARD_BOX);
    if (kujiForm) {
        let money = totalMoney();
        let cardNum = query(SELECTOR.CARD_NUMBER)
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
                newCard.prepend(parseDom(`<p><b>第${i+1}枚</b></p>`));
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

const initDrawBtn = (container: HTMLSpanElement) => {
    const btn = create('button', 'drawBtn');
    btn.style.cssText = 'padding: 0.5rem';
    btn.textContent = 'Draw';
    btn.onclick = draw
    container.appendChild(btn);
}

export default () => {
    const kujiType = query(SELECTOR.KUJI_TITLE).map((el: { textContent: string|null; }) => el.textContent).getOrDefault(KUJI_TYPE.UNKNOWN).trim();
    if (kujiType !== KUJI_TYPE.WHITE) return;
    const container = document.createElement('span');
    container.innerHTML = continueDraw;
    query(SELECTOR.KUJI_RESULT_IMG).then((el: { after: (arg0: HTMLSpanElement) => void; }) => el.after(container));
    initDrawBtn(container);
}