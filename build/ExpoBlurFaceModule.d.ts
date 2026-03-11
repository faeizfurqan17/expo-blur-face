import { NativeModule } from 'expo';
import { BlurFacesResult } from './ExpoBlurFace.types';
declare class ExpoBlurFaceModule extends NativeModule {
    blurFaces(fileUrl: string, options: {
        blurIntensity: number;
        padding: number;
        output: string;
        quality: number;
    }): Promise<BlurFacesResult>;
}
declare const _default: ExpoBlurFaceModule;
export default _default;
//# sourceMappingURL=ExpoBlurFaceModule.d.ts.map