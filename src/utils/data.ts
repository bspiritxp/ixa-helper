import { Report, Village } from '@/components'
import { query, queryAll, queryLocGroup } from '@/utils/dom'
import { map } from 'ramda'

const locationGroup = (s: string) => queryLocGroup(s)

const currentVillage = () => new Village(query('li.on[data-village_id]'))

const mainCity = () => new Village(query('.my_capital li'))

const myVillages = () => locationGroup('.my_country.village li')

const myFronts = () => locationGroup('.other_country li:not(.head)')

const reports = () => map(el => new Report(el as HTMLElement))([...queryAll('table.p_report tr:not(:nth-child(1))')])

const totalMoney = () => {
    return query('.money_b').map(el => el.textContent as number|null).getOrDefault(0)
}

export {
    currentVillage, // current selected village
    mainCity,       // player's main village
    myFronts,       // player's fronts
    myVillages,     // all villages of player
    reports,
    totalMoney,
}
