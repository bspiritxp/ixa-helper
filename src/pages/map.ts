import { createElement, query, queryAll } from '@/utils/dom'
import {compose, complement, isEmpty, isNil, filter, head, map} from 'ramda'
import { getHtml } from '@/utils/io'

const selectMenu = `<% if ('user' == belong) { %> <li><a href=''>选中</a></li> <% } %>`

export default (jq$: CallableFunction|null) => {
    const mapWrap = query("#MapContentWrap").get() as HTMLElement

    mapWrap.addEventListener("click", (e: Event)=> {
        const target = query('#mapSubmenu').get() as HTMLElement
        const ulElement = query('#mapSubmenu ul').o as HTMLElement

        const isSubMenuVisibile =  window.getComputedStyle(target).display === 'none' ? false : true

        if(isSubMenuVisibile) {
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
    //so far it looks it'll be the first match
    const target = queryAll('tr[class="fs14"] td', page)[1] as HTMLTableDataCellElement
    const findURL = (e: HTMLTableDataCellElement): string => {
        let r = ''
        query('a', e).map(el => el as HTMLLinkElement).then(link => {
            r =  link.href
        })
        return r
    }
    return findURL(target)
}

const getCastleStatus = (page: HTMLDocument): boolean => {
    let r
    const findStatus = query('.img_path', page).map(o => o as HTMLDivElement).then(div => {
        const isFallen = div.classList.contains('icon_now_fall')
        r = isFallen
    })
    return r? r: false
}
