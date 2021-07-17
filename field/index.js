import FieldBoolean from './Boolean'
import FieldInteger from './Integer'
import FieldNumber from './Number'
import FieldString from './String'
import FieldDefault from './Field'
import FieldArray from './Array'
import FieldFile from './File';
import FieldStore from './Store';
import FieldObject from './Object';
import FieldTime from "./Time";
import FieldDate from "./Date"
import FieldModel from "./Model"
export default {
    boolean: FieldBoolean,
    string: FieldString,
    integer: FieldInteger,
    number: FieldNumber,
    array: FieldArray,
    file: FieldFile,
    store: FieldStore,
    object: FieldObject,
    time: FieldTime,
    model: FieldModel,
    date: FieldDate,
    default: FieldDefault
};