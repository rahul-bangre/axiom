# How to Install the Axiom VSCode Extension

## Method 1: Copy to Extensions Directory (Recommended for Development)

1. **Find your VSCode extensions directory:**
   - **macOS/Linux**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`

2. **Copy the extension:**
   ```bash
   # From the axiom project root
   cp -r vscode-axiom ~/.vscode/extensions/axiom-0.1.0
   ```

3. **Reload VSCode:**
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Developer: Reload Window"
   - Press Enter

4. **Test it:**
   - Open any `.ax` file in the `examples/` folder
   - You should see syntax highlighting!

## Method 2: Package as VSIX (For Distribution)

1. **Install vsce (VSCode Extension Manager):**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Package the extension:**
   ```bash
   cd vscode-axiom
   vsce package
   ```

3. **This creates `axiom-0.1.0.vsix`**

4. **Install the VSIX:**
   - Open VSCode
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Extensions: Install from VSIX"
   - Select the `.vsix` file

## Method 3: Development Mode

1. **Open the extension in VSCode:**
   ```bash
   code vscode-axiom
   ```

2. **Press F5 to launch Extension Development Host**
   - This opens a new VSCode window with your extension loaded
   - Perfect for testing changes

3. **Make changes to the grammar:**
   - Edit `syntaxes/axiom.tmLanguage.json`
   - Reload the Extension Development Host window
   - Changes appear immediately

## Verify Installation

After installation, you should see:

1. **Syntax highlighting** in `.ax` files
2. **Language mode** shows "Axiom" in the bottom right
3. **Auto-closing** brackets and quotes work
4. **Comment toggling** with `Cmd+/` or `Ctrl+/`

## Troubleshooting

### Extension not loading:
- Check the extensions directory path
- Make sure folder name is exactly `axiom-0.1.0`
- Restart VSCode completely (not just reload window)

### No syntax highlighting:
- Check file extension is `.ax`
- Click the language mode in bottom-right corner
- Select "Axiom" from the list

### Changes not appearing:
- Clear VSCode cache: Delete `~/.vscode/extensions/.obsolete`
- Completely quit and restart VSCode
- Check Developer Console for errors: `Help > Toggle Developer Tools`

## Uninstall

```bash
rm -rf ~/.vscode/extensions/axiom-0.1.0
```

Then reload VSCode.



