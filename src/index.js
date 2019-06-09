import Router from 'Pages'

const pageMethod = Router[location.pathname];

console.info('ixa plugin on.');
if (pageMethod) {
  pageMethod();
  console.info('page helper on.');
}
