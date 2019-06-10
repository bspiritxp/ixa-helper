import { query } from 'Utils/dom'
import { currentVillage } from 'Utils/data'

export default Deck = () => {
    const cv = currentVillage()
    const partLocation = query('select#select_village')
    if (partLocation && partLocation.value === "") {
      partLocation.value = cv.id
    }
}
