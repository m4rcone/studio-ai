import { getSiteConfig } from "@/lib/content";
import { LoginForm } from "@/components/studio/LoginForm";

export default async function LoginPage() {
  const config = await getSiteConfig();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="text-center">
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">
              {config.brand.name}
            </p>
            <h1 className="font-heading text-foreground text-2xl">Studio AI</h1>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-background border-muted rounded-(--radius) border p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
