AFRAME.registerSystem('cached-obj-model', {
  init: function () {
    this.promises = new Map();
    this.meshes = new Map();
  },
  seen: function (obj, mtl) {
    return !!(this.promises.get(obj + mtl) || this.meshes.get(obj + mtl));
  },
  get: function (obj, mtl) {
    var mesh = this.meshes.get(obj + mtl);
    if (mesh) {
      return Promise.resolve(mesh);
    }
    else {
      return this.promises.get(obj + mtl);
    }
  },
  set: function (obj, mtl, promise) {
    this.promises.set(obj + mtl, promise);
    promise.then(function (mesh) {
      this.meshes.set(obj + mtl, mesh);
    }.bind(this));
  }
});

AFRAME.registerComponent('cached-obj-model', {
  dependencies: ['obj-model'],

  schema: {
    mtl: { type: 'src' },
    obj: { type: 'src' }
  },

  init: function () {
    if (this.system.seen(this.data.obj, this.data.mtl)) {
      this.system.get(this.data.obj, this.data.mtl).then(function (mesh) {
        this.el.setObject3D('mesh', mesh.clone());
        // TODO We should actually emit a 'object3dset' event here but n-mesh-collider would stop working
        this.el.emit('model-loaded');
      }.bind(this));
    }
    else {
      this.system.set(this.data.obj, this.data.mtl, new Promise(function (resolve) {
        this.el.addEventListener('model-loaded', function () {
          resolve(this.el.object3DMap.mesh);
        }.bind(this));
      }.bind(this)));
      this.el.setAttribute('obj-model', {
        obj: 'url(' + this.data.obj + ')',
        mtl: this.data.mtl ? ('url(' + this.data.mtl + ')') : '',
      });
    }
  }
});

var extendDeep = AFRAME.utils.extendDeep;
var meshMixin = AFRAME.primitives.getMeshMixin();
AFRAME.registerPrimitive('cached-obj-model', extendDeep({}, meshMixin, {
  mappings: {
    src: 'cached-obj-model.obj',
    mtl: 'cached-obj-model.mtl'
  }
}));