"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ContactForm({ dictionary }: { dictionary: Dictionary }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = data.get("name")?.toString() ?? "";
        setTimeout(() => {
          toast({
            title: dictionary.contact.form.success,
            description: name ? `Palmanhac • ${name}` : undefined,
            variant: "success",
          });
          form.reset();
          setSubmitting(false);
        }, 400);
      }}
    >
      <div>
        <Label htmlFor="name" requiredIndicator>
          {dictionary.contact.form.name}
        </Label>
        <Input id="name" name="name" required placeholder="Maria Silva" />
      </div>
      <div>
        <Label htmlFor="email" requiredIndicator>
          {dictionary.contact.form.email}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="palmanhac@example.com"
        />
      </div>
      <div>
        <Label htmlFor="message" requiredIndicator>
          {dictionary.contact.form.message}
        </Label>
        <Textarea id="message" name="message" required placeholder="" rows={5} />
      </div>
      <Button type="submit" size="lg" disabled={submitting}>
        {dictionary.contact.form.submit}
      </Button>
    </form>
  );
}
