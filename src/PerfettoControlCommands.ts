import * as vscode from 'vscode';

export class PerfettoControlCommands {
    
    public registerPerfettoControlCommands(
        context: vscode.ExtensionContext
    ) {
        // Start tracing
        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.startTracing',
                async () => {
                    const session = vscode.debug.activeDebugSession;

                    if (!session) {
                        vscode.window.showErrorMessage('No active debug session');
                        return;
                    }

                    try {
                        const response = await session.customRequest('startTracing');
                        if (response?.success) {
                            await vscode.commands.executeCommand(
                                'setContext',
                                'brightscript.tracingActive',
                                true
                            );
                        } else {
                            vscode.window.showErrorMessage(
                                response?.error ?? 'Failed to start tracing'
                            );
                        }
                    } catch (e) {
                        vscode.window.showErrorMessage('Failed to start tracing');
                    }
                }
            )
        );

        // Stop tracing
        context.subscriptions.push(
            vscode.commands.registerCommand(
                'extension.brightscript.stopTracing',
                async () => {
                    const session = vscode.debug.activeDebugSession;

                    if (!session) {
                        vscode.window.showErrorMessage('No active debug session');
                        return;
                    }

                    try {
                        const response = await session.customRequest('stopTracing');

                        if (response?.success) {
                            await vscode.commands.executeCommand(
                                'setContext',
                                'brightscript.tracingActive',
                                false
                            );

                            this.openInBrowser('https://ui.perfetto.dev/#!');
                        } else {
                            vscode.window.showErrorMessage(
                                response?.error ?? 'Failed to stop tracing'
                            );
                        }
                    } catch (e) {
                        vscode.window.showErrorMessage('Failed to stop tracing');
                    }
                }
            )
        );

        // Listen for profiling status events from the debug adapter
        context.subscriptions.push(
            vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => {
                if (event.event === 'tracingStatus') {
                    const active = event.body?.active === true;

                    vscode.commands.executeCommand(
                        'setContext',
                        'brightscript.tracingActive',
                        active
                    );
                }
            })
        );
    }

    private openInBrowser(weblink: string): void {
        vscode.env.openExternal(vscode.Uri.parse(weblink));
    }
}

export const perfettoControlCommands = new PerfettoControlCommands();
