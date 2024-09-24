export interface PackageDependencies {
  dev?: string[];
  base: string[];
}

export const BaseDependencies = {
  dev: [
    'prettier-plugin-tailwindcss',
    'prettier',
    'eslint-plugin-check-file',
    'eslint-config-prettier',
    'eslint-config-next',
    '@trivago/prettier-plugin-sort-imports',
    '@next/eslint-plugin-next',
    '@total-typescript/ts-reset',
    '@tailwindcss/typography',
  ],
  base: [
    '@hookform/resolvers',
    'zod',
    '@mantine/hooks',
    'lucide-react',
    'next-safe-action',
    'next-sitemap',
    'next-themes',
    'react-hook-form',
    'sonner',
  ],
} satisfies PackageDependencies;

export const MailDependencies = {
  base: [
    'resend',
    '@react-email/components',
    '@react-email/render',
    '@react-email/tailwind',
  ],
} satisfies PackageDependencies;

export const I18nDependencies = {
  base: ['next-international'],
} satisfies PackageDependencies;

export const MdxDependencies = {
  base: ['@mdx-js/loader', '@mdx-js/react', '@next/mdx', 'gray-matter'],
} satisfies PackageDependencies;

export const DateDependencies = {
  moment: { base: ['moment'] },
  'date-fns': { base: ['date-fns'] },
} satisfies { [key: string]: PackageDependencies };

export const DatabaseDependencies = {
  Prisma: { base: ['prisma'] },
  Drizzle: {
    base: ['drizzle-orm', 'pg'],
    dev: ['drizzle-kit'],
  },
} satisfies { [key: string]: PackageDependencies };
