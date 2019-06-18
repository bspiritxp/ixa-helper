import Router from 'Pages'

const pageMethod = Router[location.pathname]
const jquery = window.j213$ || window.j$ || window.jQuery || null
console.info('ixa plugin on', jquery ? `with jquery` : '')

if (pageMethod) {
  pageMethod(jquery)
  console.info('page helper on')
}
