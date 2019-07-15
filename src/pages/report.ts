import { reports } from '@/utils/data'
import { create, query, createUnique } from '@/utils/dom'
import Optional from '@/utils/tool'
import { Report } from '@/items'
import _ from 'lodash';

const BUTTON_ID = 'sumRessBtn'
const BUTTON_STYLE = 'width: 7rem;height: 18px;font-size: 11px'

enum SELECTOR {
    BTN_CONTANIER = 'form ul:nth-of-type(2) li:first-of-type',
}

interface RessResult {
    [key: string]: number
}

function showRessResult(result: RessResult, rBox: HTMLSpanElement) {
    const raw: string[] = []
    Object.keys(result).forEach((k: string) => {
        raw.push(`<strong>${k}</strong>: ${result[k]}`)
    })
    rBox.innerHTML = raw.join(',&nbsp;')
}

async function sumReport(e: Event) {
    const totalRess: RessResult = { }
    const rBox = createUnique('span', 'ressResult', true)
    Optional.ofNullable(query(SELECTOR.BTN_CONTANIER)).then(box => box.append(rBox))
    rBox.textContent = ''
    rBox.style.cssText = 'margin-left: 2rem; display: inline-block; border: 1px dashed #333; border-raduis: 5px;text-align: center;padding: .5rem'
    reports().value().forEach(async (r: Report) => {
        await r.readDetial()
        r.ress.forEach((v: number, k: string) => {
            if (!_.has(totalRess, k)) totalRess[k] = 0
            totalRess[k] += Number(v)
        })
        showRessResult(totalRess, rBox)
    })
    e.preventDefault()
}

function createButton() {
    const button = create('button', BUTTON_ID, true)
    button.onclick = sumReport
    button.textContent = '统计资源'
    button.style.cssText = BUTTON_STYLE

    Optional.ofNullable(query(SELECTOR.BTN_CONTANIER))
        .then(box => box.append(button))
}

export default () => {
    // add button to page
    createButton()
}