// import Wx from '../../core';
class Sequential {
    constructor(cfg) {
        this.increment = 1;
        this.prefix = null;
        this.seed = 1;
        Object.assign(this,cfg);
        // Wx.apply(this, cfg);
    }
    generate() {
        var me = this,
            seed = me.seed,
            prefix = me.prefix;
        me.seed += me.increment;
        return (prefix !== null) ? prefix + seed : seed;
    }
}
export default Sequential;