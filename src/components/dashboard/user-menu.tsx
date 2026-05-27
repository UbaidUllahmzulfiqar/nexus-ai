'use client';

import { signOut } from 'next-auth/react';

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function UserMenu({ name, email, image }: UserMenuProps) {
  const displayName = name?.trim() || email || 'Account';
  const initials = (displayName || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <details className="user-menu">
      <summary className="user-menu-trigger">
        <span className="user-avatar" aria-hidden="true">
          {image ? <img alt="" className="user-avatar-image" src={image} /> : initials}
        </span>
        <span className="user-menu-copy">
          <strong>{displayName}</strong>
          <span>{email ?? 'Signed in'}</span>
        </span>
      </summary>

      <div className="user-menu-panel">
        <div className="user-menu-meta">
          <strong>{displayName}</strong>
          <span>{email ?? 'Session active'}</span>
        </div>
        <button
          className="menu-action"
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
