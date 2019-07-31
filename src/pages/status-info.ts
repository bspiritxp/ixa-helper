import { create, query } from '@/utils/dom';
import _ from 'lodash';

enum StType {
    ATTACK = "attack_pt",
    DEFENSE = "defense_pt",
    INT = "intellect_pt",
}

function statusChangeW(statusType: string, row: number, col: number, point: number) {
    const method = _.get(window, 'statusChange');
    if (method) {
        method(statusType, row, col, point);
    }
}

const updateAtk = _.partial(statusChangeW, StType.ATTACK, 2, 2);
const updateDef = _.partial(statusChangeW, StType.DEFENSE, 3, 2);
const updateInt = _.partial(statusChangeW, StType.INT, 4, 2);
const remainPoint = () => query('#remain_point').map(el => Number(el.textContent)).getOrDefault(0);

const ACTIONS: {[key: string]: () => void} = {
    [StType.ATTACK]: _.flow([remainPoint, updateAtk]),
    [StType.DEFENSE]: _.flow([remainPoint, updateDef]),
    [StType.INT]: _.flow([remainPoint, updateInt]),
} as const;

function createButtons() {
    // create buttons
    for (const ty in StType) {
        if (ty) {
            const type = StType[ty];
            const btn = create('button', `btn_${type}`, true);
            btn.setAttribute('type', 'button');
            btn.onclick = e => ACTIONS[type]();
            btn.textContent = 'all';
            query(`input[name=${type}]`).then(el => el.after(btn));
        }
    }
}

export default () => {
    createButtons();
};
