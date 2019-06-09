import _ from 'lodash'
import { Village } from 'Items'
import { query, queryLocGroup } from 'Utils/dom'

const locationGroup = _.partial(queryLocGroup, _, cssSelector => new Village(cssSelector))

const currentVillage = () => new Village(query('li.on[data-village_id]'))

const mainCity = () => new Village(query('.my_capital li'))

const myVillages = () => locationGroup('.my_country.village li')

const myFronts = () => locationGroup('.other_country li:not(.head)')

export {
    currentVillage,
    mainCity,
    myFronts,
    myVillages,
}