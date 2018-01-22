if(document) {
    document.write(`<div id="div1" bind="model1"></div>`);
    document.write(`<div id="div2" bind="model2"></div>`);
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Create a new Model object
 *
 * @param {Object} value
 */
function Model(value) {
    this._value = typeof value === 'undefined' ? '' : value;
    this._listeners = [];
}

/**
 * Set value
 *
 * @param {Object} value
 */
Model.prototype.set = function (value) {
    var self = this;
    self._value = value;
    // model中的值改变时，应通知注册过的回调函数
    // 按照Javascript事件处理的一般机制，我们异步地调用回调函数
    // 如果觉得setTimeout影响性能，也可以采用requestAnimationFrame
    setTimeout(function () {
        self._listeners.forEach(function (listener) {
            listener.call(self, value);
        });
    });
};


/**
 * Register a new listener
 *
 * @param {Function} listener
 */
Model.prototype.watch = function (listener) {
    // 注册监听的回调函数
    this._listeners.push(listener);
};

/**
 * Bind a node so that when the model changes, new value will be set to the node.
 *
 * @param {Object} node
 */
Model.prototype.bind = function (node) {
    this.watch(function (value) {
        node.innerHTML = value;
    });
};


////////////////////////////////////////////////////////////////////////////////

function Controller(callback) {
    var models = {};
    // bind domNodes
    var views = document.querySelectorAll('[bind]');

    views = Array.prototype.slice.call(views, 0);

    views.forEach(function (view) {
        var modelName = view.getAttribute('bind');
        // every dom has a model
        models[modelName] = models[modelName] || new Model();
        // bind domNode with model
        models[modelName].bind(view);
    });
    
    callback.call(this, models);
}

new Controller(function (models) {
    models.model1.set('this is div1');
    models.model2.set('this is div2');
});

////////////////////////////////////////////////////////////////////////////////

// var model = new Model();
// var div1 = document.getElementById('div1');

// model.bind(document.getElementById('div1'));
// model.bind(document.getElementById('div2'));

// model.watch(function (value) {
//     div1.innerHTML = value;
// });

// model.set('hello, this is a div');
