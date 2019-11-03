import { Facility, KAJI, KIBA, Unit, YALI,
         // types below
         YUMI,
         TRAINING_MODE} from '@/components/facility'
import { currentVillage } from '@/utils/data'
import { createElement, query, queryAll } from '@/utils/dom'
import { get, post } from '@/utils/io'
import Optional from '@/utils/tool'
import { compose, equals, forEach, head, isNil, keys, last, map, nth, pickBy, splitEvery, zip } from 'ramda'
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

// 鍛治
let kaji1
let kaji2
let kaji3

let currentSelectedCategory: string
let unitCountMap: [string, string][]
const UnitCategory: {[key: string]: string} = {
    槍: 'spear',
    弓: 'bow',
    馬: 'knight',
    兵器: 'weaponry',
}

const TraningMode: {[key: string]: string} = {
    普通: 'normal',
    高速 : 'high_speed',
    上位 : 'upgrade',
}

const SELECTION_HTML = `
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
const inputDisplayHtmlTemplate = (...names: string[]) => `
<div id="unit-display">
<label style="color:white">${names[0]}</label> <input type="text" size="4" maxlength="8">
<span name="low" style="color:white;text-decoration:underline;cursor:pointer"></span>
<button type="button">確認</button><br>
<label style="color:white">${names[1]}</label> <input type="text" size="4" maxlength="8">
<span name="mid" style="color:white;text-decoration:underline;cursor:pointer"></span>
<button type="button">確認</button><br>
<label style="color:white">${names[2]}</label> <input type="text" size="4" maxlength="8">
<span name="high" style="color:white;text-decoration:underline;cursor:pointer"></span>
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
        const updatedSelectionHTML = initiateSelectOptions()
        unitTrainingDiv.innerHTML = updatedSelectionHTML + inputDisplayHtmlTemplate(...['足軽', '長槍足軽', '武士'])
        box.append(unitTrainingDiv)

        //initialize unit count map, default to Yali
        getMaxTrainableUnitCount('Yali' as Unit)
    })
    // bind event to select element
    // Need to bind event on main document, not the parsed partial one, as we need event delegate
    // for dynamically added element
    query('#category', unitTrainingDiv).map(el => el as HTMLSelectElement)
        .then( selection => {
            selection.addEventListener('change', event => {
                const triggeredElement = event.target as HTMLSelectElement
                switch (triggeredElement.value) {
                    case 'spear':
                        refreshDisplayHTML(unitTrainingDiv, ['足軽', '長槍足軽', '武士'])
                        currentSelectedCategory = 'spear'
                        getMaxTrainableUnitCount('Yali' as Unit)
                        break
                    case 'bow':
                        refreshDisplayHTML(unitTrainingDiv, ['弓足軽', '長弓兵', '弓騎馬'])
                        currentSelectedCategory = 'bow'
                        getMaxTrainableUnitCount('Yumi' as Unit)
                        break
                    case 'knight':
                        refreshDisplayHTML(unitTrainingDiv, ['騎馬兵', '精鋭騎馬', '赤備え'])
                        currentSelectedCategory = 'knight'
                        getMaxTrainableUnitCount('Kiba' as Unit)
                        break
                    case 'weaponry':
                        refreshDisplayHTML(unitTrainingDiv, ['破城鎚', '攻城櫓', '穴太衆'])
                        currentSelectedCategory = 'weaponry'
                        getMaxTrainableUnitCount('Kaji' as Unit)
                        break
                }
            })
        })

}
const refreshDisplayHTML = (elm: HTMLElement, names: string[]) => {
    query('div#unit-display', elm).map(el => el as HTMLDivElement)
        .then(div => {
            div.outerHTML = inputDisplayHtmlTemplate(...names)
        })
}

const initiateSelectOptions = (): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(SELECTION_HTML, 'text/html')
    let target = queryAll('select#category', doc)

    // unit category
    const populateCategory = (el: HTMLSelectElement) => {
        forEachObjIndexed((unitId, unitDisplayName) => {
            const option = createElement('option') as HTMLOptionElement
            option.value = unitId
            option.text = unitDisplayName
            el.add(option)
        })(UnitCategory)
    }

    compose(populateCategory, head, map(el => el as HTMLSelectElement))([...target])

    // training mode
    target = queryAll('#mode', doc)
    const populateMode = (el: HTMLSelectElement) => {
        forEachObjIndexed((modeId, modeDisplayName) => {
            const option = createElement('option') as HTMLOptionElement
            option.value = modeId
            option.text = modeDisplayName
            el.add(option)
        })(TraningMode)
    }
    compose(populateMode, head, map(el => el as HTMLSelectElement))([...target])
    return doc.body.innerHTML
}

//TODO: tie data fetching with category and mode selection
const getMaxTrainableUnitCount = async (category: Unit) => {
    switch (category) {
        case 'Yali':
            await fetchYali()
            break
        case 'Yumi':
            await fetchYumi()
            break
        case 'Kiba':
            await fetchKiba()
            break
        case 'Kaji':
            await fetchKaji()
            break
    }
}

// TODO: default tab will be normal training mode
// need to find a better way to fetch maximum trainable quantity from all three training mode
const fetchYali = async () => {
    query('area[title^="足軽兵舎"]')
        .map(el => el as HTMLAreaElement)
        .then(elem => {
            const facility = new Facility(elem)
        //    facility.trainUnit()
            const url = elem.href + '#tab1' // default to #tab1
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, 'Yali' as Unit)
                populateCountToUI(unitCountMap)
            })
        })
}

const fetchYumi = async () => {
    query('area[title^="弓兵舎"]')
        .map(el => el as HTMLAreaElement)
        .then(elem => {
            const facility = new Facility(elem)
            const url = elem.href + '#tab1'
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, 'Yumi' as Unit)
                populateCountToUI(unitCountMap)
            })
        })
}

const fetchKiba = async () => {
    query('area[title^="厩舎"]')
        .map(el => el as HTMLAreaElement)
        .then(elem => {
            const facility = new Facility(elem)
            const url = elem.href + '#tab1'
            get(url).then(doc => {
                getMaxPossibleQuantity(doc,  'Kiba' as Unit)
                populateCountToUI(unitCountMap)
            })
        })
}

const fetchKaji = async () => {
    query('area[title^="兵器鍛冶"]')
        .map(el => el as HTMLAreaElement)
        .then(facility => {
            const url = facility.href
            get(url).then(doc => {
                getMaxPossibleQuantity(doc, 'Kaji' as Unit)
                populateCountToUI(unitCountMap)
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
const getMaxPossibleQuantity = (doc: Document,  unit: Unit) => {
    // get the max possible quantity
    //    const targets = queryAll('span[onclick]', doc)

    // The idea is to form a list so that
    // [a, b, c], [1, 2, 3] => [[a, 1], [b, 2], [c, 3]]
    // where a, b,c are unit id, 1, 2, 3 are possible unit count
    let unitIdList: string[] = []
    let possibleUnitCount: string[] = []
//    let tupleList: [string, string][]
    const targets = queryAll('form[name="createUnitForm"]', doc)
    const getQuantity = (form: HTMLFormElement) => {
        const match  = (/\(\d+\)/).exec(form.innerText.trim())
        isNil(match) ? possibleUnitCount.push('0') : possibleUnitCount.push(match[0])

        query('input', form).map(el => el as HTMLInputElement).then( input => {
            if(input) {
                const examString = input.id
                const match = (/(\d{3})_?(\d{3})?/).exec(examString)
                let toUnitId: string , fromUnitId: string

                if(match){ //not likely to be no match
                    if(equals(match[0], match[1])) { //normal or high speed training
                        toUnitId = match[1]  //full match and first group match will be the same
                        unitIdList.push(toUnitId)
                    } else {
                        toUnitId = match[2]
                        fromUnitId = match[1]
                        unitIdList.push(fromUnitId + '_' + toUnitId)
                    }
                }
            } else {
                unitIdList.push('-1')//兵士数が不足しています
            }
        })
    }

    compose(forEach(getQuantity), map(o => o as HTMLFormElement))([...targets])
    unitCountMap = zip(unitIdList, possibleUnitCount)
//    return unitCountMap
}

// current solution is to find corresponding element from the merged tuple list by given category
// so we need to know index information
const populateCountToUI = (map: [string, string][]) => {
    //for now split by 3 as generally there are 3 levels for one type of unit
    const tupleList = splitEvery(3, map)
    switch(currentSelectedCategory) {
        case 'spear':
            query('span[name="low"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(0), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="mid"]').map(el => el as HTMLSpanElement)
            //   .then(span => span.innerText = compose(last, nth(0),  head)(tupleList))
                .then(span => {
                    const tuple = compose(nth(1), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="high"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(2), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            break
        case 'bow':
            query('span[name="low"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(0), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="mid"]').map(el => el as HTMLSpanElement)
            //   .then(span => span.innerText = compose(last, nth(0),  head)(tupleList))
                .then(span => {
                    const tuple = compose(nth(1), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="high"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(2), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            break
        case 'knight':
            query('span[name="low"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(0), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="mid"]').map(el => el as HTMLSpanElement)
            //   .then(span => span.innerText = compose(last, nth(0),  head)(tupleList))
                .then(span => {
                    const tuple = compose(nth(1), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="high"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = compose(nth(2), head)(tupleList) as string[]
                    span.innerText = last(tuple)
                })
            break
        case 'weaponry':
            break
    }

}


export default () => {
    Village()
}
