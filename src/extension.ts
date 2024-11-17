// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Regular expression to match HSL values without hsl() wrapper
	const hslRegex = /(\d{1,3}(?:\.\d+)?)(?:deg)?\s*,?\s*(\d{1,3}(?:\.\d+)?)%?\s*,?\s*(\d{1,3}(?:\.\d+)?)%?/g;

	// Register color provider for CSS
	const disposable = vscode.languages.registerColorProvider('css', {
		provideDocumentColors(document: vscode.TextDocument): vscode.ProviderResult<vscode.ColorInformation[]> {
			const text = document.getText();
			const colors: vscode.ColorInformation[] = [];

			let match;
			while ((match = hslRegex.exec(text)) !== null) {
				console.log(match);
				const colorRange = new vscode.Range(
					document.positionAt(match.index),
					document.positionAt(match.index + match[0].length)
				);

				const hue = parseFloat(match[1]) / 360;
				const saturation = parseFloat(match[2]) / 100;
				const lightness = parseFloat(match[3]) / 100;

				// Convert HSL to RGB for the color picker
				const color = hslToRgb(hue, saturation, lightness);

				const colorInfo = new vscode.ColorInformation(colorRange, color);
				colors.push(colorInfo);
			}

			return colors;
		},

		provideColorPresentations(color: vscode.Color, context): vscode.ProviderResult<vscode.ColorPresentation[]> {
			const { red, green, blue } = color;
			const hslArr = rgb2hsl(red, green, blue);
			const hsl = { h: Math.round(hslArr[0] * 10) / 10, s: Math.round(hslArr[1] * 1000) / 10, l: Math.round(hslArr[2] * 1000) / 10 };
			const presentation = new vscode.ColorPresentation(`${hsl.h} ${hsl.s}% ${hsl.l}%`);
			return [presentation];
		}
	});

	context.subscriptions.push(disposable);
}



function hslToRgb(h: number, s: number, l: number): vscode.Color {
	let r, g, b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hueToRgb(p, q, h + 1 / 3);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - 1 / 3);
	}

	return new vscode.Color(r, g, b, 1.0);
}

function hueToRgb(p: number, q: number, t: number) {
	if (t < 0) { t += 1; }
	if (t > 1) { t -= 1; }
	if (t < 1 / 6) { return p + (q - p) * 6 * t; }
	if (t < 1 / 2) { return q; }
	if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
	return p;
}

function rgb2hsl(r: number, g: number, b: number) {
	let v = Math.max(r, g, b), c = v - Math.min(r, g, b), f = (1 - Math.abs(v + v - c - 1));
	let h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c));
	return [60 * (h < 0 ? h + 6 : h), f ? c / f : 0, (v + v - c) / 2];
}

export function deactivate() { }