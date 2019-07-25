import _ from 'lodash'
import Optional from './tool';
import { Village } from '@/items';

export const query = (s: string, doc: Document|HTMLElement = document) => Optional.ofNullable(doc.querySelector(s) as HTMLElement|null)
export const queryAll = (s: string, doc: Document|HTMLElement = document) => doc.querySelectorAll(s)

// 从dom中查询位置信息
export const queryLocGroup = (selector: string) => {
    const items: Village[] = []
    queryAll(selector).forEach(el => items.push(new Village(Optional.of(el as HTMLElement))));
    return new Set(items)
}

export const create = (tagName: string, idName: string, isShow: boolean = false) => {
    const result = document.createElement(tagName)
    result.id = idName
    result.style.visibility = isShow ? 'visible' : 'hidden'
    return result
}

const appendBody = (el: HTMLElement) => { 
    document.body.append(el);
    return el;
}

const prependBody = (el: HTMLElement) => { 
    document.body.prepend(el);
    return el;
}

export const createAdd = _.flow([create, appendBody])

export const createAddTop = _.flow([create, prependBody])

export const createUnique = (tagName: string, idName: string, isShow: boolean = false): HTMLElement => {
    return query(`${tagName}#${idName}`).getOrElse(() => createAdd(tagName, idName, isShow));
}

export const parseDom = (domStr: string) => {
    const contanier = document.createElement('div');
    contanier.innerHTML = domStr
    return contanier;
}

export const setCss = (el: HTMLElement, css: {[key: string]: string}) => {
    let cssText = ''
    _.forOwn(css, (value, key) => {
        cssText += `${key}: ${value};`
    })
    el.style.cssText = cssText
}

type Pos = {left: number, top: number}

export const getAbsolutePos = (el: HTMLElement, initValue: Pos = {left: 0, top: 0}): Pos => {
    const thisPos = {left: initValue.left + el.offsetLeft, top: initValue.top + el.offsetTop}
    console.log(el.tagName, thisPos);
    const parent = el.offsetParent;
    if (parent && parent.tagName !== 'BODY') {
        return getAbsolutePos(parent as HTMLElement, thisPos);
    }
    return thisPos;
}
