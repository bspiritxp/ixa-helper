import { ALL_UNITS, Facility, KAJI, KIBA, TRAINING_MODE, UNIT_CATEGORY,
         // types below
         YARI,
         YUMI} from '@/components/facility'
import { currentVillage } from '@/utils/data'
import { createElement, query, queryAll } from '@/utils/dom'
import { get, post } from '@/utils/io'
import Optional from '@/utils/tool'
import { compose, equals, forEach, forEachObjIndexed, head, isNil, keys, last, map, nth, pickBy, splitEvery, zip } from 'ramda'

// note that weaponry is special as it has more unit types than others
// TODO: handle 器， 炮 gracefully

let currentSelectedCategory: UNIT_CATEGORY
let currentSelectedMode = TRAINING_MODE.NORMAL // default to normal

/** Data structure to hold unit -> max trainable count relation
 * data is merged from two set of meta data
 * first is the unit id, in the form of string  ex: ['321', '322', ...]
 * second is max trainable count, in the form of string array, ['(1000)', '(200)',...]
 * then we zip them up to form [['321', '(1000)', ['322', '(200')]],
 * eventually we'll split them into groups by every other 3 tuples because each group will
 * represent the max trainable count for 'normal', 'high_speed', 'upgrade', respectively
 */
let unitCountMap: Array<Array<[string, string]>>

const UnitCategory: {[key: string]: string} = {
    槍: '0',
    弓: '1',
    馬: '2',
    兵器: '3',
}

const TraningMode: {[key: string]: string} = {
    普通: '0',
    高速 : '1',
    上位 : '2',
}

const SELECTION_HTML = `
<div>
<select id="category">
<option>兵类</option>
</select>
<select id="mode">
</select>
</div>
`
const inputDisplayHtmlTemplate = (...names: string[]) => `
<div id="unit-display">
<label style="color:white">${names[0]}</label> <input id="0" type="text" size="6" maxlength="8">
<span name="low" style="color:white;text-decoration:underline;cursor:pointer"></span>
<button type="button">確認</button><br>
<label style="color:white">${names[1]}</label> <input id="1" type="text" size="6" maxlength="8">
<span name="mid" style="color:white;text-decoration:underline;cursor:pointer"></span>
<button type="button">確認</button><br>
<label style="color:white">${names[2]}</label> <input id="2" type="text" size="6" maxlength="8">
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
        unitTrainingDiv.innerHTML = updatedSelectionHTML + inputDisplayHtmlTemplate(...keys(YARI))
        box.append(unitTrainingDiv)

        // initialize unit count map, default to Yari
        getMaxTrainableUnitCount(UNIT_CATEGORY.YARI)
    })

    bindEventToCategorySelection(unitTrainingDiv)
    bindEventToModeSelection(unitTrainingDiv)
    bindEventToConfirmButton(unitTrainingDiv)

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

// Bind event to select element
// Need to bind event on main document, not the parsed partial one, as we need event delegate
// for dynamically added element
const bindEventToCategorySelection = (container: HTMLElement) => {
    query('select#category', container).map(el => el as HTMLSelectElement)
        .then( selection => {
            selection.addEventListener('change', event => {
//                const triggeredElement = event.target as HTMLSelectElement
                currentSelectedCategory = +selection.value as UNIT_CATEGORY
                switch (currentSelectedCategory) {
                    case UNIT_CATEGORY.YARI:
                        refreshDisplayHTML(container, keys(YARI))
                        getMaxTrainableUnitCount(UNIT_CATEGORY.YARI)
                        break
                    case UNIT_CATEGORY.YUMI:
                        refreshDisplayHTML(container, keys(YUMI))
                        getMaxTrainableUnitCount(UNIT_CATEGORY.YUMI)
                        break
                    case UNIT_CATEGORY.KIBA:
                        refreshDisplayHTML(container, keys(KIBA))
                        getMaxTrainableUnitCount(UNIT_CATEGORY.KIBA)
                        break
                    case UNIT_CATEGORY.KAJI: // might need to separate 器, 炮
                        refreshDisplayHTML(container, ['破城鎚', '攻城櫓', '穴太衆'])
                        getMaxTrainableUnitCount(UNIT_CATEGORY.KAJI)
                        break
                }
            })
        })
}

const bindEventToModeSelection = (container: HTMLElement) => {
    query('select#mode', container).map(el => el as HTMLSelectElement)
        .then( selection => {
            selection.addEventListener('change', event => {
                const triggeredElement = event.target as HTMLSelectElement
                currentSelectedMode = +triggeredElement.value as TRAINING_MODE
                switch (currentSelectedMode) {
                    case TRAINING_MODE.NORMAL:
                        populateCountToUI(unitCountMap[0])
                        break
                    case TRAINING_MODE.HIGH_SPEED:
                        populateCountToUI(unitCountMap[1])
                        break
                    case TRAINING_MODE.UPGRADE:
                        populateCountToUI(unitCountMap[2])
                        break
                }
            })
        })
}

/*
 * Bind onclick event to buttons to process unit training, further alert window will pop up to confirm the action
 */
// TODO: Disable button if number is zero
const bindEventToConfirmButton = (container: HTMLElement) => {
    const targets = queryAll('div#unit-display button', container)
    const bindEvent = (btn: HTMLButtonElement) => {
        btn.addEventListener('click', event => {
            // Given the HTML structure we have, we'll find the sibling element from the button
            // Ex: Label Input Span Button
            // the value we need is from Input element, so move left twice
            const spanElement = btn.previousElementSibling as HTMLSpanElement
            const inputElement = spanElement.previousElementSibling as HTMLInputElement
//            const labelElement = inputElement.previousElementSibling as HTMLLabelElement

            // for normal and high speed, the unitCode will be same as toUnitId
            // as for upgrade, unitCode needs to break down into toUnitId and fromUnitId

            // const unitCode = ALL_UNITS[labelElement.innerText]
            // const match = (/(\d{3})_?(\d{3})?/).exec(unitCode)
            // let toUnitId: string, fromUnitId: string
            // if(match) {
            //     if(equals(match[0], match[1])) {
            //         toUnitId = match[1]
            //         console.log('to: ' + toUnitId)
            //     } else {
            //         toUnitId = match[2]
            //         fromUnitId = match[1]
            //         console.log('from:' + fromUnitId + ' to: ' + toUnitId)
            //     }
            // }

            //            return inputElement.value
            let toUnitId
            let fromUnitId
            switch (currentSelectedMode) {
                case TRAINING_MODE.NORMAL:
                    const normalData = map(a => a as string[], unitCountMap[0])[+inputElement.id]
                    toUnitId = head(normalData)
                    postToServer(inputElement.value, toUnitId)
                    break
                case TRAINING_MODE.HIGH_SPEED:
                    const highSpeedData = map(a => a as string[], unitCountMap[1])[+inputElement.id]
                    toUnitId = head(highSpeedData)
                    postToServer(inputElement.value, toUnitId)
                    break
                case TRAINING_MODE.UPGRADE:
                    const upgradeData = map(a => a as string[], unitCountMap[2])[+inputElement.id]
                    const unitCode = head(upgradeData)
                    const match = (/(\d{3})_?(\d{3})?/).exec(unitCode)
                    if (match) {
                        toUnitId = match[2]
                        fromUnitId = match[1]
                        postToServer(inputElement.value, toUnitId, fromUnitId)
                    }
                    break
            }
        })
    }

    compose(forEach(bindEvent), map(el => el as HTMLButtonElement))([...targets])
}

const postToServer = async (quantity: string, toUnitId: string, fromUnitId?: string) => {
    switch (currentSelectedCategory) {
        case UNIT_CATEGORY.YARI:
            await postToFacility('area[title^="足軽兵舎"]', quantity, toUnitId, fromUnitId)
            break
        case UNIT_CATEGORY.YUMI:
            await postToFacility('area[title^="弓兵舎"]', quantity, toUnitId, fromUnitId)
            break
        case UNIT_CATEGORY.KIBA:
            await postToFacility('area[title^="厩舎"]', quantity, toUnitId, fromUnitId)
            break
        case UNIT_CATEGORY.KAJI:
            await postToFacility('area[title^="兵器鍛冶"]', quantity, toUnitId, fromUnitId)
            break
    }
}

const postToFacility = async (target: string, quantity: string, toUnitId: string, fromUnitId?: string) => {
    query(target).map(el => el as HTMLAreaElement).then(facElem => {
        const facility  = new Facility(facElem)
        facility.trainUnit(quantity, currentSelectedMode, toUnitId, fromUnitId)
    })
}
// Note: Label Input Span Button
const bindEventToMaxQuantitySpan = (container: HTMLElement) => {
    const targets = queryAll('div#unit-display span', container)
    const bindEvent = (span: HTMLSpanElement) => {
        span.addEventListener('click', event => {
            const max = parseInt(span.innerText.slice(1, -1), 10)
            const inputElement = span.previousElementSibling as HTMLInputElement
            inputElement.value = max.toString()
        })
    }

    compose(forEach(bindEvent), map(el => el as HTMLSpanElement))([...targets])
}

const refreshDisplayHTML = (container: HTMLElement, names: string[]) => {
    query('div#unit-display', container).map(el => el as HTMLDivElement)
        .then(div => {
            div.outerHTML = inputDisplayHtmlTemplate(...names)
            // need to rebind events on buttons and spans  as we are refreshing the content
            bindEventToConfirmButton(container)
            bindEventToMaxQuantitySpan(container)
        })
}

const getMaxTrainableUnitCount = async (category: UNIT_CATEGORY) => {
    switch (category) {
        case UNIT_CATEGORY.YARI:
            await fetchFromFacility('area[title^="足軽兵舎"]')
            break
        case UNIT_CATEGORY.YUMI:
            await fetchFromFacility('area[title^="弓兵舎"]')
            break
        case UNIT_CATEGORY.KIBA:
            await fetchFromFacility('area[title^="厩舎"]')
            break
        case UNIT_CATEGORY.KAJI:
            await fetchFromFacility('area[title^="兵器鍛冶"]')
            break
    }
}

const fetchFromFacility = async (target: string) => {
    query(target)
        .map(el => el as HTMLAreaElement)
        .then(facElem => {
            const facility = new Facility(facElem)
            facility.getUnitInfo().then(doc => {
                getMaxPossibleQuantity(doc)
                populateCountToUI(unitCountMap[currentSelectedMode])
            })
            // const url = facility.href
            // get(url).then(doc => {
            //     getMaxPossibleQuantity(doc)
            //     populateCountToUI(unitCountMap[currentSelectedMode])
            // })
        })
}
/*
 * @method getMaxPossiblequantity
 * @param doc Document
 * @param mapping {[k:string]: string} mapping object from unit level to unit code
 * @param unit: Unit differentiate what variable to use for storing unit training information
 */
// TODO: refactor to a better way of processing and storing unit training variable
const getMaxPossibleQuantity = (doc: Document) => {
    // get the max possible quantity
    //    const targets = queryAll('span[onclick]', doc)

    // The idea is to form a list so that
    // [a, b, c], [1, 2, 3] => [[a, 1], [b, 2], [c, 3]]
    // where a, b,c are unit id, 1, 2, 3 are possible unit count
    const unitIdList: string[] = []
    const possibleUnitCount: string[] = []
    const targets = queryAll('form[name="createUnitForm"]', doc)
    const getQuantity = (form: HTMLFormElement) => {
        const match  = (/\(\d+\)/).exec(form.innerText.trim())
        isNil(match) ? possibleUnitCount.push('(0)') : possibleUnitCount.push(match[0])
        query('input', form).map(el => el as HTMLInputElement).thenOrElse( input => {
            const examString = input.id
            const matchedUnitIds = (/(\d{3})_?(\d{3})?/).exec(examString)
            let toUnitId: string
            let fromUnitId: string
            if (matchedUnitIds) { // not likely to have no match
                if (equals(matchedUnitIds[0], matchedUnitIds[1])) { // normal or high speed training
                    toUnitId = matchedUnitIds[1]  // full match and first group match will be the same
                    unitIdList.push(toUnitId)
                } else {
                    toUnitId = matchedUnitIds[2]
                    fromUnitId = matchedUnitIds[1]
                    unitIdList.push(fromUnitId + '_' + toUnitId)
                }
            }
        },
                                                                           () => {
                                                                               unitIdList.push('-1')// 兵士数が不足しています
                                                                           })
    }

    compose(forEach(getQuantity), map(o => o as HTMLFormElement))([...targets])
    // TODO: figure out how to get the type correctly for 'compose'
    // for now split by 3 as generally there are 3 levels for one type of unit, in conjunction with mode selection
    unitCountMap = splitEvery(3, zip(unitIdList, possibleUnitCount))
}

const updateTrainableUnitCount = (elem: string, newValue: string) => {
    query(elem).map(el => el as HTMLSpanElement).then(
        span => span.innerText = newValue,
    )
}

// current solution is to find corresponding element from the merged tuple list by given category
// so we need to know index information
// dataMap is a map between unit id and max trainable count, corresponds to training mode being selected
// TODO: probably we don't even need to switch on current selected category, UI needs to be updated regardless
const populateCountToUI = (dataMap: Array<[string, string]>) => {
    switch (currentSelectedCategory) {
        case UNIT_CATEGORY.YARI:
        case UNIT_CATEGORY.YUMI:
        case UNIT_CATEGORY.KIBA:
            updateTrainableUnitCount('span[name="low"]', last(head(dataMap)))
            updateTrainableUnitCount('span[name="mid"]', last(dataMap[1]))
            updateTrainableUnitCount('span[name="high"]', last(dataMap[2]))
            break
        case UNIT_CATEGORY.KAJI:
            query('span[name="low"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = head(dataMap) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="mid"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = nth(1)(dataMap) as string[]
                    span.innerText = last(tuple)
                })
            query('span[name="high"]').map(el => el as HTMLSpanElement)
                .then(span => {
                    const tuple = nth(2)(dataMap) as string[]
                    span.innerText = last(tuple)
                })
            break
    }

}

export default () => {
    Village()
}
