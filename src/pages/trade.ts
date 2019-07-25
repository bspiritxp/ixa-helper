import Icons from "@/items/icons";
import IconBox from '@/items/icon-box';
import { create, setCss, queryAll, createUnique, query, parseDom, getAbsolutePos } from '@/utils/dom';
import { TradeCard, Rarity, RareName, ofTrade } from '@/items/card';
import _ from "lodash";
import Optional from "@/utils/tool";

enum SELECTOR {
    FORM_BOX = 'form[name=trade]',
    IMG_RARTY_CARD = 'table img[alt=${rareName}]',
    TR_CARD = 'table tr.fs12',
    LAST_PAGE_HREF = 'a[title="last page"]',
    NEXT_PAGE = '.pager .last a:nth-of-type(1)',
    CARD_TABLE = '.common_table1',
    CURRENT_PAGE = '.pager li span',
}

enum CUSTOM_SELECTOR {
    MESSAGE_BOX_ID = 'message',
    CAN_BUY_NAME = 'canBuy',
    RANK_SELECTOR_NAME = 'rank',
    SHOW_RARE_ICON = 'rareIcon',
    RANK_MORE = 'rankMore',
}

const FITLER_BOX_HTML = `
<div>
<img id="${CUSTOM_SELECTOR.SHOW_RARE_ICON}" src="" alt="无" title="无" width="30" height="30" 
    style="display: block;min-width: 30px;min-height: 30px;border: 1px solid #000;border-radius: 5px">
</div>
<div><button style="padding: 1.5px;border-radius: 3px" type="button">检索</button></div>
<div id="${CUSTOM_SELECTOR.MESSAGE_BOX_ID}">--</div>
<div><input type="checkbox" name="${CUSTOM_SELECTOR.CAN_BUY_NAME}" value/>仅可入札</div>
<div>--</div>
<div>
  <select name="${CUSTOM_SELECTOR.RANK_SELECTOR_NAME}">
      <option value="0" default>---</option>
      <option value="1">1★</option>
      <option value="2">2★</option>
      <option value="3">3★</option>
      <option value="4">4★</option>
      <option value="5">5★</option>
      <option value="6">限界突破</option>
  </select>&nbsp;<input type="checkbox" name="${CUSTOM_SELECTOR.RANK_MORE}" /> 含以上
</div>
<div></div>
`
const FITLER_BOX_CSS = {
    width: 'fit-content',
    height: 'fit-content',
    display: 'inline-grid',
    'grid-template-columns': '60px auto auto',
    'grid-template-rows': '30px auto',
    'grid-row-gap': '5px',
    'justify-items': 'center',
    'align-items': 'center',
} as const

const iconKeys = ['icon_ten', 'icon_goku', 'icon_toku'] as const;

const FilterBox = () => {
    const boxDiv = create('div', 'filterBox', true);
    const iconBox = new IconBox(iconKeys.map((key => parseDom(Icons[key]))));

    setCss(boxDiv, FITLER_BOX_CSS);
    boxDiv.innerHTML = FITLER_BOX_HTML;
    query(SELECTOR.FORM_BOX).then(box => box.append(boxDiv));
    const position = boxDiv.getClientRects()[0] || getAbsolutePos(boxDiv);
    boxDiv.onclick = e => {
        const target = e.target as HTMLElement;
        switch (target.tagName.toLowerCase()) {
            case 'img':
                if (!iconBox.isShow) {
                    iconBox.show(position.left - 10, position.top);
                }
                break;
            case 'button':
                if (iconBox.isShow) return;
                searchBy(iconBox.value).then(() => console.log('search start.'));
                break;
            default:
                break;
        }
    }
    iconBox.putIn();
    iconBox.onChanged = (oldValue, newValue) => {
        query('img', boxDiv)
            .map(el => el as HTMLImageElement)
            .then(img => {
                img.src = newValue.src;
                iconBox.close();
            })
    }

    return boxDiv;
}

interface FilterOption {
    rareName: RareName|null;
    canBuy: boolean;
    rank: number;
    rankMore: boolean;
}

class FilterOption implements FilterOption {
    constructor() {
        this.canBuy = query(`input[name=${CUSTOM_SELECTOR.CAN_BUY_NAME}]`).map(el => (el as HTMLInputElement).checked).getOrDefault(false)
        this.rank = Number(query(`select[name=${CUSTOM_SELECTOR.RANK_SELECTOR_NAME}]`).map(el => (el as HTMLSelectElement).value).getOrDefault('0'))
        this.rankMore = query(`input[name=${CUSTOM_SELECTOR.RANK_MORE}]`).map(el => (el as HTMLInputElement).checked).getOrDefault(false)
    }
}

function getLastPage(): number {
    return query(SELECTOR.LAST_PAGE_HREF)
            .map(aLink => new URL((aLink as HTMLLinkElement).href))
            .map(url => url.searchParams.get('p'))
            .map(rawNumber => Number(rawNumber))
            .getOrDefault(0);
}

function currentPageNumber(doc = document): string {
    return query(SELECTOR.CURRENT_PAGE, doc)
            .map(el => el.textContent)
            .getOrDefault('0');
}

/**
 * 
 * @param ifrm IFrame target
 * @param mainDoc　Is main thread document?
 */
function nextPage(ifrm: HTMLIFrameElement, mainDoc=true) {
    const doc = mainDoc ? document : ifrm.contentDocument;
    if (!doc) return;
    query(SELECTOR.NEXT_PAGE, doc)
        .map(el => (el as HTMLLinkElement).href)
        .thenOrElse(url => ifrm.src = url, searchDone);
}

/**
 * find card by rarity name on passed document
 * @param rareName 
 * @param doc default is current page
 * @returns TradeCard[]
 */
function findCardBy(filters: FilterOption, doc = document): TradeCard[] {
    if (!doc) return []
    const chains = _.isNull(filters.rareName) ? _.chain(queryAll(SELECTOR.TR_CARD, doc)) :
        _.chain(queryAll(SELECTOR.IMG_RARTY_CARD.replace('${rareName}', filters.rareName), doc));
    const r = chains
        .map(el => el.tagName == 'IMG' ? Optional.ofNullable(el.parentElement).map(elp => elp.parentElement as HTMLTableRowElement).get() : el as HTMLTableRowElement)
        .map(row => ofTrade(row))
        .filter(card => {
            const flgs: boolean[] = [true]
            if (filters.canBuy) {
                flgs.push(card.canBuy)
            }
            if (filters.rank > 0) {
                flgs.push(filters.rankMore ? card.rank >= filters.rank : card.rank == filters.rank)
            }
            return !flgs.includes(false);
        })
    return r.value();
}

const renderFoundCards = _.flow([findCardBy, render]);

async function searchBy(rare: Rarity|null) {
    const filterOpts = new FilterOption();
    filterOpts.rareName = _.isNull(rare) ? null : Rarity[rare] as RareName;
    if (_.isNull(rare) && filterOpts.rank <= 0) return;
    const ifrm = createUnique('iframe', 'cardPage', false) as HTMLIFrameElement;
    ifrm.onload = () => {
        const doc = ifrm.contentDocument as Document;
        renderFoundCards(filterOpts, doc);
        setTimeout(() => nextPage(ifrm, false), 100);
        updateSearchProgress(currentPageNumber(doc), pageSize);
    }
    const pageSize = getLastPage();
    if (pageSize > 1) {
        clearTableList();
        ifrm.src = `${location.pathname}?p=1`;
    }
}

/** dom update functions */
function clearTableList() {
    query(SELECTOR.CARD_TABLE)
        .then(table => queryAll('tr:not(.middle)', table).forEach(row => row.remove()));
}

function updateSearchProgress(current: number|string, total: number|string) {
    if (current > total) total = current;
    query(`#${CUSTOM_SELECTOR.MESSAGE_BOX_ID}`)
        .then(box => box.textContent = `${current} / ${total}`);
}

function render(rows: TradeCard[]) {
    rows.forEach(card => {
        if (card.el) {
            query(SELECTOR.CARD_TABLE)
              .then(table => (table as HTMLTableElement).tBodies[0].append(card.el));
        }
    });
}

function searchDone() {
    // 初始化thickbox
    tb_init('a.thickbox, area.thickbox, input.thickbox');
    // 统一更改thickbox的id
    queryAll(`${SELECTOR.TR_CARD} td:nth-child(2)`)
        .forEach((el, i) => {
            query('a.thickbox', el as HTMLElement)
                .map(ela => ela as HTMLLinkElement)
                .then(alink => alink.href = alink.href.replace(/cardWindow_\d+/, `cardWindow_${i}`));
            query('div[id^=cardWindow]', el as HTMLElement)
                .then(eld => eld.id = `cardWindow_${i}`);
        })
}

// function addCardModalWindow() {
//     query(`${SELECTOR.CARD_TABLE} a`)
// }

export default () => {
    const filterBox = FilterBox();
}