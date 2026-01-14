import * as vscode from 'vscode';
import { PerfettoControls } from 'roku-debug';

export class PerfettoControlCommands {
    private context: vscode.ExtensionContext;
    private host: string;

    public registerPerfettoControlCommands(context: vscode.ExtensionContext) {
        this.context = context;
        let subscriptions = context.subscriptions;

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.startTracing', async () => {
            await this.perfettoControls("start");
            await vscode.commands.executeCommand(
                'setContext',
                'brightscript.tracingActive',
                true
            );
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.stopTracing', async () => {
            await this.perfettoControls("stop");
            await vscode.commands.executeCommand(
                'setContext',
                'brightscript.tracingActive',
                false
            );
        }));

        subscriptions.push(
            vscode.window.registerCustomEditorProvider(
            "perfTraceViewer.editor", // Matches `viewType` in package.json
            new PerfTraceEditorProvider(context),
            {
                webviewOptions: {
                retainContextWhenHidden: true, // Optional: Keep webview state when hidden
                },
            }
            )
        );
    }

    private async perfettoControls(command: string) {
        await this.getRemoteHost();
        const perfettoController = new PerfettoControls(this.host);
        
        switch (command) {
            case 'start':
                const startFilename = "something.perfetto-trace";
                const startFolderUri = await this.createFolderIfNotExists("perfetto");
                const startFileUri = vscode.Uri.file(`${startFolderUri.fsPath}/${startFilename}`);
                await this.handleTracingOperation('Start', () => perfettoController.startTracing(startFileUri.fsPath), startFilename);
                break;

            case 'stop':
                const stopFilename = "something.perfetto-trace";
                const stopFolderUri = await this.createFolderIfNotExists("perfetto");
                const stopFileUri = vscode.Uri.file(`${stopFolderUri.fsPath}/${stopFilename}`);
                await this.handleTracingOperation('Stop', () => perfettoController.stopTracing(stopFileUri.fsPath), stopFilename);
                break;

            case 'enable':
                await this.handleTracingOperation('Enable', () => perfettoController.enableTracing());
                break;
                
            default:
                this.showError('Unknown Perfetto command: ' + command);
                break;
        }
    }

    private async handleTracingOperation(
        operationName: string,
        operation: () => Promise<{ message: string; error: boolean }>,
        filename?: string
    ): Promise<void> {
        this.showInfo(`${operationName}ing perfetto Tracing!`);

        const response = await operation();

        if (response.error) {
            this.showError(`Error ${operationName.toLowerCase()}ing perfetto tracing: ${response.message}`);
        } else {
            const timestamp = new Date().toLocaleTimeString();
            this.showInfo(`Perfetto tracing ${operationName.toLowerCase()}ed ${timestamp}: ${response.message}`);
        }
    }

    private showInfo(msg: string) {
        vscode.window.showInformationMessage(msg);
    }

    private showError(msg: string) {
        vscode.window.showErrorMessage(msg);
    }

    private async createFolderIfNotExists(folderName: string): Promise<vscode.Uri> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const errorMessage = "No workspace folder found.";
            vscode.window.showErrorMessage(errorMessage);
            throw new Error(errorMessage);
        }

        const folderDir = vscode.Uri.joinPath(workspaceFolders[0].uri, folderName);
        await vscode.workspace.fs.createDirectory(folderDir);
        
        return folderDir;
    }

    public async getRemoteHost() {
        this.host = await this.context.workspaceState.get('remoteHost');
        if (!this.host) {
            let config = vscode.workspace.getConfiguration('brightscript.remoteControl', null);
            this.host = config.get('host');
            if (this.host === '${promptForHost}') {
                this.host = await vscode.window.showInputBox({
                    placeHolder: 'The IP address of your Roku device',
                    value: ''
                });
            }
        }
        if (!this.host) {
            throw new Error('Can\'t send command: host is required.');
        } else {
            await this.context.workspaceState.update('remoteHost', this.host);
        }
    }

}

class PerfTraceEditorProvider implements vscode.CustomReadonlyEditorProvider {
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async openCustomDocument(uri: vscode.Uri) {
        return {
            uri,
            dispose() { }
        } as vscode.CustomDocument;
    }

    /**
     * Called when the custom editor is opened.
     */
    public async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Set up the webview
        webviewPanel.webview.options = {
            enableScripts: true, // Allow JavaScript in the webview
        };

        // Load the HTML content for the webview
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        let perfettoUILoaded = false;

        // Handle updates to the document
        const updateWebview = async () => {
            webviewPanel.title = `Perf Trace Viewer - ${document.uri.fsPath}`;
            const data: Uint8Array = await vscode.workspace.fs.readFile(document.uri);

            if (!perfettoUILoaded) {
                // If the Perfetto UI is not loaded yet, we don't send the data
                return;
            }

            webviewPanel.webview.postMessage({
                type: "update",
                perfetto: {
                    buffer: data.buffer,
                    title: document.uri.fsPath,
                    fileName: document.uri.fsPath,
                    keepApiOpen: true,
                },
            });
        };

        // Listen for changes to the document
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        // Clean up when the webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case "PERFETTO_READY":
                    perfettoUILoaded = true;
                    updateWebview();
                    return;
            }
        });
    }

    /**
     * Provide the HTML content for the webview.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css")
        );

        return /* html */ `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy"
                    content="default-src 'none';
                        script-src ${webview.cspSource} https://ui.perfetto.dev 'unsafe-inline';
                        style-src ${webview.cspSource} https://ui.perfetto.dev 'unsafe-inline';
                        frame-src https://ui.perfetto.dev">
                <link href="${styleUri}" rel="stylesheet">
                <title>Performance Trace Viewer</title>
            </head>
            <body>
                <div id="app">Loading...</div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

export const perfettoControlCommands = new PerfettoControlCommands();
