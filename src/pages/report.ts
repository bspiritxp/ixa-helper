import { reports } from '@/utils/data'
import { create, query } from '@/utils/dom'
import Optional from '@/utils/tool'
import { Report } from '@/items'

const BUTTON_ID = 'sumRessBtn'

enum SELECTOR {
    BTN_CONTANIER = 'form ul:nth-of-type(2) li:first-of-type)',
}

interface RessResult {
    [key: string]: number
}

function showRessResult(result: RessResult) {
    const raw: string[] = []
    Object.keys(result).forEach((k: string) => {
        raw.push(`${k}: ${result[k]}`)
    })
    const rBox = create('span', 'ressResult', true)
    rBox.textContent = raw.join(',')
    Optional.ofNullable(query(SELECTOR.BTN_CONTANIER))
        .then(box => box.append(rBox))
}

function removeRessResult() {
    Optional.ofNullable(query('#ressResult')).then(el => el.remove())
}

async function sumReport(e: Event) {
    const totalRess: RessResult = {}
    removeRessResult()
    reports()
        .forEach(async (r: Report) => {
            await r.readDetial()
            r.ress.forEach((v: number, k: string) => {
                totalRess[k] = Optional.ofNullable(totalRess[k]).getOrDefault(0) + v as number
            })
        })
    showRessResult(totalRess)
    e.preventDefault()
}

function createButton() {
    const button = create('button', BUTTON_ID, true)
    button.onclick = sumReport
    button.textContent = '统计资源'
    button.style.width = '7rem'
    button.style.height = '18px'
    button.style.fontSize = '11px'

    Optional.ofNullable(query(SELECTOR.BTN_CONTANIER))
        .then(box => box.append(button))
}

export default () => {
    // add button to page
    createButton()
}