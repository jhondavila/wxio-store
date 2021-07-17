import ProxyBase from "./Base"
import Request from "../Request";
import * as _ from "lodash";
class ProxyServer extends ProxyBase {

    api = {
        destroy: null,
        read: null,
        update: null,
        create: null
    };
    methods = {
        destroy: "DELETE",
        read: "GET",
        update: "PUT",
        create: "POST"
    };

    headers = {

    }
    store = null;
    constructor(opts) {
        super();

        this.api = {
            ...this.api,
            ...opts.api
        };
        this.methods = {
            ...this.methods,
            ...opts.methods
        };

        this.headers = {
            ...this.headers,
            ...opts.headers
        };
        this.store = opts.store;
        this.mode = opts.mode;
    }

    async loadRequired(filters, opts) {
        let parseFilters = this.parseFilters(filters);

        console.log(opts)
        if (opts && opts.staticFilters) {
            let optsFilters = opts.staticFilters;
            let list = [];
            if(!Array.isArray(optsFilters)){
                optsFilters = [optsFilters];
            }
            for (let x = 0; x < optsFilters.length; x++) {
                if (optsFilters[x]) {
                    let filter = {};
                    Object.assign(filter, optsFilters[x]);
                    list.push(filter);
                }
            }
            if (list.length > 0) {
                parseFilters = parseFilters || [];
                parseFilters.push(...list);
            }
        }


        let extraParams = this.parseExtraParams();
        let params = {
            filter: JSON.stringify(parseFilters),
        };
        Object.assign(params, extraParams);
        let response = await Request({
            method: this.methods["read"],
            url: this.api["read"],
            params: params,
            headers: {
                ...this.headers
            }
        });
        return response;
    }

    async load() {
        let start = this.store.start || 0;
        let limit = this.store.pageSize;

        let filters = this.parseFilters();
        let sorters = this.parseSorters();
        let params = {
            start: start,
            limit: limit
        };
        let extraParams = this.parseExtraParams();

        Object.assign(params, extraParams);
        if (filters) {
            Object.assign(params, {
                filter: JSON.stringify(filters),
            });
        }
        if (sorters) {
            Object.assign(params, {
                sort: JSON.stringify(sorters),
            });
        }

        let response = await Request({
            method: this.methods["read"],
            url: this.api["read"],
            params: params,
            headers: {
                ...this.headers
            }
        });

        if (response.data && response.data.total) {
            this.store.total = response.data.total;
        }
        return response;
    }


    parseSorters(sorters) {
        sorters = sorters || (this.store ? this.store.sorters : []);
        sorters = sorters.map(i => {
            return {
                property: i.property,
                direction: i.direction ? i.direction.toLowerCase() : null
            }
        });
        if (sorters.length > 0) {
            return sorters;
        } else {
            return
        }
    }
    parseFilters(filters) {
        let filter;
        let list = [];
        {
            let staticFilters = this.store ? this.store.staticFilters : []
            for (let x = 0; x < staticFilters.length; x++) {
                if (staticFilters[x]) {
                    filter = {};
                    Object.assign(filter, staticFilters[x]);
                    list.push(filter);
                }
            }
        }
        {
            filters = filters || (this.store ? this.store.filters : []);
            for (let x = 0; x < filters.length; x++) {
                if (filters[x]) {
                    filter = {};
                    Object.assign(filter, filters[x]);
                    list.push(filter);
                }
            }
        }


        if (list.length > 0) {
            return list;
        } else {
            return;
        }
    }


    parseExtraParams() {
        let extraParams = {
            ...(this.store && this.store.extraParams)
        };
        if (this.store.modelParent) {
            Object.assign(extraParams, {
                id: this.store.modelParent.getId()
            })
        }
        return extraParams;
    }



    async execute(operations) {
        // debugger
        let filters = this.parseFilters();
        let extraParams = this.parseExtraParams();
        let params = {};

        Object.assign(params, extraParams);

        if (filters) {
            Object.assign(params, {
                filter: JSON.stringify(filters)
            });
        }

        if (this.mode == "include") {
            await this.modeInclude(operations, params);
        } else {
            if (this.chunkSync) {
                // await this.batchChunkMode(operations, store, params);
            } else {
                await this.batchSimple(operations, params);
            }
        }

        return true;
    }

    async modeInclude(operations, params) {
        let store = this.store;
        // debugger
        if (operations.create) {
            let data = this.getCreateData(operations.create, store);
            params.data = JSON.stringify(data);
            let response = await Request({
                method: this.methods["create"],
                url: this.api["create"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processCreate(operations.create, response, store);
        }


        if (operations.update) {
            let data = this.getUpdateData(operations.update, store);
            params.data = JSON.stringify(data);
            let response = await Request({
                method: this.methods["update"],
                url: this.api["update"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processUpdate(operations.update, response, store);
        }


        if (operations.destroy) {
            let data = this.getDestroyData(operations.destroy, store);
            params.data = JSON.stringify(data);

            let response = await Request({
                method: this.methods["destroy"],
                url: this.api["destroy"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processDestroy(operations.destroy, response, store);
        }
    }

    async batchSimple(operations, params) {
        let store = this.store;

        if (operations.create) {
            let data = this.getCreateData(operations.create, store);
            params.data = JSON.stringify(data);
            let response = await Request({
                method: this.methods["create"],
                url: this.api["create"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processCreate(operations.create, response, store);
        }


        if (operations.update) {
            let data = this.getUpdateData(operations.update, store);
            params.data = JSON.stringify(data);
            let response = await Request({
                method: this.methods["update"],
                url: this.api["update"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processUpdate(operations.update, response, store);
        }
        if (this.mode == "batch") {
            await this.getNestedSync(operations.create);
            await this.getNestedSync(operations.update);
        }


        if (operations.destroy) {
            let data = this.getDestroyData(operations.destroy, store);
            params.data = JSON.stringify(data);

            let response = await Request({
                method: this.methods["destroy"],
                url: this.api["destroy"],
                params: params,
                headers: {
                    ...this.headers
                }
            });
            let status = this.processDestroy(operations.destroy, response, store);
        }
    }
    async getNestedSync(records) {
        let stores = [];
        _.each(records, (record) => {
            record._eachNestedTypes((field, value) => {
                if (value && value.proxy) {
                    stores.push(value);
                }
            });
        });
        for (let x = 0; x < stores.length; x++) {
            // let status = stores[x].needsSync();
            // console.log(status);
            stores[x].proxy.setHeaders(this.headers);
            let status = await stores[x].sync();
            if (status === false || (status && status.error)) {
                throw "Nested Sync failed";
            }
        }
    }

    setHeaders(headers) {
        this.headers = {
            ...headers
        }
    }

}

export default ProxyServer;