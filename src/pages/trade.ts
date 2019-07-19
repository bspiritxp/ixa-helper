import Icons from "@/items/icons";
import { create, setCss } from '@/utils/dom';

enum SELECTOR {
    FORM_BOX = 'form[name=trade]'
}

const filterBox = () => {
    const boxDiv = create('div', 'filterBox', true);
    setCss(boxDiv, {
        width: 'fit-content',
        display: 'inline-grid',
        'grid-template-columns': '1fr 2fr auto',
        'justify-items': 'center',
    });
    
}

export default () => {

}