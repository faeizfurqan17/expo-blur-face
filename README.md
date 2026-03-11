# expo-blur-face

On-device face detection and blurring for React Native / Expo.

Uses **Vision** (iOS) and **ML Kit** (Android) for face detection, with native blur applied directly to detected face regions. No server calls, no FFmpeg — everything runs locally on-device.

## Features

- **On-device** — no privacy concerns, works offline
- **Zero config** — no config plugin required
- **Fast** — hardware-accelerated face detection
- **Lightweight** — iOS uses built-in frameworks, Android adds only ML Kit (~50KB)
- **Customizable** — control blur intensity, padding, and output format

## Installation

```bash
npm install expo-blur-face
```

No config plugin needed. Works with Expo SDK 51+.

## Usage

```typescript
import { blurFaces } from 'expo-blur-face';

const result = await blurFaces(imageUri, {
  blurIntensity: 30,  // 1-100 (default: 30)
  padding: 10,        // extra px around face (default: 10)
  output: 'jpg',      // 'jpg' or 'png' (default: 'jpg')
  quality: 0.9,       // JPEG quality 0.0-1.0 (default: 0.9)
});

console.log(result.uri);           // file:///path/to/blurred.jpg
console.log(result.facesDetected); // number of faces found
```

## API

### `blurFaces(fileUrl, options?)`

Detects all faces in an image and applies a Gaussian blur to each face region.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `fileUrl` | `string` | File URI of the image to process |
| `options` | `BlurFacesOptions` | Optional configuration |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blurIntensity` | `number` | `30` | Blur strength from 1 (subtle) to 100 (heavy) |
| `padding` | `number` | `10` | Extra pixels to expand beyond detected face bounding box |
| `output` | `'jpg' \| 'png'` | `'jpg'` | Output image format |
| `quality` | `number` | `0.9` | JPEG compression quality (0.0-1.0), ignored for PNG |

**Returns:** `Promise<BlurFacesResult>`

| Field | Type | Description |
|-------|------|-------------|
| `uri` | `string` | File URI of the output image |
| `facesDetected` | `number` | Number of faces detected and blurred |

If no faces are detected, the original URI is returned with `facesDetected: 0`.

## How It Works

**iOS:** Uses Apple's Vision framework (`VNDetectFaceRectanglesRequest`) for detection and Core Image (`CIGaussianBlur` + `CISourceAtopCompositing`) for applying blur to face regions.

**Android:** Uses Google ML Kit Face Detection for bounding boxes and a StackBlur algorithm applied directly to the bitmap for each face region.

## Requirements

- Expo SDK 51+
- iOS 15.1+
- Android SDK 24+

## License

MIT
