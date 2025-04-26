import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 mx-auto p-6 max-w-2xl"
    >
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
      </div>

      <Separator />

      {/* Account Section */}
      <div className="space-y-4">
        <h2 className="font-medium text-lg">Account</h2>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>

        <Button className="mt-2">Update Account</Button>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-4">
        <h2 className="font-medium text-red-500 text-lg">Danger Zone</h2>
        <p className="text-muted-foreground text-sm">Deleting your account is permanent and cannot be undone.</p>
        <Button variant="destructive" className="flex items-center gap-2">
          <Trash2 size={16} />
          Delete Account
        </Button>
      </div>
    </motion.div>
  );
}
