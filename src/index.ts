import { Village } from '@/components'
import {createElement, createElementWithStyle, createStyledElement, query, queryAll} from '@/utils/dom'
import Optional from '@/utils/tool'
import { compose, forEach, forEachObjIndexed, keys, map, reduce, sortBy } from 'ramda'
import Router from './pages'

const currentPath = location.pathname
const pageMethod = Router[currentPath]
const jqObjName = ['j213$', 'j$', 'jQuery', '$$', '$'].filter(key => window.hasOwnProperty(key))[0]
const jqueryDesc = Object.getOwnPropertyDescriptor(window, jqObjName)
const jq$ = jqueryDesc ? jqueryDesc.value : null
// tslint:disable-next-line:no-console
console.info('ixa plugin on', jq$ ? 'with jquery' : '')
let config: {[key: string ]: any} = {
    autoBuild: '',
    simpleTrain: '',
    buildPriority: {},
}
const modalContent = '自动种田 <input type=\'checkbox\' name="auto-build"/>\
                 <br>\
                 简易造兵 <input type=\'checkbox\' name="quick-unit-training"/>\
                 <br>'

const PriorityOptions = {
    无: 'none',
    资源: 'resource',
    木: 'lumber',
    綿: 'cotton',
    鉄: 'steel',
    糧: 'grain',
    军事: 'arsenal',
    容量: 'storage',
}
const configBtnStyle = {
    'float': 'right',
    'clear': 'right',
    'font-size': '1em',
}

const modalStyle = {
    'display': 'none', /* Hidden by default */
    'position': 'fixed', /* Stay in place */
    'z-index': '99', /* Sit on top */
    'padding-top': '100px', /* Location of the box */
    'left': '0',
    'top': '0',
    'width': '100%', /* Full width */
    'height': '100%', /* Full height */
    'overflow': 'auto', /* Enable scroll if needed */
    'background-color': 'rgba(0,0,0,0.4)', /* Black w/ opacity */
}

const modalContentStyle = {
    'background-color': '#fefefe',
    'margin': 'auto',
    'padding': '20px',
    'border': '1px solid #888',
    'width': '24%',
}

const closeBtnStyle = {
    'color': '#aaaaaa',
    'float': 'right',
    'font-size': '28px',
    'font-weight': 'bold',
    'cursor': 'pointer',
}

const showConfig = (e: Event) => {
    query('#configModal').then(modal => {
        modal.style.display = 'block'
    })
}

const closeModal = (e?: Event) => {
    query('#configModal').then(modal => {
        modal.style.display = 'none'
    })
}

const saveConfig = () => {
    localStorage.setItem('config', JSON.stringify(config))
    closeModal()
}

const buildConfigUI = () => {
    const modalContainerDiv = createStyledElement('div', 'configModal', modalStyle)
    const modalContentDiv = createStyledElement('div', '', modalContentStyle)
    const closeBtn = createStyledElement('span', '', closeBtnStyle)
    const saveBtn = createElement('button', 'saveBtn')
    saveBtn.onclick = saveConfig
    saveBtn.textContent = 'Save'
    closeBtn.innerHTML = '&times;'
    closeBtn.onclick = closeModal

    query('#container').then(box => {
        modalContentDiv.innerHTML = modalContent
        modalContentDiv.append(saveBtn)
        modalContentDiv.prepend(closeBtn)
        modalContainerDiv.append(modalContentDiv)
        box.append(modalContainerDiv)
    })

    const button = createStyledElement('button', 'config', configBtnStyle)
    button.onclick = showConfig
    button.textContent = '设置'
    query('#lordName').then(ele => ele.after(button))
}

const addDynamicContent = () => {
    const targets = [...queryAll('.my_capital li'), ...queryAll('.my_country li')]
    const villageList = compose(map(initVillage), map(el => el as HTMLElement))([...targets])

    const populateOptions = (el: HTMLSelectElement) => {
        forEachObjIndexed((value, priorityDisplayName) => {
            const option = createElement('option') as HTMLOptionElement
            option.value = value
            option.text = priorityDisplayName
            el.add(option)
        })(PriorityOptions)
    }

    forEach((v: Village) => {
        const select = createElement('select') as HTMLSelectElement
        select.id = String(v.id)
        select.onchange = bindEventToSelect

        const label = createElement('label', 'vName') as HTMLLabelElement
        label.textContent = v.title
        label.htmlFor = select.id
        const container = createElement('div') as HTMLDivElement

        populateOptions(select)
        select.value = keys(config.buildPriority).map(x => x.toString())
            .includes(select.id) ? config.buildPriority[select.id] : 'none'
        container.append(label)
        container.append(select)
        query('#saveBtn').then(el => el.before(container))
    }, villageList)
}

const bindEventToSelect = (e: Event) => {
    const select = e.target as HTMLSelectElement
    config.buildPriority[String(select.id)] = select.value
}

const autoBuildBtn = createStyledElement('button', 'auto-build', configBtnStyle) as HTMLButtonElement

const initVillage = (elem: HTMLElement): Village => {
    return new Village(Optional.of(elem))
}

const startAutoBuild = () => {
    autoBuildBtn.disabled = true
    autoBuildBtn.style.backgroundColor = 'coral'
    autoBuildBtn.textContent = '建設中'

    // place the current selected village at last of the list so that when one-click build finishes
    // we will be landed on the same page where we initiate the call, otherwise we will land on the last
    // village on the list after a refresh
    const currentVillageAtEnd = (elem: HTMLElement) => {
        const style = elem.getAttribute('class')
        return style?.includes('on') ? 1 : 0
    }
    const targets = queryAll('li[data-village_id]')

    const villageList = compose(map(initVillage),
                                sortBy(currentVillageAtEnd),
                                map(el => el as HTMLElement))([...targets])

    reduce((chain: Promise<boolean>, v: Village): Promise<boolean> => {
        return chain.then(() => v.initialize(config.buildPriority[String(v.id)]))
    }, Promise.resolve(true), villageList).then(() => {
        autoBuildBtn.textContent = '完成'
        autoBuildBtn.style.backgroundColor = 'lawngreen'
    })
}

const addAutoBuildButton = () => {
    autoBuildBtn.onclick = startAutoBuild
    autoBuildBtn.textContent = '建設始める'
    query('.my_capital').then(e => {
        if(e.previousElementSibling) {
            e.previousElementSibling.prepend(autoBuildBtn)
        }
    })
}

const loadConfig = () => {
    const savedConfig = localStorage.getItem('config')
    if (savedConfig) {
        config = JSON.parse(savedConfig)
    }
}

loadConfig()
buildConfigUI()
addDynamicContent()
addAutoBuildButton()
if (pageMethod) {
    pageMethod(config, jq$)
    // console.info('page helper on');
}
