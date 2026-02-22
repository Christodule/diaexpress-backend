import { BadgeEuro, Box, Building2, Flag, Home, Layers, MapPin, PackageSearch, Route, Users, CreditCard, Radar, Activity } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavGroup = {
  label: string;
  links: NavLink[];
  devOnly?: boolean;
};

export const navGroups: NavGroup[] = [
  {
    label: 'Ops',
    links: [
      { href: '/admin', label: 'Dashboard', icon: Home },
      { href: '/admin/quotes', label: 'Devis', icon: Layers },
      { href: '/admin/shipments', label: 'Shipments', icon: Route },
      { href: '/admin/expeditions', label: 'Expéditions', icon: PackageSearch },
      { href: '/admin/tracking', label: 'Tracking', icon: Radar },
    ]
  },
  {
    label: 'Finance',
    links: [
      { href: '/admin/pricing', label: 'Pricing', icon: BadgeEuro },
      { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
    ],
  },
  {
    label: 'Référentiels',
    links: [
      { href: '/admin/market-points', label: 'Market Points', icon: Building2 },
      { href: '/admin/countries', label: 'Countries', icon: Flag },
      { href: '/admin/addresses', label: 'Adresses', icon: MapPin },
      { href: '/admin/package-types', label: 'Types de colis', icon: Box },
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    ],
  },
  {
    label: 'Debug',
    devOnly: true,
    links: [{ href: '/admin/api-health', label: 'API Health', icon: Activity, badge: 'DEV' }],
  },
];
