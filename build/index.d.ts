import type { BlurFacesOptions, BlurFacesResult } from './ExpoBlurFace.types';
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
export declare function blurFaces(fileUrl: string, options?: BlurFacesOptions): Promise<BlurFacesResult>;
//# sourceMappingURL=index.d.ts.map