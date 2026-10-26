"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { btnPrimary, fieldClass, labelClass } from "@/components/ui";

const accounts = [
  ["user", "Nhân viên"],
  ["truong_kd", "Trưởng kinh doanh"],
  ["truong_kt", "Trưởng kỹ thuật"],
  ["ke_toan", "Kế toán"],
  ["lanh_dao", "Ban lãnh đạo"],
  ["nha_thau", "Nhà thầu"],
  ["admin", "Quản trị"],
] as const;

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await loginAction(formData)) ?? null;
    },
    null,
  );

  function pickDemo(account: string) {
    const data = new FormData();
    data.set("username", account);
    data.set("password", "demo123");
    setUsername(account);
    formAction(data);
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className={labelClass}>Tên đăng nhập</span>
        <input
          name="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={fieldClass}
          placeholder="user"
          autoComplete="username"
        />
      </label>
      <label className="block">
        <span className={labelClass}>Mật khẩu</span>
        <input
          name="password"
          type="password"
          required
          className={fieldClass}
          placeholder="demo123"
          autoComplete="current-password"
        />
      </label>
      {state?.error ? (
        <p className="rounded-lg bg-[#f8e8e6] px-3 py-2 text-sm text-[#8a3b32]">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-2.5`}>
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      <div>
        <p className="mb-2 text-xs text-muted">Tài khoản demo, mật khẩu demo123. Bấm để đăng nhập ngay.</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map(([account, role]) => (
            <button
              key={account}
              type="button"
              disabled={pending}
              onClick={() => pickDemo(account)}
              className={
                username === account
                  ? "rounded-full bg-forest px-3 py-1 text-xs text-white"
                  : "rounded-full border border-line bg-cream px-3 py-1 text-xs text-ink hover:border-gold"
              }
            >
              {account}
              <span className={username === account ? "text-white/70" : "text-muted"}> · {role}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
