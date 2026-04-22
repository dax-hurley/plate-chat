import Link from "next/link";

import { auth } from "@/auth";
import { BrandMark } from "@/components/app/brand-mark";
import { AppHeaderProfileMenu } from "@/components/app/app-header-profile-menu";
import { AppHeaderThemeMenu } from "@/components/theme-appearance";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:border-l-0">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-5 md:max-w-none md:justify-end md:px-12">
        <Link
          href="/app"
          className="flex min-w-0 items-center gap-2.5 md:hidden"
        >
          <BrandMark className="size-8 shrink-0 [&_svg]:size-[1.15rem]" />
          <span className="text-lg font-semibold tracking-tight">Trainlog</span>
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <AppHeaderThemeMenu />
          <AppHeaderProfileMenu
            email={session?.user?.email}
            name={session?.user?.name}
          />
        </div>
      </div>
    </header>
  );
}
