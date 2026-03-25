import { KilnForm } from "../KilnForm";

export const metadata = { title: "תנור חדש" };

export default function NewKilnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">תנור חדש</h1>
        <p className="text-sm text-muted-foreground mt-1">הוסף תנור לסטודיו</p>
      </div>
      <KilnForm />
    </div>
  );
}
