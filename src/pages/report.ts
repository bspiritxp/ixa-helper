import { Icons, Report } from '@/components'
import { reports } from '@/utils/data'
import { createElement, createUnique, query, setCss } from '@/utils/dom'
import { has } from 'ramda'

const BUTTON_ID = 'sumRessBtn'
const BUTTON_STYLE = {
    'width': '5rem',
    'height': '18px',
    'font-size': '11px',
} as const

enum SELECTOR {
    BTN_CONTANIER = 'form ul:nth-of-type(2) li:first-of-type',
}

interface RessResult {
    [key: string]: number
}

function showRessResult(result: RessResult, rBox: HTMLSpanElement) {
    const raw: string[] = []
    Object.keys(result).forEach((k: string) => {
        raw.push(`${Icons[k]}&nbsp;${result[k]}`)
    })
    rBox.innerHTML = raw.join('&nbsp;|&nbsp;')
}

async function sumReport(e: Event) {
    const totalRess: RessResult = { }
    const rBox = createUnique('span', 'ressResult', true)
    query(SELECTOR.BTN_CONTANIER).then(box => box.append(rBox))
    rBox.textContent = ''
    setCss(rBox, {
        'margin-left': '5px',
        'display': 'inline-flex',
        'border': '1px solid #333',
        'border-radius': '.5rem',
        'padding': '.5rem',
        'align-items': 'center',
        'background-color': '#000',
        'color': '#fff',
    })
    reports().forEach(async (r: Report) => {
        await r.readDetail()
        r.ress.forEach((v: number, k: string) => {
            if (!has(k, totalRess)) { totalRess[k] = 0 }
            totalRess[k] += Number(v)
        })
        showRessResult(totalRess, rBox)
    })
    e.preventDefault()
}

function createButton() {
    const button = createElement('button', BUTTON_ID, true)
    button.onclick = sumReport
    button.textContent = '统计资源'
    setCss(button, BUTTON_STYLE)

    query(SELECTOR.BTN_CONTANIER)
        .then(box => box.append(button))
}

export default () => {
    // add button to page
    createButton()
}
