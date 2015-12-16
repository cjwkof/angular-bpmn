'use strict';
angular.module('angular-bpmn', []);

angular.module('angular-bpmn').run([
  '$rootScope', (function(_this) {
    return function($rootScope) {
      return $rootScope.runMode = 'debug';
    };
  })(this)
]);

'use strict';
angular.module('angular-bpmn').service('log', [
  '$log', '$rootScope', function($log, $rootScope) {
    return {
      debug: function() {
        if ($rootScope.runMode !== 'debug') {
          return;
        }
        return $log.debug.apply(self, arguments);
      },
      error: function() {
        return $log.error.apply(self, arguments);
      }
    };
  }
]);

'use strict';
angular.module('angular-bpmn').service('bpmnMock', function() {
  return {
    scheme1: {
      name: '',
      description: '',
      objects: [
        {
          id: 1,
          type: {
            name: 'event',
            start: {
              0: {
                0: true
              }
            }
          },
          position: {
            top: 80,
            left: 50
          },
          status: '',
          error: '',
          title: 'start event',
          description: ''
        }, {
          id: 2,
          type: {
            name: 'task',
            status: '',
            action: ''
          },
          position: {
            top: 60,
            left: 260
          },
          status: '',
          error: '',
          title: 'task',
          description: ''
        }, {
          id: 3,
          type: {
            name: 'event',
            end: {
              simply: {
                top_level: true
              }
            }
          },
          position: {
            top: 80,
            left: 530
          },
          status: '',
          error: '',
          title: 'end event',
          description: ''
        }
      ],
      connectors: [
        {
          id: 1,
          start: {
            object: 1,
            point: 1
          },
          end: {
            object: 2,
            point: 10
          },
          flow_type: "default",
          title: "connector №1"
        }, {
          id: 2,
          start: {
            object: 2,
            point: 4
          },
          end: {
            object: 3,
            point: 3
          },
          flow_type: "default",
          title: "connector №2"
        }
      ]
    }
  };
});

'use strict';
angular.module('angular-bpmn').directive('bpmnObject', [
  'log', '$timeout', '$templateCache', '$compile', '$templateRequest', '$q', function(log, $timeout, $templateCache, $compile, $templateRequest, $q) {
    return {
      restrict: 'A',
      controller: [
        "$scope", "$element", function($scope, $element) {
          var container, updateStyle;
          container = $($element);
          if ($scope.data.type.name === 'poster') {
            container.find('img').on('dragstart', function(e) {
              return e.preventDefault();
            });
          }
          updateStyle = function() {
            var style;
            style = {
              top: $scope.data.position.top,
              left: $scope.data.position.left
            };
            container.css(style);
            return $scope.instance.repaintEverything();
          };
          $scope.$watch('data.position', function(val, old_val) {
            if (val === old_val) {
              return;
            }
            return updateStyle();
          });
          return updateStyle();
        }
      ],
      link: function($scope, element, attrs) {}
    };
  }
]);

'use strict';
angular.module('angular-bpmn').factory('bpmnObjectFact', [
  'bpmnSettings', '$compile', '$rootScope', 'log', '$templateRequest', '$templateCache', function(bpmnSettings, $compile, $rootScope, log, $templateRequest, $templateCache) {
    var schemeObject;
    schemeObject = (function() {
      schemeObject.prototype.isDebug = true;

      schemeObject.prototype.parentScope = null;

      schemeObject.prototype.data = null;

      schemeObject.prototype.anchor = null;

      schemeObject.prototype.make = null;

      schemeObject.prototype.draggable = null;

      schemeObject.prototype.templateUrl = null;

      schemeObject.prototype.template = null;

      schemeObject.prototype.element = null;

      schemeObject.prototype.container = null;

      schemeObject.prototype.size = null;

      schemeObject.prototype.points = null;

      function schemeObject(data, parentScope) {
        var tpl;
        log.debug('object construct');
        this.parentScope = parentScope;
        this.settings = parentScope.settings;
        this.data = data;
        tpl = bpmnSettings.template(data.type.name);
        this.anchor = tpl.anchor;
        this.size = tpl.size;
        this.make = tpl.make;
        this.draggable = tpl.draggable;
        this.templateUrl = tpl.templateUrl || null;
        this.template = tpl.template || null;
        this.templateUpdate();
      }

      schemeObject.prototype.templateUpdate = function() {
        var appendToElement, childScope, template, templateUrl;
        childScope = $rootScope.$new();
        childScope.data = this.data;
        childScope.instance = this.parentScope.instance;
        childScope.object = this;
        appendToElement = (function(_this) {
          return function(element) {
            return _this.element.empty().append(element);
          };
        })(this);
        if ((this.templateUrl != null) && this.templateUrl !== '') {
          if (this.element == null) {
            this.element = $compile('<div bpmn-object class="' + this.data.type.name + ' draggable etc" ng-class="[data.status]"></div>')(childScope);
          }
          templateUrl = this.settings.theme.root_path + '/' + this.settings.engine.theme + '/' + this.templateUrl;
          template = $templateCache.get(templateUrl);
          if (template == null) {
            log.debug('template not found', templateUrl);
            this.elementPromise = $templateRequest(templateUrl);
            return this.elementPromise.then(function(result) {
              appendToElement($compile(result)(childScope));
              return $templateCache.put(templateUrl, result);
            });
          } else {
            return appendToElement($compile(template)(childScope));
          }
        } else {
          if (this.element == null) {
            return this.element = $compile(this.template)(childScope);
          }
        }
      };

      schemeObject.prototype.generateAnchor = function(options) {
        var points;
        if (!this.anchor || this.anchor.length === 0) {
          return;
        }
        if (!this.element) {
          log.debug('generateAnchor: @element is null', this);
          return;
        }
        points = [];
        angular.forEach(this.anchor, (function(_this) {
          return function(anchor) {
            var point;
            point = _this.parentScope.instance.addEndpoint(_this.element, {
              anchor: anchor,
              maxConnections: -1
            }, options);
            if (points.indexOf(point) === -1) {
              return points.push(point);
            }
          };
        })(this));
        return this.points = points;
      };

      schemeObject.prototype.appendTo = function(container, options) {
        if (!this.element || this.element === '') {
          log.debug('appendTo: @element is null', this);
          return;
        }
        this.container = container;
        container.append(this.element);
        if (this.size) {
          $(this.element).css({
            width: this.size.width,
            height: this.size.height
          });
        } else {
          log.error('@size is null, element:', this.element);
        }
        return this.generateAnchor(options);
      };

      schemeObject.prototype.select = function(tr) {};

      return schemeObject;

    })();
    return schemeObject;
  }
]);

'use strict';
var LEFT_MB, MIDDLE_MB, RIGHT_MB;

LEFT_MB = 1;

MIDDLE_MB = 2;

RIGHT_MB = 3;

angular.module('angular-bpmn').factory('bpmnScheme', [
  '$rootScope', 'log', 'bpmnUuid', '$compile', 'bpmnSettings', '$templateCache', '$templateRequest', '$q', '$timeout', 'bpmnObjectFact', function($rootScope, log, bpmnUuid, $compile, bpmnSettings, $templateCache, $templateRequest, $q, $timeout, bpmnObjectFact) {
    var bpmnScheme;
    bpmnScheme = (function() {
      bpmnScheme.prototype.isDebug = true;

      bpmnScheme.prototype.isStarted = false;

      bpmnScheme.prototype.id = null;

      bpmnScheme.prototype.scope = null;

      bpmnScheme.prototype.container = null;

      bpmnScheme.prototype.wrapper = null;

      bpmnScheme.prototype.cache = null;

      bpmnScheme.prototype.style_id = 'bpmn-style-theme';

      bpmnScheme.prototype.wrap_class = 'bpmn-wrapper';

      bpmnScheme.prototype.schemeWatch = null;

      function bpmnScheme(container, settings) {
        var wrapper;
        this.id = bpmnUuid.gen();
        this.container = container;
        wrapper = container.parent('.' + this.wrap_class);
        if (wrapper.length === 0) {
          container.wrap('<div class="' + this.wrap_class + '"></div>');
        }
        this.wrapper = container.parent('.' + this.wrap_class);
        preventSelection(document);
        this.scope = $rootScope.$new();
        this.scope.extScheme = {};
        this.scope.intScheme = {
          objects: {},
          connectors: []
        };
        this.scope.settings = {};
        this.scope.selected = [];
        this.scope.zoom = 1;
        this.setSettings(settings);
        this.wrapper.append('<div class="page-loader"><div class="spinner">loading...</div></div>');
      }

      bpmnScheme.prototype.setStatus = function() {
        if (this.scope.settings.engine.status === 'editor') {
          return this.container.addClass('editor');
        } else {
          return this.container.addClass('viewer');
        }
      };

      bpmnScheme.prototype.setScheme = function(scheme) {
        if (scheme == null) {
          scheme = this.scope.extScheme || {};
        }
        return this.scope.extScheme = scheme;
      };

      bpmnScheme.prototype.setSettings = function(settings) {
        if (settings == null) {
          settings = {};
        }
        return this.scope.settings = $.extend(true, bpmnSettings, angular.copy(settings));
      };

      bpmnScheme.prototype.loadStyle = function() {
        var file, themeStyle, theme_name;
        theme_name = this.scope.settings.engine.theme;
        file = this.scope.settings.theme.root_path + '/' + theme_name + '/style.css';
        themeStyle = $('link#' + this.style_id + '-' + theme_name);
        if (themeStyle.length === 0) {
          $("<link/>", {
            rel: "stylesheet",
            href: file,
            id: this.style_id + '-' + theme_name
          }).appendTo("head");
        } else {
          themeStyle.attr('href', file);
        }
        log.debug('load style file:', file);
        this.wrapper.removeClass();
        return this.wrapper.addClass(this.wrap_class + ' ' + theme_name);
      };

      bpmnScheme.prototype.cacheTemplates = function() {
        return angular.forEach(this.scope.settings.templates, (function(_this) {
          return function(type) {
            var template, templatePromise, templateUrl;
            if ((type.templateUrl == null) || type.templateUrl === '') {
              return;
            }
            templateUrl = _this.scope.settings.theme.root_path + '/' + _this.scope.settings.engine.theme + '/' + type.templateUrl;
            template = $templateCache.get(templateUrl);
            if (template == null) {
              templatePromise = $templateRequest(templateUrl);
              _this.cache.push(templatePromise);
              return templatePromise.then(function(result) {
                log.debug('load template file:', templateUrl);
                return $templateCache.put(templateUrl, result);
              });
            }
          };
        })(this));
      };

      bpmnScheme.prototype.makePackageObjects = function() {
        var promise;
        log.debug('make package objects');
        promise = [];
        angular.forEach(this.scope.extScheme.objects, (function(_this) {
          return function(object) {
            var obj;
            obj = new bpmnObjectFact(object, _this.scope);
            _this.scope.intScheme.objects[object.id] = obj;
            return promise.push(obj.elementPromise);
          };
        })(this));
        return $q.all(promise).then((function(_this) {
          return function() {
            angular.forEach(_this.scope.intScheme.objects, function(object) {
              object.appendTo(_this.container, _this.scope.settings.point);
              _this.scope.instance.off(object.element);
              return _this.scope.instance.on(object.element, 'click', function() {
                _this.scope.selected = [];
                _this.scope.$apply(_this.scope.selected.push(object.data.id));
                _this.deselectAll();
                return object.select(true);
              });
            });
            _this.instanceBatch();
            _this.connectPackageObjects();
            _this.isStarted = true;
            return _this.wrapper.find(".page-loader").fadeOut("slow");
          };
        })(this));
      };

      bpmnScheme.prototype.instanceBatch = function() {
        return this.scope.instance.batch((function(_this) {
          return function() {
            log.debug('instance batch');
            if (_this.scope.settings.engine.status === 'editor') {
              return _this.scope.instance.draggable(_this.container.find(".etc"), _this.scope.settings.draggable);
            }
          };
        })(this));
      };

      bpmnScheme.prototype.connectPackageObjects = function() {
        var ref;
        if (((ref = this.scope.extScheme) != null ? ref.connectors : void 0) == null) {
          return;
        }
        log.debug('connect package objects');
        return angular.forEach(this.scope.extScheme.connectors, (function(_this) {
          return function(connector) {
            var points, source_obj_points, target_obj_points;
            if ((!connector.start || !connector.end) || (!_this.scope.intScheme.objects[connector.start.object] || !_this.scope.intScheme.objects[connector.end.object]) || (!_this.scope.intScheme.objects[connector.start.object].points || !_this.scope.intScheme.objects[connector.end.object].points)) {
              return;
            }
            source_obj_points = {};
            target_obj_points = {};
            angular.forEach(_this.scope.intScheme.objects, function(object) {
              if (object.data.id === connector.start.object) {
                source_obj_points = object.points;
              }
              if (object.data.id === connector.end.object) {
                return target_obj_points = object.points;
              }
            });
            if (source_obj_points[connector.start.point] == null) {
              log.error('connect: source not found', _this);
              return;
            }
            if (target_obj_points[connector.end.point] == null) {
              log.error('connect: target not found', _this);
              return;
            }
            points = {
              sourceEndpoint: source_obj_points[connector.start.point],
              targetEndpoint: target_obj_points[connector.end.point]
            };
            if (connector.title && connector.title !== "") {
              points['overlays'] = [
                [
                  "Label", {
                    label: connector.title,
                    cssClass: "aLabel"
                  }, {
                    id: "myLabel"
                  }
                ]
              ];
            }
            return _this.scope.intScheme.connectors.push(_this.scope.instance.connect(points, _this.scope.settings.connector));
          };
        })(this));
      };

      bpmnScheme.prototype.addObject = function(object) {};

      bpmnScheme.prototype.removeObject = function(object) {};

      bpmnScheme.prototype.deselectAll = function() {
        return angular.forEach(this.scope.intScheme.objects, function(object) {
          return object.select(false);
        });
      };

      bpmnScheme.prototype.panning = function() {
        var delta, drag, template;
        template = $compile('<div class="panning-cross"> <svg> <g id="layer1" transform="translate(-291.18256,-337.29837)"> <path id="path3006" stroke-linejoin="miter" d="m331.14063,340.36763,0,29.99702" stroke="#000" stroke-linecap="butt" stroke-miterlimit="4" stroke-dasharray="none" stroke-width="2.01302433"/> <path id="path3008" stroke-linejoin="miter" d="m316.11461,355.29379,30.24144,0" stroke="#000" stroke-linecap="butt" stroke-miterlimit="4" stroke-dasharray="none" stroke-width="2"/> </g> </svg> <div class="zoom-info">({{zoom}})</div> </div>')(this.scope);
        this.container.append(template);
        $(template).css({
          position: 'absolute',
          top: -23,
          left: -45
        });
        drag = {
          x: 0,
          y: 0,
          state: false
        };
        delta = {
          x: 0,
          y: 0
        };
        this.wrapper.on('mousedown', function(e) {
          if ($(e.target).hasClass('ui-resizable-handle')) {
            return;
          }
          if (!drag.state && e.which === LEFT_MB) {
            drag.x = e.pageX;
            drag.y = e.pageY;
            return drag.state = true;
          }
        });
        this.wrapper.on('mousemove', (function(_this) {
          return function(e) {
            var cur_offset;
            if (drag.state) {
              delta.x = e.pageX - drag.x;
              delta.y = e.pageY - drag.y;
              cur_offset = _this.container.offset();
              _this.container.offset({
                left: cur_offset.left + delta.x,
                top: cur_offset.top + delta.y
              });
              drag.x = e.pageX;
              return drag.y = e.pageY;
            }
          };
        })(this));
        this.wrapper.on('mouseup', function(e) {
          if (drag.state) {
            return drag.state = false;
          }
        });
        this.wrapper.on('contextmenu', function(e) {
          return false;
        });
        this.wrapper.on('mouseleave', function(e) {
          if (drag.state) {
            return drag.state = false;
          }
        });
        return this.wrapper.on('mousewheel', (function(_this) {
          return function(e) {
            e.preventDefault();
            _this.scope.zoom += 0.1 * e.deltaY;
            _this.scope.zoom = parseFloat(_this.scope.zoom.toFixed(1));
            if (_this.scope.zoom < 0.1) {
              _this.scope.zoom = 0.1;
            } else if (_this.scope.zoom > 2) {
              _this.scope.zoom = 2;
            }
            _this.scope.instance.setZoom(_this.scope.zoom);
            _this.scope.instance.repaintEverything(_this.scope.zoom);
            $timeout(function() {
              return _this.scope.$apply(_this.scope.zoom);
            }, 0);
            return _this.container.css({
              '-webkit-transform': _this.scope.zoom,
              '-moz-transform': 'scale(' + _this.scope.zoom + ')',
              '-ms-transform': 'scale(' + _this.scope.zoom + ')',
              '-o-transform': 'scale(' + _this.scope.zoom + ')',
              'transform': 'scale(' + _this.scope.zoom + ')'
            });
          };
        })(this));
      };

      bpmnScheme.prototype.start = function() {
        var ref;
        log.debug('start');
        this.panning();
        this.loadStyle();
        this.scope.instance = jsPlumb.getInstance($.extend(true, this.scope.settings.instance, {
          Container: this.container
        }));
        this.cache = [];
        this.cacheTemplates();
        this.container.addClass('bpmn');
        this.setStatus();
        if (this.schemeWatch) {
          this.schemeWatch();
        }
        this.schemeWatch = this.scope.$watch('extScheme', (function(_this) {
          return function(val, old_val) {
            if (val === old_val) {
              return;
            }
            return _this.restart();
          };
        })(this));
        $q.all(this.cache).then((function(_this) {
          return function() {
            return _this.makePackageObjects();
          };
        })(this));
        if (((ref = this.scope.settings.engine.container) != null ? ref.resizable : void 0) != null) {
          this.wrapper.resizable({
            minHeight: 200,
            minWidth: 400,
            grid: 10,
            handles: 's',
            start: function() {},
            resize: function() {}
          });
        }
        return this.scope.$on('$routeChangeSuccess', (function(_this) {
          return function() {
            return _this.destroy();
          };
        })(this));
      };

      bpmnScheme.prototype.destroy = function() {
        log.debug('destroy');
        this.wrapper.find(".page-loader").fadeIn("slow");
        if (this.schemeWatch) {
          this.schemeWatch();
        }
        this.wrapper.off('mousedown');
        this.wrapper.off('mousemove');
        this.wrapper.off('mouseup');
        this.wrapper.off('contextmenu');
        return this.wrapper.off('mousewheel');
      };

      bpmnScheme.prototype.restart = function() {
        log.debug('restart');
        if (this.isStarted != null) {
          this.destry();
        }
        return this.start();
      };

      return bpmnScheme;

    })();
    return bpmnScheme;
  }
]);

'use strict';
angular.module('angular-bpmn').service('bpmnSettings', function() {
  var connector, connectorSettings, connectorStyle, draggableSettings, engineSettings, instanceSettings, pointSettings, sourceSettings, targetSettings, template, templates, themeSettings;
  themeSettings = {
    root_path: '/themes',
    list: ['default', 'minimal']
  };
  engineSettings = {
    theme: 'minimal',
    status: 'viewer',
    container: {
      resizable: true
    }
  };
  instanceSettings = {
    DragOptions: {
      cursor: 'pointer',
      zIndex: 20
    },
    ConnectionOverlays: [
      [
        "Arrow", {
          location: 1,
          id: "arrow",
          width: 12,
          length: 12,
          foldback: 0.8
        }
      ]
    ],
    Container: 'container'
  };
  draggableSettings = {
    filter: '.ui-resizable-handle',
    grid: [5, 5],
    drag: function(event, ui) {}
  };
  connectorStyle = {
    strokeStyle: "#000000",
    lineWidth: 2,
    outlineWidth: 4
  };
  pointSettings = {
    isSource: true,
    isTarget: true,
    endpoint: [
      "Dot", {
        radius: 1
      }
    ],
    maxConnections: -1,
    paintStyle: {
      outlineWidth: 1
    },
    hoverPaintStyle: {},
    connectorStyle: connectorStyle
  };
  connector = [
    "Flowchart", {
      cornerRadius: 0,
      midpoint: 0.5,
      minStubLength: 10,
      stub: [30, 30],
      gap: 0
    }
  ];
  connectorSettings = {
    connector: connector,
    isSource: true,
    isTarget: true
  };
  sourceSettings = {
    filter: ".ep",
    anchor: [],
    connector: connector,
    connectorStyle: connectorStyle,
    endpoint: [
      "Dot", {
        radius: 1
      }
    ],
    maxConnections: -1,
    onMaxConnections: function(info, e) {
      return alert("Maximum connections (" + info.maxConnections + ") reached");
    }
  };
  targetSettings = {
    anchor: [],
    endpoint: [
      "Dot", {
        radius: 1
      }
    ],
    allowLoopback: false,
    uniqueEndpoint: true,
    isTarget: true,
    maxConnections: -1
  };
  templates = {
    event: {
      templateUrl: 'event.svg',
      anchor: [[0.52, 0.05, 0, -1, 0, 2], [1, 0.52, 1, 0, -2, 0], [0.52, 1, 0, 1, 0, -2], [0.1, 0.52, -1, 0, 2, 0]],
      make: ['source', 'target'],
      draggable: true,
      size: {
        width: 50,
        height: 50
      }
    },
    task: {
      templateUrl: 'task.svg',
      anchor: [[0.25, 0.04, 0, -1, 0, 2], [0.5, 0.04, 0, -1, 0, 2], [0.75, 0.04, 0, -1, 0, 2], [0.97, 0.25, 1, 0, -2, 0], [0.97, 0.5, 1, 0, -2, 0], [0.97, 0.75, 1, 0, -2, 0], [0.75, 0.97, 0, 1, 0, -2], [0.5, 0.97, 0, 1, 0, -2], [0.25, 0.97, 0, 1, 0, -2], [0.04, 0.75, -1, 0, 2, 0], [0.04, 0.5, -1, 0, 2, 0], [0.04, 0.25, -1, 0, 2, 0]],
      make: ['source', 'target'],
      draggable: true,
      size: {
        width: 112,
        height: 92
      }
    },
    gateway: {
      templateUrl: 'gateway.svg',
      anchor: [[0.5, 0, 0, -1, 0, 2], [1, 0.5, 1, 0, -2, 0], [0.5, 1, 0, 1, 0, -2], [0, 0.5, -1, 0, 2, 0]],
      make: ['source', 'target'],
      draggable: true,
      size: {
        width: 52,
        height: 52
      }
    },
    group: {
      template: '<div bpmn-object class="group etc draggable" ng-style="{width: data.width, height: data.height}" ng-class="{ dashed : data.style == \'dashed\', solid : data.style == \'solid\' }"> <div class="title">{{data.title}}</div> </div>',
      anchor: [],
      make: [],
      draggable: true
    },
    swimlane: {
      template: '<div bpmn-object class="swimlane etc draggable" ng-style="{ width: data.width }"></div>',
      anchor: [],
      make: [],
      draggable: true
    },
    'swimlane-row': {
      template: '<div bpmn-object class="swimlane-row" ng-style="{width: \'100%\', height: data.height }"> <div class="header"><div class="text">{{data.title}}</div></div> </div>',
      anchor: [],
      make: [],
      draggable: false
    },
    poster: {
      template: '<div bpmn-object class="poster draggable" ng-class="{ \'etc\' : data.draggable }"><img ng-src="{{data.url}}"></div>',
      anchor: [],
      make: [],
      draggable: true
    },
    "default": {
      template: '<div bpmn-object class="dummy etc draggable">shape not found</div>',
      anchor: [[0.5, 0, 0, -1, 0, 2], [1, 0.5, 1, 0, -2, 0], [0.5, 1, 0, 1, 0, -2], [0, 0.5, -1, 0, 2, 0]],
      make: ['source', 'target'],
      draggable: true,
      size: {
        width: 40,
        height: 40
      }
    }
  };
  template = function(id) {
    if (templates[id] != null) {
      return templates[id];
    } else {
      return templates['default'];
    }
  };
  return {
    theme: themeSettings,
    engine: engineSettings,
    instance: instanceSettings,
    draggable: draggableSettings,
    point: pointSettings,
    connector: connectorSettings,
    source: sourceSettings,
    target: targetSettings,
    template: template,
    templates: templates
  };
});

'use strict';
angular.module('angular-bpmn').factory('bpmnUuid', function() {
  var uuid;
  uuid = (function() {
    function uuid() {}

    uuid.generator = function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var d, q, r;
        d = new Date().getTime();
        r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        q = null;
        if (c === 'x') {
          q = r;
        } else {
          q = r & 0x3 | 0x8;
        }
        return q.toString(16);
      });
    };

    uuid.gen = function() {
      return this.generator();
    };

    return uuid;

  })();
  return uuid;
});
