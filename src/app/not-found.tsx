import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-white px-6">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        That link has expired.
      </h1>
      <p className="mt-2 text-[14px] font-medium leading-[1.5] text-ink-sub">
        Text the booth number again and you&apos;ll get a fresh one — it takes a
        second, and anything you already filled in is still on file.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[54px] items-center justify-center rounded-[16px] bg-blue px-6 text-[15px] font-bold text-white"
      >
        Back to the booth
      </Link>
    </div>
  );
}
