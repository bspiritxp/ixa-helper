import { createElement, query, queryAll } from '@/utils/dom'
import {compose, complement, isEmpty, isNil, filter, head, map} from 'ramda'
import { getHtml } from '@/utils/io'

const selectMenu = `<% if ('user' == belong) { %> <li><a href=''>选中</a></li> <% } %>`

export default (jq$: CallableFunction|null) => {
    const mapWrap = query("#MapContentWrap").get() as HTMLElement

    mapWrap.addEventListener("click", (e: Event)=> {
        const target = query('#mapSubmenu').get() as HTMLElement
        const ulElement = query('#mapSubmenu ul').o as HTMLElement

        const isSubMenuVisible =  window.getComputedStyle(target).display === 'none' ? false : true

        if(isSubMenuVisible && !hasCastleStatus(target)) {
            const profilePageURL = getProfileURL()

            if(!isEmpty(profilePageURL) && !isNil(profilePageURL)) {
                getMainCastleStatus(head(profilePageURL)).then(isFallen => {
                    const span = createElement('span')
                    span.innerText = isFallen ? '陥落' :'攻撃可能'
                    span.style.cssText = "color: white"
                    const item = createElement('li', 'castleStatus')
                    item.append(span)
                    ulElement.prepend(item)
                    e.stopPropagation()
                })
            }

        }
    })

    return
}

const hasCastleStatus = (menu: HTMLElement) => {
    return menu.querySelector('#castleStatus') !== null
}

const getProfileURL = (): (string| undefined)[] => {
    const targets = queryAll('#mapSubmenu ul li')

    const regex = /\/user.*/
    const findURL = (e: HTMLLIElement):string | undefined => {
        let result
        query('a', e).map(el => el as HTMLLinkElement).then(link => {
            const matched = regex.test(link.href)

            if(matched) {
                result =  link.href
            }
        })
        return result
    }

    return compose(filter(complement(isNil)), map(findURL), map(o => o as HTMLLIElement))([...targets])
}

const getMainCastleStatus = async (url: string | undefined) => {
    if(!isNil(url)){
        //get profile page
        const profilePage = await getHtml(url)
        const mainCastleUrl = findMainCastle(profilePage)
        const castleDetailPage = await getHtml(mainCastleUrl)
        return getCastleStatus(castleDetailPage)
    }
}

const findMainCastle = (page: HTMLDocument): string => {
    // if attack around,search for '出城', usually the last in the table
    // defense round, search for '本領', usually the first in table
    const target = queryAll('tr[class="fs14"]', page)
    const findURL = (trElements: Array<HTMLTableRowElement>): string => {
        const size = trElements.length
        // if last is not '出城', then opponent is defending this around, search for '本領'
        // first exam the last table row
        let tableDataElements = trElements[size -1].getElementsByTagName('td')
        //種類 0	名前 1
        const type = tableDataElements[0] as HTMLTableDataCellElement
        if (type.innerText === '出城'){
            const link = tableDataElements[1].getElementsByTagName('a')[0] as HTMLAnchorElement
            return link.href
        } else {
            tableDataElements = trElements[0].getElementsByTagName('td')
            const link = tableDataElements[1].getElementsByTagName('a')[0] as HTMLAnchorElement
            return link.href
        }
    }
    return findURL(map(o => o as HTMLTableRowElement, [...target]))
}

const getCastleStatus = (page: HTMLDocument): boolean => {
    let r
    query('.img_path', page).map(o => o as HTMLDivElement).then(div => {
        const isFallen = div.classList.contains('icon_now_fall')
        r = isFallen
    })
    return r ? r: false
}
