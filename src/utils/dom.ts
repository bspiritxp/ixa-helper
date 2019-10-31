import { Village } from '@/items'
import { mapObjIndexed, pipe} from 'ramda'
import Optional from './tool'

export const query = (s: string, doc: Document|HTMLElement = document): Optional<HTMLElement|null> =>
    Optional.of(doc.querySelector(s) as HTMLElement|null)
export const queryAll = (s: string, doc: Document|HTMLElement = document) => doc.querySelectorAll(s)

// 从dom中查询位置信息
export const queryLocGroup = (selector: string) => {
    const items: Village[] = []
    queryAll(selector).forEach(el => items.push(new Village(Optional.of(el as HTMLElement))))
    return new Set(items)
}

export const createElement = (tagName: string, idName: string, isShow: boolean = false) => {
    const element = document.createElement(tagName)
    element.id = idName
    element.style.visibility = isShow ? 'visible' : 'hidden'
    return element
}

export const createElementWithStyle = (tagName: string, id: string, className: string) => {
    const element = document.createElement(tagName)
    element.id = id
    element.className = className
    return element
}

const appendBody = (el: HTMLElement) => {
    document.body.append(el)
    return el
}

const prependBody = (el: HTMLElement) => {
    document.body.prepend(el)
    return el
}

// Assume parameters are essential for every link to be made, refactor if needed
export const makeLink = (url: URL, params: URLSearchParams, content: string, title: string) => {
    const el = createElement('a', '', true) as HTMLLinkElement
    el.href = url.pathname + '?' + params.toString()
    el.textContent = content
    el.title = title
    el.target = '_blank'
    return el
}

export const createAdd = pipe(createElement, appendBody)

export const createAddTop = pipe(createElement, prependBody)

export const createUnique = (tagName: string, idName: string, isShow: boolean = false): HTMLElement => {
    return query(`${tagName}#${idName}`).getOrElse(() => createAdd(tagName, idName, isShow))
}

export const parseDom = (domStr: string) => {
    const contanier = document.createElement('div')
    contanier.innerHTML = domStr
    return contanier
}

export const setCss = (el: HTMLElement, css: {[key: string]: string}) => {
    let cssText = ''
    mapObjIndexed((value, key) => {
        cssText += `${key}: ${value};`
    }, css)
    el.style.cssText = cssText
}

interface Pos {left: number; top: number }

export const getAbsolutePos = (el: HTMLElement, initValue: Pos = {left: 0, top: 0}): Pos => {
    const thisPos = {left: initValue.left + el.offsetLeft, top: initValue.top + el.offsetTop}
    const parent = el.offsetParent
    if (parent && parent.tagName !== 'BODY') {
        return getAbsolutePos(parent as HTMLElement, thisPos)
    }
    return thisPos
}
