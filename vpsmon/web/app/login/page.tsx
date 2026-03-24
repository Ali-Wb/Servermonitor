import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter an API key to access VPS Monitor.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <input className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2" name="apiKey" placeholder="API key" type="password" />
            <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white" type="submit">Verify key</button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
