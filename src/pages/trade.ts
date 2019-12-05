import { ofTrade, RareName, Rarity, TradeCard } from '@/components/card'
import IconBox from '@/components/icon-box'
import Icons from '@/components/icons'
import { createElement, createUnique, getAbsolutePos, makeLink, parseDom, query, queryAll, setCss } from '@/utils/dom'
import Optional from '@/utils/tool'
import { allPass, compose, equals, filter, forEach, gte, isNil, map, pipe } from 'ramda'

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
    'width': 'fit-content',
    'height': 'fit-content',
    'display': 'inline-grid',
    'grid-template-columns': '60px auto auto',
    'grid-template-rows': '30px auto',
    'grid-row-gap': '5px',
    'justify-items': 'center',
    'align-items': 'center',
} as const

const iconKeys = ['icon_ten', 'icon_goku', 'icon_toku'] as const

const FilterBox = () => {
    const boxDiv = createElement('div', 'filterBox', true)
    const iconBox = new IconBox(iconKeys.map((key => parseDom(Icons[key]))))

    setCss(boxDiv, FITLER_BOX_CSS)
    boxDiv.innerHTML = FITLER_BOX_HTML
    query(SELECTOR.FORM_BOX).then(box => box.append(boxDiv))
    const position = boxDiv.getClientRects()[0] || getAbsolutePos(boxDiv)
    boxDiv.onclick = e => {
        const target = e.target as HTMLElement
        switch (target.tagName.toLowerCase()) {
            case 'img':
                if (!iconBox.isShow) {
                    iconBox.show(position.left - 10, position.top)
                }
                break
            case 'button':
                if (!iconBox.isShow) {
                    searchBy(iconBox.value).then( optHandler => {
                        const clickAction = target.click
                        const oldText = target.textContent
                        target.textContent = '中止'
                        target.onclick = er => {
                            optHandler.then(clearTimeout)
                            target.textContent = oldText
                            target.onclick = clickAction
                        }
                    })
                }
                break
            default:
                break
        }
    }
    iconBox.putIn()
    iconBox.onChanged = (oldValue, newValue) => {
        query('img', boxDiv)
            .map(el => el as HTMLImageElement)
            .then(img => {
                img.src = newValue.src
                iconBox.close()
            })
    }

    return boxDiv
}

interface FilterOption {
    rareName: RareName|null
    canBuy: boolean
    rank: number
    rankMore: boolean
}

class FilterOption implements FilterOption {
    constructor() {
        this.canBuy = query(`input[name=${CUSTOM_SELECTOR.CAN_BUY_NAME}]`)
            .map(el => (el as HTMLInputElement).checked).getOrDefault(false)
        this.rank = Number(query(`select[name=${CUSTOM_SELECTOR.RANK_SELECTOR_NAME}]`)
            .map(el => (el as HTMLSelectElement).value).getOrDefault('0'))
        this.rankMore = query(`input[name=${CUSTOM_SELECTOR.RANK_MORE}]`)
            .map(el => (el as HTMLInputElement).checked).getOrDefault(false)
    }
}

function getLastPage(): number {
    return query(SELECTOR.LAST_PAGE_HREF)
            .map(aLink => new URL((aLink as HTMLLinkElement).href))
            .map(url => url.searchParams.get('p'))
            .map(rawNumber => Number(rawNumber))
            .getOrDefault(0)
}

function currentPageNumber(doc = document): string {
    return query(SELECTOR.CURRENT_PAGE, doc)
            .map(el => el.textContent)
            .getOrDefault('0')
}

/**
 *
 * @param ifrm IFrame target
 * @param mainDoc　Is main thread document?
 */
function nextPage(ifrm: HTMLIFrameElement, mainDoc= true) {
    const doc = mainDoc ? document : ifrm.contentDocument
    if (!doc) { return }
    query(SELECTOR.NEXT_PAGE, doc)
        .map(el => (el as HTMLLinkElement).href)
        .thenOrElse(url => ifrm.src = url, searchDone)
}

type Predicate = (card: TradeCard) => boolean

/**
 * find card by rarity name on passed document
 * @param rareName
 * @param doc default is current page
 * @returns TradeCard[]
 */
function findCardBy(filters: FilterOption, doc = document): TradeCard[] {
    if (!doc) { return [] }
    const cardElements = isNil(filters.rareName) ? queryAll(SELECTOR.TR_CARD, doc) :
        queryAll(SELECTOR.IMG_RARTY_CARD.replace('${rareName}', filters.rareName), doc)
    const filterPredicates: Predicate[] = [Boolean]
    if (filters.canBuy) { filterPredicates.push(card => card.canBuy) }

    if (filters.rank > 0) {
        const compare = filters.rankMore ? gte : equals
        filterPredicates.push(card => compare(card.rank, filters.rank))
    }
    const filterMethod = allPass(filterPredicates)
    // const r = pipe(
    //     map((el: Element) =>
    //         el.tagName === 'IMG' ? Optional.of(el.parentElement)
    //         .map((elp: Element) => elp.parentElement as HTMLTableRowElement).get()
    //          : el as HTMLTableRowElement),
    //     map((row: HTMLTableRowElement) => ofTrade(row)),
    //     filter(card => filterMethod(card)))([...cardElements])
    const selectEL = (el: Element) =>
        el.tagName === 'IMG' ? el.parentElement : el
    return compose(
        filter(filterMethod),
        map(ofTrade),
        map(el => el as HTMLTableRowElement),
        map(selectEL),
    )([...cardElements])
}

const renderFoundCards = pipe(findCardBy, render)

async function searchBy(rare: Rarity|null): Promise<Optional<NodeJS.Timeout>> {
    let timeHandler: NodeJS.Timeout | null = null
    const filterOpts = new FilterOption()
    filterOpts.rareName = isNil(rare) ? null : Rarity[rare] as RareName
    if (isNil(rare) && filterOpts.rank <= 0) { return Optional.of(null) }
    const ifrm = createUnique('iframe', 'cardPage', false) as HTMLIFrameElement
    ifrm.onload = () => {
        const doc = ifrm.contentDocument as Document
        renderFoundCards(filterOpts, doc)
        timeHandler = setTimeout(() => nextPage(ifrm, false), 100)
        updateSearchProgress(currentPageNumber(doc), pageSize)
    }
    const pageSize = getLastPage()
    if (pageSize > 1) {
        clearTableList()
        ifrm.src = `${location.pathname}?p=1`
    }
    return Optional.of(timeHandler)
}

/** dom update functions */
function clearTableList() {
    query(SELECTOR.CARD_TABLE)
        .then(table => queryAll('tr:not(.middle)', table).forEach(row => row.remove()))
}

function updateSearchProgress(current: number|string, total: number|string) {
    if (current > total) { total = current }
    query(`#${CUSTOM_SELECTOR.MESSAGE_BOX_ID}`)
        .then(box => box.textContent = `${current} / ${total}`)
}

function render(rows: TradeCard[]) {
    rows.forEach(card => {
        if (card.el) {
            query(SELECTOR.CARD_TABLE)
              .then(table => (table as HTMLTableElement).tBodies[0].append(card.el))
        }
    })
}

function searchDone() {
    // 初始化thickbox
    tb_init('a.thickbox, area.thickbox, input.thickbox')
    // 统一更改thickbox的id
    queryAll(`${SELECTOR.TR_CARD} td:nth-child(2)`)
        .forEach((el, i) => {
            query('a.thickbox', el as HTMLElement)
                .map(ela => ela as HTMLLinkElement)
                .then(alink => alink.href = alink.href.replace(/cardWindow_\d+/, `cardWindow_${i}`))
            query('div[id^=cardWindow]', el as HTMLElement)
                .then(eld => eld.id = `cardWindow_${i}`)
        })
}

// function addCardModalWindow() {
//     query(`${SELECTOR.CARD_TABLE} a`)
// }
/**
 * @method  searchByCardNumber
 */
const enableSearchByCardNumber = () => {
    const targets = queryAll('td.fs12')
    const getCardNumber = (el: HTMLElement) => el.innerText
    const replaceHTML = (el: HTMLElement) => {
        const cardNumber = getCardNumber(el)
        const params = new URLSearchParams()
        // parameters 't' and 'k' are required by ixa site
        params.append('t', 'no')
        params.append('k', cardNumber)
        // Posting to same page, reuse location.href
        const link = makeLink(new URL(location.href), params, cardNumber, '查询')
        el.innerHTML = link.outerHTML
    }
    Optional.of([...targets])
      .map(map(o => o as HTMLElement))
      .then(forEach(replaceHTML))
}

export default () => {
    FilterBox()
    enableSearchByCardNumber()
}
