import Deck from './deck'
import Report from './report'
import Mapping from './map'
import Draw from './draw'

const emptyHandler = () => null;

interface Router {
    readonly [key: string]: (jquery: CallableFunction|null) => void
}

const router: Router = {
    '/card/deck.php': Deck,
    '/report/list.php': Report,
    '/map.php': Mapping,
    '/senkuji/senkuji_result.php': Draw,
    '/card/status_info.php': emptyHandler,
}
export default router;