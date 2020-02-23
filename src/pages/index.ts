import Deck from './deck'
import Draw from './draw'
import Login from './login'
import Mapping from './map'
import Report from './report'
import StatusInfo from './status-info'
import Trade from './trade'
import Village from './village'

const emptyHandler = () => null

interface Router {
    readonly [key: string]: (config?: {[key: string]: any}, jquery?: CallableFunction|null) => void
}

const router: Router = {
    '/card/deck.php': Deck,
    '/report/list.php': Report,
    '/map.php': Mapping,
    '/senkuji/senkuji_result.php': Draw,
    '/card/status_info.php': StatusInfo,
    '/card/trade.php': Trade,
    '/false/login_sessionout.php': Login,
    '/world/select_world.php': Login,
    '/': Login,
    '/index.php': Login,
    '/village.php': Village,
}
export default router
