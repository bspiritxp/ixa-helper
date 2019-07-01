import { query } from '@/utils/dom'
import { currentVillage } from '@/utils/data'

const Deck = () => {
    const cv = currentVillage()
    const partLocation = query('select#select_village')
    if (partLocation && partLocation.value === "") {
      partLocation.value = cv.id
    }
}

export default Deck