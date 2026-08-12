param(
  [string]$SourcePath = "public/assets/kilns/cizhou-panorama.png",
  [string]$OutputDirectory = "public/assets/kilns/cizhou-knowledge",
  [string]$PreviewPath = "design-audit/cizhou-transition-assets-v1.png"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFullPath = Join-Path $projectRoot $SourcePath
$outputFullPath = Join-Path $projectRoot $OutputDirectory
$previewFullPath = Join-Path $projectRoot $PreviewPath

New-Item -ItemType Directory -Force -Path $outputFullPath | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $previewFullPath) | Out-Null

Add-Type -AssemblyName System.Drawing

$generatorSource = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class CizhouTransitionAssetGenerator
{
    private static float Clamp01(float value)
    {
        return Math.Max(0f, Math.Min(1f, value));
    }

    private static float SmoothStep(float edge0, float edge1, float value)
    {
        float t = Clamp01((value - edge0) / (edge1 - edge0));
        return t * t * (3f - 2f * t);
    }

    private static Bitmap ToArgb(Bitmap source)
    {
        var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(result)) graphics.DrawImageUnscaled(source, 0, 0);
        return result;
    }

    private static byte[] ReadPixels(Bitmap bitmap)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            var pixels = new byte[Math.Abs(data.Stride) * bitmap.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            return pixels;
        }
        finally { bitmap.UnlockBits(data); }
    }

    private static void WritePixels(Bitmap bitmap, byte[] pixels)
    {
        var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        var data = bitmap.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        try { Marshal.Copy(pixels, 0, data.Scan0, pixels.Length); }
        finally { bitmap.UnlockBits(data); }
    }

    private static float[] GaussianBlur(float[] source, int width, int height, float sigma)
    {
        int radius = Math.Max(1, (int)Math.Ceiling(sigma * 3f));
        var kernel = new float[radius * 2 + 1];
        float kernelSum = 0f;
        for (int i = -radius; i <= radius; i++)
        {
            float weight = (float)Math.Exp(-(i * i) / (2f * sigma * sigma));
            kernel[i + radius] = weight;
            kernelSum += weight;
        }
        for (int i = 0; i < kernel.Length; i++) kernel[i] /= kernelSum;

        var horizontal = new float[source.Length];
        var output = new float[source.Length];
        for (int y = 0; y < height; y++)
        {
            int row = y * width;
            for (int x = 0; x < width; x++)
            {
                float sum = 0f;
                for (int k = -radius; k <= radius; k++)
                {
                    int sampleX = Math.Max(0, Math.Min(width - 1, x + k));
                    sum += source[row + sampleX] * kernel[k + radius];
                }
                horizontal[row + x] = sum;
            }
        }
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float sum = 0f;
                for (int k = -radius; k <= radius; k++)
                {
                    int sampleY = Math.Max(0, Math.Min(height - 1, y + k));
                    sum += horizontal[sampleY * width + x] * kernel[k + radius];
                }
                output[y * width + x] = sum;
            }
        }
        return output;
    }

    private static void SaveGrayscale(float[] values, int width, int height, string path)
    {
        using (var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        {
            var pixels = new byte[width * height * 4];
            for (int i = 0; i < values.Length; i++)
            {
                byte value = (byte)Math.Round(Clamp01(values[i]) * 255f);
                int offset = i * 4;
                pixels[offset] = value;
                pixels[offset + 1] = value;
                pixels[offset + 2] = value;
                pixels[offset + 3] = 255;
            }
            WritePixels(bitmap, pixels);
            bitmap.Save(path, ImageFormat.Png);
        }
    }

    private static void SaveHeatOverlay(float[] mask, float[] bloom, int width, int height, string path)
    {
        using (var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        {
            var pixels = new byte[width * height * 4];
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int i = y * width + x;
                    float core = mask[i];
                    float halo = Clamp01(bloom[i] - core * 0.28f);
                    float variation = 0.5f + 0.5f * (float)Math.Sin(x * 0.031f + y * 0.019f + Math.Sin(y * 0.013f) * 2.2f);
                    float hot = Clamp01(core * (0.52f + variation * 0.32f) + halo * 0.9f);
                    int offset = i * 4;
                    pixels[offset] = (byte)Math.Round(4f + 14f * hot);
                    pixels[offset + 1] = (byte)Math.Round(10f + 56f * hot);
                    pixels[offset + 2] = (byte)Math.Round(105f + 138f * hot);
                    pixels[offset + 3] = (byte)Math.Round(255f * Clamp01(core * 0.74f + halo * 0.26f));
                }
            }
            WritePixels(bitmap, pixels);
            bitmap.Save(path, ImageFormat.Png);
        }
    }

    private static void SaveMotif(float[] mask, int sourceWidth, int sourceHeight, Rectangle crop, string inkPath, string emberPath)
    {
        const int size = 720;
        using (var ink = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (var ember = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        {
            var inkPixels = new byte[size * size * 4];
            var emberPixels = new byte[size * size * 4];
            for (int y = 0; y < size; y++)
            {
                int sampleY = Math.Max(0, Math.Min(sourceHeight - 1, (int)(crop.Top + (y + 0.5f) * crop.Height / size)));
                for (int x = 0; x < size; x++)
                {
                    int sampleX = Math.Max(0, Math.Min(sourceWidth - 1, (int)(crop.Left + (x + 0.5f) * crop.Width / size)));
                    float value = mask[sampleY * sourceWidth + sampleX];
                    int offset = (y * size + x) * 4;
                    float distance = (float)Math.Sqrt(Math.Pow((x - size * 0.5f) / (size * 0.57f), 2) + Math.Pow((y - size * 0.5f) / (size * 0.57f), 2));
                    float feather = 1f - SmoothStep(0.68f, 1f, distance);
                    float motifAlpha = value * feather;
                    inkPixels[offset] = 18;
                    inkPixels[offset + 1] = 23;
                    inkPixels[offset + 2] = 30;
                    inkPixels[offset + 3] = (byte)Math.Round(motifAlpha * 235f);

                    float radial = 1f - Clamp01((float)Math.Sqrt(Math.Pow((x - size * 0.5f) / (size * 0.68f), 2) + Math.Pow((y - size * 0.5f) / (size * 0.68f), 2)));
                    float heat = 0.45f + radial * 0.55f;
                    emberPixels[offset] = (byte)Math.Round(10f + heat * 12f);
                    emberPixels[offset + 1] = (byte)Math.Round(25f + heat * 60f);
                    emberPixels[offset + 2] = (byte)Math.Round(145f + heat * 110f);
                    emberPixels[offset + 3] = (byte)Math.Round(motifAlpha * 242f);
                }
            }
            WritePixels(ink, inkPixels);
            WritePixels(ember, emberPixels);
            ink.Save(inkPath, ImageFormat.Png);
            ember.Save(emberPath, ImageFormat.Png);
        }
    }

    private static void SavePreview(Bitmap source, string maskPath, string bloomPath, string overlayPath, string motifPath, string previewPath)
    {
        using (var mask = new Bitmap(maskPath))
        using (var bloom = new Bitmap(bloomPath))
        using (var overlay = new Bitmap(overlayPath))
        using (var motif = new Bitmap(motifPath))
        using (var preview = new Bitmap(1600, 1040, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(preview))
        using (var titleFont = new Font("Segoe UI", 25f, FontStyle.Bold, GraphicsUnit.Pixel))
        using (var labelFont = new Font("Segoe UI", 20f, FontStyle.Regular, GraphicsUnit.Pixel))
        using (var paperBrush = new SolidBrush(Color.FromArgb(243, 232, 207)))
        using (var inkBrush = new SolidBrush(Color.FromArgb(35, 27, 22)))
        {
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.Clear(Color.FromArgb(20, 15, 12));
            graphics.DrawString("CIZHOU | FIRING TRANSITION ASSET BOARD", titleFont, Brushes.White, 44, 26);
            var panoramaRect = new Rectangle(44, 78, 1512, 470);
            graphics.DrawImage(source, panoramaRect);
            using (var attributes = new ImageAttributes())
            {
                var matrix = new ColorMatrix();
                matrix.Matrix33 = 0.74f;
                attributes.SetColorMatrix(matrix, ColorMatrixFlag.Default, ColorAdjustType.Bitmap);
                graphics.DrawImage(overlay, panoramaRect, 0, 0, overlay.Width, overlay.Height, GraphicsUnit.Pixel, attributes);
            }
            graphics.DrawString("COMPOSITE / EMBER OVERLAY", labelFont, Brushes.White, 58, 500);
            var panel1 = new Rectangle(44, 600, 470, 235);
            var panel2 = new Rectangle(565, 600, 470, 235);
            var panel3 = new Rectangle(1086, 600, 470, 370);
            graphics.DrawImage(mask, panel1);
            graphics.DrawImage(bloom, panel2);
            graphics.FillRectangle(paperBrush, panel3);
            graphics.DrawImage(motif, panel3);
            graphics.DrawString("INK HEAT MASK", labelFont, Brushes.White, panel1.Left, panel1.Bottom + 18);
            graphics.DrawString("BLOOM MASK", labelFont, Brushes.White, panel2.Left, panel2.Bottom + 18);
            graphics.DrawString("PEONY CUTOUT", labelFont, inkBrush, panel3.Left + 16, panel3.Bottom - 42);
            preview.Save(previewPath, ImageFormat.Png);
        }
    }

    public static void Generate(string sourcePath, string outputDirectory, string previewPath)
    {
        Directory.CreateDirectory(outputDirectory);
        using (var original = new Bitmap(sourcePath))
        using (var source = ToArgb(original))
        {
            int width = source.Width;
            int height = source.Height;
            byte[] pixels = ReadPixels(source);
            var rawMask = new float[width * height];
            for (int y = 0; y < height; y++)
            {
                float vertical = y / (float)(height - 1);
                float poleFade = SmoothStep(0.035f, 0.105f, vertical) * (1f - SmoothStep(0.895f, 0.972f, vertical));
                for (int x = 0; x < width; x++)
                {
                    int i = y * width + x;
                    int offset = i * 4;
                    float blue = pixels[offset];
                    float green = pixels[offset + 1];
                    float red = pixels[offset + 2];
                    float luminance = 0.0722f * blue + 0.7152f * green + 0.2126f * red;
                    rawMask[i] = (1f - SmoothStep(62f, 154f, luminance)) * poleFade;
                }
            }

            float[] smallBlur = GaussianBlur(rawMask, width, height, 1.15f);
            var mask = new float[rawMask.Length];
            for (int i = 0; i < mask.Length; i++)
            {
                float structure = SmoothStep(0.24f, 0.64f, smallBlur[i]);
                mask[i] = Clamp01(structure * SmoothStep(0.08f, 0.55f, rawMask[i]));
            }
            float[] bloom = GaussianBlur(mask, width, height, 7.5f);
            for (int y = 0; y < height; y++)
            {
                float vertical = y / (float)(height - 1);
                float poleFade = SmoothStep(0.035f, 0.105f, vertical) * (1f - SmoothStep(0.895f, 0.972f, vertical));
                for (int x = 0; x < width; x++)
                {
                    int i = y * width + x;
                    bloom[i] = SmoothStep(0.018f, 0.72f, bloom[i]) * poleFade;
                }
            }

            string maskPath = Path.Combine(outputDirectory, "cizhou-ink-heat-mask-v1.png");
            string bloomPath = Path.Combine(outputDirectory, "cizhou-ink-bloom-mask-v1.png");
            string overlayPath = Path.Combine(outputDirectory, "cizhou-ink-ember-overlay-v1.png");
            string motifPath = Path.Combine(outputDirectory, "cizhou-peony-ink-cutout-v1.png");
            string motifEmberPath = Path.Combine(outputDirectory, "cizhou-peony-ember-cutout-v1.png");
            SaveGrayscale(mask, width, height, maskPath);
            SaveGrayscale(bloom, width, height, bloomPath);
            SaveHeatOverlay(mask, bloom, width, height, overlayPath);
            SaveMotif(mask, width, height, new Rectangle(980, 118, 675, 675), motifPath, motifEmberPath);
            SavePreview(source, maskPath, bloomPath, overlayPath, motifPath, previewPath);
        }
    }
}
'@

Add-Type -TypeDefinition $generatorSource -ReferencedAssemblies System.Drawing
[CizhouTransitionAssetGenerator]::Generate($sourceFullPath, $outputFullPath, $previewFullPath)

Get-ChildItem -LiteralPath $outputFullPath | Select-Object Name, Length
Get-Item -LiteralPath $previewFullPath | Select-Object Name, Length
