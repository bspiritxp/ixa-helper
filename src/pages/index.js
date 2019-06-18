import Deck from './deck'
import Report from './report'
import Mapping from './map'
import Draw from './draw'

const emptyHandler = () => ''

export default {
    '/card/deck.php': Deck,
    '/report/list.php': Report,
    '/map.php': Mapping,
    '/senkuji/senkuji_result.php': Draw,
}