export default class Village {
    id: number | null = null
    x: number | null = null
    y: number | null = null
    c: number | null = null
    title: string | null = null

    constructor(el: Element | null) {
        if (el !== null && el instanceof HTMLElement) {
            this.id = el.dataset.village_id ? Number(el.dataset.village_id) : null;
            this.x = el.dataset.village_x ? Number(el.dataset.village_x): null;
            this.y = el.dataset.village_y ? Number(el.dataset.village_y): null;
            this.c = el.dataset.village_c ? Number(el.dataset.village_c): null;
            this.title = el.lastChild ? el.lastChild.textContent : '';
        }
    }
}
