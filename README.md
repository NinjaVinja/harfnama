# Harfnama

Turn any document into handwritten or Urdu text — free, browser-based, no signup.

Harfnama is a personal practice project I built to explore document parsing, font rendering, and browser-based file export — going from a simple idea (convert text into a handwritten-style font) into a full multi-page editor with formatting, Urdu/Nastaliq support, and multiple export formats.

## What it does

Upload a PDF, Word document, or plain text file, and Harfnama extracts the content and re-renders it on realistic lined paper using a handwritten or Urdu font of your choice. Everything runs entirely in the browser — no file is ever uploaded to a server.

## Features

- **Document parsing** — extracts text from PDF (via PDF.js) and Word .docx (via Mammoth.js) files directly in the browser
- **Font library** — handwritten fonts (Caveat, Dancing Script, Indie Flower, and more) plus Urdu fonts (Noto Nastaliq Urdu, Noto Naskh Arabic, Scheherazade), with support for uploading a custom font file
- **Lined paper styles** — blank, ruled, margin-ruled, grid, dotted, and college-ruled, with adjustable line spacing and color
- **Paper sizes** — A4, Letter, Legal, A4 landscape, A5, and A3
- **Automatic pagination** — content flows across multiple pages as needed, without losing formatting or cursor position while typing
- **Rich text formatting** — bold, italic, underline, text alignment, text color, highlight color, and basic table insertion
- **Multi-format export** — Word (.docx), PDF, PNG, HTML, and plain text
- **Right-to-left support** — for Urdu and Arabic text direction
- **Autosave** — drafts are saved to local storage and restored on page reload

## Tech stack

Built with plain HTML, CSS, and JavaScript — no framework, no build step.

| Library | Purpose |
|---|---|
| [PDF.js](https://mozilla.github.io/pdf.js/) | Extracting text from PDF files |
| [Mammoth.js](https://github.com/mwilliamson/mammoth.js) | Extracting text from Word documents |
| [html2canvas](https://html2canvas.hertzen.com/) | Rendering paper pages to image for PDF/PNG export |
| [jsPDF](https://github.com/parallax/jsPDF) | Generating downloadable PDF files |
| [docx](https://docx.js.org/) | Generating downloadable Word files |

## Running locally

This is a static site — no installation or build process required.

1. Clone or download this repository
2. Open `app.html` directly in a browser, or serve the folder with any static file server (e.g. the VS Code "Live Server" extension)

The `style.css` and `script.js` files must stay in the same folder as `app.html` for the app to work correctly.

## Project structure

```
harfnama/
├── index.html    # Landing page
├── app.html      # The main tool
├── style.css     # All styling
└── script.js     # All application logic
```

## License

All rights reserved. This code is shared publicly for portfolio and demonstration purposes only. Copying, modifying, or redistributing it without permission is not allowed.

## Author

**Muhammad Taha Ahmad**
[GitHub](https://github.com/NinjaVinja) · [LinkedIn](https://www.linkedin.com/in/muhammad-taha-ahmad-391679262/)
