export type NavLink = {
  label: string;
  href: string;
  desktopClassName?: string;
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Education", href: "/#education" },
  { label: "Experience", href: "/#experience" },
  { label: "Services", href: "/#services" },
  { label: "What I Offer", href: "/#offers" },
  { label: "Projects", href: "/#projects" },
  { label: "Certificates", href: "/#certificates" },
  { label: "Testimonials", href: "/#testimonials", desktopClassName: "hidden xl:block" },
  { label: "Contact", href: "/#contact" },
];
