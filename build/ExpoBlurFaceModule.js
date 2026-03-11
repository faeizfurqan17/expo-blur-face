import { requireNativeModule } from 'expo';
// Lazy singleton — defer requireNativeModule until first use so that Fast
// Refresh (which re-evaluates the module graph) doesn't throw before the
// native side is ready.
let _module = null;
function getNativeModule() {
    if (!_module) {
        _module = requireNativeModule('ExpoBlurFace');
    }
    return _module;
}
export default new Proxy({}, {
    get(_target, prop) {
        return getNativeModule()[prop];
    },
});
//# sourceMappingURL=ExpoBlurFaceModule.js.map