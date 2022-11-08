import Integer from './Integer';
import Utils from '../Utils';
import * as _ from 'lodash';

class FNumber extends Integer {

    type = "float";

    constructor(config) {
        super(config);
        this.isIntegerField = false;
        this.isNumberField = true;
        this.numericType = 'float';

        this.stripRe =  /[\$,%]/g;

        // this.getNumber = Wx.identityFn;
    }



    convert(v) {
        // Handle values which are already numbers.
        // Value truncation behaviour of parseInt is historic and must be maintained.
        // parseInt(35.9)  and parseInt("35.9") returns 35
        if(v){
            return parseFloat(String(v).replace(this.stripRe, ''));

            //el number tiene menos metodos paraprevinir el null, ese es el problema
            
        }else{
            
            return null;
        }
    }


    parse(v) {
        return parseFloat(String(v).replace(this.stripRe, ''));
    }


    isEqual(value1, value2) {
        return (Utils.isEmpty(value1) && Utils.isEmpty(value2)) || _.isEqual(value1, value2);
    }
    
}
export default FNumber;