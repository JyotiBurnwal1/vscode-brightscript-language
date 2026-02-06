import * as vscode from 'vscode';

export class HeapSnapshotCommands {

    public registerHeapSnapshotCommands(
        context: vscode.ExtensionContext
    ) {
        // Start capturing snapshot
        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.captureSnapshot',
                async () => {
                    const session = vscode.debug.activeDebugSession;

                    if (!session) {
                        void vscode.window.showErrorMessage('No active debug session');
                        return;
                    }

                    try {
                        await session.customRequest('captureSnapshot');
                        await vscode.commands.executeCommand(
                            'setContext',
                            'brightscript.capturingSnapshot',
                            true
                        );
                    } catch (e) {
                        void vscode.window.showErrorMessage(`Failed to start capturing snapshot: ${e?.message || e}`);
                    }
                }
            )
        );

        // Stop capturing snapshot
        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.stopCapturingSnapshot',
                async () => {
                    const session = vscode.debug.activeDebugSession;

                    if (!session) {
                        void vscode.window.showErrorMessage('No active debug session');
                        return;
                    }

                    try {
                        await session.customRequest('stopCapturingSnapshot');
                        await vscode.commands.executeCommand(
                            'setContext',
                            'brightscript.capturingSnapshot',
                            false
                        );
                        this.openInSimpleBrowser('');
                    } catch (e) {
                        void vscode.window.showErrorMessage(`Failed to stop capturing snapshot: ${e?.message || e}`);
                    }
                }
            )
        );
    }

    /**
     * Open URL in VS Code's built-in Simple Browser (new tab inside VS Code)
     */
    private openInSimpleBrowser(url: string): void {
        void vscode.commands.executeCommand('simpleBrowser.show', url);
    }
}

export const heapSnapshotCommands = new HeapSnapshotCommands();