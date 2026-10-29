import "@/lib/tz-shim";
import { Component, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DeskApp } from "@/components/desk/app";

export const Route = createFileRoute("/")({
  component: Home,
});

class DeskBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string }> {
  state = { failed: false, message: "" };

  static getDerivedStateFromError(err: Error) {
    return { failed: true, message: err?.message ?? "screen error" };
  }

  componentDidCatch() {
    return;
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ background: "#000000", color: "#ffffff" }} className="flex min-h-dvh flex-col items-start justify-center gap-4 bg-bg px-6 text-fg">
        <p className="font-display text-3xl">Aurelius</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted">The screen stalled. The book is still on the desk.</p>
        {this.state.message ? (
          <p className="max-w-sm font-mono text-[11px] leading-relaxed text-subtle">{this.state.message}</p>
        ) : null}
        <button
          type="button"
          className="rounded-sm px-3 py-2 text-sm hairline"
          onClick={() => this.setState({ failed: false, message: "" })}
        >
          Resume
        </button>
      </div>
    );
  }
}

function Home() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, refetchOnReconnect: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <DeskBoundary>
        <DeskApp />
      </DeskBoundary>
    </QueryClientProvider>
  );
}
