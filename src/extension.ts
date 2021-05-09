import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Terminator - ONLINE');

	let editProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			console.log('Terminator - EXECUTE: format');

			let textEditList: vscode.TextEdit[] = [];

			let terminators = [';', '{', '}'];
			let indentSize = 4;
			let isUsingTabs = false;

			let escapeRegExp = function (text: string) {
				return text.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
			};

			// let generateWhitespace = function (length: number, asTabs: boolean) {
			// 	if (asTabs) {
			// 		return '\t'.repeat(length);
			// 	} else {
			// 		return ' '.repeat(tabsCount * indentSize + spacesCount);
			// 	}
			// };

			let convertWhitespaces = function (text: string, asTabs: boolean) {
				let tabsMatch = text.match(new RegExp('\t'));
				let tabsCount = tabsMatch ? tabsMatch.length : 0;
				let spacesCount = text.length - tabsCount;

				if (asTabs) {
					return '\t'.repeat(spacesCount / indentSize + tabsCount);
				} else {
					return ' '.repeat(tabsCount * indentSize + spacesCount);
				}
			};

			let terminatorsRegex = '';
			for (let i = 0; i < terminators.length; i++) {
				const terminator = terminators[i];
				terminatorsRegex += escapeRegExp(terminator);
			}
			terminatorsRegex = '[' + terminatorsRegex + ']';

			// Get max indent ignoring terminator/whitespace
			let maxIndent = 0;
			for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
				const line: vscode.TextLine = document.lineAt(lineIndex);
				if (line && line.text) {
					let lineIndentMatch = line.text.match(new RegExp('(.*?)(\\s|' + terminatorsRegex + ')*$'));
					if (lineIndentMatch && lineIndentMatch.length > 2 && lineIndentMatch[1].length > maxIndent) {
						maxIndent = lineIndentMatch[1].length;
					}
				}
			}
			// Increment by 1 to indent after non terminator/whitespace stops
			maxIndent++;
			// Indent at indentSize intervals
			maxIndent += maxIndent % indentSize;
			// Offset
			maxIndent += indentSize;

			let lineRegex = new RegExp('(^\\s*)(' + terminatorsRegex + '*)(.*?)(' + terminatorsRegex + '*)(\\s*?$)');
			for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
				const line: vscode.TextLine = document.lineAt(lineIndex);
				if (line && line.text) {
					let lineMatch = line.text.match(lineRegex);
					if (lineMatch && lineMatch.length === 6) {
						let preWhitespaces: string = lineMatch[1];
						let preTerminators: string = lineMatch[2];
						let code: string = lineMatch[3];
						let postTerminators: string = lineMatch[4];
						let postWhitespaces: string = lineMatch[5];

						if (preTerminators) {
							let previousLine;
							if (lineIndex > 0) {
								previousLine = document.lineAt(lineIndex - 1);
							}
							if (previousLine && previousLine.text) {
								// Add padding if previousLine doesn't end with a terminator
								if (!new RegExp(terminatorsRegex + '$').test(previousLine.text)) {
									let padding = ' '.repeat(maxIndent - previousLine.text.length);
									textEditList.push(vscode.TextEdit.insert(new vscode.Position(lineIndex - 1, previousLine.text.length), padding));
								}
								textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex - 1, previousLine.text.length, lineIndex, preWhitespaces.length)));
							} else {
								textEditList.push(vscode.TextEdit.delete(new vscode.Range(lineIndex, 0, lineIndex, preWhitespaces.length)));
							}
						} else if (preWhitespaces) {
							let newPreWhiteSpace = convertWhitespaces(preWhitespaces, isUsingTabs);
							textEditList.push(vscode.TextEdit.replace(new vscode.Range(lineIndex, 0, lineIndex, preWhitespaces.length), newPreWhiteSpace));
						}
						if (preTerminators && code) {
							let prePadding = ' '.repeat(preWhitespaces.length);
							let codeStartIndex = preWhitespaces.length + preTerminators.length;
							textEditList.push(vscode.TextEdit.insert(new vscode.Position(line.lineNumber, codeStartIndex), '\n' + prePadding));

							let postPadding = ' '.repeat(preTerminators.length);
							let codeEndIndex = preWhitespaces.length + preTerminators.length + code.length;
							textEditList.push(vscode.TextEdit.insert(new vscode.Position(line.lineNumber, codeEndIndex), postPadding));
						}
						if (postTerminators) {
							let codeEndIndex = preWhitespaces.length + preTerminators.length + code.length;
							let padding = ' '.repeat(maxIndent - codeEndIndex);
							textEditList.push(vscode.TextEdit.insert(new vscode.Position(line.lineNumber, codeEndIndex), padding));
						}
					}
				}
			}

			return textEditList;
		}
	};

	vscode.languages.registerDocumentFormattingEditProvider('csharp', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('javascript', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('typescript', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('c', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('cpp', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('css', editProvider);
	vscode.languages.registerDocumentFormattingEditProvider('json', editProvider);
}