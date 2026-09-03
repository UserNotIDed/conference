export function Passcode({ next, bad }: { next: string; bad?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-8">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        Booth screens
      </h1>
      <p className="mt-2 text-[14px] font-medium text-ink-sub">
        These hold lead data, so they want the passcode from the run sheet.
      </p>
      <form action="/api/unlock" method="post" className="mt-6">
        <input type="hidden" name="next" value={next} />
        <input
          name="passcode"
          type="password"
          autoFocus
          autoComplete="off"
          placeholder="Passcode"
          className="h-[52px] w-full rounded-[14px] border border-hairline bg-white px-[14px] text-[16px] font-medium text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        {bad ? (
          <p className="mt-2 text-[13px] font-semibold text-red">
            That&apos;s not it. Try again.
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-4 min-h-[54px] w-full rounded-[16px] bg-blue text-[15px] font-bold text-white"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}
