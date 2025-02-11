# Unfold - Document Processing

A modern, browser-based document processing and analysis application powered by AI and [Pyodide](https://pyodide.org/). Unfold allows you to upload and process your documents entirely within your browser, ensuring that your sensitive data never leaves your device.

## Features

- **Local Document Processing:** All processing is performed locally in your browser using Pyodide, so your data remains private and secure.
- **Multiple File Format Support:** Upload individual documents or entire folders. Supported formats include:
	- Text Files (`.txt`, `.md`)
	- PDF Documents (`.pdf`)
	- More formats are coming soon!
- **Interactive Document Viewer:** Preview processed documents with an integrated viewer that supports text and PDF files.
- **User-Friendly Interface:** Built with Next.js, Tailwind CSS, and a suite of UI components for a seamless user experience.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Theme Support:** Toggle between light, dark, and system themes.

## Demo

*(Insert link or screenshot if available)*

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [pnpm](https://pnpm.io/) package manager

### Installation

Clone the repository:

```bash
git clone https://github.com/mweinbach/unfold.git
cd unfold

Install the dependencies:

pnpm install

Running the Application

Start the development server:

pnpm dev

Then, open your browser and navigate to http://localhost:3000 to see the application in action.

Building for Production

To build the application for production, run:

pnpm build

And then start the production server:

pnpm start

Project Structure

unfold/
├── app/                  # Main Next.js application files
├── components/           # Reusable UI components and feature-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions, types, and web workers (e.g., Pyodide worker)
├── public/               # Public assets (images, icons, etc.)
├── next.config.js        # Next.js configuration
├── package.json          # Project metadata and scripts
├── pnpm-lock.yaml        # pnpm lock file
└── tsconfig.json         # TypeScript configuration

How It Works

Unfold leverages Pyodide, a Python runtime that runs entirely in your browser, to process documents without sending any data to a server. When you upload a document or folder, Unfold spawns a web worker for each file to extract its content locally. The extracted content is then displayed in an interactive viewer where you can further process or analyze the document.

Contributing

Contributions are welcome! To contribute:
	1.	Fork the repository.
	2.	Create a new branch:

git checkout -b feature/your-feature-name


	3.	Commit your changes:

git commit -am 'Add some feature'


	4.	Push to your branch:

git push origin feature/your-feature-name


	5.	Open a pull request with a clear description of your changes.

Please update tests as needed and follow the existing coding style.

License

(Add your license information here. For example, MIT License)

Acknowledgements
	•	Next.js
	•	Tailwind CSS
	•	Pyodide
	•	Shadcn UI
	•	Vercel Analytics
	•	Lucide Icons

Happy Document Processing with Unfold!