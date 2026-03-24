import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-3xl animate-[fadeInUp_0.4s_ease-out]">
        <CardHeader>
          <Badge>VPS Health Dashboard</Badge>
          <CardTitle className="mt-4">VPS Monitor</CardTitle>
          <CardDescription>
            The web frontend scaffold now includes the requested provider stack,
            Tailwind v4 theme tokens, and owned UI primitives under
            <code className="ml-1 font-mono">components/ui</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
              <span>Scaffold completion</span>
              <span>100%</span>
            </div>
            <Progress value={100} />
          </div>
          <Separator />
          <div className="flex flex-wrap gap-3">
            <Button>Open dashboard</Button>
            <Button variant="secondary">Configure providers</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
