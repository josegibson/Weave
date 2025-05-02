# Weave - PPTX-Excel Report Generator

Weave is an Electron application that generates PowerPoint presentations from Excel data using a PowerPoint template.

## Features

- Drag and drop interface for PowerPoint template and Excel data files
- Process multiple Excel files at once
- Custom output directory selection
- Real-time processing status updates

## Requirements

- Node.js 14+
- Python 3.6+
- python-pptx and openpyxl libraries (installed via requirements.txt)

## Installation

1. Clone the repository
2. Install Node.js dependencies:

```bash
npm install
```

3. Install Python dependencies:

```bash
pip install -r electron/python/requirements.txt
```

## Development

To start the application in development mode:

```bash
npm run dev
```

## Building

To build the application:

```bash
npm run build
```

This will create distributable packages in the `dist` directory.

## Usage

1. Launch the application
2. Drag and drop your PowerPoint template (.pptx)
3. Drag and drop your Excel data files (.xlsx)
4. Set your output directory
5. Click "Generate Reports"
6. Find your generated presentations in the output directory

## How It Works

1. The application uses a PowerPoint template (.pptx) with placeholders
2. Data from Excel files (.xlsx) is read and mapped to the placeholders
3. For each Excel file, a new PowerPoint presentation is generated with the data

## License

MIT

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
