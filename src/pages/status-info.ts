import { createElement, query } from '@/utils/dom'
import { curry, is, path, pipe } from 'ramda'

enum StType {
    ATTACK = 'attack_pt',
    DEFENSE = 'defense_pt',
    INT = 'intellect_pt',
}

function statusChangeW(statusType: string, row: number, col: number, point: number) {
    const method: any = path(['statusChange'], window)
    if (is(Function, method)) {
        method(statusType, row, col, point)
    }
}

const updateAtk = curry(statusChangeW)(StType.ATTACK, 2, 2)
const updateDef = curry(statusChangeW)(StType.DEFENSE, 3, 2)
const updateInt = curry(statusChangeW)(StType.INT, 4, 2)
const remainPoint = () => query('#remain_point').map(el => Number(el.textContent)).getOrDefault(0)

const ACTIONS: {[key: string]: () => void} = {
    [StType.ATTACK]: pipe(remainPoint, updateAtk),
    [StType.DEFENSE]: pipe(remainPoint, updateDef),
    [StType.INT]: pipe(remainPoint, updateInt),
} as const

export default () => {
    // create buttons
    for (const ty in StType) {
        if (ty) {
            //workaround to pass the type check,
            //https://blog.oio.de/2014/02/28/typescript-accessing-enum-values-via-a-string/
            const type: StType = (<any>StType)[ty]
            const btn = createElement('button', `btn_${type}`, true)
            btn.setAttribute('type', 'button')
            btn.onclick = e => ACTIONS[type]()
            btn.textContent = 'all'
            query(`input[name=${type}]`).then(el => el.after(btn))
        }
    }
}
