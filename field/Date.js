import Field from './Field';
import moment from 'moment';

class FDate extends Field {

    type = "date";

    constructor(config) {
        super(config);
        this.isDateField = true;
    }

    convert(v) {
        if (v) {
            try {
                return new moment(v);
            } catch (error) {
                return;
            }
        } else {
            return;
        }
    }

    serialize(val) {
        if (val) {
            return val.toISOString()
        } else {
            return;
        }
    }
    // getType() {
    //     return 'bool';
    // }
}

export default FDate;