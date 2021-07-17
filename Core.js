
var arrayPrototype = Array.prototype;

let propToString = Object.prototype.toString

export default {
    Array: {
        indexOf(array, item, from) {
            return arrayPrototype.indexOf.call(array, item, from);
        },
        include(array, item) {
            if (!this.contains(array, item)) {
                array.push(item);
            }
        },
        contains(array, item) {
            return arrayPrototype.indexOf.call(array, item) !== -1;
        },
        erase(array, index, removeCount) {
            array.splice(index, removeCount);
            return array;
        },
        remove(array, item) {
            var index = this.indexOf(array, item);

            if (index !== -1) {
                this.erase(array, index, 1);
            }

            return array;
        }
    },
    isObject: function (value) {
        return propToString.call(value) === "[object Object]";
    },
    isArray: Array.isArray,
    isFunction(value) {
        return !!value && typeof value === "function";
    },
    isString(value) {
        return typeof value === "string";
    },
    classId(cls) {
        let prototype = Object.getPrototypeOf(cls);
        if (!prototype.constructor.sequence) {
            let className = prototype.constructor.name;
            Object.defineProperty(prototype.constructor, "sequence", {
                value: {
                    seed: 0,
                    prefix: className,
                    generate() {
                        this.seed++;
                        return this.prefix !== null
                            ? this.prefix + "-" + this.seed
                            : this.seed;
                    }
                }
            });
        }
        return prototype.constructor.sequence.generate();
    },
    parseToForm(form, root, data) {
        if (this.isArray(data)) {
            if (this.isEmpty(data)) {
                form.append(`${root}`, "[]");
            } else {
                let row;
                for (let x = 0; x < data.length; x++) {
                    row = data[x];
                    this.parseToForm(form, `${root}[${x}]`, row);
                }
            }
        } else if (this.isObject(data)) {
            for (let p in data) {
                this.parseToForm(form, `${root}[${p}]`, data[p]);
            }
        } else {
            form.append(`${root}`, data);
        }
    },
    isEmpty(value, allowEmptyString) {
        return (
            value == null ||
            (!allowEmptyString ? value === "" : false) ||
            (this.isArray(value) && value.length === 0)
        );
    }
};