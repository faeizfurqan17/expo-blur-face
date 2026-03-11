import ExpoBlurFaceModule from './ExpoBlurFaceModule';
export * from './ExpoBlurFace.types';
/**
 * Detect faces in an image and blur them on-device.
 *
 * Uses Vision framework on iOS and ML Kit on Android.
 * No server calls — everything runs locally.
 *
 * @param fileUrl - File URI of the image to process
 * @param options - Blur options (intensity, padding, output format)
 * @returns Promise resolving to `{ uri, facesDetected }`
 *
 * @example
 * ```ts
 * import { blurFaces } from 'expo-blur-face';
 *
 * const result = await blurFaces(imageUri, {
 *   blurIntensity: 20,
 *   padding: 10,
 *   output: 'jpg',
 * });
 *
 * console.log(result.uri);           // file:///...blurred.jpg
 * console.log(result.facesDetected); // 3
 * ```
 */
export async function blurFaces(fileUrl, options) {
    if (!fileUrl) {
        throw new Error('Image URI is empty, please provide a value.');
    }
    const opts = {
        blurIntensity: Math.max(1, Math.min(100, options?.blurIntensity ?? 30)),
        padding: Math.max(0, options?.padding ?? 10),
        output: options?.output ?? 'jpg',
        quality: Math.max(0, Math.min(1, options?.quality ?? 0.9)),
    };
    return ExpoBlurFaceModule.blurFaces(fileUrl, opts);
}
//# sourceMappingURL=index.js.map