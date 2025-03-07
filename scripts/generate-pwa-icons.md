# Generating PWA Icons

To generate proper PWA icons, you should create PNG versions of the icon at various sizes. Here are some recommendations:

## Required Icon Sizes

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512
- 192x192 (maskable - with safe zone)

## Generation Options

1. **Use a tool like Figma, Sketch, or Adobe Illustrator** to export your logo at the required sizes.

2. **Use a CLI tool like Sharp** to generate icons from a single high-resolution source:

```bash
npm install -g sharp-cli
```

Then create a script to generate all sizes:

```bash
sharp -i public/icon.svg -o public/icons/icon-72x72.png resize 72 72
sharp -i public/icon.svg -o public/icons/icon-96x96.png resize 96 96
sharp -i public/icon.svg -o public/icons/icon-128x128.png resize 128 128
sharp -i public/icon.svg -o public/icons/icon-144x144.png resize 144 144
sharp -i public/icon.svg -o public/icons/icon-152x152.png resize 152 152
sharp -i public/icon.svg -o public/icons/icon-192x192.png resize 192 192
sharp -i public/icon.svg -o public/icons/icon-384x384.png resize 384 384
sharp -i public/icon.svg -o public/icons/icon-512x512.png resize 512 512
```

3. **Online PWA asset generators**:
   - [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator)

## Maskable Icons

For maskable icons, ensure your icon has a safe zone. The main content should be within the inner 80% of the image to ensure it's visible when the icon is displayed in different shapes.

Replace the placeholder files in the `public/icons` directory with your actual icon files before deploying your PWA. 