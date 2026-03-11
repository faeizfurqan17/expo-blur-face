import ExpoModulesCore
import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

public class ExpoBlurFaceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlurFace")

    AsyncFunction("blurFaces") { (fileUrl: String, options: [String: Any]) -> [String: Any] in
      let blurIntensity = options["blurIntensity"] as? Int ?? 30
      let padding = options["padding"] as? Int ?? 10
      let output = options["output"] as? String ?? "jpg"
      let quality = options["quality"] as? Double ?? 0.9

      guard let url = URL(string: fileUrl) else {
        throw BlurFaceError.invalidImage("Invalid file URL: \(fileUrl)")
      }

      let resolvedUrl = self.resolveFileURL(url)

      guard let uiImage = UIImage(contentsOfFile: resolvedUrl.path) else {
        throw BlurFaceError.invalidImage("Could not load image from: \(resolvedUrl.path)")
      }

      let orientedImage = self.fixOrientation(uiImage)

      guard let ciImage = CIImage(image: orientedImage) else {
        throw BlurFaceError.invalidImage("Could not create CIImage")
      }

      let faceRects = self.detectFaces(in: ciImage)

      if faceRects.isEmpty {
        return [
          "uri": fileUrl,
          "facesDetected": 0
        ]
      }

      let blurredImage = self.applyBlur(
        to: ciImage,
        faceRects: faceRects,
        intensity: blurIntensity,
        padding: padding
      )

      let context = CIContext()
      guard let cgImage = context.createCGImage(blurredImage, from: ciImage.extent) else {
        throw BlurFaceError.processingFailed("Could not render blurred image")
      }

      let resultImage = UIImage(cgImage: cgImage)
      let outputUrl = try self.saveImage(resultImage, format: output, quality: quality)

      return [
        "uri": outputUrl.absoluteString,
        "facesDetected": faceRects.count
      ]
    }
  }

  // MARK: - Face Detection
  // Uses CIDetector (Core Image) instead of Vision/VNDetectFaceRectanglesRequest.
  // CIDetector does not rely on CoreML inference context, making it reliably
  // available on all devices and simulators without ML model initialization issues.

  private func detectFaces(in ciImage: CIImage) -> [CGRect] {
    let options: [String: Any] = [
      CIDetectorAccuracy: CIDetectorAccuracyHigh
    ]
    guard let detector = CIDetector(ofType: CIDetectorTypeFace, context: nil, options: options) else {
      return []
    }

    let features = detector.features(in: ciImage)

    return features.compactMap { feature -> CGRect? in
      guard let face = feature as? CIFaceFeature else { return nil }
      return face.bounds
    }
  }

  // MARK: - Blur Application

  private func applyBlur(to image: CIImage, faceRects: [CGRect], intensity: Int, padding: Int) -> CIImage {
    var result = image
    let radius = Double(intensity) * 0.5

    for rect in faceRects {
      let paddedRect = rect.insetBy(dx: CGFloat(-padding), dy: CGFloat(-padding))
        .intersection(image.extent)

      guard let blurFilter = CIFilter(name: "CIGaussianBlur") else { continue }
      blurFilter.setValue(result, forKey: kCIInputImageKey)
      blurFilter.setValue(radius, forKey: kCIInputRadiusKey)

      guard let blurredFull = blurFilter.outputImage else { continue }

      let croppedBlur = blurredFull.cropped(to: paddedRect)

      guard let compositeFilter = CIFilter(name: "CISourceAtopCompositing") else { continue }
      compositeFilter.setValue(croppedBlur, forKey: kCIInputImageKey)
      compositeFilter.setValue(result, forKey: kCIInputBackgroundImageKey)

      guard let composited = compositeFilter.outputImage else { continue }
      result = composited
    }

    return result
  }

  // MARK: - Image Orientation

  private func fixOrientation(_ image: UIImage) -> UIImage {
    if image.imageOrientation == .up {
      return image
    }

    UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
    image.draw(in: CGRect(origin: .zero, size: image.size))
    let normalizedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return normalizedImage ?? image
  }

  // MARK: - File Handling

  private func resolveFileURL(_ url: URL) -> URL {
    if url.scheme == "file" || url.scheme == nil {
      return url
    }
    return url
  }

  private func saveImage(_ image: UIImage, format: String, quality: Double) throws -> URL {
    let tempDir = FileManager.default.temporaryDirectory
    let ext = format == "png" ? "png" : "jpg"
    let filename = ProcessInfo.processInfo.globallyUniqueString + "_blurred.\(ext)"
    let outputUrl = tempDir.appendingPathComponent(filename)

    let data: Data?
    if format == "png" {
      data = image.pngData()
    } else {
      data = image.jpegData(compressionQuality: quality)
    }

    guard let imageData = data else {
      throw BlurFaceError.processingFailed("Could not encode image to \(format)")
    }

    try imageData.write(to: outputUrl)
    return outputUrl
  }
}

// MARK: - Errors

enum BlurFaceError: Error, LocalizedError {
  case invalidImage(String)
  case processingFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidImage(let message): return message
    case .processingFailed(let message): return message
    }
  }
}
