import { createElement, query, setCss } from '@/utils/dom'

/**
 *  Modal window's HTML struct is:
 * --------------------------------------------------
 * <div id="TB_overlay" class="TB_overlayBG"></div>
 *  <div id="TB_window" style="margin-left: -257px; width: 515px; margin-top: -195px; display: block;">
 *     <div id="TB_title">
 *          <div id="TB_ajaxWindowTitle"></div>
 *          <div id="TB_closeAjaxWindow"><a href="#" id="TB_closeWindowButton">close</a> or Esc Key</div>
 *      </div>
 *      <div id="TB_ajaxContent" style="width:485px;height:345px">
 *      ${content}
 *      </div>
 *  </div>
 * ---------------------------------------------------
 */

enum SELECTOR {
    OVERLAY_ID = 'TB_overlay',
    MODAL_WIN_ID = 'TB_window',
    MODAL_CONTENT_ID = 'TB_ajaxContent',
    CLOSE_ID = 'TB_closeWindowButton',
}

class ModalWindow {
    public overlay: HTMLDivElement
    public dom: HTMLDivElement
    constructor(content: HTMLElement) {
        this.overlay = createElement('div', SELECTOR.OVERLAY_ID, true) as HTMLDivElement
        this.overlay.className = 'TB_overlayBG'
        this.dom = createElement('div', SELECTOR.MODAL_WIN_ID, true) as HTMLDivElement
        setCss(this.dom, {
            'margin-left': '-257px',
            'margin-top': '-195px',
            'display': 'block',
            'width': '515px',
        })
        this.dom.innerHTML = `
<div id="TB_title">
<div id="TB_ajaxWindowTitle"></div>
<div id="TB_closeAjaxWindow"><a href="#" id="${SELECTOR.CLOSE_ID}">close</a></div>
</div>
<div id="TB_ajaxContent" style="width:485px;height:345px">
${content.outerHTML}
</div>
`
    }

    public _registerCloseEvent() {
        this.overlay.onclick = this.close.bind(this)
        query(`#${SELECTOR.CLOSE_ID}`, this.dom).then(closeButton => closeButton.onclick = this.close.bind(this))
    }

    public show() {
        document.body.append(this.overlay)
        document.body.append(this.dom)
        this._registerCloseEvent()
    }

    public close() {
        this.dom.remove()
        this.overlay.remove()
    }
}
