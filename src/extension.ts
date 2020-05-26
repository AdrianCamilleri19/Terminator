import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Terminator - ONLINE');

	let editProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			console.log('Terminator - EXECUTE: format');
			const firstLine = document.lineAt(0);
			if (firstLine.text !== '42') {
				return [vscode.TextEdit.insert(firstLine.range.start, '42\n')];
			}
			return [];
		}
	};

	vscode.languages.registerDocumentFormattingEditProvider('csharp', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('javascript', editProvider);
}