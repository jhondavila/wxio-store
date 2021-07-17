import React, { Fragment, forceUpdate, useState } from 'react';

class WTools extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            lastUpdated: Date.now()
        }

        this.stores = Array.prototype.slice.call(this.props.store);
        //console.log(this.props.store);
        window.store = this.stores;
    }

    _onChange = () => {
        this.setState({ lastUpdated: Date.now()})
    }
    
    _onChangePage = (p, t) => {
        //console.log(this.props);
        //console.log(forceUpdate);
    }

    componentWillMount = () => {
        this.stores && this.stores.forEach(store => {
          //  store.on('change', this._onChange);
          //  store.on('changepage', this._onChangePage);
        })
    }

    componentWillUnmount = () => {
        this.stores && this.stores.forEach(store => {
            store.off('change', this._onChange)
        })
    }

    componentDidUpdate = (prevProps) => {
        
    }

    render() {
        return (<Fragment>
            {this.props.children}
        </Fragment>)
    }
}

export default WTools;