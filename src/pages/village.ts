import { ALL_UNITS, Facility, KAJI, KIBA,
         TRAINING_MODE,
         UNIT_CATEGORY,
         YARI,
         YUMI,
       } from '@/components/facility'
import { currentVillage } from '@/utils/data'
import { createElement, query, queryAll } from '@/utils/dom'
import { compose, equals, forEach, forEachObjIndexed, head, invert, isNil, map, prop } from 'ramda'

let currentSelectedCategory = UNIT_CATEGORY.NO_SELECT
let currentSelectedMode = TRAINING_MODE.NORMAL // default to normal

const mainContainer = 'div#unitTraining'

/**
 * Data structure to hold mapping between training mode, unit id and max trainable quantity
 * {
 *     normal: {
 *         '321': '(123)'
 *         ...
 *     },
 *     high: {
 *         '321': '(123)'
 *         ...
 *     },
 *     upgrade: {
 *         '123': '(313)'
 *     }
 * }
 */
let unitDataMap: {[key: string]: {[key: string]: string}}

const UnitCategory: {[key: string]: string} = {
    類別: '0',
    槍: '1',
    弓: '2',
    馬: '3',
    兵器: '4',
}

const TraningMode: {[key: string]: string} = {
    普通: '0',
    高速 : '1',
    上位 : '2',
}

const SELECTION_HTML = `
<div>
<select id="category">
</select>

<select id="mode">
</select>
</div>
<div id="unit-display">
</div>
`
const unitTrainingDataRowTemplate = (name: string, quantity: string) => `
<label style="color:white">${name}</label> <input id="0" type="text" size="4" maxlength="8">
<span name="low" style="color:white;text-decoration:underline;cursor:pointer">${quantity}</span>
<button type="button">確認</button><br>
`

// TODO: figure out a better way to query elements
const setBuildFinishTime = () => {
    const beingBuiltTarget = query('.running_list > li > span .build_now')
    const toBeBuiltTarget = query('.running_list > li > span .build_ready')

    if (toBeBuiltTarget.o) {
//        const finishTime = toBeBuiltTarget.o.parentElement.parentElement?.querySelector('.buildTime')
    }
}

const cv = currentVillage()
const Village = () => {
    if (cv.id === null) { return }
    query('select#select_village')
        .map(el => el as HTMLInputElement)
        .filter(el => el.value === '' )
        .then(partLocation => partLocation.value = cv.id ? cv.id.toString() : '')

    cv.hasArsenal().then(hasArsenal => {
        if (hasArsenal) {
            const unitTrainingDiv = createElement('div', 'unitTraining')

            query('#box').then(box => {
                const updatedSelectionHTML = initiateSelectOptions()
                unitTrainingDiv.innerHTML = updatedSelectionHTML
                box.append(unitTrainingDiv)
            })

            bindEventToCategorySelection(unitTrainingDiv)
            bindEventToModeSelection(unitTrainingDiv)
        }
    })

    // enables auto build on current village after refresh
    cv.initialize()
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
                currentSelectedCategory = +selection.value as UNIT_CATEGORY
                switch (currentSelectedCategory) {
                    case UNIT_CATEGORY.YARI:
                        // async call so we need to bind event after promise is resolved
                        // which is done nested in callee instead of writing then block
                        getMaxTrainableUnitCount(UNIT_CATEGORY.YARI)
                        break
                    case UNIT_CATEGORY.YUMI:
                        getMaxTrainableUnitCount(UNIT_CATEGORY.YUMI)
                        break
                    case UNIT_CATEGORY.KIBA:
                        getMaxTrainableUnitCount(UNIT_CATEGORY.KIBA)
                        break
                    case UNIT_CATEGORY.KAJI:
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
                if (currentSelectedCategory !== UNIT_CATEGORY.NO_SELECT) {
                    switch (currentSelectedMode) {
                        case TRAINING_MODE.NORMAL:
                            buildUI(unitDataMap.normal)
                            break
                        case TRAINING_MODE.HIGH:
                            buildUI(unitDataMap.high)
                            break
                        case TRAINING_MODE.UPGRADE:
                            buildUI(unitDataMap.upgrade)
                            break
                    }
                    bindEventToMaxQuantitySpan(container)
                    bindEventToConfirmButton(container)
                }
            })
        })
}

/*
 * Bind onclick event to buttons to process unit training, further alert window will pop up to confirm the action
 */
const bindEventToConfirmButton = (container: HTMLElement) => {
    const targets = queryAll('div#unit-display button', container)
    const bindEvent = (btn: HTMLButtonElement) => {
        btn.addEventListener('click', event => {
            // Given the HTML structure we have, we'll find the sibling element from the button
            // Ex: Label Input Span Button
            // the value we need is from Input element, so move left twice
            const spanElement = btn.previousElementSibling as HTMLSpanElement
            const inputElement = spanElement.previousElementSibling as HTMLInputElement
            // Get the label so that we can determine the unit id
            const labelElement = inputElement.previousElementSibling as HTMLLabelElement

            let toUnitId
            let fromUnitId
            switch (currentSelectedMode) {
                case TRAINING_MODE.NORMAL:
                    toUnitId = getUnitCode(labelElement.innerText)
                    postToServer(inputElement.value, toUnitId)
                    break
                case TRAINING_MODE.HIGH:
                    toUnitId = getUnitCode(labelElement.innerText)
                    postToServer(inputElement.value, toUnitId)
                    break
                case TRAINING_MODE.UPGRADE:
                    const unitCode = getUnitCode(labelElement.innerText)
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
        const facility  = new Facility(facElem, cv.id)
        facility.trainUnit(quantity, currentSelectedMode, toUnitId, fromUnitId).then(() => {
            // Refresh the data first then UI so that it displays the right quantity
            getMaxTrainableUnitCount(currentSelectedCategory)
        })
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
            const facility = new Facility(facElem, cv.id)
            facility.getUnitInfo().then(doc => {
                getPossibleQuantity(doc) // new data structure
                buildUI(unitDataMap[TRAINING_MODE[currentSelectedMode].toLowerCase()])
                // Rebind event as we refresh the content
                const container = query(mainContainer).o as HTMLElement
                bindEventToMaxQuantitySpan(container)
                bindEventToConfirmButton(container)
            })
        })
}

/** construct a data map to hold max trainable unit information
 * {
 *     normal: {
 *         '321': '(123)'
 *         ...
 *     },
 *     high: {
 *         '321': '(123)'
 *         ...
 *     },
 *     upgrade: {
 *         '123': '(313)'
 *     }
 * }
 * regular expression to capture information we need /(high|upgrade)?\[(\d{3})_?(\d{3})?\]$/
 * normal training will have id pattern 'unit_value[xxx]'
 * match group:
 * full match '[xxx]'
 * group two 'xxx'
 *
 * high speed training will have id pattern 'unit_value_high[xxx]'
 * match group:
 * full match 'high[xxx]'
 * group one 'high'
 *
 * upgrade training will have id pattern 'unit_value_upgrade[xxx_yyy]'
 * full match 'upgrade[xxx_yyy]
 * group one 'upgrade'
 * group two 'xxx'
 * group three 'yyy'
 *
 * in the case of no trainable unit for a particular unit at a given time, simply ignore it
 * as the final display name rendering will be dynamic, depending on what's available from
 * the data map we are constructing here
 *
 */
const getPossibleQuantity = (doc: Document) => {
    const regex = /(high|upgrade)?\[(\d{3})_?(\d{3})?\]$/
    const normal: {[key: string]: string } = {}
    const high: {[key: string]: string } = {}
    const upgrade: {[key: string]: string } = {}
    const targets = queryAll('form[name="createUnitForm"]', doc)
    const constructDataMap = (form: HTMLFormElement) => {
        query('input', form).map(el => el as HTMLInputElement).then(input => {
            const examString = input.id
            const quantityMatch  = (/\(\d+\)/).exec(form.innerText.trim())

            // Exam group one to determine training mode
            // normal -> undefined
            // high -> 'high'
            // upgrade -> 'upgrade'
            const unitCodeMatch = regex.exec(examString)
            if (unitCodeMatch && quantityMatch) {
                if (isNil(unitCodeMatch[1])) {
                    normal[unitCodeMatch[2]] = quantityMatch[0]
                } else if (equals(unitCodeMatch[1], 'high')) {
                    high[unitCodeMatch[2]] = quantityMatch[0]
                } else if (equals(unitCodeMatch[1], 'upgrade')) {
                    upgrade[unitCodeMatch[2] + '_' + unitCodeMatch[3]] = quantityMatch[0]
                }
            }

        })
    }
    const mergeAll = () => {
        return {
            normal,
            high,
            upgrade,
        }
    }

    unitDataMap = compose(mergeAll, forEach(constructDataMap), map(o => o as HTMLFormElement))([...targets])
}

// Build the complete unit training row UI
const buildUI = (data: {[key: string]: string}) => {
    let completeUI = ''
    switch (currentSelectedCategory) {
        case UNIT_CATEGORY.YARI:
            const buildYARI = (quantity: string, k: string|number) => {
                const displayName = prop(k, YARI)
                completeUI += makeRow(displayName, quantity)
            }
            forEachObjIndexed(buildYARI , data)
            break
        case UNIT_CATEGORY.YUMI:
            const buildYUMI = (quantity: string, k: string|number) => {
                const displayName = prop(k, YUMI)
                completeUI += makeRow(displayName, quantity)
            }
            forEachObjIndexed(buildYUMI , data)
            break
        case UNIT_CATEGORY.KIBA:
            const buildKIBA = (quantity: string, k: string|number) => {
                const displayName = prop(k, KIBA)
                completeUI += makeRow(displayName, quantity)
            }
            forEachObjIndexed(buildKIBA , data)
            break
        case UNIT_CATEGORY.KAJI:
            const buildKAJI = (quantity: string, k: string|number) => {
                const displayName = prop(k, KAJI)
                completeUI += makeRow(displayName, quantity)
            }
            forEachObjIndexed(buildKAJI, data)
            break
    }

    query('div#unit-display').map(el => el as HTMLDivElement).then( div => {
        div.innerHTML = completeUI
    })
}

// Utils
// Given a display name find the corresponding unit code, either xxx or xxx_yyy
// depending on current selected category and mode
const getUnitCode = (displayName: string): string => {
    switch (currentSelectedCategory) {
        case UNIT_CATEGORY.YARI:
            return head(prop(displayName, invert(YARI)))
        case UNIT_CATEGORY.YUMI:
            return head(prop(displayName, invert(YUMI)))
        case UNIT_CATEGORY.KIBA:
            return head(prop(displayName, invert(KIBA)))
        case UNIT_CATEGORY.KAJI:
            return head(prop(displayName, invert(KAJI)))
        default:
            return ''
    }
}

const makeRow = (name: string, quantity: string): string => {
    return unitTrainingDataRowTemplate(name, quantity)
}

export default () => {
    Village()
}
