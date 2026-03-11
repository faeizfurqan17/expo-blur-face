# expo-blur-face

[![npm version](https://img.shields.io/npm/v/expo-blur-face.svg)](https://www.npmjs.com/package/expo-blur-face)
[![npm downloads](https://img.shields.io/npm/dm/expo-blur-face.svg)](https://www.npmjs.com/package/expo-blur-face)
[![license](https://img.shields.io/npm/l/expo-blur-face.svg)](./LICENSE)
[![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/faeizfurqan17/expo-blur-face)

On-device face detection and blurring for React Native / Expo.

Uses **Vision** on iOS and **ML Kit** on Android — no server calls, no FFmpeg, no permissions required. Just install and blur.

---

## Features

- **On-device** — 100% private, works fully offline
- **Zero config** — no config plugin, no `npx expo prebuild` changes required
- **Fast** — hardware-accelerated detection via native frameworks
- **Lightweight** — iOS uses built-in Vision + Core Image; Android adds only ML Kit
- **Customizable** — control blur intensity, padding, and output format (JPG / PNG)
- **Multi-face** — detects and blurs every face in the image simultaneously

---

## Installation

```bash
npm install expo-blur-face
# or
yarn add expo-blur-face
```

No config plugin needed. Works with bare and managed Expo workflows out of the box.

---

## Usage

```typescript
import { blurFaces } from 'expo-blur-face';

const result = await blurFaces(imageUri, {
  blurIntensity: 30,  // 1-100 (default: 30)
  padding: 10,        // extra px around face bounds (default: 10)
  output: 'jpg',      // 'jpg' | 'png' (default: 'jpg')
  quality: 0.9,       // JPEG quality 0.0-1.0 (default: 0.9)
});

console.log(result.uri);           // file:///path/to/blurred.jpg
console.log(result.facesDetected); // number of faces found and blurred
```

If no faces are detected, `result.uri` is the **original** URI and `facesDetected` is `0` — no copy is made.

### With image picker

```typescript
import * as ImagePicker from 'expo-image-picker';
import { blurFaces } from 'expo-blur-face';

async function pickAndBlur() {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (picked.canceled) return;

  const result = await blurFaces(picked.assets[0].uri, {
    blurIntensity: 40,
    padding: 15,
  });

  console.log(`Blurred ${result.facesDetected} face(s) -> ${result.uri}`);
}
```

---

## API

### `blurFaces(fileUrl, options?)`

Detects all faces in an image and applies a blur to each detected face region.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileUrl` | `string` | Yes | `file://` URI of the image to process |
| `options` | `BlurFacesOptions` | No | Blur configuration (see below) |

**`BlurFacesOptions`**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blurIntensity` | `number` | `30` | Blur strength — `1` (subtle) to `100` (heavy) |
| `padding` | `number` | `10` | Pixels to expand beyond the detected face bounding box |
| `output` | `'jpg' \| 'png'` | `'jpg'` | Output image format |
| `quality` | `number` | `0.9` | JPEG compression quality `0.0`-`1.0`, ignored for PNG |

**Returns: `Promise<BlurFacesResult>`**

| Field | Type | Description |
|-------|------|-------------|
| `uri` | `string` | `file://` URI of the output image |
| `facesDetected` | `number` | Number of faces detected and blurred |

---

## How It Works

**iOS:** `VNDetectFaceRectanglesRequest` (Vision framework) finds face bounding boxes, then `CIGaussianBlur` + `CISourceAtopCompositing` (Core Image) composites blurred regions back onto the original. Output is written to `NSTemporaryDirectory()` with EXIF preserved.

**Android:** Google ML Kit Face Detection returns face bounding boxes, then a StackBlur algorithm is applied directly to each face region on the `Bitmap`. Output is written to `context.cacheDir` with EXIF preserved.

---

## Requirements

| | Minimum |
|---|---|
| Expo SDK | 51+ |
| iOS | 15.1+ |
| Android | API 24 (Android 7.0)+ |
| React Native | 0.73+ |

---

## Changelog

### 1.0.0 — 2026-03-12
- Initial release
- On-device face blurring via Vision (iOS) and ML Kit (Android)
- Configurable blur intensity, padding, output format
- EXIF data preservation
- Multi-face support

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
git clone https://github.com/faeizfurqan17/expo-blur-face.git
cd expo-blur-face
npm install
cd example && npm install
npx expo run:ios      # or run:android
```

---

## License

MIT © [Faeiz Furqan](https://github.com/faeizfurqan17)
