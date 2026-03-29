import { z } from 'zod';

const MSG = {
  required: 'Ce champ est obligatoire',
  email: 'Adresse email invalide',
  phone: 'Numéro de téléphone invalide',
  siret: 'Le numéro SIRET doit contenir 14 chiffres',
  lenderBank: 'La banque prêteuse est requise si un prêt bancaire est indiqué',
} as const;

const optionalPhone = z
  .string()
  .refine((v) => !v || /^[\d\s+\-.()]{6,20}$/.test(v), { message: MSG.phone });

const optionalEmail = z
  .string()
  .refine((v) => !v || z.string().email().safeParse(v).success, { message: MSG.email });

// ─── 1. Physical person ──────────────────────────────────────────────────

export const physicalPersonSchema = z.object({
  lastName: z.string().trim().min(1, MSG.required),
  firstName: z.string().trim().min(1, MSG.required),
  birthDate: z.string().optional().default(''),
  birthPlace: z.string().optional().default(''),
  nationality: z.string().optional().default(''),
  fiscalResidence: z.string().optional().default(''),
  phone: optionalPhone.default(''),
  email: optionalEmail.default(''),
  idDocument: z.string().optional().default(''),
  idNumber: z.string().optional().default(''),
  profession: z.string().optional().default(''),
  income: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default(''),
});

export type PhysicalPersonFormData = z.infer<typeof physicalPersonSchema>;

// ─── 2. Legal entity ─────────────────────────────────────────────────────

export const legalEntitySchema = z.object({
  companyName: z.string().trim().min(1, MSG.required),
  legalForm: z.string().optional().default(''),
  siret: z
    .string()
    .refine((v) => !v || /^\d{14}$/.test(v.replace(/\s/g, '')), { message: MSG.siret })
    .default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default(''),
  phone: optionalPhone.default(''),
  email: optionalEmail.default(''),
  activity: z.string().optional().default(''),
  representativeName: z.string().optional().default(''),
  representativePosition: z.string().optional().default(''),
  fiscalResidence: z.string().optional().default(''),
});

export type LegalEntityFormData = z.infer<typeof legalEntitySchema>;

// ─── 3. Fund data ────────────────────────────────────────────────────────

export const fundDataSchema = z
  .object({
    transactionAmount: z.string().min(1, MSG.required),
    paymentMethod: z.string().min(1, MSG.required),
    originDescription: z.string().min(1, MSG.required),
    bankLoan: z.string().optional().default(''),
    lenderBank: z.string().optional().default(''),
    bankDetails: z.string().optional().default(''),
    justificationDocuments: z.string().optional().default(''),
    additionalNotes: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.bankLoan === 'oui' && (!data.lenderBank || data.lenderBank.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MSG.lenderBank,
        path: ['lenderBank'],
      });
    }
  });

export type FundDataFormData = z.infer<typeof fundDataSchema>;

// ─── 4. Document info (signature page) ───────────────────────────────────

export const documentInfoSchema = z.object({
  date: z.string().min(1, MSG.required),
  location: z.string().trim().min(1, MSG.required),
  advisorSignature: z.string().trim().min(1, MSG.required),
  managerSignature: z.string().trim().min(1, MSG.required),
});

export type DocumentInfoFormData = z.infer<typeof documentInfoSchema>;

// ─── 5. Transaction info ─────────────────────────────────────────────────

export const transactionInfoSchema = z.object({
  transactionType: z.enum(['vente', 'location'], { required_error: MSG.required }),
  propertyType: z.enum(
    ['maison', 'appartement', 'garage', 'commerce', 'terrain', 'bureau', 'entrepot', 'autre'],
    { required_error: MSG.required },
  ),
});

export type TransactionInfoFormData = z.infer<typeof transactionInfoSchema>;
