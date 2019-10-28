import { currentVillage } from '@/utils/data'
import { makeLink, query, queryAll } from '@/utils/dom'
import { map } from 'ramda'

const Deck = () => {
    const cv = currentVillage()
    if (cv.id === null) { return }
    query('select#select_village')
      .map(el => el as HTMLInputElement)
      .filter(el => el.value === '' )
      .then(partLocation => partLocation.value = cv.id ? cv.id.toString() : '')

    // Apply search feature for trading on deck.php
    const base = document.location.protocol + '//' + document.location.host
    const path = '/card/trade.php'
    const targets = queryAll('.ig_deck_smallcard_cardname') as HTMLElement[]

    const getCardName = (el: HTMLElement) => el.innerText
    const replaceHTML =  (el: HTMLElement) => {
        const name = getCardName(el)
        const url = new URL(path, base)
        // get rid of '?' in 'search'
        const params = new URLSearchParams(url.search.slice(1))
        // parameters 't' and 'k' are required by ixa site
        params.append('t', 'name')
        params.append('k', name)
        const link = makeLink(url, params, name, '交易所查询')
        el.innerHTML = link.outerHTML
    }

    map(replaceHTML, targets)
}

export default Deck
