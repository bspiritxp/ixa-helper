
export const query = s => document.querySelector(s)
export const queryAll = s => document.querySelectorAll(s)
// 从dom中查询位置信息
export const queryLocGroup = (selector, makeItem) => {
    const items = []
    queryAll(selector).forEach(el => items.push(makeItem(el)))
    return new Set(items)
}

export const createUnique = (tagName, idName, isShow) => {
    let result = query(`${tagName}#${idName}`)
    if (result) return result
    return create(tagName, idName, isShow)
}

export const create = (tagName, idName, isShow) => {
    const result = document.createElement(tagName)
    result.id = idName
    result.style.visibility = isShow ? 'visible' : 'hidden'
    document.body.append(result)
    return result
}