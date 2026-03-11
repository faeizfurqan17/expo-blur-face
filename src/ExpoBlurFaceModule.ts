import { NativeModule, requireNativeModule } from 'expo';

import { BlurFacesResult } from './ExpoBlurFace.types';

declare class ExpoBlurFaceModule extends NativeModule {
  blurFaces(
    fileUrl: string,
    options: {
      blurIntensity: number;
      padding: number;
      output: string;
      quality: number;
    },
  ): Promise<BlurFacesResult>;
}

// Lazy singleton — defer requireNativeModule until first use so that Fast
// Refresh (which re-evaluates the module graph) doesn't throw before the
// native side is ready.
let _module: ExpoBlurFaceModule | null = null;

function getNativeModule(): ExpoBlurFaceModule {
  if (!_module) {
    _module = requireNativeModule<ExpoBlurFaceModule>('ExpoBlurFace');
  }
  return _module;
}

export default new Proxy({} as ExpoBlurFaceModule, {
  get(_target, prop) {
    return (getNativeModule() as any)[prop];
  },
});
