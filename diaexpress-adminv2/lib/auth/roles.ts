export type ClerkSessionClaims = Record<string, unknown> | null | undefined;

function collectRoleValues(value: unknown, roles: string[]) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectRoleValues(entry, roles));
    return;
  }

  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((entry) => collectRoleValues(entry, roles));
    return;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const normalised = String(value).trim().toLowerCase();
    if (normalised) {
      roles.push(normalised);
    }
  }
}

function collectRolesFromObject(source: Record<string, unknown>, roles: string[]) {
  Object.entries(source).forEach(([key, value]) => {
    if (key.toLowerCase().includes('role')) {
      collectRoleValues(value, roles);
      return;
    }

    if (value && typeof value === 'object') {
      collectRolesFromObject(value as Record<string, unknown>, roles);
    }
  });
}

export function getRolesFromClaims(claims: ClerkSessionClaims): string[] {
  if (!claims || typeof claims !== 'object') {
    return [];
  }

  const roles: string[] = [];
  collectRolesFromObject(claims as Record<string, unknown>, roles);

  return Array.from(new Set(roles.filter(Boolean)));
}

export function hasAdminRole(claims: ClerkSessionClaims): boolean {
  const roles = getRolesFromClaims(claims);
  return roles.includes('admin');
}
