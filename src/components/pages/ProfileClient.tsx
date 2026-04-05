'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/i18n/useTranslation';

export function ProfileClient({
  user,
}: {
  user: { email: string; name: string };
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: t.settings.passwordsDoNotMatch || 'Passwords do not match',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password: newPassword || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({
          type: 'error',
          text: data.error?.message || 'Failed to update profile',
        });
      } else {
        setMessage({
          type: 'success',
          text: t.settings.updatedSuccess || 'Profile updated successfully',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-5 pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.nav.profile || 'Profile'}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Update your personal information and password
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-8">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 shadow-sm'
                  : 'bg-red-50 text-red-800 border border-red-200/60 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50 shadow-sm'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Shield className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.settings.email || 'Email'}
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-4 w-4 text-zinc-400" />
                    </div>
                    <Input
                      className="pl-10 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                      value={user.email}
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Your email address cannot be changed.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.settings.name || 'Name'}
                  </label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <Input
                      className="pl-10 font-medium transition-all focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <KeyRound className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Security
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.settings.newPassword || 'New Password'}
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 mt-1">
                    {t.settings.leaveBlank ||
                      'Leave blank to keep current password'}
                  </p>
                  <Input
                    type="password"
                    className="transition-all focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div
                  className={`transition-opacity duration-200 ${newPassword.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
                >
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t.settings.confirmPassword || 'Confirm Password'}
                  </label>
                  <p className="text-xs text-transparent mb-2 mt-1 select-none">
                    Spacer
                  </p>
                  <Input
                    type="password"
                    className={`transition-all ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-500 dark:border-red-800' : 'focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100'}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={newPassword.length > 0}
                    placeholder="••••••••"
                  />
                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                        {t.settings.passwordsDoNotMatch ||
                          'Passwords do not match'}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="submit"
                disabled={
                  loading ||
                  (newPassword.length > 0 && newPassword !== confirmPassword)
                }
                className="min-w-[140px] shadow-sm"
              >
                {loading ? t.common.saving : t.common.saveChanges}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
