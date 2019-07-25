import { query } from '@/utils/dom'
import { currentVillage } from '@/utils/data'
import Optional from '@/utils/tool';

const Deck = () => {
    const cv = currentVillage()
    if (cv.id === null) return
    query('select#select_village')
      .map(el => el as HTMLInputElement)
      .filter(el => el.value === '' )
      .then(partLocation => partLocation.value = cv.id ? cv.id.toString() : '')
}

export default Deck