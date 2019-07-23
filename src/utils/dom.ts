import _ from 'lodash'

export const query = (s: string, doc = document) => doc.querySelector(s)
export const queryAll = (s: string, doc = document) => doc.querySelectorAll(s)

// 从dom中查询位置信息
export const queryLocGroup = <T>(selector: string, ItemClass: {new(e: Element): T}) => {
    const items: T[] = []
    queryAll(selector).forEach(el => items.push(new ItemClass(el)))
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

export const createUnique = (tagName: string, idName: string, isShow: boolean = false) => {
    let result = query(`${tagName}#${idName}`)
    if (result) return result
    return createAdd(tagName, idName, isShow)
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

export const getAbsolutePos = (el: HTMLElement, initValue: {x: number, y: number} = {x: 0, y: 0}): {x: number, y: number} => {
    const thisPos = {x: initValue.x + el.offsetLeft, y: initValue.y + el.offsetTop}
    console.log(el.tagName, thisPos);
    const parent = el.offsetParent;
    if (parent && parent.tagName !== 'BODY') {
        return getAbsolutePos(parent as HTMLElement, thisPos);
    }
    return thisPos;
}
