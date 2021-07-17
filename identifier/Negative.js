import Sequential from './Sequential';

class Negative extends Sequential {
    constructor(config) {
        super(config);
        this.increment = -1;
        this.seed = -1000
    }
}

export default Negative;
// Ext.define('Ext.data.identifier.Negative', {
//     extend: 'Ext.data.identifier.Sequential',

//     alias: 'data.identifier.negative',

//     config: {
//         increment: -1,

//         seed: -1
//     }
// });