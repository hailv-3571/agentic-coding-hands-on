type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className?: string;
};

/** Profile photo, or the first letter of the name when there is none. */
export function UserAvatar({ name, avatarUrl, className = "" }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      // Avatars come from the identity provider's CDN (arbitrary host), so next/image's
      // remotePatterns allowlist does not fit; a plain <img> is the intended choice here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={`size-full object-cover ${className}`}
      />
    );
  }
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span aria-hidden className={`flex size-full items-center justify-center text-title-medium font-bold ${className}`}>
      {initial}
    </span>
  );
}
