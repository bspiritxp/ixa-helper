
export const query = s => document.querySelector(s)
export const queryAll = s => document.querySelectorAll(s)
// 从dom中查询位置信息
export const queryLocGroup = (selector, makeItem) => {
    const items = [];
    queryAll(selector).forEach(el => items.push(makeItem(el)));
    return new Set(items);
}
