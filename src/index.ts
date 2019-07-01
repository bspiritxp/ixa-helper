import Router from '@/pages';

const currentPath = location.pathname;
const pageMethod = Router[currentPath];
const jqObjName = ['j213$', 'j$', 'jQuery', '$$', '$'].filter(key => window.hasOwnProperty(key))[0];
const jqueryDesc = Object.getOwnPropertyDescriptor(window, jqObjName);
const jq$ = jqueryDesc ? jqueryDesc.value : null;
console.info('ixa plugin on', jq$ ? 'with jquery' : '');

if (pageMethod) {
  pageMethod(jq$);
  console.info('page helper on');
}
