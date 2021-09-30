import Field from './Field';
import moment from 'moment';

class FDate extends Field {

    type = "date";
    dateReadFormat = null;
    dateWriteFormat = null;

    constructor(config) {
        super(config);
        this.isDateField = true;
        this.dateFormat = config.dateFormat || this.defaultDateFormat;

        this.dateReadFormat = config.dateReadFormat;
        this.dateWriteFormat = config.dateWriteFormat;
    }


    defaultDateFormat(v) {
        return new moment(v);
    }
    defaultDateWriteFormat(v){
        return v.toISOString();
    }
    convert(v) {
        if (v) {
            try {

                var dateFormat = this.dateReadFormat || this.dateFormat;
                return dateFormat(v);
            } catch (error) {
                return;
            }
        } else {
            return;
        }
    }

    serialize(val) {
        if (val) {
            var dateWriteFormat = this.dateWriteFormat || this.defaultDateWriteFormat;
            return dateWriteFormat(val);
        } else {
            return;
        }
    }


    // getType() {
    //     return 'bool';
    // }
}

export default FDate;