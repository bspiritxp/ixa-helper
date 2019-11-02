import { Facility, KAJI, KIBA, Unit, YALI,
         // types below
         YUMI, } from '@/components/facility'
import { currentVillage } from '@/utils/data'
import { createElement, query, queryAll } from '@/utils/dom'
import { get, post } from '@/utils/io'
import Optional from '@/utils/tool'
import { compose, forEach, head, map, keys, pickBy } from 'ramda'
import forEachObjIndexed from 'ramda/es/forEachObjIndexed'

// variables to hold max trainable units per category
// TODO: rethink if there's a better way to fetch and store such data
// Update: reuse the variable to display different category's max trainable units,
// note that weaponry is special as it has more unit types than others

/* 槍 弓 騎馬 shared variables
 *  three variables to represent three levels of unit
 * also shared by different training mode
 * example:
 * normal training mode will require 3 variables to display low, mid, high trainable units
 * same as high speed training mode, upgrading mode will change the meaning of each variable
 * to be low->mid quantity, mid->high quantity, low->high quantity, respectively
 */
let lowQuantity: string
let midQuantity: string
let highQuantity: string

let lowDisplayName = ''
let midDisplayName = ''
let highDisplayName = ''

// 鍛治
let kaji1
let kaji2
let kaji3

const UnitCategory: {[key: string]: string} = {
    '槍': 'spear',
    '弓': 'bow',
    '馬': 'knight',
    '兵器': 'weaponry',
}

const TraningMode: {[key: string]: string} = {
    '普通': 'normal',
    '高速' : 'high_speed',
    '上位' : 'upgrade',
}

const UNIT_MODE_SELECTION_HTML = `
<div>
  <select id="category">
    <option>兵类</option>
  </select>
  <br>
  <select id="mode">
    <option>模式</option>
  </select>
</div>
`
const UNIT_TRAINING_HTML = `
<div>
  <span style="color:white">${lowDisplayName}</span> <input type="text" size="4" maxlength="8">
  <span style="text-decoration:underline;cursor:pointer"></span>
  <button type="button">確認</button><br>
  <span style="color:white">${midDisplayName}</span> <input type="text" size="4" maxlength="8">
  <span style="text-decoration:underline;cursor:pointer"></span>
  <button type="button">確認</button><br>
  <span style="color:white">$(highDisplayName)</span> <input type="text" size="4" maxlength="8">
  <span style="text-decoration:underline;cursor:pointer"></span>
  <button type="button">確認</button><br>
</div>
`

const Village = () => {
    const cv = currentVillage()
    if (cv.id === null) { return }
    query('select#select_village')
        .map(el => el as HTMLInputElement)
        .filter(el => el.value === '' )
        .then(partLocation => partLocation.value = cv.id ? cv.id.toString() : '')

    const unitTrainingDiv = createElement('div', 'unitTraining')

    query('#box').then(box => {
        const updatedHTML = initiateUI()
        unitTrainingDiv.innerHTML = updatedHTML
        box.append(unitTrainingDiv)
    })
    getMaxTrainableUnitCount()
}

const initiateUI = (): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(UNIT_MODE_SELECTION_HTML, 'text/html')
    let target = queryAll('#category', doc)

    //unit category
    const populateCategory = (el: HTMLSelectElement) => {
        forEachObjIndexed((unitId, unitDisplayName) => {
            const option = createElement('option') as HTMLOptionElement
            option.value = unitId
            option.text = unitDisplayName
            el.add(option)
        })(UnitCategory)
    }

    const bindEvent = (el: HTMLSelectElement) => {
        el.onchange = (e) => {
            console.log(e)
        }
        return el
    }

    compose(populateCategory, bindEvent, head, map(el=> el as HTMLSelectElement))([...target])






    //training mode
    // target = queryAll('#mode', doc)
    // const populateMode = (el: HTMLSelectElement) => {
    //     forEachObjIndexed((modeId, modeDisplayName) => {
    //         const option = createElement('option') as HTMLOptionElement
    //         option.value = modeId
    //         option.text = modeDisplayName
    //         el.add(option)
    //     })(TraningMode)
    // }
    // compose(populateMode, head, map(el => el as HTMLSelectElement))([...target])
    console.log(doc.body.innerHTML)
    return doc.body.innerHTML
}

const getMaxTrainableUnitCount = () => {
    // wrap in promise.all
    fetchYali()
    // fetchYumi()
    // fetchKiba()
    // fetchKaji()
}

// TODO: default tab will be normal training mode
// need to find a better way to fetch maximum trainable quantity from all three training mode
const fetchYali = () => {
    query('area[title^="足軽兵舎"]')
        .map(el => el as HTMLAreaElement)
        .then(elem => {
            const facility = new Facility(elem)
            const url = elem.href + '#tab1' // default to #tab1
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, YALI, 'Yali' as Unit)
                console.log('lv1: ' + lowQuantity)
                console.log('lv2: ' + midQuantity)
                console.log('lv3 ' + highQuantity)
            })
        })
}

const fetchYumi = () => {
    query('area[title^="弓兵舎"]')
        .map(el => el as HTMLAreaElement)
        .then(facility => {
            const url = facility.href
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, YUMI, 'Yumi' as Unit)
            })
        })
}

const fetchKiba = () => {
    query('area[title^="厩舎"]')
        .map(el => el as HTMLAreaElement)
        .then(facility => {
            const url = facility.href
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, KIBA, 'Kiba' as Unit)
            })
        })
}

const fetchKaji = () => {
    query('area[title^="兵器鍛冶"]')
        .map(el => el as HTMLAreaElement)
        .then(facility => {
            const url = facility.href
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, KAJI, 'Kaji' as Unit)
            })
        })
}

/*
 * @method getMaxPossiblequantity
 * @param doc Document
 * @param mapping {[k:string]: string} mapping object from unit level to unit code
 * @param unit: Unit differentiate what variable to use for storing unit training information
 */
// TODO: refactor to a better way of processing and storing unit training variable
const getMaxPossibleQuantity = (doc: Document, mapping: {[k: string]: string}, unit: Unit) => {
    // get the max possible quantity
    const targets = queryAll('span[onclick]', doc)
//        .map(el => el as HTMLSpanElement)
    const getQuantity = (span: HTMLSpanElement) => {
            const match = (/\d{3}/).exec(span.outerHTML)
            if (match) {
                const unitId = match[0]
                if (span.textContent) {
                    const pred = (v: string, k: string) => v === unitId
                    const unitLevel = compose(head, keys, pickBy(pred))(mapping)
                    console.log('unit level: ' + unitLevel)
                    switch (unit) {
                        case 'Yali':
                            switch (unitLevel) {
                                case '足軽':
                                    lowQuantity = span.textContent.slice(1, -1)
                                    break
                                case '長槍足軽':
                                    midQuantity = span.textContent.slice(1, -1)
                                    break
                                case '武士':
                                    highQuantity = span.textContent.slice(1, -1)
                                    break
                            }
                            break
                        case 'Yumi':
                            switch (unitLevel) {
                                case '弓足軽':
                                    lowQuantity = span.textContent.slice(1, -1)
                                    break
                                case '長弓兵':
                                    midQuantity = span.textContent.slice(1, -1)
                                    break
                                case '弓騎馬':
                                    highQuantity = span.textContent.slice(1, -1)
                                    break
                            }
                            break
                        case 'Kiba':
                            switch (unitLevel) {
                                case '騎馬兵':
                                    lowQuantity = span.textContent.slice(1, -1)
                                    break
                                case '精鋭騎馬':
                                    midQuantity = span.textContent.slice(1, -1)
                                    break
                                case '赤備え':
                                    highQuantity = span.textContent.slice(1, -1)
                                    break
                            }
                            break
                        case 'Kaji':
                            switch (unitLevel) {
                                case '破城鎚':
                                    kaji1 = span.textContent.slice(1, -1)
                                    break
                                case '攻城櫓':
                                    kaji2 = span.textContent.slice(1, -1)
                                    break
                                case '穴太衆':
                                    kaji3 = span.textContent.slice(1, -1)
                                    break
                            }
                            break
                    }

                }
            }
    }

    compose(forEach(getQuantity), map(o => o as HTMLSpanElement))([...targets])

}

export default () => {
    Village()
}
