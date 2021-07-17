import React from 'react';
export const connectToStore = (WrappedComponent, stores) => {
    return class StoreComponent extends React.Component {
        constructor(props) {
            super(props);
            // debugger

        }

        componentDidMount() {
            // debugger
            // for (let p in this.props.stores) {
            let store = this.props.store;
            if (store) {

                store.on("add", this.handleChange)
                store.on("loading", this.handleChange)
                store.on("remove", this.handleChange)

                // 
                if (store.autoLoad) {
                    store.load();
                }
            }
            // }
        }


        componentWillUnmount() {
            // for (let p in stores) {
            let store = this.props.store;
            if (store) {

                store.removeListener("add", this.handleChange);
                store.removeListener("loading", this.handleChange);
                store.removeListener("remove", this.handleChange);
            }
            // }
        }

        handleChange = () => {
            if (this.component) {
                if (this.component.onStoreDataChanged) {
                    this.component.onStoreDataChanged();
                }
            }
            this.forceUpdate();
        }

        render() {
            return <WrappedComponent ref={c => this.component = c} {...this.props} />;
        }
    }
}

