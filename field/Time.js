import Field from './Field';
import * as _ from "lodash"

class FTime extends Field {

    type = "date";

    constructor(config) {
        super(config);
        this.isDateField = true;
    }

    convert(v) {
        if (v instanceof Date) {
            return v;
        } else if (typeof v === "string") {
            let date = new Date();
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);

            let parts = v.split(":");

            date.setHours(parts[0]);
            date.setMinutes(parts[1]);
            if (parts[2]) {
                date.setSeconds(parts[2]);
            }
            return date;
        } else {
            return;
        }
    }

    serialize(val) {
        if (val && val instanceof Date) {
            var time = val;
            return ("0" + time.getHours()).slice(-2) + ":" +
                ("0" + time.getMinutes()).slice(-2) + ":" +
                ("0" + time.getSeconds()).slice(-2);
        } else {
            return;
        }
    }


    isEqual(value1, value2) {
        let aString = "";
        let bString = "";
        if (value1) {
            if (typeof value1 === "string") {
                aString = value1;
            } else if (value1 instanceof Date) {
                aString = value1.toLocaleTimeString();
            }
        }
        if (value2) {
            if (typeof value2 === "string") {
                bString = value2;
            } else if (value2 instanceof Date) {
                bString = value2.toLocaleTimeString();
            }
        }
        return _.isEqual(aString, bString);
    }

}

export default FTime;