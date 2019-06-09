export default class Village {
    constructor(el) {
        this.id = parseInt(el.dataset.village_id, 10);
        this.x = parseInt(el.dataset.village_x, 10);
        this.y = parseInt(el.dataset.village_y, 10);
        this.c = parseInt(el.dataset.village_c, 10);
        this.title = el.lastChild.textContent;
    }
}
