'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FlaskConical, Pill, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/tests', label: 'Tests', Icon: FlaskConical },
  { href: '/supplements', label: 'Supplements', Icon: Pill },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function Dock(): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="dock dock-md fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} className={isActive ? 'dock-active text-primary' : 'text-base-content/70'}>
            <Icon size={20} />
            <span className="dock-label">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
