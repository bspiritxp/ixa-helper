import { Facility, KAJI, KIBA, YALI, YUMI } from '@/components/facility'
import { currentVillage } from '@/utils/data'
import { makeLink, query, queryAll } from '@/utils/dom'
import { get, post } from '@/utils/io'
import Optional from '@/utils/tool'
import { forEach, map } from 'ramda'
import { compose, head, keys, pickBy } from 'ramda'

// variables to hold max trainable units per category
// TODO: rethink if there's a better way to fetch and store such data
// 槍
let yali1
let yali2
let yali3
// 弓
let yumi1
let yumi2
let yumi3
// 騎馬
let kiba1
let kaba2
let kiba3
// 鍛治
let kaji1
let kaji2
let kaji3

const UNIT_TRAINING_HTML = `
<div>

</div>
`

const Village = () => {
    const cv = currentVillage()
    if (cv.id === null) { return }
    query('select#select_village')
        .map(el => el as HTMLInputElement)
        .filter(el => el.value === '' )
        .then(partLocation => partLocation.value = cv.id ? cv.id.toString() : '')

    const getMaxTrainableUnitCount = () => {
        // wrap in promise.all
    }

    // TODO: default tab will be normal training mode
    // need to find a better way to fetch maximum trainable quantity from all three training mode
    const fetchYali = () => {
        query('area[title^="足軽兵舎"]')
            .map(el => el as HTMLAreaElement)
            .then(facility => {
                const url = facility.href // default to #tab1
                get(url).then(doc => {
                    // get the max possible quantity
                    query('span[onclick]', doc)
                        .map(el => el as HTMLSpanElement)
                        .then(span => {
                            // figure out whether we are able to train a unit type
                            const match = (/\d{3}/).exec(span.outerHTML)
                            if (match) {
                                const unitId = match[0]
                                if (span.textContent) {
                                    const pred = (v: string, k: string) => v === unitId
                                    const unitType = compose(head, keys, pickBy(pred))(YALI)
                                    switch (unitType) {
                                        case 'lv1':
                                            yali1 = span.textContent.slice(1, -1)// remove parenthesis
                                            break
                                        case 'lv2':
                                            yali2 = span.textContent.slice(1, -1)// remove parenthesis
                                            break
                                        case 'lv3':
                                            yali3 = span.textContent.slice(1, -1)// remove parenthesis
                                            break
                                    }

                                }

                            }

                        })
                })
            })

    }

    const fetchYumi = () => {
        query('area[title^="弓兵舎"]')
            .map(el => el as HTMLAreaElement)
            .then(facility => {
                const url = facility.href
                get(url).then(doc => {
                    // get the max possible quantity
                    query('span[onclick]', doc)
                        .map(el => el as HTMLSpanElement)
                        .then()
                })
            })

    }

    const fetchKiba = () => {
        query('area[title^="厩舎"]')
            .map(el => el as HTMLAreaElement)
            .then(facility => {
                const url = facility.href
                get(url).then(doc => {
                    // get the max possible quantity
                    query('span[onclick]', doc)
                        .map(el => el as HTMLSpanElement)
                        .then()
                })
            })

    }

    const fetchKaji = () => {
        query('area[title^="兵器鍛冶"]')
            .map(el => el as HTMLAreaElement)
            .then(facility => {
                const url = facility.href
                get(url).then(doc => {
                    // get the max possible quantity
                    query('span[onclick]', doc)
                        .map(el => el as HTMLSpanElement)
                        .then()
                })
            })

    }

    /**
     * @method  searchByCardNumber
     */
    const enableSearchByCardName = () => {
        const base = document.location.protocol + '//' + document.location.host
        const path = '/card/trade.php'
        const targets = queryAll('.ig_deck_smallcard_cardname')

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

        // compose(forEach(replaceHTML), map(o => o as HTMLElement))([...targets])
        Optional.of([...targets])
            .map(map(o => o as HTMLElement))
            .then(forEach(replaceHTML))
    }
}
export default () => {
    Village()
}
