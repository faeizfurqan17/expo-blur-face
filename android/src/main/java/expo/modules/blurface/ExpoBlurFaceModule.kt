package expo.modules.blurface

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.android.gms.tasks.Tasks
import java.io.File
import java.io.FileOutputStream

class ExpoBlurFaceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlurFace")

    AsyncFunction("blurFaces") { fileUrl: String, options: Map<String, Any?> ->
      val blurIntensity = (options["blurIntensity"] as? Number)?.toInt() ?: 30
      val padding = (options["padding"] as? Number)?.toInt() ?: 10
      val output = options["output"] as? String ?: "jpg"
      val quality = (options["quality"] as? Number)?.toDouble() ?: 0.9

      val context = appContext.reactContext
        ?: throw Exception("React context is not available")

      val uri = Uri.parse(fileUrl)
      val imagePath = getPathFromUri(uri)
        ?: throw Exception("Could not resolve file path from: $fileUrl")

      // Load and orient bitmap
      val originalBitmap = BitmapFactory.decodeFile(imagePath)
        ?: throw Exception("Could not decode image from: $imagePath")

      val orientedBitmap = correctOrientation(originalBitmap, imagePath)

      // Detect faces with ML Kit
      val inputImage = InputImage.fromBitmap(orientedBitmap, 0)
      val detector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
          .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
          .build()
      )

      // Tasks.await() is safe here — Expo's AsyncFunction runs on a background thread
      val faces = Tasks.await(detector.process(inputImage))

      // No faces → return original
      if (faces.isEmpty()) {
        detector.close()
        return@AsyncFunction mapOf(
          "uri" to fileUrl,
          "facesDetected" to 0
        )
      }

      // Create mutable copy to draw on
      val mutableBitmap = orientedBitmap.copy(Bitmap.Config.ARGB_8888, true)
      val canvas = Canvas(mutableBitmap)

      for (face in faces) {
        val bounds = face.boundingBox

        // Expand by padding
        val paddedRect = Rect(
          (bounds.left - padding).coerceAtLeast(0),
          (bounds.top - padding).coerceAtLeast(0),
          (bounds.right + padding).coerceAtMost(mutableBitmap.width),
          (bounds.bottom + padding).coerceAtMost(mutableBitmap.height)
        )

        val width = paddedRect.width()
        val height = paddedRect.height()
        if (width <= 0 || height <= 0) continue

        // Extract face region
        val faceRegion = Bitmap.createBitmap(
          orientedBitmap,
          paddedRect.left,
          paddedRect.top,
          width,
          height
        )

        // Apply stack blur
        val blurred = stackBlur(faceRegion, blurIntensity)

        // Draw blurred region back
        canvas.drawBitmap(blurred, paddedRect.left.toFloat(), paddedRect.top.toFloat(), null)

        faceRegion.recycle()
        blurred.recycle()
      }

      detector.close()

      // Save output
      val ext = if (output == "png") "png" else "jpg"
      val outputFile = File(context.cacheDir, "blurred_${System.currentTimeMillis()}.$ext")
      FileOutputStream(outputFile).use { fos ->
        if (output == "png") {
          mutableBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos)
        } else {
          mutableBitmap.compress(Bitmap.CompressFormat.JPEG, (quality * 100).toInt(), fos)
        }
      }

      // Copy EXIF
      copyExifInfo(imagePath, outputFile.absolutePath)

      val facesDetected = faces.size
      mutableBitmap.recycle()
      if (orientedBitmap !== originalBitmap) orientedBitmap.recycle()
      originalBitmap.recycle()

      return@AsyncFunction mapOf(
        "uri" to "file://${outputFile.absolutePath}",
        "facesDetected" to facesDetected
      )
    }
  }

  // MARK: - URI Handling

  private fun getPathFromUri(uri: Uri): String? {
    if (uri.scheme == "file") {
      return uri.path
    }
    // For content:// URIs, copy to temp
    val context = appContext.reactContext ?: return null
    return try {
      val inputStream = context.contentResolver.openInputStream(uri) ?: return null
      val tempFile = File(context.cacheDir, "input_${System.currentTimeMillis()}.jpg")
      tempFile.outputStream().use { out -> inputStream.copyTo(out) }
      inputStream.close()
      tempFile.absolutePath
    } catch (e: Exception) {
      null
    }
  }

  // MARK: - Orientation

  private fun correctOrientation(bitmap: Bitmap, imagePath: String): Bitmap {
    return try {
      val exif = ExifInterface(imagePath)
      val orientation = exif.getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL
      )
      val matrix = android.graphics.Matrix()
      when (orientation) {
        ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
        ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
        ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
        ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1f, 1f)
        ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.preScale(1f, -1f)
        else -> return bitmap
      }
      Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    } catch (e: Exception) {
      bitmap
    }
  }

  // MARK: - Stack Blur

  private fun stackBlur(bitmap: Bitmap, radius: Int): Bitmap {
    val r = radius.coerceIn(1, 100)
    val w = bitmap.width
    val h = bitmap.height
    val pixels = IntArray(w * h)
    bitmap.getPixels(pixels, 0, w, 0, 0, w, h)

    val wm = w - 1
    val hm = h - 1
    val wh = w * h
    val div = r + r + 1

    val rArr = IntArray(wh)
    val gArr = IntArray(wh)
    val bArr = IntArray(wh)
    var rsum: Int
    var gsum: Int
    var bsum: Int
    var x: Int
    var y: Int
    var i: Int
    var p: Int
    var yp: Int
    var yi: Int
    var yw: Int

    val vmin = IntArray(maxOf(w, h))
    var divsum = (div + 1) shr 1
    divsum *= divsum
    val dv = IntArray(256 * divsum)
    for (i2 in 0 until 256 * divsum) {
      dv[i2] = i2 / divsum
    }

    yw = 0
    yi = 0

    val stack = Array(div) { IntArray(3) }
    var stackpointer: Int
    var stackstart: Int
    var sir: IntArray
    var rbs: Int
    val r1 = r + 1
    var routsum: Int
    var goutsum: Int
    var boutsum: Int
    var rinsum: Int
    var ginsum: Int
    var binsum: Int

    y = 0
    while (y < h) {
      rinsum = 0
      ginsum = 0
      binsum = 0
      routsum = 0
      goutsum = 0
      boutsum = 0
      rsum = 0
      gsum = 0
      bsum = 0
      i = -r
      while (i <= r) {
        p = pixels[yi + minOf(wm, maxOf(i, 0))]
        sir = stack[i + r]
        sir[0] = (p and 0xff0000) shr 16
        sir[1] = (p and 0x00ff00) shr 8
        sir[2] = (p and 0x0000ff)
        rbs = r1 - kotlin.math.abs(i)
        rsum += sir[0] * rbs
        gsum += sir[1] * rbs
        bsum += sir[2] * rbs
        if (i > 0) {
          rinsum += sir[0]
          ginsum += sir[1]
          binsum += sir[2]
        } else {
          routsum += sir[0]
          goutsum += sir[1]
          boutsum += sir[2]
        }
        i++
      }
      stackpointer = r

      x = 0
      while (x < w) {
        rArr[yi] = dv[rsum]
        gArr[yi] = dv[gsum]
        bArr[yi] = dv[bsum]

        rsum -= routsum
        gsum -= goutsum
        bsum -= boutsum

        stackstart = stackpointer - r + div
        sir = stack[stackstart % div]

        routsum -= sir[0]
        goutsum -= sir[1]
        boutsum -= sir[2]

        if (y == 0) {
          vmin[x] = minOf(x + r + 1, wm)
        }
        p = pixels[yw + vmin[x]]

        sir[0] = (p and 0xff0000) shr 16
        sir[1] = (p and 0x00ff00) shr 8
        sir[2] = (p and 0x0000ff)

        rinsum += sir[0]
        ginsum += sir[1]
        binsum += sir[2]

        rsum += rinsum
        gsum += ginsum
        bsum += binsum

        stackpointer = (stackpointer + 1) % div
        sir = stack[stackpointer % div]

        routsum += sir[0]
        goutsum += sir[1]
        boutsum += sir[2]

        rinsum -= sir[0]
        ginsum -= sir[1]
        binsum -= sir[2]

        yi++
        x++
      }
      yw += w
      y++
    }

    x = 0
    while (x < w) {
      rinsum = 0
      ginsum = 0
      binsum = 0
      routsum = 0
      goutsum = 0
      boutsum = 0
      rsum = 0
      gsum = 0
      bsum = 0
      yp = -r * w
      i = -r
      while (i <= r) {
        yi = maxOf(0, yp) + x
        sir = stack[i + r]
        sir[0] = rArr[yi]
        sir[1] = gArr[yi]
        sir[2] = bArr[yi]
        rbs = r1 - kotlin.math.abs(i)
        rsum += rArr[yi] * rbs
        gsum += gArr[yi] * rbs
        bsum += bArr[yi] * rbs
        if (i > 0) {
          rinsum += sir[0]
          ginsum += sir[1]
          binsum += sir[2]
        } else {
          routsum += sir[0]
          goutsum += sir[1]
          boutsum += sir[2]
        }
        if (i < hm) {
          yp += w
        }
        i++
      }
      yi = x
      stackpointer = r

      y = 0
      while (y < h) {
        pixels[yi] = (-0x1000000 and pixels[yi]) or (dv[rsum] shl 16) or (dv[gsum] shl 8) or dv[bsum]

        rsum -= routsum
        gsum -= goutsum
        bsum -= boutsum

        stackstart = stackpointer - r + div
        sir = stack[stackstart % div]

        routsum -= sir[0]
        goutsum -= sir[1]
        boutsum -= sir[2]

        if (x == 0) {
          vmin[y] = minOf(y + r + 1, hm) * w
        }
        p = x + vmin[y]

        sir[0] = rArr[p]
        sir[1] = gArr[p]
        sir[2] = bArr[p]

        rinsum += sir[0]
        ginsum += sir[1]
        binsum += sir[2]

        rsum += rinsum
        gsum += ginsum
        bsum += binsum

        stackpointer = (stackpointer + 1) % div
        sir = stack[stackpointer]

        routsum += sir[0]
        goutsum += sir[1]
        boutsum += sir[2]

        rinsum -= sir[0]
        ginsum -= sir[1]
        binsum -= sir[2]

        yi += w
        y++
      }
      x++
    }

    val result = bitmap.copy(Bitmap.Config.ARGB_8888, true)
    result.setPixels(pixels, 0, w, 0, 0, w, h)
    return result
  }

  // MARK: - EXIF

  private val EXIF_TAGS = arrayOf(
    ExifInterface.TAG_DATETIME,
    ExifInterface.TAG_EXPOSURE_TIME,
    ExifInterface.TAG_FOCAL_LENGTH,
    ExifInterface.TAG_GPS_LATITUDE,
    ExifInterface.TAG_GPS_LATITUDE_REF,
    ExifInterface.TAG_GPS_LONGITUDE,
    ExifInterface.TAG_GPS_LONGITUDE_REF,
    ExifInterface.TAG_ISO_SPEED_RATINGS,
    ExifInterface.TAG_MAKE,
    ExifInterface.TAG_MODEL,
    ExifInterface.TAG_WHITE_BALANCE,
  )

  private fun copyExifInfo(sourcePath: String, destPath: String) {
    try {
      val sourceExif = ExifInterface(sourcePath)
      val destExif = ExifInterface(destPath)
      for (tag in EXIF_TAGS) {
        val value = sourceExif.getAttribute(tag)
        if (value != null) {
          destExif.setAttribute(tag, value)
        }
      }
      destExif.saveAttributes()
    } catch (_: Exception) {
      // EXIF copy is best-effort
    }
  }
}
