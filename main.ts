import { Hash } from 'crypto';
import { App, MarkdownPreviewView, Modal, Notice, Plugin, PluginSettingTab, Setting, ValueComponent } from 'obsidian';

export default class WorkbenchPlugin extends Plugin {
	settings: WorkbenchSettings;

	async onload() {
		console.log('Loading the Workbench plugin.');
		
		//load data from saved settings
		this.settings = (await this.loadData()) || new WorkbenchSettings();


		this.addRibbonIcon('pencil', 'Workbench', () => {
			let obsidianApp = this.app;
			let workbenchNoteTitle = this.settings.workbenchNoteName;

			let files = obsidianApp.vault.getFiles();
				const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
					|| e.path === workbenchNoteTitle
					|| e.basename === workbenchNoteTitle
				)[0];

			obsidianApp.workspace.openLinkText(workbenchNoteTitle, workbenchNoteFile.path, true, MarkdownPreviewView);
		});

		this.addCommand({
			id: 'workbench-link-current-note',
			name: 'Link the current note in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.linkNoteInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-embed-current-note',
			name: 'Embed the current note in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.embedNoteInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-link-current-block',
			name: 'Link the current block in your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.linkBlockInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-embed-current-block',
			name: 'Embed the current block into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.embedBlockInWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({ 
			id: 'workbench-copy-current-block',
			name: 'Copy the current block into your Workbench.',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => { 
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.copyBlockIntoWorkbench();
					}
					return true;
				}
				return false;
			}
		});

		



		this.addSettingTab(new WorkbenchSettingTab(this.app, this));

		/*this.registerEvent(this.app.on('codemirror', (cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		})); */

		/*this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});*/

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('Unloading the Workbench plugin.');
	}

	saveToWorkbench(theMaterial: string, saveAction: string) {
		let obsidianApp = this.app;

		let linePrefix = this.settings.workbenchLinePrefix;

		console.log(linePrefix + theMaterial);

		let workbenchNoteTitle = this.settings.workbenchNoteName;

		let files = obsidianApp.vault.getFiles();
			const workbenchNoteFile = files.filter(e => e.name === workbenchNoteTitle //hat-tip 🎩 to @MrJackPhil for this little workflow 
				|| e.path === workbenchNoteTitle
				|| e.basename === workbenchNoteTitle
			)[0];

		console.log("Workbench note:" + workbenchNoteFile);

		if (!workbenchNoteFile) {
			console.log("The workbench note does not already exist. Creating it, then appending the new content to it.");

			let noteText = linePrefix + theMaterial;
			let newWorkbenchFile = obsidianApp.vault.create(workbenchNoteTitle + ".md", noteText);
		} else { // The file exists 
			console.log("The workbench note already exists. Appending the new content to it.");
			let previousNoteText = "";
			obsidianApp.vault.read(workbenchNoteFile).then(function (result) {
				let previousNoteText = result;
				console.log("Previous note text:\n" + previousNoteText);
				let newNoteText = previousNoteText + "\n\n" + linePrefix + theMaterial;
				obsidianApp.vault.modify(workbenchNoteFile, newNoteText);
				new Notice("Added " + saveAction + " to the workbench.")
			});
		}
	}

	createBlockHash(inputText: string): number { // Credit to http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
				let hash = 0, i, chr;
				for (i = 0; i < inputText.length; i++) {
					chr   = inputText.charCodeAt(i);
					hash  = ((hash << 5) - hash) + chr;
					hash |= 0; // Convert to 32bit integer
				}
				return hash;
	}

	getBlock(inputLine: string, noteFile: object): string { //Returns the string of a block ID if block is found, or "" if not.
		let obsidianApp = this.app;
		let noteBlocks = obsidianApp.metadataCache.getFileCache(noteFile).blocks;
		console.log("Checking if line '" + inputLine + "' is a block.");
		let blockString = "";
		if (noteBlocks) { // the file does contain blocks. If not, return ""
			for (let eachBlock in noteBlocks) { // iterate through the blocks. 
				console.log("Checking block ^" + eachBlock);
				let blockRegExp = new RegExp("(" + eachBlock + ")$", "gim");
				console.log("The regexp is '" + blockRegExp);
				if (inputLine.match(blockRegExp)) { // if end of inputLine matches block, return it
					blockString = eachBlock;
					console.log("Found block ^" + blockString);
					return blockString;
				} 
			}
			return blockString;
		} 
		return blockString;
	}

	linkNoteInWorkbench() { // Saves a link to the current note to the workbench
		let obsidianApp = this.app;

		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);
		
		
		let newMaterial = "[[" + noteLink + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current note");
	}

	embedNoteInWorkbench() { // Saves an embed of the current note to the workbench
		let obsidianApp = this.app;
		// Get the file and create a link to it
		let currentNoteFile = obsidianApp.workspace.activeLeaf.view.file;
		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);
		
		let newMaterial = "![[" + noteLink + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "an embed of the current note");
	}

	linkSectionInWorkbench(someNoteTitleAndHeading: string) { // Saves a link to the current heading to the workbench
		let obsidianApp = this.app;

		// get the heading
		let newMaterial = "[[" + someNoteTitleAndHeading + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current section");
	}

	embedSectionInWorkbench(someNoteTitleAndHeading: string) { // Saves an embed of the current heading to the workbench
		let obsidianApp = this.app;
		// get the heading
		let newMaterial = "![[" + someNoteTitleAndHeading + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "an embed of the current section");
	}

	copySectionIntoWorkbench(someNoteTitleAndHeading: string) { // Copies the content of the current section to the workbench
		let obsidianApp = this.app;
		// get the contents of the heading
		let newMaterial = someNoteTitleAndHeading;
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a copy of the current section");
	}

	linkBlockInWorkbench() { // Links the current block to the workbench
		let obsidianApp = this.app;

		// get the block
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		console.log("Checking for block:");
		let lineBlockID = this.getBlock(lineText, currentNoteFile);
		console.log(lineBlockID);

		if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
			console.log("This line is not currently a block. Adding a block ID.");
			lineBlockID = this.createBlockHash(lineText).toString();
			let lineWithBlock = lineText + " ^" + lineBlockID;
			obsidianApp.vault.read(currentNoteFile).then(function (result) {
				let previousNoteText = result;
				let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
				obsidianApp.vault.modify(currentNoteFile, newNoteText);
			})
		}

		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "[[" + noteLink + "#^" + lineBlockID + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current block");
	}

	embedBlockInWorkbench() { // Saves an embed of the current block to the workbench
		let obsidianApp = this.app;

		// get the block
		let currentView = obsidianApp.workspace.activeLeaf.view;
		let currentNoteFile = currentView.file;
		let editor = currentView.sourceMode.cmEditor;
		var cursor = editor.getCursor();
		let lineText = editor.getLine(cursor.line);
		console.log(lineText);

		console.log("Checking for block:");
		let lineBlockID = this.getBlock(lineText, currentNoteFile);
		console.log(lineBlockID);

		if (this.getBlock(lineText, currentNoteFile) === "") { // The line is not already a block
			console.log("This line is not currently a block. Adding a block ID.");
			lineBlockID = this.createBlockHash(lineText).toString();
			let lineWithBlock = lineText + " ^" + lineBlockID;
			obsidianApp.vault.read(currentNoteFile).then(function (result) {
				let previousNoteText = result;
				let newNoteText = previousNoteText.replace(lineText, lineWithBlock);
				obsidianApp.vault.modify(currentNoteFile, newNoteText);
			})
		}

		let noteLink = obsidianApp.metadataCache.fileToLinktext(currentNoteFile, currentNoteFile.path, true);

		let newMaterial = "![[" + noteLink + "#^" + lineBlockID + "]]";
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a link to the current block");
	}

	copyBlockIntoWorkbench() { // Copies the content of the current block to the workbench
		let obsidianApp = this.app;

		let currentView = obsidianApp.workspace.activeLeaf.view;
		let cm = currentView.sourceMode.cmEditor;
		var cursor = cm.getCursor();
		let lineText = cm.getLine(cursor.line);
		console.log(lineText);

		let newMaterial = lineText;
		console.log(newMaterial);
		this.saveToWorkbench(newMaterial, "a copy of the current block");
	}

}

class WorkbenchSettings {
	workbenchNoteName = "Workbench";
	workbenchLinePrefix = "";
}

class WorkbenchSettingTab extends PluginSettingTab {
	display(): void {
		let {containerEl} = this;
		const plugin: any = (this as any).plugin;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Workbench Settings'});

		new Setting(containerEl)
			.setName('Workbench note name')
			.setDesc('Provide a title for the workbench note. Default is Workbench.')
			.addText(text => 
				text
					.setPlaceholder('Workbench')
					.setValue(plugin.settings.workbenchNoteName)
					.onChange((value) => {
						plugin.settings.workbenchNoteName = value;
						plugin.saveData(plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Workbench line prefix')
			.setDesc('Set the prefix to each line added to Workbench. Default is nothing.')
			.addText(text => 
				text
					.setPlaceholder('')
					.setValue(plugin.settings.workbenchLinePrefix)
					.onChange((value) => {
						plugin.settings.workbenchLinePrefix = value;
						plugin.saveData(plugin.settings);
				}));

	}
}
