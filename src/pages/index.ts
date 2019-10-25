import Deck from './deck'
import Draw from './draw'
import Mapping from './map'
import Report from './report'
import Trade from './trade'

const emptyHandler = () => null

interface Router {
    readonly [key: string]: (jquery: CallableFunction|null) => void
}

const router: Router = {
    '/card/deck.php': Deck,
    '/report/list.php': Report,
    '/map.php': Mapping,
    '/senkuji/senkuji_result.php': Draw,
    '/card/status_info.php': emptyHandler,
    '/card/trade.php': Trade,
}
export default router
