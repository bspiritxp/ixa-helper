import { createElement, query } from '@/utils/dom'
import { mapOpt, safeGet } from '@/utils/tool'
import { compose, curry, is, partial, path } from 'ramda'

enum StType {
    ATTACK = 'attack_pt',
    DEFENSE = 'defense_pt',
    INT = 'intellect_pt',
}

type StTypeKey = keyof typeof StType

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
    [StType.ATTACK]:  compose(updateAtk, remainPoint),
    [StType.DEFENSE]: compose(updateDef, remainPoint),
    [StType.INT]:     compose(updateInt, remainPoint),
} as const

export default () => {
    // create buttons
    for (const ty in StType) {
        if (ty) {
            const type = StType[ty as StTypeKey]
            const btn = createElement('button', `btn_${type}`, true)
            btn.setAttribute('type', 'button')
            btn.onclick = e => ACTIONS[type]()
            btn.textContent = 'all'
            query(`input[name=${type}]`).then(el => el.after(btn))
        }
    }
}
