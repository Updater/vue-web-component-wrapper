var camelizeRE = /-(\w)/g;
var camelize = function camelize(str) {
  return str.replace(camelizeRE, function (_, c) {
    return c ? c.toUpperCase() : '';
  });
};

var hyphenateRE = /\B([A-Z])/g;
var hyphenate = function hyphenate(str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase();
};

function getInitialProps(propsList) {
  var res = {};
  propsList.forEach(function (key) {
    res[key] = undefined;
  });
  return res;
}

function injectHook(options, key, hook) {
  options[key] = [].concat(options[key] || []);
  options[key].unshift(hook);
}

function callHooks(vm, hook) {
  if (vm) {
    var hooks = vm.$options[hook] || [];
    hooks.forEach(function (hook) {
      hook.call(vm);
    });
  }
}

function createCustomEvent(name, args) {
  return new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: args
  });
}

var isBoolean = function isBoolean(val) {
  return (/function Boolean/.test(String(val))
  );
};
var isNumber = function isNumber(val) {
  return (/function Number/.test(String(val))
  );
};

function convertAttributeValue(value, name) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      type = _ref.type;

  if (isBoolean(type)) {
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    if (value === '' || value === name) {
      return true;
    }
    return value != null;
  } else if (isNumber(type)) {
    var parsed = parseFloat(value, 10);
    return isNaN(parsed) ? value : parsed;
  } else {
    return value;
  }
}

function toVNodes(h, children) {
  var res = [];
  for (var i = 0, l = children.length; i < l; i++) {
    res.push(toVNode(h, children[i]));
  }
  return res;
}

function toVNode(h, node) {
  if (node.nodeType === 3) {
    return node.data.trim() ? node.data : null;
  } else if (node.nodeType === 1) {
    var data = {
      attrs: getAttributes(node),
      domProps: {
        innerHTML: node.innerHTML
      }
    };
    if (data.attrs.slot) {
      data.slot = data.attrs.slot;
      delete data.attrs.slot;
    }
    return h(node.tagName, data);
  } else {
    return null;
  }
}

function getAttributes(node) {
  var res = {};
  for (var i = 0, l = node.attributes.length; i < l; i++) {
    var attr = node.attributes[i];
    res[attr.nodeName] = attr.nodeValue;
  }
  return res;
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _fixBabelExtend = function (O) {
  var gPO = O.getPrototypeOf || function (o) {
    return o.__proto__;
  },
      sPO = O.setPrototypeOf || function (o, p) {
    o.__proto__ = p;
    return o;
  },
      construct = (typeof Reflect === 'undefined' ? 'undefined' : _typeof(Reflect)) === 'object' ? Reflect.construct : function (Parent, args, Class) {
    var Constructor,
        a = [null];
    a.push.apply(a, args);
    Constructor = Parent.bind.apply(Parent, a);
    return sPO(new Constructor(), Class.prototype);
  };

  return function fixBabelExtend(Class) {
    var Parent = gPO(Class);
    return sPO(Class, sPO(function Super() {
      return construct(Parent, arguments, gPO(this).constructor);
    }, Parent));
  };
}(Object);

function wrap(Vue, Component) {
  var isAsync = typeof Component === 'function' && !Component.cid;
  var isInitialized = false;
  var hyphenatedPropsList = void 0;
  var camelizedPropsList = void 0;
  var camelizedPropsMap = void 0;

  function initialize(Component) {
    if (isInitialized) return;

    var options = typeof Component === 'function' ? Component.options : Component;

    // extract props info
    var propsList = Array.isArray(options.props) ? options.props : Object.keys(options.props || {});
    hyphenatedPropsList = propsList.map(hyphenate);
    camelizedPropsList = propsList.map(camelize);
    var originalPropsAsObject = Array.isArray(options.props) ? {} : options.props || {};
    camelizedPropsMap = camelizedPropsList.reduce(function (map, key, i) {
      map[key] = originalPropsAsObject[propsList[i]];
      return map;
    }, {});

    // proxy $emit to native DOM events
    injectHook(options, 'beforeCreate', function () {
      var _this = this;

      var emit = this.$emit;
      this.$emit = function (name) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        _this.$root.$options.customElement.dispatchEvent(createCustomEvent(name, args));
        return emit.call.apply(emit, [_this, name].concat(args));
      };
    });

    injectHook(options, 'created', function () {
      var _this2 = this;

      // sync default props values to wrapper on created
      camelizedPropsList.forEach(function (key) {
        _this2.$root.props[key] = _this2[key];
      });
    });

    // proxy props as Element properties
    camelizedPropsList.forEach(function (key) {
      Object.defineProperty(CustomElement.prototype, key, {
        get: function get() {
          return this._wrapper.props[key];
        },
        set: function set(newVal) {
          this._wrapper.props[key] = newVal;
        },

        enumerable: false,
        configurable: true
      });
    });

    isInitialized = true;
  }

  function syncAttribute(el, key) {
    var camelized = camelize(key);
    var value = el.hasAttribute(key) ? el.getAttribute(key) : undefined;
    el._wrapper.props[camelized] = convertAttributeValue(value, key, camelizedPropsMap[camelized]);
  }

  var CustomElement = _fixBabelExtend(function (_HTMLElement) {
    _inherits(CustomElement, _HTMLElement);

    function CustomElement() {
      _classCallCheck(this, CustomElement);

      var _this3 = _possibleConstructorReturn(this, (CustomElement.__proto__ || Object.getPrototypeOf(CustomElement)).call(this));

      _this3.attachShadow({ mode: 'open' });

      var wrapper = _this3._wrapper = new Vue({
        name: 'shadow-root',
        customElement: _this3,
        shadowRoot: _this3.shadowRoot,
        data: function data() {
          return {
            props: {},
            slotChildren: []
          };
        },
        render: function render(h) {
          return h(Component, {
            ref: 'inner',
            props: this.props
          }, this.slotChildren);
        }
      });

      // Use MutationObserver to react to future attribute & slot content change
      var observer = new MutationObserver(function (mutations) {
        var hasChildrenChange = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (isInitialized && m.type === 'attributes' && m.target === _this3) {
            syncAttribute(_this3, m.attributeName);
          } else {
            hasChildrenChange = true;
          }
        }
        if (hasChildrenChange) {
          wrapper.slotChildren = Object.freeze(toVNodes(wrapper.$createElement, _this3.childNodes));
        }
      });
      observer.observe(_this3, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
      return _this3;
    }

    _createClass(CustomElement, [{
      key: 'connectedCallback',
      value: function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
          var _this4 = this;

          var wrapper, syncInitialAttributes;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  wrapper = this._wrapper;
                  _context.next = 3;
                  return Promise.resolve();

                case 3:

                  if (!wrapper._isMounted) {
                    // initialize attributes
                    syncInitialAttributes = function syncInitialAttributes() {
                      wrapper.props = getInitialProps(camelizedPropsList);
                      hyphenatedPropsList.forEach(function (key) {
                        syncAttribute(_this4, key);
                      });
                    };

                    if (isInitialized) {
                      syncInitialAttributes();
                    } else {
                      // async & unresolved
                      Component().then(function (resolved) {
                        if (resolved.__esModule || resolved[Symbol.toStringTag] === 'Module') {
                          resolved = resolved.default;
                        }
                        initialize(resolved);
                        syncInitialAttributes();
                      });
                    }
                    // initialize children
                    wrapper.slotChildren = Object.freeze(toVNodes(wrapper.$createElement, this.childNodes));
                    wrapper.$mount();
                    this.shadowRoot.appendChild(wrapper.$el);
                  } else {
                    callHooks(this.vueComponent, 'activated');
                  }

                case 4:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function connectedCallback() {
          return _ref.apply(this, arguments);
        }

        return connectedCallback;
      }()
    }, {
      key: 'disconnectedCallback',
      value: function disconnectedCallback() {
        callHooks(this.vueComponent, 'deactivated');
      }
    }, {
      key: 'vueComponent',
      get: function get() {
        return this._wrapper.$refs.inner;
      }
    }]);

    return CustomElement;
  }(HTMLElement));

  if (!isAsync) {
    initialize(Component);
  }

  return CustomElement;
}

export default wrap;
