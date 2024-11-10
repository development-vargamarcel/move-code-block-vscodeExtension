import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('extension.moveScriptCode', async () => {
		// Ask user for the folder to operate on
		const folderUri = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			openLabel: 'Select Folder',
		});

		if (!folderUri || folderUri.length === 0) {
			vscode.window.showErrorMessage('No folder selected');
			return;
		}

		const folderPath = folderUri[0].fsPath;

		// Get all files in the selected folder with supported extensions (adjust extensions if needed)
		const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.{js,ts,svelte,vue,html}'));

		for (const file of files) {
			const document = await vscode.workspace.openTextDocument(file);
			const text = document.getText();

			// Regex to find the `<script>` line
			const scriptTagRegex = /<script>/;
			const scriptTagIndex = text.search(scriptTagRegex);

			// Regex to find the block starting with `let {` and ending with `$props()`
			const codeBlockRegex = /let\s*{\s*[^}]*\s*}\s*=\s*\$props\(\);/s;
			const codeBlockMatch = text.match(codeBlockRegex);

			// Only proceed if both script tag and code block are found
			if (scriptTagIndex !== -1 && codeBlockMatch) {
				const codeBlock = codeBlockMatch[0];

				// New content: insert code block after <script> and remove original block
				const newText =
					text.slice(0, scriptTagIndex + 8) +
					'\n' +
					codeBlock +
					'\n' +
					text.slice(scriptTagIndex + 8).replace(codeBlock, '');

				// Write changes to file
				const edit = new vscode.WorkspaceEdit();
				edit.replace(file, new vscode.Range(0, 0, document.lineCount, 0), newText);
				await vscode.workspace.applyEdit(edit);
				await document.save();
			}
		}

		vscode.window.showInformationMessage('Code blocks moved successfully!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
