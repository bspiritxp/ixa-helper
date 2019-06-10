import Deck from './deck'
import Report from './report'

const emptyHandler = () => ''

export default {
    '/card/deck.php': Deck,
    '/report/list.php': Report,
}