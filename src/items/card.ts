import Optional from "@/utils/tool";
import _ from "lodash";

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

class Card implements Card {}

interface TradeCard extends Card {
    price: number;
    canBuy: boolean;
    buyTime: Date;
    el: HTMLTableRowElement;
}

class TradeCard implements TradeCard {}

function ofTrade(el: HTMLTableRowElement): TradeCard {
    const card: TradeCard = new TradeCard();
    card.el = el;
    // 卡编号
    Optional.ofNullable(el.children[0].textContent).map(no => Number(no)).then(r => card.no = r)
    // 稀有度
    Optional.ofNullable(el.children[1].children[0])
        .filter(el => el.tagName == 'img')
        .map(el => el.getAttribute('alt'))
        .map(rareText => Rarity[rareText as RareName])
        .then(rare => card.rarity = rare)
    // Rank
    Optional.ofNullable(el.children[2])
        .map(el => _.isNull(el.textContent) || el.textContent.trim() == '' ? Optional.ofNullable(el.querySelector('img')).get().alt : el.textContent)
        .then(txt => {
            card.rank = rankByTxt(txt);
        });
    // 技能
    Optional.ofNullable(el.children[3])
        .map(el => el.textContent)
        .map(raw => raw.trim().split('\n').filter(t => t.trim().length > 2))
        .then(skills => card.skills = skills)
    // 价格
    Optional.ofNullable(el.children[4])
        .map(el => el.textContent)
        .map(txt => Number(txt))
        .then(price => card.price = price)
    // 入札人数：el.children[5] 忽略
    // 入札时间
    Optional.ofNullable(el.children[6])
        .map(el => el.textContent)
        .map(txt => new Date(`${txt}+9:00`)) // Japan ZoneTime
        .then(dt => card.buyTime = dt)
    // 是否可购买
    Optional.ofNullable(el.children[7])
        .map(el => (el as HTMLElement).classList.contains('choose'))
        .then(canBuy => card.canBuy = canBuy)
    return card;
}

function rankByTxt(txt: string) {
    return txt === '限界突破' ? 6 : Array.from(txt.trim()).filter(c => c == RANK_STAR).length;
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