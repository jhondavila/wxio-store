import React from 'react';
export const connectToStore = (WrappedComponent, stores) => {
    class StoreConnect extends React.Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
            this.addEventsToStore(this.props.store);
            for (let key in stores) {
                this.addEventsToStore(stores[key]);
            }
        }

        componentWillUnmount() {
            this.removeEventsToStore(this.props.store);
            for (let key in stores) {
                this.removeEventsToStore(stores[key]);
            }
        }

        addEventsToStore(store) {
            if (store) {
                store.on("add", this.handleChange)
                store.on("loading", this.handleChange)
                store.on("remove", this.handleChange)
                store.on("import", this.handleImport);
                if (store.autoLoad && !store.isLoaded) {
                    store.load();
                }
            }
        }

        removeEventsToStore(store) {
            if (store) {
                store.removeListener("add", this.handleChange);
                store.removeListener("loading", this.handleChange);
                store.removeListener("remove", this.handleChange);
                store.removeListener("import", this.handleImport);
            }
        }

        handleImport = () => {
            if (this.component) {
                if (this.component.onImport) {
                    this.component.onImport();
                }
            }
            this.forceUpdate();
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
            return <WrappedComponent
                ref={(c) => {
                    this.component = c;
                    this.props.forwardedRef(c);
                }}
                {...this.props}

            />;
        }
    }

    return React.forwardRef((props, ref) => {
        return <StoreConnect {...props} forwardedRef={ref} />;
    });
}

