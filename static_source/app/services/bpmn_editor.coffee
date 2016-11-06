
'use strict'

angular
.module('angular-bpmn')
.factory 'bpmnEditor', ['log', 'bpmnUuid', '$compile', 'bpmnObjectFact', '$q'
  (log, bpmnUuid, $compile, bpmnObjectFact, $q) ->
    class bpmnEditor
      wrapper: null
      container: null
      scope: null
      pallet: null
      mouseover: null

      constructor: (container, settings)->

      initEditor: ()->
        if !@pallet
          @wrapper.append($compile('<div class="palette-entries popup" bpmn-editor-palette="settings.editorPallet" settings="settings"></div>')(@scope))
          @pallet = @wrapper.find('.palette-entries')
        @droppableInit()
        @keyboardBindings()

        @wrapper.on 'mousedown', ()=>
          @deselectAll()

      droppableInit: ()->
        @wrapper.droppable({
          drop: (event, ui)=>
            offset = @wrapper.offset()
            position =
              left: (ui.offset.left - offset.left - @container.position().left) / @scope.zoom
              top: (ui.offset.top - offset.top - @container.position().top) / @scope.zoom

            parent = @selectElementByPoint(position.top, position.left)[0]
            log.debug parent
            if parent
              position =
                left: $(parent.element).offset().left  - position.left
                top: $(parent.element).offset().top  - position.top

              log.debug position

            # type update
            #----------------
            type = $(ui.draggable).attr('entry-type')
            data_group = $(ui.draggable).parent().attr('data-group')
            if !type || type == ''
              return

            id = bpmnUuid.gen()
            objects = []
            if data_group == 'swimlane'
              objects.push($.extend(true, angular.copy(@scope.settings.baseObject), {
                id: id
                type:
                  name: 'swimlane'
                draggable: false
                position: position
              }))
              objects.push($.extend(true, angular.copy(@scope.settings.baseObject), {
                id: bpmnUuid.gen()
                parent: id
                type:
                  name: 'swimlane-row'
                draggable: false
              }))
            else
              objects.push($.extend(true, angular.copy(@scope.settings.baseObject), {
                id: id
                type: JSON.parse(type)
                parent: parent?.data?.id || ''
                draggable: true
                position: position
              }))

            @addObjects(objects)
        })

      addObjects: (objects)->
        if !objects || objects == ''
          return

        promise = []
        newObjects = {}
        angular.forEach objects, (object)=>
          obj = new bpmnObjectFact(object, @scope)
          if !@scope.intScheme.objects[object.id]
            @scope.intScheme.objects[object.id] = obj
            newObjects[object.id] = obj
          promise.push(obj.elementPromise)

        # Ждём когда прогрузятся все шаблоны
        $q.all(promise).then ()=>
          # проходим по массиву ранее созданных объектов,
          # и добавляем в дом
          angular.forEach newObjects, (object)=>
            # добавляем объект в контейнер
            object.appendTo(@container, @scope.settings.point)

      removeObject: (scope)=>
        if !scope || !scope.selected
          return

        #TODO first remove child objects
        angular.forEach scope.selected, (id)=>
          index = 0
          for key, object of scope.intScheme.objects
            if object.data.id == id
              object.remove()
              delete scope.intScheme.objects[key]
              break
            index++

        scope.selected = []

        @serialise(scope)

      keyboardBindings: ()->
        if !@scope.settings.keyboard
          return

        @wrapper.on 'mouseover', ()=>
          @mouseover = true

        @wrapper.on 'mouseleave', ()=>
          @mouseover = false

        angular.forEach @scope.settings.keyboard, (button, key_id)=>
          log.debug 'bind key:', button.name
          fn = this[button.callback] || window[button.callback]
          if typeof fn != 'function'
            return
          key key_id, (event, handler)=>
            if @mouseover
              event.preventDefault()
              fn.apply(null, [@scope])

      selectElementInAabb: (t, l, w, h)->
        @scope.selected = []
        angular.forEach @scope.intScheme.objects, (object)->

          itemOffset = object.elementOffset()
          if itemOffset.top >= t && itemOffset.left >= l &&
              itemOffset.right < l + w && itemOffset.bottom < t + h

            @scope.selected.push(object.data.id)
            object.select(true)
            object.group('select')

          else
            object.select(false)

        @scope.$apply()

      selectElementOutPoint: (t, l, w, h)->
        @scope.selected = []
        for key, object of @scope.intScheme.objects
          itemOffset = object.elementOffset()
          if itemOffset.top <= t && itemOffset.left <= l &&
              itemOffset.right >= l + w && itemOffset.bottom >= t + h
            @scope.selected.push(object.data.id)
            break

      selectElementByPoint: (t, l)->
        @scope.selected = []
        log.debug 'check position:',t, l
        for key, object of @scope.intScheme.objects
          if !object.canAParent
            continue

          offset = @wrapper.offset()
          itemOffset = object.elementOffset()
          log.debug 'check:',object.data.type.name
          if itemOffset.top - offset.top <= t && itemOffset.left - offset.left <= l &&
              itemOffset.right - offset.left >= l && itemOffset.bottom - offset.top >= t
            log.debug '===>',object.data.type.name
            log.debug '===>',itemOffset.top, itemOffset.left, itemOffset.right, itemOffset.bottom
            @scope.selected.push(object)
          else
            log.debug 'no:',itemOffset.top, itemOffset.left, itemOffset.right, itemOffset.bottom

        @scope.selected

      serialise: (scope)->
        objects = []
        angular.forEach scope.intScheme.objects, (obj)->

          objects.push({
            id: obj.data.id
            type: obj.data.type
            position: obj.position
            status: ''
            error: ''
            title: obj.data.title
            description: obj.data.description
          })

        @scope.$apply(
          @scope.extScheme.objects = objects
        )

      getScheme: ()->
        @serialise(@scope.intScheme.objects)
        @scope.extScheme

    bpmnEditor
]