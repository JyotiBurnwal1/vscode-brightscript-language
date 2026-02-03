import * as vscode from 'vscode';
import type { BrightScriptLaunchConfiguration } from './DebugConfigurationProvider';

export class PerfettoControlCommands {

    public registerPerfettoControlCommands(
        context: vscode.ExtensionContext
    ) {
        // Auto-start tracing when debug session starts (if configured)
        context.subscriptions.push(
            vscode.debug.onDidStartDebugSession(async (session) => {
                if (session.type === 'brightscript') {
                    const config = session.configuration as BrightScriptLaunchConfiguration;
                    if (config.profiling?.perfettoEvent?.connectOnStart) {
                        try {
                            await session.customRequest('autoStartTracing');
                            await vscode.commands.executeCommand(
                                'setContext',
                                'brightscript.tracingActive',
                                true
                            );
                        } catch (e) {
                            console.error('Failed to auto-start tracing:', e);
                        }
                    }
                }
            })
        );

        // Auto-stop tracing when debug session ends
        context.subscriptions.push(
            vscode.debug.onDidTerminateDebugSession(async (session) => {
                if (session.type === 'brightscript') {
                    try {
                        // Try to stop tracing - this will save the trace file
                        await session.customRequest('stopTracing');
                    } catch (e) {
                        // Session may already be terminated, ignore errors
                        console.log('Could not stop tracing on session end:', e);
                    }
                    // Reset the tracing context
                    await vscode.commands.executeCommand(
                        'setContext',
                        'brightscript.tracingActive',
                        false
                    );
                }
            })
        );

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
                        await session.customRequest('startTracing');
                        // const response = await session.customRequest('startTracing');
                        // if (response?.success) {
                            await vscode.commands.executeCommand(
                                'setContext',
                                'brightscript.tracingActive',
                                true
                            );
                        // } else {
                        //     vscode.window.showErrorMessage(
                        //         response?.error ?? 'Failed to start tracing'
                        //     );
                        // }
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
                        await session.customRequest('stopTracing');
                        // const response = await session.customRequest('stopTracing');

                        // if (response?.success) {
                                await vscode.commands.executeCommand(
                                        'setContext',
                                        'brightscript.tracingActive',
                                        false
                                    );

                            this.openInSimpleBrowser('https://ui.perfetto.dev/#!');
                        // } else {
                        //     vscode.window.showErrorMessage(
                        //         response?.error ?? 'Failed to stop tracing'
                        //     );
                        // }
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

    /**
     * Open URL in VS Code's built-in Simple Browser (new tab inside VS Code)
     */
    private openInSimpleBrowser(url: string): void {
        vscode.commands.executeCommand('simpleBrowser.show', url);
    }
}

export const perfettoControlCommands = new PerfettoControlCommands();
