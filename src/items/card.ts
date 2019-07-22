import Optional from "@/utils/tool";

const MAX_HP = 100;
const MAX_LEVEL = 20;
const MAX_RANK = 7;
const RANK_STAR = String.fromCharCode(9733);   // ★

enum Rarity { '天', '極', '特', '上', '序', '化', '童' }

enum ArmSuit {
    SSS =/**   */1.25,
    SS =/**    */1.15,
    S =/**     */1.10,
    A =/**     */1.05,
    B =/**     */1.00,
    C =/**     */0.95,
    D =/**     */0.90,
    E =/**     */0.85,
    F =/**     */0.80,
}

type ArmSuitLevel = keyof typeof ArmSuit;
type RareName = keyof typeof Rarity;

interface Suits {
    lancer: ArmSuitLevel        // yari
    arch: ArmSuitLevel          // yumi
    rider: ArmSuitLevel         // kiba
    armament: ArmSuitLevel      // heiki
}

interface Card {
    no: number;
    name: string;
    jpName: string;
    rarity: Rarity;
    cost: number;
    rank: number;
    level: number;
    atk: number;
    def: number;
    int: number;
    armSuits: Suits;
    nextExp: number;
    skills: string[];
    queryBar?: number;
    hp?: number;
    el: HTMLElement;
}

declare var Card: {
    prototype: Card;
    new(): Card;
}

interface TradeCard extends Card {
    price: number;
    canBuy: boolean;
    el: HTMLTableRowElement;
}

declare var TradeCard: {
    prototype: TradeCard;
    new(): TradeCard;
}

function ofTrade(el: HTMLTableRowElement): TradeCard {
    const card = new TradeCard();
    card.el = el;
    Optional.ofNullable(el.children[0].textContent).map(no => Number(no)).then(r => card.no = r)
    Optional.ofNullable(el.children[1].children[0])
        .filter(el => el.tagName == 'img')
        .map(el => el.getAttribute('alt'))
        .map(rareText => Rarity[rareText as RareName])
        .then(rare => card.rarity = rare)
    Optional.ofNullable(el.children[2])
    return card;
}

export {
    Rarity,
    Card,
    TradeCard,
    ofTrade,
    RareName,
    ArmSuit,
    ArmSuitLevel,
}