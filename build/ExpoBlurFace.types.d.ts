/**
 * Output image format.
 */
export type ImageOutputType = 'jpg' | 'png';
/**
 * Options for face blurring.
 */
export interface BlurFacesOptions {
    /**
     * Blur intensity from 1 (subtle) to 100 (heavy).
     * Default: 30
     */
    blurIntensity?: number;
    /**
     * Output image format.
     * Default: 'jpg'
     */
    output?: ImageOutputType;
    /**
     * Extra padding in pixels to expand beyond the detected face bounding box.
     * Default: 10
     */
    padding?: number;
    /**
     * JPEG compression quality (0.0 - 1.0). Ignored when output is 'png'.
     * Default: 0.9
     */
    quality?: number;
}
/**
 * Result of the face blurring operation.
 */
export interface BlurFacesResult {
    /** File URI of the output image */
    uri: string;
    /** Number of faces detected and blurred */
    facesDetected: number;
}
//# sourceMappingURL=ExpoBlurFace.types.d.ts.map