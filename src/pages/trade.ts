import Icons from "@/items/icons";
import IconBox from '@/items/icon-box';
import { create, setCss, queryAll, createUnique, query, parseDom, getAbsolutePos } from '@/utils/dom';
import { TradeCard, Rarity, RareName, ofTrade } from '@/items/card';
import _ from "lodash";
import Optional from "@/utils/tool";


enum SELECTOR {
    FORM_BOX = 'form[name=trade]',
    IMG_RARTY_CARD = 'table img[alt=${rareName}]',
    LAST_PAGE_HREF = 'a[title="last page"]',
    NEXT_PAGE = '.pager .last a:nth-of-type(1)',
    CARD_TABLE = '.common_table1',
}

const iconKeys = ['icon_ten', 'icon_goku', 'icon_toku'] as const;

const FilterBox = () => {
    const SHOW_RARE_ICON = 'rareIcon';
    const boxDiv = create('div', 'filterBox', true);
    const iconBox = new IconBox(iconKeys.map((key => parseDom(Icons[key]))));

    setCss(boxDiv, {
        width: 'fit-content',
        height: 'fit-content',
        display: 'inline-grid',
        'grid-template-columns': '1fr 2fr auto',
        'justify-items': 'center',
    });
    boxDiv.innerHTML = `
      <div><img id="${SHOW_RARE_ICON}" src="" alt="无" title="无" width="30" height="30" style="display: block;border: 1px solid #000;border-radius: 5px"></div>
      <div><button type="button">检索</button></div>
    `
    Optional.ofNullable(query(SELECTOR.FORM_BOX)).then(box => box.append(boxDiv));
    const position = boxDiv.getClientRects()[0] || getAbsolutePos(boxDiv);
    boxDiv.onclick = e => {
        const target = e.target as HTMLElement;
        switch (target.tagName.toLowerCase()) {
            case 'img':
                if (!iconBox.isShow) {
                    iconBox.show(position.left - 10, position.top - iconBox.offsetHeight);
                }
                break;
            case 'button':
                if (iconBox.isShow) return;
                searchBy(iconBox.value).then(() => console.log('search done.'));
                break;
            default:
                break;
        }
    }
    iconBox.putIn();
    iconBox.onChanged = (oldValue, newValue) => {
        Optional.ofNullable(boxDiv.querySelector('img'))
            .then(img => {
                img.src = newValue.src;
                iconBox.close();
            })
    }

    return boxDiv;
}

/**
 * find card by rarity name on passed document
 * @param rareName 
 * @param doc default is current page
 * @returns TradeCard[]
 */
function findCardBy(rareName: RareName, doc = document): TradeCard[] {
    if (!doc) return []
    const r = _.chain(queryAll(SELECTOR.IMG_RARTY_CARD.replace('${rareName}', rareName), doc))
        .map(el => 
            Optional.ofNullable(el.parentElement)
            .map(elp => ofTrade(elp.parentElement as HTMLTableRowElement)).get())
        .value();
    return r;
}

function getLastPage(): number {
    return Optional.ofNullable(query(SELECTOR.LAST_PAGE_HREF))
            .map(aLink => new URL((aLink as HTMLLinkElement).href))
            .map(url => url.searchParams.get('p'))
            .map(rawNumber => Number(rawNumber))
            .getOrDefault(0);
}

function render(rows: TradeCard[]) {
    rows.forEach(card => {
        if (card.el) {
            Optional.ofNullable(query(SELECTOR.CARD_TABLE))
              .then(table => table.append(card.el));
        }
    });
}

/**
 * 
 * @param ifrm IFrame target
 * @param mainDoc　Is main thread document?
 */
function nextPage(ifrm: HTMLIFrameElement, mainDoc=true) {
    const doc = mainDoc ? document : ifrm.contentDocument;
    if (!doc) return;
    Optional.ofNullable(query(SELECTOR.NEXT_PAGE, doc))
        .map(el => (el as HTMLLinkElement).href)
        .then(url => ifrm.src = url);
}

const renderFoundCards = _.flow([findCardBy, render]);

function clearTableList() {
    Optional.ofNullable(query(SELECTOR.CARD_TABLE))
        .then(table => table.querySelectorAll('tr:not(.middle)').forEach(row => row.remove()));
}

async function searchBy(rare: Rarity|null) {
    if (_.isNull(rare)) return;
    const rareName = Rarity[rare] as RareName;
    const ifrm = createUnique('iframe', 'cardPage', false);
    ifrm.onload = () => {
        renderFoundCards(rareName, ifrm.contentDocument);
        setTimeout(() => nextPage(ifrm, false), 100);
    }
    const pageSize = getLastPage();
    if (rareName && pageSize > 1) {
        clearTableList();
        // start search by current page
        renderFoundCards(rareName);
        nextPage(ifrm);
    }
}

export default () => {
    const filterBox = FilterBox();
}