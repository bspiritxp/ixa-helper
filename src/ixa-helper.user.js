// ==UserScript==
// @name     ixa-helper
// @version  1
// @match https://*.sengokuixa.jp/*
// @grant    none
// ==/UserScript==
'use strict';

// 对象实体
class Village {
    constructor(el) {
        this.id = parseInt(el.dataset.village_id, 10);
        this.x = parseInt(el.dataset.village_x, 10);
        this.y = parseInt(el.dataset.village_y, 10);
        this.c = parseInt(el.dataset.village_c, 10);
        this.title = el.lastChild.textContent;
    }
}

const utils = {
    queryLocGroup: selector => {
        const items = [];
        document.querySelectorAll(selector)
        .forEach(el => 
        items.push(new Village(el)));
        return new Set(items);
    }
}

const dbs = {
  currentVillage: () => 
     new Village(document.querySelector('li.on[data-village_id]')),
  
  mainCity: () => new Village(
    document.querySelector('.my_capital').querySelector('li')),
  
  myVillages: () => utils.queryLocGroup('.my_country.village li'),
  
  myFronts: () => utils.queryLocGroup('.other_country li:not(.head)'),
}

const router = {
  '/card/deck.php': () => {
    const currentVillage = dbs.currentVillage();
    const partLocation = document.querySelector('select#select_village');
    if (partLocation && partLocation.value === "") {
      partLocation.value = currentVillage.id;
    }
  },
  '/card/trade.php': () => {
    
  }
}

const pageMethod = router[location.pathname];

console.info('ixa plugin on.');
if (pageMethod) {
  pageMethod();
  console.info('page helper on.');
}
