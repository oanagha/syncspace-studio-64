import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, type ButtonProps } from "@/components/ui/button";

type PlanCtaProps = {
  name: string;
  price: number;
  cta: string;
  variant?: ButtonProps["variant"];
  className?: string;
};

export function PlanCta({ name, price, cta, variant = "outline", className }: PlanCtaProps) {
  const [comingSoon, setComingSoon] = useState(false);

  if (price === 0) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link to="/signup">{cta}</Link>
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {comingSoon ? (
        <Alert
          role="alert"
          className="border-warning/50 bg-warning/15 text-foreground [&>svg]:text-warning"
        >
          <TriangleAlert />
          <AlertTitle>Coming soon</AlertTitle>
          <AlertDescription>
            {name} billing isn’t available yet. Start free for now, or check back shortly.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setComingSoon(true)}
      >
        {cta}
      </Button>
    </div>
  );
}
