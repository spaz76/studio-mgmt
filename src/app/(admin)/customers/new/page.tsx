import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomerAction } from "@/actions/customers";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = { title: "לקוח חדש" };

export default function NewCustomerPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground">לקוחות</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">לקוח חדש</span>
      </div>

      <h1 className="text-2xl font-bold">הוסף לקוח חדש</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי הלקוח</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCustomerAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">שם מלא *</Label>
              <Input id="name" name="name" required placeholder="ישראל ישראלי" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" name="phone" type="tel" placeholder="050-0000000" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" dir="ltr" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="preferredContactMethod">דרך תקשורת מועדפת</Label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">לא צוין</option>
                <option value="phone">טלפון</option>
                <option value="whatsapp">וואטסאפ</option>
                <option value="sms">SMS</option>
                <option value="email">מייל</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
              <Input id="tags" name="tags" placeholder="VIP, חוזר, חד-פעמי" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" name="notes" placeholder="הערות פנימיות על הלקוח..." rows={3} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 sm:flex-none">שמור לקוח</Button>
              <Link href="/customers" className={buttonVariants({ variant: "outline" })}>ביטול</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
